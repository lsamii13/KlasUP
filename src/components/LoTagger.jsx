import { useState, useEffect, useRef } from "react";

const CA_COLORS = {
  teal: "#2A9D8F",
  tealSoft: "#EAF5F3",
  navy: "#1B2B4B",
  textSoft: "#5a6a85",
  border: "#e8edf3",
};

const CA_FONTS = {
  heading: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
};

export default function LoTagger({ taggableType, taggableId, los, tags, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const myTags = tags.filter(t => t.taggable_type === taggableType && t.taggable_id === taggableId);
  const taggedLoIds = new Set(myTags.map(t => t.learning_outcome_id));

  const loCode = (loId) => {
    const lo = los.find(l => l.id === loId);
    return lo?.code || "??";
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, position: "relative" }} ref={ref}>
      {myTags.map(t => (
        <span key={t.id} style={{
          background: CA_COLORS.tealSoft, color: CA_COLORS.teal,
          fontFamily: CA_FONTS.heading, fontSize: 10, fontWeight: 700,
          padding: "2px 7px", borderRadius: 8, letterSpacing: "0.3px",
        }}>{loCode(t.learning_outcome_id)}</span>
      ))}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none", border: `1px dashed ${CA_COLORS.border}`, borderRadius: 8,
          fontSize: 11, color: CA_COLORS.textSoft, cursor: "pointer", padding: "2px 7px",
          fontFamily: CA_FONTS.body,
        }}
      >+ Tag</button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 50,
          background: "#fff", border: `1px solid ${CA_COLORS.border}`, borderRadius: 10,
          padding: "8px 10px", boxShadow: "0 6px 18px rgba(27,43,75,0.1)", minWidth: 200,
        }}>
          {los.length === 0 && (
            <div style={{ fontSize: 12, color: CA_COLORS.textSoft }}>Add learning outcomes above first.</div>
          )}
          {los.map((lo, i) => {
            const checked = taggedLoIds.has(lo.id);
            return (
              <label key={lo.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 12, color: CA_COLORS.navy, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => checked ? onRemove(lo.id, taggableType, taggableId) : onAdd(lo.id, taggableType, taggableId)}
                  style={{ accentColor: CA_COLORS.teal }}
                />
                <span style={{ fontWeight: 700, color: CA_COLORS.teal, marginRight: 2 }}>{lo.code}</span>
                {lo.label || "(untitled)"}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
