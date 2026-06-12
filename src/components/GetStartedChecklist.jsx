import { useState } from "react";

const C = {
  navy: "#1B2B4B",
  teal: "#2A9D8F",
  tealBright: "#0FB5B5",
  white: "#FFFFFF",
  muted: "#4A5568",
  border: "rgba(15,31,61,0.12)",
};

const F = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
  accent: "'Manrope', sans-serif",
};

const STORAGE_KEY = "klasup_checklist";

const ITEMS = [
  { key: "syllabus", label: "Import your syllabus" },
  { key: "klas", label: "Meet Klas" },
  { key: "architect", label: "Explore Course Architect" },
  { key: "resources", label: "Browse Pedagogical Resources" },
  { key: "profile", label: "Complete your profile" },
];

function readChecklist() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function writeChecklist(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export default function GetStartedChecklist({ onNavigate }) {
  const [done, setDone] = useState(readChecklist);

  const allDone = ITEMS.every(item => done[item.key]);

  const handleClick = (item) => {
    const next = { ...done, [item.key]: true };
    writeChecklist(next);
    setDone(next);
    if (onNavigate) onNavigate(item.key);
  };

  if (allDone) return null;

  const doneCount = ITEMS.filter(item => done[item.key]).length;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
        Get started
      </div>
      <div style={{
        background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 16,
        padding: "12px 14px",
      }}>
        {/* Subtitle */}
        <div style={{ fontFamily: F.body, fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 10 }}>
          A few first steps to make KlasUp yours.
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 10 }}>
          <div style={{
            height: "100%", background: C.tealBright, borderRadius: 2,
            width: `${(doneCount / ITEMS.length) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {ITEMS.map((item, i) => {
            const checked = !!done[item.key];
            return (
              <button
                key={item.key}
                onClick={() => handleClick(item)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  background: "none", border: "none", textAlign: "left",
                  padding: "7px 4px", cursor: "pointer",
                  borderTop: i > 0 ? `0.5px solid ${C.border}` : "none",
                  opacity: checked ? 0.5 : 1,
                  transition: "background 0.15s, opacity 0.3s",
                }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "rgba(15,31,61,0.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: checked ? "none" : `1.5px solid ${C.border}`,
                  background: checked ? C.teal : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s, border 0.2s",
                }}>
                  {checked && (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7.5L5.5 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <div style={{
                  fontFamily: F.accent, fontSize: 12, fontWeight: 600, color: C.navy,
                  textDecoration: checked ? "line-through" : "none",
                  flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.label}
                </div>

                {/* Arrow */}
                {!checked && (
                  <div style={{ fontSize: 12, color: C.teal, flexShrink: 0 }}>→</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
