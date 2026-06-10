/**
 * One-time backfill: populate the `url` column on research_articles.
 *
 * For each row where url IS NULL:
 *   1. Look up the title on CrossRef → if confident DOI match, url = https://doi.org/{DOI}
 *   2. Otherwise, url = Google Scholar search link (fallback)
 *
 * Resumable: re-running processes only remaining url IS NULL rows.
 *
 * Usage:
 *   SUPABASE_URL=https://thbfibtknxivegybhupw.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-key-here \
 *   node scripts/backfill-article-urls.mjs
 */

import { createClient } from "@supabase/supabase-js";

// ── CONFIG ──────────────────────────────────────────────────────
// Change ROW_LIMIT to a large number (e.g. 99999) to process all rows.
const ROW_LIMIT = 99999;

const CROSSREF_DELAY_MS = 100;
const CROSSREF_TIMEOUT_MS = 10_000;
const SIMILARITY_THRESHOLD = 0.85;
const CROSSREF_USER_AGENT = "KlasUp-Backfill/1.0 (mailto:hello@klasup.com)";
// ────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── HTML entity decoding ────────────────────────────────────────

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x00F8;/g, "ø")
    .replace(/&#x00E9;/g, "é")
    .replace(/&#x00F6;/g, "ö")
    .replace(/&#x00FC;/g, "ü")
    .replace(/&#x00E4;/g, "ä")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ── Title similarity (normalized) ───────────────────────────────

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;

  // Longest common subsequence ratio
  const m = na.length;
  const n = nb.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = na[i - 1] === nb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const lcs = dp[m][n];
  return (2 * lcs) / (m + n);
}

// ── CrossRef lookup ─────────────────────────────────────────────

async function queryCrossRef(decodedTitle) {
  const params = new URLSearchParams({ "query.title": decodedTitle, rows: "1" });
  const url = `https://api.crossref.org/works?${params}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CROSSREF_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": CROSSREF_USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const items = data?.message?.items;
    if (!items?.length) return null;

    const item = items[0];
    const returnedTitle = (item.title || [])[0] || "";
    return {
      doi: item.DOI || "",
      title: returnedTitle,
      score: item.score || 0,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log(`\nBackfill article URLs — processing up to ${ROW_LIMIT} rows\n`);

  // Fetch rows needing backfill
  const { data: rows, error } = await supabase
    .from("research_articles")
    .select("id, title")
    .is("url", null)
    .order("created_at", { ascending: true })
    .limit(ROW_LIMIT);

  if (error) {
    console.error("Failed to fetch rows:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No rows with url IS NULL found. Nothing to do.");
    return;
  }

  console.log(`Found ${rows.length} rows to process.\n`);

  let doiMatches = 0;
  let scholarFallbacks = 0;
  let processed = 0;

  for (const row of rows) {
    processed++;
    const decoded = decodeHtmlEntities(row.title);
    const shortTitle = decoded.length > 80 ? decoded.slice(0, 77) + "..." : decoded;

    // Query CrossRef
    const cr = await queryCrossRef(decoded);

    let url;
    let outcome;

    if (cr && cr.doi) {
      const sim = similarity(decoded, cr.title);
      if (sim >= SIMILARITY_THRESHOLD) {
        url = `https://doi.org/${cr.doi}`;
        outcome = `DOI match (score=${cr.score.toFixed(1)}, sim=${sim.toFixed(3)})`;
        doiMatches++;
      } else {
        url = `https://scholar.google.com/scholar?q=${encodeURIComponent(decoded)}`;
        outcome = `Scholar fallback (sim=${sim.toFixed(3)} < ${SIMILARITY_THRESHOLD}, CrossRef title: "${cr.title.slice(0, 60)}")`;
        scholarFallbacks++;
      }
    } else {
      url = `https://scholar.google.com/scholar?q=${encodeURIComponent(decoded)}`;
      outcome = cr ? "Scholar fallback (no DOI in result)" : "Scholar fallback (no result / timeout)";
      scholarFallbacks++;
    }

    // Write url
    const { error: updateErr } = await supabase
      .from("research_articles")
      .update({ url })
      .eq("id", row.id);

    if (updateErr) {
      console.error(`  [${processed}/${rows.length}] ERROR updating ${row.id}: ${updateErr.message}`);
      continue;
    }

    console.log(`  [${processed}/${rows.length}] ${row.id} — ${shortTitle}`);
    console.log(`           ${outcome}`);

    // Courtesy delay
    if (processed < rows.length) {
      await new Promise((r) => setTimeout(r, CROSSREF_DELAY_MS));
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`  Total processed:   ${processed}`);
  console.log(`  DOI matches:       ${doiMatches}`);
  console.log(`  Scholar fallbacks: ${scholarFallbacks}`);
  console.log(`${"═".repeat(60)}\n`);
}

main();
