import { useState, useEffect, useRef } from "react";
import PageHeader from "../components/PageHeader";

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

const LAUNCHPAD_CARDS = [
  {
    emoji: "📚",
    title: "Pedagogy Studio",
    tag: "DESIGN ASSIGNMENTS & ACTIVITIES",
    description: "Plain-English assignment builder, scaffolding tools, and pedagogy feedback — all powered by Klas.",
    accent: CA_COLORS.teal,
    stats: [
      { value: "12", label: "Built" },
      { value: "3", label: "Need attention" },
    ],
    cta: "Open Pedagogy Studio →",
    navigateTo: "Pedagogy Studio",
  },
  {
    emoji: "📊",
    title: "Slide Studio",
    tag: "DESIGN LECTURES & DECKS",
    description: "Plain-English slide outlines, UDL analysis, active learning flags, and exports to PowerPoint.",
    accent: "#E89B7E",
    stats: [
      { value: "8", label: "Built" },
      { value: "5", label: "Weeks remaining" },
    ],
    cta: "Open Slide Studio →",
    navigateTo: "Slide Studio",
  },
];

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
      <div style={{ display: "flex", gap: "1.5rem", borderTop: "1px solid #f0f0f0", paddingTop: "0.75rem" }}>
        {card.stats.map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: CA_FONTS.heading, fontSize: 19, fontWeight: 700, color: CA_COLORS.navy }}>{s.value}</div>
            <div style={{ fontSize: 12, color: CA_COLORS.textSoft }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 14, color: card.accent, marginTop: "0.75rem" }}>
        {card.cta}
      </div>
    </div>
  );
}

const PLACEHOLDER_LOS = [
  { code: "LO1", label: "Marketing principles" },
  { code: "LO2", label: "Customer research" },
  { code: "LO3", label: "Segmentation frameworks" },
  { code: "LO4", label: "Positioning strategy" },
  { code: "LO5", label: "Marketing ethics" },
];

const SEMESTER_DATA = [
  { week: "Week 1", topic: "What is Marketing?", detail: "Intro lecture · syllabus walkthrough · icebreaker", los: ["LO1"], status: { lesson: true, slides: true, assignment: false }, milestone: false },
  { week: "Week 2", topic: "Customer Discovery", detail: "Persona-building workshop · interview prep", los: ["LO1", "LO2"], status: { lesson: true, slides: true, assignment: true }, milestone: false },
  { week: "Week 3", topic: "Market Segmentation", detail: "Group case study · STP frameworks", los: ["LO3"], status: { lesson: true, slides: true, assignment: false }, milestone: false },
  { week: "Week 4", topic: "Positioning & Branding", detail: "Brand audit · positioning canvas", los: ["LO3", "LO4"], status: { lesson: true, slides: true, assignment: true }, milestone: false },
  { week: "Week 5", topic: "Midterm Project Kickoff", detail: "Team formation · project brief · milestones", los: ["LO2", "LO3", "LO4"], status: { lesson: true, slides: false, assignment: true }, milestone: true },
  { week: "Week 12", topic: "Marketing Ethics", detail: "Ethical dilemma case studies · debate", los: ["LO5"], status: { lesson: true, slides: true, assignment: true }, milestone: false },
];

const ASSIGNMENTS_DATA = [
  { type: "💬 Discussion Boards", items: [
    { week: "Week 1", title: "What does marketing mean to you?", meta: "Due Sunday · 200 words · 2 peer replies", los: ["LO1"] },
    { week: "Week 3", title: "Segmentation in the Wild", meta: "Find a real-world example from a brand you follow", los: ["LO3"] },
    { week: "Week 12", title: "Ethical Dilemma Debate", meta: "Take a position and defend it with 3 sources", los: ["LO5"] },
  ]},
  { type: "📝 Papers", items: [
    { week: "Week 4", title: "Brand Audit Paper", meta: "5 pages · positioning + competitor analysis · APA", los: ["LO3", "LO4"] },
    { week: "Week 13", title: "Marketing Ethics Position Paper", meta: "7 pages · evaluate ethical dilemma · cite 5 sources", los: ["LO5"] },
  ]},
  { type: "📊 Projects", items: [
    { week: "Wks 5–15", title: "Term Marketing Plan (Team)", meta: "Multi-stage · 4 milestones · final presentation Wk 15", los: ["LO2", "LO3", "LO4"] },
  ]},
  { type: "✅ Quizzes", items: [
    { week: "Week 4", title: "Quiz 1: Marketing Foundations", meta: "15 questions · 30 min · open notes", los: ["LO1"] },
    { week: "Week 8", title: "Midterm Exam", meta: "Comprehensive · application-heavy", los: ["LO1", "LO2", "LO3"] },
  ]},
];

const DETAILS_DATA = [
  { week: "Week 1 · Sep 1–5", topic: "What is Marketing?", los: ["LO1"], milestone: false, sections: [
    { label: "🎯 Weekly outcomes", items: ["Define marketing and distinguish it from sales/advertising", "Identify the 4 Ps and how they interact"] },
    { label: "📚 Readings", items: ["Kotler & Keller, Ch. 1", "HBR: 'Marketing Myopia' by Theodore Levitt"] },
    { label: "🎤 Lecture topic", text: "Foundations of marketing · syllabus walkthrough · what marketing is and isn't" },
    { label: "✋ In-class activities", items: ["Icebreaker: 'What's a brand that gets you?'", "Small-group: Identify the 4 Ps in a chosen brand"] },
    { label: "💬 Discussion board", text: "'What does marketing mean to you?' — 200 words + 2 peer replies, due Sunday" },
  ]},
  { week: "Week 3 · Sep 15–19", topic: "Market Segmentation", los: ["LO3"], milestone: false, sections: [
    { label: "🎯 Weekly outcomes", items: ["Apply STP framework to a real brand", "Distinguish demographic, psychographic, and behavioral segmentation"] },
    { label: "💬 Discussion board", text: "'Segmentation in the Wild' — find a real-world example" },
  ]},
  { week: "Week 5 · Sep 29 – Oct 3", topic: "Midterm Project Kickoff ★", los: ["LO2", "LO3", "LO4"], milestone: true, sections: [
    { label: "🎯 Weekly outcomes", items: ["Form effective project teams using strengths-based pairing", "Draft a 1-page project brief with team-defined roles"] },
    { label: "📝 Assignment", text: "Term Marketing Plan — Step 1: Brief & Team Formation · Due Sunday" },
  ]},
];

function LOTag({ code }) {
  return (
    <span style={{
      background: CA_COLORS.tealSoft,
      color: CA_COLORS.teal,
      padding: "3px 9px",
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 700,
      fontFamily: CA_FONTS.heading,
      letterSpacing: "0.3px",
    }}>
      {code}
    </span>
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

function SemesterListView({ filter }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const STATUS_ICONS = [
    { key: "lesson", emoji: "📋" },
    { key: "slides", emoji: "📊" },
    { key: "assignment", emoji: "📝" },
  ];
  const rows = filter ? SEMESTER_DATA.filter((r) => r.los.includes(filter)) : SEMESTER_DATA;
  if (rows.length === 0) return <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}><EmptyFilterState /></div>;
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, overflow: "hidden" }}>
      {rows.map((row, i) => (
        <div
          key={row.week}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            padding: "1.1rem 1.5rem",
            borderBottom: i < rows.length - 1 ? "1px solid #f5f1ea" : "none",
            background: hoveredIdx === i ? CA_COLORS.ivory : "#fff",
            transition: "background 0.15s ease",
          }}
        >
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 13, color: row.milestone ? "#E89B7E" : CA_COLORS.teal, minWidth: 65, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {row.week}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy, letterSpacing: "-0.01em" }}>
              {row.topic}
              {row.milestone && <span style={{ color: "#D4A574", fontSize: 16, marginLeft: 6 }}>★</span>}
            </div>
            <div style={{ fontFamily: CA_FONTS.body, fontSize: 13, color: CA_COLORS.textSoft }}>{row.detail}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {row.los.map((lo) => <LOTag key={lo} code={lo} />)}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {STATUS_ICONS.map((si) => {
              const done = row.status[si.key];
              return (
                <div key={si.key} style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: done ? 14 : 13,
                  background: done ? CA_COLORS.tealSoft : "#FFF4E6",
                  color: done ? CA_COLORS.teal : "#B8651A",
                  border: done ? "none" : "1.5px dashed #D4A574",
                  fontWeight: 700,
                }}>
                  {done ? si.emoji : "+"}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentsView({ filter }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const filtered = ASSIGNMENTS_DATA.map((group) => ({
    ...group,
    items: filter ? group.items.filter((it) => it.los.includes(filter)) : group.items,
  })).filter((g) => g.items.length > 0);
  if (filtered.length === 0) return <EmptyFilterState />;
  return (
    <div>
      {filtered.map((group) => (
        <div key={group.type} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, marginBottom: "1rem", overflow: "hidden" }}>
          <div style={{ background: CA_COLORS.ivory, padding: "0.9rem 1.5rem", borderBottom: `1px solid ${CA_COLORS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy }}>{group.type}</span>
            <span style={{ background: CA_COLORS.teal, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, fontFamily: CA_FONTS.body }}>{group.items.length}</span>
          </div>
          {group.items.map((item, j) => {
            const key = `${group.type}-${j}`;
            return (
              <div
                key={key}
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.5rem",
                  borderBottom: j < group.items.length - 1 ? "1px solid #f5f1ea" : "none",
                  background: hoveredKey === key ? CA_COLORS.ivory : "#fff",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 12, color: CA_COLORS.teal, minWidth: 75, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {item.week}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 15, color: CA_COLORS.navy }}>{item.title}</div>
                  <div style={{ fontFamily: CA_FONTS.body, fontSize: 12, color: CA_COLORS.textSoft }}>{item.meta}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {item.los.map((lo) => <LOTag key={lo} code={lo} />)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DetailsView({ filter }) {
  const entries = filter ? DETAILS_DATA.filter((e) => e.los.includes(filter)) : DETAILS_DATA;
  if (entries.length === 0) return <EmptyFilterState />;
  return (
    <div>
      {entries.map((entry) => {
        const accent = entry.milestone ? "#E89B7E" : CA_COLORS.teal;
        return (
          <div key={entry.week} style={{
            background: "#fff",
            borderRadius: 14,
            padding: "1.5rem 1.5rem 1.5rem 1.75rem",
            border: `1px solid ${CA_COLORS.border}`,
            borderLeft: `4px solid ${accent}`,
            marginBottom: "1.25rem",
            position: "relative",
          }}>
            {/* Header */}
            <div style={{ paddingBottom: "1rem", borderBottom: "1px solid #f0f0f0", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 12, color: accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  {entry.week}
                </div>
                <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 22, color: CA_COLORS.navy, letterSpacing: "-0.01em" }}>
                  {entry.topic}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {entry.los.map((lo) => <LOTag key={lo} code={lo} />)}
              </div>
            </div>
            {/* Sections */}
            {entry.sections.map((sec, si) => (
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
            ))}
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
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 10,
        border: `1px solid ${hovered ? hover.borderColor : base.borderColor}`,
        background: hovered ? hover.background : base.background,
        color: base.color,
        fontFamily: CA_FONTS.body,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
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

export default function CourseArchitect({ setPage, courses = [], activeCourseId, onSetActiveCourse, learningOutcomes: learningOutcomesProp }) {
  const los = Array.isArray(learningOutcomesProp) ? learningOutcomesProp : [];
  const [activeLOFilter, setActiveLOFilter] = useState(null);
  const [semesterView, setSemesterView] = useState("list");
  const [pickerOpen, setPickerOpen] = useState(false);
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

  // Resolve active course — fall back to most recently created
  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0] || null;

  return (
    <div style={{ fontFamily: CA_FONTS.body, color: CA_COLORS.navy, background: CA_COLORS.ivory, minHeight: "100vh", padding: mob ? "0" : "0 0.5rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
        <PageHeader breadcrumb="🏠 Dashboard › 🏛️ Course Architect" title="Course Architect" subtitle="Your term at a glance — build, view, and align everything in one place" />

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
            <div onClick={() => alert("Course setup coming soon — for now, courses can be created in the Pedagogy Studio page.")}
              style={{ fontSize: 13, color: CA_COLORS.textSoft, cursor: "pointer", fontFamily: CA_FONTS.body, fontWeight: 600 }}>
              📚 No course yet — let's set one up
            </div>
          )}
          {pickerOpen && courses.length > 0 && (
            <div style={{
              position: "absolute", right: 0, top: 42, background: "#fff", border: `1px solid ${CA_COLORS.border}`,
              borderRadius: 12, padding: "6px 0", boxShadow: "0 8px 24px rgba(27,43,75,0.1)", zIndex: 100, minWidth: 240,
            }}>
              {courses.map(c => (
                <div key={c.id}
                  onClick={() => { onSetActiveCourse(c.id); setPickerOpen(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = CA_COLORS.tealSoft}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px",
                    cursor: "pointer", fontSize: 13, fontFamily: CA_FONTS.heading, color: CA_COLORS.navy, transition: "background 0.15s",
                  }}>
                  <span>{c.course_name} · {c.term_code}</span>
                  {c.id === (activeCourse?.id) && <span style={{ color: CA_COLORS.teal, fontWeight: 700, marginLeft: 8 }}>✓</span>}
                </div>
              ))}
              <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />
              <div
                onClick={() => { setPickerOpen(false); alert("Course setup coming soon — for now, courses can be created in the Pedagogy Studio page."); }}
                onMouseEnter={e => e.currentTarget.style.background = CA_COLORS.tealSoft}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{
                  padding: "8px 14px", cursor: "pointer", fontSize: 13, fontFamily: CA_FONTS.heading,
                  color: CA_COLORS.teal, fontWeight: 600, transition: "background 0.15s",
                }}>
                + Add new course
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
            <button
              key={lo.code}
              onClick={() => setActiveLOFilter(active ? null : lo.code)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: active ? CA_COLORS.tealSoft : "#fff",
                border: `1px solid ${active ? CA_COLORS.teal : CA_COLORS.border}`,
                borderRadius: 999,
                padding: "0.35rem 0.85rem",
                fontSize: 13,
                fontFamily: CA_FONTS.body,
                color: active ? CA_COLORS.teal : CA_COLORS.navy,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontWeight: 700, color: CA_COLORS.teal }}>{lo.code}</span>
              <span>·</span>
              <span>{lo.label}</span>
            </button>
          );
        }) : (
          <span style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.textSoft, fontStyle: "italic" }}>
            No outcomes yet — click + Add outcome to get started
          </span>
        )}

        {/* + Add outcome */}
        <button
          onClick={() => alert("LO creation coming soon — for now, add outcomes via Supabase Table Editor")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: `1.5px dashed ${CA_COLORS.border}`,
            borderRadius: 999,
            padding: "0.35rem 0.85rem",
            fontSize: 13,
            fontFamily: CA_FONTS.body,
            color: CA_COLORS.textSoft,
            cursor: "pointer",
          }}
        >
          + Add outcome
        </button>
      </div>

      {/* ── Filter banner ── */}
      {activeLOFilter && (
        <div style={{
          background: CA_COLORS.tealSoft,
          borderLeft: `4px solid ${CA_COLORS.teal}`,
          padding: "10px 16px",
          borderRadius: 6,
          margin: "1rem 0 2rem 0",
          fontFamily: CA_FONTS.body,
          fontSize: 13,
          color: CA_COLORS.navy,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}>
          <span>
            🔍 Filtering by <span style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, color: CA_COLORS.teal }}>{activeLOFilter}</span> — showing only items tagged to this outcome
          </span>
          <button
            onClick={() => setActiveLOFilter(null)}
            style={{
              background: "#E89B7E",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: 16,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: CA_FONTS.body,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
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
          {LAUNCHPAD_CARDS.map((card) => <LaunchpadCard key={card.title} card={card} onNavigate={setPage} />)}
        </div>
      </div>

      {/* ── Your term so far ── */}
      <div>
        <h2 style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 22, color: CA_COLORS.navy, margin: "0 0 1rem 0" }}>
          📖 Your term so far
        </h2>

        {/* View toggle bar */}
        <div style={{ display: "inline-flex", gap: 4, background: "#fff", padding: 5, border: `1.5px solid ${CA_COLORS.border}`, borderRadius: 12, marginBottom: "1.25rem" }}>
          {[
            { id: "list", label: "📋 List" },
            { id: "assignments", label: "📝 Assignments" },
            { id: "details", label: "📖 Details" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setSemesterView(v.id)}
              style={{
                background: semesterView === v.id ? CA_COLORS.navy : "transparent",
                color: semesterView === v.id ? "#fff" : CA_COLORS.textSoft,
                border: "none",
                fontFamily: CA_FONTS.body,
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 18px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {semesterView === "list" && <SemesterListView filter={activeLOFilter} />}
        {semesterView === "assignments" && <AssignmentsView filter={activeLOFilter} />}
        {semesterView === "details" && <DetailsView filter={activeLOFilter} />}
      </div>

      {/* ── Take it with you ── */}
      <ExportBar />

    </div>
  );
}
