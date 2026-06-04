import { useState, useEffect, useRef } from "react";
import { sections, glossary } from "../guideContent";

const C = {
  navy: "#1B2B4B",
  teal: "#2A9D8F",
  tealSoft: "#EAF5F3",
  ivory: "#FAF7F2",
  ivoryDark: "#F0EDE6",
  textSoft: "#5a6a85",
  border: "#e8edf3",
  white: "#fff",
};

const F = {
  heading: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
};

const sectionMap = {};
for (const s of sections) sectionMap[s.id] = s;
const glossaryMap = {};
for (const g of glossary) glossaryMap[g.id] = g;

function Chip({ label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: hovered ? C.tealSoft : C.white,
        border: `1px solid ${hovered ? C.teal : C.border}`,
        borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 600,
        fontFamily: F.body, color: C.teal, cursor: "pointer",
        transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >{label}</button>
  );
}

export default function GuidePage() {
  const [view, setView] = useState("features"); // "features" | "glossary"
  const [ww, setWw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const scrollRef = useRef(null);

  useEffect(() => {
    const onResize = () => setWw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Handle initial hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      // Determine if it's a glossary term or feature section
      if (glossaryMap[hash]) {
        setView("glossary");
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else if (sectionMap[hash]) {
        setView("features");
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  const mob = ww < 768;

  function navigateTo(targetId, targetView) {
    if (view !== targetView) setView(targetView);
    // Update hash
    window.location.hash = targetId;
    // Scroll after view switch renders
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div ref={scrollRef} style={{ fontFamily: F.body, color: C.navy, background: C.ivory, minHeight: "100vh", padding: mob ? "2rem 1rem" : "3rem 2rem" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: F.heading, fontWeight: 700, fontSize: mob ? 28 : 36, color: C.navy, margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            How KlasUp works
          </h1>
          <p style={{ fontSize: mob ? 14 : 16, color: C.textSoft, margin: 0, lineHeight: 1.6, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Everything KlasUp does, explained in plain language. Browse the features or look up a term.
          </p>
        </div>

        {/* View switcher */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", gap: 4, background: C.white, padding: 5, border: `1.5px solid ${C.border}`, borderRadius: 12 }}>
            {[
              { id: "features", label: "Features" },
              { id: "glossary", label: "Glossary" },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{
                  background: view === v.id ? C.navy : "transparent",
                  color: view === v.id ? C.white : C.textSoft,
                  border: "none", fontFamily: F.body, fontWeight: 700, fontSize: 14,
                  padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                  transition: "all 0.15s",
                }}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* Features view */}
        {view === "features" && (
          <div>
            {sections.map(section => (
              <div key={section.id} id={section.id} style={{
                background: C.white, borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: mob ? "1.25rem" : "1.75rem 2rem",
                marginBottom: "1.25rem",
              }}>
                {/* Title row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 26 }}>{section.emoji}</span>
                  <h2 style={{ fontFamily: F.heading, fontWeight: 700, fontSize: mob ? 20 : 24, color: C.navy, margin: 0, letterSpacing: "-0.01em" }}>
                    {section.title}
                  </h2>
                  {section.comingSoon && (
                    <span style={{
                      background: C.ivoryDark, color: C.textSoft,
                      fontSize: 11, fontWeight: 700, fontFamily: F.body,
                      padding: "3px 10px", borderRadius: 999, letterSpacing: "0.3px",
                    }}>Coming soon</span>
                  )}
                </div>

                {/* What this is */}
                <div style={{ marginBottom: section.howToUse ? 16 : 0 }}>
                  <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 11, color: C.teal, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>
                    What this is
                  </div>
                  <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.7, margin: 0 }}>
                    {section.whatThisIs}
                  </p>
                </div>

                {/* How to use it */}
                {section.howToUse && (
                  <div style={{ marginBottom: section.relatedTerms.length > 0 ? 16 : 0 }}>
                    <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 11, color: C.teal, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>
                      How to use it
                    </div>
                    <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.7, margin: 0 }}>
                      {section.howToUse}
                    </p>
                  </div>
                )}

                {/* Related terms */}
                {section.relatedTerms.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginRight: 4 }}>Related terms:</span>
                    {section.relatedTerms.map(termId => {
                      const g = glossaryMap[termId];
                      if (!g) return null;
                      return <Chip key={termId} label={g.term} onClick={() => navigateTo(termId, "glossary")} />;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Glossary view */}
        {view === "glossary" && (
          <div>
            {glossary.map(entry => (
              <div key={entry.id} id={entry.id} style={{
                background: C.white, borderRadius: 16,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${C.teal}`,
                padding: mob ? "1rem 1.25rem" : "1.25rem 1.75rem",
                marginBottom: "1rem",
              }}>
                <h3 style={{ fontFamily: F.heading, fontWeight: 700, fontSize: mob ? 17 : 19, color: C.navy, margin: "0 0 8px 0" }}>
                  {entry.term}
                </h3>
                <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.7, margin: "0 0 10px 0" }}>
                  {entry.definition}
                </p>
                {entry.livesIn.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginRight: 4 }}>Lives in:</span>
                    {entry.livesIn.map(sectionId => {
                      const s = sectionMap[sectionId];
                      if (!s) return null;
                      return <Chip key={sectionId} label={`${s.emoji} ${s.title}`} onClick={() => navigateTo(sectionId, "features")} />;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
