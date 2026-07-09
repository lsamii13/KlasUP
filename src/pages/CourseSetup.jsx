import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCourseWeeks, generateWeekSkeleton, updateCourseWeek,
  addCourseWeek, updateCourseNumWeeks,
  fetchLearningOutcomes, insertLearningOutcome, updateLearningOutcome,
  deleteLearningOutcome, reorderLearningOutcomes, CATEGORY_PREFIX,
  fetchAssignments, insertAssignment, updateAssignment, deleteAssignment,
  fetchLoTags, addLoTag, removeLoTag, uploadDocument,
} from "../supabase";
import { suggestOutcomes } from "../anthropic";
import SyllabusImportWizard from "../SyllabusImportWizard";
import extractFileText from "../extractFileText";
import { supabase } from "../supabase";
import { writeImportPayload } from "../syllabusImport";
import LoTagger from "../components/LoTagger";

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

const CATEGORIES = [
  { key: 'outcome',    label: 'Learning Outcomes', prefix: 'LO', addLabel: '+ Add outcome',    suggestLabel: 'Suggest outcomes',      placeholder: 'Outcome label (e.g. Marketing principles)' },
  { key: 'competency', label: 'Competencies',      prefix: 'C',  addLabel: '+ Add competency', suggestLabel: 'Suggest competencies',  placeholder: 'Competency label (e.g. Critical Thinking)' },
  { key: 'skill',      label: 'Skills',             prefix: 'S',  addLabel: '+ Add skill',      suggestLabel: 'Suggest skills',        placeholder: 'Skill label (e.g. Build a pivot table)' },
];

const ASSIGNMENT_TYPES = [
  "Discussion Board", "Paper", "Project", "Quiz",
  "Presentation", "Lab", "Reflection", "Other",
];

// ── Shared: Enter-to-save (prevents newline in textareas) ─
function enterToSave(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.target.blur();
  }
}

// ── Saved indicator (fades after 1.5s) ──────────────────
function SavedCheck({ show }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) { setVisible(true); const t = setTimeout(() => setVisible(false), 1500); return () => clearTimeout(t); }
  }, [show]);
  if (!visible) return null;
  return <span style={{ fontSize: 12, color: CA_COLORS.teal, marginLeft: 8, transition: "opacity 0.3s", opacity: visible ? 1 : 0 }}>✓ saved</span>;
}

// ── LO Tagger — imported from ../components/LoTagger ────

// ── Single week row ─────────────────────────────────────
function WeekRow({ week, onSave, los, tags, onTagAdd, onTagRemove }) {
  const [topic, setTopic] = useState(week.topic || "");
  const [detail, setDetail] = useState(week.detail || "");
  const [milestone, setMilestone] = useState(week.is_milestone || false);
  const [savedField, setSavedField] = useState(null);
  const savedTimer = useRef(null);
  const topicRef = useRef(topic);
  const detailRef = useRef(detail);
  const origTopic = useRef(week.topic || "");
  const origDetail = useRef(week.detail || "");
  topicRef.current = topic;
  detailRef.current = detail;

  const flash = (field) => {
    setSavedField(field);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedField(null), 1600);
  };

  const handleTopicBlur = async () => {
    if (topic === origTopic.current) return;
    await onSave(week.id, { topic });
    origTopic.current = topic;
    flash("topic");
  };

  const handleDetailBlur = async () => {
    if (detail === origDetail.current) return;
    await onSave(week.id, { detail });
    origDetail.current = detail;
    flash("detail");
  };

  // Save-on-unmount
  useEffect(() => () => {
    const pending = {};
    if (topicRef.current !== origTopic.current) pending.topic = topicRef.current;
    if (detailRef.current !== origDetail.current) pending.detail = detailRef.current;
    if (Object.keys(pending).length) onSave(week.id, pending);
  }, [week.id, onSave]);

  const handleMilestoneChange = async () => {
    const next = !milestone;
    setMilestone(next);
    await onSave(week.id, { is_milestone: next });
    flash("milestone");
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 8,
      padding: "14px 18px", background: "#fff", borderRadius: 10,
      border: `1px solid ${CA_COLORS.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 14, color: CA_COLORS.navy }}>
          Week {week.week_number}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: CA_COLORS.textSoft, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <input type="checkbox" checked={milestone} onChange={handleMilestoneChange} style={{ accentColor: CA_COLORS.teal }} />
            Milestone
          </label>
          <SavedCheck show={savedField === "milestone"} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input value={topic} onChange={e => setTopic(e.target.value)} onBlur={handleTopicBlur} onKeyDown={enterToSave} placeholder="Topic for this week"
          style={{ flex: 1, fontFamily: CA_FONTS.body, fontSize: 14, padding: "8px 12px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy, background: CA_COLORS.ivory }} />
        <SavedCheck show={savedField === "topic"} />
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input value={detail} onChange={e => setDetail(e.target.value)} onBlur={handleDetailBlur} onKeyDown={enterToSave} placeholder="Brief detail — what's happening this week"
          style={{ flex: 1, fontFamily: CA_FONTS.body, fontSize: 13, padding: "8px 12px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy, background: CA_COLORS.ivory }} />
        <SavedCheck show={savedField === "detail"} />
      </div>
      <LoTagger taggableType="week" taggableId={week.id} los={los} tags={tags} onAdd={onTagAdd} onRemove={onTagRemove} />
    </div>
  );
}

// ── Single LO row ───────────────────────────────────────
function LORow({ lo, index, total, onSave, onMove, onDelete, placeholder }) {
  const [label, setLabel] = useState(lo.label || "");
  const [fullText, setFullText] = useState(lo.full_text || "");
  const [expanded, setExpanded] = useState(false);
  const [savedField, setSavedField] = useState(null);
  const savedTimer = useRef(null);
  const labelRef = useRef(null);
  const labelValRef = useRef(label);
  const fullTextValRef = useRef(fullText);
  const origLabel = useRef(lo.label || "");
  const origFullText = useRef(lo.full_text || "");
  labelValRef.current = label;
  fullTextValRef.current = fullText;

  const flash = (field) => {
    setSavedField(field);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedField(null), 1600);
  };

  const handleLabelBlur = async () => {
    if (label === origLabel.current) return;
    await onSave(lo.id, { label });
    origLabel.current = label;
    flash("label");
  };

  const handleFullTextBlur = async () => {
    if (fullText === origFullText.current) return;
    await onSave(lo.id, { full_text: fullText });
    origFullText.current = fullText;
    flash("fullText");
  };

  useEffect(() => {
    if (!lo.label && labelRef.current) labelRef.current.focus();
  }, []);

  // Save-on-unmount
  useEffect(() => () => {
    const pending = {};
    if (labelValRef.current !== origLabel.current) pending.label = labelValRef.current;
    if (fullTextValRef.current !== origFullText.current) pending.full_text = fullTextValRef.current;
    if (Object.keys(pending).length) onSave(lo.id, pending);
  }, [lo.id, onSave]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 16px", background: "#fff", borderRadius: 10, border: `1px solid ${CA_COLORS.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ background: CA_COLORS.tealSoft, color: CA_COLORS.teal, fontFamily: CA_FONTS.heading, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 10, letterSpacing: "0.3px", flexShrink: 0 }}>{lo.code}</span>
        <input ref={labelRef} value={label} onChange={e => setLabel(e.target.value)} onBlur={handleLabelBlur} onKeyDown={enterToSave} placeholder={placeholder || "Label"}
          style={{ flex: 1, fontFamily: CA_FONTS.body, fontSize: 14, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy, background: CA_COLORS.ivory, minWidth: 0 }} />
        <SavedCheck show={savedField === "label"} />
        <button onClick={() => onMove(index, -1)} disabled={index === 0} title="Move up" style={{ background: "none", border: "none", cursor: index === 0 ? "default" : "pointer", fontSize: 14, opacity: index === 0 ? 0.25 : 0.6, padding: "2px 4px" }}>↑</button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1} title="Move down" style={{ background: "none", border: "none", cursor: index === total - 1 ? "default" : "pointer", fontSize: 14, opacity: index === total - 1 ? 0.25 : 0.6, padding: "2px 4px" }}>↓</button>
        <button onClick={() => setExpanded(e => !e)} title={expanded ? "Collapse" : "Edit full text"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: CA_COLORS.textSoft, padding: "2px 4px" }}>{expanded ? "▲" : "✎"}</button>
        <button onClick={() => onDelete(lo.id)} title="Delete outcome" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#c0392b", padding: "2px 4px" }}>🗑</button>
      </div>
      {expanded && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 2 }}>
          <textarea value={fullText} onChange={e => setFullText(e.target.value)} onBlur={handleFullTextBlur} onKeyDown={enterToSave} placeholder="Full outcome statement (optional)" rows={2}
            style={{ flex: 1, fontFamily: CA_FONTS.body, fontSize: 13, padding: "8px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy, background: CA_COLORS.ivory, resize: "vertical" }} />
          <SavedCheck show={savedField === "fullText"} />
        </div>
      )}
    </div>
  );
}

// ── Single assignment card (Part B) ─────────────────────
function AssignmentCard({ assignment, weeks, los, tags, children, onSave, onDelete, onTagAdd, onTagRemove }) {
  const [title, setTitle] = useState(assignment.title || "");
  const [type, setType] = useState(assignment.assignment_type || "Other");
  const [weekId, setWeekId] = useState(assignment.week_id || "");
  const [desc, setDesc] = useState(assignment.description || "");
  const [savedField, setSavedField] = useState(null);
  const savedTimer = useRef(null);
  const titleRef = useRef(null);
  const titleValRef = useRef(title);
  const descValRef = useRef(desc);
  const origTitle = useRef(assignment.title || "");
  const origDesc = useRef(assignment.description || "");
  titleValRef.current = title;
  descValRef.current = desc;

  const flash = (field) => {
    setSavedField(field);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedField(null), 1600);
  };

  useEffect(() => {
    if (!assignment.title && titleRef.current) titleRef.current.focus();
  }, []);

  // Save-on-unmount
  useEffect(() => () => {
    const pending = {};
    if (titleValRef.current !== origTitle.current) pending.title = titleValRef.current;
    if (descValRef.current !== origDesc.current) pending.description = descValRef.current;
    if (Object.keys(pending).length) onSave(assignment.id, pending);
  }, [assignment.id, onSave]);

  const handleTitleBlur = async () => {
    if (title === origTitle.current) return;
    await onSave(assignment.id, { title });
    origTitle.current = title;
    flash("title");
  };
  const handleTypeChange = async (e) => {
    const v = e.target.value;
    setType(v);
    await onSave(assignment.id, { assignment_type: v });
    flash("type");
  };
  const handleWeekChange = async (e) => {
    const v = e.target.value || null;
    setWeekId(v);
    await onSave(assignment.id, { week_id: v });
    flash("week");
  };
  const handleDescBlur = async () => {
    if (desc === origDesc.current) return;
    await onSave(assignment.id, { description: desc });
    origDesc.current = desc;
    flash("desc");
  };

  const isChild = !!assignment.parent_assignment_id;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 8,
      padding: "14px 18px", background: "#fff", borderRadius: 10,
      border: `1px solid ${CA_COLORS.border}`,
      ...(isChild ? { marginLeft: 20, borderLeft: `3px solid ${CA_COLORS.teal}` } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} onBlur={handleTitleBlur} onKeyDown={enterToSave} placeholder="Assignment title"
          style={{ flex: 1, fontFamily: CA_FONTS.body, fontSize: 14, fontWeight: 600, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy, background: CA_COLORS.ivory, minWidth: 0 }} />
        <SavedCheck show={savedField === "title"} />
        <button onClick={() => onDelete(assignment)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#c0392b", padding: "2px 4px" }}>🗑</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <select value={type} onChange={handleTypeChange}
          style={{ fontFamily: CA_FONTS.body, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, color: CA_COLORS.navy, background: CA_COLORS.ivory, outline: "none" }}>
          {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <SavedCheck show={savedField === "type"} />
        <select value={weekId || ""} onChange={handleWeekChange}
          style={{ fontFamily: CA_FONTS.body, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, color: CA_COLORS.navy, background: CA_COLORS.ivory, outline: "none" }}>
          <option value="">— no week —</option>
          {weeks.map(w => <option key={w.id} value={w.id}>Week {w.week_number}</option>)}
        </select>
        <SavedCheck show={savedField === "week"} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} onBlur={handleDescBlur} onKeyDown={enterToSave} placeholder="Description (optional)" rows={2}
          style={{ flex: 1, fontFamily: CA_FONTS.body, fontSize: 13, padding: "8px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy, background: CA_COLORS.ivory, resize: "vertical" }} />
        <SavedCheck show={savedField === "desc"} />
      </div>
      <LoTagger taggableType="assignment" taggableId={assignment.id} los={los} tags={tags} onAdd={onTagAdd} onRemove={onTagRemove} />
      {children}
    </div>
  );
}

// ── Main component ──────────────────────────────────────
export default function CourseSetup({ setPage, course, userId }) {
  const [ww, setWw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const mob = ww < 768;

  const [los, setLos] = useState([]);
  const [losLoading, setLosLoading] = useState(true);

  const [weeks, setWeeks] = useState([]);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [numWeeksInput, setNumWeeksInput] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  const [loTags, setLoTags] = useState([]);
  const [importVersion, setImportVersion] = useState(0);
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [syllabusError, setSyllabusError] = useState(null);
  const [syllabusProposals, setSyllabusProposals] = useState(null);
  const [syllabusFileMsg, setSyllabusFileMsg] = useState(null);
  const syllabusFileRef = useRef(null);

  // ── AI Suggest state ────────────────────────────────
  const [suggestCategory, setSuggestCategory] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // ── Load all data on mount ────────────────────────────
  useEffect(() => {
    if (!course?.id) { setLosLoading(false); setWeeksLoading(false); setAssignmentsLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLosLoading(true); setWeeksLoading(true); setAssignmentsLoading(true);
      try {
        const [loRows, weekRows, asnRows, tagRows] = await Promise.all([
          fetchLearningOutcomes(course.id),
          fetchCourseWeeks(course.id),
          fetchAssignments(course.id),
          fetchLoTags(course.id),
        ]);
        if (cancelled) return;
        setLos(loRows);
        setLoTags(tagRows);
        setAssignments(asnRows);
        // Eager week skeleton
        if (weekRows.length === 0 && course.num_weeks && course.num_weeks > 0) {
          const generated = await generateWeekSkeleton(course.id, course.num_weeks);
          if (!cancelled) setWeeks(generated);
        } else {
          setWeeks(weekRows);
        }
      } catch (e) {
        console.error("[CourseSetup] Load failed:", e.message);
      } finally {
        if (!cancelled) { setLosLoading(false); setWeeksLoading(false); setAssignmentsLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [course?.id, course?.num_weeks]);

  // ── LO / Competency / Skill handlers (category-aware) ──
  const persistOrder = useCallback(async (items, prefix) => {
    const updates = items.map((lo, i) => ({ id: lo.id, sort_order: i, code: `${prefix}${i + 1}` }));
    try { await reorderLearningOutcomes(updates); } catch (e) { console.error("[CourseSetup] Reorder failed:", e.message); }
  }, []);

  const handleLOSave = useCallback(async (loId, fields) => {
    try { const updated = await updateLearningOutcome(loId, fields); setLos(prev => prev.map(lo => lo.id === loId ? updated : lo)); } catch (e) { console.error("[CourseSetup] LO save failed:", e.message); }
  }, []);

  const handleLOMove = useCallback(async (fromIndex, direction, category) => {
    const prefix = CATEGORY_PREFIX[category] || 'LO';
    setLos(prev => {
      const catItems = prev.filter(lo => lo.category === category);
      const otherItems = prev.filter(lo => lo.category !== category);
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= catItems.length) return prev;
      const next = [...catItems];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      const renumbered = next.map((lo, i) => ({ ...lo, sort_order: i, code: `${prefix}${i + 1}` }));
      persistOrder(renumbered, prefix);
      return [...otherItems, ...renumbered].sort((a, b) => {
        const catOrder = { outcome: 0, competency: 1, skill: 2 };
        return (catOrder[a.category] || 0) - (catOrder[b.category] || 0) || a.sort_order - b.sort_order;
      });
    });
  }, [persistOrder]);

  const handleLODelete = useCallback(async (loId) => {
    if (!window.confirm("Delete this item? It will be removed from any weeks or assignments it's tagged to.")) return;
    try {
      await deleteLearningOutcome(loId);
      setLos(prev => {
        const deleted = prev.find(lo => lo.id === loId);
        const category = deleted?.category || 'outcome';
        const prefix = CATEGORY_PREFIX[category] || 'LO';
        const remaining = prev.filter(lo => lo.id !== loId);
        const catItems = remaining.filter(lo => lo.category === category);
        const otherItems = remaining.filter(lo => lo.category !== category);
        const renumbered = catItems.map((lo, i) => ({ ...lo, sort_order: i, code: `${prefix}${i + 1}` }));
        persistOrder(renumbered, prefix);
        return [...otherItems, ...renumbered].sort((a, b) => {
          const catOrder = { outcome: 0, competency: 1, skill: 2 };
          return (catOrder[a.category] || 0) - (catOrder[b.category] || 0) || a.sort_order - b.sort_order;
        });
      });
      setLoTags(prev => prev.filter(t => t.learning_outcome_id !== loId));
    } catch (e) { console.error("[CourseSetup] LO delete failed:", e.message); }
  }, [persistOrder]);

  const handleAddItem = useCallback(async (category) => {
    if (!course?.id) return;
    const prefix = CATEGORY_PREFIX[category] || 'LO';
    const catItems = los.filter(lo => lo.category === category);
    const sortOrder = catItems.length;
    const code = `${prefix}${sortOrder + 1}`;
    try {
      const row = await insertLearningOutcome(course.id, { code, label: "", fullText: null, sortOrder, category });
      setLos(prev => [...prev, row]);
    } catch (e) { console.error("[CourseSetup] Add item failed:", e.message); }
  }, [course?.id, los]);

  const handleSuggest = useCallback(async (category) => {
    if (!course?.id) return;
    setSuggestCategory(category);
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const catItems = los.filter(lo => lo.category === category);
      const result = await suggestOutcomes({
        category,
        courseName: course.course_name,
        courseCode: course.course_code,
        assignments: assignments.map(a => ({ title: a.title, assignment_type: a.assignment_type, description: a.description })),
        existingItems: catItems.map(lo => ({ code: lo.code, label: lo.label })),
      });
      setSuggestions((result || []).map(s => ({ ...s, accepted: true })));
    } catch (e) {
      console.error("[CourseSetup] Suggest failed:", e.message);
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, [course?.id, course?.course_name, course?.course_code, los, assignments]);

  const handleAcceptSuggestions = useCallback(async (category) => {
    if (!course?.id) return;
    const prefix = CATEGORY_PREFIX[category] || 'LO';
    const catItems = los.filter(lo => lo.category === category);
    let offset = catItems.length;
    const accepted = suggestions.filter(s => s.accepted);
    const newRows = [];
    for (const s of accepted) {
      const code = `${prefix}${offset + 1}`;
      try {
        const row = await insertLearningOutcome(course.id, { code, label: s.label, fullText: s.full_text || null, sortOrder: offset, category });
        newRows.push(row);
        offset++;
      } catch (e) { console.error("[CourseSetup] Insert suggestion failed:", e.message); }
    }
    if (newRows.length) setLos(prev => [...prev, ...newRows]);
    setSuggestCategory(null);
    setSuggestions([]);
  }, [course?.id, los, suggestions]);

  // ── Week handlers ─────────────────────────────────────
  const handleWeekSave = useCallback(async (weekId, fields) => {
    try { const updated = await updateCourseWeek(weekId, fields); setWeeks(prev => prev.map(w => w.id === weekId ? updated : w)); } catch (e) { console.error("[CourseSetup] Week save failed:", e.message); }
  }, []);

  const handleSetupWeeks = async () => {
    const n = parseInt(numWeeksInput, 10);
    if (!n || n < 1 || n > 30 || !course?.id) return;
    setSettingUp(true);
    try { await updateCourseNumWeeks(course.id, n); const rows = await generateWeekSkeleton(course.id, n); setWeeks(rows); } catch (e) { console.error("[CourseSetup] Setup weeks failed:", e.message); } finally { setSettingUp(false); }
  };

  const handleAddWeek = async () => {
    const maxNum = weeks.length > 0 ? Math.max(...weeks.map(w => w.week_number)) : 0;
    try { const row = await addCourseWeek(course.id, maxNum + 1); setWeeks(prev => [...prev, row]); } catch (e) { console.error("[CourseSetup] Add week failed:", e.message); }
  };

  // ── Assignment handlers (Part B) ──────────────────────
  const handleAssignmentSave = useCallback(async (asnId, fields) => {
    try { const updated = await updateAssignment(asnId, fields); setAssignments(prev => prev.map(a => a.id === asnId ? updated : a)); } catch (e) { console.error("[CourseSetup] Assignment save failed:", e.message); }
  }, []);

  const handleAssignmentDelete = useCallback(async (asn) => {
    const isParent = !asn.parent_assignment_id;
    const hasChildren = isParent && assignments.some(a => a.parent_assignment_id === asn.id);
    const msg = isParent && hasChildren
      ? "Delete this assignment? Its scaffolded steps will become standalone assignments (not deleted)."
      : "Delete this assignment?";
    if (!window.confirm(msg)) return;
    try {
      await deleteAssignment(asn.id);
      setAssignments(prev => {
        let next = prev.filter(a => a.id !== asn.id);
        if (hasChildren) next = next.map(a => a.parent_assignment_id === asn.id ? { ...a, parent_assignment_id: null } : a);
        return next;
      });
      setLoTags(prev => prev.filter(t => !(t.taggable_type === "assignment" && t.taggable_id === asn.id)));
    } catch (e) { console.error("[CourseSetup] Assignment delete failed:", e.message); }
  }, [assignments]);

  const handleAddAssignment = useCallback(async (parentId) => {
    if (!course?.id) return;
    try {
      const row = await insertAssignment(course.id, { title: "", assignmentType: "Other", description: null, dueDate: null, weekId: null, parentAssignmentId: parentId || null });
      setAssignments(prev => [...prev, row]);
    } catch (e) { console.error("[CourseSetup] Add assignment failed:", e.message); }
  }, [course?.id]);

  // ── LO Tag handlers (Part C) ──────────────────────────
  const handleTagAdd = useCallback(async (loId, taggableType, taggableId) => {
    try {
      await addLoTag(loId, taggableType, taggableId);
      setLoTags(prev => [...prev, { id: `${loId}-${taggableType}-${taggableId}`, learning_outcome_id: loId, taggable_type: taggableType, taggable_id: taggableId }]);
    } catch (e) { console.error("[CourseSetup] Tag add failed:", e.message); }
  }, []);

  const handleTagRemove = useCallback(async (loId, taggableType, taggableId) => {
    try {
      await removeLoTag(loId, taggableType, taggableId);
      setLoTags(prev => prev.filter(t => !(t.learning_outcome_id === loId && t.taggable_type === taggableType && t.taggable_id === taggableId)));
    } catch (e) { console.error("[CourseSetup] Tag remove failed:", e.message); }
  }, []);

  // ── Derived ───────────────────────────────────────────
  const courseLabel = course
    ? `Editing: ${course.course_name || course.course_code}${course.term_code ? ` · ${course.term_code}` : ""}${course.num_weeks ? ` · ${course.num_weeks} weeks` : ""}`
    : "No course selected";

  if (!course) {
    return <div style={{ fontFamily: CA_FONTS.body, color: CA_COLORS.textSoft, padding: "2rem", textAlign: "center" }}>No course selected — pick a course first.</div>;
  }

  const needsNumWeeks = !weeksLoading && weeks.length === 0 && (!course.num_weeks || course.num_weeks <= 0);
  const topLevel = assignments.filter(a => !a.parent_assignment_id);
  const childrenOf = (parentId) => assignments.filter(a => a.parent_assignment_id === parentId);

  return (
    <div style={{ fontFamily: CA_FONTS.body, color: CA_COLORS.navy, background: CA_COLORS.ivory, minHeight: "100vh", padding: mob ? "1rem" : "1.5rem 2rem" }}>

      {/* Breadcrumb */}
      <div style={{ fontFamily: CA_FONTS.body, fontSize: 13, color: CA_COLORS.textSoft, marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
        <span onClick={() => setPage("Dashboard")} style={{ cursor: "pointer" }}>🏠 Dashboard</span>
        <span>›</span>
        <span onClick={() => setPage("Course Architect")} style={{ cursor: "pointer" }}>📐 Course Architect</span>
        <span>›</span>
        <span style={{ color: CA_COLORS.navy, fontWeight: 600 }}>⚙ Course Setup</span>
      </div>

      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: mob ? 24 : 30, color: CA_COLORS.navy, margin: 0 }}>⚙ Course Setup</h1>
        <>
            <button onClick={() => syllabusFileRef.current?.click()} style={{
              background: "none", border: `1px solid ${CA_COLORS.border}`, borderRadius: 8,
              padding: "5px 12px", fontSize: 12, fontWeight: 600, fontFamily: CA_FONTS.body,
              color: CA_COLORS.teal, cursor: "pointer", whiteSpace: "nowrap", transition: "border-color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = CA_COLORS.teal}
              onMouseLeave={e => e.currentTarget.style.borderColor = CA_COLORS.border}
            >📄 Import from syllabus</button>
            <input ref={syllabusFileRef} type="file" accept=".docx,.txt,.pptx,.pdf" style={{ display: "none" }} onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const ext = file.name.split(".").pop().toLowerCase();
              if (ext === "pdf") {
                setSyllabusFileMsg(null);
                setSyllabusError(null);
                setSyllabusLoading(true);
                let storagePath = null;
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  // Upload PDF to Storage so extract-pdf can read it
                  const uploaded = await uploadDocument(userId, file);
                  storagePath = uploaded.storagePath;
                  // Call the isolated extract-pdf Edge Function
                  const pdfRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ storage_path: storagePath }),
                  });
                  const pdfJson = await pdfRes.json();
                  if (!pdfRes.ok || !pdfJson.success) {
                    setSyllabusLoading(false);
                    setSyllabusError(pdfJson.error || "We couldn't extract text from that PDF.");
                    return;
                  }
                  if (pdfJson.likely_scanned) {
                    setSyllabusLoading(false);
                    setSyllabusFileMsg("That PDF looks like a scanned image, so we can't read the text. Save your syllabus as .docx or .txt and import that instead.");
                    setTimeout(() => setSyllabusFileMsg(null), 10000);
                    return;
                  }
                  const text = pdfJson.text;
                  if (!text || text.trim().length === 0) {
                    setSyllabusLoading(false);
                    setSyllabusError("No readable text found in that PDF. Try saving it as .docx or .txt.");
                    return;
                  }
                  // Hand off to the same extract-syllabus → wizard flow the other formats use
                  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-syllabus`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                    body: JSON.stringify({
                      text,
                      course_context: { course_name: course.course_name, course_code: course.course_code, num_weeks: course.num_weeks },
                    }),
                  });
                  if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    if (res.status === 400 && errJson.error?.includes("too short")) {
                      setSyllabusLoading(false);
                      setSyllabusError("That document looks too short to be a syllabus. Check it's the right file?");
                      return;
                    }
                    if (res.status === 422) {
                      setSyllabusLoading(false);
                      setSyllabusError("We had trouble structuring what we read. This sometimes happens — trying again usually works.");
                      return;
                    }
                    if (res.status === 401) {
                      setSyllabusLoading(false);
                      setSyllabusError("Your session expired — please refresh and log back in.");
                      return;
                    }
                    setSyllabusLoading(false);
                    setSyllabusError("Something went wrong on our end. Try again in a moment.");
                    return;
                  }
                  const json = await res.json();
                  setSyllabusProposals(json.proposals);
                  setSyllabusLoading(false);
                  setSyllabusOpen(true);
                } catch (err) {
                  console.error("[CourseSetup] PDF import failed:", err);
                  setSyllabusLoading(false);
                  setSyllabusError(err.message || "We couldn't read that PDF.");
                } finally {
                  // Always clean up the temporary PDF from Storage
                  if (storagePath) {
                    supabase.storage.from("documents").remove([storagePath]).catch(() => {});
                  }
                }
                return;
              }
              if (!["docx", "txt", "pptx"].includes(ext)) {
                setSyllabusFileMsg("Unsupported format — please use .docx, .pptx, or .txt.");
                setTimeout(() => setSyllabusFileMsg(null), 8000);
                return;
              }
              setSyllabusFileMsg(null);
              setSyllabusError(null);
              setSyllabusLoading(true);
              try {
                const text = await extractFileText(file);
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-syllabus`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                  body: JSON.stringify({
                    text,
                    course_context: { course_name: course.course_name, course_code: course.course_code, num_weeks: course.num_weeks },
                  }),
                });
                if (!res.ok) {
                  const errJson = await res.json().catch(() => ({}));
                  if (res.status === 400 && errJson.error?.includes("too short")) {
                    setSyllabusLoading(false);
                    setSyllabusError("That document looks too short to be a syllabus. Check it's the right file?");
                    return;
                  }
                  if (res.status === 422) {
                    setSyllabusLoading(false);
                    setSyllabusError("We had trouble structuring what we read. This sometimes happens — trying again usually works.");
                    return;
                  }
                  if (res.status === 401) {
                    setSyllabusLoading(false);
                    setSyllabusError("Your session expired — please refresh and log back in.");
                    return;
                  }
                  setSyllabusLoading(false);
                  setSyllabusError("Something went wrong on our end. Try again in a moment.");
                  return;
                }
                const json = await res.json();
                setSyllabusProposals(json.proposals);
                setSyllabusLoading(false);
                setSyllabusOpen(true);
              } catch (err) {
                console.error("[CourseSetup] Syllabus import failed:", err);
                setSyllabusLoading(false);
                setSyllabusError(err.message || "We couldn't read that file.");
              }
            }} />
          </>
        {syllabusFileMsg && <span style={{ fontSize: 12, color: CA_COLORS.textSoft }}>{syllabusFileMsg}</span>}
      </div>
      <p style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.textSoft, margin: "4px 0 28px" }}>{courseLabel}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>

        {/* ── Outcomes & Skills section (live) ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, padding: "20px 22px" }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy, marginBottom: 14 }}>🎯 Outcomes & Skills</div>
          {losLoading && <div style={{ fontSize: 13, color: CA_COLORS.textSoft }}>Loading…</div>}
          {!losLoading && CATEGORIES.map(cat => {
            const catItems = los.filter(lo => (lo.category || 'outcome') === cat.key);
            const hasItems = catItems.length > 0;
            return (
              <div key={cat.key} style={{ marginBottom: 12 }}>
                {hasItems && (
                  <>
                    <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 600, fontSize: 14, color: CA_COLORS.navy, marginBottom: 8, marginTop: 4 }}>{cat.label}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {catItems.map((lo, i) => (
                        <LORow key={`${lo.id}-v${importVersion}`} lo={lo} index={i} total={catItems.length}
                          onSave={handleLOSave} onMove={(idx, dir) => handleLOMove(idx, dir, cat.key)} onDelete={handleLODelete}
                          placeholder={cat.placeholder} />
                      ))}
                    </div>
                  </>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: hasItems ? 4 : 0 }}>
                  <button onClick={() => handleAddItem(cat.key)} style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 600, color: CA_COLORS.teal, background: "none", border: "none", cursor: "pointer", padding: "8px 0", textAlign: "left" }}>{cat.addLabel}</button>
                  <button onClick={() => handleSuggest(cat.key)} disabled={suggestLoading && suggestCategory === cat.key}
                    style={{ fontFamily: CA_FONTS.body, fontSize: 12, fontWeight: 600, color: CA_COLORS.navy, background: CA_COLORS.tealSoft, border: "none", borderRadius: 8, cursor: suggestLoading && suggestCategory === cat.key ? "wait" : "pointer", padding: "5px 12px", opacity: suggestLoading && suggestCategory === cat.key ? 0.6 : 1 }}>
                    {suggestLoading && suggestCategory === cat.key ? "Thinking…" : `✨ ${cat.suggestLabel}`}
                  </button>
                </div>
                {/* Inline suggestion review */}
                {suggestCategory === cat.key && !suggestLoading && suggestions.length > 0 && (
                  <div style={{ marginTop: 10, padding: "14px 16px", background: CA_COLORS.tealSoft, borderRadius: 10, border: `1px solid ${CA_COLORS.teal}22` }}>
                    <div style={{ fontFamily: CA_FONTS.heading, fontSize: 13, fontWeight: 700, color: CA_COLORS.navy, marginBottom: 10 }}>AI Suggestions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {suggestions.map((s, si) => (
                        <label key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: CA_COLORS.navy, cursor: "pointer" }}>
                          <input type="checkbox" checked={s.accepted} onChange={() => setSuggestions(prev => prev.map((x, xi) => xi === si ? { ...x, accepted: !x.accepted } : x))} style={{ accentColor: CA_COLORS.teal, marginTop: 3 }} />
                          <div style={{ flex: 1 }}>
                            <input value={s.label} onChange={e => setSuggestions(prev => prev.map((x, xi) => xi === si ? { ...x, label: e.target.value } : x))}
                              style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 600, padding: "4px 8px", borderRadius: 6, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy, background: "#fff", width: "100%" }} />
                            {s.full_text && <div style={{ fontSize: 12, color: CA_COLORS.textSoft, marginTop: 2, lineHeight: 1.4 }}>{s.full_text}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={() => handleAcceptSuggestions(cat.key)} disabled={!suggestions.some(s => s.accepted)}
                        style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 700, background: CA_COLORS.teal, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", opacity: suggestions.some(s => s.accepted) ? 1 : 0.5 }}>
                        Accept selected
                      </button>
                      <button onClick={() => { setSuggestCategory(null); setSuggestions([]); }}
                        style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 600, background: "transparent", color: CA_COLORS.textSoft, border: `1px solid ${CA_COLORS.border}`, borderRadius: 8, padding: "7px 16px", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Weeks section (live) ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, padding: "20px 22px" }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy, marginBottom: 14 }}>📅 Weeks</div>
          {weeksLoading && <div style={{ fontSize: 13, color: CA_COLORS.textSoft }}>Loading weeks…</div>}
          {needsNumWeeks && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 13, color: CA_COLORS.textSoft }}>How many weeks is this course?</label>
              <input type="number" min={1} max={30} value={numWeeksInput} onChange={e => setNumWeeksInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSetupWeeks()}
                style={{ width: 70, fontFamily: CA_FONTS.body, fontSize: 14, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CA_COLORS.border}`, outline: "none", color: CA_COLORS.navy }} placeholder="e.g. 15" />
              <button onClick={handleSetupWeeks} disabled={settingUp}
                style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 700, background: CA_COLORS.teal, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: settingUp ? "wait" : "pointer", opacity: settingUp ? 0.7 : 1 }}>
                {settingUp ? "Setting up…" : "Set up weeks"}
              </button>
            </div>
          )}
          {!weeksLoading && weeks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {weeks.map(w => <WeekRow key={`${w.id}-v${importVersion}`} week={w} onSave={handleWeekSave} los={los} tags={loTags} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove} />)}
              <button onClick={handleAddWeek} style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 600, color: CA_COLORS.teal, background: "none", border: "none", cursor: "pointer", padding: "8px 0", textAlign: "left" }}>+ Add week</button>
            </div>
          )}
        </div>

        {/* ── Assignments section (live, Part B) ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, padding: "20px 22px" }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy, marginBottom: 14 }}>📝 Assignments</div>
          {assignmentsLoading && <div style={{ fontSize: 13, color: CA_COLORS.textSoft }}>Loading assignments…</div>}
          {!assignmentsLoading && assignments.length === 0 && <div style={{ fontSize: 13, color: CA_COLORS.textSoft, marginBottom: 10 }}>Add the assignments and assessments for this course.</div>}
          {!assignmentsLoading && topLevel.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topLevel.map(a => (
                <AssignmentCard key={`${a.id}-v${importVersion}`} assignment={a} weeks={weeks} los={los} tags={loTags} onSave={handleAssignmentSave} onDelete={handleAssignmentDelete} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove}>
                  {/* Nested steps */}
                  {childrenOf(a.id).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                      {childrenOf(a.id).map(child => (
                        <AssignmentCard key={`${child.id}-v${importVersion}`} assignment={child} weeks={weeks} los={los} tags={loTags} onSave={handleAssignmentSave} onDelete={handleAssignmentDelete} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove} />
                      ))}
                    </div>
                  )}
                  <button onClick={() => handleAddAssignment(a.id)} style={{ fontFamily: CA_FONTS.body, fontSize: 12, fontWeight: 600, color: CA_COLORS.teal, background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left", marginTop: 4 }}>+ Add step</button>
                </AssignmentCard>
              ))}
            </div>
          )}
          <button onClick={() => handleAddAssignment(null)} style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 600, color: CA_COLORS.teal, background: "none", border: "none", cursor: "pointer", padding: "8px 0", textAlign: "left", marginTop: topLevel.length > 0 ? 4 : 0 }}>+ Add assignment</button>
        </div>

      </div>

      {/* Syllabus import: loading overlay */}
      {syllabusLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000, background: CA_COLORS.ivory,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <style>{`@keyframes syllPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: CA_COLORS.teal, marginBottom: 24, animation: "syllPulse 1.4s ease-in-out infinite" }} />
          <div style={{ fontFamily: CA_FONTS.heading, fontSize: 24, fontWeight: 700, color: CA_COLORS.navy, marginBottom: 8 }}>Reading your syllabus…</div>
          <div style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.textSoft, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
            This takes about 30 seconds — we're extracting outcomes, weeks, and assignments.
          </div>
        </div>
      )}

      {/* Syllabus import: error overlay */}
      {syllabusError && !syllabusLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000, background: CA_COLORS.ivory,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📄</div>
          <div style={{ fontFamily: CA_FONTS.heading, fontSize: 22, fontWeight: 700, color: CA_COLORS.navy, marginBottom: 8, textAlign: "center", maxWidth: 440 }}>
            {syllabusError}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => { setSyllabusError(null); syllabusFileRef.current?.click(); }} style={{
              background: CA_COLORS.navy, color: "#fff", border: "none", borderRadius: 10,
              padding: "11px 24px", fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Try again</button>
            <button onClick={() => setSyllabusError(null)} style={{
              background: "transparent", color: CA_COLORS.textSoft, border: `1px solid ${CA_COLORS.border}`, borderRadius: 10,
              padding: "11px 24px", fontFamily: CA_FONTS.body, fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Syllabus import: wizard */}
      {syllabusOpen && syllabusProposals && (
        <SyllabusImportWizard
          proposals={syllabusProposals}
          currentCourse={{
            outcomes: los,
            weeks: weeks.map(w => ({ week_number: w.week_number, topic: w.topic || null })),
            assignments,
          }}
          currentNumWeeks={course.num_weeks}
          onConfirm={async (payload) => {
            const result = await writeImportPayload(course.id, payload, weeks, los);
            return result;
          }}
          onCancel={() => {
            setSyllabusOpen(false);
            setSyllabusProposals(null);
            // Re-fetch data so any writes from a partial import are visible
            if (course?.id) {
              Promise.all([
                fetchLearningOutcomes(course.id),
                fetchCourseWeeks(course.id),
                fetchAssignments(course.id),
                fetchLoTags(course.id),
              ]).then(([loRows, weekRows, asnRows, tagRows]) => {
                setLos(loRows); setWeeks(weekRows); setAssignments(asnRows); setLoTags(tagRows);
                setImportVersion(v => v + 1);
              }).catch(e => console.error("[CourseSetup] Re-fetch after import:", e.message));
            }
          }}
        />
      )}
    </div>
  );
}
