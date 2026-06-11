import { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import { insertCourse, fetchCourseWeeks, fetchAssignments, fetchLoTags, fetchLearningOutcomes, fetchUploads, fetchAssignmentFeedback } from "../supabase";

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
    description: "Plain-English slide outlines, UDL analysis, active learning flags, and exports to PowerPoint.",
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
        borderTop: `4px solid ${card.accent}`,
        padding: "1.25rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 24px rgba(27, 43, 75, 0.1)" : "none",
      }}
    >
      <div style={{ fontSize: 30, marginBottom: "0.5rem" }}>{card.emoji}</div>
      <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 21, color: CA_COLORS.navy, letterSpacing: "-0.01em", marginBottom: 4 }}>
        {card.title}
      </div>
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
function SemesterListView({ weeks, assignments, filter, getLoCodesFor }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const STATUS_ICONS = [
    { key: "lesson", emoji: "📋", label: "Lesson plan" },
    { key: "slides", emoji: "📊", label: "Slides" },
    { key: "assignment", emoji: "📝", label: "Assignment" },
  ];

  if (weeks.length === 0) return <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}><EmptyDataState text="No weeks yet — open Course Setup to add them." /></div>;

  const weekAssignmentIds = new Set(assignments.map(a => a.week_id).filter(Boolean));
  const rows = weeks.map(w => ({
    ...w,
    loCodes: getLoCodesFor("week", w.id),
    status: {
      lesson: !!(w.topic || w.detail),
      slides: false,
      assignment: weekAssignmentIds.has(w.id),
    },
  }));

  const filtered = filter ? rows.filter(r => r.loCodes.includes(filter)) : rows;
  if (filtered.length === 0) return <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}><EmptyFilterState /></div>;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}>
      {filtered.map((row, i) => (
        <div key={row.id} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(-1)}
          style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.1rem 1.5rem", borderBottom: i < filtered.length - 1 ? "1px solid #f5f1ea" : "none", background: hoveredIdx === i ? CA_COLORS.ivory : "#fff", transition: "background 0.15s ease" }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 13, color: row.is_milestone ? "#E89B7E" : CA_COLORS.teal, minWidth: 65, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Week {row.week_number}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy, letterSpacing: "-0.01em" }}>
              {row.topic || <span style={{ color: CA_COLORS.textSoft, fontWeight: 400, fontStyle: "italic" }}>Untitled</span>}
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
              return (
                <div key={si.key} title={done ? si.label : `${si.label} — not yet added`} style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: done ? 14 : 13, background: done ? CA_COLORS.tealSoft : "#FFF4E6",
                  color: done ? CA_COLORS.teal : "#B8651A", border: done ? "none" : "1.5px dashed #D4A574", fontWeight: 700,
                  cursor: "help",
                }}>{done ? si.emoji : "+"}</div>
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

// ── AssignmentsView (real data) ─────────────────────────
function AssignmentsView({ assignments, weeks, filter, getLoCodesFor, onSendToPedagogy, feedbackByAssignment = {} }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [expandedFeedback, setExpandedFeedback] = useState({});

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
                    {item.loCodes.map(c => <LOTag key={c} code={c} />)}
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
function DetailsView({ weeks, filter, getLoCodesFor }) {
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
                  {entry.topic || <span style={{ color: CA_COLORS.textSoft, fontWeight: 400, fontStyle: "italic" }}>Untitled</span>}
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
                {sec.items ? (
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

function ExportButton({ label, featured = false }) {
  const [hovered, setHovered] = useState(false);
  const base = featured
    ? { background: CA_COLORS.navy, color: "#fff", borderColor: CA_COLORS.navy }
    : { background: CA_COLORS.ivory, color: CA_COLORS.navy, borderColor: CA_COLORS.border };
  const hover = featured
    ? { background: CA_COLORS.teal, borderColor: CA_COLORS.teal }
    : { background: "#fff", borderColor: CA_COLORS.teal };
  return (
    <button onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10,
        border: `1px solid ${hovered ? hover.borderColor : base.borderColor}`,
        background: hovered ? hover.background : base.background, color: base.color,
        fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease",
      }}>{label}</button>
  );
}

function ExportBar() {
  return (
    <div style={{ background: "#fff", border: `1px solid ${CA_COLORS.border}`, borderRadius: 14, padding: "1.5rem", marginTop: "2.5rem" }}>
      <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 18, color: CA_COLORS.navy, letterSpacing: "-0.01em", marginBottom: "1rem" }}>
        📤 Take it with you
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <ExportButton label="⬇ PDF" />
        <ExportButton label="⬇ Word" />
        <ExportButton label="⬇ CSV" />
        <ExportButton label="🚀 Export to LMS (Common Cartridge)" featured />
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
export default function CourseArchitect({ setPage, courses = [], activeCourseId, onSetActiveCourse, userId, onCourseCreated, onSendToPedagogy, featureInfo, profileInstitutions = [], homeInstitution = "" }) {
  const [los, setLos] = useState([]);
  const [activeLOFilter, setActiveLOFilter] = useState(null);
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
              {courses.map(c => (
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
        <div style={{ display: "grid", gridTemplateColumns: ww < 600 ? "1fr" : "1fr 1fr", gap: "1.25rem" }}>
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
            {semesterView === "list" && <SemesterListView weeks={weeks} assignments={assignments} filter={activeLOFilter} getLoCodesFor={getLoCodesFor} />}
            {semesterView === "assignments" && <AssignmentsView assignments={assignments} weeks={weeks} filter={activeLOFilter} getLoCodesFor={getLoCodesFor} onSendToPedagogy={onSendToPedagogy} feedbackByAssignment={feedbackByAssignment} />}
            {semesterView === "details" && <DetailsView weeks={weeks} filter={activeLOFilter} getLoCodesFor={getLoCodesFor} />}
          </>
        )}
      </div>

      <ExportBar />

      {showAddModal && (
        <AddCourseModal onClose={() => setShowAddModal(false)} userId={userId}
          onCreated={(row) => { if (onCourseCreated) onCourseCreated(row); }}
          profileInstitutions={profileInstitutions} homeInstitution={homeInstitution} />
      )}
    </div>
  );
}
