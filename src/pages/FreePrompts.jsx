import { useState, useEffect } from "react";
import LeadCaptureForm from "../components/LeadCaptureForm";

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

const C = {
  navy: "#1B2B4B",
  teal: "#2A9D8F",
  ivory: "#FAF7F2",
  rose: "#E89B7E",
  gold: "#D4A574",
  muted: "#4A5568",
  white: "#FFFFFF",
  border: "rgba(15,31,61,0.12)",
};

const F = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
};

const PILLARS = [
  { title: "Course Design", desc: "The architecture of learning — how thoughtfully your course is built.", accent: C.navy },
  { title: "Inclusive Teaching", desc: "How well your course supports all learners.", accent: C.teal },
  { title: "Assessment", desc: "How thoughtfully you measure what students are learning.", accent: C.gold },
  { title: "Wellness", desc: "How you support the whole student — and yourself.", accent: C.rose },
];

const SAMPLE_BODY = `I'm designing a course called [COURSE NAME], a [LEVEL] course in [DISCIPLINE]. The course covers [LIST 3-5 MAJOR TOPICS]. Write 5-7 measurable learning outcomes — spread deliberately across Bloom's taxonomy. For each: start with a measurable action verb, keep it to one sentence, and label which Bloom's level it targets…`;

export default function FreePrompts() {
  const ww = useWindowWidth();
  const mob = ww < 768;
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div style={{ fontFamily: F.body, color: C.navy, minHeight: "100vh", margin: 0 }}>

      {/* ═══ BAND 1 — Navy header ═══ */}
      <section style={{ background: C.navy, padding: "26px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 30, marginBottom: 6 }}>
          <span style={{ color: C.white }}>Klas</span>
          <span style={{ color: C.teal }}>UP</span>
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 17 }}>
          <span style={{ color: C.teal }}>Teach smarter.</span>
          <span style={{ color: C.white }}> Not harder.</span>
        </div>
      </section>

      {/* ═══ BAND 2 — Hero + Form ═══ */}
      <section style={{ background: C.ivory, padding: mob ? "40px 20px 48px" : "40px 32px 48px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          {/* Pill badge */}
          <div style={{
            display: "inline-block", background: C.teal, color: C.white,
            fontFamily: F.body, fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
            textTransform: "uppercase", borderRadius: 20, padding: "5px 16px", marginBottom: 20,
          }}>
            Free download
          </div>

          <h1 style={{
            fontFamily: F.display, fontWeight: 800, fontSize: mob ? 34 : 46,
            color: C.navy, lineHeight: 1.08, letterSpacing: "-0.02em",
            margin: "0 0 16px",
          }}>
            13 free AI prompts for faculty
          </h1>

          <p style={{
            fontFamily: F.body, fontSize: mob ? 15 : 17, color: C.muted,
            lineHeight: 1.6, margin: "0 auto 32px", maxWidth: 460,
          }}>
            Ready-to-use prompts for the work that surrounds great teaching — grounded
            in learning science. Most work in any AI tool you already use.
          </p>

          {/* Form card */}
          <div style={{
            maxWidth: 420, margin: "0 auto",
            background: C.white, borderRadius: 14, padding: mob ? "24px 20px" : "28px 28px",
            border: `1px solid ${C.border}`,
            boxShadow: "0 4px 24px rgba(27,43,75,0.06)",
          }}>
            <LeadCaptureForm headline="" subhead="" />
          </div>
        </div>
      </section>

      {/* ═══ BAND 3 — What's inside ═══ */}
      <section style={{ background: C.white, padding: mob ? "44px 20px" : "44px 32px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {/* Eyebrow */}
          <div style={{
            fontFamily: F.body, fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
            color: C.teal, textTransform: "uppercase", textAlign: "center", marginBottom: 8,
          }}>
            What's inside
          </div>

          <h2 style={{
            fontFamily: F.display, fontWeight: 700, fontSize: mob ? 22 : 28,
            color: C.navy, textAlign: "center", margin: "0 0 28px", lineHeight: 1.2,
          }}>
            Organized around four pillars
          </h2>

          {/* Pillar cards */}
          <div style={{
            display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr",
            gap: 14, marginBottom: 32,
          }}>
            {PILLARS.map(p => (
              <div key={p.title} style={{
                background: C.white, borderRadius: 10,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${p.accent}`,
                padding: "18px 20px",
              }}>
                <div style={{
                  fontFamily: F.display, fontWeight: 700, fontSize: 17,
                  color: C.navy, marginBottom: 5,
                }}>{p.title}</div>
                <div style={{
                  fontFamily: F.body, fontSize: 13.5, color: C.muted, lineHeight: 1.5,
                }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Helper line */}
          <div style={{
            fontFamily: F.body, fontSize: 14, color: C.muted,
            textAlign: "center", marginBottom: 20,
          }}>
            A peek at one of them ↓
          </div>

          {/* Sample prompt box */}
          <div style={{
            background: C.ivory, borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: mob ? "22px 18px" : "22px 24px",
          }}>
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14,
            }}>
              <span style={{
                fontFamily: F.display, fontWeight: 700, fontSize: 16, color: C.navy,
              }}>1. Learning Outcomes Builder</span>
              <span style={{
                fontFamily: F.body, fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                textTransform: "uppercase", background: "#E1F5EE", color: "#0F6E56",
                borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
              }}>Paste into ChatGPT or Claude</span>
            </div>
            <div style={{
              fontFamily: F.body, fontSize: 13.5, color: C.navy, lineHeight: 1.7,
            }}>
              {SAMPLE_BODY}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BAND 4 — Soft pitch ═══ */}
      <section style={{ background: C.navy, padding: mob ? "46px 20px" : "46px 32px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: F.display, fontWeight: 700, fontSize: mob ? 22 : 27,
            color: C.white, lineHeight: 1.2, margin: "0 0 16px",
          }}>
            Want these built into your actual courses — automatically?
          </h2>

          <p style={{
            fontFamily: F.body, fontSize: mob ? 14 : 15.5, color: "#b8c2d4",
            lineHeight: 1.6, margin: "0 auto 32px", maxWidth: 460,
          }}>
            KlasUp turns your real teaching materials into evidence-based feedback,
            ready-to-use assignments and slides, and growth scores grounded in learning science.
            Klas, your AI teaching coach, is built right in.
          </p>

          <a
            href="/"
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              display: "inline-block", fontFamily: F.body, fontWeight: 700,
              fontSize: 16, padding: "14px 32px", borderRadius: 10,
              background: C.teal, color: C.white, textDecoration: "none",
              transform: btnHovered ? "translateY(-2px)" : "translateY(0)",
              boxShadow: btnHovered ? "0 6px 20px rgba(42,157,143,0.4)" : "none",
              transition: "all 0.25s ease",
            }}
          >
            Start free at KlasUp →
          </a>

          <p style={{
            fontFamily: F.body, fontSize: 13, color: "#7a8599",
            margin: "40px 0 0",
          }}>
            Leila Samii, PhD · Founder, KlasUp
          </p>
        </div>
      </section>
    </div>
  );
}
