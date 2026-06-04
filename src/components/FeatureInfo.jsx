import { useState } from "react";
import { sections } from "../guideContent";

const sectionMap = {};
for (const s of sections) sectionMap[s.id] = s;

const C = {
  navy: "#1B2B4B",
  teal: "#2A9D8F",
  tealSoft: "#EAF5F3",
  ivory: "#FAF7F2",
  textSoft: "#5a6a85",
  border: "#e8edf3",
  white: "#fff",
};

const F = {
  heading: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
};

const QUIET_TEAL = "rgba(42,157,143,0.55)";
const HOVER_TEAL = "rgba(42,157,143,0.78)";

export default function FeatureInfo({ sectionId }) {
  const [open, setOpen] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const section = sectionMap[sectionId];
  if (!section) return null;

  return (
    <span style={{ display: "inline-flex", alignSelf: "flex-start", marginTop: 2 }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        aria-label={open ? "Hide feature info" : "What is this page?"}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 16, height: 16, borderRadius: "50%",
          background: open ? HOVER_TEAL : btnHovered ? C.tealSoft : "transparent",
          color: open ? C.white : btnHovered ? HOVER_TEAL : QUIET_TEAL,
          border: `1.5px solid ${open ? HOVER_TEAL : btnHovered ? HOVER_TEAL : QUIET_TEAL}`,
          fontSize: 10, fontWeight: 700, fontFamily: F.body,
          cursor: "pointer", transition: "all 0.15s",
          lineHeight: 1, padding: 0, marginLeft: 8, flexShrink: 0,
        }}
      >i</button>

      {open && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "100%", zIndex: 10,
          marginTop: 8,
          background: C.white, borderRadius: 14,
          border: `1px solid ${C.border}`,
          borderLeft: `4px solid ${C.teal}`,
          padding: "16px 20px",
          boxShadow: "0 8px 24px rgba(27,43,75,0.08)",
          animation: "featureInfoSlide 0.2s ease-out",
        }}>
          <style>{`@keyframes featureInfoSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          {/* What this is */}
          <div style={{ marginBottom: section.howToUse ? 12 : 0 }}>
            <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
              What this is
            </div>
            <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.65, margin: 0 }}>
              {section.whatThisIs}
            </p>
          </div>

          {/* How to use it */}
          {section.howToUse && (
            <div>
              <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                How to use it
              </div>
              <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.65, margin: 0 }}>
                {section.howToUse}
              </p>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
