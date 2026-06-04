import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCourseWeeks, generateWeekSkeleton, updateCourseWeek,
  addCourseWeek, updateCourseNumWeeks,
  fetchLearningOutcomes, insertLearningOutcome, updateLearningOutcome,
  deleteLearningOutcome, reorderLearningOutcomes,
  fetchAssignments, insertAssignment, updateAssignment, deleteAssignment,
  fetchLoTags, addLoTag, removeLoTag,
} from "../supabase";
import SyllabusImportWizard from "../SyllabusImportWizard";
import { mockProposals, mockCurrentCourse } from "../mockSyllabusProposals";

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

// ── Reusable LO Tagger (Part C) ─────────────────────────
function LoTagger({ taggableType, taggableId, los, tags, onAdd, onRemove }) {
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
    const idx = los.findIndex(lo => lo.id === loId);
    return idx >= 0 ? `LO${idx + 1}` : "LO?";
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
                <span style={{ fontWeight: 700, color: CA_COLORS.teal, marginRight: 2 }}>LO{i + 1}</span>
                {lo.label || "(untitled)"}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
function LORow({ lo, index, total, onSave, onMove, onDelete }) {
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

  const code = `LO${index + 1}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 16px", background: "#fff", borderRadius: 10, border: `1px solid ${CA_COLORS.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ background: CA_COLORS.tealSoft, color: CA_COLORS.teal, fontFamily: CA_FONTS.heading, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 10, letterSpacing: "0.3px", flexShrink: 0 }}>{code}</span>
        <input ref={labelRef} value={label} onChange={e => setLabel(e.target.value)} onBlur={handleLabelBlur} onKeyDown={enterToSave} placeholder="Outcome label (e.g. Marketing principles)"
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
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [syllabusToast, setSyllabusToast] = useState(false);

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

  // ── LO handlers (unchanged from Stage 3) ──────────────
  const persistOrder = useCallback(async (items) => {
    const updates = items.map((lo, i) => ({ id: lo.id, sort_order: i, code: `LO${i + 1}` }));
    try { await reorderLearningOutcomes(updates); } catch (e) { console.error("[CourseSetup] Reorder failed:", e.message); }
  }, []);

  const handleLOSave = useCallback(async (loId, fields) => {
    try { const updated = await updateLearningOutcome(loId, fields); setLos(prev => prev.map(lo => lo.id === loId ? updated : lo)); } catch (e) { console.error("[CourseSetup] LO save failed:", e.message); }
  }, []);

  const handleLOMove = useCallback(async (fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    setLos(prev => {
      const next = [...prev];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      const renumbered = next.map((lo, i) => ({ ...lo, sort_order: i, code: `LO${i + 1}` }));
      persistOrder(renumbered);
      return renumbered;
    });
  }, [persistOrder]);

  const handleLODelete = useCallback(async (loId) => {
    if (!window.confirm("Delete this outcome? It will be removed from any weeks or assignments it's tagged to.")) return;
    try {
      await deleteLearningOutcome(loId);
      setLos(prev => {
        const remaining = prev.filter(lo => lo.id !== loId);
        const renumbered = remaining.map((lo, i) => ({ ...lo, sort_order: i, code: `LO${i + 1}` }));
        persistOrder(renumbered);
        return renumbered;
      });
      setLoTags(prev => prev.filter(t => t.learning_outcome_id !== loId));
    } catch (e) { console.error("[CourseSetup] LO delete failed:", e.message); }
  }, [persistOrder]);

  const handleAddLO = useCallback(async () => {
    if (!course?.id) return;
    const sortOrder = los.length;
    const code = `LO${sortOrder + 1}`;
    try { const row = await insertLearningOutcome(course.id, { code, label: "", fullText: null, sortOrder }); setLos(prev => [...prev, row]); } catch (e) { console.error("[CourseSetup] Add LO failed:", e.message); }
  }, [course?.id, los.length]);

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
        {/* Enable in production in Stage 3 */}
        {import.meta.env.DEV && (
          <button onClick={() => setSyllabusOpen(true)} style={{
            background: "none", border: `1px solid ${CA_COLORS.border}`, borderRadius: 8,
            padding: "5px 12px", fontSize: 12, fontWeight: 600, fontFamily: CA_FONTS.body,
            color: CA_COLORS.teal, cursor: "pointer", whiteSpace: "nowrap", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = CA_COLORS.teal}
            onMouseLeave={e => e.currentTarget.style.borderColor = CA_COLORS.border}
          >📄 Import from syllabus</button>
        )}
        {syllabusToast && <span style={{ fontSize: 12, color: CA_COLORS.teal, fontWeight: 600 }}>Demo mode — nothing was written</span>}
      </div>
      <p style={{ fontFamily: CA_FONTS.body, fontSize: 14, color: CA_COLORS.textSoft, margin: "4px 0 28px" }}>{courseLabel}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>

        {/* ── Learning Outcomes section (live) ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${CA_COLORS.border}`, padding: "20px 22px" }}>
          <div style={{ fontFamily: CA_FONTS.heading, fontWeight: 700, fontSize: 17, color: CA_COLORS.navy, marginBottom: 14 }}>🎯 Learning Outcomes</div>
          {losLoading && <div style={{ fontSize: 13, color: CA_COLORS.textSoft }}>Loading outcomes…</div>}
          {!losLoading && los.length === 0 && <div style={{ fontSize: 13, color: CA_COLORS.textSoft, marginBottom: 10 }}>Add your course learning outcomes — these are the backbone everything else maps to.</div>}
          {!losLoading && los.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {los.map((lo, i) => <LORow key={lo.id} lo={lo} index={i} total={los.length} onSave={handleLOSave} onMove={handleLOMove} onDelete={handleLODelete} />)}
            </div>
          )}
          <button onClick={handleAddLO} style={{ fontFamily: CA_FONTS.body, fontSize: 13, fontWeight: 600, color: CA_COLORS.teal, background: "none", border: "none", cursor: "pointer", padding: "8px 0", textAlign: "left", marginTop: los.length > 0 ? 4 : 0 }}>+ Add outcome</button>
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
              {weeks.map(w => <WeekRow key={w.id} week={w} onSave={handleWeekSave} los={los} tags={loTags} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove} />)}
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
                <AssignmentCard key={a.id} assignment={a} weeks={weeks} los={los} tags={loTags} onSave={handleAssignmentSave} onDelete={handleAssignmentDelete} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove}>
                  {/* Nested steps */}
                  {childrenOf(a.id).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                      {childrenOf(a.id).map(child => (
                        <AssignmentCard key={child.id} assignment={child} weeks={weeks} los={los} tags={loTags} onSave={handleAssignmentSave} onDelete={handleAssignmentDelete} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove} />
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

      {syllabusOpen && (
        <SyllabusImportWizard
          proposals={mockProposals}
          currentCourse={mockCurrentCourse}
          onConfirm={(payload) => {
            console.log("SYLLABUS IMPORT PAYLOAD", payload);
            setSyllabusOpen(false);
            setSyllabusToast(true);
            setTimeout(() => setSyllabusToast(false), 4000);
          }}
          onCancel={() => setSyllabusOpen(false)}
        />
      )}
    </div>
  );
}
