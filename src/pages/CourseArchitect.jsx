import { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { insertCourse, fetchCourseWeeks, fetchAssignments, fetchLoTags, fetchLearningOutcomes, fetchUploads, fetchAssignmentFeedback, addLoTag, removeLoTag, downloadDocument, updateAssignment, supabase } from "../supabase";
import { generateSyllabus } from "../anthropic";
import { exportSyllabusDocx, printSyllabusPdf } from "../syllabusExport";
import LoTagger from "../components/LoTagger";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";

const CA_COLORS = {
  navy: "#1B2B4B",
  teal: "#2A9D8F",
  tealSoft: "#EAF5F3",
  ivory: "#FAF7F2",
  textSoft: "#5a6a85",
  border: "#e8edf3",
};

const CA_FONTS = {
  heading: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
};

const LAUNCHPAD_BASE = [
  {
    id: "setup",
    emoji: "⚙️",
    title: "Course Setup",
    tag: "OUTCOMES, WEEKS & ASSIGNMENTS",
    description: "Add learning outcomes, build your weekly schedule, manage assignments, and import from a syllabus.",
    accent: CA_COLORS.navy,
    cta: "Open Course Setup →",
    navigateTo: "Course Setup",
  },
  {
    id: "pedagogy",
    emoji: "📚",
    title: "Pedagogy Studio",
    tag: "DESIGN ASSIGNMENTS & ACTIVITIES",
    description: "Plain-English assignment builder, scaffolding tools, and pedagogy feedback — all powered by Klas.",
    accent: CA_COLORS.teal,
    cta: "Open Pedagogy Studio →",
    navigateTo: "Pedagogy Studio",
  },
  {
    id: "slides",
    emoji: "📊",
    title: "Slide Studio",
    tag: "DESIGN LECTURES & DECKS",
    description: "Plain-English slide outlines, UDL analysis, active learning flags, and slide exports.",
    accent: "#E89B7E",
    cta: "Open Slide Studio →",
    navigateTo: "Slide Studio",
  },
];

const TYPE_EMOJI = {
  "Discussion Board": "💬", "Paper": "📝", "Project": "📊", "Quiz": "✅",
  "Presentation": "🎤", "Lab": "🧪", "Reflection": "🪞", "Other": "📌",
};

function LaunchpadCard({ card, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onNavigate && onNavigate(card.navigateTo)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${hovered ? card.accent : CA_COLORS.border}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 24px rgba(27, 43, 75, 0.1)" : "none",
      }}
    >
      {/* Gradient header band */}
      <div style={{
        background: "linear-gradient(135deg, #1B2B4B 0%, #2A9D8F 100%)",
        padding: "16px 20px",
      }}>
        <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 21, color: "#FAF7F2", letterSpacing: "-0.01em" }}>
          {card.title}
        </div>
      </div>
      {/* Card body */}
      <div style={{ padding: "1.25rem" }}>
        <div style={{ fontFamily: CA_FONTS.body, fontSize: 11, fontWeight: 700, color: card.accent, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 10 }}>
          {card.tag}
        </div>
        <p style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.textSoft, lineHeight: 1.6, margin: "0 0 0.75rem 0" }}>
          {card.description}
        </p>
        {card.stats && card.stats.length > 0 && (
          <div style={{ display: "flex", gap: "1.5rem", borderTop: "1px solid #f0f0f0", paddingTop: "0.75rem" }}>
            {card.stats.map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: CA_FONTS.heading, fontSize: 19, fontWeight: 700, color: CA_COLORS.navy }}>{s.value}</div>
                <div style={{ fontSize: 12, color: CA_COLORS.textSoft }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 14, color: card.accent, marginTop: "0.75rem" }}>
          {card.cta}
        </div>
      </div>
    </div>
  );
}

function LOTag({ code }) {
  return (
    <span style={{
      background: CA_COLORS.tealSoft, color: CA_COLORS.teal,
      padding: "3px 9px", borderRadius: 10, fontSize: 10, fontWeight: 700,
      fontFamily: CA_FONTS.heading, letterSpacing: "0.3px",
    }}>{code}</span>
  );
}

function EmptyFilterState() {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: CA_COLORS.textSoft, fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: "0.5rem" }}>🔍</div>
      <div>No items match this filter yet.</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing the filter or tagging more items to this outcome.</div>
    </div>
  );
}

function EmptyDataState({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: CA_COLORS.textSoft, fontSize: 14, fontFamily: CA_FONTS.body }}>
      {text}
    </div>
  );
}

// ── SemesterListView (real data) ────────────────────────
function SemesterListView({ weeks, assignments, uploads = [], filter, getLoCodesFor }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const STATUS_ICONS = [
    { key: "lesson", emoji: "📋", label: "Lesson plan" },
    { key: "slides", emoji: "📊", label: "Slides" },
    { key: "assignment", emoji: "📝", label: "Assignment" },
  ];

  if (weeks.length === 0) return <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}><EmptyDataState text="No weeks yet — open Course Setup to add them." /></div>;

  const weekAssignmentIds = new Set(assignments.map(a => a.week_id).filter(Boolean));
  const weekDeckNumbers = new Set(uploads.filter(u => u.category === "Slide Deck" || u.material_type === "slide_deck").map(u => u.week));
  const rows = weeks.map(w => ({
    ...w,
    loCodes: getLoCodesFor("week", w.id),
    status: {
      lesson: !!(w.topic || w.detail),
      slides: weekDeckNumbers.has(w.week_number),
      assignment: weekAssignmentIds.has(w.id),
    },
  }));

  const filtered = filter ? rows.filter(r => r.loCodes.includes(filter)) : rows;
  if (filtered.length === 0) return <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}><EmptyFilterState /></div>;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}` }}>
      <style>{`.ca-icon-tip:hover .ca-icon-tip-label { opacity: 1 !important; }`}</style>
      {filtered.map((row, i) => (
        <div key={row.id} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(-1)}
          style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.1rem 1.5rem", borderBottom: i < filtered.length - 1 ? "1px solid #f5f1ea" : "none", background: hoveredIdx === i ? CA_COLORS.ivory : "#fff", transition: "background 0.15s ease", borderRadius: i === 0 && filtered.length === 1 ? 13 : i === 0 ? "13px 13px 0 0" : i === filtered.length - 1 ? "0 0 13px 13px" : 0 }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 13, color: row.is_milestone ? "#E89B7E" : CA_COLORS.teal, minWidth: 65, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Week {row.week_number}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy, letterSpacing: "-0.01em" }}>
              {row.topic || <span style={{ color: CA_COLORS.textSoft, fontWeight: 400, fontStyle: "italic" }}>Add a topic</span>}
              {row.is_milestone && <span style={{ color: "#D4A574", fontSize: 16, marginLeft: 6 }}>★</span>}
            </div>
            {row.detail && <div style={{ fontFamily: CA_FONTS.body, fontSize: 13, color: CA_COLORS.textSoft }}>{row.detail}</div>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {row.loCodes.map(c => <LOTag key={c} code={c} />)}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {STATUS_ICONS.map(si => {
              const done = row.status[si.key];
              const tipText = done ? si.label : `${si.label} — not yet added`;
              return (
                <div key={si.key} className="ca-icon-tip" style={{
                  position: "relative",
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: done ? 14 : 13, background: done ? CA_COLORS.tealSoft : "#FFF4E6",
                  color: done ? CA_COLORS.teal : "#B8651A", border: done ? "none" : "1.5px dashed #D4A574", fontWeight: 700,
                  cursor: "default",
                }}>
                  {done ? si.emoji : "+"}
                  <span className="ca-icon-tip-label" style={{
                    position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                    background: "#1B2B4B", color: "#FAF7F2", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                    padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap", pointerEvents: "none",
                    opacity: 0, transition: "opacity 0.12s",
                  }}>{tipText}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Feedback tag colors (matches Pedagogy Studio TAG_COLORS) ──
const FEEDBACK_TAG_COLORS = {
  "Active Learning": { color: "#5B8C5A", bg: "#EEF5EE" },
  "Socratic Seminar": { color: "#2A9D8F", bg: "#E8F5F3" },
  "UDL": { color: "#C0526E", bg: "#FAEEF1" },
  "Reflection": { color: "#C0526E", bg: "#FAEEF1" },
  "Flipped Classroom": { color: "#5B8C5A", bg: "#EEF5EE" },
  "Student Voice": { color: "#C5962B", bg: "#FEF8E8" },
  "Assessment Design": { color: "#7C5CBF", bg: "#F3EEFB" },
  "Scaffolding": { color: "#2A9D8F", bg: "#E8F5F3" },
};

// ── Assignment export helpers ────────────────────────────
async function exportAssignmentDocx(item, weekLabel) {
  const children = [];
  children.push(new Paragraph({ children: [new TextRun({ text: item.title || "Untitled Assignment", bold: true, size: 32, color: "1B2B4B", font: "Calibri" })], heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }));
  const metaParts = [item.assignment_type, item.due_date ? `Due: ${item.due_date}` : null, weekLabel].filter(Boolean);
  if (metaParts.length) {
    children.push(new Paragraph({ children: [new TextRun({ text: metaParts.join(" · "), size: 20, color: "5a6a85", italics: true, font: "Calibri" })], spacing: { after: 300 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "2A9D8F" } } }));
  }
  if (item.description) {
    for (const line of item.description.split("\n")) {
      children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22, font: "Calibri" })], spacing: { after: 60 } }));
    }
  } else {
    children.push(new Paragraph({ children: [new TextRun({ text: "No description", italics: true, size: 20, color: "5a6a85", font: "Calibri" })], spacing: { after: 60 } }));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const blob = await Packer.toBlob(doc);
  const safeName = (item.title || "assignment").replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "-").slice(0, 60);
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${safeName}.docx`;
  anchor.click();
}

function exportAssignmentPdf(item, weekLabel) {
  const metaParts = [item.assignment_type, item.due_date ? `Due: ${item.due_date}` : null, weekLabel].filter(Boolean);
  const descHtml = item.description
    ? item.description.split("\n").map(l => `<p style="margin:0 0 6px 0">${l || "&nbsp;"}</p>`).join("")
    : `<p style="color:#5a6a85;font-style:italic">No description</p>`;
  const html = `<html><head><title>${item.title || "Assignment"}</title><style>body{font-family:'Manrope','Segoe UI',sans-serif;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.7;color:#1B2B4B}h1{font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-size:28px;margin:0 0 8px 0}.meta{font-size:14px;color:#5a6a85;font-style:italic;padding-bottom:12px;margin-bottom:16px;border-bottom:2px solid #2A9D8F}.desc{font-size:16px;line-height:1.7}</style></head><body>`;
  const body = `<h1>${item.title || "Untitled Assignment"}</h1>${metaParts.length ? `<div class="meta">${metaParts.join(" &middot; ")}</div>` : ""}<div class="desc">${descHtml}</div>`;
  const w = window.open("", "_blank");
  w.document.write(html + body + "</body></html>");
  w.document.close();
  w.print();
}

// ── AssignmentsView (real data) ─────────────────────────
function AssignmentsView({ assignments, weeks, filter, getLoCodesFor, onSendToPedagogy, feedbackByAssignment = {}, los, loTags, onTagAdd, onTagRemove, onRefresh }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [expandedFeedback, setExpandedFeedback] = useState({});
  const [expandedView, setExpandedView] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);
  const [exportOpenId, setExportOpenId] = useState(null);

  if (assignments.length === 0) return <EmptyDataState text="No assignments yet — open Course Setup to add them." />;

  const weekMap = {};
  for (const w of weeks) weekMap[String(w.id)] = w;
  const enriched = assignments.map(a => {
    const matchedWeek = a.week_id ? weekMap[String(a.week_id)] : null;
    return {
      ...a,
      loCodes: getLoCodesFor("assignment", a.id),
      weekLabel: matchedWeek ? `Week ${matchedWeek.week_number}` : "No week",
      weekNumber: matchedWeek ? matchedWeek.week_number : null,
      meta: [a.due_date, a.description].filter(Boolean).join(" · ") || a.assignment_type,
    };
  });

  const groups = {};
  for (const a of enriched) {
    const t = a.assignment_type || "Other";
    if (!groups[t]) groups[t] = [];
    groups[t].push(a);
  }

  let groupEntries = Object.entries(groups).map(([type, items]) => ({
    type: `${TYPE_EMOJI[type] || "📌"} ${type}`,
    items: filter ? items.filter(it => it.loCodes.includes(filter)) : items,
  })).filter(g => g.items.length > 0);

  if (groupEntries.length === 0) return <EmptyFilterState />;

  return (
    <div>
      {groupEntries.map(group => (
        <div key={group.type} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, marginBottom: "1rem", overflow: "hidden" }}>
          <div style={{ background: CA_COLORS.ivory, padding: "0.9rem 1.5rem", borderBottom: `1px solid ${CA_COLORS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy }}>{group.type}</span>
            <span style={{ background: CA_COLORS.teal, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, fontFamily: CA_FONTS.body }}>{group.items.length}</span>
          </div>
          {group.items.map((item, j) => {
            const key = `${group.type}-${item.id}`;
            const recs = feedbackByAssignment[item.id] || [];
            const isExpanded = !!expandedFeedback[item.id];
            return (
              <div key={key}>
                <div onMouseEnter={() => setHoveredKey(key)} onMouseLeave={() => setHoveredKey(null)}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", borderBottom: (j < group.items.length - 1 && !isExpanded) ? "1px solid #f5f1ea" : "none", background: hoveredKey === key ? CA_COLORS.ivory : "#fff", transition: "background 0.15s ease" }}>
                  <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 12, color: CA_COLORS.teal, minWidth: 75, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {item.weekLabel}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 15, color: CA_COLORS.navy }}>{item.title || <span style={{ color: CA_COLORS.textSoft, fontWeight: 400, fontStyle: "italic" }}>Untitled</span>}</div>
                    <div style={{ fontFamily: CA_FONTS.body, fontSize: 12, color: CA_COLORS.textSoft }}>{item.meta}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <LoTagger taggableType="assignment" taggableId={item.id} los={los} tags={loTags} onAdd={onTagAdd} onRemove={onTagRemove} />
                    {onSendToPedagogy && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSendToPedagogy(item, item.weekNumber); }}
                        style={{
                          background: "none", border: `1px solid ${CA_COLORS.border}`, borderRadius: 8,
                          padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                          color: CA_COLORS.teal, cursor: "pointer", whiteSpace: "nowrap",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = CA_COLORS.teal}
                        onMouseLeave={e => e.currentTarget.style.borderColor = CA_COLORS.border}
                      >Get AI feedback</button>
                    )}
                    {recs.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedFeedback(prev => ({ ...prev, [item.id]: !prev[item.id] })); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          background: isExpanded ? CA_COLORS.tealSoft : "none",
                          border: `1px solid ${isExpanded ? CA_COLORS.teal : CA_COLORS.border}`, borderRadius: 8,
                          padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                          color: CA_COLORS.teal, cursor: "pointer", whiteSpace: "nowrap",
                          transition: "all 0.15s",
                        }}
                      >💡 {recs.length} feedback <span style={{ fontSize: 9, marginLeft: 2 }}>{isExpanded ? "▲" : "▼"}</span></button>
                    )}
                  </div>
                </div>
                {/* Action buttons row */}
                <div style={{ display: "flex", gap: 6, padding: "0 1.5rem 0.75rem 1.5rem", borderTop: `0.5px solid ${CA_COLORS.border}`, marginTop: 0, paddingTop: 10 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedView(prev => ({ ...prev, [item.id]: !prev[item.id] })); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: expandedView[item.id] ? CA_COLORS.tealSoft : "none",
                      border: `1px solid ${expandedView[item.id] ? CA_COLORS.teal : CA_COLORS.border}`, borderRadius: 8,
                      padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                      color: CA_COLORS.teal, cursor: "pointer", whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}>
                    👁 View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingId === item.id) { setEditingId(null); setEditMsg(null); }
                      else {
                        setEditingId(item.id);
                        setEditForm({ title: item.title || "", assignment_type: item.assignment_type || "", description: item.description || "", due_date: item.due_date || "", week_id: item.week_id || "" });
                        setEditMsg(null);
                        setExpandedView(prev => ({ ...prev, [item.id]: false }));
                      }
                    }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: editingId === item.id ? CA_COLORS.tealSoft : "none",
                      border: `1px solid ${editingId === item.id ? CA_COLORS.teal : CA_COLORS.border}`, borderRadius: 8,
                      padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                      color: CA_COLORS.teal, cursor: "pointer", whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}>
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExportOpenId(exportOpenId === item.id ? null : item.id); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: exportOpenId === item.id ? CA_COLORS.tealSoft : "none",
                      border: `1px solid ${exportOpenId === item.id ? CA_COLORS.teal : CA_COLORS.border}`, borderRadius: 8,
                      padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                      color: CA_COLORS.teal, cursor: "pointer", whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}>
                    📥 Export
                  </button>
                  {exportOpenId === item.id && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); exportAssignmentDocx(item, item.weekLabel); setExportOpenId(null); }}
                        style={{
                          background: "none", border: `1px solid ${CA_COLORS.border}`, borderRadius: 8,
                          padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                          color: CA_COLORS.navy, cursor: "pointer", whiteSpace: "nowrap",
                        }}>
                        Word (.docx)
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); exportAssignmentPdf(item, item.weekLabel); setExportOpenId(null); }}
                        style={{
                          background: "none", border: `1px solid ${CA_COLORS.border}`, borderRadius: 8,
                          padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                          color: CA_COLORS.navy, cursor: "pointer", whiteSpace: "nowrap",
                        }}>
                        PDF
                      </button>
                    </>
                  )}
                </div>
                {/* View expand panel */}
                {expandedView[item.id] && (
                  <div style={{
                    padding: "0.75rem 1.5rem 1rem 1.5rem",
                    background: CA_COLORS.ivory,
                    borderBottom: j < group.items.length - 1 ? "1px solid #f5f1ea" : "none",
                  }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                      {item.assignment_type && (
                        <div>
                          <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 2 }}>TYPE</div>
                          <div style={{ fontSize: 13, fontFamily: CA_FONTS.body, color: CA_COLORS.navy }}>{item.assignment_type}</div>
                        </div>
                      )}
                      {item.weekLabel && (
                        <div>
                          <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 2 }}>WEEK</div>
                          <div style={{ fontSize: 13, fontFamily: CA_FONTS.body, color: CA_COLORS.navy }}>{item.weekLabel}</div>
                        </div>
                      )}
                      {item.due_date && (
                        <div>
                          <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 2 }}>DUE DATE</div>
                          <div style={{ fontSize: 13, fontFamily: CA_FONTS.body, color: CA_COLORS.navy }}>{item.due_date}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>DESCRIPTION</div>
                    {item.description ? (
                      <div style={{ fontSize: 14, fontFamily: CA_FONTS.body, color: CA_COLORS.navy, lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 10 }}>{item.description}</div>
                    ) : (
                      <div style={{ fontSize: 13, fontFamily: CA_FONTS.body, color: CA_COLORS.textSoft, fontStyle: "italic", marginBottom: 10 }}>No description</div>
                    )}
                    {item.description && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(item.description).then(() => {
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          });
                        }}
                        style={{
                          background: "none", border: `1px solid ${CA_COLORS.border}`, borderRadius: 8,
                          padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: CA_FONTS.body,
                          color: copiedId === item.id ? CA_COLORS.teal : CA_COLORS.textSoft,
                          cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s",
                        }}>
                        {copiedId === item.id ? "✓ Copied" : "📋 Copy description"}
                      </button>
                    )}
                  </div>
                )}
                {/* Edit expand panel */}
                {editingId === item.id && (
                  <div style={{
                    padding: "0.75rem 1.5rem 1rem 1.5rem",
                    background: CA_COLORS.ivory,
                    borderBottom: j < group.items.length - 1 ? "1px solid #f5f1ea" : "none",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>TITLE</div>
                        <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          style={{ width: "100%", fontFamily: CA_FONTS.body, fontSize: 14, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, background: "#fff", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>TYPE</div>
                          <input value={editForm.assignment_type} onChange={e => setEditForm(f => ({ ...f, assignment_type: e.target.value }))}
                            style={{ width: "100%", fontFamily: CA_FONTS.body, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>DUE DATE</div>
                          <input value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                            style={{ width: "100%", fontFamily: CA_FONTS.body, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, background: "#fff", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>WEEK</div>
                          <select value={editForm.week_id} onChange={e => setEditForm(f => ({ ...f, week_id: e.target.value || null }))}
                            style={{ width: "100%", fontFamily: CA_FONTS.body, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, background: "#fff", boxSizing: "border-box" }}>
                            <option value="">No week</option>
                            {weeks.map(w => <option key={w.id} value={w.id}>Week {w.week_number}{w.topic ? ` - ${w.topic}` : ""}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>DESCRIPTION</div>
                        <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={5}
                          style={{ width: "100%", fontFamily: CA_FONTS.body, fontSize: 14, padding: "8px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, background: "#fff", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button disabled={editSaving} onClick={async (e) => {
                          e.stopPropagation(); setEditSaving(true); setEditMsg(null);
                          try {
                            await updateAssignment(item.id, {
                              title: editForm.title,
                              assignment_type: editForm.assignment_type,
                              description: editForm.description,
                              due_date: editForm.due_date,
                              week_id: editForm.week_id || null,
                            });
                            setEditMsg({ ok: true, text: "Saved" });
                            setTimeout(() => { setEditingId(null); setEditMsg(null); if (onRefresh) onRefresh(); }, 1000);
                          } catch (err) {
                            console.error("Edit assignment failed:", err);
                            setEditMsg({ ok: false, text: err.message || "Save failed. Please try again." });
                          } finally { setEditSaving(false); }
                        }}
                          style={{
                            background: editSaving ? CA_COLORS.textSoft : CA_COLORS.teal, color: "#fff", border: "none", borderRadius: 8,
                            padding: "6px 16px", fontSize: 12, fontWeight: 700, fontFamily: CA_FONTS.body,
                            cursor: editSaving ? "default" : "pointer", opacity: editSaving ? 0.6 : 1,
                          }}>
                          {editSaving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditMsg(null); }}
                          style={{
                            background: "transparent", color: CA_COLORS.textSoft, border: `1px solid ${CA_COLORS.border}`, borderRadius: 8,
                            padding: "6px 12px", fontSize: 12, fontWeight: 700, fontFamily: CA_FONTS.body, cursor: "pointer",
                          }}>
                          Cancel
                        </button>
                        {editMsg && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: editMsg.ok ? CA_COLORS.teal : "#C0392B" }}>
                            {editMsg.ok ? "✓" : "✗"} {editMsg.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {isExpanded && recs.length > 0 && (
                  <div style={{
                    padding: "0.75rem 1.5rem 1rem 1.5rem",
                    background: CA_COLORS.ivory,
                    borderBottom: j < group.items.length - 1 ? "1px solid #f5f1ea" : "none",
                  }}>
                    {recs.map((rec) => {
                      const tc = FEEDBACK_TAG_COLORS[rec.tag] || { color: CA_COLORS.teal, bg: CA_COLORS.tealSoft };
                      return (
                        <div key={rec.id} style={{ borderLeft: `3px solid ${tc.color}`, paddingLeft: 12, marginBottom: 10 }}>
                          <span style={{
                            display: "inline-block", background: tc.bg, color: tc.color,
                            padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                            fontFamily: CA_FONTS.heading, letterSpacing: "0.3px",
                          }}>{rec.tag}</span>
                          <div style={{ fontFamily: CA_FONTS.heading, fontSize: 14, fontWeight: 700, color: CA_COLORS.navy, margin: "6px 0 4px" }}>{rec.title}</div>
                          <div style={{ fontSize: 12, color: CA_COLORS.textSoft, lineHeight: 1.5, marginBottom: rec.action ? 6 : 0 }}>{rec.summary}</div>
                          {(rec.article_title || rec.article) && (
                            <div style={{ background: "#fff", borderRadius: 8, padding: "6px 10px", margin: "6px 0" }}>
                              <div style={{ fontSize: 9, fontFamily: CA_FONTS.heading, color: CA_COLORS.textSoft, fontWeight: 700, marginBottom: 2, letterSpacing: "0.5px" }}>RESEARCH</div>
                              <div style={{ fontSize: 11, color: CA_COLORS.textSoft, fontStyle: "italic", lineHeight: 1.4 }}>
                                {rec.article_url ? <a href={rec.article_url} target="_blank" rel="noopener noreferrer" style={{ color: CA_COLORS.teal, textDecoration: "underline" }}>{rec.article_title}</a> : (rec.article_title || rec.article)}
                              </div>
                            </div>
                          )}
                          {rec.action && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              <div style={{ width: 3, height: 18, background: tc.color, borderRadius: 2 }} />
                              <div style={{ fontSize: 12, color: CA_COLORS.navy }}>
                                <span style={{ color: tc.color, fontWeight: 700 }}>Try this: </span>
                                <span>{rec.action}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── DetailsView (real data — deep layer) ────────────────
function DetailsView({ weeks, uploads = [], assignments = [], filter, getLoCodesFor, onOpenInSlideStudio }) {
  const [dlLoading, setDlLoading] = useState(null);
  const [dlError, setDlError] = useState(null);

  const handleDownload = async (item) => {
    if (!item.storage_path) return;
    setDlLoading(item.id); setDlError(null);
    try {
      const url = await downloadDocument(item.storage_path);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
      setDlError(item.id);
      setTimeout(() => setDlError(null), 4000);
    } finally { setDlLoading(null); }
  };

  if (weeks.length === 0) return <EmptyDataState text="No weeks yet — open Course Setup to add them." />;

  const entries = weeks.map(w => {
    const loCodes = getLoCodesFor("week", w.id);
    const sections = [];
    if (w.weekly_outcomes?.length) sections.push({ label: "🎯 Weekly outcomes", items: w.weekly_outcomes });
    if (w.readings?.length) sections.push({ label: "📚 Readings", items: w.readings });
    if (w.lecture_topic) sections.push({ label: "🎤 Lecture topic", text: w.lecture_topic });
    if (w.activities?.length) sections.push({ label: "✋ In-class activities", items: w.activities });
    if (w.discussion_board) sections.push({ label: "💬 Discussion board", text: w.discussion_board });
    if (w.wellness_note) sections.push({ label: "🌿 Wellness note", text: w.wellness_note });
    const weekAssignments = assignments.filter(a => a.week_id === w.id);
    if (weekAssignments.length) sections.push({ label: "📝 Assignments", assignmentsList: weekAssignments });
    const weekMaterials = uploads.filter(u => u.week === w.week_number);
    if (weekMaterials.length) sections.push({ label: "📂 Materials", materials: weekMaterials });
    return { ...w, loCodes, sections };
  });

  const filtered = filter ? entries.filter(e => e.loCodes.includes(filter)) : entries;
  if (filtered.length === 0) return <EmptyFilterState />;

  return (
    <div>
      {filtered.map(entry => {
        const accent = entry.is_milestone ? "#E89B7E" : CA_COLORS.teal;
        return (
          <div key={entry.id} style={{
            background: "#fff", borderRadius: 14, padding: "1.5rem 1.5rem 1.5rem 1.75rem",
            border: `1px solid ${CA_COLORS.border}`, borderLeft: `4px solid ${accent}`, marginBottom: "1.25rem", position: "relative",
          }}>
            <div style={{ paddingBottom: "1rem", borderBottom: "1px solid #f0f0f0", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 12, color: accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  Week {entry.week_number}
                </div>
                <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 22, color: CA_COLORS.navy, letterSpacing: "-0.01em" }}>
                  {entry.topic || <span style={{ color: CA_COLORS.textSoft, fontWeight: 400, fontStyle: "italic" }}>Add a topic</span>}
                  {entry.is_milestone && <span style={{ color: "#D4A574", fontSize: 18, marginLeft: 6 }}>★</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {entry.loCodes.map(c => <LOTag key={c} code={c} />)}
              </div>
            </div>
            {entry.sections.length > 0 ? entry.sections.map((sec, si) => (
              <div key={si} style={{ marginBottom: si < entry.sections.length - 1 ? "0.85rem" : 0 }}>
                <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 11, color: CA_COLORS.teal, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>
                  {sec.label}
                </div>
                {sec.materials ? (
                  <div style={{ paddingLeft: 8 }}>
                    {sec.materials.map(m => {
                      const label = m.title || m.filename || "Untitled";
                      const typeLabel = m.file_type ? m.file_type.toUpperCase() : "";
                      const noFile = !m.storage_path;
                      return (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.navy, flex: 1 }}>
                            {label}{typeLabel ? ` · ${typeLabel}` : ""}
                          </span>
                          <button disabled={noFile || dlLoading === m.id} onClick={() => handleDownload(m)}
                            style={{
                              fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 11,
                              color: noFile ? CA_COLORS.textSoft : "#fff",
                              background: noFile ? CA_COLORS.border : dlLoading === m.id ? CA_COLORS.textSoft : CA_COLORS.teal,
                              border: "none", borderRadius: 6, padding: "4px 10px",
                              cursor: noFile ? "default" : "pointer", opacity: noFile ? 0.5 : 1,
                            }}>
                            {dlLoading === m.id ? "Opening..." : noFile ? "No file" : "Download"}
                          </button>
                          {(m.category === "Slide Deck" || m.material_type === "slide_deck") && onOpenInSlideStudio && (
                            <button disabled={!m.content} onClick={() => onOpenInSlideStudio(m.content)}
                              style={{
                                fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 11,
                                color: !m.content ? CA_COLORS.textSoft : "#fff",
                                background: !m.content ? CA_COLORS.border : CA_COLORS.navy,
                                border: "none", borderRadius: 6, padding: "4px 10px",
                                cursor: !m.content ? "default" : "pointer", opacity: !m.content ? 0.5 : 1,
                              }}>
                              Open in Slide Studio
                            </button>
                          )}
                          {dlError === m.id && <span style={{ fontSize: 11, color: "#C0392B", fontWeight: 600 }}>Failed</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : sec.assignmentsList ? (
                  <ul style={{ margin: 0, paddingLeft: 8, listStyle: "none" }}>
                    {sec.assignmentsList.map(a => {
                      const meta = [a.assignment_type, a.due_date ? `Due: ${a.due_date}` : null].filter(Boolean).join(" · ");
                      return (
                        <li key={a.id} style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.navy, lineHeight: 1.6, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700 }}>{a.title || <span style={{ color: CA_COLORS.textSoft, fontWeight: 400, fontStyle: "italic" }}>Untitled</span>}</span>
                          {meta && <span style={{ fontSize: 12, color: CA_COLORS.textSoft, marginLeft: 8 }}>{meta}</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : sec.items ? (
                  <ul style={{ margin: 0, paddingLeft: 8, listStyle: "none" }}>
                    {sec.items.map((item, ii) => (
                      <li key={ii} style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.navy, lineHeight: 1.6, marginBottom: 2 }}>
                        <span style={{ color: CA_COLORS.teal, fontWeight: 700, marginRight: 6 }}>✓</span>{item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, paddingLeft: 8, fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.navy, lineHeight: 1.6 }}>
                    {sec.text}
                  </p>
                )}
              </div>
            )) : (
              <div style={{ fontFamily: CA_FONTS.body, fontSize: 13, color: CA_COLORS.textSoft, fontStyle: "italic" }}>
                No lesson-plan details yet — add them in Course Setup.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MaterialsView (uploads for this course) ─────────────
function MaterialsView({ uploads, courseId, onOpenInSlideStudio }) {
  const [downloading, setDownloading] = useState(null);
  const [dlError, setDlError] = useState(null);

  const courseUploads = uploads.filter(u => u.course_id === courseId);
  const decks = courseUploads.filter(u => u.category === "Slide Deck" || u.material_type === "slide_deck");
  const docs = courseUploads.filter(u => u.category !== "Slide Deck" && u.material_type !== "slide_deck");

  const handleDownload = async (item) => {
    if (!item.storage_path) return;
    setDownloading(item.id); setDlError(null);
    try {
      const url = await downloadDocument(item.storage_path);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
      setDlError(item.id);
      setTimeout(() => setDlError(null), 4000);
    } finally { setDownloading(null); }
  };

  const renderItem = (item) => {
    const label = item.title || item.filename || "Untitled";
    const weekLabel = item.week ? `Week ${item.week}` : "";
    const typeLabel = item.file_type ? item.file_type.toUpperCase() : "";
    const noFile = !item.storage_path;
    return (
      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${CA_COLORS.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 14, color: CA_COLORS.navy }}>{label}</div>
          <div style={{ fontFamily: CA_FONTS.body, fontSize: 12, color: CA_COLORS.textSoft, marginTop: 2 }}>
            {[weekLabel, typeLabel].filter(Boolean).join(" · ")}
          </div>
        </div>
        <button disabled={noFile || downloading === item.id} onClick={() => handleDownload(item)}
          style={{
            fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 12,
            color: noFile ? CA_COLORS.textSoft : "#fff",
            background: noFile ? CA_COLORS.border : downloading === item.id ? CA_COLORS.textSoft : CA_COLORS.teal,
            border: "none", borderRadius: 8, padding: "6px 14px",
            cursor: noFile ? "default" : "pointer", opacity: noFile ? 0.5 : 1,
          }}>
          {downloading === item.id ? "Opening..." : noFile ? "No file" : "Download"}
        </button>
        {(item.category === "Slide Deck" || item.material_type === "slide_deck") && onOpenInSlideStudio && (
          <button disabled={!item.content} onClick={() => onOpenInSlideStudio(item.content)}
            style={{
              fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 12,
              color: !item.content ? CA_COLORS.textSoft : "#fff",
              background: !item.content ? CA_COLORS.border : CA_COLORS.navy,
              border: "none", borderRadius: 8, padding: "6px 14px",
              cursor: !item.content ? "default" : "pointer", opacity: !item.content ? 0.5 : 1,
            }}>
            Open in Slide Studio
          </button>
        )}
        {dlError === item.id && <span style={{ fontSize: 11, color: "#C0392B", fontWeight: 600 }}>Failed</span>}
      </div>
    );
  };

  const renderSection = (title, items, emptyMsg) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 13, color: CA_COLORS.teal, textTransform: "uppercase", letterSpacing: "0.5px", padding: "10px 16px" }}>{title}</div>
      {items.length === 0
        ? <div style={{ padding: "12px 16px", fontSize: 13, color: CA_COLORS.textSoft, fontStyle: "italic" }}>{emptyMsg}</div>
        : items.map(renderItem)}
    </div>
  );

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}>
      {renderSection("Slide Decks", decks, "No slide decks yet")}
      {renderSection("Documents", docs, "No documents yet")}
    </div>
  );
}

function ExportButton({ label, featured = false, onClick, disabled = false }) {
  const [hovered, setHovered] = useState(false);
  const base = featured
    ? { background: CA_COLORS.navy, color: "#fff", borderColor: CA_COLORS.navy }
    : { background: CA_COLORS.ivory, color: CA_COLORS.navy, borderColor: CA_COLORS.border };
  const hover = featured
    ? { background: CA_COLORS.teal, borderColor: CA_COLORS.teal }
    : { background: "#fff", borderColor: CA_COLORS.teal };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      title={disabled ? "Coming soon" : undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10,
        border: `1px solid ${disabled ? CA_COLORS.border : hovered ? hover.borderColor : base.borderColor}`,
        background: disabled ? "#f0f0f0" : hovered ? hover.background : base.background,
        color: disabled ? "#aaa" : base.color,
        fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 700,
        cursor: disabled ? "default" : "pointer", transition: "all 0.15s ease",
        opacity: disabled ? 0.7 : 1,
      }}>
      {label}{disabled && <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 4, color: "#bbb" }}>(soon)</span>}
    </button>
  );
}

// ── CSV export (RFC-4180) ────────────────────────────────
function csvField(val) {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildLoCodeMap(los) {
  const map = {};
  for (let i = 0; i < los.length; i++) map[los[i].id] = `LO${i + 1}`;
  return map;
}

function resolveAssignmentLoCodes(assignment, loTags, loCodeMap) {
  // Direct assignment tags first
  const direct = (loTags || [])
    .filter(t => t.taggable_type === "assignment" && t.taggable_id === assignment.id)
    .map(t => loCodeMap[t.learning_outcome_id])
    .filter(Boolean);
  if (direct.length > 0) return direct;
  // Fall back to inherited week tags
  if (!assignment.week_id) return [];
  return (loTags || [])
    .filter(t => t.taggable_type === "week" && t.taggable_id === assignment.week_id)
    .map(t => loCodeMap[t.learning_outcome_id])
    .filter(Boolean);
}

function exportCourseCSV(weeks, assignments, los, loTags, activeCourse) {
  const weekMap = {};
  for (const w of (weeks || [])) weekMap[w.id] = w;

  const loCodeMap = buildLoCodeMap(los || []);

  const header = ["Week Number", "Week Topic", "Assignment Title", "Type", "Description", "Due Date"];
  const rows = [header.map(csvField).join(",")];

  const sorted = [...(assignments || [])].sort((a, b) => {
    const wa = a.week_id && weekMap[a.week_id] ? weekMap[a.week_id].week_number : 9999;
    const wb = b.week_id && weekMap[b.week_id] ? weekMap[b.week_id].week_number : 9999;
    return wa - wb;
  });

  for (const a of sorted) {
    const w = a.week_id ? weekMap[a.week_id] : null;
    rows.push([
      csvField(w ? w.week_number : ""),
      csvField(w ? w.topic : ""),
      csvField(a.title),
      csvField(a.assignment_type),
      csvField(a.description),
      csvField(a.due_date),
    ].join(","));
  }

  const csv = rows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${(activeCourse?.course_code || "course").replace(/\s+/g, "-")}-assignments.csv`;
  anchor.click();
}

// ── Word export (full semester lesson plan) ──────────────
async function exportCourseDocx(weeks, assignments, los, loTags, activeCourse) {
  const loCodeMap = buildLoCodeMap(los || []);

  const weekMap = {};
  for (const w of (weeks || [])) weekMap[w.id] = w;

  const asnByWeek = {};
  for (const a of (assignments || [])) {
    const key = a.week_id || "__unassigned";
    if (!asnByWeek[key]) asnByWeek[key] = [];
    asnByWeek[key].push(a);
  }

  const courseName = [activeCourse?.course_code, activeCourse?.course_name].filter(Boolean).join(" — ") || "Course";
  const termLabel = [activeCourse?.term_code, activeCourse?.num_weeks ? `${activeCourse.num_weeks} weeks` : null].filter(Boolean).join(" · ");

  const children = [
    new Paragraph({ children: [new TextRun({ text: courseName, bold: true, size: 32, color: "0B8A8A", font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: termLabel || "Generated by KlasUp", italics: true, size: 18, color: "4A5568", font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "0FB5B5" } } }),
  ];

  const sortedWeeks = [...(weeks || [])].sort((a, b) => a.week_number - b.week_number);

  for (const w of sortedWeeks) {
    children.push(new Paragraph({
      text: `Week ${w.week_number}${w.topic ? " — " + w.topic : ""}${w.is_milestone ? " ★" : ""}`,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 120 },
      run: { bold: true, size: 26, color: "1B2B4B", font: "Calibri" },
    }));

    if (w.detail) {
      children.push(new Paragraph({ children: [new TextRun({ text: w.detail, size: 22, font: "Calibri", color: "5a6a85" })], spacing: { after: 80 } }));
    }

    const sections = [
      { label: "Weekly Outcomes", items: w.weekly_outcomes },
      { label: "Readings", items: w.readings },
      { label: "Lecture Topic", text: w.lecture_topic },
      { label: "In-Class Activities", items: w.activities },
      { label: "Discussion Board", text: w.discussion_board },
      { label: "Wellness Note", text: w.wellness_note },
    ];

    for (const sec of sections) {
      if (sec.items && Array.isArray(sec.items) && sec.items.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: sec.label, bold: true, size: 20, color: "2A9D8F", font: "Calibri" })], spacing: { before: 120, after: 40 } }));
        for (const item of sec.items) {
          children.push(new Paragraph({ children: [new TextRun({ text: item, size: 22, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 40 } }));
        }
      } else if (sec.text) {
        children.push(new Paragraph({ children: [new TextRun({ text: sec.label, bold: true, size: 20, color: "2A9D8F", font: "Calibri" })], spacing: { before: 120, after: 40 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: sec.text, size: 22, font: "Calibri" })], spacing: { after: 60 } }));
      }
    }

    const weekAsns = asnByWeek[w.id] || [];
    if (weekAsns.length > 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: "Assignments", bold: true, size: 20, color: "2A9D8F", font: "Calibri" })], spacing: { before: 120, after: 40 } }));
      for (const a of weekAsns) {
        const codes = resolveAssignmentLoCodes(a, loTags, loCodeMap).join(", ");
        const meta = [a.assignment_type, a.due_date ? `Due: ${a.due_date}` : null, codes ? `LOs: ${codes}` : null].filter(Boolean).join(" · ");
        children.push(new Paragraph({ children: [new TextRun({ text: a.title || "Untitled", bold: true, size: 22, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 20 } }));
        if (meta) {
          children.push(new Paragraph({ children: [new TextRun({ text: meta, size: 18, font: "Calibri", color: "5a6a85", italics: true })], spacing: { after: 20 }, indent: { left: 720 } }));
        }
        if (a.description) {
          children.push(new Paragraph({ children: [new TextRun({ text: a.description, size: 20, font: "Calibri" })], spacing: { after: 40 }, indent: { left: 720 } }));
        }
      }
    }
  }

  const unassigned = asnByWeek["__unassigned"] || [];
  if (unassigned.length > 0) {
    children.push(new Paragraph({
      text: "Unassigned to a Week",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 120 },
      run: { bold: true, size: 26, color: "1B2B4B", font: "Calibri" },
    }));
    for (const a of unassigned) {
      const codes = resolveAssignmentLoCodes(a, loTags, loCodeMap).join(", ");
      const meta = [a.assignment_type, a.due_date ? `Due: ${a.due_date}` : null, codes ? `LOs: ${codes}` : null].filter(Boolean).join(" · ");
      children.push(new Paragraph({ children: [new TextRun({ text: a.title || "Untitled", bold: true, size: 22, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 20 } }));
      if (meta) {
        children.push(new Paragraph({ children: [new TextRun({ text: meta, size: 18, font: "Calibri", color: "5a6a85", italics: true })], spacing: { after: 20 }, indent: { left: 720 } }));
      }
      if (a.description) {
        children.push(new Paragraph({ children: [new TextRun({ text: a.description, size: 20, font: "Calibri" })], spacing: { after: 40 }, indent: { left: 720 } }));
      }
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const blob = await Packer.toBlob(doc);
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${(activeCourse?.course_code || "course").replace(/\s+/g, "-")}-course.docx`;
  anchor.click();
}

function ExportBar({ weeks, assignments, los, loTags, activeCourse, onGenerateSyllabus, syllabusLoading, syllabusError }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${CA_COLORS.border}`, borderRadius: 14, padding: "1.5rem", marginTop: "2.5rem" }}>
      <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 18, color: CA_COLORS.navy, letterSpacing: "-0.01em", marginBottom: "1rem" }}>
        📤 Take it with you
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <ExportButton label="📝 Generate Syllabus" featured onClick={onGenerateSyllabus} disabled={syllabusLoading} />
        <ExportButton label="⬇ CSV" onClick={() => exportCourseCSV(weeks, assignments, los, loTags, activeCourse)} />
        <ExportButton label="⬇ Word" onClick={() => exportCourseDocx(weeks, assignments, los, loTags, activeCourse)} />
        <ExportButton label="⬇ PDF" disabled />
        <ExportButton label="🚀 Export to LMS (Common Cartridge)" featured disabled />
        {syllabusLoading && <span style={{ fontSize: 12, color: CA_COLORS.textSoft, fontFamily: CA_FONTS.body }}>Generating syllabus…</span>}
        {syllabusError && <span style={{ fontSize: 12, color: "#c53030", fontFamily: CA_FONTS.body }}>{syllabusError}</span>}
      </div>
    </div>
  );
}

// ── Add Course Modal ────────────────────────────────────
function AddCourseModal({ onClose, userId, onCreated, profileInstitutions = [], homeInstitution = "" }) {
  const [form, setForm] = useState({ course_name: "", course_code: "", term_code: "", num_weeks: "", section: "", term_start: "", institution: "" });
  const institutionOptions = [...new Set([...profileInstitutions, ...(homeInstitution && !profileInstitutions.includes(homeInstitution) ? [homeInstitution] : [])].filter(Boolean))];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const valid = form.course_name.trim() && form.course_code.trim() && form.term_code.trim() && parseInt(form.num_weeks, 10) >= 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      const row = await insertCourse({
        course_name: form.course_name.trim(),
        course_code: form.course_code.trim(),
        term_code: form.term_code.trim(),
        num_weeks: parseInt(form.num_weeks, 10),
        section: form.section.trim() || null,
        term_start: form.term_start || null,
        institution: form.institution || null,
      }, userId);
      onCreated(row);
      onClose();
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", fontFamily: CA_FONTS.body, fontSize: 14,
    padding: "10px 12px", borderRadius: 10, border: `1px solid ${CA_COLORS.border}`,
    outline: "none", color: CA_COLORS.navy, background: "#fff",
  };
  const labelStyle = { fontFamily: CA_FONTS.body, fontSize: 12, fontWeight: 600, color: CA_COLORS.textSoft, marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: CA_COLORS.ivory, borderRadius: 18, padding: "28px 28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 16px 48px rgba(27,43,75,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 20, color: CA_COLORS.navy }}>Add a new course</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: CA_COLORS.textSoft, cursor: "pointer", padding: "2px 6px" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Course name *</label>
            <input value={form.course_name} onChange={set("course_name")} placeholder="e.g. Introduction to Marketing" style={inputStyle} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Course code *</label><input value={form.course_code} onChange={set("course_code")} placeholder="e.g. MKT 355" style={inputStyle} /></div>
            <div><label style={labelStyle}>Term *</label><input value={form.term_code} onChange={set("term_code")} placeholder="e.g. Fall 2026" style={inputStyle} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Number of weeks *</label><input type="number" min={1} max={30} value={form.num_weeks} onChange={set("num_weeks")} placeholder="e.g. 15" style={inputStyle} /></div>
            <div><label style={labelStyle}>Section</label><input value={form.section} onChange={set("section")} placeholder="e.g. 01" style={inputStyle} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Start date</label><input type="date" value={form.term_start} onChange={set("term_start")} style={inputStyle} /></div>
            {institutionOptions.length > 0 && (
              <div><label style={labelStyle}>Institution</label>
                <select value={form.institution} onChange={set("institution")} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">— None —</option>
                  {institutionOptions.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                </select>
              </div>
            )}
          </div>
          {error && <div style={{ fontFamily: CA_FONTS.body, fontSize: 13, color: "#c0392b" }}>{error}</div>}
          <button type="submit" disabled={!valid || submitting} style={{
            fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 15,
            background: valid && !submitting ? CA_COLORS.teal : CA_COLORS.border,
            color: valid && !submitting ? "#fff" : CA_COLORS.textSoft,
            border: "none", borderRadius: 10, padding: "12px 0",
            cursor: valid && !submitting ? "pointer" : "default", transition: "background 0.2s", marginTop: 4,
          }}>{submitting ? "Creating…" : "Create course"}</button>
        </form>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────
export default function CourseArchitect({ setPage, courses = [], activeCourseId, onSetActiveCourse, userId, onCourseCreated, onSendToPedagogy, onOpenInSlideStudio, onOpenAssignmentBuilder, featureInfo, profileInstitutions = [], homeInstitution = "", refreshKey = 0 }) {
  const [los, setLos] = useState([]);
  const [activeLOFilter, setActiveLOFilter] = useState(null);
  const [activeInstitutionFilter, setActiveInstitutionFilter] = useState(null);
  const [semesterView, setSemesterView] = useState("list");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const pickerRef = useRef(null);
  const [ww, setWw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (!pickerOpen) return;
    const handleClick = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);
  const mob = ww < 768;

  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0] || null;

  const distinctInstitutions = [...new Set(courses.map(c => c.institution).filter(Boolean))];
  const pickerCourses = activeInstitutionFilter ? courses.filter(c => c.institution === activeInstitutionFilter) : courses;

  // ── Part A: Real data fetching ────────────────────────
  const [weeks, setWeeks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loTags, setLoTags] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [aiFeedback, setAiFeedback] = useState([]);
  const [viewsLoading, setViewsLoading] = useState(false);
  const [fetchKey, setFetchKey] = useState(0); // bump to force re-fetch on remount

  // Re-fetch on mount (handles returning from Course Setup)
  useEffect(() => { setFetchKey(k => k + 1); }, []);

  // Re-fetch when parent signals new data (e.g. assignment saved from Assignment Builder)
  useEffect(() => { if (refreshKey > 0) setFetchKey(k => k + 1); }, [refreshKey]);

  useEffect(() => {
    if (!activeCourse?.id) {
      setWeeks([]); setAssignments([]); setLoTags([]); setLos([]); setUploads([]); setAiFeedback([]);
      return;
    }
    let cancelled = false;
    setViewsLoading(true);
    Promise.all([
      fetchCourseWeeks(activeCourse.id),
      fetchAssignments(activeCourse.id),
      fetchLoTags(activeCourse.id),
      fetchLearningOutcomes(activeCourse.id),
      userId ? fetchUploads(userId) : Promise.resolve([]),
      fetchAssignmentFeedback(activeCourse.id),
    ]).then(([w, a, t, l, u, fb]) => {
      if (cancelled) return;
      setWeeks(w); setAssignments(a); setLoTags(t); setLos(l); setUploads(u); setAiFeedback(fb);
    }).catch(e => {
      console.error("[CourseArchitect] Fetch failed:", e.message);
    }).finally(() => {
      if (!cancelled) setViewsLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeCourse?.id, fetchKey]);

  // ── Generate Syllabus ──────────────────────────────
  const [syllabusGenLoading, setSyllabusGenLoading] = useState(false);
  const [syllabusGenError, setSyllabusGenError] = useState(null);

  const handleGenerateSyllabus = async () => {
    if (!activeCourse?.id) return;
    setSyllabusGenLoading(true);
    setSyllabusGenError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sections = await generateSyllabus({ courseId: activeCourse.id, accessToken: session?.access_token });
      await exportSyllabusDocx(sections, activeCourse.course_name, activeCourse.semester_code);
      printSyllabusPdf(sections, activeCourse.course_name, activeCourse.semester_code);
    } catch (err) {
      console.error("[CourseArchitect] Generate syllabus failed:", err.message);
      setSyllabusGenError(err.message || "Something went wrong generating the syllabus.");
    } finally {
      setSyllabusGenLoading(false);
    }
  };

  // Helper: get LO codes for a given taggable
  const getLoCodesFor = useCallback((taggableType, taggableId) => {
    const taggedLoIds = loTags
      .filter(t => t.taggable_type === taggableType && t.taggable_id === taggableId)
      .map(t => t.learning_outcome_id);
    return taggedLoIds.map(loId => {
      const idx = los.findIndex(lo => lo.id === loId);
      return idx >= 0 ? los[idx].code : null;
    }).filter(Boolean);
  }, [loTags, los]);

  const handleTagAdd = useCallback(async (loId, taggableType, taggableId) => {
    try {
      await addLoTag(loId, taggableType, taggableId);
      setLoTags(prev => [...prev, { id: `${loId}-${taggableType}-${taggableId}`, learning_outcome_id: loId, taggable_type: taggableType, taggable_id: taggableId }]);
    } catch (e) { console.error("[CourseArchitect] Tag add failed:", e.message); }
  }, []);

  const handleTagRemove = useCallback(async (loId, taggableType, taggableId) => {
    try {
      await removeLoTag(loId, taggableType, taggableId);
      setLoTags(prev => prev.filter(t => !(t.learning_outcome_id === loId && t.taggable_type === taggableType && t.taggable_id === taggableId)));
    } catch (e) { console.error("[CourseArchitect] Tag remove failed:", e.message); }
  }, []);

  // Build assignment_id → sorted recs lookup from aiFeedback
  const feedbackByAssignment = {};
  for (const rec of aiFeedback) {
    if (!rec.assignment_id) continue;
    if (!feedbackByAssignment[rec.assignment_id]) feedbackByAssignment[rec.assignment_id] = [];
    feedbackByAssignment[rec.assignment_id].push(rec);
  }

  return (
    <div style={{ fontFamily: CA_FONTS.body, color: CA_COLORS.navy, background: CA_COLORS.ivory, minHeight: "100vh", padding: mob ? "0" : "0 0.5rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
        <PageHeader breadcrumb="🏠 Dashboard › 🏛️ Course Architect" title="Course Architect" subtitle="Your term at a glance — build, view, and align everything in one place" featureInfo={featureInfo} />

        {/* Course picker */}
        <div ref={pickerRef} style={{ position: "relative", flexShrink: 0 }}>
          {activeCourse ? (
            <button onClick={() => setPickerOpen(p => !p)}
              onMouseEnter={e => e.currentTarget.style.borderColor = CA_COLORS.teal}
              onMouseLeave={e => e.currentTarget.style.borderColor = CA_COLORS.border}
              style={{
                background: CA_COLORS.tealSoft, border: `1px solid ${CA_COLORS.border}`, borderRadius: 999,
                padding: "0.45rem 1.1rem", fontSize: 13, fontWeight: 600, color: CA_COLORS.navy,
                whiteSpace: "nowrap", cursor: "pointer", fontFamily: CA_FONTS.body, transition: "border-color 0.2s",
              }}>
              📚 {activeCourse.course_name} · {activeCourse.term_code}{activeCourse.num_weeks ? ` · ${activeCourse.num_weeks} weeks` : ""} ▾
            </button>
          ) : (
            <div onClick={() => setShowAddModal(true)}
              style={{ fontSize: 13, color: CA_COLORS.textSoft, cursor: "pointer", fontFamily: CA_FONTS.body, fontWeight: 600 }}>
              📚 No course yet — let's set one up
            </div>
          )}
          {pickerOpen && courses.length > 0 && (
            <div style={{
              position: "absolute", right: 0, top: 42, background: "#fff", border: `1px solid ${CA_COLORS.border}`,
              borderRadius: 12, padding: "6px 0", boxShadow: "0 8px 24px rgba(27,43,75,0.1)", zIndex: 100, minWidth: 240,
            }}>
              {activeCourse && (
                <>
                  <div
                    onClick={() => { setPickerOpen(false); setPage("Course Setup"); }}
                    onMouseEnter={e => e.currentTarget.style.background = CA_COLORS.tealSoft}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: CA_FONTS.heading, color: CA_COLORS.navy, fontWeight: 600, transition: "background 0.15s" }}>
                    ⚙ Edit this course's setup
                  </div>
                  <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />
                </>
              )}
              {pickerCourses.map(c => (
                <div key={c.id}
                  onClick={() => { onSetActiveCourse(c.id); setPickerOpen(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = CA_COLORS.tealSoft}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: CA_FONTS.heading, color: CA_COLORS.navy, transition: "background 0.15s" }}>
                  <span>{[c.course_code, c.course_name, c.term_code].filter(Boolean).join(" · ")}</span>
                  {c.id === (activeCourse?.id) && <span style={{ color: CA_COLORS.teal, fontWeight: 700, marginLeft: 8 }}>✓</span>}
                </div>
              ))}
              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />
              <div
                onClick={() => { setPickerOpen(false); setShowAddModal(true); }}
                onMouseEnter={e => e.currentTarget.style.background = CA_COLORS.tealSoft}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: CA_FONTS.heading, color: CA_COLORS.teal, fontWeight: 600, transition: "background 0.15s" }}>
                ➕ Add a new course
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Institution filter pill row ── */}
      {distinctInstitutions.length >= 2 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: CA_COLORS.textSoft, marginRight: 4 }}>Institution:</span>
          {distinctInstitutions.map(inst => {
            const active = activeInstitutionFilter === inst;
            return (
              <button key={inst} onClick={() => setActiveInstitutionFilter(active ? null : inst)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: active ? CA_COLORS.tealSoft : "#fff",
                  border: `1px solid ${active ? CA_COLORS.teal : CA_COLORS.border}`,
                  borderRadius: 999, padding: "0.35rem 0.85rem", fontSize: 13,
                  fontFamily: CA_FONTS.body, color: active ? CA_COLORS.teal : CA_COLORS.navy,
                  fontWeight: active ? 600 : 500, cursor: "pointer", transition: "all 0.15s ease",
                }}>
                {inst}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Institution filter banner ── */}
      {activeInstitutionFilter && (
        <div style={{
          background: CA_COLORS.tealSoft, borderLeft: `4px solid ${CA_COLORS.teal}`,
          padding: "10px 16px", borderRadius: 6, margin: "0 0 1rem 0",
          fontFamily: CA_FONTS.body, fontSize: 13, color: CA_COLORS.navy, fontWeight: 500,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          <span>
            🏛 Filtering by <span style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, color: CA_COLORS.teal }}>{activeInstitutionFilter}</span> — showing only courses at this institution
          </span>
          <button onClick={() => setActiveInstitutionFilter(null)}
            style={{ background: "#E89B7E", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 700, fontFamily: CA_FONTS.body, cursor: "pointer", whiteSpace: "nowrap" }}>
            ✕ Clear filter
          </button>
        </div>
      )}

      {/* ── Learning Outcomes pill row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: "2rem" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: CA_COLORS.textSoft, marginRight: 4 }}>Course Outcomes:</span>
        {los.length > 0 ? los.map((lo) => {
          const active = activeLOFilter === lo.code;
          return (
            <button key={lo.code} onClick={() => setActiveLOFilter(active ? null : lo.code)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: active ? CA_COLORS.tealSoft : "#fff",
                border: `1px solid ${active ? CA_COLORS.teal : CA_COLORS.border}`,
                borderRadius: 999, padding: "0.35rem 0.85rem", fontSize: 13,
                fontFamily: CA_FONTS.body, color: active ? CA_COLORS.teal : CA_COLORS.navy,
                fontWeight: active ? 600 : 500, cursor: "pointer", transition: "all 0.15s ease",
              }}>
              <span style={{ fontWeight: 700, color: CA_COLORS.teal }}>{lo.code}</span>
              <span>·</span>
              <span>{lo.label}</span>
            </button>
          );
        }) : (
          <span style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.textSoft, fontStyle: "italic" }}>
            No outcomes yet — add them in Course Setup
          </span>
        )}
        <button onClick={() => { setPage("Course Setup"); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, background: "transparent",
            border: `1.5px dashed ${CA_COLORS.border}`, borderRadius: 999, padding: "0.35rem 0.85rem",
            fontSize: 13, fontFamily: CA_FONTS.body, color: CA_COLORS.textSoft, cursor: "pointer",
          }}>+ Add outcome</button>
      </div>

      {/* ── Filter banner ── */}
      {activeLOFilter && (
        <div style={{
          background: CA_COLORS.tealSoft, borderLeft: `4px solid ${CA_COLORS.teal}`,
          padding: "10px 16px", borderRadius: 6, margin: "1rem 0 2rem 0",
          fontFamily: CA_FONTS.body, fontSize: 13, color: CA_COLORS.navy, fontWeight: 500,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          <span>
            🔍 Filtering by <span style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, color: CA_COLORS.teal }}>{activeLOFilter}</span> — showing only items tagged to this outcome
          </span>
          <button onClick={() => setActiveLOFilter(null)}
            style={{ background: "#E89B7E", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 700, fontFamily: CA_FONTS.body, cursor: "pointer", whiteSpace: "nowrap" }}>
            ✕ Clear filter
          </button>
        </div>
      )}

      {/* ── Build something today ── */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 22, color: CA_COLORS.navy, margin: "0 0 1rem 0" }}>
          🛠️ Build something today
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: ww < 600 ? "1fr" : ww < 900 ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
          {LAUNCHPAD_BASE.map((base) => {
            let stats = [];
            if (base.id === "pedagogy" && activeCourse) {
              const count = uploads.filter(u => u.course_id === activeCourse.id).length;
              stats = [{ value: String(count), label: "Submissions" }];
            } else if (base.id === "slides" && activeCourse?.term_start && activeCourse?.num_weeks) {
              const start = new Date(activeCourse.term_start + "T00:00:00").getTime();
              const now = Date.now();
              const elapsed = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
              const remaining = Math.max(0, Math.min(activeCourse.num_weeks, activeCourse.num_weeks - elapsed));
              stats = [{ value: String(remaining), label: "Weeks remaining" }];
            }
            return <LaunchpadCard key={base.title} card={{ ...base, stats }} onNavigate={setPage} />;
          })}
          <LaunchpadCard
            card={{
              emoji: "📝",
              title: "Assignment Builder",
              tag: "AI-POWERED ASSIGNMENT DOCS",
              description: "Generate a full assignment — instructions, rubric, and milestones — from a plain-English description.",
              accent: "#5A8A62",
              cta: "Open Assignment Builder →",
              navigateTo: "__builder",
            }}
            onNavigate={() => onOpenAssignmentBuilder && onOpenAssignmentBuilder()}
          />
        </div>
      </div>

      {/* ── Your term so far ── */}
      <div>
        <h2 style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 22, color: CA_COLORS.navy, margin: "0 0 1rem 0" }}>
          📖 Your term so far
        </h2>

        <div style={{ display: "inline-flex", gap: 4, background: "#fff", padding: 5, border: `1.5px solid ${CA_COLORS.border}`, borderRadius: 12, marginBottom: "1.25rem" }}>
          {[
            { id: "list", label: "📋 List" },
            { id: "assignments", label: "📝 Assignments" },
            { id: "details", label: "📖 Details" },
            { id: "materials", label: "📂 Materials" },
          ].map((v) => (
            <button key={v.id} onClick={() => setSemesterView(v.id)}
              style={{
                background: semesterView === v.id ? CA_COLORS.navy : "transparent",
                color: semesterView === v.id ? "#fff" : CA_COLORS.textSoft,
                border: "none", fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 13,
                padding: "10px 18px", borderRadius: 8, cursor: "pointer",
              }}>{v.label}</button>
          ))}
        </div>

        {viewsLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: CA_COLORS.textSoft, fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {semesterView === "list" && <SemesterListView weeks={weeks} assignments={assignments} uploads={uploads.filter(u => u.course_id === activeCourse?.id)} filter={activeLOFilter} getLoCodesFor={getLoCodesFor} />}
            {semesterView === "assignments" && <AssignmentsView assignments={assignments} weeks={weeks} filter={activeLOFilter} getLoCodesFor={getLoCodesFor} onSendToPedagogy={onSendToPedagogy} feedbackByAssignment={feedbackByAssignment} los={los} loTags={loTags} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove} onRefresh={() => setFetchKey(k => k + 1)} />}
            {semesterView === "details" && <DetailsView weeks={weeks} uploads={uploads.filter(u => u.course_id === activeCourse?.id)} assignments={assignments} filter={activeLOFilter} getLoCodesFor={getLoCodesFor} onOpenInSlideStudio={onOpenInSlideStudio} />}
            {semesterView === "materials" && <MaterialsView uploads={uploads} courseId={activeCourse?.id} onOpenInSlideStudio={onOpenInSlideStudio} />}
          </>
        )}
      </div>

      <ExportBar weeks={weeks} assignments={assignments} los={los} loTags={loTags} activeCourse={activeCourse} onGenerateSyllabus={handleGenerateSyllabus} syllabusLoading={syllabusGenLoading} syllabusError={syllabusGenError} />

      {showAddModal && (
        <AddCourseModal onClose={() => setShowAddModal(false)} userId={userId}
          onCreated={(row) => { if (onCourseCreated) onCourseCreated(row); }}
          profileInstitutions={profileInstitutions} homeInstitution={homeInstitution} />
      )}
    </div>
  );
}
