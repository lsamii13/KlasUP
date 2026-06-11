/**
 * One-time regeneration of micro-learnings for uploads with link-less citations.
 *
 * For each upload that has micro_learnings with research_article_id IS NULL:
 *   1. Call generate-micro-learning Edge Function to get fresh recommendations
 *   2. Resolve research_article_id → article_title + article_url
 *   3. Delete old link-less micro_learnings for that upload
 *   4. Insert new ones with real linked citations
 *
 * Resumable: re-running processes only uploads that still have link-less micro_learnings.
 *
 * Usage:
 *   SUPABASE_URL=https://thbfibtknxivegybhupw.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-key \
 *   SUPABASE_ANON_KEY=your-anon-key \
 *   node scripts/regenerate-microlearnings.mjs
 */

import { createClient } from "@supabase/supabase-js";

// ── CONFIG ──────────────────────────────────────────────────────
// Change ROW_LIMIT to a large number (e.g. 99) to process all uploads.
const ROW_LIMIT = 99;

// Set DRY_RUN to false to actually delete + insert. When true, only logs what would happen.
const DRY_RUN = false;

const DELAY_MS = 100;
const EDGE_FUNCTION_TIMEOUT_MS = 30_000;
// ────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey || !anonKey) {
  console.error("Error: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ── Fetch article by id (replicates frontend fetchArticleById) ──

async function fetchArticleById(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("research_articles")
    .select("id, title, url")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

// ── Call generate-micro-learning Edge Function ──────────────────

async function callEdgeFunction(content, category, course, week) {
  const url = `${supabaseUrl}/functions/v1/generate-micro-learning`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EDGE_FUNCTION_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ type: "micro-learning", content, category, course, week }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`);
      console.error(`    Edge Function error: ${err}`);
      return null;
    }

    const data = await res.json();
    return data.recommendations || null;
  } catch (e) {
    clearTimeout(timeout);
    console.error(`    Edge Function call failed: ${e.message}`);
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log(`\nRegenerate micro-learnings — ROW_LIMIT=${ROW_LIMIT}, DRY_RUN=${DRY_RUN}\n`);

  // 1. Find distinct upload_ids with link-less micro_learnings
  const { data: linklessRows, error: mlErr } = await supabase
    .from("micro_learnings")
    .select("upload_id")
    .is("research_article_id", null);

  if (mlErr) {
    console.error("Failed to query micro_learnings:", mlErr.message);
    process.exit(1);
  }

  const uploadIds = [...new Set((linklessRows || []).map((r) => r.upload_id))].slice(0, ROW_LIMIT);

  if (uploadIds.length === 0) {
    console.log("No uploads with link-less micro_learnings found. Nothing to do.");
    return;
  }

  console.log(`Found ${uploadIds.length} upload(s) to process.\n`);

  // 2. Fetch upload details
  const { data: uploads, error: upErr } = await supabase
    .from("uploads")
    .select("id, user_id, course_id, week, category, content")
    .in("id", uploadIds);

  if (upErr) {
    console.error("Failed to fetch uploads:", upErr.message);
    process.exit(1);
  }

  // 3. Fetch course codes for all course_ids
  const courseIds = [...new Set(uploads.map((u) => u.course_id))];
  const { data: courses, error: cErr } = await supabase
    .from("courses")
    .select("id, course_code")
    .in("id", courseIds);

  if (cErr) {
    console.error("Failed to fetch courses:", cErr.message);
    process.exit(1);
  }

  const courseMap = {};
  for (const c of courses) courseMap[c.id] = c.course_code;

  let totalProcessed = 0;
  let totalDeleted = 0;
  let totalInserted = 0;
  let totalLinked = 0;
  let totalSkipped = 0;

  for (const upload of uploads) {
    totalProcessed++;
    const courseCode = courseMap[upload.course_id] || "Unknown";
    const weekStr = `Week ${upload.week}`;
    const shortContent = upload.content.length > 80 ? upload.content.slice(0, 77) + "..." : upload.content;

    console.log(`  [${totalProcessed}/${uploads.length}] ${upload.id}`);
    console.log(`    category=${upload.category}  course=${courseCode}  ${weekStr}`);
    console.log(`    content: ${shortContent}`);

    // Count existing link-less rows for this upload
    const { data: oldRows, error: countErr } = await supabase
      .from("micro_learnings")
      .select("id")
      .eq("upload_id", upload.id)
      .is("research_article_id", null);

    if (countErr) {
      console.error(`    Failed to count old rows: ${countErr.message}`);
      totalSkipped++;
      continue;
    }

    const oldCount = (oldRows || []).length;
    console.log(`    old link-less rows: ${oldCount}`);

    // Step 1: Generate new recommendations
    console.log(`    calling Edge Function...`);
    const recs = await callEdgeFunction(upload.content, upload.category, courseCode, weekStr);

    if (!recs || !Array.isArray(recs) || recs.length === 0) {
      console.log(`    SKIPPED — no valid recommendations returned`);
      totalSkipped++;
      if (totalProcessed < uploads.length) await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    // Step 2: Resolve research_article_id → title + url
    const enriched = [];
    let linkedCount = 0;
    for (const rec of recs) {
      let articleTitle = null;
      let articleUrl = null;
      if (rec.research_article_id) {
        const article = await fetchArticleById(rec.research_article_id);
        if (article) {
          articleTitle = article.title;
          articleUrl = article.url;
          linkedCount++;
        }
      }
      enriched.push({ ...rec, article_title: articleTitle, article_url: articleUrl });
    }

    console.log(`    new recs: ${enriched.length}, with links: ${linkedCount}`);

    if (DRY_RUN) {
      console.log(`    DRY RUN — would delete ${oldCount} old rows, insert ${enriched.length} new`);
      for (const rec of enriched) {
        const link = rec.article_url ? `→ ${rec.article_url.slice(0, 60)}` : "(no link)";
        console.log(`      ${rec.tag}: "${rec.title}" ${link}`);
      }
    } else {
      // Step 3: Delete old link-less rows
      const { error: delErr } = await supabase
        .from("micro_learnings")
        .delete()
        .eq("upload_id", upload.id)
        .is("research_article_id", null);

      if (delErr) {
        console.error(`    DELETE FAILED: ${delErr.message} — skipping insert to avoid duplicates`);
        totalSkipped++;
        continue;
      }

      console.log(`    deleted ${oldCount} old rows`);
      totalDeleted += oldCount;

      // Step 4: Insert new rows
      let insertedCount = 0;
      for (const rec of enriched) {
        const { error: insErr } = await supabase
          .from("micro_learnings")
          .insert({
            user_id: upload.user_id,
            upload_id: upload.id,
            tag: rec.tag || null,
            title: rec.title || "",
            summary: rec.summary || null,
            article: null,
            action: rec.action || null,
            research_article_id: rec.research_article_id || null,
            article_title: rec.article_title,
            article_url: rec.article_url,
          });

        if (insErr) {
          console.error(`    INSERT FAILED for "${rec.title}": ${insErr.message}`);
        } else {
          insertedCount++;
        }
      }

      console.log(`    inserted ${insertedCount} new rows (${linkedCount} with links)`);
      totalInserted += insertedCount;
      totalLinked += linkedCount;
    }

    // Courtesy delay
    if (totalProcessed < uploads.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`SUMMARY${DRY_RUN ? " (DRY RUN — no changes made)" : ""}`);
  console.log(`  Uploads processed: ${totalProcessed}`);
  console.log(`  Uploads skipped:   ${totalSkipped}`);
  if (!DRY_RUN) {
    console.log(`  Old rows deleted:  ${totalDeleted}`);
    console.log(`  New rows inserted: ${totalInserted}`);
    console.log(`  With real links:   ${totalLinked}`);
  }
  console.log(`${"═".repeat(60)}\n`);
}

main();
