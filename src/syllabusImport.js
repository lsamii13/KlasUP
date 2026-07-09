import {
  insertLearningOutcome, getNextLoNumber,
  addCourseWeek, updateCourseWeek, updateCourseWeekDeep, updateCourseNumWeeks,
  insertAssignment, addLoTag,
} from "./supabase";

const DEEP_KEYS = ["weekly_outcomes", "readings", "lecture_topic", "activities", "discussion_board", "wellness_note"];

function isEmpty(val) {
  if (val == null) return true;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "string") return val.trim() === "";
  return false;
}

export async function writeImportPayload(courseId, payload, existingWeeks, existingOutcomes) {
  const counts = { outcomes: 0, weeksUpdated: 0, weeksCreated: 0, assignments: 0, tags: 0 };
  let extendedTo = null;

  // Build week_number → existing row map
  const weekMap = {};
  for (const w of existingWeeks) weekMap[w.week_number] = w;

  // Proposal code → inserted outcome id (for tag resolution)
  const codeToId = {};

  try {
    // ── 1. OUTCOMES ──
    let nextNum = await getNextLoNumber(courseId);
    const sortBase = existingOutcomes.length;

    for (let i = 0; i < payload.outcomes.length; i++) {
      const o = payload.outcomes[i];
      const code = `LO${nextNum}`;
      const row = await insertLearningOutcome(courseId, {
        code,
        label: o.label,
        fullText: o.full_text || null,
        sortOrder: sortBase + i,
        category: 'outcome',
      });
      codeToId[o.code] = row.id;
      nextNum++;
      counts.outcomes++;
    }

    // ── 2. WEEKS ──
    // Determine the highest accepted week number
    const acceptedWeekNums = payload.weeks.map(w => w.week_number);
    const highestAccepted = acceptedWeekNums.length > 0 ? Math.max(...acceptedWeekNums) : 0;
    const existingMax = existingWeeks.length > 0 ? Math.max(...existingWeeks.map(w => w.week_number)) : 0;

    // Create missing week rows up to highestAccepted
    if (highestAccepted > existingMax) {
      for (let n = existingMax + 1; n <= highestAccepted; n++) {
        const row = await addCourseWeek(courseId, n);
        weekMap[n] = row;
        counts.weeksCreated++;
      }
      await updateCourseNumWeeks(courseId, highestAccepted);
      extendedTo = highestAccepted;
    }

    for (const pw of payload.weeks) {
      const existing = weekMap[pw.week_number];
      if (!existing) continue;

      // topic: write syllabus value only if choice is "syllabus" or existing is empty
      const topicFields = {};
      if (pw._topicChoice === "yours") {
        // leave untouched
      } else if (pw._topicChoice === "syllabus" || isEmpty(existing.topic)) {
        if (pw.topic) topicFields.topic = pw.topic;
      }

      // detail: fill-empty only, and never duplicate the topic
      if (isEmpty(existing.detail) && pw.detail) {
        const d = pw.detail.trim().toLowerCase();
        const dupProposed = pw.topic && d === pw.topic.trim().toLowerCase();
        const dupExisting = existing.topic && d === existing.topic.trim().toLowerCase();
        if (!dupProposed && !dupExisting) {
          topicFields.detail = pw.detail;
        }
      }

      // is_milestone: only ever set true
      if (pw.is_milestone && !existing.is_milestone) {
        topicFields.is_milestone = true;
      }

      if (Object.keys(topicFields).length > 0) {
        const updated = await updateCourseWeek(existing.id, topicFields);
        weekMap[pw.week_number] = updated;
      }

      // Deep fields: fill-empty per field
      const deepFields = {};
      for (const key of DEEP_KEYS) {
        const proposed = pw[key];
        if (proposed == null) continue;
        if (Array.isArray(proposed) && proposed.length === 0) continue;
        if (typeof proposed === "string" && proposed.trim() === "") continue;
        if (isEmpty(existing[key])) {
          deepFields[key] = proposed;
        }
      }

      if (Object.keys(deepFields).length > 0) {
        const updated = await updateCourseWeekDeep(existing.id, deepFields);
        weekMap[pw.week_number] = updated;
      }

      counts.weeksUpdated++;
    }

    // ── 3. ASSIGNMENTS ──
    for (const a of payload.assignments) {
      const weekId = a.due_week ? (weekMap[a.due_week]?.id || null) : null;
      const row = await insertAssignment(courseId, {
        title: a.title,
        assignmentType: a.assignment_type,
        description: a.description || null,
        dueDate: a.due_date_text || null,
        weekId,
        parentAssignmentId: null,
      });
      counts.assignments++;

      // LO tags
      if (a.suggested_lo_codes && a.suggested_lo_codes.length > 0) {
        for (const loCode of a.suggested_lo_codes) {
          const loId = codeToId[loCode];
          if (loId) {
            await addLoTag(loId, "assignment", row.id);
            counts.tags++;
          }
        }
      }
    }

    return { counts, extendedTo, error: null };
  } catch (err) {
    return { counts, extendedTo, error: err.message || "Unknown error during import" };
  }
}
