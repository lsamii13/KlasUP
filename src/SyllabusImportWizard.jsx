import { useState, useEffect, useCallback } from "react";

const C = {
  navy: "#1B2B4B", teal: "#2A9D8F", tealSoft: "#EAF5F3", ivory: "#FAF7F2",
  textSoft: "#5a6a85", border: "#e8edf3", white: "#fff", gold: "#D4A574",
  goldSoft: "rgba(212,165,116,0.15)", rose: "#E89B7E",
};
const F = { heading: "'Bricolage Grotesque', sans-serif", body: "'Manrope', sans-serif" };

const STEPS = ["outcomes", "weeks", "assignments", "confirm"];
const STEP_LABELS = { outcomes: "Outcomes", weeks: "Weeks", assignments: "Assignments", confirm: "Confirm" };

const DEEP_FIELDS = [
  { key: "weekly_outcomes", label: "Weekly outcomes" },
  { key: "readings", label: "Readings" },
  { key: "lecture_topic", label: "Lecture topic" },
  { key: "activities", label: "Activities" },
  { key: "discussion_board", label: "Discussion board" },
  { key: "wellness_note", label: "Wellness note" },
];

function LowBadge() {
  return (
    <span style={{ background: C.goldSoft, color: C.gold, fontSize: 10, fontWeight: 700, fontFamily: F.body, padding: "2px 8px", borderRadius: 8, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
      low confidence
    </span>
  );
}

function TypePill({ type }) {
  return <span style={{ background: C.tealSoft, color: C.teal, fontSize: 10, fontWeight: 700, fontFamily: F.heading, padding: "2px 9px", borderRadius: 10, letterSpacing: "0.3px" }}>{type}</span>;
}

function LoPill({ code }) {
  return <span style={{ background: C.tealSoft, color: C.teal, fontSize: 10, fontWeight: 700, fontFamily: F.heading, padding: "2px 8px", borderRadius: 8, letterSpacing: "0.3px" }}>{code}</span>;
}

function ProgressBar({ stepIndex }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= stepIndex ? C.teal : C.border, transition: "background 0.3s" }} />
      ))}
    </div>
  );
}

function ConflictPicker({ yours, syllabus, selected, onSelect }) {
  const card = (label, value, isSelected) => (
    <div
      onClick={() => onSelect(value === yours ? "yours" : "syllabus")}
      style={{
        flex: 1, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
        border: `2px solid ${isSelected ? C.teal : C.border}`,
        background: isSelected ? C.tealSoft : C.white,
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>{value}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
      {card("Yours", yours, selected === "yours")}
      {card("Syllabus", syllabus, selected === "syllabus")}
    </div>
  );
}

function MissingSectionInterstitial({ sectionName, onSkip }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
      <div style={{ fontFamily: F.heading, fontSize: 22, color: C.navy, marginBottom: 8 }}>
        We couldn't find {sectionName} in this document.
      </div>
      <div style={{ fontSize: 14, color: C.textSoft, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
        The syllabus may not contain this section, or the AI couldn't identify it. You can add these manually later.
      </div>
      <button onClick={onSkip} style={{
        background: C.navy, color: C.white, border: "none", borderRadius: 10,
        padding: "12px 28px", fontFamily: F.body, fontWeight: 700, fontSize: 14, cursor: "pointer",
      }}>Skip this step →</button>
    </div>
  );
}

export default function SyllabusImportWizard({ proposals, currentCourse, onConfirm, onCancel }) {
  const [step, setStep] = useState(0);

  // ── Outcomes state ──
  const [outcomeChecked, setOutcomeChecked] = useState(() =>
    Object.fromEntries(proposals.outcomes.map((o, i) => [i, o.confidence === "high"]))
  );
  const [outcomeEdits, setOutcomeEdits] = useState(() =>
    Object.fromEntries(proposals.outcomes.map((o, i) => [i, { label: o.label, full_text: o.full_text }]))
  );
  const [editingOutcome, setEditingOutcome] = useState(null);

  // ── Weeks state ──
  const [weekChecked, setWeekChecked] = useState(() =>
    Object.fromEntries(proposals.weeks.map((w, i) => [i, w.confidence === "high"]))
  );
  const [weekExpanded, setWeekExpanded] = useState({});
  const [removedDeepFields, setRemovedDeepFields] = useState({});
  const [conflictChoices, setConflictChoices] = useState(() => {
    const choices = {};
    for (const pw of proposals.weeks) {
      const cw = currentCourse.weeks.find(w => w.week_number === pw.week_number);
      if (cw?.topic && pw.topic && cw.topic !== pw.topic) {
        choices[pw.week_number] = "yours";
      }
    }
    return choices;
  });

  // ── Assignments state ──
  const [asnChecked, setAsnChecked] = useState(() =>
    Object.fromEntries(proposals.assignments.map((a, i) => [i, a.confidence === "high"]))
  );
  const [asnEdits, setAsnEdits] = useState(() =>
    Object.fromEntries(proposals.assignments.map((a, i) => [i, { title: a.title, description: a.description }]))
  );
  const [editingAsn, setEditingAsn] = useState(null);

  // ── Escape to cancel ──
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  // ── Helpers ──
  const currentStep = STEPS[step];
  const isMissing = (sectionKey) => {
    if (proposals.missing_sections.includes(sectionKey)) return true;
    if (sectionKey === "outcomes" && proposals.outcomes.length === 0) return true;
    if (sectionKey === "weeks" && proposals.weeks.length === 0) return true;
    if (sectionKey === "assignments" && proposals.assignments.length === 0) return true;
    return false;
  };

  const hasConflict = (weekNumber) => conflictChoices[weekNumber] !== undefined;
  const getConflictCurrent = (weekNumber) => currentCourse.weeks.find(w => w.week_number === weekNumber)?.topic;

  const toggleDeepField = (weekIdx, fieldKey, entryIdx) => {
    const k = `${weekIdx}-${fieldKey}-${entryIdx}`;
    setRemovedDeepFields(prev => ({ ...prev, [k]: !prev[k] }));
  };
  const isDeepFieldRemoved = (weekIdx, fieldKey, entryIdx) => !!removedDeepFields[`${weekIdx}-${fieldKey}-${entryIdx}`];

  // ── Build payload ──
  const buildPayload = useCallback(() => {
    const outcomes = proposals.outcomes
      .map((o, i) => outcomeChecked[i] ? { ...o, ...outcomeEdits[i] } : null)
      .filter(Boolean);

    const weeks = proposals.weeks
      .map((w, i) => {
        if (!weekChecked[i]) return null;
        const result = { ...w };
        if (hasConflict(w.week_number)) {
          result._topicChoice = conflictChoices[w.week_number];
          if (conflictChoices[w.week_number] === "yours") {
            result.topic = getConflictCurrent(w.week_number);
          }
        }
        for (const df of DEEP_FIELDS) {
          const val = w[df.key];
          if (Array.isArray(val)) {
            result[df.key] = val.filter((_, ei) => !isDeepFieldRemoved(i, df.key, ei));
          } else if (typeof val === "string" && val) {
            if (isDeepFieldRemoved(i, df.key, 0)) result[df.key] = null;
          }
        }
        return result;
      })
      .filter(Boolean);

    const assignments = proposals.assignments
      .map((a, i) => asnChecked[i] ? { ...a, ...asnEdits[i] } : null)
      .filter(Boolean);

    return { outcomes, weeks, assignments };
  }, [proposals, outcomeChecked, outcomeEdits, weekChecked, conflictChoices, removedDeepFields, asnChecked, asnEdits]);

  // ── Counts ──
  const checkedOutcomes = Object.values(outcomeChecked).filter(Boolean).length;
  const checkedWeeks = Object.values(weekChecked).filter(Boolean).length;
  const checkedAsn = Object.values(asnChecked).filter(Boolean).length;
  const totalItems = proposals.outcomes.length + proposals.weeks.length + proposals.assignments.length;
  const totalChecked = checkedOutcomes + checkedWeeks + checkedAsn;
  const skippedCount = totalItems - totalChecked;

  // ── Shared styles ──
  const navBtn = (label, opts = {}) => (
    <button
      onClick={opts.onClick}
      disabled={opts.disabled}
      style={{
        background: opts.primary ? C.teal : opts.navy ? C.navy : "transparent",
        color: opts.primary ? C.white : opts.navy ? C.white : C.textSoft,
        border: opts.primary || opts.navy ? "none" : `1px solid ${C.border}`,
        borderRadius: 10, padding: "11px 24px", fontFamily: F.body, fontWeight: 700,
        fontSize: 14, cursor: opts.disabled ? "default" : "pointer",
        opacity: opts.disabled ? 0.4 : 1, transition: "opacity 0.15s",
      }}
    >{label}</button>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, background: C.ivory,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 28px 0", flexShrink: 0,
      }}>
        <h1 style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 24, color: C.navy, margin: 0 }}>
          Import from syllabus
        </h1>
        <button onClick={onCancel} aria-label="Cancel" style={{
          background: "none", border: "none", fontSize: 22, color: C.textSoft,
          cursor: "pointer", padding: "4px 8px", lineHeight: 1,
        }}>✕</button>
      </div>

      <div style={{ padding: "16px 28px 0", flexShrink: 0 }}>
        <ProgressBar stepIndex={step} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 28px 28px" }}>

        {/* ── STEP 1: OUTCOMES ── */}
        {currentStep === "outcomes" && (
          isMissing("outcomes") ? (
            <MissingSectionInterstitial sectionName="learning outcomes" onSkip={() => setStep(1)} />
          ) : (
            <div>
              <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 18, color: C.navy, marginBottom: 4 }}>Learning Outcomes</div>
              <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 18 }}>Check the outcomes to import. Edit any before importing.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 700 }}>
                {proposals.outcomes.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "14px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <input type="checkbox" checked={!!outcomeChecked[i]} onChange={() => setOutcomeChecked(p => ({ ...p, [i]: !p[i] }))} style={{ accentColor: C.teal, marginTop: 3, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingOutcome === i ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <input value={outcomeEdits[i].label} onChange={e => setOutcomeEdits(p => ({ ...p, [i]: { ...p[i], label: e.target.value } }))}
                            style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", color: C.navy, background: C.ivory }} />
                          <textarea value={outcomeEdits[i].full_text || ""} onChange={e => setOutcomeEdits(p => ({ ...p, [i]: { ...p[i], full_text: e.target.value } }))} rows={2}
                            style={{ fontFamily: F.body, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", color: C.navy, background: C.ivory, resize: "vertical" }} />
                          <button onClick={() => setEditingOutcome(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.teal, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F.body }}>Done editing</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ background: C.tealSoft, color: C.teal, fontFamily: F.heading, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{o.code}</span>
                            <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.navy }}>{outcomeEdits[i].label}</span>
                            {o.confidence === "low" && <LowBadge />}
                          </div>
                          {outcomeEdits[i].full_text && (
                            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4, lineHeight: 1.5 }}>{outcomeEdits[i].full_text}</div>
                          )}
                        </>
                      )}
                    </div>
                    {editingOutcome !== i && (
                      <button onClick={() => setEditingOutcome(i)} title="Edit" style={{ background: "none", border: "none", fontSize: 13, color: C.textSoft, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>✎</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* ── STEP 2: WEEKS ── */}
        {currentStep === "weeks" && (
          isMissing("weeks") ? (
            <MissingSectionInterstitial sectionName="a weekly schedule" onSkip={() => setStep(2)} />
          ) : (
            <div>
              <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 18, color: C.navy, marginBottom: 4 }}>Weekly Schedule</div>
              <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 18 }}>Review the proposed week topics. Expand any week to review details.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 700 }}>
                {proposals.weeks.map((w, i) => {
                  const conflict = hasConflict(w.week_number);
                  const expanded = !!weekExpanded[i];
                  const hasDeep = DEEP_FIELDS.some(df => {
                    const v = w[df.key];
                    return Array.isArray(v) ? v.length > 0 : !!v;
                  });
                  return (
                    <div key={i} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                        <input type="checkbox" checked={!!weekChecked[i]} onChange={() => setWeekChecked(p => ({ ...p, [i]: !p[i] }))} style={{ accentColor: C.teal, flexShrink: 0 }} />
                        <span style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 13, color: w.is_milestone ? C.rose : C.teal, minWidth: 60 }}>
                          Week {w.week_number}{w.is_milestone ? " ★" : ""}
                        </span>
                        <span style={{ flex: 1, fontSize: 14, color: C.navy, fontWeight: 500 }}>{w.topic || <span style={{ color: C.textSoft, fontStyle: "italic" }}>No topic</span>}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                          {conflict && <span style={{ background: "rgba(212,165,116,0.2)", color: C.gold, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>topic conflict</span>}
                          {w.confidence === "low" && <LowBadge />}
                          {hasDeep && (
                            <button onClick={() => setWeekExpanded(p => ({ ...p, [i]: !p[i] }))} style={{ background: "none", border: "none", fontSize: 11, color: C.textSoft, cursor: "pointer", padding: "2px 6px" }}>
                              {expanded ? "▲" : "▼"}
                            </button>
                          )}
                        </div>
                      </div>
                      {conflict && weekChecked[i] && (
                        <div style={{ padding: "0 16px 10px 42px" }}>
                          <ConflictPicker
                            yours={getConflictCurrent(w.week_number)}
                            syllabus={w.topic}
                            selected={conflictChoices[w.week_number]}
                            onSelect={(choice) => setConflictChoices(p => ({ ...p, [w.week_number]: choice }))}
                          />
                        </div>
                      )}
                      {expanded && (
                        <div style={{ padding: "0 16px 14px 42px", borderTop: `1px solid ${C.border}` }}>
                          {w.detail && <div style={{ fontSize: 13, color: C.textSoft, margin: "10px 0 8px", lineHeight: 1.5 }}>{w.detail}</div>}
                          {DEEP_FIELDS.map(df => {
                            const val = w[df.key];
                            if (!val) return null;
                            if (Array.isArray(val) && val.length === 0) return null;
                            const entries = Array.isArray(val) ? val : [val];
                            return (
                              <div key={df.key} style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{df.label}</div>
                                {entries.map((entry, ei) => {
                                  const removed = isDeepFieldRemoved(i, df.key, ei);
                                  return (
                                    <div key={ei} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                                      <span style={{ fontSize: 13, color: removed ? C.textSoft : C.navy, textDecoration: removed ? "line-through" : "none", flex: 1 }}>{entry}</span>
                                      {removed ? (
                                        <button onClick={() => toggleDeepField(i, df.key, ei)} style={{ background: "none", border: "none", fontSize: 11, color: C.teal, cursor: "pointer", fontFamily: F.body, fontWeight: 600 }}>undo</button>
                                      ) : (
                                        <button onClick={() => toggleDeepField(i, df.key, ei)} title="Remove" style={{ background: "none", border: "none", fontSize: 12, color: C.textSoft, cursor: "pointer", padding: "0 4px" }}>✕</button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* ── STEP 3: ASSIGNMENTS ── */}
        {currentStep === "assignments" && (
          isMissing("assignments") ? (
            <MissingSectionInterstitial sectionName="assignments" onSkip={() => setStep(3)} />
          ) : (
            <div>
              <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 18, color: C.navy, marginBottom: 4 }}>Assignments</div>
              <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 18 }}>Review the assignments found in the syllabus.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 700 }}>
                {proposals.assignments.map((a, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <input type="checkbox" checked={!!asnChecked[i]} onChange={() => setAsnChecked(p => ({ ...p, [i]: !p[i] }))} style={{ accentColor: C.teal, marginTop: 3, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingAsn === i ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <input value={asnEdits[i].title} onChange={e => setAsnEdits(p => ({ ...p, [i]: { ...p[i], title: e.target.value } }))}
                              style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", color: C.navy, background: C.ivory }} />
                            <textarea value={asnEdits[i].description || ""} onChange={e => setAsnEdits(p => ({ ...p, [i]: { ...p[i], description: e.target.value } }))} rows={2}
                              style={{ fontFamily: F.body, fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", color: C.navy, background: C.ivory, resize: "vertical" }} />
                            <button onClick={() => setEditingAsn(null)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.teal, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F.body }}>Done editing</button>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.navy }}>{asnEdits[i].title}</span>
                              <TypePill type={a.assignment_type} />
                              {a.confidence === "low" && <LowBadge />}
                            </div>
                            {asnEdits[i].description && (
                              <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.5, marginBottom: 6 }}>{asnEdits[i].description}</div>
                            )}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                              {a.due_date_text && <span style={{ fontSize: 12, color: C.navy }}>Due: {a.due_date_text}</span>}
                              {a.due_week && <span style={{ fontSize: 12, color: C.textSoft }}>Week {a.due_week}</span>}
                              {a.suggested_lo_codes.length > 0 && a.suggested_lo_codes.map(c => <LoPill key={c} code={c} />)}
                            </div>
                          </>
                        )}
                      </div>
                      {editingAsn !== i && (
                        <button onClick={() => setEditingAsn(i)} title="Edit" style={{ background: "none", border: "none", fontSize: 13, color: C.textSoft, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>✎</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* ── STEP 4: CONFIRM ── */}
        {currentStep === "confirm" && (
          <div style={{ maxWidth: 520, margin: "2rem auto", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: F.heading, fontWeight: 700, fontSize: 24, color: C.navy, marginBottom: 12 }}>
              Ready to add
            </div>
            <div style={{ fontSize: 16, color: C.navy, lineHeight: 1.6, marginBottom: 8 }}>
              {checkedOutcomes} outcome{checkedOutcomes !== 1 ? "s" : ""} · {checkedWeeks} week update{checkedWeeks !== 1 ? "s" : ""} · {checkedAsn} assignment{checkedAsn !== 1 ? "s" : ""}
              {skippedCount > 0 && <span style={{ color: C.textSoft }}> · {skippedCount} item{skippedCount !== 1 ? "s" : ""} skipped</span>}
            </div>
            <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 32 }}>Nothing has been written yet.</div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 28px", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0,
      }}>
        <div>
          {navBtn("← Back", { onClick: () => setStep(s => s - 1), disabled: step === 0 })}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft }}>
          {STEP_LABELS[currentStep]} ({step + 1} of {STEPS.length})
        </div>
        <div>
          {currentStep === "confirm"
            ? navBtn("Add to my course", { primary: true, onClick: () => onConfirm(buildPayload()) })
            : navBtn(`Next: ${STEP_LABELS[STEPS[step + 1]]} →`, { navy: true, onClick: () => setStep(s => s + 1) })
          }
        </div>
      </div>
    </div>
  );
}
