import { useState, useEffect, useCallback, useRef } from "react";
import Landing from "./Landing";
import ResearchLibrary from "./ResearchLibrary";
import BetaAgreement from "./BetaAgreement";
import OnboardingTour from "./components/OnboardingTour";
import { useFeatureFlags } from "./hooks/useFeatureFlags";

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
import mammoth from "mammoth";
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
  keywordSearchArticles, fetchArticlesByDimension,
  insertWellnessCheckin, updateWellnessCheckin, fetchRecentCheckins, fetchTodayCheckin,
  upsertKlasOtherResponse, getPromotedKlasOptions,
} from "./supabase";

const C = {
  navy: "#0F1F3D", navyMid: "#1A3260", navyLight: "#243D75",
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
  display: "'Fredoka One', cursive",
  body: "'Nunito', sans-serif",
  accent: "'Nunito', sans-serif",
};

const WEEKS = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);
const NAV = [
  { id: "Dashboard", icon: "⊞" },
  { id: "My Course", icon: "◎" },
  { id: "Slide Studio", icon: "◫" },
  { id: "Micro-Learning", icon: "◉" },
  { id: "Think Tank", icon: "◈" },
  { id: "Course Portfolio", icon: "◆" },
  { id: "Reports", icon: "☑" },
  { id: "Wellness", icon: "🌿" },
  { id: "Pedagogical Resources", icon: "⊡" },
  { id: "Settings", icon: "⚙" },
  { id: "Pricing", icon: "◇" },
  { id: "Admin", icon: "⛨", adminOnly: true },
];

const CAREER_DATA = {
  "MKT 301": {
    topic: "Consumer Behavior & AI-Driven Personalization",
    intelligence: "Demand for AI-fluent marketing roles has grown 38% year-over-year. Consumer behavior expertise combined with AI tooling is the fastest-emerging hybrid skill set in the marketing labor market.",
    source: "LinkedIn Talent Insights · Indeed Hiring Lab · BLS 2025",
    jobs: [
      { title: "AI Marketing Analyst", signal: "Emerging", growth: "+41%", why: "Your consumer behavior frameworks and data interpretation content maps directly to this role.", skills: ["Behavioral data analysis", "LLM prompt design", "Segmentation modeling"], tier: "free" },
      { title: "Personalization Strategist", signal: "Growing", growth: "+29%", why: "Your pricing and positioning content aligns with how personalization strategy is applied in practice.", skills: ["Customer journey mapping", "A/B testing", "AI content tools"], tier: "pro" },
      { title: "Consumer Insights Lead", signal: "Established", growth: "+18%", why: "The qualitative frameworks from your case study are core competencies for this role.", skills: ["Ethnographic research", "Insight synthesis", "Stakeholder storytelling"], tier: "pro" },
      { title: "Marketing Automation Specialist", signal: "Growing", growth: "+33%", why: "Your discussion on digital touchpoints maps directly to what this role manages day-to-day.", skills: ["HubSpot / Salesforce", "Workflow logic", "Campaign analytics"], tier: "pro" },
      { title: "Brand Intelligence Analyst", signal: "Emerging", growth: "+52%", why: "Your Nike repositioning case connects precisely to how brand intelligence is tracked and acted on.", skills: ["Social listening tools", "Competitive analysis", "AI trend detection"], tier: "pro" },
    ],
    shareCard: {
      headline: "This week in MKT 301 connects to some of the fastest-growing careers in marketing.",
      roles: ["AI Marketing Analyst (+41%)", "Brand Intelligence Analyst (+52%)", "Marketing Automation Specialist (+33%)"],
      message: "The skills you're building — consumer behavior analysis, strategic positioning, and data interpretation — are exactly what employers are hiring for right now.",
    },
  },
  "MKT 410": {
    topic: "Digital Strategy & Content Marketing",
    intelligence: "Content strategy roles are evolving rapidly as generative AI reshapes production workflows. Employers now prioritize strategic oversight of AI-generated content over pure writing ability.",
    source: "LinkedIn Talent Insights · Indeed Hiring Lab · BLS 2025",
    jobs: [
      { title: "Content Strategy Manager", signal: "Growing", growth: "+27%", why: "Your content audit framework is the core methodology this role uses daily.", skills: ["Editorial planning", "SEO strategy", "AI content oversight"], tier: "free" },
      { title: "AI Content Director", signal: "Emerging", growth: "+61%", why: "New role category emerging directly from your week's theme on AI-assisted content production.", skills: ["Prompt engineering", "Brand voice governance", "Content ops"], tier: "pro" },
      { title: "Digital Experience Designer", signal: "Established", growth: "+22%", why: "Your UX-content intersection content maps to this role's core deliverables.", skills: ["Journey mapping", "Figma", "Content design systems"], tier: "pro" },
    ],
    shareCard: {
      headline: "MKT 410 this week connects directly to one of the hottest job categories in digital marketing.",
      roles: ["AI Content Director (+61%)", "Content Strategy Manager (+27%)", "Digital Experience Designer (+22%)"],
      message: "Content strategy is being completely reimagined by AI. The frameworks you're learning now position you ahead of most applicants in this space.",
    },
  },
  "BUS 201": {
    topic: "Organizational Behavior & Decision-Making",
    intelligence: "Demand for business analysts with behavioral science and AI decision-support skills is accelerating as organizations integrate AI into strategic planning processes.",
    source: "LinkedIn Talent Insights · Indeed Hiring Lab · BLS 2025",
    jobs: [
      { title: "Business Intelligence Analyst", signal: "Established", growth: "+24%", why: "Your decision-making frameworks are the analytical foundation of this role.", skills: ["Data visualization", "SQL", "Stakeholder communication"], tier: "free" },
      { title: "Organizational Design Consultant", signal: "Growing", growth: "+31%", why: "Your org behavior content maps directly to how this role diagnoses and restructures teams.", skills: ["Change management", "Systems thinking", "Facilitation"], tier: "pro" },
      { title: "AI Strategy Associate", signal: "Emerging", growth: "+48%", why: "Emerging role at the intersection of business strategy and AI — your case content this week is foundational.", skills: ["AI literacy", "Process mapping", "Executive communication"], tier: "pro" },
    ],
    shareCard: {
      headline: "BUS 201 this week connects to some of the most in-demand roles in business and strategy.",
      roles: ["AI Strategy Associate (+48%)", "Organizational Design Consultant (+31%)", "Business Intelligence Analyst (+24%)"],
      message: "Understanding how organizations make decisions — and how AI is changing that — is one of the most valued skill sets in the current job market.",
    },
  },
};

const SIG_COLORS = {
  Emerging: { color: C.purple, bg: C.purpleLight },
  Growing: { color: C.teal, bg: C.tealLight },
  Established: { color: C.sage, bg: C.sageLight },
};

const DIMENSIONS = [
  { label: "Active Learning", score: 76, note: "Good variety; case studies underused", tier: "pro", color: C.sage },
  { label: "Announcements & Presence", score: 79, note: "Good frequency, tone could be warmer", tier: "free", color: C.tealBright },
  { label: "Assignments & Feedback Quality", score: 72, note: "Missing milestone checkpoints", tier: "free", color: C.tealBright },
  { label: "Discussions & Socratic Seminar", score: 88, note: "Strong prompt quality, high reply depth", tier: "free", color: C.tealBright },
  { label: "Flipped Classroom & Pacing", score: 84, note: "Module sequencing is clear", tier: "pro", color: C.tealBright },
  { label: "Learning Outcome Alignment", score: 69, note: "3 assignments lack outcome mapping", tier: "pro", color: C.sage },
  { label: "Reflection & Feedback", score: 58, note: "Few reflection or exit ticket prompts", tier: "pro", color: C.rose },
  { label: "Student Voice Integration", score: 66, note: "No mid-semester feedback uploaded", tier: "pro", color: C.gold },
  { label: "Universal Design for Learning", score: 61, note: "Limited multimodal content detected", tier: "pro", color: C.sage },
  { label: "Wellbeing & Sustainability", score: 74, note: "Moderate workload signals detected", tier: "pro", color: C.rose },
];

const MICRO = [
  { tag: "Active Learning", title: "Low-stakes retrieval boosts long-term retention", summary: "Brief retrieval practice at class start improves long-term retention by up to 50% vs re-reading.", article: "Roediger & Karpicke (2006). Psychological Science.", action: "Open next class with a 3-question retrieval quiz.", tier: "pro", color: C.sage, bg: C.sageLight },
  { tag: "Socratic Seminar", title: "Inquiry-based prompts deepen discussion quality", summary: "Open-ended challenge prompts posted before the week see 34% higher substantive reply rates.", article: "Garrison et al. (2010). Internet & Higher Education.", action: "Reframe your next prompt as an unresolved question.", tier: "free", color: C.teal, bg: C.tealLight },
  { tag: "UDL", title: "Multimodal content expands access and engagement", summary: "Courses in three or more formats show higher completion across diverse learners.", article: "Rose & Meyer (2002). Teaching Every Student. ASCD.", action: "Add one audio or video alternative to a text-heavy module.", tier: "pro", color: C.rose, bg: C.roseLight },
  { tag: "Reflection", title: "Exit tickets improve student self-regulation", summary: "Weekly metacognitive prompts reduce exam anxiety and improve self-directed study.", article: "Flavell (1979). American Psychologist.", action: "Add a two-question exit ticket: What clicked? What didn't?", tier: "pro", color: C.rose, bg: C.roseLight },
  { tag: "Flipped Classroom", title: "Pre-class content shifts time to application", summary: "Flipped classrooms show 19% improvement in exam performance with well-scaffolded pre-class materials.", article: "Bishop & Verleger (2013). ASEE Annual Conference.", action: "Upload one pre-class video and redesign that session as a workshop.", tier: "pro", color: C.sage, bg: C.sageLight },
  { tag: "Student Voice", title: "Mid-semester check-ins reverse disengagement", summary: "Acting visibly on mid-semester feedback improves end-of-term satisfaction by 23%.", article: "Nilufar et al. (2019). JOLT.", action: "Run a 3-question anonymous pulse survey and share one change you made.", tier: "pro", color: C.gold, bg: C.goldLight },
];

const UPLOADS = [
  { label: "Post-class notes", icon: "✏", desc: "Reflections after each session", tier: "free" },
  { label: "Announcements", icon: "📢", desc: "Posted announcements", tier: "free" },
  { label: "Assignments", icon: "📝", desc: "Assignment sheets & rubrics", tier: "pro" },
  { label: "Discussions", icon: "💬", desc: "Discussion prompts & threads", tier: "pro" },
  { label: "Learning Outcomes", icon: "🎯", desc: "Syllabus & course outcomes", tier: "pro" },
  { label: "Student Voice", icon: "🗣", desc: "Anonymized mid-semester themes", tier: "pro" },
  { label: "PowerPoints", icon: "📊", desc: "Slide content & topics", tier: "pro" },
];

const UPLOAD_PLACEHOLDERS = {
  "Post-class notes": "What worked well today? What fell flat? Where did students seem lost or disengaged?",
  "Announcements": "Paste your announcement here, or describe what you communicated to students this week.",
  "Assignments": "Paste your assignment instructions. What are students supposed to produce? What does success look like?",
  "Discussions": "Paste your discussion prompt here, or describe what you posted and how students responded.",
  "Learning Outcomes": "Paste your course learning outcomes or syllabus goals here.",
  "Student Voice": "Share anonymized themes from student feedback — what are they saying about the course?",
  "PowerPoints": "Describe or paste the key topics and content from your slides this week.",
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
  "PowerPoints": [
    "What are the 3-5 key concepts covered in this week's slides?",
    "Are there any activities, polls, or discussion breaks embedded in the deck?",
    "How much text vs. visuals are on each slide?",
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

const healthData = [52, 58, 55, 63, 70, 74, 79, 83];
const semData = [{ l: "F'23", s: 61 }, { l: "Sp'24", s: 68 }, { l: "F'24", s: 74 }, { l: "Sp'25", s: 83 }];

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

const ScoreRing = ({ score, size = 70, color = C.tealBright }) => {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.ivoryDark} strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 15, fontWeight: 600, fontFamily: F.accent, fill: color }}>{score}</text>
    </svg>
  );
};

function formatCourseLabel(c) {
  if (!c) return "—";
  if (typeof c === "string") return c;
  let label = c.course_code || "";
  if (c.section) label += ` - ${c.section}`;
  if (c.semester_code) label += ` | ${c.semester_code}`;
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

// Reusable "or upload a file" link that reads .docx/.pdf/.txt/.pptx and calls onText
const FileUploadLink = ({ onText, accept = ".docx,.pdf,.txt,.pptx", label }) => {
  const [reading, setReading] = useState(false);
  const inputRef = { current: null };
  return (
    <span>
      <input type="file" accept={accept} ref={el => inputRef.current = el}
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setReading(true);
          try {
            const text = await extractFileText(file);
            onText(text);
          } catch (err) {
            onText(`[Error reading ${file.name}: ${err.message}]`);
          } finally {
            setReading(false);
            e.target.value = "";
          }
        }} />
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{ background: "none", border: "none", fontSize: 12, color: C.teal, cursor: "pointer", fontFamily: F.body, padding: 0, textDecoration: "underline", textUnderlineOffset: 2 }}>
        {reading ? "Reading your document..." : (label || "or upload a file ↑")}
      </button>
    </span>
  );
};

// --- File Import Helper ---

async function extractFileText(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "txt") {
    return await file.text();
  }

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (ext === "pdf") {
    // Use browser PDF.js (available in modern browsers via pdf.js CDN fallback)
    // For simplicity, read as text — many PDFs contain extractable text
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    // Try to extract readable text from PDF binary
    let text = "";
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const raw = decoder.decode(bytes);
    // Extract text between BT/ET markers (PDF text objects)
    const matches = raw.match(/\(([^)]+)\)/g);
    if (matches && matches.length > 5) {
      text = matches
        .map(m => m.slice(1, -1))
        .filter(s => s.length > 1 && /[a-zA-Z]/.test(s))
        .join(" ")
        .replace(/\\n/g, "\n")
        .replace(/\s{3,}/g, "\n");
    }
    if (text.trim().length < 20) {
      return `[PDF uploaded: ${file.name}]\n\nNote: This PDF's text could not be fully extracted. You can copy and paste the content manually, or try exporting from the original source as .docx or .txt for best results.`;
    }
    return text;
  }

  if (ext === "pptx") {
    // PPTX is a ZIP containing XML slides — extract <a:t> text tags from the raw bytes
    const arrayBuffer = await file.arrayBuffer();
    try {
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const raw = decoder.decode(bytes);
      const textMatches = raw.match(/<a:t>([^<]+)<\/a:t>/g);
      if (textMatches && textMatches.length > 0) {
        const slideTexts = textMatches.map(m => m.replace(/<\/?a:t>/g, ""));
        let result = "";
        let slideNum = 1;
        slideTexts.forEach((t, i) => {
          if (i > 0 && t.length > 20 && /^[A-Z]/.test(t)) {
            result += `\n\n--- Slide ${slideNum++} ---\n`;
          }
          result += t + " ";
        });
        return result.trim();
      }
    } catch (e) { /* fall through */ }
    return `[PowerPoint uploaded: ${file.name}]\n\nSlide content was extracted — review above and add any missing details.`;
  }

  return `[File uploaded: ${file.name}] — Unsupported format. Please use .docx, .pdf, .txt, or .pptx.`;
}

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
      fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: "700",
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
  body { font-family: 'Nunito', 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 20px 0; line-height: 1.7; color: #0F1F3D; font-size: 14px; }
  h1, h2, h3 { font-family: 'Fredoka One', 'Arial Black', sans-serif; color: #0F1F3D; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 17px; border-bottom: 2px solid #0FB5B5; padding-bottom: 4px; margin-top: 24px; }
  .header { text-align: center; border-bottom: 2px solid #0FB5B5; padding-bottom: 16px; margin-bottom: 24px; }
  .header .logo { font-family: 'Fredoka One', sans-serif; font-size: 24px; color: #0B8A8A; display: flex; align-items: center; justify-content: center; gap: 4px; }
  .header .faculty { font-size: 13px; color: #4A5568; }
  .header .date { font-size: 11px; color: #999; margin-top: 4px; }
  .tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #0FB5B5; color: #fff; text-align: left; padding: 6px 10px; font-size: 12px; }
  td { border-bottom: 1px solid #eee; padding: 6px 10px; font-size: 13px; }
  .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 3px 0; }
  pre { white-space: pre-wrap; font-family: 'Nunito', sans-serif; font-size: 14px; }
</style></head><body>${html}<div class="footer">Generated by KlasUp · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div></body></html>`);
  w.document.close();
  w.print();
}

function makePdfHeader(facultyName, subtitle) {
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48" fill="none" style="vertical-align:middle;margin-right:6px"><circle cx="24" cy="17.3" r="13" fill="#0FB5B5"/><rect x="17.5" y="25" width="13" height="5" rx="1.5" fill="#0FB5B5"/><rect x="19" y="29" width="10" height="3" rx="1" fill="#0A9E9E"/><rect x="18" y="31.5" width="12" height="2.2" rx=".6" fill="#0F1F3D"/><rect x="19" y="34.2" width="10" height="2.2" rx=".6" fill="#0F1F3D"/><rect x="20" y="36.9" width="8" height="2.2" rx=".8" fill="#0F1F3D"/><rect x="21" y="10" width="2.8" height="14" rx="1.4" fill="white"/><line x1="24" y1="17.3" x2="30" y2="10" stroke="white" stroke-width="2.8" stroke-linecap="round"/><line x1="24" y1="17.3" x2="30.5" y2="24" stroke="white" stroke-width="2.8" stroke-linecap="round"/><circle cx="31.5" cy="10" r="1.1" fill="white" opacity=".9"/><circle cx="33.5" cy="13" r=".8" fill="white" opacity=".6"/></svg>`;
  return `<div class="header"><div class="logo">${logoSvg}<span style="font-family:'Fredoka One',sans-serif;font-size:24px;color:#0F1F3D">Klas</span><span style="font-family:'Fredoka One',sans-serif;font-size:24px;color:#0FB5B5">Up</span></div><div class="faculty">${facultyName || "Faculty"}</div>${subtitle ? `<div class="date">${subtitle}</div>` : ""}</div>`;
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
    style={{ background: "none", border: `1px solid rgba(15,31,61,0.12)`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontFamily: "'Nunito',sans-serif", fontWeight: 700, color: "#0B8A8A", cursor: "pointer", whiteSpace: "nowrap" }}>
    {label || "Copy ↗"}
  </button>
);

const EmailBtn = ({ subject, body, label }) => (
  <button onClick={(e) => { e.stopPropagation(); openMailto(subject, body); }}
    style={{ background: "none", border: `1px solid rgba(15,31,61,0.12)`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontFamily: "'Nunito',sans-serif", fontWeight: 700, color: "#6B4E9B", cursor: "pointer", whiteSpace: "nowrap" }}>
    {label || "Email ↗"}
  </button>
);

// Maps feature_flags.name → NAV id
const FLAG_GATED_PAGES = {
  pricing: "Pricing",
  accreditation: "Reports",
  wellness: "Wellness",
  think_tank: "Think Tank",
};

function ComingSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#2A9D8F22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🚀</span>
      </div>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#1B2B4B", marginBottom: 8 }}>Coming Soon</div>
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
  const [careerExpanded, setCareerExpanded] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(null);
  const [uploaded, setUploaded] = useState({});
  const [slideOpen, setSlideOpen] = useState(null);
  const [deckUploaded, setDeckUploaded] = useState(false);
  const [slideOutcomes, setSlideOutcomes] = useState([]);
  const [slideFeedback, setSlideFeedback] = useState(null);
  const [replyOpen, setReplyOpen] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [assignType, setAssignType] = useState("");
  const [assignText, setAssignText] = useState("");
  const [selectedOutcomes, setSelectedOutcomes] = useState([]);
  const [milestones, setMilestones] = useState(["Draft submission", "Peer review"]);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [uploadText, setUploadText] = useState("");
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
  const [myCourseCategory, setMyCourseCategory] = useState("Post-class notes");
  const [myCourseFeedback, setMyCourseFeedback] = useState(null);
  const [myCourseFeedbackLoading, setMyCourseFeedbackLoading] = useState(false);
  const [promptHelperOpen, setPromptHelperOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState({});
  const [upScoreOpen, setUpScoreOpen] = useState(false);

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
  const [sageInput, setSageInput] = useState("");
  const [sageSending, setSageSending] = useState(false);
  const [sageBuilderOpen, setSageBuilderOpen] = useState(false);
  const [klasOptions, setKlasOptions] = useState({ options: [], multiSelect: false, questionType: null });
  const [klasSelected, setKlasSelected] = useState([]);
  const [klasOtherMode, setKlasOtherMode] = useState(null); // tracks question_type when "Other" clicked
  const [klasExpanded, setKlasExpanded] = useState(false);
  const sageTextareaRef = useRef(null);

  // --- Supabase courses ---
  const [dbCourses, setDbCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ course_code: "", course_name: "", section: "", semester_code: "", semester_start: "", num_weeks: 16 });
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

  const courseNames = dbCourses.map(c => c.course_code);
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

        // Fetch announcements (non-critical)
        fetchActiveAnnouncements(userId)
          .then(anns => setAnnouncements(anns))
          .catch(() => {});

        // Show welcome banner for new users (created within 3 days, not dismissed, tour not completed)
        if (p && p.created_at) {
          const daysSinceCreated = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCreated <= 3 && !localStorage.getItem("klasup_welcome_dismissed")) {
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
      semester_code: form.semester_code.trim(),
      semester_start: form.semester_start || null,
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
  const cd = CAREER_DATA[course] || CAREER_DATA[courseNames[0]] || CAREER_DATA["MKT 301"] || { topic: "", intelligence: "", source: "", jobs: [], shareCard: { headline: "", roles: [], message: "" } };

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
    "My Course": "Let's look at what you're teaching. What would you like to think through?",
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
    if (typeof gtag === "function") gtag("event", "sage_chat_opened");
    if (sageMessages.length === 0) {
      setSageMessages([{ role: "assistant", content: sageGreeting() }]);
    }
    setSageOpen(true);
  };

  const stripKlasFiller = (text) => {
    return text.replace(/^(Great[,!]?\s*|Perfect[,!]?\s*)/i, "").trim();
  };

  const detectKlasQuickReplies = (reply) => {
    console.log("[Klas] detectKlasQuickReplies input:", reply);
    const text = reply.toLowerCase();
    let result;
    if (text.includes("type") || text.includes("active learning") || text.includes("group work") || text.includes("kind of assignment") || text.includes("what type")) {
      result = { options: ["Active Learning", "Project-Based", "Team-Based", "Discussion", "Lecture", "Case Study", "Simulation", "Role Play", "Other"], multiSelect: true, questionType: "assignment_type", promoted: [] };
    } else if (text.includes("long") || text.includes("session") || text.includes("minutes") || text.includes("hours") || text.includes("class time")) {
      result = { options: ["30 minutes", "1 hour", "90 minutes", "2+ hours", "Other"], multiSelect: false, questionType: "session_length", promoted: [] };
    } else if (text.includes("level") || text.includes("undergrad") || text.includes("graduate") || text.includes("freshman") || text.includes("sophomore") || text.includes("year are")) {
      result = { options: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "Mixed", "Other"], multiSelect: false, questionType: "student_level", promoted: [] };
    } else if (text.includes("duration") || text.includes("weeks") || text.includes("deadline") || text.includes("timeframe") || text.includes("how long will")) {
      result = { options: ["1 week", "2 weeks", "3-4 weeks", "Full semester", "Other"], multiSelect: false, questionType: "assignment_duration", promoted: [] };
    } else {
      result = { options: [], multiSelect: false, questionType: null, promoted: [] };
    }
    console.log("[Klas] detectKlasQuickReplies result:", result);
    return result;
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
    const userMsg = { role: "user", content: text };
    const updated = [...sageMessages, userMsg];
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
      setSageMessages(prev => [...prev, { role: "assistant", content: cleaned }]);
      const detected = detectKlasQuickReplies(cleaned);
      setKlasOptions(detected);
      loadPromotedOptions(detected.questionType);
      if (/let('s| us) (start|build|create|draft|design) (the |your |an |a )?assignment/i.test(cleaned) ||
          /open(ing)? the assignment builder/i.test(cleaned)) {
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
    const updated = [...sageMessages, userMsg];
    setSageMessages(updated);
    setSageInput("");
    setKlasOptions({ options: [], multiSelect: false, questionType: null });
    setKlasSelected([]);
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
      console.log("[Klas] Response received:", reply ? reply.slice(0, 100) + "..." : "EMPTY");
      if (!reply) throw new Error("Empty response");
      const cleaned = stripKlasFiller(reply);
      setSageMessages(prev => [...prev, { role: "assistant", content: cleaned }]);
      console.log("KLAS DEBUG reply text:", cleaned);
      const detected = detectKlasQuickReplies(cleaned);
      setKlasOptions(detected);
      loadPromotedOptions(detected.questionType);
      console.log("KLAS DEBUG options set:", detected);

      // Auto-open Assignment Builder modal if Sage's reply suggests building an assignment
      if (/let('s| us) (start|build|create|draft|design) (the |your |an |a )?assignment/i.test(cleaned) ||
          /open(ing)? the assignment builder/i.test(cleaned)) {
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

  const snap = [
    { label: "Discussion prompt uploaded", ok: true },
    { label: "Post-class notes added", ok: true },
    { label: "UDL gap detected in Slide 4", ok: false },
    { label: "No metacognitive prompt this week", ok: false },
    { label: "Assignment milestone set", ok: true },
  ];

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
              <Logo size="md" dark />
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
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Add the courses you're teaching this semester. You can always change these later in Settings.</div>

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
                    <span style={{ fontSize: 11, fontFamily: F.accent, color: C.teal, fontWeight: 700 }}>{c.semester_code}</span>
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
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Semester Code *</label>
                <input value={onboardingForm.semester_code} onChange={e => setOnboardingForm(p => ({ ...p, semester_code: e.target.value }))}
                  placeholder="e.g. Fall 2025" style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Semester Start Date</label>
                <input type="date" value={onboardingForm.semester_start} onChange={e => setOnboardingForm(p => ({ ...p, semester_start: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 }}>Number of Weeks</label>
                <input type="number" min={1} max={52} value={onboardingForm.num_weeks} onChange={e => setOnboardingForm(p => ({ ...p, num_weeks: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <button
              disabled={!onboardingForm.course_code.trim() || !onboardingForm.course_name.trim() || !onboardingForm.semester_code.trim()}
              onClick={async () => {
                try {
                  const row = await addCourseFromForm(onboardingForm);
                  setOnboardingCourses(prev => [...prev, row]);
                  setOnboardingForm({ course_code: "", course_name: "", section: "", semester_code: onboardingForm.semester_code, semester_start: onboardingForm.semester_start, num_weeks: onboardingForm.num_weeks });
                } catch (err) { alert("Error adding course: " + err.message); }
              }}
              style={{ background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: (!onboardingForm.course_code.trim() || !onboardingForm.course_name.trim() || !onboardingForm.semester_code.trim()) ? 0.4 : 1 }}>
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
            <Logo size="sm" dark />
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
          {NAV.filter(n => (!n.adminOnly || profile?.role === "admin") && !gatedPageIds.has(n.id)).map(n => (
            <button key={n.id} onClick={() => { if (n.id === "Pedagogical Resources") { setShowResearch(true); window.location.hash = "#/research"; if (mob) setSidebarOpen(false); return; } setPage(n.id); if (mob) setSidebarOpen(false); if (n.id === "Admin") loadAdminData(); if (n.id === "Settings") setSettingsProfileForm(null); if (n.id === "Pricing" && typeof gtag === "function") gtag("event", "pricing_page_viewed"); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: page === n.id ? `${C.tealBright}18` : "none", border: "none", borderLeft: page === n.id ? `3px solid ${C.tealBright}` : "3px solid transparent", color: page === n.id ? C.white : "rgba(255,255,255,0.45)", fontFamily: F.body, fontSize: 13, fontWeight: page === n.id ? 600 : 400, textAlign: "left", padding: "0.55rem 1.25rem", cursor: "pointer", minHeight: 44 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{n.icon}</span>{n.id}
            </button>
          ))}
        </div>

        {/* Impact widget */}
        <div style={{ padding: "0.75rem", margin: "0.75rem", background: `${C.tealBright}15`, borderRadius: 10, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 9, fontFamily: F.accent, color: C.tealMid, fontWeight: 700, marginBottom: 5, letterSpacing: "0.05em" }}>UP SCORE</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 1 }}>23 items · 8 weeks of data</div>
          <div style={{ fontSize: 12, color: C.tealBright, fontWeight: 700 }}>Health score +31 pts ↑</div>
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
      <div style={{ flex: 1, padding: mob ? "1rem" : "2rem", overflowY: "auto", maxWidth: page === "My Course" || page === "Course Portfolio" ? 1200 : 900, width: "100%", boxSizing: "border-box" }}>

        {/* Notification bar with hamburger on mobile */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, position: "relative" }}>
          {mob ? (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: C.navy, border: "none", cursor: "pointer", fontSize: 22, padding: "6px 12px", borderRadius: 8, color: C.white, lineHeight: 1, minHeight: 44 }}>
              ☰
            </button>
          ) : <div />}
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: C.navy, border: "none", cursor: "pointer", fontSize: 22, fontWeight: 900, padding: "4px 10px", borderRadius: 8, color: C.tealBright, lineHeight: 1 }}>
            ↑
            <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, background: C.rose, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: C.white, fontFamily: F.accent }}>7</div>
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", top: 36, right: 0, width: mob ? "calc(100vw - 32px)" : 360, maxWidth: 360, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: F.display, fontSize: 16 }}>Notifications</div>
                <span style={{ fontSize: 11, fontFamily: F.accent, color: C.teal, fontWeight: 700, cursor: "pointer" }}>Mark all read</span>
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {[
                  { icon: "📊", text: "MKT 301 health score increased to 83 (+4 this week)", time: "2h ago", unread: true, color: C.tealLight },
                  { icon: "📝", text: "New micro-learning available: Low-stakes retrieval boosts retention", time: "3h ago", unread: true, color: C.sageLight },
                  { icon: "💬", text: "Faculty · New England replied in Think Tank: Socratic Seminar", time: "4h ago", unread: true, color: C.tealLight },
                  { icon: "⚑", text: "UDL gap detected in Slide 4 of your MKT 301 deck", time: "5h ago", unread: true, color: C.roseLight },
                  { icon: "✓", text: "Post-class notes for Week 8 uploaded successfully", time: "Yesterday", unread: false, color: C.sageLight },
                  { icon: "📝", text: "New micro-learning: Mid-semester check-ins reverse disengagement", time: "Yesterday", unread: true, color: C.sageLight },
                  { icon: "📈", text: "Semester-over-semester trend: you're up 9 points from Fall '24", time: "2d ago", unread: true, color: C.purpleLight },
                ].map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "0.65rem 1rem", borderBottom: `0.5px solid ${C.border}`, background: n.unread ? `${n.color}44` : "none", cursor: "pointer" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: n.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{n.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, lineHeight: 1.5, color: n.unread ? C.navy : C.muted }}>{n.text}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{n.time}</div>
                    </div>
                    {n.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.tealBright, flexShrink: 0, marginTop: 6 }} />}
                  </div>
                ))}
              </div>
              <div style={{ padding: "0.6rem 1rem", borderTop: `0.5px solid ${C.border}`, textAlign: "center" }}>
                <span style={{ fontSize: 12, fontFamily: F.accent, color: C.teal, fontWeight: 700, cursor: "pointer" }}>View all notifications</span>
              </div>
            </div>
          )}
        </div>

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
          <div>
            {/* Welcome banner for new users */}
            {showWelcomeBanner && (
              <div style={{
                background: "#1B2B4B", color: "#fff", borderRadius: 14, padding: "14px 20px",
                marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 22 }}>&#10022;</span>
                  <span style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600 }}>
                    You're in! Want to see what KlasUp can do?
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => { setShowWelcomeBanner(false); setShowOnboardingTour(true); }}
                    style={{
                      background: C.tealBright, color: "#fff", border: "none", borderRadius: 10,
                      padding: "8px 18px", fontFamily: F.accent, fontWeight: 700, fontSize: 13,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}>
                    Take the Tour
                  </button>
                  <button onClick={() => { setShowWelcomeBanner(false); localStorage.setItem("klasup_welcome_dismissed", "1"); }}
                    style={{
                      background: "none", border: "none", color: "rgba(255,255,255,0.6)",
                      fontSize: 18, cursor: "pointer", padding: "4px 6px", lineHeight: 1,
                    }}>
                    &#10005;
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: mob ? 22 : 28, marginBottom: 2 }}>Good morning{profile?.name ? `, ${profile.name}` : ""}</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Week 8 of Fall 2025 · {can("pro") ? "8 insights" : "2 insights"} ready for you</div>
            </div>

            {/* Snapshot */}
            <Card style={{ marginBottom: 14, borderLeft: `4px solid ${C.tealBright}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 1 }}>{week} Snapshot — {courseLabel(course || courseNames[0])}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Auto-generated · Updated Sunday night</div>
                </div>
                <Tag label="This Week" color={C.teal} bg={C.tealLight} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {snap.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ color: s.ok ? C.sage : C.rose, fontWeight: 700 }}>{s.ok ? "✓" : "⚑"}</span>
                    <span style={{ color: s.ok ? C.text : C.rose }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: C.ivory, borderRadius: 8, padding: "0.65rem", fontSize: 13, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: C.navy }}>Priority this week: </span>
                <span style={{ color: C.muted }}>Add a metacognitive exit ticket to Week 9 — highest-impact move based on your current pattern.</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => {
                  const snapText = snap.map(s => `${s.ok ? "✓" : "⚑"} ${s.label}`).join("\n");
                  const body = `${week} Snapshot — ${courseLabel(course || courseNames[0])}\n\n${snapText}\n\nPriority this week: Add a metacognitive exit ticket to Week 9.`;
                  printPdf(makePdfHeader(profile?.name, `${week} · ${courseLabel(course || courseNames[0])}`) + `<h2>${week} Snapshot</h2><ul>${snap.map(s => `<li>${s.ok ? "✓" : "⚑"} ${s.label}</li>`).join("")}</ul><p><strong>Priority this week:</strong> Add a metacognitive exit ticket to Week 9 — highest-impact move based on your current pattern.</p>`, `${week} Snapshot`);
                }}
                  style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.navy, background: C.ivoryDark, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>Export as PDF</button>
                <EmailBtn subject={`My Teaching Snapshot — ${week}`} body={snap.map(s => `${s.ok ? "✓" : "⚑"} ${s.label}`).join("\n") + "\n\nPriority this week: Add a metacognitive exit ticket to Week 9."} />
              </div>
            </Card>

            {/* Wellness Check-in */}
            <div style={{ background: "#EAF3DE", borderRadius: 14, padding: "1.25rem", marginBottom: 14, border: `1px solid ${C.sage}22` }}>
              <div style={{ fontFamily: F.display, fontSize: 17, color: C.sage, marginBottom: 10 }}>How are you showing up today?</div>
              {wellnessBurnoutFlag && (
                <div style={{ background: C.roseLight, borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 13, color: C.rose, lineHeight: 1.5 }}>
                  You've had a tough few days. Be gentle with yourself. 🌿
                </div>
              )}
              {wellnessTodayCheckin && !wellnessMsg ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{WELLNESS_EMOJIS[wellnessTodayCheckin.check_in_score - 1]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.sage, fontWeight: 600 }}>Checked in today</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{WELLNESS_MESSAGES[wellnessTodayCheckin.check_in_score - 1]}</div>
                  </div>
                  <button onClick={() => { setWellnessMsg(null); setWellnessScore(null); setWellnessTodayCheckin(null); }}
                    style={{ background: "none", border: "none", fontSize: 12, color: C.sage, fontFamily: F.accent, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                    Update
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: mob ? 12 : 16, marginBottom: wellnessMsg ? 12 : 0 }}>
                    {WELLNESS_EMOJIS.map((e, i) => (
                      <button key={i} onClick={() => handleWellnessCheckin(i + 1)}
                        style={{
                          fontSize: mob ? 26 : 30, background: wellnessScore === i + 1 ? `${C.sage}22` : "transparent",
                          border: wellnessScore === i + 1 ? `2px solid ${C.sage}` : "2px solid transparent",
                          borderRadius: "50%", width: mob ? 44 : 48, height: mob ? 44 : 48,
                          cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  {wellnessMsg && (
                    <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 13, color: C.sage, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{wellnessMsg.message}</div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>💡 {wellnessMsg.tip}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Up Score */}
            <Card style={{ marginBottom: 14, background: C.navy, border: "none", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, background: `${C.tealBright}12`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: mob ? "flex-start" : "center", gap: mob ? 14 : 20, flexDirection: mob ? "column" : "row" }}>
                <ScoreRing score={83} size={mob ? 70 : 90} color={C.tealBright} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: C.white }}>Your Up Score</div>
                    <Tag label="+31 pts this semester" color={C.tealBright} bg={`${C.tealBright}22`} />
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 10 }}>Composite score across all courses, uploads, engagement, and pedagogical growth.</div>
                  <div style={{ display: "flex", gap: mob ? 8 : 12, flexWrap: "wrap" }}>
                    {[{ label: "Uploads", val: "23" }, { label: "Weeks Active", val: "8" }, { label: "Dimensions Tracked", val: can("pro") ? "10" : "3" }, { label: "Courses", val: String(can("pro") ? courseNames.length || 1 : 1) }].map((s, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 12px" }}>
                        <div style={{ fontSize: 9, fontFamily: F.accent, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontFamily: F.accent, fontWeight: 700, color: C.tealMid }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Course scores */}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : `repeat(${Math.min(dbCourses.length, 3) || 1},minmax(0,1fr))`, gap: 12, marginBottom: 14 }}>
              {(dbCourses.length > 0 ? dbCourses : [null]).map((cObj, i) => {
                const demoScores = [83, 71, 67, 75, 60];
                const demoTrends = ["+11", "+6", "+3", "+8", "+2"];
                const sc = demoScores[i % demoScores.length];
                const tr = demoTrends[i % demoTrends.length];
                return (
                <Card key={i} style={{ position: "relative", overflow: "hidden" }}>
                  {i > 0 && !can("pro") && <LockOverlay onUpgrade={upgrade} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{cObj ? formatCourseLabel(cObj) : "—"}</div>
                      <div style={{ fontFamily: F.display, fontSize: 28, color: C.teal }}>{sc}</div>
                      <div style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>{tr} this semester</div>
                    </div>
                    <ScoreRing score={sc} />
                  </div>
                </Card>
                );
              })}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Card>
                <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>WEEK OVER WEEK — {courseLabel(course || courseNames[0])}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 80 }}>
                  {healthData.map((s, i) => {
                    const h = ((s - 40) / 60) * 65, isL = i === healthData.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        {isL && <span style={{ fontSize: 10, fontFamily: F.accent, color: C.tealBright, fontWeight: 700 }}>{s}</span>}
                        <div style={{ width: "100%", height: `${h}px`, background: isL ? C.tealBright : `${C.tealBright}44`, borderRadius: "3px 3px 0 0" }} />
                        <span style={{ fontSize: 9, color: C.muted, fontFamily: F.accent }}>W{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card style={{ position: "relative", overflow: "hidden" }}>
                {!can("pro") && <LockOverlay onUpgrade={upgrade} />}
                <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>SEMESTER OVER SEMESTER</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                  {semData.map((d, i) => {
                    const h = ((d.s - 40) / 60) * 65, isL = i === semData.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 10, fontFamily: F.accent, color: isL ? C.rose : C.muted, fontWeight: isL ? 700 : 400 }}>{d.s}</span>
                        <div style={{ width: "100%", height: `${h}px`, background: isL ? C.rose : `${C.rose}44`, borderRadius: "3px 3px 0 0" }} />
                        <span style={{ fontSize: 9, color: C.muted, fontFamily: F.accent }}>{d.l}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Career Connections */}
            <div style={{ background: C.navy, borderRadius: 16, padding: "1.5rem", marginBottom: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: `${C.tealBright}12`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: F.display, fontSize: mob ? 18 : 20, color: C.white }}>Career Connections</div>
                    <span style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, background: `${C.purple}55`, color: "#D4B8F0", padding: "2px 10px", borderRadius: 20 }}>Intelligence</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{course} · {week} · {cd.topic}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {can("pro") && <button onClick={() => setShareCardOpen(!shareCardOpen)} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: `${C.tealBright}33`, color: C.tealMid, border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer" }}>Share ↗</button>}
                  <button onClick={() => setCareerExpanded(!careerExpanded)} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer" }}>{careerExpanded ? "Collapse" : "Expand"}</button>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.75rem", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontFamily: F.accent, color: C.tealMid, fontWeight: 700, marginBottom: 4 }}>MARKET INTELLIGENCE</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{cd.intelligence}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 5, fontStyle: "italic" }}>{cd.source}</div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: careerExpanded ? 10 : 0 }}>
                {cd.jobs.filter(j => can(j.tier)).slice(0, can("pro") ? 5 : 1).map((j, i) => {
                  const sig = SIG_COLORS[j.signal];
                  return (
                    <div key={i} onClick={() => setExpandedJob(expandedJob === i ? null : i)}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", border: expandedJob === i ? `1px solid ${C.tealBright}` : "0.5px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sig.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: C.white, fontWeight: 600 }}>{j.title}</span>
                      <span style={{ fontSize: 11, color: C.tealMid, fontWeight: 700 }}>{j.growth}</span>
                    </div>
                  );
                })}
                {!can("pro") && (
                  <div onClick={upgrade} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", border: "0.5px dashed rgba(255,255,255,0.12)" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>🔒 +4 roles</span>
                    <span style={{ fontSize: 11, color: C.tealMid, fontWeight: 700 }}>Pro ↗</span>
                  </div>
                )}
              </div>

              {careerExpanded && expandedJob !== null && (
                <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem", marginTop: 8 }}>
                  {(() => {
                    const j = cd.jobs[expandedJob];
                    if (!j) return null;
                    const sig = SIG_COLORS[j.signal];
                    return (
                      <div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontFamily: F.display, fontSize: 17, color: C.white }}>{j.title}</div>
                          <span style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: `${sig.color}33`, color: sig.color, padding: "2px 10px", borderRadius: 20 }}>{j.signal}</span>
                          <span style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.tealMid }}>{j.growth} YoY</span>
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", marginBottom: 10, lineHeight: 1.6 }}>
                          <span style={{ color: C.tealMid, fontWeight: 700 }}>Why this week connects: </span>{j.why}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: F.accent, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 6 }}>KEY SKILLS EMPLOYERS ARE HIRING FOR</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {j.skills.map((s, k) => <span key={k} style={{ fontSize: 12, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.72)", padding: "4px 10px", borderRadius: 20 }}>{s}</span>)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {careerExpanded && expandedJob === null && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8, fontStyle: "italic" }}>Click any role above to see how it connects to this week's content.</div>}
            </div>

            {/* Share card */}
            {shareCardOpen && can("pro") && (
              <Card style={{ marginBottom: 14, border: `1.5px solid ${C.purple}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontFamily: F.display, fontSize: 17 }}>Student Share Card</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Tag label="Ready to share" color={C.sage} bg={C.sageLight} />
                    <button onClick={() => setShareCardOpen(false)} style={{ fontSize: 14, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
                <div style={{ background: C.navy, borderRadius: 12, padding: "1.25rem", marginBottom: 12 }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, color: C.white, marginBottom: 8 }}>{cd.shareCard.headline}</div>
                  {cd.shareCard.roles.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.tealMid, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.tealMid, fontWeight: 700 }}>{r}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginTop: 8 }}>{cd.shareCard.message}</div>
                  <div style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>KlasUp · Career Connections · {course} {week}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ flex: 1, background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "9px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Post as Announcement</button>
                  <button style={{ flex: 1, background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "9px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Add to Discussion</button>
                  <button onClick={() => copyToClipboard(`${cd.shareCard.headline}\n\n${cd.shareCard.roles.join("\n")}\n\n${cd.shareCard.message}\n\n— KlasUp · Career Connections · ${course} ${week}`)}
                    style={{ flex: 1, background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10, padding: "9px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Copy Text</button>
                  <button onClick={() => openMailto(`This week in ${course} connects to these careers`, `${cd.shareCard.headline}\n\n${cd.shareCard.roles.join("\n")}\n\n${cd.shareCard.message}\n\n— KlasUp Career Connections`)}
                    style={{ flex: 1, background: C.purpleLight, color: C.purple, border: "none", borderRadius: 10, padding: "9px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Email ↗</button>
                </div>
              </Card>
            )}
            {/* Semester Overview */}
            {dbCourses.length > 0 && (
              <Card style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontFamily: F.display, fontSize: 18 }}>Semester Overview</div>
                  <button onClick={() => setPage("Settings")} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.teal, background: "none", border: "none", cursor: "pointer" }}>Manage Courses</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {dbCourses.map(c => (
                    <div key={c.id} style={{ background: C.ivory, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.navy, marginBottom: 4 }}>{formatCourseLabel(c)}</div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                        {c.semester_start ? `Starts ${new Date(c.semester_start + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "No start date set"}<br />
                        {c.num_weeks || 16} week semester
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── MY COURSE ── */}
        {page === "My Course" && (() => {
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

          const handleSubmit = () => {
            const text = uploadText.trim();
            if (!text) return;
            const prevTotal = Object.values(uploaded).reduce((a, b) => a + b, 0);
            if (prevTotal === 0 && typeof gtag === "function") gtag("event", "first_upload_submitted", { category: myCourseCategory });
            setUploaded(p => ({ ...p, [myCourseCategory]: (p[myCourseCategory] || 0) + 1 }));
            setUploadLog(prev => [{ content: text, category: myCourseCategory, course, week, timestamp: Date.now() }, ...prev]);
            setUploadText("");
            setMyCourseFeedbackLoading(true);
            setMyCourseFeedback(null);
            setAiMicroError(null);
            generateMicroLearning({ content: text, category: myCourseCategory, course, week })
              .then(recs => {
                setAiMicro(recs);
                setMyCourseFeedbackLoading(false);
                if (typeof gtag === "function") gtag("event", "micro_learning_generated", { category: myCourseCategory });
                const fb = recs && recs.length > 0 ? recs[0] : null;
                setMyCourseFeedback(fb);
                setMicroHistory(prev => ({
                  ...prev,
                  [myCourseCategory]: [
                    { recs, week, course, timestamp: Date.now() },
                    ...(prev[myCourseCategory] || []),
                  ],
                }));
              })
              .catch(err => { console.error(err); setAiMicroError(err.message); setMyCourseFeedbackLoading(false); });
          };

          return (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>My Course</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Share what's happening in your classroom. KlasUp turns it into growth.</div>
            </div>
            <WCS course={course} setCourse={setCourse} week={week} setWeek={setWeek} courses={dbCourses} />

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
                      <button key={u.label} onClick={() => !locked && setMyCourseCategory(u.label)}
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

              {/* Textarea */}
              <div style={{ position: "relative" }}>
                <textarea
                  value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                  placeholder={UPLOAD_PLACEHOLDERS[myCourseCategory] || "Share what happened in class..."}
                  rows={6}
                  style={{
                    width: "100%", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
                    fontFamily: F.body, fontSize: 14, resize: "none", boxSizing: "border-box",
                    background: C.ivory, lineHeight: 1.65,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = C.tealBright}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <VoiceMic onTranscript={t => setUploadText(p => p ? p + " " + t : t)} style={{ position: "absolute", right: 10, bottom: 10 }} />
              </div>
              <div style={{ marginTop: 6 }}>
                <FileUploadLink onText={t => setUploadText(p => p ? p + "\n\n" + t : t)} />
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
                  <div style={{ background: C.ivoryDark, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 3 }}>RESEARCH</div>
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>{m.article}</div>
                  </div>
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
                      const catObj = UPLOADS.find(u => u.label === entry.category) || UPLOADS[0];
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

            {/* ── 4. UP SCORE BREAKDOWN (collapsible) ── */}
            <Card>
              <button onClick={() => setUpScoreOpen(!upScoreOpen)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700 }}>UP SCORE BREAKDOWN — {course} · {week}</div>
                <span style={{ fontSize: 12, color: C.muted }}>{upScoreOpen ? "▲" : "▼"}</span>
              </button>
              {upScoreOpen && (
                <div style={{ marginTop: 14 }}>
                  {DIMENSIONS.map((d, i) => {
                    const locked = !can(d.tier);
                    return (
                      <div key={i} style={{ marginBottom: 12, position: "relative" }}>
                        {locked && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(250,248,244,0.9)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", zIndex: 1 }}>
                            <span style={{ fontSize: 12, fontFamily: F.accent, color: C.muted, fontWeight: 700 }}>🔒 {d.label}</span>
                            <button onClick={upgrade} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: C.teal, color: C.white, border: "none", borderRadius: 20, padding: "3px 12px", cursor: "pointer" }}>Pro ↗</button>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</span>
                          <span style={{ fontSize: 13, fontFamily: F.accent, color: d.color, fontWeight: 700 }}>{d.score}</span>
                        </div>
                        <div style={{ height: 6, background: C.ivoryDark, borderRadius: 4, overflow: "hidden", marginBottom: 3 }}>
                          <div style={{ width: `${d.score}%`, height: "100%", background: d.score > 80 ? C.tealBright : d.score > 70 ? C.sage : C.rose, borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>{d.note}</div>
                      </div>
                    );
                  })}
                </div>
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
        {page === "Slide Studio" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Slide Studio</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Plan your deck or upload an existing one for AI analysis.</div>
            </div>
            {!can("pro") ? (
              <Card style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 8 }}>Slide Studio is a Pro feature</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Plan slide decks with AI, get UDL scoring, or upload existing decks for analysis.</div>
                <button onClick={upgrade} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "10px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Upgrade to Pro ↗</button>
              </Card>
            ) : (
              <div>
                <WCS course={course} setCourse={setCourse} week={week} setWeek={setWeek} courses={dbCourses} />

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
                    <FileUploadLink onText={t => setPptDesc(p => p ? p + "\n\n" + t : t)} accept=".docx,.pdf,.txt,.pptx" label="or upload a file (.pptx, .docx, .txt) ↑" />
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
                          let html = `<html><head><title>${course} ${week} Slides</title><style>body{font-family:'Nunito',sans-serif;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.7;color:#0F1F3D}h1,h2{font-family:'Fredoka One',cursive}.slide{border:1px solid #ddd;border-radius:12px;padding:20px;margin:16px 0;page-break-inside:avoid}.slide-num{background:#0FB5B5;color:#fff;display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700}ul{margin:8px 0}li{margin:4px 0}.visual{background:#E6F4E8;padding:8px 12px;border-radius:8px;font-size:13px;margin:8px 0}.notes{background:#F0EDE6;padding:8px 12px;border-radius:8px;font-size:12px;color:#4A5568;margin:8px 0}</style></head><body>`;
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
                      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
                        {[{ label: "UDL Score", val: "71", color: C.sage }, { label: "Text Density", val: "High", color: C.rose }, { label: "Active Moments", val: "3/7", color: C.tealBright }, { label: "Outcome Alignment", val: "80%", color: C.sage }].map((s, i) => (
                          <div key={i} style={{ background: C.ivoryDark, borderRadius: 10, padding: "0.75rem" }}>
                            <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                            <div style={{ fontSize: 18, fontFamily: F.display, color: s.color }}>{s.val}</div>
                          </div>
                        ))}
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
        )}

        {/* ── MICRO-LEARNING ── */}
        {page === "Micro-Learning" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Micro-Learning</div>
              <div style={{ color: C.muted, fontSize: 14 }}>
                {aiMicro.length > 0
                  ? `AI-powered recommendations for ${course} · ${week} · grounded in peer-reviewed research.`
                  : "Surfaced from your course patterns · grounded in peer-reviewed research."}
              </div>
            </div>

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
                      <div style={{ background: C.ivory, borderRadius: 8, padding: "0.6rem 0.9rem", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 2 }}>PEER-REVIEWED RESEARCH</div>
                        <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>{m.article}</div>
                      </div>
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
                  <div style={{ background: C.ivory, borderRadius: 8, padding: "0.6rem 0.9rem", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 2 }}>RESEARCH BASIS</div>
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>{m.article}</div>
                  </div>
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
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Think Tank</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Faculty at similar institutions · working on similar challenges.</div>
            </div>
            {/* Collaboration Score */}
            <Card style={{ marginBottom: 18, background: C.navy, border: "none", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -25, right: -25, width: 120, height: 120, background: `${C.tealBright}10`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <ScoreRing score={64} size={80} color={C.tealBright} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ fontFamily: F.display, fontSize: 18, color: C.white }}>Collaboration Score</div>
                    <Tag label="Building" color={C.gold} bg={`${C.gold}33`} />
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>Tracks your forum engagement — posts, replies, and peer interactions over time.</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ label: "Posts", val: "6" }, { label: "Replies", val: "14" }, { label: "Threads Joined", val: "9" }, { label: "Weeks Active", val: "6/8" }].map((s, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "5px 10px" }}>
                        <div style={{ fontSize: 9, fontFamily: F.accent, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{s.label}</div>
                        <div style={{ fontSize: 15, fontFamily: F.accent, fontWeight: 700, color: C.tealMid }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {["All", "Socratic Seminar", "UDL", "Flipped Classroom", "Reflection", "Active Learning"].map(t => (
                <span key={t} style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: t === "All" ? C.navy : C.ivoryDark, color: t === "All" ? C.white : C.muted, cursor: "pointer" }}>{t}</span>
              ))}
            </div>
            {(() => {
              const posts = [
                { id: 0, author: "Faculty · New England", time: "2h ago", tag: "Socratic Seminar", text: "Tried seeding my forum with an unresolved question on Monday — response quality was noticeably richer. Anyone doing this consistently?", replies: 4, posts: 6, totalReplies: 8, tier: "free", baseUpvotes: 5 },
                { id: 1, author: "Faculty · Mid-Atlantic", time: "Yesterday", tag: "UDL", text: "Added a 4-minute audio summary alongside my reading. Students with long commutes said it was a game changer. Small lift, big impact.", replies: 7, posts: 2, totalReplies: 3, tier: "pro", baseUpvotes: 12 },
                { id: 2, author: "Faculty · Southeast", time: "2d ago", tag: "Flipped Classroom", text: "First full flip this semester. Pre-class video took 45 min to make but class time was the best session I've had in years.", replies: 11, posts: 4, totalReplies: 6, tier: "pro", baseUpvotes: 18 },
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
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Reports</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Accreditation-ready documentation of faculty growth and engagement.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
              {[{ label: "Avg Health Score", val: "74", sub: "+13 from last semester" }, { label: "Dimensions Tracked", val: can("pro") ? "10" : "3", sub: can("pro") ? "Full suite active" : "Upgrade for full suite" }, { label: "Standards Mapped", val: can("institutional") ? "5" : can("pro") ? "3" : "1", sub: "Documented" }].map((s, i) => (
                <div key={i} style={{ background: C.ivoryDark, borderRadius: 12, padding: "1rem" }}>
                  <div style={{ fontSize: 11, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: F.display, fontSize: 28, color: C.navy }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            {[
              { standard: "NECHE 4.19 — Faculty Development", status: "Documented", detail: "Ongoing micro-learning, peer forum contributions, and course improvement cycles across 3 courses.", tier: "pro" },
              { standard: "NECHE 4.20 — Assessment of Teaching", status: "In Progress", detail: "Week-over-week health score trending available. Semester comparison complete.", tier: "pro" },
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
                { standard: "NECHE 4.20 — Assessment of Teaching", status: "In Progress", detail: "Week-over-week health score trending available. Semester comparison complete." },
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
                    html += `<h2>Summary Metrics</h2><ul><li>Avg Health Score: 74 (+13 from last semester)</li><li>Dimensions Tracked: ${can("pro") ? 10 : 3}</li><li>Standards Mapped: ${can("institutional") ? 5 : 3}</li></ul>`;
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
                    paras.push(new Paragraph({ children: [new TextRun({ text: `Avg Health Score: 74 (+13 from last semester)`, size: 22, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 40 } }));
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Course Portfolio</div>
                <div style={{ color: C.muted, fontSize: 14 }}>Your complete semester record — uploads, AI insights, and reflective narrative.</div>
              </div>
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
                  if (reflectionText) html += `<h2>Semester Reflection</h2><pre>${reflectionText}</pre>`;
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
                    paras.push(new Paragraph({ text: "Semester Reflection", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 120 } }));
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
                <button onClick={() => setPage("My Course")} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "8px 20px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Go to My Course</button>
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

            {/* ── End of Semester Reflection ── */}
            <div style={{ marginTop: 30, background: C.navy, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: C.white, marginBottom: 4 }}>End of Semester Reflection</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
                      AI-drafted narrative based on {courseUploads.length} upload{courseUploads.length !== 1 ? "s" : ""} for {portfolioCourse} — edit freely, then export.
                    </div>
                  </div>
                  {reflectionText && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setReflectionEditing(!reflectionEditing)}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: reflectionEditing ? C.tealBright : "rgba(255,255,255,0.1)", color: reflectionEditing ? C.navy : "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        {reflectionEditing ? "Done Editing" : "Edit"}
                      </button>
                      <button onClick={async () => {
                        const paras = reflectionText.split("\n").map(line => new Paragraph({ children: [new TextRun({ text: line, size: 22, font: "Calibri" })], spacing: { after: 80 } }));
                        await exportGenericDocx(paras, `Semester Reflection — ${portfolioCourse}`, `${profile?.name || "Faculty"} · Generated by KlasUp`, `${portfolioCourse.replace(/ /g, "_")}_Reflection.docx`);
                      }}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        Export as Word
                      </button>
                      <button onClick={() => printPdf(makePdfHeader(profile?.name, portfolioCourse) + `<h1>Semester Reflection</h1><pre>${reflectionText}</pre>`, `Semester Reflection — ${portfolioCourse}`)}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        Export as PDF
                      </button>
                      <button onClick={() => {
                        if (typeof gtag === "function") gtag("event", "export_clicked", { export_type: "text" });
                        const blob = new Blob([reflectionText], { type: "text/plain" });
                        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                        a.download = `${portfolioCourse.replace(/ /g, "_")}_Semester_Reflection.txt`; a.click();
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
                      .then(text => { setReflectionText(text); setReflectionLoading(false); })
                      .catch(err => { console.error(err); setReflectionError(err.message); setReflectionLoading(false); });
                  }}
                    style={{ background: courseUploads.length > 0 ? C.tealBright : "rgba(255,255,255,0.1)", color: courseUploads.length > 0 ? C.navy : "rgba(255,255,255,0.3)", border: "none", borderRadius: 10, padding: "12px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: courseUploads.length > 0 ? "pointer" : "default" }}>
                    Generate Reflection
                  </button>
                )}

                {reflectionLoading && (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    <div style={{ fontSize: 22, marginBottom: 8, animation: "spin 1.5s linear infinite", color: C.tealBright }}>◉</div>
                    <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.tealBright, fontSize: 12, marginBottom: 4 }}>Drafting your semester reflection...</div>
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

        {/* ── WELLNESS ── */}
        {page === "Wellness" && !gatedPageIds.has("Wellness") && (() => {
          const FACULTY_MEDITATIONS = [
            { title: "Before a Tough Class", duration: "3 min", desc: "Ground yourself and find your center before walking into a challenging session.", inhale: 4, hold: 4, exhale: 6, rounds: 6 },
            { title: "After a Draining Week", duration: "5 min", desc: "Release the weight of the week. You gave what you had — now restore.", inhale: 4, hold: 7, exhale: 8, rounds: 8 },
            { title: "Reconnect with Purpose", duration: "4 min", desc: "Remember why you teach. Reconnect with the impact you make every day.", inhale: 5, hold: 5, exhale: 5, rounds: 7 },
            { title: "Midday Reset", duration: "2 min", desc: "A quick energy refresh between classes or meetings.", inhale: 3, hold: 3, exhale: 4, rounds: 5 },
          ];
          const STUDENT_MEDITATIONS = [
            { emoji: "🎨", title: "Before a Creative Assignment", duration: "2 min", desc: "Open up to new ideas and let go of perfectionism.", inhale: 4, hold: 3, exhale: 5, rounds: 4, state: "Creativity" },
            { emoji: "💬", title: "Before Presentations or Discussions", duration: "2 min", desc: "Calm nerves and find your voice before speaking up.", inhale: 4, hold: 4, exhale: 6, rounds: 4, state: "Communication" },
            { emoji: "📝", title: "Before an Exam", duration: "3 min", desc: "Settle anxiety and access what you already know.", inhale: 4, hold: 7, exhale: 8, rounds: 5, state: "Test Anxiety" },
            { emoji: "🔥", title: "Mid-Semester Reset", duration: "4 min", desc: "When everything feels like too much — pause and recharge.", inhale: 5, hold: 5, exhale: 7, rounds: 6, state: "Burnout" },
            { emoji: "💭", title: "Processing Difficult Topics", duration: "3 min", desc: "Create space after emotionally heavy content or discussions.", inhale: 4, hold: 5, exhale: 6, rounds: 5, state: "Understanding Emotions" },
            { emoji: "🌱", title: "General Centering", duration: "2 min", desc: "A simple grounding exercise for any moment you need stillness.", inhale: 4, hold: 4, exhale: 4, rounds: 5, state: "Grounding" },
          ];
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
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2, color: C.sage }}>Wellness 🌿</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Your wellbeing matters. Teaching is a practice — and so is taking care of yourself.</div>
            </div>

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
                {/* Weekly check-in */}
                <div style={{ background: "#EAF3DE", borderRadius: 14, padding: "1.25rem", marginBottom: 16, border: `1px solid ${C.sage}22` }}>
                  <div style={{ fontFamily: F.display, fontSize: 18, color: C.sage, marginBottom: 8 }}>How are you feeling this week?</div>
                  <div style={{ display: "flex", gap: mob ? 10 : 14, marginBottom: wellnessMsg ? 12 : 0 }}>
                    {WELLNESS_EMOJIS.map((e, i) => (
                      <button key={i} onClick={() => handleWellnessCheckin(i + 1)}
                        style={{ fontSize: mob ? 28 : 34, background: wellnessScore === i + 1 ? `${C.sage}22` : "transparent", border: wellnessScore === i + 1 ? `2px solid ${C.sage}` : "2px solid transparent", borderRadius: "50%", width: mob ? 48 : 56, height: mob ? 48 : 56, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  {wellnessMsg && (
                    <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                      <div style={{ fontSize: 14, color: C.sage, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{wellnessMsg.message}</div>
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>💡 {wellnessMsg.tip}</div>
                    </div>
                  )}
                  {wellnessBurnoutFlag && (
                    <div style={{ background: C.roseLight, borderRadius: 8, padding: "8px 12px", marginTop: 10, fontSize: 13, color: C.rose, lineHeight: 1.5 }}>
                      You've had a tough few days. Be gentle with yourself. 🌿
                    </div>
                  )}
                </div>

                {/* Burnout risk tracker */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: F.display, fontSize: 17, color: C.navy, marginBottom: 12 }}>Your Last 4 Weeks</div>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10 }}>
                    {weeklyData.map((w, i) => (
                      <div key={i} style={{ background: w.avg === 0 ? C.ivoryDark : w.avg <= 2 ? C.roseLight : w.avg <= 3 ? "#FFF8E7" : "#EAF3DE", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{w.avg > 0 ? WELLNESS_EMOJIS[w.avg - 1] : "—"}</div>
                        <div style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted }}>{w.week}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{w.count} check-in{w.count !== 1 ? "s" : ""}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Faculty meditations */}
                <div style={{ fontFamily: F.display, fontSize: 17, color: C.navy, marginBottom: 12 }}>Guided Breathing for Faculty</div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {FACULTY_MEDITATIONS.map((m, i) => (
                    <Card key={i} style={{ background: "#EAF3DE", border: `1px solid ${C.sage}22` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontFamily: F.display, fontSize: 16, color: C.sage }}>{m.title}</div>
                        <Tag label={m.duration} color={C.sage} bg={`${C.sage}18`} />
                      </div>
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{m.desc}</div>
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
                  <div style={{ fontFamily: F.display, fontSize: 17, color: C.sage, marginBottom: 8 }}>What have you done to support the whole student this week?</div>
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
                    <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "12px 14px", marginTop: 10, fontSize: 14, color: C.sage, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {wellnessReflectionResult}
                    </div>
                  )}
                </Card>

                {/* Student exercises */}
                <div style={{ fontFamily: F.display, fontSize: 17, color: C.navy, marginBottom: 12 }}>Guided Exercises for Students</div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {STUDENT_MEDITATIONS.map((m, i) => (
                    <Card key={i} style={{ border: `1px solid ${C.sage}22` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 20, marginRight: 8 }}>{m.emoji}</span>
                          <span style={{ fontFamily: F.display, fontSize: 15, color: C.navy }}>{m.title}</span>
                        </div>
                        <Tag label={m.duration} color={C.sage} bg={`${C.sage}18`} />
                      </div>
                      <div style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.sage, marginBottom: 6 }}>{m.state}</div>
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{m.desc}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setBreathingOpen(m)}
                          style={{ background: C.sage, color: C.white, border: "none", borderRadius: 10, padding: "8px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          Begin
                        </button>
                        <button onClick={() => {
                          const text = `🌿 ${m.title} (${m.duration})\n\n${m.desc}\n\nTry this before ${m.state.toLowerCase()}: Close your eyes. Breathe in for ${m.inhale} seconds, hold for ${m.hold}, breathe out for ${m.exhale}. Repeat ${m.rounds} times.\n\n— Shared via KlasUp (klasup.com)`;
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
          const emptyForm = { course_code: "", course_name: "", section: "", semester_code: "", semester_start: "", num_weeks: 16 };
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
            }));
          }
          const pf = settingsProfileForm || {};
          const initials = (profile?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

          const inputStyle = { width: "100%", padding: "8px 10px", border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: F.body, fontSize: 13, boxSizing: "border-box", background: C.white };
          const labelStyle = { fontSize: 11, fontFamily: F.accent, fontWeight: 700, color: C.muted, display: "block", marginBottom: 4 };

          return (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Settings</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Manage your profile, courses, and account.</div>
            </div>

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
                    const updated = await upsertProfile(session.user.id, {
                      ...profile,
                      name: pf.name.trim(),
                      institution: pf.institution?.trim() || null,
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

            {/* ── SEMESTER SETTINGS (Courses) ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: F.display, fontSize: 20, color: C.navy }}>Semester Settings</div>
                {!isAdding && (
                  <button onClick={() => { setSettingsEditing("new"); setSettingsForm(emptyForm); }}
                    style={{ background: C.tealBright, color: C.white, border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    + Add Course
                  </button>
                )}
              </div>

              {dbCourses.length === 0 && !isAdding && (
                <div style={{ textAlign: "center", padding: "2rem", color: C.muted }}>
                  <div style={{ fontSize: 13 }}>No courses yet. Add your first course to get started.</div>
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
                            <label style={labelStyle}>Semester Code</label>
                            <input value={settingsForm.semester_code || ""} onChange={e => setSettingsForm(p => ({ ...p, semester_code: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Semester Start</label>
                            <input type="date" value={settingsForm.semester_start || ""} onChange={e => setSettingsForm(p => ({ ...p, semester_start: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Weeks</label>
                            <input type="number" min={1} max={52} value={settingsForm.num_weeks || 16} onChange={e => setSettingsForm(p => ({ ...p, num_weeks: e.target.value }))} style={inputStyle} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={async () => {
                            try {
                              await editCourse(c.id, { course_code: settingsForm.course_code.trim(), course_name: settingsForm.course_name.trim(), section: settingsForm.section.trim() || null, semester_code: settingsForm.semester_code.trim(), semester_start: settingsForm.semester_start || null, num_weeks: parseInt(settingsForm.num_weeks) || 16 });
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
                            <span>{c.semester_code}</span>
                            {c.semester_start && <span>Starts {new Date(c.semester_start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                            <span>{c.num_weeks || 16} weeks</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setSettingsEditing(c.id); setSettingsForm({ course_code: c.course_code, course_name: c.course_name, section: c.section || "", semester_code: c.semester_code, semester_start: c.semester_start || "", num_weeks: c.num_weeks || 16 }); }}
                            style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Edit</button>
                          <button onClick={async () => { if (confirm(`Remove ${c.course_code}?`)) { try { await removeCourse(c.id); } catch (err) { alert("Error: " + err.message); } } }}
                            style={{ background: C.roseLight, color: C.rose, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isAdding && (
                <div style={{ border: `1.5px solid ${C.tealBright}`, borderRadius: 12, padding: "1rem", marginBottom: 10, background: C.ivory }}>
                  <div style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, color: C.teal, marginBottom: 10 }}>New Course</div>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div><label style={labelStyle}>Course Code *</label><input value={settingsForm.course_code || ""} onChange={e => setSettingsForm(p => ({ ...p, course_code: e.target.value }))} placeholder="e.g. MKT 301" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Course Name *</label><input value={settingsForm.course_name || ""} onChange={e => setSettingsForm(p => ({ ...p, course_name: e.target.value }))} placeholder="e.g. Consumer Behavior" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Section</label><input value={settingsForm.section || ""} onChange={e => setSettingsForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. 001" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Semester Code *</label><input value={settingsForm.semester_code || ""} onChange={e => setSettingsForm(p => ({ ...p, semester_code: e.target.value }))} placeholder="e.g. Fall 2025" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Semester Start</label><input type="date" value={settingsForm.semester_start || ""} onChange={e => setSettingsForm(p => ({ ...p, semester_start: e.target.value }))} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Weeks</label><input type="number" min={1} max={52} value={settingsForm.num_weeks || 16} onChange={e => setSettingsForm(p => ({ ...p, num_weeks: e.target.value }))} style={inputStyle} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={!settingsForm.course_code?.trim() || !settingsForm.course_name?.trim() || !settingsForm.semester_code?.trim()}
                      onClick={async () => { try { await addCourseFromForm(settingsForm); setSettingsEditing(null); setSettingsForm({}); } catch (err) { alert("Error: " + err.message); } }}
                      style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: (!settingsForm.course_code?.trim() || !settingsForm.course_name?.trim() || !settingsForm.semester_code?.trim()) ? 0.4 : 1 }}>Save Course</button>
                    <button onClick={() => { setSettingsEditing(null); setSettingsForm({}); }}
                      style={{ background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
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
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Admin Panel</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Manage users, view analytics, and send announcements.</div>
            </div>

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
                  </Card>
                )}
                {adminEmbedResult && (
                  <Card style={{ marginBottom: 12, borderLeft: `4px solid ${adminEmbedResult.error ? C.rose : C.sage}` }}>
                    <div style={{ fontSize: 13, fontFamily: F.accent, fontWeight: 700, color: adminEmbedResult.error ? C.rose : C.sage }}>
                      {adminEmbedResult.error ? `Error: ${adminEmbedResult.error}` : adminEmbedResult.message}
                    </div>
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
                  features: ["1 course", "Basic health score (current week)", "2 micro-learnings/month", "Post-class notes & announcements", "Think Tank (read only)", "Career Connections (1 role preview)"],
                  locked: ["Assignment Builder", "Slide Studio", "Full Career Connections + share cards", "Historical trending", "Full upload suite", "Accreditation reports"],
                  cta: "Get Started Free",
                },
                {
                  key: "pro", name: "Pro", sub: "The Practice", price: "$15", period: "/month per faculty", color: C.tealBright, featured: true,
                  features: ["All courses", "Full trending — week, class & semester", "All 10 health dimensions", "Assignment Builder with AI feedback", "Slide Studio with UDL analysis", "Full Career Connections + student share cards", "Full upload suite (9 categories)", "Full micro-learning library with citations", "Learning Outcome Alignment", "Metacognitive & UDL tracking", "Wellbeing & Student Voice signals", "Think Tank — full participation", "Self-generated reports"],
                  locked: ["Institutional dashboard", "Aggregated analytics", "NECHE/HLC/SACSCOC export templates"],
                  cta: "Start Free Trial",
                },
                {
                  key: "institutional", name: "Institutional", sub: "The Standard", price: "Custom", period: "per-seat licensing", color: C.navy,
                  features: ["Everything in Pro for all faculty", "Aggregated institutional dashboard", "Anonymized cross-faculty analytics", "Full accreditation report export (NECHE, HLC, SACSCOC)", "Career Connections workforce alignment doc", "New faculty onboarding track", "Peer institution benchmarking", "LMS integration support", "Custom branding", "Dedicated success manager"],
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
            <div style={{ background: C.goldLight, border: `0.5px solid ${C.gold}44`, borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 6 }}>The Provost Pitch</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>KlasUp Institutional costs less than a single faculty development workshop — and produces a continuous, documented record of pedagogical growth tied directly to NECHE, HLC, and SACSCOC standards, with workforce alignment evidence built in. No other tool does this.</div>
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

      {/* ── BREATHING GUIDE MODAL ── */}
      {breathingOpen && (() => {
        const m = breathingOpen;
        const totalSeconds = (m.inhale + m.hold + m.exhale) * m.rounds;
        const cycleSeconds = m.inhale + m.hold + m.exhale;

        const BreathingGuide = () => {
          const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
          const [phase, setPhase] = useState("in"); // "in" | "hold" | "out"
          const [cyclePos, setCyclePos] = useState(0);

          useEffect(() => {
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
          }, []);

          const mins = Math.floor(secondsLeft / 60);
          const secs = secondsLeft % 60;
          const circleScale = phase === "in" ? 1.4 : phase === "hold" ? 1.4 : 0.85;
          const phaseText = phase === "in" ? "Breathe in..." : phase === "hold" ? "Hold..." : "Breathe out...";
          const done = secondsLeft <= 0;

          return (
            <div style={{
              position: "fixed", inset: 0, zIndex: 10000,
              background: "rgba(15,31,61,0.95)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", padding: 24,
            }}>
              <div style={{ fontFamily: F.display, fontSize: mob ? 20 : 24, color: C.white, marginBottom: 6 }}>{m.title}</div>
              <div style={{ fontSize: 13, color: C.tealMid, marginBottom: 40, fontFamily: F.accent, fontWeight: 600 }}>{m.duration}</div>

              {/* Breathing circle */}
              <div style={{
                width: mob ? 160 : 200, height: mob ? 160 : 200, borderRadius: "50%",
                background: `radial-gradient(circle, ${C.sage}44 0%, ${C.sage}11 70%, transparent 100%)`,
                border: `3px solid ${C.sage}88`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transform: `scale(${done ? 1 : circleScale})`,
                transition: phase === "in" ? `transform ${m.inhale}s ease-in-out` : phase === "hold" ? "none" : `transform ${m.exhale}s ease-in-out`,
                marginBottom: 32,
              }}>
                <div style={{ fontFamily: F.display, fontSize: done ? 20 : 18, color: C.white, textAlign: "center" }}>
                  {done ? "Well done 🌿" : phaseText}
                </div>
              </div>

              {/* Instructions */}
              {!done && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 20 }}>
                  In for {m.inhale}s · Hold for {m.hold}s · Out for {m.exhale}s
                </div>
              )}

              {/* Timer */}
              <div style={{ fontFamily: F.accent, fontSize: 28, fontWeight: 700, color: done ? C.sage : C.tealMid, marginBottom: 32 }}>
                {done ? "" : `${mins}:${secs.toString().padStart(2, "0")}`}
              </div>

              <button onClick={() => setBreathingOpen(null)}
                style={{ background: "rgba(255,255,255,0.1)", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 10, padding: "10px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, color: C.white, cursor: "pointer", minHeight: 44 }}>
                {done ? "Close" : "End Session"}
              </button>
            </div>
          );
        };

        return <BreathingGuide />;
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
              <button onClick={() => setSageOpen(false)}
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
                          background: isSelected ? "#2A9D8F" : "#F0F0F0",
                          color: isSelected ? "#fff" : C.text,
                          border: isSelected ? "2px solid #2A9D8F" : "2px solid #D0D0D0",
                          borderRadius: 16, padding: "5px 12px",
                          fontFamily: F.body, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                        <span style={{ fontSize: 11 }}>{isSelected ? "\u2713" : ""}</span>
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
                placeholder="What's on your mind today? Anything I can help with?"
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
                  <WCS course={course} setCourse={setCourse} week={week} setWeek={setWeek} courses={dbCourses} />

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
                        semesterStart: courseObj?.semester_start || null,
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
                          <div style={{ fontSize: 12, color: C.muted }}>Reading your semester calendar and building a complete document with real dates</div>
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
                            printWin.document.write(`<html><head><title>${course} Assignment</title><style>body{font-family:'Nunito',sans-serif;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.7;color:#0F1F3D}h1,h2,h3{font-family:'Fredoka One',cursive}pre{white-space:pre-wrap;font-family:'Nunito',sans-serif;font-size:14px}</style></head><body><pre>${assignDocResult}</pre></body></html>`);
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
