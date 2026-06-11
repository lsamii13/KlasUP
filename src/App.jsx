import { useState, useEffect, useCallback, useRef } from "react";
import Landing from "./Landing";
import ResearchLibrary from "./ResearchLibrary";
import BetaAgreement from "./BetaAgreement";
import OnboardingTour from "./components/OnboardingTour";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import StudentVoicePage from "./pages/StudentVoicePage";
import CourseArchitect from "./pages/CourseArchitect";
import CourseSetup from "./pages/CourseSetup";
import PageHeader from "./components/PageHeader";
import FeatureInfo from "./components/FeatureInfo";
import NotifyMeForm from "./components/NotifyMeForm";
import GuidePage from "./pages/GuidePage";

/* ── Window width hook for responsive ── */
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}
import Terms from "./Terms";
import Logo, { LogoMark } from "./Logo";
import VoiceMic from "./VoiceMic";
import { generateMicroLearning, generateSemesterReflection, generateAssignmentDoc, updateAssignmentDoc, generatePptPlan, updatePptPlan, sendSageChat, searchResearchArticles, embedAllArticles } from "./anthropic";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } from "docx";
import PptxGenJS from "pptxgenjs";
import extractFileText from "./extractFileText";
import {
  supabase, signUp, signIn, signOut, getSession, onAuthStateChange,
  fetchProfile, upsertProfile, updateLastActive, uploadProfilePhoto,
  checkSubscriptionStatus, downgradeExpiredUser,
  fetchCourses, insertCourse, updateCourse as updateCourseDB, deleteCourse as deleteCourseDB,
  resetPassword, updatePassword,
  trackEvent, logSecurityEvent,
  fetchActiveAnnouncements, dismissAnnouncement,
  adminFetchAllUsers, adminUpdateUserRole, adminSetSubscription,
  adminCreateTestUser, adminResetTestUser, adminCreateAnnouncement,
  adminFetchUsageStats, adminFetchFunnel,
  requestDataDeletion,
  keywordSearchArticles, fetchArticlesByDimension, fetchArticleById,
  insertUpload, fetchUploads, uploadDocument,
  insertMicroLearning, fetchMicroLearnings,
  upsertReflection, fetchReflection,
  insertWellnessCheckin, updateWellnessCheckin, fetchRecentCheckins, fetchTodayCheckin,
  upsertKlasOtherResponse, getPromotedKlasOptions,
} from "./supabase";

const C = {
  navy: "#1B2B4B", navyMid: "#1A3260", navyLight: "#243D75",
  teal: "#0B8A8A", tealBright: "#0FB5B5", tealLight: "#D6F5F5", tealMid: "#7FE0E0",
  ivory: "#FAF8F4", ivoryDark: "#F0EDE6",
  rose: "#C4687A", roseLight: "#FBEAF0",
  sage: "#5A8A62", sageLight: "#E6F4E8",
  gold: "#B8860B", goldLight: "#FFF8E7",
  purple: "#6B4E9B", purpleLight: "#F0EBF8",
  text: "#0F1F3D", muted: "#4A5568",
  white: "#FFFFFF", border: "rgba(15,31,61,0.12)",
  lock: "#B0A8A0",
};

const F = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
  accent: "'Manrope', sans-serif",
};

const WEEKS = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);
const NAV = [
  // Top-level
  { id: "Dashboard", icon: "⊞" },
  { id: "Course Architect", icon: "🏛️", adminOnly: true },
  { id: "Wellness", icon: "🌿" },
  { id: "Student Voice", icon: "🎤" },
  // Learning Hub
  { id: "Micro-Learning", icon: "◉", cluster: "LEARNING HUB" },
  { id: "Pedagogical Resources", icon: "⊡" },
  { id: "Think Tank", icon: "◈" },
  // The Vault
  { id: "Course Portfolio", icon: "◆", cluster: "THE VAULT" },
  { id: "Reports", icon: "☑" },
  { id: "Settings", icon: "⚙" },
  // Outside clusters
  { id: "Guide", icon: "📖" },
  { id: "Pricing", icon: "◇" },
  { id: "Admin", icon: "⛨", adminOnly: true },
  // Hidden from sidebar when Course Architect is accessible (still renderable as pages)
  { id: "Pedagogy Studio", icon: "◎", hiddenViaCourseArchitect: true },
  { id: "Slide Studio", icon: "◫", hiddenViaCourseArchitect: true },
];


const MICRO = [
  { tag: "Active Learning", title: "Low-stakes retrieval boosts long-term retention", summary: "Brief retrieval practice at class start improves long-term retention by up to 50% vs re-reading.", article: "Roediger & Karpicke (2006). Psychological Science.", action: "Open next class with a 3-question retrieval quiz.", tier: "pro", color: C.sage, bg: C.sageLight },
  { tag: "Socratic Seminar", title: "Inquiry-based prompts deepen discussion quality", summary: "Open-ended challenge prompts posted before the week see 34% higher substantive reply rates.", article: "Garrison et al. (2010). Internet & Higher Education.", action: "Reframe your next prompt as an unresolved question.", tier: "free", color: C.teal, bg: C.tealLight },
  { tag: "UDL", title: "Multimodal content expands access and engagement", summary: "Courses in three or more formats show higher completion across diverse learners.", article: "Rose & Meyer (2002). Teaching Every Student. ASCD.", action: "Add one audio or video alternative to a text-heavy module.", tier: "pro", color: C.rose, bg: C.roseLight },
  { tag: "Reflection", title: "Exit tickets improve student self-regulation", summary: "Weekly metacognitive prompts reduce exam anxiety and improve self-directed study.", article: "Flavell (1979). American Psychologist.", action: "Add a two-question exit ticket: What clicked? What didn't?", tier: "pro", color: C.rose, bg: C.roseLight },
  { tag: "Flipped Classroom", title: "Pre-class content shifts time to application", summary: "Flipped classrooms show 19% improvement in exam performance with well-scaffolded pre-class materials.", article: "Bishop & Verleger (2013). ASEE Annual Conference.", action: "Upload one pre-class video and redesign that session as a workshop.", tier: "pro", color: C.sage, bg: C.sageLight },
  { tag: "Student Voice", title: "Mid-term check-ins reverse disengagement", summary: "Collecting mid-term feedback and visibly acting on it signals to students that their experience matters, which supports engagement and retention.", action: "Run a 3-question anonymous pulse survey and share one change you made.", tier: "pro", color: C.gold, bg: C.goldLight },
];

const UPLOADS = [
  { label: "Learning Outcomes", icon: "🎯", desc: "Syllabus & course outcomes", tier: "pro" },
  { label: "Announcements", icon: "📢", desc: "Posted announcements", tier: "free" },
  { label: "Discussions", icon: "💬", desc: "Discussion prompts & threads", tier: "pro" },
  { label: "Assignments", icon: "📝", desc: "Assignment sheets & rubrics", tier: "pro" },
  { label: "Student Voice", icon: "🗣", desc: "Anonymized mid-term themes", tier: "pro" },
  { label: "Post-class notes", icon: "✏", desc: "Reflections after each session", tier: "free" },
];
// Icon lookup for historical uploads (categories no longer in the selectable list)
const LEGACY_CATEGORY_ICONS = { "PowerPoints": "📊" };

const UPLOAD_PLACEHOLDERS = {
  "Post-class notes": "What worked well today? What fell flat? Where did students seem lost or disengaged?",
  "Announcements": "Paste your announcement here, or describe what you communicated to students this week.",
  "Assignments": "Paste your assignment instructions. What are students supposed to produce? What does success look like?",
  "Discussions": "Paste your discussion prompt here, or describe what you posted and how students responded.",
  "Learning Outcomes": "Paste your course learning outcomes or syllabus goals here.",
  "Student Voice": "Share anonymized themes from student feedback — what are they saying about the course?",
};

const WRITING_PROMPTS = {
  "Post-class notes": [
    "What moment in class today surprised you — either positively or negatively?",
    "If you could re-teach one part of today's session, what would you change?",
    "Were there any questions from students that made you rethink your approach?",
    "What percentage of students seemed actively engaged today? What were the rest doing?",
  ],
  "Announcements": [
    "What's the most important thing students need to know this week?",
    "Is there a deadline, resource, or change in schedule to communicate?",
    "How are you framing upcoming expectations — tone matters.",
  ],
  "Assignments": [
    "What exactly should students submit? Be specific about format and length.",
    "What does an A-level submission look like vs. a C-level one?",
    "Are there checkpoints or drafts before the final due date?",
  ],
  "Discussions": [
    "What's the open-ended question students are wrestling with?",
    "How many replies are you expecting, and what counts as substantive?",
    "Are students building on each other's posts or just posting in isolation?",
  ],
  "Learning Outcomes": [
    "What should students be able to DO (not just know) by the end of the course?",
    "Which outcomes are assessed by which assignments?",
    "Are there outcomes that aren't being addressed in the current course design?",
  ],
  "Student Voice": [
    "What are students consistently praising about the course?",
    "What complaints or confusion patterns are you seeing?",
    "Have you noticed any themes about pacing, workload, or clarity?",
  ],
};

const SLIDES = [
  { title: "Course Overview & Objectives", flags: [], udl: 92, active: true, reused: false, text: "light" },
  { title: "Consumer Behavior Frameworks", flags: ["High text density — consider a visual summary"], udl: 61, active: false, reused: false, text: "heavy" },
  { title: "Case: Nike Brand Repositioning", flags: [], udl: 88, active: true, reused: false, text: "light" },
  { title: "Market Segmentation Models", flags: ["No multimodal alternative", "Reused from Week 3"], udl: 48, active: false, reused: true, text: "heavy" },
  { title: "Discussion Prompt: Who owns a brand?", flags: [], udl: 90, active: true, reused: false, text: "light" },
  { title: "Pricing Strategy Deep Dive", flags: ["High text density — add a diagram", "No active learning moment"], udl: 55, active: false, reused: false, text: "heavy" },
  { title: "Exit Ticket: What shifted for you?", flags: [], udl: 95, active: true, reused: false, text: "light" },
];

const OUTCOMES = [
  "Analyze marketing strategies using real-world case data",
  "Apply Socratic questioning to business problem-solving",
  "Evaluate ethical dimensions of organizational decisions",
  "Design an evidence-based marketing plan",
  "Demonstrate written communication at a professional standard",
];

const Tag = ({ label, color, bg }) => (
  <span style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: bg, color, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{label}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", ...style }}>{children}</div>
);

const LockOverlay = ({ onUpgrade }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(250,248,244,0.88)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 2 }}>
    <div style={{ fontSize: 18 }}>🔒</div>
    <div style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted }}>Pro feature</div>
    <button onClick={onUpgrade} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: C.teal, color: C.white, border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer" }}>Upgrade to Pro</button>
  </div>
);

function formatCourseLabel(c) {
  if (!c) return "—";
  if (typeof c === "string") return c;
  let label = c.course_code || "";
  if (c.section) label += ` - ${c.section}`;
  if (c.term_code) label += ` | ${c.term_code}`;
  return label;
}

const WCS = ({ course, setCourse, week, setWeek, courses }) => (
  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
    <select value={course} onChange={e => setCourse(e.target.value)}
      style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.navy, cursor: "pointer" }}>
      {courses.map(c => <option key={c.course_code} value={c.course_code}>{formatCourseLabel(c)}</option>)}
    </select>
    <select value={week} onChange={e => setWeek(e.target.value)}
      style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.teal, cursor: "pointer" }}>
      {WEEKS.map(w => <option key={w}>{w}</option>)}
    </select>
    <div style={{ fontSize: 11, fontFamily: F.accent, color: C.sage, fontWeight: 700, padding: "5px 10px", background: C.sageLight, borderRadius: 8 }}>● Auto-tagged</div>
  </div>
);

// Shared file processing: upload to Storage (if userId provided), extract text client-side.
// PDF: uploads raw file but skips extraction (shows friendly message via error path).
const ACCEPTED_EXTENSIONS = ["docx", "pptx", "txt", "pdf"];

async function processUploadedFile(file, { userId, onText, onFileMeta, setStatus, setErrorMsg }) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    setErrorMsg("Unsupported format — please use .docx, .pptx, or .txt.");
    setTimeout(() => setErrorMsg(null), 8000);
    return;
  }
  setErrorMsg(null);
  try {
    // Step 1: Upload raw file to Storage (if userId + onFileMeta provided)
    let meta = null;
    if (userId && onFileMeta) {
      setStatus("uploading");
      meta = await uploadDocument(userId, file);
    }
    // Step 2: PDF → store raw file but can't extract text
    if (ext === "pdf") {
      if (onFileMeta) onFileMeta(meta);
      setStatus("error");
      setErrorMsg("PDF uploaded — we can't extract text from PDFs yet. Paste the content manually, or re-upload as .docx or .txt.");
      setTimeout(() => { setStatus(null); setErrorMsg(null); }, 8000);
      return;
    }
    // Step 3: Extract text client-side (docx/pptx/txt)
    setStatus("extracting");
    const text = await extractFileText(file);
    onText(text);
    if (onFileMeta) onFileMeta(meta);
    setStatus(null);
  } catch (err) {
    console.warn("File processing failed:", err);
    setStatus("error");
    setErrorMsg("We couldn't read text from this file — you can paste the content manually instead.");
    if (onFileMeta) onFileMeta(null);
    setTimeout(() => { setStatus(null); setErrorMsg(null); }, 8000);
  }
}

// Reusable "or upload a file" button. Uses processUploadedFile for the actual work.
const FileUploadLink = ({ onText, onFileMeta, userId, accept = ".docx,.txt,.pptx,.pdf", label }) => {
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const inputRef = { current: null };
  return (
    <span>
      <input type="file" accept={accept} ref={el => inputRef.current = el}
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          await processUploadedFile(file, { userId, onText, onFileMeta, setStatus, setErrorMsg });
          e.target.value = "";
        }} />
      {errorMsg && (
        <div style={{ fontSize: 12, color: C.rose, fontFamily: F.body, marginBottom: 4 }}>{errorMsg}</div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()}
        disabled={status === "uploading" || status === "extracting"}
        style={{ background: "none", border: "none", fontSize: 12, color: status === "error" ? C.rose : C.teal, cursor: status ? "default" : "pointer", fontFamily: F.body, padding: 0, textDecoration: "underline", textUnderlineOffset: 2, opacity: status === "uploading" || status === "extracting" ? 0.7 : 1 }}>
        {status === "uploading" ? "Uploading your document..." : status === "extracting" ? "Extracting text..." : (label || "or upload a file ↑")}
      </button>
    </span>
  );
};

// --- Document Export Helpers ---

async function exportAssignmentDocx(text, courseName) {
  if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "docx" });
  // Parse the plain-text assignment into sections by ALL-CAPS headers
  const lines = text.split("\n");
  const children = [];
  let currentSection = null;
  const rubricRows = [];
  let inRubric = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!inRubric) children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    // Detect ALL-CAPS section headers (e.g., "ASSIGNMENT TITLE", "GRADING RUBRIC")
    if (/^[A-Z][A-Z &/\-:()]{4,}$/.test(trimmed) || /^[A-Z][A-Z &/\-:()]{4,}:/.test(trimmed)) {
      if (inRubric && rubricRows.length > 0) {
        children.push(buildRubricTable(rubricRows));
        rubricRows.length = 0;
      }
      inRubric = /RUBRIC/i.test(trimmed);
      currentSection = trimmed;
      children.push(new Paragraph({
        text: trimmed.replace(/:$/, ""),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
        run: { bold: true, size: 26, color: "0F1F3D", font: "Calibri" },
      }));
      continue;
    }

    // Detect numbered items or bullet points
    if (/^\d+[\.\)]\s/.test(trimmed) || /^[-•●]\s/.test(trimmed)) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 22, font: "Calibri" })],
        bullet: { level: 0 },
        spacing: { after: 60 },
      }));
      continue;
    }

    // Rubric rows: "Criteria | Points | Description" or similar pipe-separated
    if (inRubric && trimmed.includes("|")) {
      rubricRows.push(trimmed.split("|").map(c => c.trim()));
      continue;
    }

    // Default paragraph
    children.push(new Paragraph({
      children: [new TextRun({ text: trimmed, size: 22, font: "Calibri" })],
      spacing: { after: 80 },
    }));
  }

  if (rubricRows.length > 0) {
    children.push(buildRubricTable(rubricRows));
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        heading2: { run: { bold: true, size: 26, color: "0F1F3D", font: "Calibri" } },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: courseName || "Assignment", bold: true, size: 32, color: "0B8A8A", font: "Calibri" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Generated by KlasUp", italics: true, size: 18, color: "4A5568", font: "Calibri" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "0FB5B5" } },
        }),
        ...children,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(courseName || "assignment").replace(/\s+/g, "-")}-assignment.docx`;
  a.click();
}

function buildRubricTable(rows) {
  const tealBg = { type: ShadingType.SOLID, color: "0FB5B5" };
  const lightBg = { type: ShadingType.SOLID, color: "F0FAFA" };

  const tableRows = rows.map((cells, rowIdx) =>
    new TableRow({
      children: cells.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: cell,
              bold: rowIdx === 0,
              size: rowIdx === 0 ? 20 : 19,
              color: rowIdx === 0 ? "FFFFFF" : "0F1F3D",
              font: "Calibri",
            })],
            spacing: { after: 40 },
          })],
          shading: rowIdx === 0 ? tealBg : rowIdx % 2 === 1 ? lightBg : undefined,
          width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
        })
      ),
    })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function exportSlidePptx(slides, courseName, weekLabel) {
  if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "pptx" });
  const pptx = new PptxGenJS();
  pptx.author = "KlasUp";
  pptx.title = `${courseName} — ${weekLabel} Slides`;
  pptx.layout = "LAYOUT_WIDE";

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "0F1F3D" };
  titleSlide.addText(courseName || "Slide Deck", {
    x: 0.8, y: 1.5, w: "85%", h: 1.2,
    fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });
  titleSlide.addText(weekLabel || "", {
    x: 0.8, y: 2.8, w: "85%", h: 0.6,
    fontSize: 20, color: "0FB5B5", fontFace: "Calibri",
  });
  titleSlide.addText("Generated by KlasUp", {
    x: 0.8, y: 4.5, w: "85%", h: 0.4,
    fontSize: 12, italic: true, color: "7F8CA0", fontFace: "Calibri",
  });

  // Content slides
  slides.forEach((s, i) => {
    const slide = pptx.addSlide();

    // Slide number + time badge
    const badge = `Slide ${i + 1}${s.time ? `  ·  ~${s.time}` : ""}`;
    slide.addText(badge, {
      x: 0.5, y: 0.3, w: 3, h: 0.35,
      fontSize: 10, bold: true, color: "0FB5B5", fontFace: "Calibri",
    });

    // Title
    slide.addText(s.title || "", {
      x: 0.5, y: 0.7, w: "90%", h: 0.7,
      fontSize: 28, bold: true, color: "0F1F3D", fontFace: "Calibri",
    });

    // Bullet points
    const bulletY = 1.55;
    const bullets = (s.points || []).map(p => ({
      text: p, options: { fontSize: 16, color: "333333", fontFace: "Calibri", bullet: { code: "2022" } },
    }));
    if (bullets.length) {
      slide.addText(bullets, {
        x: 0.7, y: bulletY, w: "55%", h: 2.8,
        valign: "top", lineSpacingMultiple: 1.35,
      });
    }

    // Visual / activity suggestion box (right side)
    if (s.visual) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 7.8, y: 1.55, w: 4.5, h: 1.4,
        fill: { color: "E6F4E8" }, rectRadius: 0.15,
        line: { color: "5A8A62", width: 0.5 },
      });
      slide.addText([
        { text: "Visual / Activity\n", options: { fontSize: 10, bold: true, color: "5A8A62", fontFace: "Calibri" } },
        { text: s.visual, options: { fontSize: 12, color: "333333", fontFace: "Calibri" } },
      ], {
        x: 8.0, y: 1.65, w: 4.1, h: 1.2, valign: "top",
      });
    }

    // Speaker notes
    if (s.notes) {
      slide.addNotes(s.notes);
    }
  });

  pptx.writeFile({ fileName: `${(courseName || "slides").replace(/\s+/g, "-")}-${(weekLabel || "deck").replace(/\s+/g, "-")}.pptx` });
}

// --- Shared Export / Copy / Email helpers ---

let _copiedToast = null;
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show a brief "Copied!" toast
    if (_copiedToast) { document.body.removeChild(_copiedToast); _copiedToast = null; }
    const t = document.createElement("div");
    Object.assign(t.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "#0B8A8A", color: "#fff", padding: "8px 20px", borderRadius: "10px",
      fontFamily: "'Manrope',sans-serif", fontSize: "13px", fontWeight: "700",
      zIndex: "99999", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      transition: "opacity 0.3s", opacity: "1",
    });
    t.textContent = "Copied!";
    document.body.appendChild(t);
    _copiedToast = t;
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => { if (t.parentNode) document.body.removeChild(t); if (_copiedToast === t) _copiedToast = null; }, 300); }, 1500);
  });
}

function openMailto(subject, body) {
  if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "email" });
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  window.location.href = `mailto:?subject=${s}&body=${b}`;
}

function printPdf(html, title) {
  if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "pdf" });
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>${title || "KlasUp Export"}</title>
<style>
  @page { margin: 0.75in; @bottom-center { content: "Page " counter(page); font-size: 9px; color: #999; } }
  body { font-family: 'Manrope', 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 20px 0; line-height: 1.7; color: #0F1F3D; font-size: 14px; }
  h1, h2, h3 { font-family: 'Bricolage Grotesque', 'Arial Black', sans-serif; color: #0F1F3D; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 17px; border-bottom: 2px solid #0FB5B5; padding-bottom: 4px; margin-top: 24px; }
  .header { text-align: center; border-bottom: 2px solid #0FB5B5; padding-bottom: 16px; margin-bottom: 24px; }
  .header .logo { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; color: #0B8A8A; display: flex; align-items: center; justify-content: center; gap: 4px; }
  .header .faculty { font-size: 13px; color: #4A5568; }
  .header .date { font-size: 11px; color: #999; margin-top: 4px; }
  .tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #0FB5B5; color: #fff; text-align: left; padding: 6px 10px; font-size: 12px; }
  td { border-bottom: 1px solid #eee; padding: 6px 10px; font-size: 13px; }
  .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 3px 0; }
  pre { white-space: pre-wrap; font-family: 'Manrope', sans-serif; font-size: 14px; }
</style></head><body>${html}<div class="footer">Generated by KlasUp · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div></body></html>`);
  w.document.close();
  w.print();
}

function makePdfHeader(facultyName, subtitle) {
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48" fill="none" style="vertical-align:middle;margin-right:6px"><circle cx="24" cy="17.3" r="13" fill="#0FB5B5"/><rect x="17.5" y="25" width="13" height="5" rx="1.5" fill="#0FB5B5"/><rect x="19" y="29" width="10" height="3" rx="1" fill="#0A9E9E"/><rect x="18" y="31.5" width="12" height="2.2" rx=".6" fill="#0F1F3D"/><rect x="19" y="34.2" width="10" height="2.2" rx=".6" fill="#0F1F3D"/><rect x="20" y="36.9" width="8" height="2.2" rx=".8" fill="#0F1F3D"/><rect x="21" y="10" width="2.8" height="14" rx="1.4" fill="white"/><line x1="24" y1="17.3" x2="30" y2="10" stroke="white" stroke-width="2.8" stroke-linecap="round"/><line x1="24" y1="17.3" x2="30.5" y2="24" stroke="white" stroke-width="2.8" stroke-linecap="round"/><circle cx="31.5" cy="10" r="1.1" fill="white" opacity=".9"/><circle cx="33.5" cy="13" r=".8" fill="white" opacity=".6"/></svg>`;
  return `<div class="header"><div class="logo">${logoSvg}<span style="font-family:'Bricolage Grotesque',sans-serif;font-size:24px;color:#0F1F3D">Klas</span><span style="font-family:'Bricolage Grotesque',sans-serif;font-size:24px;color:#0FB5B5">Up</span></div><div class="faculty">${facultyName || "Faculty"}</div>${subtitle ? `<div class="date">${subtitle}</div>` : ""}</div>`;
}

async function exportGenericDocx(paragraphs, title, subtitle, fileName) {
  if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "docx" });
  const children = [
    new Paragraph({ children: [new TextRun({ text: title || "KlasUp Export", bold: true, size: 32, color: "0B8A8A", font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: subtitle || "Generated by KlasUp", italics: true, size: 18, color: "4A5568", font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "0FB5B5" } } }),
    ...paragraphs,
  ];
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });
  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName || "klasup-export.docx";
  a.click();
}

// Small inline button components for Copy / Email
const CopyBtn = ({ text, label }) => (
  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(text); }}
    style={{ background: "none", border: `1px solid rgba(15,31,61,0.12)`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontFamily: "'Manrope',sans-serif", fontWeight: 700, color: "#0B8A8A", cursor: "pointer", whiteSpace: "nowrap" }}>
    {label || "Copy ↗"}
  </button>
);

const EmailBtn = ({ subject, body, label }) => (
  <button onClick={(e) => { e.stopPropagation(); openMailto(subject, body); }}
    style={{ background: "none", border: `1px solid rgba(15,31,61,0.12)`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontFamily: "'Manrope',sans-serif", fontWeight: 700, color: "#6B4E9B", cursor: "pointer", whiteSpace: "nowrap" }}>
    {label || "Email ↗"}
  </button>
);

// Maps feature_flags.name → NAV id
const FLAG_GATED_PAGES = {
  pricing: "Pricing",
  accreditation: "Reports",
  wellness: "Wellness",
  think_tank: "Think Tank",
  student_voice: "Student Voice",
  course_architect: "Course Architect",
};

const FROM_KLASUP_ITEMS = [
  { type: "feature", emoji: "📄", title: "Import your syllabus", body: "Upload your syllabus and KlasUp drafts your outcomes, weekly schedule, and assignments — you review and approve every item before anything is added.", date: "June 2026", cta: { label: "Try it in Course Setup →", page: "Course Setup" } },
  { type: "feature", emoji: "🏛️", title: "Course Architect is here", body: "Your whole term in one place — weeks, assignments, and learning outcomes, viewable as a list, by assignment, or in full detail.", date: "June 2026", cta: { label: "Open Course Architect →", page: "Course Architect" } },
  { type: "feature", emoji: "📖", title: "Your guide to KlasUp", body: "Every feature explained in plain language, with a glossary. Look for the ⓘ on any page when you want a quick orientation.", date: "June 2026", cta: { label: "Open the Guide →", page: "Guide" } },
  { type: "feature", emoji: "📝", title: "AI feedback on your assignments", body: "Get pedagogy feedback on any assignment right inside Pedagogy Studio — Bloom's range, scaffolding, and clarity, with the why behind each note.", date: "June 2026", cta: { label: "Open Pedagogy Studio →", page: "Pedagogy Studio" } },
  { type: "tip", emoji: "💡", title: "Start with a question", body: "When using Klas, start vague \u2014 'I need help with an assignment' \u2014 and let Klas ask the right questions." },
  { type: "tip", emoji: "🎤", title: "Talk instead of type", body: "Every text box in KlasUp takes voice input. Thinking out loud is a legitimate drafting strategy." },
  { type: "tip", emoji: "🏷️", title: "Tag as you build", body: "Tagging assignments to learning outcomes takes seconds now — and writes your accreditation documentation for you all term." },
  { type: "research", emoji: "🔬", title: "Active learning works", body: "Students learn more by doing than by listening — discussion, application, and practice beat lecture-only time." },
  { type: "research", emoji: "🧠", title: "Low-stakes practice beats cramming", body: "Frequent low-stakes practice helps students retain more than high-stakes exams alone — a small change with outsized payoff." },
  { type: "research", emoji: "🌱", title: "Small flexibility, big belonging", body: "Humane policies like a late pass or a dropped lowest grade are linked to stronger student belonging and persistence." },
];

const TYPE_ACCENT = { feature: "#2A9D8F", tip: "#1B2B4B", research: "#7BAE7F" };
const TYPE_LABEL = { feature: "New Feature", tip: "Tip", research: "Research" };

function FromKlasUpPanel({ onNavigate }) {
  const [idx, setIdx] = useState(0);
  const total = FROM_KLASUP_ITEMS.length;

  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [total]);

  const item = FROM_KLASUP_ITEMS[idx];
  const accent = TYPE_ACCENT[item.type] || "#2A9D8F";

  return (
    <div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 14, fontWeight: 700, color: "#1B2B4B", marginBottom: 10 }}>
        From KlasUp
      </div>
      <div style={{
        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16,
        overflow: "hidden", position: "relative",
      }}>
        {/* Accent bar */}
        <div style={{ height: 4, background: accent, transition: "background 0.4s ease" }} />

        {/* Card content */}
        <div style={{ padding: "18px 16px 14px", minHeight: 140 }}>
          <div style={{
            fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
            transition: "color 0.4s ease",
          }}>
            <span style={{ color: accent }}>{TYPE_LABEL[item.type]}</span>
            {item.date && <span style={{ color: "#9CA3AF" }}> · {item.date}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{item.emoji}</span>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15, fontWeight: 700, color: "#1B2B4B", lineHeight: 1.3 }}>
              {item.title}
            </div>
          </div>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "#5a6a85", lineHeight: 1.6 }}>
            {item.body}
          </div>
          {item.cta && onNavigate && (
            <button onClick={() => onNavigate(item.cta.page)}
              style={{ background: "none", border: "none", padding: "8px 0 0", fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 700, color: accent, cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              {item.cta.label}
            </button>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 12px" }}>
          <button onClick={() => setIdx(i => (i - 1 + total) % total)}
            style={{ background: "none", border: "none", fontSize: 18, color: "#C0C0C0", cursor: "pointer", padding: "2px 6px", lineHeight: 1, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#2A9D8F"}
            onMouseLeave={e => e.currentTarget.style.color = "#C0C0C0"}>
            ‹
          </button>
          <div style={{ display: "flex", gap: 5 }}>
            {FROM_KLASUP_ITEMS.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 16 : 6, height: 6, borderRadius: 3, border: "none", padding: 0,
                  background: i === idx ? "#2A9D8F" : "#D0D0D0", cursor: "pointer",
                  transition: "all 0.3s ease",
                }} />
            ))}
          </div>
          <button onClick={() => setIdx(i => (i + 1) % total)}
            style={{ background: "none", border: "none", fontSize: 18, color: "#C0C0C0", cursor: "pointer", padding: "2px 6px", lineHeight: 1, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#2A9D8F"}
            onMouseLeave={e => e.currentTarget.style.color = "#C0C0C0"}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function ComingSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#2A9D8F22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🚀</span>
      </div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, color: "#1B2B4B", marginBottom: 8 }}>Coming Soon</div>
      <div style={{ color: "#2A9D8F", fontSize: 16, maxWidth: 360 }}>We're working on something great. Check back soon!</div>
    </div>
  );
}

export default function KlasUp() {
  // --- Auth state ---
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showResearch, setShowResearch] = useState(window.location.hash === "#/research");
  const [showBeta, setShowBeta] = useState(window.location.hash === "#/beta");
  const [showTerms, setShowTerms] = useState(null); // null | "terms" | "privacy"
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup" | "forgot"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  // --- Profile state ---
  const [profile, setProfile] = useState(null);
  const [profileSetup, setProfileSetup] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1=profile, 2=courses
  const [profileForm, setProfileForm] = useState({ name: "", institution: "", job_title: "", lms: "", education_level: "" });

  // --- Subscription state ---
  const [subStatus, setSubStatus] = useState({ tier: "free", trialActive: false, trialExpiringSoon: false, trialExpired: false, daysLeft: 0 });
  const [dismissedTrialBanner, setDismissedTrialBanner] = useState(false);

  // --- Announcements ---
  const [announcements, setAnnouncements] = useState([]);

  // --- Admin state ---
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminFunnelData, setAdminFunnelData] = useState(null);
  const [adminAnnouncementForm, setAdminAnnouncementForm] = useState({ title: "", body: "" });
  const [adminTestForm, setAdminTestForm] = useState({ email: "", password: "", name: "" });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminResearchTab, setAdminResearchTab] = useState(false);
  const [adminBetaTab, setAdminBetaTab] = useState(false);
  const [adminBetaAgreements, setAdminBetaAgreements] = useState([]);
  const [adminArticles, setAdminArticles] = useState([]);
  const [adminDimCounts, setAdminDimCounts] = useState([]);
  const [adminArticleForm, setAdminArticleForm] = useState({ title: "", authors: "", year: "", journal: "", abstract: "", content: "", dimension: "Active Learning", search_terms: "" });
  const [adminCrawlerResult, setAdminCrawlerResult] = useState(null);
  const [adminCrawlerLoading, setAdminCrawlerLoading] = useState(false);
  const [adminEmbedResult, setAdminEmbedResult] = useState(null);
  const [adminFeatureFlags, setAdminFeatureFlags] = useState([]);

  const [page, setPage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ww = useWindowWidth();
  const mob = ww < 768;
  const { flags } = useFeatureFlags();

  // Build a Set of NAV ids that are disabled by feature flags
  const gatedPageIds = new Set(
    Object.entries(FLAG_GATED_PAGES)
      .filter(([flagName]) => flags[flagName] === false)
      .map(([, pageId]) => pageId)
  );
  // tier now comes from the database — no more demo toggle
  const tier = subStatus.tier;
  const [course, setCourse] = useState("");
  const [week, setWeek] = useState("Week 8");
  const [uploadOpen, setUploadOpen] = useState(null);
  const [uploaded, setUploaded] = useState({});
  const [slideOpen, setSlideOpen] = useState(null);
  const [deckUploaded, setDeckUploaded] = useState(false);
  const [slideOutcomes, setSlideOutcomes] = useState([]);
  const [slideFeedback, setSlideFeedback] = useState(null);
  const [replyOpen, setReplyOpen] = useState(null);
  const [assignType, setAssignType] = useState("");
  const [assignText, setAssignText] = useState("");
  const [selectedOutcomes, setSelectedOutcomes] = useState([]);
  const [milestones, setMilestones] = useState(["Draft submission", "Peer review"]);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [uploadText, setUploadText] = useState("");
  const [uploadFileMeta, setUploadFileMeta] = useState(null);
  const [dropDragOver, setDropDragOver] = useState(false);
  const [dropStatus, setDropStatus] = useState(null);
  const [dropErrorMsg, setDropErrorMsg] = useState(null);
  const [aiMicro, setAiMicro] = useState([]);
  const [aiMicroLoading, setAiMicroLoading] = useState(false);
  const [aiMicroError, setAiMicroError] = useState(null);
  const [microHistory, setMicroHistory] = useState({});
  const [panelSections, setPanelSections] = useState({});
  const [uploadLog, setUploadLog] = useState([]);
  const [portfolioCourse, setPortfolioCourse] = useState("");
  const [portfolioWeek, setPortfolioWeek] = useState("All");
  const [portfolioExpanded, setPortfolioExpanded] = useState({});
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState(null);
  const [reflectionEditing, setReflectionEditing] = useState(false);
  const [microRatings, setMicroRatings] = useState({});
  const [postUpvotes, setPostUpvotes] = useState({});

  // --- My Course redesign state ---
  const [pendingAssignmentId, setPendingAssignmentId] = useState(null);
  const [myCourseCategory, setMyCourseCategory] = useState("Learning Outcomes");
  const [myCourseFeedback, setMyCourseFeedback] = useState(null);
  const [myCourseFeedbackLoading, setMyCourseFeedbackLoading] = useState(false);
  const [promptHelperOpen, setPromptHelperOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState({});

  // --- Assignment Document Generator state ---
  const [assignDocDesc, setAssignDocDesc] = useState("");
  const [assignDocResult, setAssignDocResult] = useState(null);
  const [assignDocLoading, setAssignDocLoading] = useState(false);
  const [assignDocError, setAssignDocError] = useState(null);
  const [assignDocEditing, setAssignDocEditing] = useState(false);
  const [assignDocUpdateText, setAssignDocUpdateText] = useState("");
  const [assignDocUpdating, setAssignDocUpdating] = useState(false);

  // --- PowerPoint Planner state ---
  const [pptDesc, setPptDesc] = useState("");
  const [pptSlides, setPptSlides] = useState(null);
  const [pptLoading, setPptLoading] = useState(false);
  const [pptError, setPptError] = useState(null);
  const [pptEditing, setPptEditing] = useState(null);
  const [pptUpdateText, setPptUpdateText] = useState("");
  const [pptUpdating, setPptUpdating] = useState(false);

  // --- Sage AI Coach state ---
  const [sageOpen, setSageOpen] = useState(false);
  const [sageMessages, setSageMessages] = useState([]);
  const sageMessagesRef = useRef([]);
  useEffect(() => { sageMessagesRef.current = sageMessages; }, [sageMessages]);
  const [sageInput, setSageInput] = useState("");
  const [sageSending, setSageSending] = useState(false);
  const [sageBuilderOpen, setSageBuilderOpen] = useState(false);
  const [klasOptions, setKlasOptions] = useState({ options: [], multiSelect: false, questionType: null });
  const [klasCore4, setKlasCore4] = useState({ subject: "", level: "", building: "", format: "", goal: "" });
  const klasCore4Ref = useRef({ subject: "", level: "", building: "", format: "", goal: "" });
  useEffect(() => { klasCore4Ref.current = klasCore4; }, [klasCore4]);
  const [klasSelected, setKlasSelected] = useState([]);
  const [klasOtherMode, setKlasOtherMode] = useState(null); // tracks question_type when "Other" clicked
  const [klasExpanded, setKlasExpanded] = useState(false);
  const [sageClearConfirm, setSageClearConfirm] = useState(false);
  const [klasMode2Open, setKlasMode2Open] = useState(false);
  const [klasConversationId, setKlasConversationId] = useState(null);
  const sageTextareaRef = useRef(null);
  const klasMode2TextareaRef = useRef(null);

  // --- Supabase courses ---
  const [dbCourses, setDbCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [careerData, setCareerData] = useState({});        // { [course_id]: response object }
  const [careerLoading, setCareerLoading] = useState({});   // { [course_id]: true }
  const [careerError, setCareerError] = useState({});       // { [course_id]: true }
  const [disciplineEdit, setDisciplineEdit] = useState({}); // { [course_id]: string | null } — non-null = input open
  const [topicInput, setTopicInput] = useState({});         // { [course_id]: string | null }
  const [copiedId, setCopiedId] = useState(null);
  const [careerSelectedCourseId, setCareerSelectedCourseId] = useState(null); // tile grid → career section (Stage 2)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ course_code: "", course_name: "", section: "", term_code: "", term_start: "", num_weeks: 16 });
  const [onboardingCourses, setOnboardingCourses] = useState([]);
  const [settingsEditing, setSettingsEditing] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});

  // --- Settings page state ---
  const [settingsProfileForm, setSettingsProfileForm] = useState(null);
  const [settingsProfileSaving, setSettingsProfileSaving] = useState(false);
  const [settingsProfileMsg, setSettingsProfileMsg] = useState(null);
  const [settingsPhotoUploading, setSettingsPhotoUploading] = useState(false);
  const [settingsPwForm, setSettingsPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [settingsPwSaving, setSettingsPwSaving] = useState(false);
  const [settingsPwMsg, setSettingsPwMsg] = useState(null);
  const [settingsDeleteConfirm, setSettingsDeleteConfirm] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // --- Wellness state ---
  const [wellnessScore, setWellnessScore] = useState(null);
  const [wellnessTodayCheckin, setWellnessTodayCheckin] = useState(null);
  const [wellnessHistory, setWellnessHistory] = useState([]);
  const [wellnessMsg, setWellnessMsg] = useState(null);
  const [wellnessTab, setWellnessTab] = useState("faculty");
  const [wellnessReflection, setWellnessReflection] = useState("");
  const [wellnessReflectionResult, setWellnessReflectionResult] = useState(null);
  const [wellnessReflectionLoading, setWellnessReflectionLoading] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(null);
  const [breathExerciseOpen, setBreathExerciseOpen] = useState(null);
  const [audioDurations, setAudioDurations] = useState({});

  // Load real audio durations from Supabase meditation files
  const MEDITATION_AUDIO_BASE = "https://thbfibtknxivegybhupw.supabase.co/storage/v1/object/public/meditations/";
  const MEDITATION_AUDIO_URLS = [
    MEDITATION_AUDIO_BASE + "before-tough-class.mp3",
    MEDITATION_AUDIO_BASE + "after-a-draining-week.mp3",
    MEDITATION_AUDIO_BASE + "purpose.mp3",
    MEDITATION_AUDIO_BASE + "reset.mp3",
    MEDITATION_AUDIO_BASE + "creativity.mp3",
    MEDITATION_AUDIO_BASE + "communication.mp3",
    MEDITATION_AUDIO_BASE + "burnout.mp3",
  ];
  useEffect(() => {
    MEDITATION_AUDIO_URLS.forEach(url => {
      if (audioDurations[url]) return;
      const a = new Audio();
      a.preload = "metadata";
      a.addEventListener("loadedmetadata", () => {
        setAudioDurations(prev => {
          if (prev[url]) return prev;
          return { ...prev, [url]: a.duration };
        });
        a.src = "";
      });
      a.addEventListener("error", () => { a.src = ""; });
      a.src = url;
    });
  }, []);

  const courseLabel = (code) => { const c = dbCourses.find(x => x.course_code === code); return c ? formatCourseLabel(c) : code || "—"; };

  const JOB_TITLES = ["Professor", "Associate Professor", "Assistant Professor", "Adjunct", "Instructor", "Lecturer", "Dean", "Department Chair", "AVPAA", "Other"];
  const LMS_OPTIONS = ["Canvas", "Blackboard", "D2L Brightspace", "Moodle", "Other"];
  const EDUCATION_LEVELS = ["Bachelor's Degree", "Master's Degree", "Doctoral Degree (PhD, EdD, etc.)", "Medical Degree (MD)", "Law Degree (JD)", "Other Professional Degree", "Other"];
  const DR_ELIGIBLE = ["Doctoral Degree (PhD, EdD, etc.)", "Medical Degree (MD)"];
  const hasDrPrefix = (name) => /^dr\.?\s/i.test((name || "").trim());
  const addDrPrefix = (name) => hasDrPrefix(name) ? name : `Dr. ${name}`;
  const removeDrPrefix = (name) => (name || "").replace(/^dr\.?\s*/i, "");

  // --- Auth listener ---
  useEffect(() => {
    getSession().then(s => {
      setSession(s);
      // If user arrives already authenticated (e.g. email verification redirect), skip landing
      if (s) setShowLanding(false);
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));

    const { data: { subscription } } = onAuthStateChange((event, s) => {
      setSession(s);
      // Auto-login after email verification — skip landing page
      if (s && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        setShowLanding(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- Deep-link: #/course-architect ---
  useEffect(() => {
    if (session && window.location.hash === "#/course-architect") {
      setPage("Course Architect");
      window.location.hash = "";
    }
  }, [session]);

  // --- Session timeout (24h inactivity) ---
  useEffect(() => {
    if (!session) return;
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { signOut(); }, 24 * 60 * 60 * 1000);
    };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, [session]);

  // --- Load profile + courses + check subscription when session is available ---
  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    setCoursesLoading(true);

    (async () => {
      try {
        // Fetch profile first — don't touch other tables until we know if profile exists
        let p = null;
        try {
          p = await fetchProfile(userId);
        } catch (fetchErr) {
          // Profile query failed (RLS, network, missing columns) — treat as no profile
          console.warn("fetchProfile failed, treating as new user:", fetchErr);
        }
        setProfile(p);
        if (p?.active_course_id) setActiveCourseId(p.active_course_id);

        if (!p) {
          // New user — show profile setup (Step 1 of onboarding)
          setProfileSetup(true);
          setOnboardingStep(1);
          setProfileForm({ name: "", institution: "", job_title: "", lms: "" });
          setCoursesLoading(false);
          return;
        }

        // Profile exists — safe to update last_active
        updateLastActive(userId).catch(() => {});

        // Check subscription and auto-downgrade
        const status = checkSubscriptionStatus(p);
        if (status.tier === "free" && status.trialExpired && p.role !== "free") {
          await downgradeExpiredUser(userId);
          p.role = "free";
        }
        setSubStatus(status);

        // Fetch courses
        const rows = await fetchCourses(userId);
        setDbCourses(rows);
        if (rows.length === 0) {
          setShowOnboarding(true);
          setOnboardingStep(2);
        } else {
          setCourse(rows[0].course_code);
          setPortfolioCourse(rows[0].course_code);
        }

        // Fetch uploads + micro-learnings (non-critical)
        // Fetched together so micro-learnings can be matched to uploads via upload_id FK
        Promise.all([fetchUploads(userId), fetchMicroLearnings(userId)]).then(([uploadRows, microRows]) => {
          const log = uploadRows.map(r => {
            const c = rows.find(x => x.id === r.course_id);
            return { content: r.content, category: r.category, course: c?.course_code || "", week: `Week ${r.week}`, timestamp: new Date(r.created_at).getTime(), _dbId: r.id };
          });
          setUploadLog(log);

          // Build lookup: upload_id → { category, course, week, timestamp }
          const uploadById = {};
          uploadRows.forEach(r => {
            const c = rows.find(x => x.id === r.course_id);
            uploadById[r.id] = { category: r.category, course: c?.course_code || "", week: `Week ${r.week}`, timestamp: new Date(r.created_at).getTime() };
          });

          // Group micro-learnings by upload_id, then key by upload's category
          const byUpload = {};
          microRows.forEach(r => {
            if (!byUpload[r.upload_id]) byUpload[r.upload_id] = [];
            byUpload[r.upload_id].push(r);
          });
          const hist = {};
          Object.entries(byUpload).forEach(([uid, recs]) => {
            const parent = uploadById[uid];
            if (!parent) return;
            if (!hist[parent.category]) hist[parent.category] = [];
            hist[parent.category].push({ recs, week: parent.week, course: parent.course, timestamp: parent.timestamp });
          });
          setMicroHistory(hist);
        }).catch(e => console.warn("Upload/micro-learning load:", e));

        // Fetch announcements (non-critical)
        fetchActiveAnnouncements(userId)
          .then(anns => setAnnouncements(anns))
          .catch(() => {});

        // Show welcome banner only during the first 3 days after signup,
        // unless the user has manually dismissed it.
        if (p && !localStorage.getItem("klasup_welcome_dismissed")) {
          const signupTime = new Date(p.created_at).getTime();
          const now = Date.now();
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          if (now - signupTime < threeDaysMs) {
            setShowWelcomeBanner(true);
          }
        }

      } catch (err) {
        console.error("Failed to load:", err);
        // If we got here without a profile, show profile setup as fallback
        if (!profile) {
          setProfileSetup(true);
          setOnboardingStep(1);
          setProfileForm({ name: "", institution: "", job_title: "", lms: "" });
        }
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, [session]);

  const addCourseFromForm = async (form) => {
    const row = await insertCourse({
      course_code: form.course_code.trim(),
      course_name: form.course_name.trim(),
      section: form.section.trim() || null,
      term_code: form.term_code.trim(),
      term_start: form.term_start || null,
      num_weeks: parseInt(form.num_weeks) || 16,
    }, session.user.id);
    setDbCourses(prev => [...prev, row]);
    if (typeof gtag === "function") gtag("event", "course_added", { course_code: row.course_code });
    if (!course) setCourse(row.course_code);
    if (!portfolioCourse) setPortfolioCourse(row.course_code);
    return row;
  };

  // --- Auth handlers ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    // Rate limiting — lock after 5 failed attempts for 15 minutes
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setAuthError(`Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`);
      return;
    }

    if (authMode === "forgot") {
      setAuthSubmitting(true);
      try {
        await resetPassword(authEmail);
        setAuthSuccess("Password reset email sent! Check your inbox.");
      } catch (err) { setAuthError(err.message); }
      finally { setAuthSubmitting(false); }
      return;
    }

    if (authMode === "signup" && !tosAccepted) {
      setAuthError("You must accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        const data = await signUp(authEmail, authPassword);
        await logSecurityEvent(data.user?.id || null, "signup", { email: authEmail });
        if (typeof gtag === "function") gtag("event", "signup_completed");
        setAuthSuccess("Check your email to verify your account before logging in.");
        setAuthMode("login");
      } else {
        await signIn(authEmail, authPassword, { remember: rememberMe });
        if (typeof gtag === "function") gtag("event", "login_completed");
        setLoginAttempts(0);
        setLockoutUntil(null);
      }
      setAuthEmail("");
      setAuthPassword("");
    } catch (err) {
      if (authMode === "login") {
        const attempts = loginAttempts + 1;
        setLoginAttempts(attempts);
        if (attempts >= 5) {
          const until = Date.now() + 15 * 60 * 1000;
          setLockoutUntil(until);
          setAuthError("Account locked for 15 minutes due to too many failed attempts.");
          await logSecurityEvent(null, "account_locked", { email: authEmail });
        } else {
          setAuthError(err.message);
        }
      } else {
        setAuthError(err.message);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSetActiveCourse = async (courseId) => {
    setActiveCourseId(courseId);
    if (session?.user) {
      await supabase.from("profiles").update({ active_course_id: courseId }).eq("id", session.user.id);
    }
  };

  // Sync `course` (code string) with the app-wide activeCourseId
  useEffect(() => {
    if (!dbCourses.length) return;
    const match = activeCourseId ? dbCourses.find(c => c.id === activeCourseId) : null;
    if (match && match.course_code) {
      setCourse(match.course_code);
    }
  }, [activeCourseId, dbCourses]);

  // Wrapper: when WCS changes course, also update the app-wide activeCourseId
  const setCourseAndSync = useCallback((code) => {
    setCourse(code);
    setPendingAssignmentId(null);
    const match = dbCourses.find(c => c.course_code === code);
    if (match) handleSetActiveCourse(match.id);
  }, [dbCourses]);

  // Bridge: send an assignment from Course Architect to Pedagogy Studio for AI feedback
  const handleSendToPedagogy = useCallback((assignment, weekNumber) => {
    const parts = [];
    if (assignment.title) parts.push(`Assignment: ${assignment.title}`);
    if (assignment.assignment_type && assignment.assignment_type !== "Other") parts.push(`Type: ${assignment.assignment_type}`);
    if (weekNumber) parts.push(`Due: Week ${weekNumber}`);
    if (assignment.description) parts.push(`\n${assignment.description}`);
    setUploadText(parts.join("\n"));
    setMyCourseCategory("Assignments");
    if (weekNumber) setWeek(`Week ${weekNumber}`);
    setPendingAssignmentId(assignment.id);
    setPage("Pedagogy Studio");
  }, []);

  const handleSignOut = async () => {
    if (session?.user) await logSecurityEvent(session.user.id, "logout");
    await signOut();
    setSession(null);
    setProfile(null);
    setSubStatus({ tier: "free", trialActive: false, trialExpiringSoon: false, trialExpired: false, daysLeft: 0 });
    setDbCourses([]);
    setShowOnboarding(false);
    setProfileSetup(false);
    setAnnouncements([]);
    setShowLanding(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;
    setAuthError(null);
    try {
      const p = await upsertProfile(session.user.id, {
        name: profileForm.name.trim(),
        email: session.user.email,
        institution: profileForm.institution.trim() || null,
        job_title: profileForm.job_title || null,
        lms: profileForm.lms || null,
        education_level: profileForm.education_level || null,
        tos_accepted_at: new Date().toISOString(),
        tos_version: "1.0",
      });
      setProfile(p);
      const status = checkSubscriptionStatus(p);
      setSubStatus(status);
      await trackEvent(session.user.id, "profile_completed");
      setProfileSetup(false);
      setShowOnboarding(true);
      setOnboardingStep(2);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // --- Admin panel loader ---
  const loadAdminData = useCallback(async () => {
    console.log("loadAdminData called, profile.role:", profile?.role);
    if (profile?.role !== "admin") return;
    setAdminLoading(true);
    try {
      const [users, stats, funnel] = await Promise.all([
        adminFetchAllUsers(),
        adminFetchUsageStats(),
        adminFetchFunnel(),
      ]);
      console.log("Admin users loaded:", users?.length, users);
      setAdminUsers(users);
      setAdminStats(stats);
      setAdminFunnelData(funnel);
    } catch (err) { console.error("Admin load error:", err); }
    finally { setAdminLoading(false); }
    // Fetch feature flags independently so a failure above doesn't block them
    try {
      const { data, error } = await supabase.from("feature_flags").select("*").order("name");
      console.log("feature flags loaded:", data, "error:", error);
      if (error) { console.error("feature_flags query error:", error); }
      if (data) setAdminFeatureFlags(data);
    } catch (err) { console.error("Feature flags load error:", err); }
  }, [profile?.role]);

  const loadAdminResearch = useCallback(async () => {
    try {
      const { data: articles } = await supabase.from("research_articles").select("id, title, authors, year, dimension, embedding").order("created_at", { ascending: false }).limit(50);
      setAdminArticles(articles || []);
      const { data: dims } = await supabase.from("research_articles").select("dimension").order("dimension");
      const counts = {};
      (dims || []).forEach(d => { counts[d.dimension] = (counts[d.dimension] || 0) + 1; });
      setAdminDimCounts(Object.entries(counts).map(([dimension, count]) => ({ dimension, count })).sort((a, b) => b.count - a.count));
    } catch (e) { console.error("Admin research load error:", e); }
  }, []);

  const loadAdminBeta = useCallback(async () => {
    try {
      const { data } = await supabase.from("beta_agreements").select("*").order("signed_at", { ascending: false });
      setAdminBetaAgreements(data || []);
    } catch (e) { console.error("Admin beta load error:", e); }
  }, []);

  // --- Wellness helpers ---
  const loadWellnessData = useCallback(async () => {
    if (!session?.user) return;
    try {
      const [today, history] = await Promise.all([
        fetchTodayCheckin(session.user.id),
        fetchRecentCheckins(session.user.id, 28),
      ]);
      setWellnessTodayCheckin(today);
      setWellnessHistory(history);
      if (today) setWellnessScore(today.check_in_score);
    } catch (e) { console.error("Wellness load error:", e); }
  }, [session?.user?.id]);

  useEffect(() => { if (session?.user) loadWellnessData(); }, [session?.user, loadWellnessData]);

  // Load saved reflection when portfolio page is viewed
  useEffect(() => {
    if (page !== "Course Portfolio" || !session?.user || !portfolioCourse || reflectionText) return;
    const cObj = dbCourses.find(c => c.course_code === portfolioCourse);
    if (!cObj) return;
    fetchReflection(session.user.id, cObj.id, cObj.term_code || "")
      .then(r => { if (r) setReflectionText(r.edited_content || r.content || ""); })
      .catch(e => console.warn("Reflection load:", e));
  }, [page, portfolioCourse, session?.user?.id]);

  const WELLNESS_EMOJIS = ["😔", "😕", "😐", "🙂", "😊"];
  const WELLNESS_MESSAGES = [
    "It's okay to have hard days. You showed up — that matters. 🌿",
    "Tough stretch. Remember: you don't have to be perfect to be impactful.",
    "Steady and present. That's enough. 🌿",
    "You're doing good work. Your students are lucky to have you.",
    "You're thriving! Carry this energy into your next class. ✨",
  ];
  const WELLNESS_TIPS = [
    "Try a 2-minute breathing exercise before your next class.",
    "Consider reaching out to a colleague today — connection helps.",
    "A short walk between classes can reset your energy.",
    "Take a moment to name one thing that went well this week.",
    "Share this energy — tell a student something you noticed about their growth.",
  ];

  const handleWellnessCheckin = async (score) => {
    if (!session?.user) return;
    try {
      if (wellnessTodayCheckin) {
        await updateWellnessCheckin(wellnessTodayCheckin.id, score);
      } else {
        await insertWellnessCheckin(session.user.id, score);
      }
      setWellnessScore(score);
      setWellnessMsg({ message: WELLNESS_MESSAGES[score - 1], tip: WELLNESS_TIPS[score - 1] });
      loadWellnessData();
    } catch (e) { console.error("Wellness check-in error:", e); }
  };

  const wellnessBurnoutFlag = wellnessHistory.length >= 3 && wellnessHistory.slice(0, 3).every(c => c.check_in_score <= 2);

  const removeCourse = async (id) => {
    await deleteCourseDB(id);
    setDbCourses(prev => {
      const next = prev.filter(c => c.id !== id);
      const removed = prev.find(c => c.id === id);
      if (removed && course === removed.course_code && next.length > 0) setCourse(next[0].course_code);
      if (removed && portfolioCourse === removed.course_code && next.length > 0) setPortfolioCourse(next[0].course_code);
      return next;
    });
  };

  const editCourse = async (id, updates) => {
    const row = await updateCourseDB(id, updates);
    setDbCourses(prev => prev.map(c => c.id === id ? row : c));
    const old = dbCourses.find(c => c.id === id);
    if (old && course === old.course_code) setCourse(row.course_code);
    if (old && portfolioCourse === old.course_code) setPortfolioCourse(row.course_code);
  };

  const TIER_RANK = { free: 0, pro: 1, institutional: 2, admin: 3 };
  const can = t => (TIER_RANK[tier] || 0) >= (TIER_RANK[t] || 0);
  const upgrade = () => { setPage("Pricing"); if (typeof gtag === "function") gtag("event", "upgrade_button_clicked"); if (session?.user) trackEvent(session.user.id, "upgrade_prompt_shown"); };
  const rateMicro = (key, stars) => setMicroRatings(p => ({ ...p, [key]: stars }));
  const allRatings = Object.values(microRatings).filter(v => v > 0);
  const avgRating = allRatings.length > 1 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : null;

  const StarRating = ({ ratingKey, dark }) => {
    const current = microRatings[ratingKey] || 0;
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} onClick={() => rateMicro(ratingKey, s)}
              style={{ cursor: "pointer", fontSize: dark ? 14 : 16, color: s <= current ? C.tealBright : dark ? "rgba(255,255,255,0.2)" : C.ivoryDark, transition: "color 0.15s" }}>
              ★
            </span>
          ))}
          {current > 0 && <span style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, color: C.tealBright, marginLeft: 6 }}>{current}/5</span>}
          {avgRating && <span style={{ fontSize: 10, fontFamily: F.accent, color: dark ? "rgba(255,255,255,0.3)" : C.muted, marginLeft: 6 }}>Avg {avgRating}</span>}
        </div>
        <div style={{ fontSize: 9, fontFamily: F.accent, color: dark ? "rgba(255,255,255,0.25)" : C.muted, marginTop: 3 }}>Your rating helps improve KlasUp.</div>
      </div>
    );
  };

  const genFeedback = () => {
    if (!assignText) return;
    setAiFeedback({
      blooms: assignText.length > 80 ? "Analyze / Evaluate" : "Remember / Understand",
      scaffold: milestones.length >= 2 ? 82 : 44,
      outcomes: selectedOutcomes.length,
      clarity: assignText.length > 60 ? 78 : 51,
      suggestions: [
        milestones.length < 2 ? "Add at least one milestone checkpoint to reduce last-minute submissions." : "Good scaffolding — milestones are in place.",
        selectedOutcomes.length === 0 ? "Map this assignment to at least one course learning outcome." : `Aligned to ${selectedOutcomes.length} outcome${selectedOutcomes.length > 1 ? "s" : ""} — strong accreditation signal.`,
        assignText.length < 60 ? "Prompt could be more specific — students may need additional context." : "Prompt length and specificity look strong.",
      ],
    });
  };

  // --- Sage helpers ---
  const SAGE_CONTEXT = {
    "Dashboard": "What's on your mind today? Anything I can help with?",
    "Pedagogy Studio": "Let's look at what you're teaching. What would you like to think through?",
    "Slide Studio": "Let's give the students something they remember. What can we make?",
    "Micro-Learning": "Something here catch your eye, or are you looking for something specific?",
    "Think Tank": "Good thinking happens in community. What are you wrestling with?",
    "Course Portfolio": "Your work, all in one place. What do you want to reflect on?",
    "Reports": "Documentation doesn't have to feel like a chore. What do you need?",
    "Wellness": "How are you doing — really?",
  };

  const sageGreeting = () => {
    return SAGE_CONTEXT[page] || "Good to see you. What are you working through today?";
  };

  const openSage = () => {
    setKlasOptions({ options: [], multiSelect: false, questionType: null, promoted: [] });
    setKlasSelected([]);
    setKlasOtherMode(null);
    if (typeof gtag === "function") gtag("event", "sage_chat_opened");
    if (sageMessages.length === 0) {
      setSageMessages([{ role: "assistant", content: sageGreeting() }]);
      setKlasCore4({ subject: "", level: "", building: "", format: "", goal: "" });
      setKlasConversationId(null);
    }
    setSageOpen(true);
  };

  const createKlasConversation = async (coreContext, messagesArray, currentMode = 'confirming') => {
    try {
      const labelForTitle = coreContext.format || coreContext.building;
      const title = (labelForTitle && coreContext.subject)
        ? `${labelForTitle} — ${coreContext.subject}${coreContext.level ? ` (${coreContext.level})` : ""}`
        : "Untitled brainstorm";
      const { data, error } = await supabase.from("klas_conversations").insert({
        user_id: session.user.id,
        title,
        core_4_context: coreContext,
        messages: messagesArray,
        current_mode: currentMode,
        message_count: messagesArray.length,
        reached_mode_2: false,
      }).select("id").single();
      if (error) { console.warn("[Klas] Create conversation failed:", error.message); return null; }
      return data.id;
    } catch (e) { console.warn("[Klas] Create conversation error:", e.message); return null; }
  };

  const updateKlasConversation = async (conversationId, updates) => {
    if (!conversationId) return false;
    try {
      const { error } = await supabase.from("klas_conversations").update(updates).eq("id", conversationId);
      if (error) { console.warn("[Klas] Update conversation failed:", error.message); return false; }
      return true;
    } catch (e) { console.warn("[Klas] Update conversation error:", e.message); return false; }
  };

  const stripKlasFiller = (text) => {
    return text.replace(/^(Great[,!]?\s*|Perfect[,!]?\s*)/i, "").trim();
  };

  const detectKlasQuickReplies = (reply) => {
    const optionsMatch = reply.match(/<<OPTIONS:\s*(.+?)>>/);
    const options = optionsMatch ? optionsMatch[1].split("|").map(o => o.trim()).filter(Boolean) : [];

    const core4Match5 = reply.match(/<<CORE_4:\s*subject="([^"]*)",\s*level="([^"]*)",\s*building="([^"]*)",\s*format="([^"]*)",\s*goal="([^"]*)"\s*>>/);
    const core4Match4 = !core4Match5 ? reply.match(/<<CORE_4:\s*subject="([^"]*)",\s*level="([^"]*)",\s*building="([^"]*)",\s*goal="([^"]*)"\s*>>/) : null;
    const core4 = core4Match5 ? { subject: core4Match5[1], level: core4Match5[2], building: core4Match5[3], format: core4Match5[4], goal: core4Match5[5] }
      : core4Match4 ? { subject: core4Match4[1], level: core4Match4[2], building: core4Match4[3], format: "", goal: core4Match4[4] }
      : null;

    const cleanedReply = reply
      .replace(/\s*<<OPTIONS:\s*.+?>>/g, "")
      .replace(/\s*<<CORE_4:\s*.+?>>/g, "")
      .trim();
    return { options, core4, cleanedReply };
  };

  const loadPromotedOptions = (questionType) => {
    if (!questionType) return;
    getPromotedKlasOptions(questionType)
      .then(promoted => {
        if (promoted.length === 0) return;
        setKlasOptions(prev => {
          if (prev.questionType !== questionType) return prev;
          const existing = new Set(prev.options.map(o => o.toLowerCase()));
          const newOpts = promoted.filter(p => !existing.has(p.toLowerCase()));
          if (newOpts.length === 0) return prev;
          // Insert promoted options before "Other"
          const otherIdx = prev.options.indexOf("Other");
          const before = otherIdx >= 0 ? prev.options.slice(0, otherIdx) : prev.options;
          const after = otherIdx >= 0 ? prev.options.slice(otherIdx) : [];
          return { ...prev, options: [...before, ...newOpts, ...after], promoted: [...prev.promoted, ...newOpts] };
        });
      })
      .catch(err => console.error("[Klas] Failed to load promoted options:", err));
  };

  const sendQuickReplyMessage = async (text) => {
    const expandStepTriggered = text === "Bigger view";
    const userMsg = { role: "user", content: text };
    const updated = [...sageMessagesRef.current, userMsg];
    sageMessagesRef.current = updated;
    setSageMessages(updated);
    setSageInput("");
    setSageSending(true);
    try {
      const apiMessages = updated
        .filter((m, i) => !(i === 0 && m.role === "assistant"))
        .map(m => ({ role: m.role, content: m.content }));
      const reply = await sendSageChat({ messages: apiMessages, currentPage: page, courseName: course || null });
      if (!reply) throw new Error("Empty response");
      const cleaned = stripKlasFiller(reply);
      const { options, core4, cleanedReply } = detectKlasQuickReplies(cleaned);
      const withReply = [...updated, { role: "assistant", content: cleanedReply }];
      sageMessagesRef.current = withReply;
      setSageMessages(withReply);
      setKlasOptions({ options, multiSelect: false, questionType: null, promoted: [] });
      const previousCore4 = klasCore4Ref.current;
      const updatedCore4 = core4 ? { subject: core4.subject || previousCore4.subject, level: core4.level || previousCore4.level, building: core4.building || previousCore4.building, format: core4.format || previousCore4.format, goal: core4.goal || previousCore4.goal } : previousCore4;
      if (core4) { klasCore4Ref.current = updatedCore4; setKlasCore4(updatedCore4); }

      // SAVE TRIGGER 1: Create conversation at Bridge (all 4 Core items filled, no conversation yet)
      if (!klasConversationId && updatedCore4.subject && updatedCore4.level && updatedCore4.building && updatedCore4.goal) {
        const newId = await createKlasConversation(updatedCore4, withReply, 'confirming');
        if (newId) setKlasConversationId(newId);
      }

      if (expandStepTriggered) {
        // SAVE TRIGGER 2: Mode 2 starts
        if (klasConversationId) updateKlasConversation(klasConversationId, { current_mode: 'brainstorming', reached_mode_2: true, messages: withReply, message_count: withReply.length });
        setSageOpen(false);
        setKlasMode2Open(true);
        if (typeof gtag === "function") gtag("event", "klas_mode2_opened", { trigger: "expand_step" });
      } else if (/let('s| us) (start|build|create|draft|design) (the |your |an |a )?assignment/i.test(cleanedReply) ||
          /open(ing)? the assignment builder/i.test(cleanedReply)) {
        setSageBuilderOpen(true);
        if (typeof gtag === "function") gtag("event", "assignment_builder_opened", { trigger: "sage_auto" });
      } else if (klasConversationId) {
        // SAVE TRIGGER 3: Update after any other message when conversation exists
        updateKlasConversation(klasConversationId, { messages: withReply, message_count: withReply.length, core_4_context: updatedCore4 });
      }
    } catch (err) {
      console.error("[Klas] Chat error:", err);
      setSageMessages(prev => [...prev, { role: "assistant", content: "Hmm, I'm having trouble connecting right now. Try again in a moment! 🌿" }]);
    } finally {
      setSageSending(false);
    }
  };

  const handleQuickReply = (option) => {
    if (option === "Other") {
      setKlasOtherMode(klasOptions.questionType);
      setKlasOptions({ options: [], multiSelect: false, questionType: null });
      setKlasSelected([]);
      if (sageTextareaRef.current) sageTextareaRef.current.focus();
      return;
    }
    if (klasOptions.multiSelect) {
      // Toggle checkbox selection
      setKlasSelected(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
      return;
    }
    // Single-select: send immediately
    setKlasOptions({ options: [], multiSelect: false, questionType: null });
    setKlasSelected([]);
    setKlasOtherMode(null);
    sendQuickReplyMessage(option);
  };

  const handleMultiSelectSend = () => {
    if (klasSelected.length === 0) return;
    const text = klasSelected.join(", ");
    setKlasOptions({ options: [], multiSelect: false, questionType: null });
    setKlasSelected([]);
    setKlasOtherMode(null);
    sendQuickReplyMessage(text);
  };

  const handleSageSend = async () => {
    const text = sageInput.trim();
    if (!text || sageSending) return;
    // If in "Other" mode, save the typed response to Supabase
    if (klasOtherMode) {
      upsertKlasOtherResponse(klasOtherMode, text).catch(err => console.error("[Klas] Other save error:", err));
      setKlasOtherMode(null);
    }
    const userMsg = { role: "user", content: text };
    const updated = [...sageMessagesRef.current, userMsg];
    sageMessagesRef.current = updated;
    setSageMessages(updated);
    setSageInput("");
    setKlasOptions({ options: [], multiSelect: false, questionType: null, promoted: [] });
    setKlasSelected([]);
    setKlasOtherMode(null);
    setSageSending(true);
    try {
      // Anthropic API requires first message to be role:"user".
      // Skip the local-only assistant greeting so the array starts with user.
      const apiMessages = updated
        .filter((m, i) => !(i === 0 && m.role === "assistant"))
        .map(m => ({ role: m.role, content: m.content }));

      console.log("[Klas] Sending to Edge Function:", JSON.stringify({ type: "sage-chat", messageCount: apiMessages.length, firstRole: apiMessages[0]?.role, currentPage: page }));
      const reply = await sendSageChat({
        messages: apiMessages,
        currentPage: page,
        courseName: course || null,
      });
      if (!reply) throw new Error("Empty response");
      const cleaned = stripKlasFiller(reply);
      const { options, core4, cleanedReply } = detectKlasQuickReplies(cleaned);
      const withReplyH = [...updated, { role: "assistant", content: cleanedReply }];
      sageMessagesRef.current = withReplyH;
      setSageMessages(withReplyH);
      setKlasOptions({ options, multiSelect: false, questionType: null, promoted: [] });
      const previousCore4H = klasCore4Ref.current;
      const updatedCore4H = core4 ? { subject: core4.subject || previousCore4H.subject, level: core4.level || previousCore4H.level, building: core4.building || previousCore4H.building, format: core4.format || previousCore4H.format, goal: core4.goal || previousCore4H.goal } : previousCore4H;
      if (core4) { klasCore4Ref.current = updatedCore4H; setKlasCore4(updatedCore4H); }

      // SAVE TRIGGER 1: Create conversation at Bridge (all 4 filled, no conversation yet)
      if (!klasConversationId && updatedCore4H.subject && updatedCore4H.level && updatedCore4H.building && updatedCore4H.goal) {
        const newId = await createKlasConversation(updatedCore4H, withReplyH, 'confirming');
        if (newId) setKlasConversationId(newId);
      } else if (klasConversationId) {
        // SAVE TRIGGER 3: Update after any message when conversation exists
        updateKlasConversation(klasConversationId, { messages: withReplyH, message_count: withReplyH.length, core_4_context: updatedCore4H });
      }

      // Auto-open Assignment Builder modal if Sage's reply suggests building an assignment
      if (/let('s| us) (start|build|create|draft|design) (the |your |an |a )?assignment/i.test(cleanedReply) ||
          /open(ing)? the assignment builder/i.test(cleanedReply)) {
        setSageBuilderOpen(true);
        if (typeof gtag === "function") gtag("event", "assignment_builder_opened", { trigger: "sage_auto" });
      }
    } catch (err) {
      console.error("[Klas] Chat error:", err);
      setSageMessages(prev => [...prev, { role: "assistant", content: "Hmm, I'm having trouble connecting right now. Try again in a moment! 🌿" }]);
    } finally {
      setSageSending(false);
    }
  };


  // --- Beta Agreement (public, no login required) ---
  if (showBeta) {
    return (
      <BetaAgreement
        onBack={() => { setShowBeta(false); window.location.hash = ""; }}
        onSignUp={() => { setShowBeta(false); window.location.hash = ""; setShowLanding(false); setAuthMode("signup"); }}
      />
    );
  }

  // --- Research Library (public, no login required) ---
  if (showResearch) {
    return (
      <ResearchLibrary
        onBack={() => { setShowResearch(false); window.location.hash = ""; }}
        onSignUp={() => { setShowResearch(false); window.location.hash = ""; setShowLanding(false); setAuthMode("signup"); }}
      />
    );
  }

  // --- Terms & Privacy page ---
  if (showTerms) {
    return (
      <Terms
        initialTab={showTerms}
        onBack={() => setShowTerms(null)}
      />
    );
  }

  // Auth loading
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><LogoMark size={58} /></div>
          <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 6 }}>Loading KlasUp...</div>
          <div style={{ fontSize: 13, color: C.muted }}>Checking your session</div>
        </div>
      </div>
    );
  }

  // --- Landing page for first-time visitors ---
  if (!session && showLanding) {
    return (
      <Landing
        onSignIn={() => { setShowLanding(false); setAuthMode("login"); }}
        onGetStarted={() => { setShowLanding(false); setAuthMode("signup"); }}
        onTerms={() => setShowTerms("terms")}
        onPrivacy={() => setShowTerms("privacy")}
        onResearch={() => { setShowResearch(true); window.location.hash = "#/research"; }}
      />
    );
  }

  // --- Login / Signup / Forgot Password screen ---
  if (!session) {
    const isForgot = authMode === "forgot";
    const inputStyle = { width: "100%", padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: F.body, fontSize: 14, boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" };
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 50%, ${C.teal} 100%)`, fontFamily: F.body, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 420, maxWidth: "92vw" }}>
          {/* Logo & tagline */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <Logo size="md" dark onClick={() => setShowLanding(true)} />
            </div>
            <div style={{ fontSize: 15, color: C.tealMid, fontStyle: "italic" }}>Teach smarter. Not harder.</div>
          </div>

          {/* Auth card */}
          <div style={{ background: C.white, borderRadius: 18, padding: "2rem 2rem 1.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            {isForgot ? (
              <div style={{ fontFamily: F.display, fontSize: 20, marginBottom: 4, color: C.navy }}>Reset Your Password</div>
            ) : (
              /* Toggle */
              <div style={{ display: "flex", background: C.ivoryDark, borderRadius: 10, padding: 3, marginBottom: 24 }}>
                {[["login", "Log In"], ["signup", "Sign Up"]].map(([k, v]) => (
                  <button key={k} onClick={() => { setAuthMode(k); setAuthError(null); setAuthSuccess(null); }}
                    style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer",
                      background: authMode === k ? C.white : "transparent", color: authMode === k ? C.navy : C.muted,
                      boxShadow: authMode === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>
                    {v}
                  </button>
                ))}
              </div>
            )}

            {isForgot && <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Enter your email and we'll send a reset link.</div>}

            <form onSubmit={handleAuth}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Email</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                  placeholder="you@university.edu" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.teal} onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              {!isForgot && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Password</label>
                  <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                    placeholder={authMode === "signup" ? "Create a password (min 6 characters)" : "Enter your password"}
                    minLength={6} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.teal} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
              )}

              {/* Remember me & Forgot password (login only) */}
              {authMode === "login" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, fontSize: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: C.muted }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      style={{ accentColor: C.teal }} />
                    Remember me on this device
                  </label>
                  <span onClick={() => { setAuthMode("forgot"); setAuthError(null); setAuthSuccess(null); }}
                    style={{ color: C.teal, fontWeight: 700, cursor: "pointer" }}>Forgot password?</span>
                </div>
              )}

              {/* Terms of Service checkbox (signup only) */}
              {authMode === "signup" && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20, fontSize: 12, color: C.muted, cursor: "pointer" }}>
                  <input type="checkbox" checked={tosAccepted} onChange={e => setTosAccepted(e.target.checked)}
                    style={{ accentColor: C.teal, marginTop: 2 }} />
                  <span>I agree to the <span onClick={(e) => { e.preventDefault(); setShowTerms("terms"); }} style={{ color: C.teal, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span> and <span onClick={(e) => { e.preventDefault(); setShowTerms("privacy"); }} style={{ color: C.teal, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>. KlasUp is FERPA-compliant and does not store student personally identifiable information.</span>
                </label>
              )}

              {authError && (
                <div style={{ background: C.roseLight, color: C.rose, fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div style={{ background: C.sageLight, color: C.sage, fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>
                  {authSuccess}
                </div>
              )}

              <button type="submit" disabled={authSubmitting}
                style={{ width: "100%", padding: "14px", background: C.teal, color: C.white, border: "none", borderRadius: 12, fontFamily: F.accent, fontWeight: 700, fontSize: 15, cursor: authSubmitting ? "wait" : "pointer", opacity: authSubmitting ? 0.7 : 1, transition: "opacity 0.2s" }}>
                {authSubmitting ? "Please wait..." : isForgot ? "Send Reset Link" : authMode === "signup" ? "Get Started" : "Log In"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: C.muted }}>
              {isForgot ? (
                <span>Remember your password? <span onClick={() => { setAuthMode("login"); setAuthError(null); setAuthSuccess(null); }} style={{ color: C.teal, fontWeight: 700, cursor: "pointer" }}>Back to login</span></span>
              ) : authMode === "login" ? (
                <span>New to KlasUp? <span onClick={() => { setAuthMode("signup"); setAuthError(null); setAuthSuccess(null); }} style={{ color: C.teal, fontWeight: 700, cursor: "pointer" }}>Create an account</span></span>
              ) : (
                <span>Already have an account? <span onClick={() => { setAuthMode("login"); setAuthError(null); setAuthSuccess(null); }} style={{ color: C.teal, fontWeight: 700, cursor: "pointer" }}>Log in</span></span>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Teach smarter. Not harder.
          </div>
        </div>
      </div>
    );
  }

  // --- Profile setup (after first signup) — Step 1 of onboarding ---
  if (profileSetup) {
    const fld = { width: "100%", padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: F.body, fontSize: 14, boxSizing: "border-box" };
    return (
      <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 520, maxWidth: "92vw" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Logo size="sm" />
            </div>
            <div style={{ fontSize: 14, color: C.muted, fontStyle: "italic" }}>Teach smarter. Not harder.</div>
          </div>

          {/* Progress indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            {["Your Profile", "Your Courses"].map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: F.accent,
                  background: i + 1 <= onboardingStep ? C.tealBright : C.ivoryDark, color: i + 1 <= onboardingStep ? C.white : C.muted }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 600, color: i + 1 === onboardingStep ? C.navy : C.muted }}>{label}</span>
                {i === 0 && <div style={{ width: 40, height: 2, background: onboardingStep > 1 ? C.tealBright : C.ivoryDark, borderRadius: 1 }} />}
              </div>
            ))}
          </div>

          <Card style={{ padding: "2rem" }}>
            <div style={{ fontFamily: F.display, fontSize: 22, marginBottom: 4 }}>Welcome! Tell us about yourself.</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>We'll use this to personalize your experience.</div>
            <div style={{ fontSize: 12, color: C.tealBright, fontWeight: 600, marginBottom: 24 }}>You're starting with a 14-day free Pro trial!</div>

            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Your Name *</label>
                  <input required value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Dr. Sarah Chen" style={fld} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Institution</label>
                  <input value={profileForm.institution} onChange={e => setProfileForm(p => ({ ...p, institution: e.target.value }))}
                    placeholder="e.g. Boston University" style={fld} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Job Title</label>
                  <select value={profileForm.job_title} onChange={e => setProfileForm(p => ({ ...p, job_title: e.target.value }))}
                    style={{ ...fld, color: profileForm.job_title ? C.text : C.muted }}>
                    <option value="">Select title...</option>
                    {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Which LMS do you use?</label>
                  <select value={profileForm.lms} onChange={e => setProfileForm(p => ({ ...p, lms: e.target.value }))}
                    style={{ ...fld, color: profileForm.lms ? C.text : C.muted }}>
                    <option value="">Select LMS...</option>
                    {LMS_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Highest Education Level</label>
                  <select value={profileForm.education_level} onChange={e => setProfileForm(p => ({ ...p, education_level: e.target.value }))}
                    style={{ ...fld, color: profileForm.education_level ? C.text : C.muted }}>
                    <option value="">Select...</option>
                    {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Dr. prefix suggestion during onboarding */}
              {DR_ELIGIBLE.includes(profileForm.education_level) && !hasDrPrefix(profileForm.name) && !profileForm._drDismissed && (
                <div style={{ marginBottom: 14, padding: "10px 14px", background: C.tealLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, color: C.teal }}>Would you like to add <strong>Dr.</strong> to your display name?</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => setProfileForm(p => ({ ...p, name: addDrPrefix(p.name) }))}
                      style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "5px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Yes</button>
                    <button type="button" onClick={() => setProfileForm(p => ({ ...p, _drDismissed: true }))}
                      style={{ background: C.white, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>No thanks</button>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
                Fields marked with * are required. You can update other fields later in Settings.
              </div>

              {authError && (
                <div style={{ background: C.roseLight, color: C.rose, fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>
                  {authError}
                </div>
              )}

              <button type="submit" disabled={!profileForm.name.trim()}
                style={{ width: "100%", padding: "14px", background: C.tealBright, color: C.white, border: "none", borderRadius: 12, fontFamily: F.accent, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: profileForm.name.trim() ? 1 : 0.4 }}>
                Continue to Course Setup
              </button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Loading courses
  if (coursesLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><LogoMark size={58} /></div>
          <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 6 }}>Loading KlasUp...</div>
          <div style={{ fontSize: 13, color: C.muted }}>Connecting to your courses</div>
        </div>
      </div>
    );
  }

  // Onboarding — first-time course setup (Step 2)
  if (showOnboarding) {
    return (
      <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 520, maxWidth: "95vw" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Logo size="sm" />
            </div>
            <div style={{ fontSize: 14, color: C.muted, fontStyle: "italic" }}>Teach smarter. Not harder.</div>
          </div>

          {/* Progress indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            {["Your Profile", "Your Courses"].map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: F.accent,
                  background: C.tealBright, color: C.white }}>
                  {i === 0 ? "✓" : "2"}
                </div>
                <span style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 600, color: i === 1 ? C.navy : C.muted }}>{label}</span>
                {i === 0 && <div style={{ width: 40, height: 2, background: C.tealBright, borderRadius: 1 }} />}
              </div>
            ))}
          </div>

          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: F.display, fontSize: 22, marginBottom: 4 }}>Welcome! Let's set up your courses.</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Add the courses you're teaching this term. You can always change these later in Settings.</div>

            {/* Added courses list */}
            {onboardingCourses.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {onboardingCourses.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.tealLight, borderRadius: 10, marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{c.course_code}</span>
                      <span style={{ fontSize: 13, color: C.muted, marginLeft: 8 }}>{c.course_name}</span>
                      {c.section && <span style={{ fontSize: 11, color: C.teal, marginLeft: 8 }}>Sec {c.section}</span>}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: F.accent, color: C.teal, fontWeight: 700 }}>{c.term_code}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add course form */}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Course Code *</label>
                <input value={onboardingForm.course_code} onChange={e => setOnboardingForm(p => ({ ...p, course_code: e.target.value }))}
                  placeholder="e.g. MKT 301" style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Course Name *</label>
                <input value={onboardingForm.course_name} onChange={e => setOnboardingForm(p => ({ ...p, course_name: e.target.value }))}
                  placeholder="e.g. Consumer Behavior" style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Section</label>
                <input value={onboardingForm.section} onChange={e => setOnboardingForm(p => ({ ...p, section: e.target.value }))}
                  placeholder="e.g. 001" style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Term Code *</label>
                <input value={onboardingForm.term_code} onChange={e => setOnboardingForm(p => ({ ...p, term_code: e.target.value }))}
                  placeholder="e.g. Fall 2025" style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Term Start Date</label>
                <input type="date" value={onboardingForm.term_start} onChange={e => setOnboardingForm(p => ({ ...p, term_start: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Number of Weeks</label>
                <input type="number" min={1} max={52} value={onboardingForm.num_weeks} onChange={e => setOnboardingForm(p => ({ ...p, num_weeks: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <button
              disabled={!onboardingForm.course_code.trim() || !onboardingForm.course_name.trim() || !onboardingForm.term_code.trim()}
              onClick={async () => {
                try {
                  const row = await addCourseFromForm(onboardingForm);
                  setOnboardingCourses(prev => [...prev, row]);
                  setOnboardingForm({ course_code: "", course_name: "", section: "", term_code: onboardingForm.term_code, term_start: onboardingForm.term_start, num_weeks: onboardingForm.num_weeks });
                } catch (err) { alert("Error adding course: " + err.message); }
              }}
              style={{ background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: (!onboardingForm.course_code.trim() || !onboardingForm.course_name.trim() || !onboardingForm.term_code.trim()) ? 0.4 : 1 }}>
              + Add Course
            </button>
          </Card>

          {onboardingCourses.length > 0 && (
            <button onClick={() => { setShowOnboarding(false); if (session?.user) trackEvent(session.user.id, "onboarding_completed"); }}
              style={{ width: "100%", background: C.tealBright, color: C.white, border: "none", borderRadius: 12, padding: "14px", fontFamily: F.accent, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Get Started with {onboardingCourses.length} Course{onboardingCourses.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text, display: "flex", overflowX: "hidden" }}>

      {/* Mobile sidebar overlay backdrop */}
      {mob && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 8999, transition: "opacity 0.25s" }} />
      )}

      {/* Sidebar */}
      <div style={{
        width: mob ? 280 : 220, background: C.navy, display: "flex", flexDirection: "column", padding: "0",
        position: mob ? "fixed" : "sticky", top: 0, height: "100vh", flexShrink: 0, overflowY: "auto",
        zIndex: mob ? 9000 : "auto",
        transform: mob && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.25s ease",
        left: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ marginBottom: 4 }}>
            <Logo size="sm" dark onClick={() => setPage("Dashboard")} />
          </div>
          <div style={{ fontSize: 11, color: C.tealMid, fontStyle: "italic", paddingLeft: 42 }}>Teach smarter. Not harder.</div>
        </div>

        {/* Account info */}
        <div style={{ margin: "0.75rem 0.75rem 0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.5rem 0.75rem" }}>
          <div style={{ fontSize: 12, color: C.white, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.name || "Faculty"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.institution || session?.user?.email}
          </div>
          <div style={{ display: "inline-block", fontSize: 10, fontFamily: F.accent, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
            background: tier === "admin" ? `${C.rose}33` : tier === "institutional" ? `${C.gold}33` : tier === "pro" ? `${C.tealBright}22` : "rgba(255,255,255,0.08)",
            color: tier === "admin" ? C.rose : tier === "institutional" ? C.gold : tier === "pro" ? C.tealBright : "rgba(255,255,255,0.45)" }}>
            {tier === "admin" ? "Admin" : tier.charAt(0).toUpperCase() + tier.slice(1)}{subStatus.trialActive ? " Trial" : ""}
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, paddingTop: 4 }}>
          {(() => {
            const canSeeCourseArchitect = profile?.role === "admin" && !gatedPageIds.has("Course Architect");
            const visible = NAV.filter(n =>
              (!n.adminOnly || profile?.role === "admin") &&
              !gatedPageIds.has(n.id) &&
              !(n.hiddenViaCourseArchitect && canSeeCourseArchitect)
            );
            // Cluster labels: only show if at least one item in that cluster is visible
            const CLUSTERS = ["LEARNING HUB", "THE VAULT"];
            const clusterHasItems = {};
            for (const cl of CLUSTERS) {
              const startIdx = visible.findIndex(n => n.cluster === cl);
              clusterHasItems[cl] = startIdx !== -1;
            }
            return visible.flatMap(n => {
              const items = [];
              if (n.cluster && clusterHasItems[n.cluster]) {
                items.push(<div key={`cluster-${n.cluster}`} style={{ fontFamily: F.display, fontWeight: 700, fontSize: 10, color: C.tealMid, textTransform: "uppercase", letterSpacing: "1.5px", padding: "12px 14px 4px" }}>{n.cluster}</div>);
              }
              items.push(
                <button key={n.id} onClick={() => { if (n.id === "Pedagogical Resources") { setShowResearch(true); window.location.hash = "#/research"; if (mob) setSidebarOpen(false); return; } setPage(n.id); if (mob) setSidebarOpen(false); if (n.id === "Admin") loadAdminData(); if (n.id === "Settings") setSettingsProfileForm(null); if (n.id === "Pricing" && typeof gtag === "function") gtag("event", "pricing_page_viewed"); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: page === n.id ? `${C.tealBright}18` : "none", border: "none", borderLeft: page === n.id ? `3px solid ${C.tealBright}` : "3px solid transparent", color: page === n.id ? C.white : "rgba(255,255,255,0.45)", fontFamily: F.body, fontSize: 13, fontWeight: page === n.id ? 600 : 400, textAlign: "left", padding: "0.55rem 1.25rem", cursor: "pointer", minHeight: 44 }}>
                  <span style={{ fontSize: 13, opacity: 0.8 }}>{n.icon}</span>{n.id}
                </button>
              );
              return items;
            });
          })()}
        </div>

        {/* Logout */}
        <button onClick={handleSignOut}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", borderTop: "0.5px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontFamily: F.body, fontSize: 12, padding: "0.75rem 1.25rem", cursor: "pointer", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
          <span style={{ fontSize: 14 }}>⎋</span> Sign Out
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: mob ? "1rem" : "2rem", overflowY: "auto", maxWidth: 1200, width: "100%", boxSizing: "border-box" }}>

        {/* Mobile hamburger */}
        {mob && (
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: C.navy, border: "none", cursor: "pointer", fontSize: 22, padding: "6px 12px", borderRadius: 8, color: C.white, lineHeight: 1, minHeight: 44 }}>
              ☰
            </button>
          </div>
        )}

        {/* ── SUBSCRIPTION BANNERS ── */}
        {subStatus.trialExpired && !dismissedTrialBanner && (
          <div style={{ background: C.roseLight, border: `1px solid ${C.rose}44`, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: F.accent, fontWeight: 700, fontSize: 14, color: C.rose, marginBottom: 2 }}>Your Pro trial has ended</div>
              <div style={{ fontSize: 13, color: C.muted }}>Upgrade to Pro to unlock all features, unlimited courses, and AI-powered insights.</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={upgrade} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "8px 18px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Upgrade Now</button>
              <button onClick={() => setDismissedTrialBanner(true)} style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", padding: "4px" }}>×</button>
            </div>
          </div>
        )}

        {subStatus.trialExpiringSoon && !subStatus.trialExpired && (
          <div style={{ background: C.goldLight, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: F.accent, fontWeight: 700, fontSize: 14, color: C.gold, marginBottom: 2 }}>Your Pro access expires in {subStatus.daysLeft} day{subStatus.daysLeft !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: 13, color: C.muted }}>Upgrade now to keep all your Pro features.</div>
            </div>
            <button onClick={upgrade} style={{ background: C.gold, color: C.white, border: "none", borderRadius: 8, padding: "8px 18px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>Upgrade</button>
          </div>
        )}

        {/* Welcome banner — shows on all pages for new users */}
        {showWelcomeBanner && (
          <div style={{
            background: "#1B2B4B", color: "#fff", borderRadius: 10, padding: "0 16px",
            marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, height: 44, overflow: "hidden",
            transition: "opacity 0.3s ease, height 0.3s ease, margin 0.3s ease, padding 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>&#10022;</span>
              <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                You're in! Want to see what KlasUp can do?
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <button onClick={() => { localStorage.setItem("klasup_welcome_dismissed", "1"); setShowWelcomeBanner(false); setShowOnboardingTour(true); }}
                style={{
                  background: "#2A9D8F", color: "#fff", border: "none", borderRadius: 8,
                  padding: "5px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                Take the Tour
              </button>
              <button onClick={() => { setShowWelcomeBanner(false); localStorage.setItem("klasup_welcome_dismissed", "1"); }}
                style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.5)",
                  fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1,
                }}>
                &#10005;
              </button>
            </div>
          </div>
        )}

        {/* Announcements from admin */}
        {announcements.map(a => (
          <div key={a.id} style={{ background: C.tealLight, border: `1px solid ${C.tealBright}44`, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: F.accent, fontWeight: 700, fontSize: 13, color: C.teal, marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{a.body}</div>
            </div>
            <button onClick={() => { dismissAnnouncement(session.user.id, a.id); setAnnouncements(prev => prev.filter(x => x.id !== a.id)); }}
              style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer", padding: "4px", flexShrink: 0 }}>×</button>
          </div>
        ))}

        {/* ── COMING SOON gate for flag-disabled pages ── */}
        {gatedPageIds.has(page) && <ComingSoon />}

        {/* ── DASHBOARD ── */}
        {page === "Dashboard" && (
          <div style={{ display: "flex", gap: mob ? 0 : 20, flexDirection: mob ? "column" : "row" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* ── SECTION 1: GREETING ── */}
            {(() => {
              const hour = new Date().getHours();
              const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
              const displayName = profile?.name
                ? (() => {
                    const parts = profile.name.trim().split(" ");
                    const lastName = parts.slice(-1)[0];
                    return DR_ELIGIBLE.includes(profile.education_level) ? `Dr. ${lastName}` : parts[0];
                  })()
                : null;
              const activeCourse = dbCourses.find(c => c.id === activeCourseId) || dbCourses[0];
              const termLabel = activeCourse?.term_code || "";
              const weekNum = parseInt((week || "").replace(/\D/g, ""), 10) || null;
              const totalWeeks = activeCourse?.num_weeks || null;
              const subtitleParts = [
                activeCourse ? (activeCourse.course_code + (activeCourse.section ? ` - ${activeCourse.section}` : "")) : null,
                termLabel || null,
                weekNum ? `Week ${weekNum}${totalWeeks ? ` of ${totalWeeks}` : ""}` : null,
              ].filter(Boolean);
              return (
                <PageHeader
                  breadcrumb="🏠 Dashboard"
                  title={`${greeting}${displayName ? `, ${displayName}` : ""}`}
                  subtitle={subtitleParts.length > 0 ? subtitleParts.join(" · ") : "Welcome to KlasUp"}
                  featureInfo={<FeatureInfo sectionId="dashboard" />}
                />
              );
            })()}

            {/* ── SECTION 2: COURSE TILE GRID ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontFamily: F.accent, color: C.muted, fontWeight: 700 }}>YOUR COURSES</div>
              <span onClick={() => setPage("Settings")} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.teal, cursor: "pointer" }}>Manage courses</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
              {dbCourses.map(c => (
                <div key={c.id} role="button" tabIndex={0}
                  onClick={() => { handleSetActiveCourse(c.id); setPage("Course Architect"); }}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSetActiveCourse(c.id); setPage("Course Architect"); } }}
                  style={{ background: "#1B2B4B", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", outline: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(27,43,75,0.18)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  onFocus={e => { e.currentTarget.style.boxShadow = "0 0 0 2px #2A9D8F"; }}
                  onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: C.white }}>{(c.course_code || "").toUpperCase()}</span>
                    {c.section && <span style={{ fontFamily: F.accent, fontSize: 12, color: "#9FB3D4" }}>· Section {c.section}</span>}
                  </div>
                  <div style={{ fontFamily: F.accent, fontSize: 12, color: "#9FB3D4" }}>
                    {[c.term_code, c.num_weeks ? `${c.num_weeks} weeks` : null].filter(Boolean).join(" · ") || "No term set"}
                  </div>
                </div>
              ))}
            </div>

            {/* ── CAREER CONNECTIONS ── */}
            <div id="career-anchor" style={{ marginBottom: 14 }}>
                    {(() => {
                      const ccId = careerSelectedCourseId || activeCourseId || (dbCourses[0] && dbCourses[0].id) || null;
                      if (!ccId) return null;
                      const ccCourse = dbCourses.find(x => x.id === ccId);
                      const data = careerData[ccId];
                      const loading = careerLoading[ccId];
                      const errored = careerError[ccId];
                      const editingDiscipline = disciplineEdit[ccId] != null;
                      const topicOpen = topicInput[ccId] != null;
                      const readyTopic = data?.topics?.find(t => t.status === "ready");

                      // Fetch career data on select (if not cached)
                      const fetchCareer = async (courseId) => {
                        if (careerData[courseId] || careerLoading[courseId]) return;
                        setCareerLoading(prev => ({ ...prev, [courseId]: true }));
                        setCareerError(prev => ({ ...prev, [courseId]: false }));
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const cc = dbCourses.find(x => x.id === courseId);
                          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-connections`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                            body: JSON.stringify({ course_id: courseId, course_title: cc?.course_name || cc?.course_code || "" }),
                          });
                          const json = await res.json();
                          if (!res.ok) throw new Error(json.error || "Server error");
                          setCareerData(prev => ({ ...prev, [courseId]: json }));
                        } catch (e) {
                          console.error("[career-connections] fetch failed:", e.message);
                          setCareerError(prev => ({ ...prev, [courseId]: true }));
                        } finally {
                          setCareerLoading(prev => ({ ...prev, [courseId]: false }));
                        }
                      };

                      // Auto-fetch on mount/select
                      if (!data && !loading && !errored) fetchCareer(ccId);

                      const handleDisciplineSubmit = async (val) => {
                        if (!val.trim()) return;
                        setDisciplineEdit(prev => ({ ...prev, [ccId]: null }));
                        setCareerData(prev => ({ ...prev, [ccId]: null }));
                        setCareerLoading(prev => ({ ...prev, [ccId]: true }));
                        setCareerError(prev => ({ ...prev, [ccId]: false }));
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-connections`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                            body: JSON.stringify({ course_id: ccId, course_title: ccCourse?.course_name || ccCourse?.course_code || "", override_discipline: val.trim(), confirmed: true }),
                          });
                          const json = await res.json();
                          if (!res.ok) throw new Error(json.error || "Server error");
                          setCareerData(prev => ({ ...prev, [ccId]: json }));
                        } catch (e) {
                          console.error("[career-connections] discipline correction failed:", e.message);
                          setCareerError(prev => ({ ...prev, [ccId]: true }));
                        } finally {
                          setCareerLoading(prev => ({ ...prev, [ccId]: false }));
                        }
                      };

                      const handleTopicSubmit = async (val) => {
                        if (!val.trim()) return;
                        setTopicInput(prev => ({ ...prev, [ccId]: null }));
                        setCareerLoading(prev => ({ ...prev, [ccId]: true }));
                        setCareerError(prev => ({ ...prev, [ccId]: false }));
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-connections`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                            body: JSON.stringify({ course_id: ccId, course_title: ccCourse?.course_name || ccCourse?.course_code || "", topic: val.trim() }),
                          });
                          const json = await res.json();
                          if (!res.ok) throw new Error(json.error || "Server error");
                          setCareerData(prev => ({ ...prev, [ccId]: json }));
                        } catch (e) {
                          console.error("[career-connections] topic override failed:", e.message);
                          setCareerError(prev => ({ ...prev, [ccId]: true }));
                        } finally {
                          setCareerLoading(prev => ({ ...prev, [ccId]: false }));
                        }
                      };

                      const handleCopy = () => {
                        if (!data?.course) return;
                        const courseName = ccCourse?.course_name || ccCourse?.course_code || "";
                        const lines = [`Why this matters — ${courseName}`, "", data.course.blurb];
                        if (readyTopic) lines.push("", `This week: ${readyTopic.topic}`, readyTopic.narrative);
                        const roles = readyTopic?.roles || data.course.roles || [];
                        const skills = readyTopic?.skills || data.course.skills || [];
                        if (roles.length) lines.push("", `Where this can lead: ${roles.join(", ")}`);
                        if (skills.length) lines.push(`Skills you're building: ${skills.join(", ")}`);
                        navigator.clipboard.writeText(lines.join("\n")).then(() => {
                          setCopiedId(ccId);
                          setTimeout(() => setCopiedId(prev => prev === ccId ? null : prev), 2000);
                        });
                      };

                      return (
                        <div style={{ borderRadius: 14, overflow: "hidden" }}>
                          {/* Gradient header bar */}
                          <div style={{ background: "linear-gradient(135deg, #1B2B4B 0%, #2A9D8F 100%)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontFamily: F.display, fontSize: 17, color: "#FAF7F2" }}>Career Connections</div>
                            {dbCourses.length > 1 && (
                              <select
                                value={ccId}
                                onChange={e => { setCareerSelectedCourseId(e.target.value); }}
                                style={{ fontFamily: F.accent, fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)", color: "#FAF7F2", background: "rgba(255,255,255,0.12)", outline: "none", cursor: "pointer" }}
                              >
                                {dbCourses.map(cx => <option key={cx.id} value={cx.id}>{formatCourseLabel(cx)}</option>)}
                              </select>
                            )}
                          </div>
                          {/* Content area */}
                          <div style={{ background: C.white, padding: "1.25rem", border: "0.5px solid #E4D9C8", borderTop: "none", borderRadius: "0 0 14px 14px" }}>

                          {/* GENERATING */}
                          {loading && (
                            <div>
                              <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted, marginBottom: 12 }}>Klas is mapping where this course leads…</div>
                              {[1, 0.7, 0.4].map((op, si) => (
                                <div key={si} style={{ height: 14, borderRadius: 8, background: `linear-gradient(90deg, #E4D9C8 25%, #FAF7F2 50%, #E4D9C8 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", opacity: op, marginBottom: 8 }} />
                              ))}
                              <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                            </div>
                          )}

                          {/* ERROR */}
                          {!loading && errored && (
                            <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>
                              Couldn't load this right now.{" "}
                              <span onClick={() => { setCareerError(prev => ({ ...prev, [ccId]: false })); setCareerData(prev => { const n = { ...prev }; delete n[ccId]; return n; }); }} style={{ color: C.teal, cursor: "pointer", textDecoration: "underline" }}>Try again</span>
                            </div>
                          )}

                          {/* NEEDS_DISCIPLINE */}
                          {!loading && !errored && data?.needs_discipline && (
                            <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                              Klas needs a bit more about this course to map where it leads — add your syllabus or course materials and try again.
                            </div>
                          )}

                          {/* READY */}
                          {!loading && !errored && data?.course && (() => {
                            const courseData = data.course;
                            const allRoles = readyTopic?.roles || courseData.roles || [];
                            const allSkills = readyTopic?.skills || courseData.skills || [];
                            return (
                              <>
                                {/* Discipline pill + edit */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                  <span style={{ display: "inline-block", background: "#2A9D8F", color: C.white, fontFamily: F.accent, fontSize: 12, fontWeight: 600, borderRadius: 20, padding: "4px 14px" }}>
                                    {data.inferred_discipline}
                                  </span>
                                  {!editingDiscipline && (
                                    <span onClick={() => setDisciplineEdit(prev => ({ ...prev, [ccId]: data.inferred_discipline }))} style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, cursor: "pointer" }}>✎ not right?</span>
                                  )}
                                </div>
                                {editingDiscipline && (
                                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                    <input value={disciplineEdit[ccId] || ""} onChange={e => setDisciplineEdit(prev => ({ ...prev, [ccId]: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleDisciplineSubmit(disciplineEdit[ccId])}
                                      style={{ flex: 1, fontFamily: F.body, fontSize: 13, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none" }} placeholder="e.g. Consumer Psychology" autoFocus />
                                    <button onClick={() => handleDisciplineSubmit(disciplineEdit[ccId])} style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, background: "#2A9D8F", color: C.white, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>Update</button>
                                    <button onClick={() => setDisciplineEdit(prev => ({ ...prev, [ccId]: null }))} style={{ fontFamily: F.accent, fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                                  </div>
                                )}

                                {/* Topic narrative (always visible in condensed) */}
                                {readyTopic && (
                                  <div style={{ background: C.ivory, border: "0.5px solid #E4D9C8", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                                    <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: "#2A9D8F", textTransform: "uppercase", marginBottom: 6 }}>★ This week · {readyTopic.topic}</div>
                                    <p style={{ fontFamily: F.body, fontSize: 13.5, lineHeight: 1.65, color: "#1B2B4B", margin: 0 }}>{readyTopic.narrative}</p>
                                  </div>
                                )}

                                {/* Expand toggle */}
                                <div onClick={() => setExpandedCourseId(prev => prev === ccId ? null : ccId)}
                                  style={{ textAlign: "center", fontFamily: F.accent, fontSize: 12, fontWeight: 600, color: C.teal, cursor: "pointer", padding: "4px 0", marginBottom: expandedCourseId === ccId ? 10 : 0 }}>
                                  {expandedCourseId === ccId ? "hide details ⌃" : "see full — roles, skills, share ⌄"}
                                </div>

                                {/* Expanded details */}
                                {expandedCourseId === ccId && (
                                  <>
                                    <p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.7, color: "#1B2B4B", margin: "0 0 14px 0" }}>{courseData.blurb}</p>

                                    {allRoles.length > 0 && (
                                      <div style={{ marginBottom: 10 }}>
                                        <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Where this can lead</div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{allRoles.map(r => <span key={r} style={{ fontFamily: F.accent, fontSize: 12, border: "1px solid #E4D9C8", borderRadius: 20, padding: "4px 12px", color: "#1B2B4B", background: C.white }}>{r}</span>)}</div>
                                      </div>
                                    )}
                                    {allSkills.length > 0 && (
                                      <div style={{ marginBottom: 14 }}>
                                        <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Skills you're building</div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{allSkills.map(s => <span key={s} style={{ fontFamily: F.accent, fontSize: 12, background: "#E1F5EE", color: "#0F6E56", borderRadius: 20, padding: "4px 12px" }}>{s}</span>)}</div>
                                      </div>
                                    )}

                                    <button onClick={handleCopy} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1B2B4B", color: C.white, fontFamily: F.accent, fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, padding: "12px 0", cursor: "pointer", marginBottom: 4 }}>
                                      <span style={{ fontSize: 15 }}>📋</span> {copiedId === ccId ? "Copied!" : "Share with students"}
                                    </button>
                                    <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 12 }}>Copies everything above — ready to paste into an announcement or slide.</div>

                                    {!topicOpen && (
                                      <div onClick={() => setTopicInput(prev => ({ ...prev, [ccId]: "" }))} style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 600, color: "#2A9D8F", cursor: "pointer" }}>+ connect a different topic</div>
                                    )}
                                    {topicOpen && (
                                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                        <input value={topicInput[ccId] || ""} onChange={e => setTopicInput(prev => ({ ...prev, [ccId]: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleTopicSubmit(topicInput[ccId])}
                                          style={{ flex: 1, fontFamily: F.body, fontSize: 13, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none" }} placeholder="e.g. Survey Design" autoFocus />
                                        <button onClick={() => handleTopicSubmit(topicInput[ccId])} style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, background: "#2A9D8F", color: C.white, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>Go</button>
                                        <button onClick={() => setTopicInput(prev => ({ ...prev, [ccId]: null }))} style={{ fontFamily: F.accent, fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </>
                            );
                          })()}
                          </div>
                        </div>
                      );
                    })()}
            </div>

                  {/* ── SECTION 5: MICRO-LEARNINGS ROW ── */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontFamily: F.accent, color: C.muted, fontWeight: 700 }}>MICRO-LEARNINGS FOR YOU</div>
                      <button onClick={() => setPage("Micro-Learning")}
                        style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.teal, background: "none", border: "none", cursor: "pointer" }}>See all →</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,minmax(0,1fr))", gap: 12 }}>
                      {(() => {
                        const dbMicros = Object.values(microHistory).flat().sort((a, b) => b.timestamp - a.timestamp).flatMap(g => g.recs).slice(0, 3);
                        return dbMicros.length > 0 ? dbMicros : aiMicro.length > 0 ? aiMicro.slice(0, 3) : MICRO.filter(m => can(m.tier)).slice(0, 3);
                      })().map((m, i) => {
                        const TAG_COLORS = {
                          "Active Learning": { color: C.sage, bg: C.sageLight },
                          "Socratic Seminar": { color: C.teal, bg: C.tealLight },
                          "UDL": { color: C.rose, bg: C.roseLight },
                          "Reflection": { color: C.rose, bg: C.roseLight },
                          "Flipped Classroom": { color: C.sage, bg: C.sageLight },
                          "Student Voice": { color: C.gold, bg: C.goldLight },
                          "Assessment Design": { color: C.purple, bg: C.purpleLight },
                          "Scaffolding": { color: C.teal, bg: C.tealLight },
                          "Metacognition": { color: C.purple, bg: C.purpleLight },
                          "Inclusive Pedagogy": { color: C.gold, bg: C.goldLight },
                        };
                        const tc = TAG_COLORS[m.tag] || m.color ? { color: m.color, bg: m.bg } : { color: C.teal, bg: C.tealLight };
                        return (
                          <Card key={i}>
                            <Tag label={m.tag} color={tc.color} bg={tc.bg} />
                            <div style={{ fontFamily: F.display, fontSize: 15, color: C.navy, margin: "8px 0 6px", lineHeight: 1.3 }}>{m.title}</div>
                            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>{m.summary.length > 120 ? m.summary.slice(0, 120) + "…" : m.summary}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 3, height: 20, background: tc.color, borderRadius: 2 }} />
                              <div style={{ fontSize: 11, color: C.navy, fontWeight: 600 }}>→ {m.action.length > 60 ? m.action.slice(0, 60) + "…" : m.action}</div>
                            </div>
                            <StarRating ratingKey={`dash-${i}`} />
                          </Card>
                        );
                      })}
                    </div>
                  </div>

          </div>

          {/* Right sidebar — From KlasUp rotating panel */}
          <div style={{ width: mob ? "100%" : 280, flexShrink: 0, marginTop: mob ? 16 : 0 }}>
            <FromKlasUpPanel onNavigate={setPage} />

            {/* Recent Activity */}
            {(() => {
              const sidebarRecent = uploadLog.slice(0, 4);
              if (sidebarRecent.length === 0) return null;
              const UPLOAD_ICONS = { "Post-class notes": "✏", "Announcements": "📢", "Assignments": "📝", "Discussions": "💬", "Learning Outcomes": "🎯", "Student Voice": "🗣", "PowerPoints": "📊" };
              const relativeTime = (ts) => {
                const diff = Date.now() - ts;
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return "just now";
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
              };
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Recent Activity</div>
                  <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 16, padding: "12px 14px" }}>
                    {sidebarRecent.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i > 0 ? `0.5px solid ${C.border}` : "none" }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{UPLOAD_ICONS[item.category] || "📄"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 600, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.category}</div>
                          <div style={{ fontFamily: F.body, fontSize: 10, color: C.muted }}>{item.course}</div>
                        </div>
                        <div style={{ fontFamily: F.body, fontSize: 10, color: C.muted, flexShrink: 0 }}>{relativeTime(item.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          </div>
        )}

        {/* ── MY COURSE ── */}
        {page === "Pedagogy Studio" && (() => {
          const TAG_COLORS = {
            "Active Learning": { color: C.sage, bg: C.sageLight },
            "Socratic Seminar": { color: C.teal, bg: C.tealLight },
            "UDL": { color: C.rose, bg: C.roseLight },
            "Reflection": { color: C.rose, bg: C.roseLight },
            "Flipped Classroom": { color: C.sage, bg: C.sageLight },
            "Student Voice": { color: C.gold, bg: C.goldLight },
            "Assessment Design": { color: C.purple, bg: C.purpleLight },
            "Scaffolding": { color: C.teal, bg: C.tealLight },
            "Metacognition": { color: C.purple, bg: C.purpleLight },
            "Inclusive Pedagogy": { color: C.gold, bg: C.goldLight },
          };
          const courseLog = uploadLog.filter(e => e.course === course);
          const weekGroups = {};
          courseLog.forEach(e => { if (!weekGroups[e.week]) weekGroups[e.week] = []; weekGroups[e.week].push(e); });
          const weekOrder = Object.keys(weekGroups).sort((a, b) => {
            const na = parseInt(a.replace(/\D/g, "")) || 0, nb = parseInt(b.replace(/\D/g, "")) || 0;
            return nb - na;
          });
          const currentCat = UPLOADS.find(u => u.label === myCourseCategory) || UPLOADS[0];

          const handleSubmit = async () => {
            const text = uploadText.trim();
            if (!text) return;
            const prevTotal = Object.values(uploaded).reduce((a, b) => a + b, 0);
            if (prevTotal === 0 && typeof gtag === "function") gtag("event", "first_upload_submitted", { category: myCourseCategory });
            setUploaded(p => ({ ...p, [myCourseCategory]: (p[myCourseCategory] || 0) + 1 }));
            setUploadLog(prev => [{ content: text, category: myCourseCategory, course, week, timestamp: Date.now() }, ...prev]);
            const fileMeta = uploadFileMeta;
            setUploadText("");
            setUploadFileMeta(null);

            // Persist upload to DB (with file metadata when a file was uploaded)
            const courseObj = dbCourses.find(c => c.course_code === course);
            let uploadRow = null;
            if (session?.user && courseObj) {
              try { uploadRow = await insertUpload(session.user.id, courseObj.id, week, myCourseCategory, text, fileMeta || {}, pendingAssignmentId); }
              catch (e) { console.warn("Upload DB insert failed:", e); }
            }
            setPendingAssignmentId(null);

            setMyCourseFeedbackLoading(true);
            setMyCourseFeedback(null);
            setAiMicroError(null);
            generateMicroLearning({ content: text, category: myCourseCategory, course, week })
              .then(async recs => {
                // Resolve research_article_id → article_title + article_url before rendering
                const enriched = await Promise.all(recs.map(async (rec) => {
                  if (!rec.research_article_id) return rec;
                  const article = await fetchArticleById(rec.research_article_id);
                  return article ? { ...rec, article_title: article.title, article_url: article.url } : rec;
                }));
                setAiMicro(enriched);
                setMyCourseFeedbackLoading(false);
                if (typeof gtag === "function") gtag("event", "micro_learning_generated", { category: myCourseCategory });
                const fb = enriched && enriched.length > 0 ? enriched[0] : null;
                setMyCourseFeedback(fb);
                setMicroHistory(prev => ({
                  ...prev,
                  [myCourseCategory]: [
                    { recs: enriched, week, course, timestamp: Date.now() },
                    ...(prev[myCourseCategory] || []),
                  ],
                }));
                // Persist micro-learnings to DB
                if (session?.user && uploadRow) {
                  enriched.forEach(rec => {
                    insertMicroLearning(session.user.id, uploadRow.id, rec).catch(e => console.warn("Micro-learning DB insert failed:", e));
                  });
                }
              })
              .catch(err => { console.error(err); setAiMicroError(err.message); setMyCourseFeedbackLoading(false); });
          };

          const canSeeCourseArchitect = profile?.role === "admin" && !gatedPageIds.has("Course Architect");
          return (
          <div>
            {canSeeCourseArchitect && (
              <div onClick={() => setPage("Course Architect")} onMouseEnter={e => e.currentTarget.style.color = C.teal} onMouseLeave={e => e.currentTarget.style.color = C.muted}
                style={{ fontFamily: F.body, fontSize: 13, color: C.muted, fontWeight: 600, cursor: "pointer", marginBottom: 8, display: "inline-block" }}>← Back to Course Architect</div>
            )}
            <PageHeader breadcrumb="🏠 Dashboard › 📝 Pedagogy Studio" title="Pedagogy Studio" subtitle="Share what's happening in your classroom. KlasUp turns it into growth." featureInfo={<FeatureInfo sectionId="pedagogy-studio" />} />
            <WCS course={course} setCourse={setCourseAndSync} week={week} setWeek={setWeek} courses={dbCourses} />

            {/* ── 1. FOCUSED INPUT AREA ── */}
            <Card style={{ marginBottom: 20, border: `1px solid ${C.tealBright}22` }}>
              {/* Category dropdown */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>WHAT ARE YOU SHARING?</div>
                <div style={{ display: mob ? "grid" : "flex", gridTemplateColumns: mob ? "1fr 1fr" : undefined, gap: 8, flexWrap: "wrap" }}>
                  {UPLOADS.map(u => {
                    const locked = !can(u.tier);
                    const active = myCourseCategory === u.label;
                    return (
                      <button key={u.label} onClick={() => { if (!locked) { setMyCourseCategory(u.label); setPendingAssignmentId(null); } }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: F.accent,
                          fontWeight: active ? 700 : 500, padding: "7px 14px", borderRadius: 20,
                          border: active ? `1.5px solid ${C.tealBright}` : `1px solid ${C.border}`,
                          background: active ? C.tealLight : locked ? C.ivoryDark : C.white,
                          color: active ? C.teal : locked ? C.lock : C.muted,
                          cursor: locked ? "default" : "pointer", opacity: locked ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}>
                        <span style={{ fontSize: 14 }}>{u.icon}</span> {u.label}
                        {locked && <span style={{ fontSize: 9 }}>🔒</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea + drop zone */}
              <div
                style={{
                  position: "relative", borderRadius: 12,
                  border: dropDragOver ? `2px dashed ${C.tealBright}` : "2px dashed transparent",
                  background: dropDragOver ? C.tealLight : "transparent",
                  transition: "border-color 0.2s, background 0.2s",
                  padding: dropDragOver ? 0 : 0,
                }}
                onDragOver={e => { e.preventDefault(); setDropDragOver(true); }}
                onDragEnter={e => { e.preventDefault(); setDropDragOver(true); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropDragOver(false); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDropDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  await processUploadedFile(file, {
                    userId: session?.user?.id,
                    onText: t => setUploadText(p => p ? p + "\n\n" + t : t),
                    onFileMeta: setUploadFileMeta,
                    setStatus: setDropStatus,
                    setErrorMsg: setDropErrorMsg,
                  });
                }}
              >
                <textarea
                  value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                  placeholder={dropDragOver ? "Drop your file here..." : (UPLOAD_PLACEHOLDERS[myCourseCategory] || "Share what happened in class...")}
                  rows={6}
                  style={{
                    width: "100%", border: `1px solid ${dropDragOver ? C.tealBright : C.border}`, borderRadius: 12, padding: 14,
                    fontFamily: F.body, fontSize: 14, resize: "none", boxSizing: "border-box",
                    background: dropDragOver ? "transparent" : C.ivory, lineHeight: 1.65,
                    transition: "border-color 0.2s, background 0.2s",
                    pointerEvents: dropDragOver ? "none" : "auto",
                  }}
                  onFocus={e => { if (!dropDragOver) e.target.style.borderColor = C.tealBright; }}
                  onBlur={e => { if (!dropDragOver) e.target.style.borderColor = C.border; }}
                />
                <VoiceMic onTranscript={t => setUploadText(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 10, bottom: 10 }} />
              </div>
              {dropErrorMsg && (
                <div style={{ fontSize: 12, color: C.rose, fontFamily: F.body, marginTop: 4 }}>{dropErrorMsg}</div>
              )}
              {dropStatus === "uploading" && <div style={{ fontSize: 12, color: C.teal, fontFamily: F.body, marginTop: 4 }}>Uploading your document...</div>}
              {dropStatus === "extracting" && <div style={{ fontSize: 12, color: C.teal, fontFamily: F.body, marginTop: 4 }}>Extracting text...</div>}
              <div style={{ marginTop: 6 }}>
                <FileUploadLink onText={t => setUploadText(p => p ? p + "\n\n" + t : t)} userId={session?.user?.id} onFileMeta={setUploadFileMeta} />
              </div>

              {/* Submit + helper */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <button onClick={() => setPromptHelperOpen(!promptHelperOpen)}
                  style={{ background: "none", border: "none", fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: F.body, padding: 0 }}>
                  {promptHelperOpen ? "Hide prompts ↑" : "Not sure what to write? Here are some prompts ↓"}
                </button>
                <button onClick={handleSubmit} disabled={!uploadText.trim() || myCourseFeedbackLoading}
                  style={{
                    background: C.tealBright, color: C.white, border: "none", borderRadius: 10,
                    padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                    cursor: !uploadText.trim() || myCourseFeedbackLoading ? "default" : "pointer",
                    opacity: !uploadText.trim() ? 0.5 : 1, transition: "opacity 0.2s",
                  }}>
                  Submit to KlasUp ↗
                </button>
              </div>

              {/* Writing prompts */}
              {promptHelperOpen && (
                <div style={{ marginTop: 12, padding: 14, background: C.ivoryDark, borderRadius: 10 }}>
                  <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8 }}>WRITING PROMPTS FOR {myCourseCategory.toUpperCase()}</div>
                  {(WRITING_PROMPTS[myCourseCategory] || []).map((p, i) => (
                    <div key={i} onClick={() => { setUploadText(p); setPromptHelperOpen(false); }}
                      style={{ fontSize: 13, color: C.text, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: C.white, border: `0.5px solid ${C.border}`, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.tealLight}
                      onMouseLeave={e => e.currentTarget.style.background = C.white}>
                      {p}
                    </div>
                  ))}
                </div>
              )}

              {/* Course/week tag */}
              <div style={{ marginTop: 8, fontSize: 11, fontFamily: F.accent, color: C.teal, fontWeight: 700 }}>
                {currentCat.icon} {myCourseCategory} · {course} · {week}
              </div>
            </Card>

            {/* ── 2. INSTANT AI FEEDBACK ── */}
            {myCourseFeedbackLoading && (
              <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.tealBright}`, background: C.white }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, background: C.tealBright, borderRadius: "50%", animation: "pulse 1.2s ease-in-out infinite" }} />
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 16, color: C.navy, marginBottom: 2 }}>KlasUp is thinking...</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Generating a personalized recommendation from your content</div>
                  </div>
                </div>
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }`}</style>
              </Card>
            )}

            {aiMicroError && !myCourseFeedbackLoading && (
              <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.rose}`, background: C.roseLight }}>
                <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.rose, fontSize: 13, marginBottom: 3 }}>Could not generate recommendations</div>
                <div style={{ fontSize: 12, color: C.muted }}>{aiMicroError}</div>
              </Card>
            )}

            {myCourseFeedback && !myCourseFeedbackLoading && (() => {
              const m = myCourseFeedback;
              const tc = TAG_COLORS[m.tag] || { color: C.teal, bg: C.tealLight };
              return (
                <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.tealBright}`, animation: "slideIn 0.4s ease-out" }}>
                  <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Tag label={m.tag} color={tc.color} bg={tc.bg} />
                    <span style={{ fontSize: 10, fontFamily: F.accent, color: C.muted }}>Just now · {myCourseCategory}</span>
                  </div>
                  <div style={{ fontFamily: F.display, fontSize: 18, color: C.navy, marginBottom: 6 }}>{m.title}</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{m.summary}</div>
                  {(m.article_title || m.article) && (
                  <div style={{ background: C.ivoryDark, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 3 }}>RESEARCH</div>
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                      {m.article_url ? <a href={m.article_url} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: "underline" }}>{m.article_title}</a> : (m.article_title || m.article)}
                    </div>
                  </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 4, height: 28, background: C.tealBright, borderRadius: 2 }} />
                    <div style={{ fontSize: 13, flex: 1 }}>
                      <span style={{ color: C.tealBright, fontWeight: 700 }}>Try this: </span>
                      <span style={{ color: C.text }}>{m.action}</span>
                    </div>
                    <CopyBtn text={m.action} label="Copy" />
                  </div>
                  <StarRating ratingKey={`feedback-${Date.now()}`} />
                </Card>
              );
            })()}

            {/* ── 3. SUBMISSION HISTORY ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 14 }}>SUBMISSION HISTORY — {course}</div>
              {weekOrder.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✏</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Nothing uploaded yet this week — start by sharing<br />what happened in class today.</div>
                </div>
              ) : (
                weekOrder.map(wk => (
                  <div key={wk} style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: F.display, fontSize: 14, color: C.navy, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{wk}</div>
                    {weekGroups[wk].map((entry, ei) => {
                      const eKey = `${wk}-${ei}`;
                      const isExp = historyExpanded[eKey];
                      const catObj = UPLOADS.find(u => u.label === entry.category) || { label: entry.category, icon: LEGACY_CATEGORY_ICONS[entry.category] || "📄" };
                      const catHistory = microHistory[entry.category];
                      const matchEntry = catHistory?.find(h => Math.abs(h.timestamp - entry.timestamp) < 5000);
                      return (
                        <div key={ei} style={{ marginBottom: 8 }}>
                          <div onClick={() => setHistoryExpanded(p => ({ ...p, [eKey]: !isExp }))}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", background: isExp ? C.tealLight : C.ivory, transition: "background 0.15s" }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{catObj.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{entry.category}</div>
                              <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.content.slice(0, 80)}{entry.content.length > 80 ? "..." : ""}</div>
                            </div>
                            <div style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{new Date(entry.timestamp).toLocaleDateString()}</div>
                            <span style={{ fontSize: 10, color: C.muted }}>{isExp ? "▲" : "▼"}</span>
                          </div>
                          {isExp && (
                            <div style={{ padding: "12px 10px 12px 36px", animation: "slideIn 0.3s ease-out" }}>
                              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65, marginBottom: 8, whiteSpace: "pre-wrap" }}>{entry.content}</div>
                              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                                <CopyBtn text={entry.content} />
                                <EmailBtn subject={`${entry.category} — ${course} ${wk}`} body={entry.content} />
                              </div>
                              {matchEntry && matchEntry.recs.map((m, mi) => {
                                const tc = TAG_COLORS[m.tag] || { color: C.teal, bg: C.tealLight };
                                return (
                                  <div key={mi} style={{ borderLeft: `3px solid ${tc.color}`, paddingLeft: 12, marginBottom: 10 }}>
                                    <Tag label={m.tag} color={tc.color} bg={tc.bg} />
                                    <div style={{ fontFamily: F.display, fontSize: 14, color: C.navy, margin: "6px 0 4px" }}>{m.title}</div>
                                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{m.summary}</div>
                                    {(m.article_title || m.article) && (
                                    <div style={{ background: C.ivory, borderRadius: 8, padding: "0.6rem 0.9rem", marginTop: 6, marginBottom: 4 }}>
                                      <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 2 }}>RESEARCH</div>
                                      <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                                        {m.article_url ? <a href={m.article_url} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: "underline" }}>{m.article_title}</a> : (m.article_title || m.article)}
                                      </div>
                                    </div>
                                    )}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                                      <div style={{ fontSize: 12, color: C.tealBright, fontWeight: 600 }}>→ {m.action}</div>
                                      <CopyBtn text={m.action} label="Copy" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </Card>

          </div>
          );
        })()}

        {/* ── ASSIGNMENT BUILDER (now accessed via Sage) ── */}
        {page === "Assignment Builder" && (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
            <div style={{ fontFamily: F.display, fontSize: 24, color: C.navy, marginBottom: 8 }}>Assignment Builder has moved to Klas</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>Building something new? Tell me about your students or the learning outcomes.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => { setSageBuilderOpen(true); setPage("Dashboard"); if (typeof gtag === "function") gtag("event", "assignment_builder_opened", { trigger: "manual" }); }}
                style={{ background: C.sage, color: C.white, border: "none", borderRadius: 10, padding: "11px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Open Assignment Builder
              </button>
              <button onClick={() => { openSage(); setPage("Dashboard"); }}
                style={{ background: C.white, color: C.sage, border: `1.5px solid ${C.sage}`, borderRadius: 10, padding: "11px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Chat with Klas
              </button>
            </div>
          </div>
        )}

        {/* ── SLIDE STUDIO (PowerPoint Planner) ── */}
        {page === "Slide Studio" && (() => {
          const canSeeCourseArchitect = profile?.role === "admin" && !gatedPageIds.has("Course Architect");
          return (
          <div>
            {canSeeCourseArchitect && (
              <div onClick={() => setPage("Course Architect")} onMouseEnter={e => e.currentTarget.style.color = C.teal} onMouseLeave={e => e.currentTarget.style.color = C.muted}
                style={{ fontFamily: F.body, fontSize: 13, color: C.muted, fontWeight: 600, cursor: "pointer", marginBottom: 8, display: "inline-block" }}>← Back to Course Architect</div>
            )}
            <PageHeader breadcrumb="🏠 Dashboard › 🎯 Slide Studio" title="Slide Studio" subtitle="Plan your deck or upload an existing one for AI analysis." featureInfo={<FeatureInfo sectionId="slide-studio" />} />
            {!can("pro") ? (
              <Card style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 8 }}>Slide Studio is a Pro feature</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Plan slide decks with AI, get UDL scoring, or upload existing decks for analysis.</div>
                <button onClick={upgrade} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "10px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Upgrade to Pro ↗</button>
              </Card>
            ) : (
              <div>
                <WCS course={course} setCourse={setCourseAndSync} week={week} setWeek={setWeek} courses={dbCourses} />

                {/* ── POWERPOINT PLANNER ── */}
                <Card style={{ marginBottom: 20, border: `1px solid ${C.tealBright}22` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>📊</span>
                    <div style={{ fontFamily: F.display, fontSize: 18, color: C.navy }}>PowerPoint Planner</div>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Describe your deck in plain English. KlasUp generates a complete slide-by-slide outline.</div>

                  <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>DESCRIBE YOUR DECK</div>
                  <div style={{ position: "relative" }}>
                    <textarea value={pptDesc} onChange={e => setPptDesc(e.target.value)}
                      placeholder={"A 12-slide deck on consumer behavior for a junior marketing class. Include a case study activity in slide 6 and an exit ticket in the last slide. The tone should be engaging and visual."}
                      rows={5}
                      style={{
                        width: "100%", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
                        fontFamily: F.body, fontSize: 14, resize: "none", boxSizing: "border-box",
                        background: C.ivory, lineHeight: 1.65,
                      }}
                      onFocus={e => e.target.style.borderColor = C.tealBright}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                    <VoiceMic onTranscript={t => setPptDesc(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 10, bottom: 10 }} />
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <FileUploadLink onText={t => setPptDesc(p => p ? p + "\n\n" + t : t)} accept=".docx,.txt,.pptx" label="or upload a file (.pptx, .docx, .txt) ↑" />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button onClick={() => {
                      if (!pptDesc.trim()) return;
                      setPptLoading(true); setPptError(null); setPptSlides(null);
                      generatePptPlan({ description: pptDesc, course, week })
                        .then(slides => { setPptSlides(slides); setPptLoading(false); })
                        .catch(err => { setPptError(err.message); setPptLoading(false); });
                    }}
                      disabled={!pptDesc.trim() || pptLoading}
                      style={{
                        background: C.tealBright, color: C.white, border: "none", borderRadius: 10,
                        padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                        cursor: !pptDesc.trim() || pptLoading ? "default" : "pointer",
                        opacity: !pptDesc.trim() ? 0.5 : 1,
                      }}>
                      {pptLoading ? "Planning slides..." : "Generate Slide Outline ↗"}
                    </button>
                  </div>
                </Card>

                {/* PPT Loading */}
                {pptLoading && (
                  <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.tealBright}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 10, height: 10, background: C.tealBright, borderRadius: "50%", animation: "pulse 1.2s ease-in-out infinite" }} />
                      <div>
                        <div style={{ fontFamily: F.display, fontSize: 16, color: C.navy, marginBottom: 2 }}>Planning your slide deck...</div>
                        <div style={{ fontSize: 12, color: C.muted }}>Building slide-by-slide outline with talking points and activities</div>
                      </div>
                    </div>
                  </Card>
                )}

                {pptError && (
                  <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.rose}`, background: C.roseLight }}>
                    <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.rose, fontSize: 13 }}>Error: {pptError}</div>
                  </Card>
                )}

                {/* Generated Slide Outline */}
                {pptSlides && !pptLoading && (
                  <Card style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700 }}>SLIDE-BY-SLIDE OUTLINE — {pptSlides.length} SLIDES</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => exportSlidePptx(pptSlides, course, week)}
                          style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.white, background: C.tealBright, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                          Export as PowerPoint
                        </button>
                        <button onClick={() => {
                          if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "pdf" });
                          let html = `<html><head><title>${course} ${week} Slides</title><style>body{font-family:'Manrope',sans-serif;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.7;color:#0F1F3D}h1,h2{font-family:'Bricolage Grotesque',sans-serif}.slide{border:1px solid #ddd;border-radius:12px;padding:20px;margin:16px 0;page-break-inside:avoid}.slide-num{background:#0FB5B5;color:#fff;display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700}ul{margin:8px 0}li{margin:4px 0}.visual{background:#E6F4E8;padding:8px 12px;border-radius:8px;font-size:13px;margin:8px 0}.notes{background:#F0EDE6;padding:8px 12px;border-radius:8px;font-size:12px;color:#4A5568;margin:8px 0}</style></head><body>`;
                          html += `<h1>${course} — ${week} Slide Deck</h1>`;
                          pptSlides.forEach((s, i) => {
                            html += `<div class="slide"><span class="slide-num">Slide ${i + 1}</span>${s.time ? ` <span style="font-size:12px;color:#4A5568">~${s.time}</span>` : ""}<h2>${s.title}</h2><ul>`;
                            (s.points || []).forEach(p => { html += `<li>${p}</li>`; });
                            html += `</ul>`;
                            if (s.visual) html += `<div class="visual">📎 ${s.visual}</div>`;
                            if (s.notes) html += `<div class="notes">🗒 ${s.notes}</div>`;
                            html += `</div>`;
                          });
                          html += `</body></html>`;
                          const w = window.open("", "_blank"); w.document.write(html); w.document.close(); w.print();
                        }}
                          style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.white, background: C.navy, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                          Export as PDF
                        </button>
                        <button onClick={() => {
                          if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "text" });
                          let text = `${course} — ${week} Slide Deck Outline\n${"=".repeat(50)}\n\n`;
                          pptSlides.forEach((s, i) => {
                            text += `SLIDE ${i + 1}: ${s.title}\n`;
                            if (s.time) text += `Estimated time: ${s.time}\n`;
                            text += `\nKey Talking Points:\n`;
                            (s.points || []).forEach(p => { text += `  • ${p}\n`; });
                            if (s.visual) text += `\nSuggested Visual/Activity: ${s.visual}\n`;
                            if (s.notes) text += `\nSpeaker Notes: ${s.notes}\n`;
                            text += `\n${"—".repeat(40)}\n\n`;
                          });
                          const blob = new Blob([text], { type: "text/plain" });
                          const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                          a.download = `${course}-${week}-slides.txt`; a.click();
                        }}
                          style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.navy, background: C.ivoryDark, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                          Export as Text
                        </button>
                      </div>
                    </div>

                    {pptSlides.map((s, i) => {
                      const isEditing = pptEditing === i;
                      return (
                        <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, background: isEditing ? C.ivory : C.white, transition: "background 0.2s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ background: C.tealBright, color: C.white, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, fontFamily: F.accent }}>Slide {i + 1}</div>
                            {s.time && <span style={{ fontSize: 11, color: C.muted }}>~{s.time}</span>}
                            <div style={{ flex: 1 }} />
                            <button onClick={() => setPptEditing(isEditing ? null : i)}
                              style={{ fontSize: 11, color: isEditing ? C.rose : C.teal, background: "none", border: "none", cursor: "pointer", fontFamily: F.accent, fontWeight: 700 }}>
                              {isEditing ? "Done" : "Edit"}
                            </button>
                          </div>
                          {isEditing ? (
                            <div>
                              <input value={s.title} onChange={e => setPptSlides(p => p.map((sl, j) => j === i ? { ...sl, title: e.target.value } : sl))}
                                style={{ width: "100%", fontFamily: F.display, fontSize: 16, color: C.navy, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", marginBottom: 8, boxSizing: "border-box", background: C.white }} />
                              {(s.points || []).map((p, pi) => (
                                <div key={pi} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                                  <span style={{ color: C.tealBright, fontSize: 12, marginTop: 6 }}>•</span>
                                  <input value={p} onChange={e => setPptSlides(prev => prev.map((sl, j) => j === i ? { ...sl, points: sl.points.map((pt, k) => k === pi ? e.target.value : pt) } : sl))}
                                    style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 13, fontFamily: F.body, background: C.white }} />
                                </div>
                              ))}
                              {s.visual && <div style={{ position: "relative", marginTop: 8 }}><textarea value={s.visual} onChange={e => setPptSlides(p => p.map((sl, j) => j === i ? { ...sl, visual: e.target.value } : sl))}
                                rows={2} style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: F.body, resize: "none", boxSizing: "border-box", background: C.white }} />
                                <VoiceMic onTranscript={t => setPptSlides(p => p.map((sl, j) => j === i ? { ...sl, visual: sl.visual ? sl.visual + " " + t : t } : sl))} style={{ position: "absolute", right: 6, bottom: 6 }} /></div>}
                              {s.notes && <div style={{ position: "relative", marginTop: 6 }}><textarea value={s.notes} onChange={e => setPptSlides(p => p.map((sl, j) => j === i ? { ...sl, notes: e.target.value } : sl))}
                                rows={2} style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: F.body, resize: "none", boxSizing: "border-box", background: C.white }} />
                                <VoiceMic onTranscript={t => setPptSlides(p => p.map((sl, j) => j === i ? { ...sl, notes: sl.notes ? sl.notes + " " + t : t } : sl))} style={{ position: "absolute", right: 6, bottom: 6 }} /></div>}
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontFamily: F.display, fontSize: 16, color: C.navy, marginBottom: 8 }}>{s.title}</div>
                              <ul style={{ margin: "0 0 8px", paddingLeft: 16 }}>
                                {(s.points || []).map((p, pi) => (
                                  <li key={pi} style={{ fontSize: 13, color: C.text, marginBottom: 4, lineHeight: 1.5 }}>{p}</li>
                                ))}
                              </ul>
                              {s.visual && <div style={{ background: C.sageLight, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.sage, marginBottom: 6 }}>📎 {s.visual}</div>}
                              {s.notes && <div style={{ background: C.ivoryDark, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.muted }}>🗒 {s.notes}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Plain English Update */}
                    <div style={{ marginTop: 16, padding: 16, background: C.ivoryDark, borderRadius: 12 }}>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>UPDATE WITH PLAIN ENGLISH</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <textarea value={pptUpdateText} onChange={e => setPptUpdateText(e.target.value)}
                            placeholder={'e.g., "Make slide 4 more interactive" or "Add a poll after slide 7"'}
                            rows={2}
                            style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box", background: C.white, lineHeight: 1.5 }} />
                          <VoiceMic onTranscript={t => setPptUpdateText(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 8, bottom: 8 }} />
                        </div>
                        <button onClick={() => {
                          if (!pptUpdateText.trim()) return;
                          setPptUpdating(true);
                          updatePptPlan({ currentSlides: pptSlides, instruction: pptUpdateText })
                            .then(slides => { setPptSlides(slides); setPptUpdateText(""); setPptUpdating(false); })
                            .catch(err => { setPptError(err.message); setPptUpdating(false); });
                        }}
                          disabled={!pptUpdateText.trim() || pptUpdating}
                          style={{
                            background: C.tealBright, color: C.white, border: "none", borderRadius: 10,
                            padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13,
                            cursor: pptUpdating ? "wait" : "pointer", whiteSpace: "nowrap",
                          }}>
                          {pptUpdating ? "Updating..." : "Update ↗"}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, padding: "10px 14px", background: C.tealLight, borderRadius: 10, fontSize: 12, color: C.teal, textAlign: "center" }}>
                      📋 Full .pptx export coming soon
                    </div>
                  </Card>
                )}

                {/* ── EXISTING DECK UPLOAD + ANALYSIS ── */}
                <Card style={{ marginTop: 8, borderTop: `3px solid ${C.ivoryDark}` }}>
                  <div style={{ fontFamily: F.display, fontSize: 18, color: C.navy, marginBottom: 4 }}>Deck Upload & Analysis</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Upload an existing deck for UDL scoring, text density, and active learning analysis.</div>

                  {!deckUploaded ? (
                    <div style={{ textAlign: "center", padding: "2rem", border: `1.5px dashed ${C.tealBright}`, borderRadius: 14, background: C.ivory }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>◫</div>
                      <div style={{ fontFamily: F.accent, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Upload your deck for {course} · {week}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Accepts .pptx, .ppt, .pdf, and .key files</div>
                      <label style={{ display: "inline-block", background: C.tealBright, color: C.white, borderRadius: 10, padding: "9px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        Choose File
                        <input type="file" accept=".pptx,.ppt,.pdf,.key" style={{ display: "none" }} onChange={(e) => { if (e.target.files.length > 0) setDeckUploaded(true); }} />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontFamily: F.display, fontSize: 16 }}>{course} — {week} Deck</div>
                          <div style={{ fontSize: 12, color: C.muted }}>7 slides · analysed today</div>
                        </div>
                        <button onClick={() => setDeckUploaded(false)} style={{ fontSize: 12, color: C.rose, background: "none", border: `0.5px solid ${C.rose}44`, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>Replace deck</button>
                      </div>
                      {/* Slide-by-slide breakdown */}
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>SLIDE-BY-SLIDE BREAKDOWN</div>
                      {SLIDES.map((s, i) => (
                        <div key={i} style={{ borderBottom: i < SLIDES.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                          <div onClick={() => setSlideOpen(slideOpen === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.7rem 0", cursor: "pointer" }}>
                            <div style={{ width: 28, height: 20, background: s.flags.length === 0 ? C.sageLight : C.roseLight, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: s.flags.length === 0 ? C.sage : C.rose, flexShrink: 0 }}>{i + 1}</div>
                            <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {s.active && <Tag label="Active" color={C.teal} bg={C.tealLight} />}
                              {s.reused && <Tag label="Reused" color={C.rose} bg={C.roseLight} />}
                              {s.flags.length === 0 && <Tag label="Clean" color={C.sage} bg={C.sageLight} />}
                              <span style={{ fontSize: 12, color: C.muted }}>{slideOpen === i ? "▲" : "▼"}</span>
                            </div>
                          </div>
                          {slideOpen === i && (
                            <div style={{ paddingBottom: "0.75rem", paddingLeft: 38 }}>
                              <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
                                <div style={{ fontSize: 12 }}><span style={{ color: C.muted }}>UDL: </span><span style={{ fontWeight: 700, color: s.udl > 75 ? C.sage : C.rose }}>{s.udl}</span></div>
                                <div style={{ fontSize: 12 }}><span style={{ color: C.muted }}>Density: </span><span style={{ fontWeight: 700, color: s.text === "heavy" ? C.rose : C.sage }}>{s.text}</span></div>
                              </div>
                              {s.flags.length === 0 ? <div style={{ fontSize: 12, color: C.sage }}>✓ No issues detected.</div> : s.flags.map((f, j) => (
                                <div key={j} style={{ fontSize: 12, color: C.rose, display: "flex", gap: 6, marginBottom: 4 }}><span>⚑</span><span>{f}</span></div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* AI Deck Analysis */}
                      <div style={{ marginTop: 14, background: C.navy, borderRadius: 14, padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ fontFamily: F.accent, fontSize: 11, color: C.tealMid, fontWeight: 700 }}>AI DECK ANALYSIS</div>
                          <button onClick={() => setSlideFeedback({
                            engagement: 68, cognitiveLoad: "Moderate-High", pacing: 74, outcomesCovered: slideOutcomes.length,
                            suggestions: [
                              "Slides 2 and 6 have high text density — consider breaking into two slides or adding a visual.",
                              "Slide 4 is reused from Week 3 — review for currency and relevance.",
                              slideOutcomes.length === 0 ? "No learning outcomes mapped — align slides to at least 2 outcomes." : `${slideOutcomes.length} outcome${slideOutcomes.length > 1 ? "s" : ""} mapped — strong alignment.`,
                              "Consider adding a retrieval moment after Slide 3.",
                              "Exit ticket on Slide 7 is excellent — anchors metacognition.",
                            ],
                          })} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: C.tealBright, color: C.navy, border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer" }}>
                            Analyse Deck
                          </button>
                        </div>
                        {!slideFeedback ? (
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic", padding: "1.5rem 0", textAlign: "center" }}>Click "Analyse Deck" to get AI feedback.</div>
                        ) : (
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
                              {[
                                { label: "Engagement", val: `${slideFeedback.engagement}/100`, color: slideFeedback.engagement > 70 ? C.tealMid : "#F4C0D1" },
                                { label: "Cognitive Load", val: slideFeedback.cognitiveLoad, color: slideFeedback.cognitiveLoad === "Moderate-High" ? "#F4C0D1" : C.tealMid },
                                { label: "Pacing", val: `${slideFeedback.pacing}/100`, color: slideFeedback.pacing > 70 ? C.tealMid : "#F4C0D1" },
                                { label: "Outcomes", val: `${slideFeedback.outcomesCovered}/${OUTCOMES.length}`, color: slideFeedback.outcomesCovered > 0 ? C.tealMid : "#F4C0D1" },
                              ].map((s, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.7rem" }}>
                                  <div style={{ fontSize: 10, fontFamily: F.accent, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.accent, color: s.color }}>{s.val}</div>
                                </div>
                              ))}
                            </div>
                            {slideFeedback.suggestions.map((s, i) => (
                              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 8, lineHeight: 1.5 }}>
                                <span style={{ color: C.tealBright, flexShrink: 0 }}>→</span><span>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── MICRO-LEARNING ── */}
        {page === "Micro-Learning" && (
          <div>
            <PageHeader breadcrumb="🏠 Dashboard › 📚 Micro-Learning" title="Micro-Learning" subtitle={aiMicro.length > 0 ? `AI-powered recommendations for ${course} · ${week} · grounded in peer-reviewed research.` : "Surfaced from your course patterns · grounded in peer-reviewed research."} featureInfo={<FeatureInfo sectionId="micro-learning" />} />

            {aiMicroLoading && (
              <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "2rem", marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 10, animation: "spin 1.5s linear infinite" }}>◉</div>
                <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.teal, fontSize: 14, marginBottom: 4 }}>Analyzing your content with AI...</div>
                <div style={{ fontSize: 12, color: C.muted }}>Generating personalized recommendations from peer-reviewed research</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {aiMicroError && (
              <div style={{ background: C.roseLight, border: `0.5px solid ${C.rose}`, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: 14 }}>
                <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.rose, fontSize: 13, marginBottom: 4 }}>Could not generate AI recommendations</div>
                <div style={{ fontSize: 12, color: C.muted }}>{aiMicroError}</div>
              </div>
            )}

            {aiMicro.length > 0 && (
              <>
                <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, background: C.tealBright, borderRadius: "50%" }} />
                  AI-GENERATED — PERSONALIZED TO YOUR LATEST UPLOAD
                </div>
                {aiMicro.map((m, i) => {
                  const TAG_COLORS = {
                    "Active Learning": { color: C.sage, bg: C.sageLight },
                    "Socratic Seminar": { color: C.teal, bg: C.tealLight },
                    "UDL": { color: C.rose, bg: C.roseLight },
                    "Reflection": { color: C.rose, bg: C.roseLight },
                    "Flipped Classroom": { color: C.sage, bg: C.sageLight },
                    "Student Voice": { color: C.gold, bg: C.goldLight },
                    "Assessment Design": { color: C.purple, bg: C.purpleLight },
                    "Scaffolding": { color: C.teal, bg: C.tealLight },
                    "Metacognition": { color: C.purple, bg: C.purpleLight },
                    "Inclusive Pedagogy": { color: C.gold, bg: C.goldLight },
                  };
                  const tc = TAG_COLORS[m.tag] || { color: C.teal, bg: C.tealLight };
                  return (
                    <div key={i} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <Tag label={m.tag} color={tc.color} bg={tc.bg} />
                        <span style={{ fontSize: 10, fontFamily: F.accent, color: C.tealBright, fontWeight: 700, background: C.tealLight, padding: "2px 8px", borderRadius: 20 }}>AI-Powered</span>
                      </div>
                      <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 8 }}>{m.title}</div>
                      <div style={{ fontSize: 14, color: C.text, marginBottom: 10, lineHeight: 1.6 }}>{m.summary}</div>
                      {(m.article_title || m.article) && (
                      <div style={{ background: C.ivory, borderRadius: 8, padding: "0.6rem 0.9rem", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 2 }}>PEER-REVIEWED RESEARCH</div>
                        <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                          {m.article_url ? <a href={m.article_url} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: "underline" }}>{m.article_title}</a> : (m.article_title || m.article)}
                        </div>
                      </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 4, height: 32, background: tc.color, borderRadius: 2 }} />
                        <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Try this: <span style={{ fontWeight: 400 }}>{m.action}</span></div>
                        <CopyBtn text={m.action} label="Copy" />
                      </div>
                      <StarRating ratingKey={`ai-${i}`} />
                    </div>
                  );
                })}
                <div style={{ borderTop: `0.5px solid ${C.border}`, marginTop: 10, paddingTop: 18, marginBottom: 8 }}>
                  <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>DEFAULT RECOMMENDATIONS</div>
                </div>
              </>
            )}

            {MICRO.map((m, i) => {
              const locked = !can(m.tier);
              return (
                <div key={i} style={{ position: "relative", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: 14, overflow: "hidden" }}>
                  {locked && <LockOverlay onUpgrade={upgrade} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Tag label={m.tag} color={m.color} bg={m.bg} />
                    <span style={{ fontSize: 11, fontFamily: F.accent, color: C.muted }}>Based on your uploads</span>
                  </div>
                  <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 8 }}>{m.title}</div>
                  <div style={{ fontSize: 14, color: C.text, marginBottom: 10, lineHeight: 1.6 }}>{m.summary}</div>
                  {m.article && (
                  <div style={{ background: C.ivory, borderRadius: 8, padding: "0.6rem 0.9rem", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 2 }}>RESEARCH BASIS</div>
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>{m.article}</div>
                  </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 4, height: 32, background: m.color, borderRadius: 2 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Try this: <span style={{ fontWeight: 400 }}>{m.action}</span></div>
                    <CopyBtn text={m.action} label="Copy" />
                  </div>
                  <StarRating ratingKey={`default-${i}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── COHORT FORUM ── */}
        {page === "Think Tank" && !gatedPageIds.has("Think Tank") && (
          <div>
            <PageHeader breadcrumb="🏠 Dashboard › 💡 Think Tank" title="Think Tank" subtitle="Faculty at similar institutions · working on similar challenges." featureInfo={<FeatureInfo sectionId="think-tank" />} />
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {["All", "Socratic Seminar", "UDL", "Flipped Classroom", "Reflection", "Active Learning"].map(t => (
                <span key={t} style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: t === "All" ? C.navy : C.ivoryDark, color: t === "All" ? C.white : C.muted, cursor: "pointer" }}>{t}</span>
              ))}
            </div>
            {(() => {
              const posts = [
                { id: 0, author: "Faculty · New England", time: "2h ago", tag: "Socratic Seminar", text: "Tried seeding my forum with an unresolved question on Monday — response quality was noticeably richer. Anyone doing this consistently?", replies: 4, posts: 6, totalReplies: 8, tier: "free", baseUpvotes: 5 },
                { id: 1, author: "Faculty · Mid-Atlantic", time: "Yesterday", tag: "UDL", text: "Added a 4-minute audio summary alongside my reading. Students with long commutes said it was a game changer. Small lift, big impact.", replies: 7, posts: 2, totalReplies: 3, tier: "pro", baseUpvotes: 12 },
                { id: 2, author: "Faculty · Southeast", time: "2d ago", tag: "Flipped Classroom", text: "First full flip this term. Pre-class video took 45 min to make but class time was the best session I've had in years.", replies: 11, posts: 4, totalReplies: 6, tier: "pro", baseUpvotes: 18 },
                { id: 3, author: "Faculty · Midwest", time: "3d ago", tag: "Reflection", text: "Exit tickets felt awkward at first but by week 4 students were writing genuinely reflective responses. Worth the investment.", replies: 6, posts: 1, totalReplies: 2, tier: "pro", baseUpvotes: 8 },
              ];
              const isExpert = (p) => p.totalReplies > 5 && p.posts > 3;
              const topContributor = posts.reduce((best, p) => (p.posts + p.totalReplies) > (best.posts + best.totalReplies) ? p : best, posts[0]);
              const sorted = [...posts].sort((a, b) => ((postUpvotes[b.id] || 0) + b.baseUpvotes) - ((postUpvotes[a.id] || 0) + a.baseUpvotes));
              return sorted.map((p) => {
                const locked = !can(p.tier);
                const votes = (postUpvotes[p.id] || 0) + p.baseUpvotes;
                const expert = isExpert(p);
                const isTop = p.id === topContributor.id;
                return (
                  <div key={p.id} style={{ position: "relative", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: 12, overflow: "hidden" }}>
                    {locked && <LockOverlay onUpgrade={upgrade} />}
                    {isTop && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, color: C.gold, background: C.goldLight, padding: "2px 10px", borderRadius: 20 }}>Top Contributor</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.tealLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.teal }}>F</div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.author}</span>
                            {expert && <span style={{ fontSize: 9, fontFamily: F.accent, fontWeight: 700, color: C.white, background: C.teal, padding: "1px 7px", borderRadius: 10 }}>Expert</span>}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>{p.time}</div>
                        </div>
                      </div>
                      <Tag label={p.tag} color={C.teal} bg={C.tealLight} />
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{p.text}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button onClick={() => setPostUpvotes(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: postUpvotes[p.id] ? C.tealBright : C.muted, background: postUpvotes[p.id] ? C.tealLight : C.ivoryDark, border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", transition: "all 0.15s" }}>
                        ▲ {votes}
                      </button>
                      <span style={{ fontSize: 12, color: C.muted }}>{p.replies} replies</span>
                      <button onClick={() => setReplyOpen(replyOpen === p.id ? null : p.id)} style={{ fontSize: 12, color: C.teal, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: F.body }}>Reply</button>
                    </div>
                    {replyOpen === p.id && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ position: "relative" }}>
                          <textarea rows={2} placeholder="Share your experience..."
                            style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 8, fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box", background: C.ivory }} />
                          <VoiceMic onTranscript={() => {}} style={{ position: "absolute", right: 6, bottom: 6 }} />
                        </div>
                        <button onClick={() => setReplyOpen(null)} style={{ marginTop: 6, background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "6px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Post Reply</button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── REPORTS ── */}
        {page === "Reports" && !gatedPageIds.has("Reports") && (
          <div>
            <PageHeader breadcrumb="🏠 Dashboard › 📊 Reports" title="Reports" subtitle="Accreditation-ready documentation of faculty growth and engagement." featureInfo={<FeatureInfo sectionId="reports" />} />
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(2,minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
              {[{ label: "Dimensions Tracked", val: can("pro") ? "10" : "3", sub: can("pro") ? "Full suite active" : "Upgrade for full suite" }, { label: "Standards Mapped", val: can("institutional") ? "5" : can("pro") ? "3" : "1", sub: "Documented" }].map((s, i) => (
                <div key={i} style={{ background: C.ivoryDark, borderRadius: 12, padding: "1rem" }}>
                  <div style={{ fontSize: 11, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: F.display, fontSize: 28, color: C.navy }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            {[
              { standard: "NECHE 4.19 — Faculty Development", status: "Documented", detail: "Ongoing micro-learning, peer forum contributions, and course improvement cycles across 3 courses.", tier: "pro" },
              { standard: "NECHE 4.20 — Assessment of Teaching", status: "In Progress", detail: "Teaching materials, assignments, and learning-outcome alignment documented through course uploads and outcome tagging.", tier: "pro" },
              { standard: "HLC Criterion 3C — Teaching Quality", status: "Documented", detail: "Research-backed micro-learning completion with article citations on record.", tier: "pro" },
              { standard: "HLC Criterion 4A — UDL & Accessibility", status: "In Progress", detail: "UDL dimension tracking initiated. Multimodal gaps flagged in MKT 410.", tier: "institutional" },
              { standard: "SACSCOC 6.3 — Faculty Competence", status: "Documented", detail: "Active Learning, Flipped Classroom, and Case Study practices documented with research basis.", tier: "institutional" },
            ].map((r, i) => {
              const locked = !can(r.tier);
              return (
                <div key={i} style={{ position: "relative", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: 12, overflow: "hidden" }}>
                  {locked && <LockOverlay onUpgrade={upgrade} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.standard}</div>
                    <Tag label={r.status} color={r.status === "Documented" ? C.sage : C.rose} bg={r.status === "Documented" ? C.sageLight : C.roseLight} />
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{r.detail}</div>
                </div>
              );
            })}
            {can("pro") && (() => {
              const standards = [
                { standard: "NECHE 4.19 — Faculty Development", status: "Documented", detail: "Ongoing micro-learning, peer forum contributions, and course improvement cycles across 3 courses." },
                { standard: "NECHE 4.20 — Assessment of Teaching", status: "In Progress", detail: "Teaching materials, assignments, and learning-outcome alignment documented through course uploads and outcome tagging." },
                { standard: "HLC Criterion 3C — Teaching Quality", status: "Documented", detail: "Research-backed micro-learning completion with article citations on record." },
                { standard: "HLC Criterion 4A — UDL & Accessibility", status: "In Progress", detail: "UDL dimension tracking initiated. Multimodal gaps flagged in MKT 410." },
                { standard: "SACSCOC 6.3 — Faculty Competence", status: "Documented", detail: "Active Learning, Flipped Classroom, and Case Study practices documented with research basis." },
              ].filter(r => can(r.tier || "pro"));
              return (
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={() => {
                    let html = makePdfHeader(profile?.name, "Accreditation Report");
                    html += `<h1>Accreditation Report</h1>`;
                    html += `<table><tr><th>Standard</th><th>Status</th><th>Evidence</th></tr>`;
                    standards.forEach(r => { html += `<tr><td><strong>${r.standard}</strong></td><td>${r.status}</td><td>${r.detail}</td></tr>`; });
                    html += `</table>`;
                    html += `<h2>Summary Metrics</h2><ul><li>Dimensions Tracked: ${can("pro") ? 10 : 3}</li><li>Standards Mapped: ${can("institutional") ? 5 : 3}</li></ul>`;
                    printPdf(html, "Accreditation Report — KlasUp");
                  }}
                    style={{ background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Export as PDF</button>
                  <button onClick={async () => {
                    const paras = [];
                    standards.forEach(r => {
                      paras.push(new Paragraph({ children: [new TextRun({ text: r.standard, bold: true, size: 24, font: "Calibri" })], spacing: { before: 200, after: 60 } }));
                      paras.push(new Paragraph({ children: [new TextRun({ text: `Status: ${r.status}`, bold: true, size: 20, color: r.status === "Documented" ? "5A8A62" : "C4687A", font: "Calibri" })], spacing: { after: 40 } }));
                      paras.push(new Paragraph({ children: [new TextRun({ text: r.detail, size: 22, font: "Calibri" })], spacing: { after: 120 } }));
                    });
                    paras.push(new Paragraph({ text: "Summary Metrics", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }));
                    paras.push(new Paragraph({ children: [new TextRun({ text: `Dimensions Tracked: ${can("pro") ? 10 : 3}`, size: 22, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 40 } }));
                    paras.push(new Paragraph({ children: [new TextRun({ text: `Standards Mapped: ${can("institutional") ? 5 : 3}`, size: 22, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 40 } }));
                    await exportGenericDocx(paras, "Accreditation Report", `${profile?.name || "Faculty"} · Generated by KlasUp`, "accreditation-report.docx");
                  }}
                    style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Export as Word</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── COURSE PORTFOLIO ── */}
        {page === "Course Portfolio" && (() => {
          const TAG_COLORS = {
            "Active Learning": { color: C.sage, bg: C.sageLight },
            "Socratic Seminar": { color: C.teal, bg: C.tealLight },
            "UDL": { color: C.rose, bg: C.roseLight },
            "Reflection": { color: C.rose, bg: C.roseLight },
            "Flipped Classroom": { color: C.sage, bg: C.sageLight },
            "Student Voice": { color: C.gold, bg: C.goldLight },
            "Assessment Design": { color: C.purple, bg: C.purpleLight },
            "Scaffolding": { color: C.teal, bg: C.tealLight },
            "Metacognition": { color: C.purple, bg: C.purpleLight },
            "Inclusive Pedagogy": { color: C.gold, bg: C.goldLight },
          };
          const CAT_ICONS = { Announcements: "◎", Assignments: "☑", Discussions: "◉", "Learning Outcomes": "◇", "Post-class notes": "✏", "Student Voice": "◈" };
          const filteredLog = uploadLog
            .filter(u => u.course === portfolioCourse)
            .filter(u => portfolioWeek === "All" || u.week === portfolioWeek);
          const weekGroups = {};
          filteredLog.forEach(u => {
            if (!weekGroups[u.week]) weekGroups[u.week] = [];
            weekGroups[u.week].push(u);
          });
          const sortedWeeks = Object.keys(weekGroups).sort((a, b) => {
            const na = parseInt(a.replace("Week ", ""));
            const nb = parseInt(b.replace("Week ", ""));
            return nb - na;
          });
          const getMicroForUpload = (u) => {
            const catEntries = microHistory[u.category] || [];
            return catEntries.find(e => e.course === u.course && e.week === u.week && Math.abs(e.timestamp - u.timestamp) < 60000);
          };
          const courseUploads = uploadLog.filter(u => u.course === portfolioCourse);
          return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <PageHeader breadcrumb="🏠 Dashboard › 📁 Course Portfolio" title="Course Portfolio" subtitle="Your complete term record — uploads, AI insights, and reflective narrative." featureInfo={<FeatureInfo sectionId="course-portfolio" />} />
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => {
                  let html = makePdfHeader(profile?.name, `${portfolioCourse} · ${portfolioWeek === "All" ? "All Weeks" : portfolioWeek}`);
                  html += `<h1>Course Portfolio — ${portfolioCourse}</h1>`;
                  sortedWeeks.forEach(wk => {
                    html += `<h2>${wk}</h2>`;
                    weekGroups[wk].forEach(u => {
                      html += `<p><strong>${u.category}</strong> — ${new Date(u.timestamp).toLocaleDateString()}</p><p>${u.content.replace(/\n/g, "<br>")}</p>`;
                      const match = getMicroForUpload(u);
                      if (match) match.recs.forEach(r => { html += `<p style="margin-left:16px;border-left:3px solid #0FB5B5;padding-left:10px"><strong>${r.tag}:</strong> ${r.title}<br><em>${r.summary}</em><br>→ ${r.action}</p>`; });
                    });
                  });
                  if (reflectionText) html += `<h2>Term Reflection</h2><pre>${reflectionText}</pre>`;
                  printPdf(html, `Course Portfolio — ${portfolioCourse}`);
                }}
                  style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.white, background: C.navy, border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>Export as PDF</button>
                <button onClick={async () => {
                  const paras = [];
                  sortedWeeks.forEach(wk => {
                    paras.push(new Paragraph({ text: wk, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }));
                    weekGroups[wk].forEach(u => {
                      paras.push(new Paragraph({ children: [new TextRun({ text: `${u.category} — ${new Date(u.timestamp).toLocaleDateString()}`, bold: true, size: 22, font: "Calibri" })], spacing: { after: 60 } }));
                      paras.push(new Paragraph({ children: [new TextRun({ text: u.content, size: 22, font: "Calibri" })], spacing: { after: 120 } }));
                      const match = getMicroForUpload(u);
                      if (match) match.recs.forEach(r => {
                        paras.push(new Paragraph({ children: [new TextRun({ text: `${r.tag}: ${r.title}`, bold: true, size: 20, color: "0B8A8A", font: "Calibri" })], spacing: { before: 80, after: 40 } }));
                        paras.push(new Paragraph({ children: [new TextRun({ text: `→ ${r.action}`, italics: true, size: 20, font: "Calibri" })], spacing: { after: 80 } }));
                      });
                    });
                  });
                  if (reflectionText) {
                    paras.push(new Paragraph({ text: "Term Reflection", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 120 } }));
                    reflectionText.split("\n").forEach(line => paras.push(new Paragraph({ children: [new TextRun({ text: line, size: 22, font: "Calibri" })], spacing: { after: 60 } })));
                  }
                  await exportGenericDocx(paras, `Course Portfolio — ${portfolioCourse}`, `${profile?.name || "Faculty"} · Generated by KlasUp`, `${portfolioCourse}-portfolio.docx`);
                }}
                  style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.navy, background: C.ivoryDark, border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>Export as Word</button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <select value={portfolioCourse} onChange={e => setPortfolioCourse(e.target.value)}
                style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.navy, cursor: "pointer" }}>
                {dbCourses.map(c => <option key={c.course_code} value={c.course_code}>{formatCourseLabel(c)}</option>)}
              </select>
              <select value={portfolioWeek} onChange={e => setPortfolioWeek(e.target.value)}
                style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.teal, cursor: "pointer" }}>
                <option value="All">All Weeks</option>
                {WEEKS.map(w => <option key={w}>{w}</option>)}
              </select>
              <div style={{ fontSize: 11, fontFamily: F.accent, color: C.muted, marginLeft: 4 }}>
                {filteredLog.length} upload{filteredLog.length !== 1 ? "s" : ""} · {sortedWeeks.length} week{sortedWeeks.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Empty state */}
            {filteredLog.length === 0 && (
              <Card style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>◆</div>
                <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 6, color: C.navy }}>No uploads yet</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Head to <strong>My Course</strong> to upload content. Each submission and its AI-generated micro-learnings will appear here automatically.</div>
                <button onClick={() => setPage("Pedagogy Studio")} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "8px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Go to Pedagogy Studio</button>
              </Card>
            )}

            {/* Week-by-week upload timeline */}
            {sortedWeeks.map(wk => (
              <div key={wk} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 4, height: 20, background: C.tealBright, borderRadius: 2 }} />
                  <div style={{ fontFamily: F.display, fontSize: 18, color: C.navy }}>{wk}</div>
                  <div style={{ fontSize: 11, fontFamily: F.accent, color: C.muted }}>{weekGroups[wk].length} upload{weekGroups[wk].length !== 1 ? "s" : ""}</div>
                </div>
                {weekGroups[wk].map((u, ui) => {
                  const key = `${u.week}-${u.category}-${u.timestamp}`;
                  const isOpen = portfolioExpanded[key];
                  const micro = getMicroForUpload(u);
                  return (
                    <Card key={ui} style={{ marginBottom: 10, borderLeft: `3px solid ${C.tealBright}`, padding: 0, overflow: "hidden" }}>
                      <button onClick={() => setPortfolioExpanded(p => ({ ...p, [key]: !isOpen }))}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: "1rem 1.25rem", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{CAT_ICONS[u.category] || "◎"}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: C.navy }}>{u.category}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>{u.course} · {new Date(u.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {micro && <span style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, color: C.tealBright, background: C.tealLight, padding: "2px 8px", borderRadius: 20 }}>{micro.recs.length} insights</span>}
                          <span style={{ fontSize: 11, color: C.muted, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▶</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{ borderTop: `0.5px solid ${C.border}` }}>
                          {/* Upload content */}
                          <div style={{ padding: "1rem 1.25rem", background: C.ivory }}>
                            <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 6 }}>UPLOADED CONTENT</div>
                            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{u.content}</div>
                          </div>
                          {/* Micro-learnings triggered */}
                          {micro && (
                            <div style={{ padding: "1rem 1.25rem" }}>
                              <div style={{ fontSize: 10, fontFamily: F.accent, color: C.tealBright, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 6, height: 6, background: C.tealBright, borderRadius: "50%", display: "inline-block" }} />
                                AI MICRO-LEARNINGS TRIGGERED
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8 }}>
                                {micro.recs.map((m, mi) => {
                                  const tc = TAG_COLORS[m.tag] || { color: C.teal, bg: C.tealLight };
                                  return (
                                    <div key={mi} style={{ background: C.ivory, borderRadius: 10, padding: "0.75rem", border: `0.5px solid ${C.border}` }}>
                                      <div style={{ marginBottom: 6 }}><Tag label={m.tag} color={tc.color} bg={tc.bg} /></div>
                                      <div style={{ fontFamily: F.display, fontSize: 13, marginBottom: 4 }}>{m.title}</div>
                                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 6 }}>{m.summary}</div>
                                      <div style={{ fontSize: 10, color: C.muted, fontStyle: "italic", marginBottom: 6 }}>{m.article}</div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 3, height: 16, background: tc.color, borderRadius: 2 }} />
                                        <div style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{m.action}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ))}

            {/* ── End of Term Reflection ── */}
            <div style={{ marginTop: 30, background: C.navy, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: C.white, marginBottom: 4 }}>End of Term Reflection</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
                      AI-drafted narrative based on {courseUploads.length} upload{courseUploads.length !== 1 ? "s" : ""} for {portfolioCourse} — edit freely, then export.
                    </div>
                  </div>
                  {reflectionText && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => {
                          if (reflectionEditing) {
                            // Save edited reflection to DB
                            const cObj = dbCourses.find(c => c.course_code === portfolioCourse);
                            if (session?.user && cObj) {
                              upsertReflection(session.user.id, cObj.id, cObj.term_code || "", null, reflectionText)
                                .catch(e => console.warn("Reflection edit save failed:", e));
                            }
                          }
                          setReflectionEditing(!reflectionEditing);
                        }}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: reflectionEditing ? C.tealBright : "rgba(255,255,255,0.1)", color: reflectionEditing ? C.navy : "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        {reflectionEditing ? "Done Editing" : "Edit"}
                      </button>
                      <button onClick={async () => {
                        const paras = reflectionText.split("\n").map(line => new Paragraph({ children: [new TextRun({ text: line, size: 22, font: "Calibri" })], spacing: { after: 80 } }));
                        await exportGenericDocx(paras, `Term Reflection — ${portfolioCourse}`, `${profile?.name || "Faculty"} · Generated by KlasUp`, `${portfolioCourse.replace(/ /g, "_")}_Reflection.docx`);
                      }}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        Export as Word
                      </button>
                      <button onClick={() => printPdf(makePdfHeader(profile?.name, portfolioCourse) + `<h1>Term Reflection</h1><pre>${reflectionText}</pre>`, `Term Reflection — ${portfolioCourse}`)}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        Export as PDF
                      </button>
                      <button onClick={() => {
                        if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "text" });
                        const blob = new Blob([reflectionText], { type: "text/plain" });
                        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                        a.download = `${portfolioCourse.replace(/ /g, "_")}_Term_Reflection.txt`; a.click();
                      }}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        Export as Text
                      </button>
                    </div>
                  )}
                </div>

                {!reflectionText && !reflectionLoading && (
                  <button onClick={() => {
                    if (courseUploads.length === 0) return;
                    setReflectionLoading(true);
                    setReflectionError(null);
                    generateSemesterReflection({ course: portfolioCourse, uploadLog, microHistory })
                      .then(text => {
                        setReflectionText(text); setReflectionLoading(false);
                        // Persist reflection to DB
                        const cObj = dbCourses.find(c => c.course_code === portfolioCourse);
                        if (session?.user && cObj) {
                          upsertReflection(session.user.id, cObj.id, cObj.term_code || "", text)
                            .catch(e => console.warn("Reflection save failed:", e));
                        }
                      })
                      .catch(err => { console.error(err); setReflectionError(err.message); setReflectionLoading(false); });
                  }}
                    style={{ background: courseUploads.length > 0 ? C.tealBright : "rgba(255,255,255,0.1)", color: courseUploads.length > 0 ? C.navy : "rgba(255,255,255,0.3)", border: "none", borderRadius: 10, padding: "12px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: courseUploads.length > 0 ? "pointer" : "default" }}>
                    Generate Reflection
                  </button>
                )}

                {reflectionLoading && (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    <div style={{ fontSize: 22, marginBottom: 8, animation: "spin 1.5s linear infinite", color: C.tealBright }}>◉</div>
                    <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.tealBright, fontSize: 12, marginBottom: 4 }}>Drafting your term reflection...</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Analyzing {courseUploads.length} uploads and their micro-learnings</div>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {reflectionError && (
                  <div style={{ background: "rgba(196,104,122,0.15)", border: `0.5px solid ${C.rose}`, borderRadius: 10, padding: "0.75rem 1rem", marginTop: 10 }}>
                    <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.rose, fontSize: 12, marginBottom: 3 }}>Could not generate reflection</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{reflectionError}</div>
                    <button onClick={() => { setReflectionError(null); }}
                      style={{ marginTop: 8, fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                      Try Again
                    </button>
                  </div>
                )}

                {reflectionText && (
                  <div style={{ marginTop: 10 }}>
                    {reflectionEditing ? (
                      <div style={{ position: "relative" }}>
                        <textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)}
                          style={{ width: "100%", minHeight: 400, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.tealBright}44`, borderRadius: 10, padding: "1rem", fontFamily: F.body, fontSize: 13, color: C.white, lineHeight: 1.75, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                        <VoiceMic onTranscript={t => setReflectionText(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 10, bottom: 10 }} />
                      </div>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "1.25rem", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {reflectionText}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingBottom: 4 }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: F.accent }}>
                        {reflectionText.split(/\s+/).length} words · Generated from {courseUploads.length} uploads
                      </div>
                      <button onClick={() => { setReflectionText(""); setReflectionEditing(false); }}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "none", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}>
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── STUDENT VOICE ── */}
        {page === "Student Voice" && !gatedPageIds.has("Student Voice") && (
          <StudentVoicePage canPro={can("pro")} onUpgrade={upgrade} featureInfo={<FeatureInfo sectionId="student-voice" />} />
        )}

        {/* ── COURSE ARCHITECT ── */}
        {page === "Course Architect" && (
          <CourseArchitect setPage={setPage} courses={dbCourses} activeCourseId={activeCourseId} onSetActiveCourse={handleSetActiveCourse} userId={session?.user?.id} onCourseCreated={(row) => { setDbCourses(prev => [...prev, row]); handleSetActiveCourse(row.id); }} onSendToPedagogy={handleSendToPedagogy} featureInfo={<FeatureInfo sectionId="course-architect" />} profileInstitutions={profile?.institutions || []} homeInstitution={profile?.institution || ""} />
        )}

        {/* ── COURSE SETUP ── */}
        {page === "Course Setup" && (
          <CourseSetup setPage={setPage} course={dbCourses.find(c => c.id === activeCourseId) || dbCourses[0] || null} userId={session?.user?.id} />
        )}

        {/* ── WELLNESS ── */}
        {page === "Wellness" && !gatedPageIds.has("Wellness") && (() => {
          const MEDITATION_AUDIO_BASE = "https://thbfibtknxivegybhupw.supabase.co/storage/v1/object/public/meditations/";
          const FACULTY_MEDITATIONS = [
            { title: "Before a Tough Class", duration: "3 min", desc: "Ground yourself and find your center before walking into a challenging session.", inhale: 4, hold: 4, exhale: 6, rounds: 6, audioUrl: MEDITATION_AUDIO_BASE + "before-tough-class.mp3" },
            { title: "After a Draining Week", duration: "5 min", desc: "Release the weight of the week. You gave what you had — now restore.", inhale: 4, hold: 7, exhale: 8, rounds: 8, audioUrl: MEDITATION_AUDIO_BASE + "after-a-draining-week.mp3" },
            { title: "Reconnect with Purpose", duration: "4 min", desc: "Remember why you teach. Reconnect with the impact you make every day.", inhale: 5, hold: 5, exhale: 5, rounds: 7, audioUrl: MEDITATION_AUDIO_BASE + "purpose.mp3" },
            { title: "Midday Reset", duration: "2 min", desc: "A quick energy refresh between classes or meetings.", inhale: 3, hold: 3, exhale: 4, rounds: 5, audioUrl: MEDITATION_AUDIO_BASE + "reset.mp3" },
          ];
          const STUDENT_MEDITATIONS = [
            { emoji: "🎨", title: "Before a Creative Assignment", duration: "2 min", desc: "Open up to new ideas and let go of perfectionism.", inhale: 4, hold: 3, exhale: 5, rounds: 4, state: "Creativity", audioUrl: MEDITATION_AUDIO_BASE + "creativity.mp3" },
            { emoji: "💬", title: "Before Presentations or Discussions", duration: "2 min", desc: "Calm nerves and find your voice before speaking up.", inhale: 4, hold: 4, exhale: 6, rounds: 4, state: "Communication", audioUrl: MEDITATION_AUDIO_BASE + "communication.mp3" },
            { emoji: "📝", title: "Before an Exam", duration: "3 min", desc: "Settle anxiety and access what you already know.", inhale: 4, hold: 7, exhale: 8, rounds: 5, state: "Test Anxiety", audioUrl: null },
            { emoji: "🔥", title: "Mid-Term Reset", duration: "4 min", desc: "When everything feels like too much — pause and recharge.", inhale: 5, hold: 5, exhale: 7, rounds: 6, state: "Burnout", audioUrl: MEDITATION_AUDIO_BASE + "burnout.mp3" },
            { emoji: "💭", title: "Processing Difficult Topics", duration: "3 min", desc: "Create space after emotionally heavy content or discussions.", inhale: 4, hold: 5, exhale: 6, rounds: 5, state: "Understanding Emotions", audioUrl: null },
            { emoji: "🌱", title: "General Centering", duration: "2 min", desc: "A simple grounding exercise for any moment you need stillness.", inhale: 4, hold: 4, exhale: 4, rounds: 5, state: "Grounding", audioUrl: null },
          ];

          const fmtDuration = (m) => {
            const d = audioDurations[m.audioUrl];
            if (!d) return m.duration; // fallback while loading
            const mins = Math.floor(d / 60);
            const secs = Math.floor(d % 60);
            return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:00`;
          };

          // Weekly check-in history visual (last 4 weeks)
          const weeklyData = [];
          for (let w = 0; w < 4; w++) {
            const weekCheckins = wellnessHistory.filter(c => {
              const d = new Date(c.created_at);
              const now = new Date();
              const weekStart = new Date(now); weekStart.setDate(now.getDate() - (w + 1) * 7);
              const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - w * 7);
              return d >= weekStart && d < weekEnd;
            });
            const avg = weekCheckins.length > 0 ? Math.round(weekCheckins.reduce((a, c) => a + c.check_in_score, 0) / weekCheckins.length) : 0;
            weeklyData.unshift({ week: `${w === 0 ? "This" : w} wk${w > 1 ? "s" : ""} ago`, avg, count: weekCheckins.length });
          }

          return (
          <div>
            <PageHeader breadcrumb="🏠 Dashboard › 🌿 Wellness" title="Wellness" subtitle="Your wellbeing matters. Teaching is a practice — and so is taking care of yourself." featureInfo={<FeatureInfo sectionId="wellness" />} />

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.ivoryDark, borderRadius: 10, padding: 3 }}>
              {[{ id: "faculty", label: "Your Wellbeing" }, { id: "students", label: "Your Students" }].map(t => (
                <button key={t.id} onClick={() => setWellnessTab(t.id)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", background: wellnessTab === t.id ? C.white : "transparent", color: wellnessTab === t.id ? C.sage : C.muted, transition: "all 0.2s" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB 1: FACULTY WELLBEING ── */}
            {wellnessTab === "faculty" && (
              <div>
                {/* Your Last 4 Weeks — top */}
                <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, #1B2B4B 0%, #2A9D8F 100%)`, border: "none" }}>
                  <div style={{ fontFamily: F.display, fontSize: 17, color: "#FAF7F2", marginBottom: 12 }}>Your Last 4 Weeks</div>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10 }}>
                    {weeklyData.map((w, i) => (
                      <div key={i} style={{ background: w.avg === 0 ? C.ivoryDark : w.avg <= 2 ? C.roseLight : w.avg <= 3 ? "#FFF8E7" : "#EAF3DE", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{w.avg > 0 ? WELLNESS_EMOJIS[w.avg - 1] : "—"}</div>
                        <div style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.navy }}>{w.week}</div>
                        <div style={{ fontSize: 10, fontFamily: F.body, color: C.navy }}>{w.count} check-in{w.count !== 1 ? "s" : ""}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Check-in + Breathing — side by side on desktop, stacked on mobile */}
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {/* Weekly check-in */}
                  <div style={{ background: C.white, borderRadius: 14, padding: "1.25rem", border: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: F.display, fontSize: 16, color: C.navy, marginBottom: 8 }}>How are you feeling?</div>
                    <div style={{ display: "flex", gap: mob ? 8 : 10, marginBottom: wellnessMsg ? 12 : 0 }}>
                      {WELLNESS_EMOJIS.map((e, i) => (
                        <button key={i} onClick={() => handleWellnessCheckin(i + 1)}
                          style={{ fontSize: mob ? 26 : 30, background: wellnessScore === i + 1 ? `${C.sage}22` : "transparent", border: wellnessScore === i + 1 ? `2px solid ${C.sage}` : "2px solid transparent", borderRadius: "50%", width: mob ? 42 : 48, height: mob ? 42 : 48, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {e}
                        </button>
                      ))}
                    </div>
                    {wellnessMsg && (
                      <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                        <div style={{ fontSize: 13, fontFamily: F.body, color: C.navy, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{wellnessMsg.message}</div>
                        <div style={{ fontSize: 12, fontFamily: F.body, color: C.muted, lineHeight: 1.5 }}>💡 {wellnessMsg.tip}</div>
                      </div>
                    )}
                    {wellnessBurnoutFlag && (
                      <div style={{ background: C.roseLight, borderRadius: 8, padding: "8px 12px", marginTop: 10, fontSize: 13, fontFamily: F.body, color: C.rose, lineHeight: 1.5 }}>
                        You've had a tough few days. Be gentle with yourself. 🌿
                      </div>
                    )}
                  </div>

                  {/* Breathing exercise card */}
                  <div style={{ background: C.white, borderRadius: 14, padding: "1.25rem", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: F.display, fontSize: 16, color: C.navy, marginBottom: 4 }}>Breathing Exercise</div>
                      <div style={{ fontSize: 13, fontFamily: F.body, color: C.muted, lineHeight: 1.5 }}>Choose a pattern and duration. Just breathe.</div>
                    </div>
                    <button onClick={() => setBreathExerciseOpen({ step: "settings", pattern: "box", minutes: 3 })}
                      style={{ background: C.sage, color: C.white, border: "none", borderRadius: 10, padding: "9px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 12, alignSelf: "flex-start" }}>
                      Begin 🌿
                    </button>
                  </div>
                </div>

                {/* Faculty meditations */}
                <div style={{ fontFamily: F.display, fontSize: 17, color: C.navy, marginBottom: 12 }}>Guided Meditations for Faculty</div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {FACULTY_MEDITATIONS.filter(m => m.audioUrl).map((m, i) => (
                    <Card key={i} style={{ background: "#EAF3DE", border: `1px solid ${C.sage}22` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontFamily: F.display, fontSize: 16, color: C.navy }}>{m.title}</div>
                        <Tag label={fmtDuration(m)} color={C.sage} bg={`${C.sage}18`} />
                      </div>
                      <div style={{ fontSize: 13, fontFamily: F.body, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{m.desc}</div>
                      <button onClick={() => setBreathingOpen(m)}
                        style={{ background: C.sage, color: C.white, border: "none", borderRadius: 10, padding: "9px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        Begin 🌿
                      </button>
                    </Card>
                  ))}
                </div>

              </div>
            )}

            {/* ── TAB 2: YOUR STUDENTS ── */}
            {wellnessTab === "students" && (
              <div>
                {/* Weekly reflection */}
                <Card style={{ marginBottom: 16, background: "#EAF3DE", border: `1px solid ${C.sage}22` }}>
                  <div style={{ fontFamily: F.display, fontSize: 17, color: C.navy, marginBottom: 8 }}>What have you done to support the whole student this week?</div>
                  <textarea value={wellnessReflection} onChange={e => setWellnessReflection(e.target.value)}
                    placeholder="Share a moment — big or small — where you saw or supported the whole student..."
                    rows={4}
                    style={{ width: "100%", border: `1px solid ${C.sage}33`, borderRadius: 10, padding: 12, fontFamily: F.body, fontSize: 14, resize: "none", boxSizing: "border-box", background: "rgba(255,255,255,0.7)", lineHeight: 1.6 }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button onClick={async () => {
                      if (!wellnessReflection.trim()) return;
                      setWellnessReflectionLoading(true);
                      try {
                        const data = await (await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-micro-learning`, {
                          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                          body: JSON.stringify({ type: "sage-chat", messages: [{ role: "user", content: `A faculty member reflected on supporting the whole student this week: "${wellnessReflection}"\n\nRespond with: (1) A warm, genuine 1-2 sentence acknowledgment of what they shared. (2) One specific, research-backed suggestion for next week. Keep it concise and encouraging. Use 🌿 sparingly.` }], currentPage: "Wellness" }),
                        })).json();
                        setWellnessReflectionResult(data.reply);
                      } catch (e) { setWellnessReflectionResult("Thank you for reflecting on your students' wellbeing. That awareness itself is a powerful act of care. 🌿"); }
                      setWellnessReflectionLoading(false);
                    }}
                      disabled={!wellnessReflection.trim() || wellnessReflectionLoading}
                      style={{ background: C.sage, color: C.white, border: "none", borderRadius: 10, padding: "9px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: wellnessReflectionLoading ? "wait" : "pointer", opacity: !wellnessReflection.trim() ? 0.5 : 1 }}>
                      {wellnessReflectionLoading ? "Reflecting..." : "Submit Reflection"}
                    </button>
                  </div>
                  {wellnessReflectionResult && (
                    <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "12px 14px", marginTop: 10, fontSize: 14, fontFamily: F.body, color: C.navy, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {wellnessReflectionResult}
                    </div>
                  )}
                </Card>

                {/* Student exercises */}
                <div style={{ fontFamily: F.display, fontSize: 17, color: C.navy, marginBottom: 12 }}>Guided Exercises for Students</div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {STUDENT_MEDITATIONS.filter(m => m.audioUrl).map((m, i) => (
                    <Card key={i} style={{ border: `1px solid ${C.sage}22` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 20, marginRight: 8 }}>{m.emoji}</span>
                          <span style={{ fontFamily: F.display, fontSize: 15, color: C.navy }}>{m.title}</span>
                        </div>
                        <Tag label={fmtDuration(m)} color={C.sage} bg={`${C.sage}18`} />
                      </div>
                      <div style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.teal, marginBottom: 6 }}>{m.state}</div>
                      <div style={{ fontSize: 13, fontFamily: F.body, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{m.desc}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setBreathingOpen(m)}
                          style={{ background: C.sage, color: C.white, border: "none", borderRadius: 10, padding: "8px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          Begin
                        </button>
                        <button onClick={() => {
                          const text = `🌿 ${m.title} (${fmtDuration(m)})\n\n${m.desc}\n\nTry this before ${m.state.toLowerCase()}: Close your eyes. Breathe in for ${m.inhale} seconds, hold for ${m.hold}, breathe out for ${m.exhale}. Repeat ${m.rounds} times.\n\n— Shared via KlasUp (klasup.com)`;
                          navigator.clipboard.writeText(text);
                        }}
                          style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10, padding: "8px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          Share with Students
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>

              </div>
            )}
          </div>
          );
        })()}

        {/* ── SETTINGS ── */}
        {page === "Settings" && (() => {
          const emptyForm = { course_code: "", course_name: "", section: "", term_code: "", term_start: "", num_weeks: 16 };
          const isAdding = settingsEditing === "new";
          // Initialize profile form if needed
          if (!settingsProfileForm && profile) {
            // Will trigger a re-render with the form populated
            Promise.resolve().then(() => setSettingsProfileForm({
              name: profile.name || "",
              institution: profile.institution || "",
              job_title: profile.job_title || "",
              lms: profile.lms || "",
              education_level: profile.education_level || "",
              bio: profile.bio || "",
              institutions: Array.isArray(profile.institutions) && profile.institutions.length > 0
                ? profile.institutions
                : profile.institution ? [profile.institution] : [],
            }));
          }
          const pf = settingsProfileForm || {};
          const initials = (profile?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

          const inputStyle = { width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box", background: C.white };
          const labelStyle = { fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 };

          return (
          <div>
            <PageHeader breadcrumb="🏠 Dashboard › ⚙️ Settings" title="Settings" subtitle="Manage your profile, courses, and account." />

            {/* ── PROFILE SECTION ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 20, color: C.navy, marginBottom: 16 }}>Profile</div>

              {/* Avatar + name row */}
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ position: "relative" }}>
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="Avatar" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.tealLight}` }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.tealBright, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontFamily: F.display, fontSize: 24 }}>
                      {initials}
                    </div>
                  )}
                  <label style={{ position: "absolute", bottom: -4, right: -4, width: 26, height: 26, borderRadius: "50%", background: C.white, border: `2px solid ${C.tealBright}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>
                    {settingsPhotoUploading ? "..." : "📷"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSettingsPhotoUploading(true);
                      try {
                        const url = await uploadProfilePhoto(session.user.id, file);
                        setProfile(p => ({ ...p, photo_url: url }));
                      } catch (err) { alert("Upload failed: " + err.message); }
                      finally { setSettingsPhotoUploading(false); }
                    }} />
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 18, color: C.navy }}>{profile?.name || "Faculty"}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{session?.user?.email}</div>
                  {profile?.created_at && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>}
                </div>
              </div>

              {/* Profile fields */}
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input value={pf.name || ""} onChange={e => setSettingsProfileForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input value={session?.user?.email || ""} disabled style={{ ...inputStyle, background: C.ivoryDark, color: C.muted, cursor: "not-allowed" }} />
                </div>
                <div>
                  <label style={labelStyle}>Job Title</label>
                  <select value={pf.job_title || ""} onChange={e => setSettingsProfileForm(p => ({ ...p, job_title: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Select...</option>
                    {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Institution</label>
                  <input value={pf.institution || ""} onChange={e => setSettingsProfileForm(p => ({ ...p, institution: e.target.value }))} placeholder="e.g. Boston University" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>My Institutions</label>
                  {(pf.institutions || []).map((inst, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: F.accent, fontWeight: 700, minWidth: 24 }}>{i + 1}.</span>
                      <input value={inst} onChange={e => {
                        const updated = [...(pf.institutions || [])];
                        updated[i] = e.target.value;
                        setSettingsProfileForm(p => ({ ...p, institutions: updated }));
                      }} placeholder="e.g. Boston University" style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={() => {
                        const updated = (pf.institutions || []).filter((_, j) => j !== i);
                        setSettingsProfileForm(p => ({ ...p, institutions: updated }));
                      }}
                        style={{ background: C.roseLight, color: C.rose, border: "none", borderRadius: 8, padding: "5px 10px", fontFamily: F.accent, fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>✕ Remove</button>
                    </div>
                  ))}
                  <button onClick={() => setSettingsProfileForm(p => ({ ...p, institutions: [...(p.institutions || []), ""] }))}
                    style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "6px 14px", fontFamily: F.accent, fontWeight: 600, fontSize: 12, color: C.teal, cursor: "pointer" }}>
                    + Add another institution
                  </button>
                </div>
                <div>
                  <label style={labelStyle}>LMS</label>
                  <select value={pf.lms || ""} onChange={e => setSettingsProfileForm(p => ({ ...p, lms: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Select...</option>
                    {LMS_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Highest Education Level</label>
                  <select value={pf.education_level || ""} onChange={e => setSettingsProfileForm(p => ({ ...p, education_level: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Select...</option>
                    {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Dr. prefix suggestion */}
              {DR_ELIGIBLE.includes(pf.education_level) && !hasDrPrefix(pf.name) && !pf._drDismissed && (
                <div style={{ marginBottom: 14, padding: "10px 14px", background: C.tealLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, color: C.teal }}>Would you like to add <strong>Dr.</strong> to your display name?</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setSettingsProfileForm(p => ({ ...p, name: addDrPrefix(p.name) }))}
                      style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "5px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Yes</button>
                    <button onClick={() => setSettingsProfileForm(p => ({ ...p, _drDismissed: true }))}
                      style={{ background: C.white, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>No thanks</button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Bio</label>
                <textarea value={pf.bio || ""} onChange={e => setSettingsProfileForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell us a little about your teaching..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={async () => {
                  if (!pf.name?.trim()) return;
                  setSettingsProfileSaving(true);
                  setSettingsProfileMsg(null);
                  try {
                    const cleanedInstitutions = (pf.institutions || []).map(s => s.trim()).filter(Boolean);
                    const updated = await upsertProfile(session.user.id, {
                      ...profile,
                      name: pf.name.trim(),
                      institution: pf.institution?.trim() || null,
                      institutions: cleanedInstitutions.length > 0 ? cleanedInstitutions : null,
                      job_title: pf.job_title || null,
                      lms: pf.lms || null,
                      education_level: pf.education_level || null,
                      bio: pf.bio?.trim() || null,
                      email: session.user.email,
                    });
                    setProfile(updated);
                    setSettingsProfileMsg("saved");
                    setTimeout(() => setSettingsProfileMsg(null), 3000);
                  } catch (err) { setSettingsProfileMsg("error:" + err.message); }
                  finally { setSettingsProfileSaving(false); }
                }}
                  disabled={settingsProfileSaving || !pf.name?.trim()}
                  style={{ background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: settingsProfileSaving ? "wait" : "pointer", opacity: !pf.name?.trim() ? 0.5 : 1 }}>
                  {settingsProfileSaving ? "Saving..." : "Save Changes"}
                </button>
                {settingsProfileMsg === "saved" && <span style={{ fontSize: 12, color: C.sage, fontWeight: 700 }}>Changes saved!</span>}
                {settingsProfileMsg?.startsWith("error:") && <span style={{ fontSize: 12, color: C.rose, fontWeight: 700 }}>{settingsProfileMsg.slice(6)}</span>}
              </div>
            </Card>

            {/* ── ACCOUNT SECTION ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 20, color: C.navy, marginBottom: 14 }}>Account</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  fontSize: 12, fontFamily: F.accent, fontWeight: 700, padding: "4px 14px", borderRadius: 20,
                  background: tier === "pro" ? C.tealLight : tier === "institutional" ? C.goldLight : C.ivoryDark,
                  color: tier === "pro" ? C.teal : tier === "institutional" ? C.gold : C.muted,
                }}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}{subStatus.trialActive ? " Trial" : ""} Plan
                </div>
                {subStatus.trialActive && subStatus.daysLeft > 0 && (
                  <span style={{ fontSize: 12, color: subStatus.trialExpiringSoon ? C.rose : C.muted }}>
                    {subStatus.daysLeft} day{subStatus.daysLeft !== 1 ? "s" : ""} left
                  </span>
                )}
              </div>
              {profile?.created_at && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Account created {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
              )}
              {tier === "free" && (
                <button onClick={upgrade} style={{ background: C.tealBright, color: C.white, border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Upgrade to Pro
                </button>
              )}
              {tier === "pro" && !subStatus.trialActive && (
                <button style={{ background: C.ivoryDark, color: C.muted, border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Cancel Subscription
                </button>
              )}
            </Card>

            {/* ── TERM SETTINGS (Courses) ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: F.display, fontSize: 20, color: C.navy }}>Term Settings</div>
              </div>

              {dbCourses.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: C.muted }}>
                  <div style={{ fontSize: 13 }}>No courses yet. <span onClick={() => setPage("Course Architect")} style={{ color: C.teal, cursor: "pointer", fontWeight: 600 }}>Go to Course Architect</span> to add your first course.</div>
                </div>
              )}

              {dbCourses.map(c => {
                const isEdit = settingsEditing === c.id;
                return (
                  <div key={c.id} style={{ border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "1rem", marginBottom: 10, background: isEdit ? C.ivory : C.white }}>
                    {isEdit ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
                          <div>
                            <label style={labelStyle}>Course Code</label>
                            <input value={settingsForm.course_code || ""} onChange={e => setSettingsForm(p => ({ ...p, course_code: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Course Name</label>
                            <input value={settingsForm.course_name || ""} onChange={e => setSettingsForm(p => ({ ...p, course_name: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Section</label>
                            <input value={settingsForm.section || ""} onChange={e => setSettingsForm(p => ({ ...p, section: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Term Code</label>
                            <input value={settingsForm.term_code || ""} onChange={e => setSettingsForm(p => ({ ...p, term_code: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Term Start</label>
                            <input type="date" value={settingsForm.term_start || ""} onChange={e => setSettingsForm(p => ({ ...p, term_start: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Weeks</label>
                            <input type="number" min={1} max={52} value={settingsForm.num_weeks || 16} onChange={e => setSettingsForm(p => ({ ...p, num_weeks: e.target.value }))} style={inputStyle} />
                          </div>
                          {(() => {
                            const opts = [...new Set([...(settingsProfileForm?.institutions || []), ...((settingsProfileForm?.institution && !(settingsProfileForm?.institutions || []).includes(settingsProfileForm.institution)) ? [settingsProfileForm.institution] : [])].filter(Boolean))];
                            return opts.length > 0 ? (
                              <div>
                                <label style={labelStyle}>Institution</label>
                                <select value={settingsForm.institution || ""} onChange={e => setSettingsForm(p => ({ ...p, institution: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                                  <option value="">— None —</option>
                                  {opts.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                </select>
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={async () => {
                            try {
                              await editCourse(c.id, { course_code: settingsForm.course_code.trim(), course_name: settingsForm.course_name.trim(), section: settingsForm.section.trim() || null, term_code: settingsForm.term_code.trim(), term_start: settingsForm.term_start || null, num_weeks: parseInt(settingsForm.num_weeks) || 16, institution: settingsForm.institution || null });
                              setSettingsEditing(null);
                            } catch (err) { alert("Error: " + err.message); }
                          }}
                            style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
                          <button onClick={() => setSettingsEditing(null)}
                            style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ fontFamily: F.display, fontSize: 16, color: C.navy }}>{c.course_code}</span>
                            <span style={{ fontSize: 13, color: C.muted }}>{c.course_name}</span>
                            {c.section && <Tag label={`Sec ${c.section}`} color={C.teal} bg={C.tealLight} />}
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted }}>
                            <span>{c.term_code}</span>
                            {c.term_start && <span>Starts {new Date(c.term_start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                            <span>{c.num_weeks || 16} weeks</span>
                            {c.institution && <span>{c.institution}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setSettingsEditing(c.id); setSettingsForm({ course_code: c.course_code, course_name: c.course_name, section: c.section || "", term_code: c.term_code, term_start: c.term_start || "", num_weeks: c.num_weeks || 16, institution: c.institution || "" }); }}
                            style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Edit</button>
                          <button onClick={async () => { if (confirm(`Remove ${c.course_code}?`)) { try { await removeCourse(c.id); } catch (err) { alert("Error: " + err.message); } } }}
                            style={{ background: C.roseLight, color: C.rose, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ fontSize: 12, color: C.muted, fontFamily: F.body, marginTop: dbCourses.length > 0 ? 8 : 0 }}>
                To add a new course, <span onClick={() => setPage("Course Architect")} style={{ color: C.teal, cursor: "pointer", fontWeight: 600 }}>go to Course Architect</span>.
              </div>
            </Card>

            {/* ── SECURITY ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 20, color: C.navy, marginBottom: 14 }}>Security</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input type="password" value={settingsPwForm.current} onChange={e => setSettingsPwForm(p => ({ ...p, current: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input type="password" value={settingsPwForm.newPw} onChange={e => setSettingsPwForm(p => ({ ...p, newPw: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input type="password" value={settingsPwForm.confirm} onChange={e => setSettingsPwForm(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={async () => {
                  if (!settingsPwForm.newPw || settingsPwForm.newPw.length < 8) { setSettingsPwMsg("error:Password must be at least 8 characters."); return; }
                  if (settingsPwForm.newPw !== settingsPwForm.confirm) { setSettingsPwMsg("error:Passwords don't match."); return; }
                  setSettingsPwSaving(true); setSettingsPwMsg(null);
                  try {
                    await updatePassword(settingsPwForm.newPw);
                    setSettingsPwForm({ current: "", newPw: "", confirm: "" });
                    setSettingsPwMsg("saved");
                    setTimeout(() => setSettingsPwMsg(null), 3000);
                  } catch (err) { setSettingsPwMsg("error:" + err.message); }
                  finally { setSettingsPwSaving(false); }
                }}
                  disabled={settingsPwSaving || !settingsPwForm.newPw}
                  style={{ background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: settingsPwSaving ? "wait" : "pointer", opacity: !settingsPwForm.newPw ? 0.5 : 1 }}>
                  {settingsPwSaving ? "Saving..." : "Update Password"}
                </button>
                {settingsPwMsg === "saved" && <span style={{ fontSize: 12, color: C.sage, fontWeight: 700 }}>Password updated!</span>}
                {settingsPwMsg?.startsWith("error:") && <span style={{ fontSize: 12, color: C.rose, fontWeight: 700 }}>{settingsPwMsg.slice(6)}</span>}
              </div>
            </Card>

            {/* ── FERPA ── */}
            <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.teal}` }}>
              <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 8 }}>FERPA Compliance</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>
                KlasUp does <strong>not</strong> collect or process student PII.
                All data relates to faculty teaching practices and course design. Ensure uploaded content does not contain student names, IDs, or grades.
              </div>
              <div style={{ fontSize: 11, fontFamily: F.accent, color: C.teal, fontWeight: 700 }}>Your institution's FERPA obligations are not affected by using KlasUp.</div>
            </Card>

            {/* ── LEGAL ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 12 }}>Legal</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => setShowTerms("terms")}
                  style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Terms of Service
                </button>
                <button onClick={() => setShowTerms("privacy")}
                  style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Privacy Policy
                </button>
              </div>
            </Card>

            {/* ── DANGER ZONE ── */}
            <Card style={{ borderLeft: `4px solid ${C.rose}`, background: `${C.roseLight}44` }}>
              <div style={{ fontFamily: F.display, fontSize: 20, color: C.rose, marginBottom: 8 }}>Danger Zone</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </div>
              <button onClick={() => setSettingsDeleteConfirm(true)}
                style={{ background: C.roseLight, color: C.rose, border: `1.5px solid ${C.rose}`, borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Request Account Deletion
              </button>
            </Card>

            {/* Delete confirmation modal */}
            {settingsDeleteConfirm && (
              <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,31,61,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ background: C.white, borderRadius: 16, padding: "2rem", maxWidth: 420, width: "90%", boxShadow: "0 8px 40px rgba(15,31,61,0.2)" }}>
                  <div style={{ fontFamily: F.display, fontSize: 20, color: C.rose, marginBottom: 12 }}>Delete your account?</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
                    This will permanently delete your profile, all courses, uploads, and generated content within 30 days. You will receive a confirmation email. <strong>This cannot be undone.</strong>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={async () => {
                      try {
                        await requestDataDeletion(session.user.id);
                        setSettingsDeleteConfirm(false);
                        alert("Deletion request submitted. Your account will be permanently deleted within 30 days.");
                      } catch (err) { alert("Error: " + err.message); }
                    }}
                      style={{ background: C.rose, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Yes, Delete My Account
                    </button>
                    <button onClick={() => setSettingsDeleteConfirm(false)}
                      style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── ADMIN PANEL ── */}
        {page === "Admin" && profile?.role === "admin" && (() => {
          const ROLE_COLORS = { free: C.muted, pro: C.tealBright, institutional: C.gold, admin: C.rose };
          return (
          <div>
            <PageHeader breadcrumb="🏠 Dashboard › 🔧 Admin" title="Admin Panel" subtitle="Manage users, view analytics, and send announcements." />

            {/* Usage Stats */}
            {adminStats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Users", value: adminStats.total_users, color: C.navy },
                  { label: "Active This Week", value: adminStats.active_this_week, color: C.tealBright },
                  { label: "Pro Users", value: adminStats.pro_users, color: C.teal },
                  { label: "Institutional", value: adminStats.institutional_users, color: C.gold },
                  { label: "Total Uploads", value: adminStats.total_uploads, color: C.sage },
                  { label: "Micro-Learnings", value: adminStats.total_micro_learnings, color: C.purple },
                  { label: "Active Trials", value: adminStats.active_trials, color: C.tealBright },
                ].map((s, i) => (
                  <Card key={i} style={{ textAlign: "center", padding: "1rem" }}>
                    <div style={{ fontFamily: F.display, fontSize: 28, color: s.color }}>{s.value ?? "—"}</div>
                    <div style={{ fontSize: 11, fontFamily: F.accent, color: C.muted, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                  </Card>
                ))}
              </div>
            )}

            {/* Funnel */}
            {adminFunnelData && (
              <Card style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 14 }}>Conversion Funnel</div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  {[
                    { label: "Signups", value: adminFunnelData.signups },
                    { label: "First Upload", value: adminFunnelData.first_uploads },
                    { label: "First Micro-Learning", value: adminFunnelData.first_micro_learnings },
                    { label: "Upgrade Prompt", value: adminFunnelData.upgrade_prompts_shown },
                  ].map((step, i) => {
                    const max = Math.max(adminFunnelData.signups || 1, 1);
                    const pct = Math.max(((step.value || 0) / max) * 100, 8);
                    return (
                      <div key={i} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontFamily: F.display, fontSize: 20, color: C.navy, marginBottom: 6 }}>{step.value ?? 0}</div>
                        <div style={{ height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                          <div style={{ width: "60%", height: `${pct}%`, background: `${C.tealBright}${i === 0 ? "" : "88"}`, borderRadius: "6px 6px 0 0" }} />
                        </div>
                        <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 600, marginTop: 6 }}>{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Send Announcement */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 12 }}>Send Announcement</div>
              <input value={adminAnnouncementForm.title} onChange={e => setAdminAnnouncementForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Announcement title"
                style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ position: "relative" }}>
                <textarea value={adminAnnouncementForm.body} onChange={e => setAdminAnnouncementForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Announcement message — visible to all users"
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box", resize: "vertical", marginBottom: 10 }} />
                <VoiceMic onTranscript={t => setAdminAnnouncementForm(p => ({ ...p, body: p.body ? p.body + " " + t : t }))} style={{ position: "absolute", right: 8, bottom: 18 }} />
              </div>
              <button disabled={!adminAnnouncementForm.title.trim() || !adminAnnouncementForm.body.trim()}
                onClick={async () => {
                  try {
                    await adminCreateAnnouncement(session.user.id, adminAnnouncementForm.title, adminAnnouncementForm.body);
                    setAdminAnnouncementForm({ title: "", body: "" });
                    alert("Announcement sent!");
                  } catch (err) { alert("Error: " + err.message); }
                }}
                style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "8px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer",
                  opacity: (!adminAnnouncementForm.title.trim() || !adminAnnouncementForm.body.trim()) ? 0.4 : 1 }}>
                Send to All Users
              </button>
            </Card>

            {/* Feature Flags */}
            <Card style={{ marginBottom: 20, borderLeft: `3px solid ${C.tealBright}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: F.display, fontSize: 18 }}>Feature Flags</div>
                <div style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted }}>{adminFeatureFlags.length} flag{adminFeatureFlags.length !== 1 ? "s" : ""}</div>
              </div>
              {adminFeatureFlags.length === 0 && (
                <div style={{ fontSize: 13, color: C.muted, padding: "1rem 0", textAlign: "center" }}>No feature flags found. Add rows to the <span style={{ fontFamily: "monospace", background: C.ivoryDark, padding: "2px 6px", borderRadius: 4 }}>feature_flags</span> table to manage them here.</div>
              )}
              {adminFeatureFlags.map(ff => (
                <div key={ff.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `0.5px solid ${C.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.accent, fontWeight: 700, fontSize: 13, color: C.navy }}>{ff.name}</div>
                    {ff.description && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{ff.description}</div>}
                  </div>
                  <button
                    onClick={async () => {
                      const next = !ff.enabled;
                      setAdminFeatureFlags(prev => prev.map(f => f.id === ff.id ? { ...f, enabled: next } : f));
                      try {
                        const { error } = await supabase.from("feature_flags").update({ enabled: next }).eq("id", ff.id);
                        if (error) throw error;
                      } catch (err) {
                        setAdminFeatureFlags(prev => prev.map(f => f.id === ff.id ? { ...f, enabled: !next } : f));
                        alert("Failed to update flag: " + err.message);
                      }
                    }}
                    style={{
                      position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", flexShrink: 0, marginLeft: 16,
                      background: ff.enabled ? C.tealBright : C.border,
                      transition: "background 0.2s",
                    }}>
                    <span style={{
                      position: "absolute", top: 2, left: ff.enabled ? 22 : 2,
                      width: 20, height: 20, borderRadius: "50%", background: C.white,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>
              ))}
            </Card>

            {/* Create Test Account */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 12 }}>Create Test Account</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={adminTestForm.name} onChange={e => setAdminTestForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Name" style={{ padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13 }} />
                <input value={adminTestForm.email} onChange={e => setAdminTestForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="Email" type="email" style={{ padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13 }} />
                <input value={adminTestForm.password} onChange={e => setAdminTestForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Password" type="password" style={{ padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13 }} />
              </div>
              <button disabled={!adminTestForm.email || !adminTestForm.password || !adminTestForm.name}
                onClick={async () => {
                  try {
                    await adminCreateTestUser(adminTestForm.email, adminTestForm.password, adminTestForm.name);
                    setAdminTestForm({ email: "", password: "", name: "" });
                    loadAdminData();
                    alert("Test account created with Pro access.");
                  } catch (err) { alert("Error: " + err.message); }
                }}
                style={{ background: C.navy, color: C.white, border: "none", borderRadius: 8, padding: "8px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer",
                  opacity: (!adminTestForm.email || !adminTestForm.password || !adminTestForm.name) ? 0.4 : 1 }}>
                Create Test Account
              </button>
            </Card>

            {/* All Users Table */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: F.display, fontSize: 18 }}>All Users ({adminUsers.length})</div>
                <button onClick={loadAdminData} disabled={adminLoading}
                  style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                  {adminLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: F.body }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>
                      <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Name</th>
                      <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Email</th>
                      <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Institution</th>
                      <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Role</th>
                      <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Last Active</th>
                      <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Expires</th>
                      <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: `0.5px solid ${C.border}`, background: u.test_user ? C.goldLight : "none" }}>
                        <td style={{ padding: "10px" }}>
                          <div style={{ fontWeight: 600, color: C.navy }}>{u.name || "—"}</div>
                          {u.test_user && <span style={{ fontSize: 9, fontFamily: F.accent, fontWeight: 700, color: C.gold, background: C.goldLight, padding: "1px 6px", borderRadius: 4 }}>TEST</span>}
                        </td>
                        <td style={{ padding: "10px", color: C.muted }}>{u.email}</td>
                        <td style={{ padding: "10px", color: C.muted }}>{u.institution || "—"}</td>
                        <td style={{ padding: "10px" }}>
                          <select value={u.role} onChange={async (e) => {
                            try {
                              await adminUpdateUserRole(u.id, e.target.value, session.user.id);
                              setAdminUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: e.target.value } : x));
                            } catch (err) { alert("Error: " + err.message); }
                          }}
                            style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, padding: "3px 6px", borderRadius: 6, border: `1px solid ${C.border}`, color: ROLE_COLORS[u.role] || C.muted, background: C.white }}>
                            {["free", "pro", "institutional", "admin"].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "10px", fontSize: 11, color: C.muted }}>
                          {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}
                        </td>
                        <td style={{ padding: "10px", fontSize: 11, color: C.muted }}>
                          {u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={async () => {
                              const days = prompt("Extend subscription by how many days?", "30");
                              if (!days) return;
                              const base = u.subscription_expires_at ? new Date(u.subscription_expires_at) : new Date();
                              const exp = new Date(Math.max(base.getTime(), Date.now()) + parseInt(days) * 86400000);
                              try {
                                await adminSetSubscription(u.id, exp.toISOString());
                                setAdminUsers(prev => prev.map(x => x.id === u.id ? { ...x, subscription_expires_at: exp.toISOString() } : x));
                              } catch (err) { alert("Error: " + err.message); }
                            }}
                              style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, background: C.tealLight, color: C.teal, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                              Extend
                            </button>
                            {u.test_user && (
                              <button onClick={async () => {
                                if (confirm(`Reset all data for test user ${u.name}?`)) {
                                  try {
                                    await adminResetTestUser(u.id);
                                    alert("Test user data reset.");
                                  } catch (err) { alert("Error: " + err.message); }
                                }
                              }}
                                style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, background: C.roseLight, color: C.rose, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ── RESEARCH LIBRARY TAB ── */}
            <div style={{ marginTop: 20, marginBottom: 8 }}>
              <button onClick={() => { setAdminResearchTab(!adminResearchTab); if (!adminResearchTab) loadAdminResearch(); }}
                style={{ background: adminResearchTab ? C.navy : C.ivoryDark, color: adminResearchTab ? C.white : C.navy, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {adminResearchTab ? "Hide Research Library ↑" : "Research Library ↓"}
              </button>
            </div>

            {adminResearchTab && (
              <div>
                {/* Dimension counts */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 14 }}>Articles by Dimension</div>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 6 }}>
                    {adminDimCounts.map((d, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px", background: i % 2 === 0 ? C.ivory : C.white, borderRadius: 6, fontSize: 13 }}>
                        <span style={{ color: C.text }}>{d.dimension}</span>
                        <span style={{ fontFamily: F.accent, fontWeight: 700, color: C.tealBright }}>{d.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Actions row */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  <button onClick={async () => {
                    setAdminCrawlerLoading(true); setAdminCrawlerResult(null);
                    try {
                      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-crawler`;
                      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }, body: JSON.stringify({ source: "all" }) });
                      const data = await res.json();
                      setAdminCrawlerResult(data);
                      loadAdminResearch();
                    } catch (e) { setAdminCrawlerResult({ error: e.message }); }
                    setAdminCrawlerLoading(false);
                  }}
                    disabled={adminCrawlerLoading}
                    style={{ background: C.tealBright, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: adminCrawlerLoading ? "wait" : "pointer" }}>
                    {adminCrawlerLoading ? "Crawling..." : "Run Crawler Now"}
                  </button>
                  <button onClick={async () => {
                    setAdminEmbedResult(null);
                    try {
                      const data = await embedAllArticles();
                      setAdminEmbedResult(data);
                    } catch (e) { setAdminEmbedResult({ error: e.message }); }
                  }}
                    style={{ background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Generate Embeddings
                  </button>
                </div>

                {adminCrawlerResult && (
                  <Card style={{ marginBottom: 12, borderLeft: `4px solid ${adminCrawlerResult.error ? C.rose : C.sage}` }}>
                    <div style={{ fontSize: 13, fontFamily: F.accent, fontWeight: 700, color: adminCrawlerResult.error ? C.rose : C.sage }}>
                      {adminCrawlerResult.error ? `Error: ${adminCrawlerResult.error}` : adminCrawlerResult.message}
                    </div>
                    {adminCrawlerResult.errors && adminCrawlerResult.errors.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Insert errors (first 5 shown)</div>
                        {adminCrawlerResult.errors.slice(0, 5).map((err, i) => (
                          <div key={i} style={{ fontSize: 12, fontFamily: F.body, color: C.navy, background: "#fef2f2", borderRadius: 6, padding: "6px 10px", marginBottom: 4, lineHeight: 1.4 }}>{err}</div>
                        ))}
                        {adminCrawlerResult.errors.length > 5 && (
                          <div style={{ fontSize: 11, fontFamily: F.body, color: C.muted, fontStyle: "italic" }}>...and {adminCrawlerResult.errors.length - 5} more</div>
                        )}
                      </div>
                    )}
                  </Card>
                )}
                {adminEmbedResult && (
                  <Card style={{ marginBottom: 12, borderLeft: `4px solid ${adminEmbedResult.error ? C.rose : C.sage}` }}>
                    <div style={{ fontSize: 13, fontFamily: F.accent, fontWeight: 700, color: adminEmbedResult.error ? C.rose : C.sage }}>
                      {adminEmbedResult.error ? `Error: ${adminEmbedResult.error}` : adminEmbedResult.message}
                    </div>
                    {adminEmbedResult.errors && adminEmbedResult.errors.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Errors (first 5 shown)</div>
                        {adminEmbedResult.errors.slice(0, 5).map((err, i) => (
                          <div key={i} style={{ fontSize: 12, fontFamily: F.body, color: C.navy, background: "#fef2f2", borderRadius: 6, padding: "6px 10px", marginBottom: 4, lineHeight: 1.4 }}>{err}</div>
                        ))}
                        {adminEmbedResult.errors.length > 5 && (
                          <div style={{ fontSize: 11, fontFamily: F.body, color: C.muted, fontStyle: "italic" }}>...and {adminEmbedResult.errors.length - 5} more</div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {/* Add Article Form */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 12 }}>Add Article Manually</div>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <input value={adminArticleForm.title} onChange={e => setAdminArticleForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
                    <input value={adminArticleForm.authors} onChange={e => setAdminArticleForm(p => ({ ...p, authors: e.target.value }))} placeholder="Authors" style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
                    <input value={adminArticleForm.year} onChange={e => setAdminArticleForm(p => ({ ...p, year: e.target.value }))} placeholder="Year" type="number" style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
                    <input value={adminArticleForm.journal} onChange={e => setAdminArticleForm(p => ({ ...p, journal: e.target.value }))} placeholder="Journal" style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
                    <select value={adminArticleForm.dimension} onChange={e => setAdminArticleForm(p => ({ ...p, dimension: e.target.value }))} style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }}>
                      {["Active Learning","Pedagogy","Experiential Learning","Kagan Structures","Problem-Based Learning","Project-Based Learning","Teamwork & Group Projects","Andragogy","Action Research","Universal Design for Learning","Socratic Seminar","Flipped Classroom","Metacognition","Feedback Quality","Student Wellbeing","Faculty Development","Bloom's Taxonomy","Case Studies","Reflective Practice","Community of Inquiry","Trauma-Informed Teaching"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input value={adminArticleForm.search_terms} onChange={e => setAdminArticleForm(p => ({ ...p, search_terms: e.target.value }))} placeholder="Search terms (comma-separated)" style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <textarea value={adminArticleForm.abstract} onChange={e => setAdminArticleForm(p => ({ ...p, abstract: e.target.value }))} placeholder="Abstract" rows={3} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box", marginBottom: 10 }} />
                  <button onClick={async () => {
                    const f = adminArticleForm;
                    if (!f.title || !f.authors) return;
                    try {
                      const { error } = await supabase.from("research_articles").insert({
                        title: f.title, authors: f.authors, year: parseInt(f.year) || new Date().getFullYear(),
                        journal: f.journal || null, abstract: f.abstract || null, content: f.content || null,
                        dimension: f.dimension,
                        search_terms: f.search_terms ? f.search_terms.split(",").map(s => s.trim().toLowerCase()) : [],
                      });
                      if (error) throw error;
                      setAdminArticleForm({ title: "", authors: "", year: "", journal: "", abstract: "", content: "", dimension: "Active Learning", search_terms: "" });
                      loadAdminResearch();
                    } catch (e) { console.error(e); }
                  }}
                    style={{ background: C.sage, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Add Article
                  </button>
                </Card>

                {/* Recent articles */}
                <Card>
                  <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 14 }}>Recent Articles ({adminArticles.length})</div>
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {adminArticles.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: `0.5px solid ${C.border}`, gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{a.authors} ({a.year}) — {a.dimension} {!a.embedding ? "⚠ No embedding" : ""}</div>
                        </div>
                        <button onClick={async () => {
                          if (!confirm("Delete this article?")) return;
                          await supabase.from("research_articles").delete().eq("id", a.id);
                          loadAdminResearch();
                        }}
                          style={{ background: "none", border: "none", color: C.rose, fontSize: 14, cursor: "pointer", padding: "2px 6px", flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
            {/* ── BETA AGREEMENTS TAB ── */}
            <div style={{ marginTop: 20, marginBottom: 8 }}>
              <button onClick={() => { setAdminBetaTab(!adminBetaTab); if (!adminBetaTab) loadAdminBeta(); }}
                style={{ background: adminBetaTab ? C.navy : C.ivoryDark, color: adminBetaTab ? C.white : C.navy, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {adminBetaTab ? "Hide Beta Agreements ↑" : "Beta Agreements ↓"}
              </button>
            </div>

            {adminBetaTab && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontFamily: F.display, fontSize: 18 }}>{adminBetaAgreements.length} agreement{adminBetaAgreements.length !== 1 ? "s" : ""} signed</div>
                  <button onClick={loadAdminBeta}
                    style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.teal, background: "none", border: `1px solid ${C.teal}44`, borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                    Refresh
                  </button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: F.body }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>
                        <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Name</th>
                        <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Email</th>
                        <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Job Title</th>
                        <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Institution</th>
                        <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Signature</th>
                        <th style={{ padding: "8px 10px", fontFamily: F.accent, fontWeight: 700, color: C.muted, fontSize: 11 }}>Date Signed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminBetaAgreements.map(a => (
                        <tr key={a.id} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                          <td style={{ padding: "8px 10px", fontWeight: 600 }}>{a.full_name}</td>
                          <td style={{ padding: "8px 10px", color: C.teal }}>{a.email}</td>
                          <td style={{ padding: "8px 10px", color: C.muted }}>{a.job_title || "—"}</td>
                          <td style={{ padding: "8px 10px", color: C.muted }}>{a.institution || "—"}</td>
                          <td style={{ padding: "8px 10px", fontStyle: "italic", fontFamily: "'Georgia', serif" }}>{a.digital_signature}</td>
                          <td style={{ padding: "8px 10px", color: C.muted }}>{new Date(a.signed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        </tr>
                      ))}
                      {adminBetaAgreements.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: C.muted }}>No agreements yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
          );
        })()}

        {/* ── PRICING ── */}
        {page === "Guide" && <GuidePage />}

        {page === "Pricing" && !gatedPageIds.has("Pricing") && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 32, marginBottom: 6 }}>Simple, transparent pricing.</div>
              <div style={{ color: C.muted, fontSize: 15 }}>Start free. Grow with your practice. Scale with your institution.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
              {[
                {
                  key: "free", name: "Free", sub: "The Signal", price: "$0", period: "forever", color: C.muted,
                  features: ["1 course", "Health scores (coming soon)", "2 micro-learnings/month", "Post-class notes & announcements", "Think Tank (read only)", "Career Connections (1 role preview)"],
                  locked: ["Assignment Builder", "Slide Studio", "Full Career Connections + share cards", "Historical trending", "Full upload suite", "Accreditation reports ⸱ Coming Soon"],
                  cta: "Get Started Free",
                },
                {
                  key: "pro", name: "Pro", sub: "The Practice", price: "$15", period: "/month per faculty", color: C.tealBright, featured: true,
                  features: ["All courses", "Full trending — week, class & term", "All 10 health dimensions", "Assignment Builder with AI feedback", "Slide Studio with UDL analysis", "Full Career Connections + student share cards", "Full upload suite (6 categories)", "Full micro-learning library with citations", "Learning Outcome Alignment", "Metacognitive & UDL tracking", "Wellbeing & Student Voice signals", "Think Tank — full participation", "Self-generated reports"],
                  locked: ["Institutional dashboard", "Aggregated analytics", "NECHE/HLC/SACSCOC export templates"],
                  cta: "Start Free Trial",
                },
                {
                  key: "institutional", name: "Institutional", sub: "The Standard", price: "Custom", period: "per-seat licensing", color: C.navy,
                  features: ["Everything in Pro for all faculty", "Aggregated institutional dashboard", "Anonymized cross-faculty analytics", "Full accreditation report export (NECHE, HLC, SACSCOC) ⸱ Coming Soon", "Career Connections workforce alignment doc", "New faculty onboarding track", "Peer institution benchmarking", "LMS integration support", "Custom branding", "Dedicated success manager"],
                  locked: [],
                  cta: "Contact Us",
                },
              ].map((p, i) => (
                <div key={i} style={{ background: C.white, border: p.featured ? `2px solid ${C.tealBright}` : `0.5px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", position: "relative" }}>
                  {p.featured && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.white, background: C.tealBright, padding: "3px 16px", borderRadius: 20, whiteSpace: "nowrap" }}>Most Popular</div>
                  )}
                  <div style={{ fontFamily: F.display, fontSize: 22, color: p.color, marginBottom: 2, marginTop: p.featured ? 8 : 0 }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontStyle: "italic", color: C.muted, marginBottom: 14 }}>{p.sub}</div>
                  <div style={{ fontFamily: F.display, fontSize: 32, color: C.navy, marginBottom: 2 }}>{p.price}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>{p.period}</div>
                  <div style={{ flex: 1, marginBottom: 18 }}>
                    {p.features.map((f, j) => <div key={j} style={{ fontSize: 12, color: C.text, padding: "3px 0", display: "flex", gap: 8 }}><span style={{ color: C.sage, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}</div>)}
                    {p.locked.map((f, j) => <div key={j} style={{ fontSize: 12, color: C.lock, padding: "3px 0", display: "flex", gap: 8 }}><span style={{ flexShrink: 0 }}>🔒</span>{f}</div>)}
                  </div>
                  <button onClick={() => { setTier(p.key); setPage("Dashboard"); }}
                    style={{ background: p.featured ? C.tealBright : p.key === "institutional" ? C.navy : C.ivoryDark, color: p.key === "free" ? C.navy : C.white, border: "none", borderRadius: 10, padding: "11px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ background: C.ivoryDark, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "1.5rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Institutional accreditation reporting — coming Winter 2026–2027</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>Built for provosts, deans, and academic affairs leadership. Be first to know when it launches.</div>
              <NotifyMeForm
                headline="Join the institutional waitlist."
                subhead="We'll email you the moment accreditation reports launch."
                source="accreditation_waitlist"
              />
            </div>
          </div>
        )}

      </div>

      {/* ── ONBOARDING TOUR ── */}
      {showOnboardingTour && (
        <OnboardingTour
          onComplete={async () => {
            setShowOnboardingTour(false);
            if (session?.user) {
              try {
                await upsertProfile(session.user.id, { ...profile, onboarding_complete: true, email: session.user.email });
                setProfile(prev => prev ? { ...prev, onboarding_complete: true } : prev);
              } catch (e) { console.error("Failed to save onboarding_complete:", e); }
            }
          }}
          onGoToProfile={() => { setPage("Settings"); setSettingsProfileForm(null); }}
        />
      )}

      {/* ── MEDITATION AUDIO MODAL ── */}
      {breathingOpen && (() => {
        const m = breathingOpen;
        const totalSeconds = (m.inhale + m.hold + m.exhale) * m.rounds;
        const cycleSeconds = m.inhale + m.hold + m.exhale;

        const MeditationPlayer = () => {
          // Text-only breathing fallback state
          const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
          const [phase, setPhase] = useState("in");
          const [cyclePos, setCyclePos] = useState(0);

          // Audio state
          const audioRef = useRef(null);
          const [audioReady, setAudioReady] = useState(false);
          const [audioFailed, setAudioFailed] = useState(false);
          const [isPlaying, setIsPlaying] = useState(false);
          const [audioCurrentTime, setAudioCurrentTime] = useState(0);
          const [audioDuration, setAudioDuration] = useState(0);
          const [audioComplete, setAudioComplete] = useState(false);
          const hasAudio = !!m.audioUrl;

          // Text-only breathing timer (fallback when audio fails or no audioUrl)
          useEffect(() => {
            if (hasAudio && !audioFailed) return; // audio path handles its own state
            if (secondsLeft <= 0) return;
            const timer = setInterval(() => {
              setSecondsLeft(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
              });
              setCyclePos(prev => {
                const next = (prev + 1) % cycleSeconds;
                if (next < m.inhale) setPhase("in");
                else if (next < m.inhale + m.hold) setPhase("hold");
                else setPhase("out");
                return next;
              });
            }, 1000);
            return () => clearInterval(timer);
          }, [audioFailed]);

          // Audio setup + cleanup
          useEffect(() => {
            if (!hasAudio) return;
            const audio = new Audio(m.audioUrl);
            audioRef.current = audio;

            const onLoaded = () => {
              setAudioReady(true);
              setAudioDuration(audio.duration);
              audio.play().then(() => setIsPlaying(true)).catch(() => {
                console.warn("KlasUp: Auto-play blocked, user must tap play");
              });
            };
            const onError = () => {
              console.warn("KlasUp: Audio failed to load for", m.title);
              setAudioFailed(true);
            };
            const onTimeUpdate = () => setAudioCurrentTime(audio.currentTime);
            const onEnded = () => { setIsPlaying(false); setAudioComplete(true); };

            audio.addEventListener("loadedmetadata", onLoaded);
            audio.addEventListener("error", onError);
            audio.addEventListener("timeupdate", onTimeUpdate);
            audio.addEventListener("ended", onEnded);

            return () => {
              audio.pause();
              audio.removeEventListener("loadedmetadata", onLoaded);
              audio.removeEventListener("error", onError);
              audio.removeEventListener("timeupdate", onTimeUpdate);
              audio.removeEventListener("ended", onEnded);
              audio.src = "";
              audioRef.current = null;
            };
          }, []);

          const handleClose = () => {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
            setBreathingOpen(null);
          };

          const togglePlayPause = () => {
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
            else { audio.pause(); setIsPlaying(false); }
          };

          const handleScrub = (e) => {
            const audio = audioRef.current;
            if (!audio || !audioDuration) return;
            const val = parseFloat(e.target.value);
            audio.currentTime = val;
            setAudioCurrentTime(val);
          };

          const fmtTime = (t) => {
            const mn = Math.floor(t / 60);
            const sc = Math.floor(t % 60);
            return `${mn}:${sc.toString().padStart(2, "0")}`;
          };

          const breathDone = secondsLeft <= 0;
          const showAudio = hasAudio && audioReady && !audioFailed;
          const fallbackMode = !hasAudio || audioFailed;
          const done = audioComplete || (fallbackMode && breathDone);
          const scrubberPct = audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0;
          const scrubberTrackBg = `linear-gradient(to right, #2A9D8F ${scrubberPct}%, rgba(255,255,255,0.15) ${scrubberPct}%)`;

          // Fallback breathing text
          const circleScale = phase === "in" ? 1.4 : phase === "hold" ? 1.4 : 0.85;
          const phaseText = phase === "in" ? "Breathe in..." : phase === "hold" ? "Hold..." : "Breathe out...";
          const mins = Math.floor(secondsLeft / 60);
          const secs = secondsLeft % 60;

          return (
            <div style={{
              position: "fixed", inset: 0, zIndex: 10000,
              background: "rgba(15,31,61,0.95)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", padding: 24,
            }}>
              {/* Scrubber CSS */}
              <style>{`
                .klasup-scrubber { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
                .klasup-scrubber::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #2A9D8F; border: 2px solid rgba(255,255,255,0.3); cursor: pointer; margin-top: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
                .klasup-scrubber::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #2A9D8F; border: 2px solid rgba(255,255,255,0.3); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
                .klasup-scrubber::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; }
                .klasup-scrubber::-moz-range-track { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.15); }
              `}</style>

              {/* Back button — top left */}
              <button onClick={handleClose}
                style={{
                  position: "absolute", top: 20, left: 20,
                  background: "none", border: "none", color: "rgba(255,255,255,0.5)",
                  fontFamily: F.accent, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 4px",
                }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>&larr;</span> Back
              </button>

              {/* Title + duration */}
              <div style={{ fontFamily: F.display, fontSize: mob ? 20 : 26, color: C.white, marginBottom: 6, textAlign: "center" }}>{m.title}</div>
              <div style={{ fontSize: 13, color: C.tealMid, marginBottom: done ? 40 : 60, fontFamily: F.accent, fontWeight: 600 }}>
                {showAudio ? fmtTime(audioDuration) : m.duration}
              </div>

              {/* ── AUDIO PATH (primary) ── */}
              {showAudio && !done && (
                <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Large play/pause */}
                  <button onClick={togglePlayPause}
                    style={{
                      width: 72, height: 72, borderRadius: "50%",
                      border: "2px solid rgba(42,157,143,0.4)",
                      background: "rgba(42,157,143,0.15)", color: C.white, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, marginBottom: 32, flexShrink: 0,
                      transition: "background 0.2s",
                    }}>
                    {isPlaying ? "⏸" : "▶"}
                  </button>

                  {/* Scrubber + times */}
                  <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: F.accent, fontSize: 12, color: "rgba(255,255,255,0.6)", minWidth: 38, textAlign: "right" }}>
                      {fmtTime(audioCurrentTime)}
                    </span>
                    <input
                      type="range" min={0} max={audioDuration || 0} step={0.5} value={audioCurrentTime}
                      onChange={handleScrub}
                      className="klasup-scrubber"
                      style={{ flex: 1, background: scrubberTrackBg }}
                    />
                    <span style={{ fontFamily: F.accent, fontSize: 12, color: "rgba(255,255,255,0.6)", minWidth: 38 }}>
                      {fmtTime(audioDuration)}
                    </span>
                  </div>
                </div>
              )}

              {/* ── AUDIO LOADING STATE ── */}
              {hasAudio && !audioReady && !audioFailed && !done && (
                <div style={{ fontFamily: F.accent, fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
                  Loading audio...
                </div>
              )}

              {/* ── TEXT FALLBACK PATH (no audio or audio failed) ── */}
              {fallbackMode && !done && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {audioFailed && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16, fontFamily: F.accent }}>
                      Audio unavailable — follow the breathing guide below
                    </div>
                  )}
                  <div style={{
                    width: mob ? 160 : 200, height: mob ? 160 : 200, borderRadius: "50%",
                    background: `radial-gradient(circle, ${C.sage}44 0%, ${C.sage}11 70%, transparent 100%)`,
                    border: `3px solid ${C.sage}88`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transform: `scale(${circleScale})`,
                    transition: phase === "in" ? `transform ${m.inhale}s ease-in-out` : phase === "hold" ? "none" : `transform ${m.exhale}s ease-in-out`,
                    marginBottom: 24,
                  }}>
                    <div style={{ fontFamily: F.display, fontSize: 18, color: C.white, textAlign: "center" }}>
                      {phaseText}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 16 }}>
                    In for {m.inhale}s · Hold for {m.hold}s · Out for {m.exhale}s
                  </div>
                  <div style={{ fontFamily: F.accent, fontSize: 28, fontWeight: 700, color: C.tealMid, marginBottom: 24 }}>
                    {`${mins}:${secs.toString().padStart(2, "0")}`}
                  </div>
                </div>
              )}

              {/* ── DONE STATE ── */}
              {done && (
                <div style={{ fontFamily: F.display, fontSize: 22, color: C.sage, marginBottom: 40, textAlign: "center" }}>
                  Session complete 🌿
                </div>
              )}

              {/* End Session / Close */}
              <button onClick={handleClose}
                style={{
                  background: done ? "rgba(42,157,143,0.2)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${done ? "rgba(42,157,143,0.3)" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: 10, padding: "10px 28px",
                  fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                  color: C.white, cursor: "pointer", minHeight: 44,
                  marginTop: showAudio && !done ? 32 : 0,
                }}>
                {done ? "Close" : "End Session"}
              </button>
            </div>
          );
        };

        return <MeditationPlayer />;
      })()}

      {/* ── STANDALONE BREATHING EXERCISE MODAL ── */}
      {breathExerciseOpen && (() => {
        const PATTERNS = [
          { id: "box", label: "Box", inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
          { id: "coherent", label: "Coherent", inhale: 5, hold: 0, exhale: 5, holdAfter: 0 },
          { id: "extended", label: "Extended Exhale", inhale: 4, hold: 0, exhale: 6, holdAfter: 0 },
        ];
        const DURATIONS = [1, 3, 5, 10];

        const BreathExercise = () => {
          const [step, setStep] = useState("settings"); // "settings" | "active"
          const [patternId, setPatternId] = useState(breathExerciseOpen.pattern || "box");
          const [durationMin, setDurationMin] = useState(breathExerciseOpen.minutes || 3);

          // Active session state
          const [secondsLeft, setSecondsLeft] = useState(0);
          const [phase, setPhase] = useState("in");
          const [cyclePos, setCyclePos] = useState(0);
          const [done, setDone] = useState(false);
          const audioCtxRef = useRef(null);

          const pattern = PATTERNS.find(p => p.id === patternId);
          const cycleSeconds = pattern.inhale + pattern.hold + pattern.exhale + pattern.holdAfter;

          // Chime: soft sine wave tone via Web Audio API
          const playChime = useCallback((freq = 396, duration = 0.18) => {
            try {
              if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
              const ctx = audioCtxRef.current;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.value = freq;
              gain.gain.setValueAtTime(0, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.03);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + duration);
            } catch (e) { /* Web Audio not available — silent fallback */ }
          }, []);

          const startSession = () => {
            setSecondsLeft(durationMin * 60);
            setPhase("in");
            setCyclePos(0);
            setDone(false);
            setStep("active");
            playChime(528, 0.2); // initial inhale chime
          };

          // Session timer
          useEffect(() => {
            if (step !== "active" || done) return;
            if (secondsLeft <= 0) { setDone(true); return; }

            const timer = setInterval(() => {
              setSecondsLeft(prev => {
                if (prev <= 1) { clearInterval(timer); setDone(true); return 0; }
                return prev - 1;
              });
              setCyclePos(prev => {
                const next = (prev + 1) % cycleSeconds;
                // Determine phase and play chimes at transitions
                let newPhase;
                if (next < pattern.inhale) {
                  newPhase = "in";
                } else if (pattern.hold > 0 && next < pattern.inhale + pattern.hold) {
                  newPhase = "hold";
                } else if (next < pattern.inhale + pattern.hold + pattern.exhale) {
                  newPhase = "out";
                } else {
                  newPhase = "holdAfter";
                }
                if (next === 0) playChime(528, 0.2); // inhale start — higher tone
                else if (next === pattern.inhale) playChime(396, 0.15); // hold/exhale transition
                else if (next === pattern.inhale + pattern.hold) playChime(330, 0.2); // exhale start — lower tone
                else if (pattern.holdAfter > 0 && next === pattern.inhale + pattern.hold + pattern.exhale) playChime(396, 0.15);
                setPhase(newPhase);
                return next;
              });
            }, 1000);
            return () => clearInterval(timer);
          }, [step, done]);

          const handleClose = () => {
            if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch(e) {} audioCtxRef.current = null; }
            setBreathExerciseOpen(null);
          };

          const mins = Math.floor(secondsLeft / 60);
          const secs = secondsLeft % 60;
          const circleScale = phase === "in" ? 1.4 : (phase === "hold" || phase === "holdAfter") ? 1.4 : 0.85;
          const phaseLabel = phase === "in" ? "Breathe in..." : phase === "hold" ? "Hold..." : phase === "out" ? "Breathe out..." : "Hold...";

          const pillStyle = (active) => ({
            padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${active ? "#2A9D8F" : "rgba(255,255,255,0.15)"}`,
            background: active ? "rgba(42,157,143,0.2)" : "transparent",
            color: active ? "#2A9D8F" : "rgba(255,255,255,0.6)",
            fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "all 0.2s",
          });

          return (
            <div style={{
              position: "fixed", inset: 0, zIndex: 10000,
              background: "rgba(15,31,61,0.95)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", padding: 24,
            }}>
              {/* Back button — top left */}
              <button onClick={handleClose}
                style={{
                  position: "absolute", top: 20, left: 20,
                  background: "none", border: "none", color: "rgba(255,255,255,0.5)",
                  fontFamily: F.accent, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 4px",
                }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>&larr;</span> Back
              </button>

              <div style={{ fontFamily: F.display, fontSize: mob ? 20 : 26, color: C.white, marginBottom: 6, marginTop: 40 }}>Breathing Exercise</div>

              {/* ── SETTINGS STEP ── */}
              {step === "settings" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24, width: "100%", maxWidth: 360 }}>
                  {/* Pattern picker */}
                  <div style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Pattern</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
                    {PATTERNS.map(p => (
                      <button key={p.id} onClick={() => setPatternId(p.id)} style={pillStyle(patternId === p.id)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {/* Pattern description */}
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 28, lineHeight: 1.5 }}>
                    {pattern.hold > 0
                      ? `In ${pattern.inhale}s · Hold ${pattern.hold}s · Out ${pattern.exhale}s · Hold ${pattern.holdAfter}s`
                      : `In ${pattern.inhale}s · Out ${pattern.exhale}s`
                    }
                  </div>

                  {/* Duration picker */}
                  <div style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Duration</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => setDurationMin(d)} style={pillStyle(durationMin === d)}>
                        {d} min
                      </button>
                    ))}
                  </div>

                  <button onClick={startSession}
                    style={{
                      background: "#2A9D8F", color: "#FAF7F2", border: "none", borderRadius: 12,
                      padding: "12px 36px", fontFamily: F.accent, fontWeight: 700, fontSize: 15,
                      cursor: "pointer", minHeight: 44,
                    }}>
                    Begin
                  </button>
                </div>
              )}

              {/* ── ACTIVE SESSION ── */}
              {step === "active" && !done && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 16 }}>
                  {/* Breathing circle — wrapper adds padding so scale(1.4) doesn't overlap */}
                  <div style={{ padding: mob ? 30 : 40, marginBottom: 8 }}>
                    <div style={{
                      width: mob ? 150 : 180, height: mob ? 150 : 180, borderRadius: "50%",
                      background: `radial-gradient(circle, #2A9D8F44 0%, #2A9D8F11 70%, transparent 100%)`,
                      border: "3px solid rgba(42,157,143,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: `scale(${circleScale})`,
                      transition: phase === "in" ? `transform ${pattern.inhale}s ease-in-out` : (phase === "hold" || phase === "holdAfter") ? "none" : `transform ${pattern.exhale}s ease-in-out`,
                    }}>
                      <div style={{ fontFamily: F.display, fontSize: 18, color: C.white, textAlign: "center" }}>
                        {phaseLabel}
                      </div>
                    </div>
                  </div>

                  {/* Pattern info */}
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 12 }}>
                    {pattern.hold > 0
                      ? `In ${pattern.inhale}s · Hold ${pattern.hold}s · Out ${pattern.exhale}s · Hold ${pattern.holdAfter}s`
                      : `In ${pattern.inhale}s · Out ${pattern.exhale}s`
                    }
                  </div>

                  {/* Countdown */}
                  <div style={{ fontFamily: F.accent, fontSize: 28, fontWeight: 700, color: "#2A9D8F", marginBottom: 24 }}>
                    {`${mins}:${secs.toString().padStart(2, "0")}`}
                  </div>

                  <button onClick={handleClose}
                    style={{
                      background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 10, padding: "10px 28px",
                      fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                      color: C.white, cursor: "pointer", minHeight: 44,
                    }}>
                    End Session
                  </button>
                </div>
              )}

              {/* ── DONE STATE ── */}
              {step === "active" && done && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
                  <div style={{
                    width: mob ? 160 : 200, height: mob ? 160 : 200, borderRadius: "50%",
                    background: `radial-gradient(circle, #2A9D8F33 0%, #2A9D8F11 70%, transparent 100%)`,
                    border: "3px solid rgba(42,157,143,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 32,
                  }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: C.white, textAlign: "center" }}>
                      Session complete 🌿
                    </div>
                  </div>
                  <button onClick={handleClose}
                    style={{
                      background: "rgba(42,157,143,0.2)", border: "1px solid rgba(42,157,143,0.3)",
                      borderRadius: 10, padding: "10px 28px",
                      fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                      color: C.white, cursor: "pointer", minHeight: 44,
                    }}>
                    Close
                  </button>
                </div>
              )}
            </div>
          );
        };

        return <BreathExercise />;
      })()}

      {/* ── SAGE FLOATING CHAT ── */}

      {/* Floating bubble */}
      {!sageOpen && (
        <button onClick={openSage} title="Chat with Klas"
          style={{
            position: "fixed", bottom: mob ? 16 : 24, right: mob ? 16 : 24, width: 90, height: 90, borderRadius: "50%",
            background: C.navy, color: C.white, border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
            boxShadow: "0 4px 16px rgba(90,138,98,0.35)", zIndex: 9000,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(90,138,98,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(90,138,98,0.35)"; }}
        >
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.8))" }}><circle cx="24" cy="17" r="13" fill="white"/><rect x="17.5" y="25" width="13" height="5" rx="1.5" fill="white"/><rect x="19" y="29.5" width="10" height="3" rx="1" fill="rgba(255,255,255,0.8)"/><rect x="18" y="32" width="12" height="3.5" rx=".8" fill="white"/><rect x="19" y="36" width="10" height="3.5" rx=".8" fill="rgba(90,138,98,0.7)"/><rect x="20" y="40" width="8" height="3.5" rx="1" fill="white"/><rect x="21" y="9.5" width="2.8" height="14" rx="1.4" fill="#5A8A62"/><line x1="24" y1="17" x2="30" y2="9.5" stroke="#5A8A62" strokeWidth="2.8" strokeLinecap="round"/><line x1="24" y1="17" x2="30.5" y2="24" stroke="#5A8A62" strokeWidth="2.8" strokeLinecap="round"/></svg>
          <span style={{ fontFamily: F.display, fontSize: 18, lineHeight: 1, color: C.white }}>Klas</span>
        </button>
      )}

      {/* Chat panel */}
      {sageOpen && (
        <div style={{
          position: "fixed",
          bottom: mob ? 0 : 24, right: mob ? 0 : 24,
          width: mob ? "95vw" : (klasExpanded ? 520 : 320),
          height: mob ? (klasExpanded ? "90vh" : "70vh") : (klasExpanded ? 680 : 480),
          maxHeight: mob ? (klasExpanded ? "calc(100vh - 10px)" : "calc(100vh - 20px)") : (klasExpanded ? 680 : 480),
          left: mob ? "2.5vw" : "auto",
          background: C.white, borderRadius: mob ? "16px 16px 0 0" : 16, boxShadow: "0 8px 40px rgba(15,31,61,0.18)",
          display: "flex", flexDirection: "column", zIndex: 9001, overflow: "hidden",
          animation: "sageSlideUp 0.25s ease-out",
          transition: "width 0.3s ease, height 0.3s ease, max-height 0.3s ease",
        }}>
          {/* Header */}
          <div style={{ background: C.sage, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 18, color: C.white }}>Klas</div>
              <div style={{ fontFamily: F.body, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>Your instructional design partner</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => setKlasExpanded(e => !e)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 28, height: 28, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                {klasExpanded ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="9,1 13,1 13,5" /><line x1="13" y1="1" x2="8" y2="6" />
                    <polyline points="5,13 1,13 1,9" /><line x1="1" y1="13" x2="6" y2="8" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="9,5 13,5 13,1" /><line x1="13" y1="5" x2="8" y2="0" />
                    <polyline points="5,9 1,9 1,13" /><line x1="1" y1="9" x2="6" y2="14" />
                  </svg>
                )}
              </button>
              <button onClick={() => setSageClearConfirm(true)} title="Start new chat"
                style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 28, height: 28, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 7a6 6 0 0 1 10.5-4" /><polyline points="11.5,1 11.5,3.5 9,3.5" />
                  <path d="M13 7a6 6 0 0 1-10.5 4" /><polyline points="2.5,13 2.5,10.5 5,10.5" />
                </svg>
              </button>
              <button onClick={() => { setKlasOptions({ options: [], multiSelect: false, questionType: null, promoted: [] }); setKlasSelected([]); setKlasOtherMode(null); setSageOpen(false); }}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 28, height: 28, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                ─
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
            ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
            {sageMessages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? C.tealBright : C.sageLight,
                color: m.role === "user" ? C.white : C.text,
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "10px 14px", fontSize: 13, fontFamily: F.body, lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            ))}
            {sageSending && (
              <div style={{ alignSelf: "flex-start", maxWidth: "85%", background: C.sageLight, borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 13, fontFamily: F.body, color: C.muted }}>
                <span style={{ animation: "sageDots 1.2s infinite" }}>Thinking...</span>
              </div>
            )}
          </div>

          {/* Quick-reply pills / checkboxes */}
          {klasOptions.options && klasOptions.options.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 10px 4px", flexShrink: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {klasOptions.options.map(opt => {
                  const isSelected = klasSelected.includes(opt);
                  const isOther = opt === "Other";
                  const isPromoted = klasOptions.promoted && klasOptions.promoted.includes(opt);
                  if (klasOptions.multiSelect && !isOther) {
                    // Checkbox style
                    return (
                      <button key={opt} onClick={() => handleQuickReply(opt)}
                        style={{
                          background: isSelected ? "#2A9D8F" : "#fff",
                          color: isSelected ? "#fff" : C.text,
                          border: isSelected ? "2px solid #2A9D8F" : "2px solid #D0D0D0",
                          borderRadius: 16, padding: "5px 12px",
                          fontFamily: F.body, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: 4,
                          boxShadow: isSelected ? "0 2px 6px rgba(42,157,143,0.3)" : "none",
                        }}>
                        <span style={{ fontSize: 11, width: 14, textAlign: "center" }}>{isSelected ? "\u2713" : "\u25CB"}</span>
                        {isPromoted && <span style={{ color: isSelected ? "#fff" : "#2A9D8F", fontSize: 10, lineHeight: 1 }}>&#9733;</span>}
                        {opt}
                      </button>
                    );
                  }
                  // Single-select pill or "Other"
                  return (
                    <button key={opt} onClick={() => handleQuickReply(opt)}
                      style={{
                        background: isOther ? "#E8E8E8" : "#2A9D8F",
                        color: isOther ? C.text : "#fff",
                        border: "none", borderRadius: 16, padding: "5px 12px",
                        fontFamily: F.body, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "opacity 0.15s",
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {isPromoted && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>&#9733;</span>}
                      {opt}
                    </button>
                  );
                })}
              </div>
              {klasOptions.multiSelect && klasSelected.length > 0 && (
                <button onClick={handleMultiSelectSend}
                  style={{
                    marginTop: 8, background: "#2A9D8F", color: "#fff",
                    border: "none", borderRadius: 10, padding: "6px 16px",
                    fontFamily: F.accent, fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                  }}>
                  Send
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div style={{ borderTop: klasOptions.options && klasOptions.options.length > 0 ? "none" : `1px solid ${C.border}`, padding: 10, display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea ref={sageTextareaRef} value={sageInput} onChange={e => setSageInput(e.target.value)}
                placeholder="Type your response or choose an option above..."
                rows={2}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSageSend(); } }}
                style={{
                  width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 36px 8px 10px",
                  fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box",
                  background: C.ivory, lineHeight: 1.5,
                }}
                onFocus={e => e.target.style.borderColor = C.sage}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <VoiceMic onTranscript={t => setSageInput(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 6, bottom: 6 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
              <button onClick={handleSageSend} disabled={!sageInput.trim() || sageSending}
                style={{
                  background: C.sage, color: C.white, border: "none", borderRadius: 10,
                  padding: "8px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12,
                  cursor: !sageInput.trim() || sageSending ? "default" : "pointer",
                  opacity: !sageInput.trim() ? 0.5 : 1,
                }}>
                Send
              </button>
              <FileUploadLink onText={t => setSageInput(p => p ? p + "\n" + t : t)} label="upload ↑" />
            </div>
          </div>

          {/* Clear chat confirmation overlay */}
          {sageClearConfirm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9200 }}>
              <div style={{ background: C.white, borderRadius: 14, padding: "24px 22px", width: 260, textAlign: "center", boxShadow: "0 4px 20px rgba(15,31,61,0.15)" }}>
                <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 15, color: C.navy, marginBottom: 8 }}>Start a new chat?</div>
                <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.5 }}>The current conversation will be cleared from your view.</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => setSageClearConfirm(false)}
                    style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={() => {
                    setSageMessages([{ role: "assistant", content: sageGreeting() }]);
                    setKlasOptions({ options: [], multiSelect: false, questionType: null, promoted: [] });
                    setKlasSelected([]);
                    setKlasOtherMode(null);
                    setSageInput("");
                    setKlasCore4({ subject: "", level: "", building: "", format: "", goal: "" });
                    setKlasConversationId(null);
                    setSageClearConfirm(false);
                  }}
                    style={{ background: C.sage, color: C.white, border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Yes, clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KLAS MODE 2 FULL-SCREEN MODAL ── */}
      {klasMode2Open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.55)", backdropFilter: "blur(4px)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: "85vw", height: "85vh", background: C.white, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column", boxShadow: "0 16px 64px rgba(15,31,61,0.25)",
            animation: "sageSlideUp 0.25s ease-out",
          }}>
            {/* SECTION A — Header */}
            <div style={{
              background: "#2A9D8F", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0, minHeight: 64, boxSizing: "border-box",
            }}>
              <div>
                <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 18, color: C.white }}>Klas</div>
                <div style={{ fontFamily: F.body, fontSize: 12, color: "rgba(255,255,255,0.9)" }}>Focused brainstorming</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSageClearConfirm(true)} title="Clear chat"
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", color: C.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ↻
                </button>
                <button title="Minimize" onClick={() => { if (klasConversationId) updateKlasConversation(klasConversationId, { messages: sageMessages, message_count: sageMessages.length, core_4_context: klasCore4Ref.current }); setKlasMode2Open(false); setSageOpen(true); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", color: C.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ↘
                </button>
                <button onClick={() => { if (klasConversationId) updateKlasConversation(klasConversationId, { messages: sageMessages, message_count: sageMessages.length, core_4_context: klasCore4Ref.current }); setKlasMode2Open(false); setSageOpen(true); }} title="Close"
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", color: C.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </button>
              </div>
            </div>

            {/* SECTION B — Body */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Left column — conversation */}
              <div style={{ flex: 1.5, display: "flex", flexDirection: "column", borderRight: "0.5px solid #eef1f5" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}
                  ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
                  {sageMessages.map((m, i) => (
                    <div key={i} style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      background: m.role === "user" ? C.tealBright : C.sageLight,
                      color: m.role === "user" ? C.white : C.text,
                      borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      padding: "10px 14px", fontSize: 13, fontFamily: F.body, lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }}>
                      {m.content}
                    </div>
                  ))}
                  {sageSending && (
                    <div style={{ alignSelf: "flex-start", maxWidth: "85%", background: C.sageLight, borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 13, fontFamily: F.body, color: C.muted }}>
                      <span style={{ animation: "sageDots 1.2s infinite" }}>Thinking...</span>
                    </div>
                  )}
                </div>

                {/* Quick-reply pills / checkboxes */}
                {klasOptions.options && klasOptions.options.length > 0 && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 14px 4px", flexShrink: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {klasOptions.options.map(opt => {
                        const isSelected = klasSelected.includes(opt);
                        const isOther = opt === "Other";
                        const isPromoted = klasOptions.promoted && klasOptions.promoted.includes(opt);
                        if (klasOptions.multiSelect && !isOther) {
                          return (
                            <button key={opt} onClick={() => handleQuickReply(opt)}
                              style={{
                                background: isSelected ? "#2A9D8F" : "#fff",
                                color: isSelected ? "#fff" : C.text,
                                border: isSelected ? "2px solid #2A9D8F" : "2px solid #D0D0D0",
                                borderRadius: 16, padding: "5px 12px",
                                fontFamily: F.body, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.15s",
                                display: "flex", alignItems: "center", gap: 4,
                                boxShadow: isSelected ? "0 2px 6px rgba(42,157,143,0.3)" : "none",
                              }}>
                              <span style={{ fontSize: 11, width: 14, textAlign: "center" }}>{isSelected ? "\u2713" : "\u25CB"}</span>
                              {isPromoted && <span style={{ color: isSelected ? "#fff" : "#2A9D8F", fontSize: 10, lineHeight: 1 }}>&#9733;</span>}
                              {opt}
                            </button>
                          );
                        }
                        return (
                          <button key={opt} onClick={() => handleQuickReply(opt)}
                            style={{
                              background: isOther ? "#E8E8E8" : "#2A9D8F",
                              color: isOther ? C.text : "#fff",
                              border: "none", borderRadius: 16, padding: "5px 12px",
                              fontFamily: F.body, fontSize: 12, fontWeight: 600,
                              cursor: "pointer", transition: "opacity 0.15s",
                              display: "flex", alignItems: "center", gap: 4,
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                          >
                            {isPromoted && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>&#9733;</span>}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {klasOptions.multiSelect && klasSelected.length > 0 && (
                      <button onClick={handleMultiSelectSend}
                        style={{
                          marginTop: 8, background: "#2A9D8F", color: "#fff",
                          border: "none", borderRadius: 10, padding: "6px 16px",
                          fontFamily: F.accent, fontSize: 12, fontWeight: 700,
                          cursor: "pointer",
                        }}>
                        Send
                      </button>
                    )}
                  </div>
                )}

                {/* SECTION C — Input area */}
                <div style={{ borderTop: "0.5px solid #eef1f5", padding: "16px 24px", display: "flex", gap: 12, alignItems: "flex-end", flexShrink: 0 }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea ref={klasMode2TextareaRef} value={sageInput} onChange={e => setSageInput(e.target.value)}
                      placeholder="Type your response..."
                      rows={2}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSageSend(); } }}
                      style={{
                        width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 40px 10px 14px",
                        fontFamily: F.body, fontSize: 14, resize: "none", boxSizing: "border-box",
                        background: C.ivory, lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
                      }}
                      onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                      onFocus={e => e.target.style.borderColor = C.sage}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                    <VoiceMic onTranscript={t => setSageInput(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 8, bottom: 8 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    <button onClick={handleSageSend} disabled={!sageInput.trim() || sageSending}
                      style={{
                        background: "#2A9D8F", color: C.white, border: "none", borderRadius: 8,
                        padding: "8px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 12,
                        cursor: !sageInput.trim() || sageSending ? "default" : "pointer",
                        opacity: !sageInput.trim() ? 0.5 : 1,
                      }}>
                      Send
                    </button>
                    <FileUploadLink onText={t => setSageInput(p => p ? p + "\n" + t : t)} label="upload ↑" />
                  </div>
                </div>
              </div>

              {/* Right column — context panel */}
              <div style={{ flex: 1, background: "#f8f7f2", padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#5a6a85", marginBottom: 16 }}>
                  What Klas knows
                </div>
                {[
                  { label: "Subject", value: klasCore4.subject },
                  { label: "Level", value: klasCore4.level },
                  { label: "Building", value: klasCore4.building },
                  ...(klasCore4.format ? [{ label: "Format", value: klasCore4.format }] : []),
                  { label: "Goal", value: klasCore4.goal },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: "#5a6a85", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontFamily: F.body, fontSize: 13, color: item.value ? C.text : C.muted, lineHeight: 1.4, fontStyle: item.value ? "normal" : "italic" }}>
                      {item.value || "(gathering...)"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sage animation keyframes + responsive */}
      <style>{`
        @keyframes sageSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sageDots {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @media (max-width: 767px) {
          html, body { overflow-x: hidden; }
          button { min-height: 44px; }
          textarea { font-size: 16px !important; }
          h1, h2 { word-break: break-word; }
        }
      `}</style>

      {/* ── ASSIGNMENT BUILDER MODAL (triggered by Sage) ── */}
      {sageBuilderOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9500,
          background: "rgba(15,31,61,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "sageSlideUp 0.2s ease-out",
        }}>
          <div style={{
            width: "92vw", maxWidth: 900, maxHeight: "90vh", overflowY: "auto",
            background: C.white, borderRadius: 20, boxShadow: "0 16px 64px rgba(15,31,61,0.25)",
            padding: 0, position: "relative",
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 28px", borderBottom: `1px solid ${C.border}`,
              background: `linear-gradient(135deg, ${C.sageLight}, ${C.white})`,
              borderRadius: "20px 20px 0 0",
            }}>
              <div>
                <div style={{ fontFamily: F.display, fontSize: 24, color: C.navy }}>Assignment Builder</div>
                <div style={{ color: C.muted, fontSize: 13 }}>Describe the assignment you have in mind and we will help you brainstorm. KlasUp will generate the full document when we are finished.</div>
              </div>
              <button onClick={() => setSageBuilderOpen(false)}
                style={{ background: C.ivoryDark, border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.muted, flexShrink: 0 }}>
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "24px 28px" }}>
              {!can("pro") ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                  <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 8 }}>Assignment Builder is a Pro feature</div>
                  <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Generate complete, beautifully formatted assignments with real dates from your calendar.</div>
                  <button onClick={() => { setSageBuilderOpen(false); upgrade(); }} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "10px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Upgrade to Pro ↗</button>
                </div>
              ) : (
                <div>
                  <WCS course={course} setCourse={setCourseAndSync} week={week} setWeek={setWeek} courses={dbCourses} />

                  {/* Description input */}
                  <Card style={{ marginBottom: 20, border: `1px solid ${C.sage}22` }}>
                    <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>DESCRIBE YOUR ASSIGNMENT IN PLAIN ENGLISH</div>
                    <div style={{ position: "relative" }}>
                      <textarea value={assignDocDesc} onChange={e => setAssignDocDesc(e.target.value)}
                        placeholder={"My class meets every Thursday. Spring break is week 4. I want the first draft due week 5, peer review week 6, and final submission week 7. The client is Fidelity Investments and students need to create a full marketing plan."}
                        rows={5}
                        style={{
                          width: "100%", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
                          fontFamily: F.body, fontSize: 14, resize: "none", boxSizing: "border-box",
                          background: C.ivory, lineHeight: 1.65,
                        }}
                        onFocus={e => e.target.style.borderColor = C.sage}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                      <VoiceMic onTranscript={t => setAssignDocDesc(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 10, bottom: 10 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                        Include your schedule, deadlines, client names, assignment type, and any specifics.
                      </div>
                      <FileUploadLink onText={t => setAssignDocDesc(p => p ? p + "\n\n" + t : t)} />
                    </div>
                  </Card>

                  {/* Assignment type selector */}
                  <Card style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>ASSIGNMENT TYPE</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["Case Study", "Team Project", "Group Work", "Socratic Seminar", "Active Learning", "Individual Essay", "Research Paper", "Presentation", "Reflection", "Discussion Post"].map(t => (
                        <button key={t} onClick={() => setAssignType(assignType === t ? "" : t)}
                          style={{ fontSize: 12, fontFamily: F.accent, fontWeight: assignType === t ? 700 : 400, padding: "5px 12px", borderRadius: 20, border: assignType === t ? `1.5px solid ${C.sage}` : `0.5px solid ${C.border}`, background: assignType === t ? C.sageLight : C.ivory, color: assignType === t ? C.sage : C.muted, cursor: "pointer" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Learning outcome alignment */}
                  <Card style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>LEARNING OUTCOME ALIGNMENT</div>
                    {OUTCOMES.map((o, i) => (
                      <label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, cursor: "pointer", fontSize: 13, fontFamily: F.body, color: C.text, lineHeight: 1.5 }}>
                        <input type="checkbox" checked={selectedOutcomes.includes(o)}
                          onChange={() => setSelectedOutcomes(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o])}
                          style={{ marginTop: 3, accentColor: C.sage }} />
                        {o}
                      </label>
                    ))}
                  </Card>

                  {/* Milestones & checkpoints */}
                  <Card style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>MILESTONES & CHECKPOINTS</div>
                    {milestones.map((m, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ color: C.sage, fontSize: 12 }}>✓</span>
                        <input value={m} onChange={e => setMilestones(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                          style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 13, fontFamily: F.body, background: C.ivory }} />
                        <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: "none", border: "none", color: C.rose, cursor: "pointer", fontSize: 14 }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => setMilestones(prev => [...prev, ""])}
                      style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.sage, background: "none", border: `1px dashed ${C.sage}44`, borderRadius: 8, padding: "5px 14px", cursor: "pointer", marginTop: 4 }}>
                      + Add milestone
                    </button>
                  </Card>

                  {/* Generate button */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    <button onClick={() => {
                      if (!assignDocDesc.trim()) return;
                      const courseObj = dbCourses.find(c => c.course_code === course);
                      setAssignDocLoading(true);
                      setAssignDocError(null);
                      setAssignDocResult(null);
                      generateAssignmentDoc({
                        description: assignDocDesc + (assignType ? `\nAssignment type: ${assignType}` : "") + (selectedOutcomes.length ? `\nLearning outcomes to address: ${selectedOutcomes.join("; ")}` : "") + (milestones.filter(Boolean).length ? `\nMilestones/checkpoints: ${milestones.filter(Boolean).join(", ")}` : ""),
                        course,
                        termStart: courseObj?.term_start || null,
                        numWeeks: courseObj?.num_weeks || 16,
                        outcomes: OUTCOMES,
                      }).then(doc => {
                        setAssignDocResult(doc);
                        setAssignDocLoading(false);
                      }).catch(err => { setAssignDocError(err.message); setAssignDocLoading(false); });
                    }}
                      disabled={!assignDocDesc.trim() || assignDocLoading}
                      style={{
                        background: C.sage, color: C.white, border: "none", borderRadius: 10,
                        padding: "11px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                        cursor: !assignDocDesc.trim() || assignDocLoading ? "default" : "pointer",
                        opacity: !assignDocDesc.trim() ? 0.5 : 1,
                      }}>
                      {assignDocLoading ? "Generating..." : "Generate Assignment Document ↗"}
                    </button>
                  </div>

                  {/* Loading */}
                  {assignDocLoading && (
                    <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.sage}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 10, height: 10, background: C.sage, borderRadius: "50%", animation: "pulse 1.2s ease-in-out infinite" }} />
                        <div>
                          <div style={{ fontFamily: F.display, fontSize: 16, color: C.navy, marginBottom: 2 }}>Generating your assignment document...</div>
                          <div style={{ fontSize: 12, color: C.muted }}>Reading your term calendar and building a complete document with real dates</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {assignDocError && (
                    <Card style={{ marginBottom: 20, borderLeft: `4px solid ${C.rose}`, background: C.roseLight }}>
                      <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.rose, fontSize: 13 }}>Error: {assignDocError}</div>
                    </Card>
                  )}

                  {/* Generated document */}
                  {assignDocResult && !assignDocLoading && (
                    <Card style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700 }}>GENERATED ASSIGNMENT DOCUMENT</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => setAssignDocEditing(!assignDocEditing)}
                            style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: assignDocEditing ? C.rose : C.sage, background: "none", border: `1px solid ${assignDocEditing ? C.rose : C.sage}44`, borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                            {assignDocEditing ? "Done Editing" : "Edit"}
                          </button>
                          <button onClick={() => exportAssignmentDocx(assignDocResult, course)}
                            style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.white, background: C.tealBright, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                            Export as Word
                          </button>
                          <button onClick={() => {
                            if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "pdf" });
                            const printWin = window.open("", "_blank");
                            printWin.document.write(`<html><head><title>${course} Assignment</title><style>body{font-family:'Manrope',sans-serif;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.7;color:#0F1F3D}h1,h2,h3{font-family:'Bricolage Grotesque',sans-serif}pre{white-space:pre-wrap;font-family:'Manrope',sans-serif;font-size:14px}</style></head><body><pre>${assignDocResult}</pre></body></html>`);
                            printWin.document.close(); printWin.print();
                          }}
                            style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.white, background: C.navy, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                            Export as PDF
                          </button>
                          <button onClick={() => {
                            if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "text" });
                            const blob = new Blob([assignDocResult], { type: "text/plain" });
                            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                            a.download = `${course}-assignment.txt`; a.click();
                          }}
                            style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.navy, background: C.ivoryDark, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                            Export as Text
                          </button>
                        </div>
                      </div>
                      {assignDocEditing ? (
                        <div style={{ position: "relative" }}>
                          <textarea value={assignDocResult} onChange={e => setAssignDocResult(e.target.value)}
                            style={{ width: "100%", minHeight: 400, border: `1px solid ${C.sage}44`, borderRadius: 10, padding: 16, fontFamily: F.body, fontSize: 14, resize: "vertical", boxSizing: "border-box", background: C.ivory, lineHeight: 1.7 }} />
                          <VoiceMic onTranscript={t => setAssignDocResult(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 10, bottom: 10 }} />
                        </div>
                      ) : (
                        <div style={{ fontFamily: F.body, fontSize: 14, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap", padding: "8px 0" }}>
                          {assignDocResult}
                        </div>
                      )}

                      {/* Plain English update bar */}
                      <div style={{ marginTop: 20, padding: 16, background: C.ivoryDark, borderRadius: 12 }}>
                        <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>UPDATE WITH PLAIN ENGLISH</div>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                          <div style={{ flex: 1, position: "relative" }}>
                            <textarea value={assignDocUpdateText} onChange={e => setAssignDocUpdateText(e.target.value)}
                              placeholder={'e.g., "Move the deadline to week 8" or "Change the client to Nike"'}
                              rows={2}
                              style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box", background: C.white, lineHeight: 1.5 }} />
                            <VoiceMic onTranscript={t => setAssignDocUpdateText(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 8, bottom: 8 }} />
                          </div>
                          <button onClick={() => {
                            if (!assignDocUpdateText.trim()) return;
                            setAssignDocUpdating(true);
                            updateAssignmentDoc({ currentDoc: assignDocResult, instruction: assignDocUpdateText })
                              .then(doc => { setAssignDocResult(doc); setAssignDocUpdateText(""); setAssignDocUpdating(false); })
                              .catch(err => { setAssignDocError(err.message); setAssignDocUpdating(false); });
                          }}
                            disabled={!assignDocUpdateText.trim() || assignDocUpdating}
                            style={{
                              background: C.sage, color: C.white, border: "none", borderRadius: 10,
                              padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13,
                              cursor: assignDocUpdating ? "wait" : "pointer", whiteSpace: "nowrap",
                            }}>
                            {assignDocUpdating ? "Updating..." : "Update ↗"}
                          </button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* AI Feedback Panel */}
                  <Card style={{ borderTop: `3px solid ${C.ivoryDark}` }}>
                    <div style={{ fontFamily: F.display, fontSize: 18, color: C.navy, marginBottom: 4 }}>Quick Assignment Feedback</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Get instant AI feedback on an existing assignment prompt.</div>
                    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>ASSIGNMENT PROMPT</div>
                          <div style={{ position: "relative" }}>
                            <textarea value={assignText} onChange={e => setAssignText(e.target.value)} placeholder="Paste your existing assignment prompt here for instant feedback..." rows={5}
                              style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 10, fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box", background: C.ivory, lineHeight: 1.6 }} />
                            <VoiceMic onTranscript={t => setAssignText(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 8, bottom: 8 }} />
                          </div>
                        </div>
                        <button onClick={genFeedback} style={{ background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "11px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Get AI Feedback ↗</button>
                      </div>
                      <div style={{ background: C.navy, borderRadius: 14, padding: "1rem" }}>
                        <div style={{ fontFamily: F.accent, fontSize: 11, color: C.tealMid, fontWeight: 700, marginBottom: 12 }}>AI FEEDBACK PANEL</div>
                        {!aiFeedback ? (
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic", padding: "2rem 0", textAlign: "center" }}>Write your prompt and click "Get AI Feedback" to see analysis.</div>
                        ) : (
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
                              {[
                                { label: "Bloom's Level", val: aiFeedback.blooms, color: C.tealMid },
                                { label: "Scaffolding", val: `${aiFeedback.scaffold}/100`, color: aiFeedback.scaffold > 70 ? C.tealMid : "#F4C0D1" },
                                { label: "Outcomes Mapped", val: `${aiFeedback.outcomes}`, color: aiFeedback.outcomes > 0 ? C.tealMid : "#F4C0D1" },
                                { label: "Clarity Score", val: `${aiFeedback.clarity}/100`, color: aiFeedback.clarity > 70 ? C.tealMid : "#F4C0D1" },
                              ].map((s, i) => (
                                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.7rem" }}>
                                  <div style={{ fontSize: 10, fontFamily: F.accent, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.accent, color: s.color }}>{s.val}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontFamily: F.accent, fontSize: 11, color: C.tealMid, fontWeight: 700, marginBottom: 8 }}>SUGGESTIONS</div>
                            {aiFeedback.suggestions.map((s, i) => (
                              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 10, lineHeight: 1.5 }}>
                                <span style={{ color: C.tealBright, flexShrink: 0 }}>→</span><span>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
// redeploy Fri Mar 27 11:01:38 EDT 2026
