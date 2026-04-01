import { useState, useEffect } from "react";
import Logo from "./Logo";
import { supabase } from "./supabase";

const C = {
  navy: "#0F1F3D", navyMid: "#1A3260", navyLight: "#243D75",
  teal: "#0B8A8A", tealBright: "#0FB5B5", tealLight: "#D6F5F5", tealMid: "#7FE0E0",
  ivory: "#FAF8F4", ivoryDark: "#F0EDE6",
  rose: "#C4687A", roseLight: "#FBEAF0",
  sage: "#5A8A62", sageLight: "#E6F4E8",
  gold: "#B8860B", goldLight: "#FFF8E7",
  purple: "#6B4E9B", purpleLight: "#F0EBF8",
  text: "#0F1F3D", muted: "#4A5568",
  white: "#FFFFFF", border: "rgba(15,31,61,0.12)",
};

const F = {
  display: "'Fredoka One', cursive",
  body: "'Nunito', sans-serif",
  accent: "'Nunito', sans-serif",
};

const DIMENSIONS = [
  "Active Learning", "Pedagogy", "Experiential Learning", "Kagan Structures",
  "Problem-Based Learning", "Project-Based Learning", "Teamwork & Group Projects",
  "Andragogy", "Action Research", "Universal Design for Learning",
  "Socratic Seminar", "Flipped Classroom", "Metacognition", "Feedback Quality",
  "Student Wellbeing", "Faculty Development", "Bloom's Taxonomy", "Case Studies",
  "Reflective Practice", "Community of Inquiry", "Trauma-Informed Teaching",
];

const DIM_COLORS = {
  "Active Learning": C.tealBright,
  "Pedagogy": C.navy,
  "Experiential Learning": C.sage,
  "Kagan Structures": C.purple,
  "Problem-Based Learning": C.rose,
  "Project-Based Learning": C.gold,
  "Teamwork & Group Projects": C.teal,
  "Andragogy": C.navyMid,
  "Action Research": C.sage,
  "Universal Design for Learning": C.tealBright,
  "Socratic Seminar": C.purple,
  "Flipped Classroom": C.rose,
  "Metacognition": C.navyLight,
  "Feedback Quality": C.teal,
  "Student Wellbeing": C.sage,
  "Faculty Development": C.gold,
  "Bloom's Taxonomy": C.rose,
  "Case Studies": C.navy,
  "Reflective Practice": C.purple,
  "Community of Inquiry": C.tealBright,
  "Trauma-Informed Teaching": C.sage,
};

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const PER_PAGE = 20;

export default function ResearchLibrary({ onBack, onSignUp }) {
  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeDim, setActiveDim] = useState(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const ww = useWindowWidth();
  const mob = ww < 768;

  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, [search, activeDim, page]);

  // Fetch total count
  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("research_articles")
        .select("id", { count: "exact", head: true });
      setTotalCount(count || 0);
    })();
  }, []);

  async function fetchArticles() {
    setLoading(true);
    try {
      if (search.trim()) {
        // Use keyword search RPC
        const { data, error } = await supabase.rpc("keyword_search_articles", {
          query_text: search.trim(),
          match_count: 100,
          filter_dimension: activeDim || null,
        });
        if (error) throw error;
        const sliced = (data || []).slice(page * PER_PAGE, (page + 1) * PER_PAGE);
        setArticles(sliced);
      } else {
        // Direct query with filters
        let q = supabase
          .from("research_articles")
          .select("id, title, authors, year, journal, abstract, dimension, search_terms")
          .order("year", { ascending: false })
          .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1);

        if (activeDim) q = q.eq("dimension", activeDim);

        const { data, error } = await q;
        if (error) throw error;
        setArticles(data || []);
      }
    } catch (err) {
      console.error("[ResearchLibrary] Fetch error:", err);
      setArticles([]);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil((search ? articles.length + page * PER_PAGE : totalCount) / PER_PAGE) || 1;

  return (
    <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text }}>

      {/* ── HEADER ── */}
      <header style={{
        background: C.navy, padding: mob ? "20px 16px" : "32px 24px",
        borderBottom: `3px solid ${C.tealBright}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mob ? 16 : 24 }}>
            <div onClick={onBack} style={{ cursor: "pointer" }}>
              <Logo size="sm" dark />
            </div>
            <button onClick={onBack}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", fontFamily: F.accent, fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 8, cursor: "pointer", minHeight: 44 }}>
              Back to KlasUp
            </button>
          </div>
          <div style={{ fontFamily: F.display, fontSize: mob ? 28 : 40, color: C.white, marginBottom: 8 }}>
            Research Library
          </div>
          <div style={{ fontSize: mob ? 14 : 16, color: "rgba(255,255,255,0.6)", marginBottom: 20, maxWidth: 600 }}>
            Peer-reviewed research on teaching and learning — free and open to all.
          </div>
          <div style={{ fontSize: 13, color: C.tealMid, fontFamily: F.accent, fontWeight: 700, marginBottom: 20 }}>
            {totalCount} peer-reviewed articles and growing
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", maxWidth: 600 }}>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by keyword, author, or title..."
              style={{
                width: "100%", padding: "14px 16px 14px 44px", borderRadius: 12,
                border: "none", fontFamily: F.body, fontSize: 15,
                background: "rgba(255,255,255,0.1)", color: C.white,
                boxSizing: "border-box", outline: "none",
              }}
              onFocus={e => e.target.style.background = "rgba(255,255,255,0.15)"}
              onBlur={e => e.target.style.background = "rgba(255,255,255,0.1)"}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "rgba(255,255,255,0.4)" }}>⌕</span>
          </div>
        </div>
      </header>

      {/* ── DIMENSION FILTERS ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "16px 16px 0" : "20px 24px 0" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button
            onClick={() => { setActiveDim(null); setPage(0); }}
            style={{
              fontSize: 12, fontFamily: F.accent, fontWeight: activeDim === null ? 700 : 500,
              padding: "6px 14px", borderRadius: 20,
              border: activeDim === null ? `2px solid ${C.tealBright}` : `1px solid ${C.border}`,
              background: activeDim === null ? C.tealLight : C.white,
              color: activeDim === null ? C.teal : C.muted,
              cursor: "pointer", minHeight: 36,
            }}>
            All
          </button>
          {DIMENSIONS.map(d => (
            <button key={d}
              onClick={() => { setActiveDim(activeDim === d ? null : d); setPage(0); }}
              style={{
                fontSize: 12, fontFamily: F.accent, fontWeight: activeDim === d ? 700 : 500,
                padding: "6px 14px", borderRadius: 20,
                border: activeDim === d ? `2px solid ${DIM_COLORS[d] || C.teal}` : `1px solid ${C.border}`,
                background: activeDim === d ? `${DIM_COLORS[d] || C.teal}18` : C.white,
                color: activeDim === d ? (DIM_COLORS[d] || C.teal) : C.muted,
                cursor: "pointer", minHeight: 36,
              }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* ── ARTICLES ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "0 16px 40px" : "0 24px 60px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: C.muted }}>
            <div style={{ fontSize: 14 }}>Loading articles...</div>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: C.muted }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>No articles found</div>
            <div style={{ fontSize: 14 }}>Try a different search term or filter.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {articles.map(a => {
              const isExpanded = expanded === a.id;
              const dimColor = DIM_COLORS[a.dimension] || C.teal;
              return (
                <div key={a.id} style={{
                  background: C.white, borderRadius: 16, padding: mob ? "20px 18px" : "24px 28px",
                  boxShadow: "0 2px 12px rgba(15,31,61,0.04)",
                  border: `1px solid ${C.border}`,
                  transition: "box-shadow 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,31,61,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(15,31,61,0.04)"}>

                  {/* Dimension tag */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontFamily: F.accent, fontWeight: 700,
                      padding: "3px 12px", borderRadius: 20,
                      background: `${dimColor}18`, color: dimColor,
                    }}>
                      {a.dimension}
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>{a.year}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontFamily: F.display, fontSize: mob ? 17 : 20, color: C.navy, margin: "0 0 6px", lineHeight: 1.3 }}>
                    {a.title}
                  </h3>

                  {/* Authors + Journal */}
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
                    {a.authors}
                    {a.journal && <span style={{ color: C.teal }}> — {a.journal}</span>}
                  </div>

                  {/* Abstract preview or full */}
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 12 }}>
                    {isExpanded ? a.abstract : (a.abstract || "").substring(0, 200) + ((a.abstract || "").length > 200 ? "..." : "")}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => setExpanded(isExpanded ? null : a.id)}
                      style={{
                        background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
                        padding: "6px 14px", fontSize: 12, fontFamily: F.accent, fontWeight: 700,
                        color: C.navy, cursor: "pointer", minHeight: 36,
                      }}>
                      {isExpanded ? "Show less" : "Read full abstract"}
                    </button>
                    <button onClick={onSignUp}
                      style={{
                        background: C.tealBright, border: "none", borderRadius: 8,
                        padding: "6px 14px", fontSize: 12, fontFamily: F.accent, fontWeight: 700,
                        color: C.white, cursor: "pointer", minHeight: 36,
                      }}>
                      Get recommendations based on this
                    </button>
                  </div>

                  {/* Expanded: search terms */}
                  {isExpanded && a.search_terms?.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, marginBottom: 6 }}>KEYWORDS</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {a.search_terms.map((t, i) => (
                          <span key={i} style={{
                            fontSize: 11, padding: "2px 10px", borderRadius: 12,
                            background: C.ivoryDark, color: C.muted,
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {!loading && articles.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 32 }}>
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
              style={{
                background: page === 0 ? C.ivoryDark : C.navy, color: page === 0 ? C.muted : C.white,
                border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13,
                fontFamily: F.accent, fontWeight: 700, cursor: page === 0 ? "default" : "pointer", minHeight: 40,
              }}>
              Previous
            </button>
            <span style={{ fontSize: 13, color: C.muted, fontFamily: F.accent }}>
              Page {page + 1}
            </span>
            <button disabled={articles.length < PER_PAGE} onClick={() => setPage(p => p + 1)}
              style={{
                background: articles.length < PER_PAGE ? C.ivoryDark : C.navy,
                color: articles.length < PER_PAGE ? C.muted : C.white,
                border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13,
                fontFamily: F.accent, fontWeight: 700,
                cursor: articles.length < PER_PAGE ? "default" : "pointer", minHeight: 40,
              }}>
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        background: C.navy, padding: mob ? "32px 16px" : "48px 24px",
        borderTop: `3px solid ${C.tealBright}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <Logo size="sm" dark />
          </div>
          <p style={{ fontFamily: F.body, fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            KlasUp curates peer-reviewed research on teaching and learning so faculty can ground their practice in evidence.
          </p>
          <button onClick={onSignUp}
            style={{
              background: C.tealBright, color: C.white, border: "none",
              padding: "14px 32px", borderRadius: 10, fontFamily: F.accent,
              fontWeight: 700, fontSize: 15, cursor: "pointer", minHeight: 44,
            }}>
            Get Started Free
          </button>
          <div style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            &copy; {new Date().getFullYear()} KlasUp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
