import { useState } from "react";
import { generateMicroLearning, generateSemesterReflection } from "./anthropic";

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
  display: "'DM Serif Display', Georgia, serif",
  body: "'Nunito', 'Segoe UI', sans-serif",
  accent: "'Quicksand', 'Nunito', sans-serif",
};

const COURSES = ["MKT 301", "MKT 410", "BUS 201"];
const WEEKS = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);
const NAV = [
  { id: "Dashboard", icon: "⊞" },
  { id: "My Course", icon: "◎" },
  { id: "Assignment Builder", icon: "✏" },
  { id: "Slide Studio", icon: "◫" },
  { id: "Micro-Learning", icon: "◉" },
  { id: "Think Tank", icon: "◈" },
  { id: "Course Portfolio", icon: "◆" },
  { id: "Reports", icon: "☑" },
  { id: "Pricing", icon: "◇" },
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
  { label: "Announcements", icon: "◎", desc: "Posted announcements", tier: "free" },
  { label: "Assignments", icon: "☑", desc: "Assignment sheets & rubrics", tier: "pro" },
  { label: "Discussions", icon: "◉", desc: "Discussion prompts & threads", tier: "pro" },
  { label: "Learning Outcomes", icon: "◇", desc: "Syllabus & course outcomes", tier: "pro" },
  { label: "Post-class notes", icon: "✏", desc: "Reflections after each session", tier: "free" },
  { label: "Student Voice", icon: "◈", desc: "Anonymized mid-semester themes", tier: "pro" },
];

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

const WCS = ({ course, setCourse, week, setWeek }) => (
  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
    <select value={course} onChange={e => setCourse(e.target.value)}
      style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.navy, cursor: "pointer" }}>
      {COURSES.map(c => <option key={c}>{c}</option>)}
    </select>
    <select value={week} onChange={e => setWeek(e.target.value)}
      style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.teal, cursor: "pointer" }}>
      {WEEKS.map(w => <option key={w}>{w}</option>)}
    </select>
    <div style={{ fontSize: 11, fontFamily: F.accent, color: C.sage, fontWeight: 700, padding: "5px 10px", background: C.sageLight, borderRadius: 8 }}>● Auto-tagged</div>
  </div>
);

export default function KlasUp() {
  const [page, setPage] = useState("Dashboard");
  const [tier, setTier] = useState("free");
  const [course, setCourse] = useState("MKT 301");
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
  const [portfolioCourse, setPortfolioCourse] = useState("MKT 301");
  const [portfolioWeek, setPortfolioWeek] = useState("All");
  const [portfolioExpanded, setPortfolioExpanded] = useState({});
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState(null);
  const [reflectionEditing, setReflectionEditing] = useState(false);
  const [microRatings, setMicroRatings] = useState({});
  const [postUpvotes, setPostUpvotes] = useState({});

  const can = t => ["free", "pro", "institutional"].indexOf(tier) >= ["free", "pro", "institutional"].indexOf(t);
  const upgrade = () => setPage("Pricing");
  const cd = CAREER_DATA[course] || CAREER_DATA["MKT 301"];

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

  const snap = [
    { label: "Discussion prompt uploaded", ok: true },
    { label: "Post-class notes added", ok: true },
    { label: "UDL gap detected in Slide 4", ok: false },
    { label: "No metacognitive prompt this week", ok: false },
    { label: "Assignment milestone set", ok: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text, display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: C.navy, display: "flex", flexDirection: "column", padding: "0", position: "sticky", top: 0, height: "100vh", flexShrink: 0, overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: C.tealBright, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, color: C.navy, fontWeight: 700 }}>K</div>
            <div style={{ fontFamily: F.display, fontSize: 22, color: C.white }}>KlasUp</div>
          </div>
          <div style={{ fontSize: 11, color: C.tealMid, fontStyle: "italic", paddingLeft: 42 }}>Where every class gets better.</div>
        </div>

        {/* Tier switcher */}
        <div style={{ margin: "0.75rem 0.75rem 0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.5rem" }}>
          <div style={{ fontSize: 9, fontFamily: F.accent, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 4, paddingLeft: 2, letterSpacing: "0.05em" }}>DEMO — VIEWING AS</div>
          {[["free", "Free"], ["pro", "Pro"], ["institutional", "Institutional"]].map(([k, v]) => (
            <button key={k} onClick={() => setTier(k)} style={{ display: "block", width: "100%", textAlign: "left", background: tier === k ? `${C.tealBright}22` : "none", border: "none", color: tier === k ? C.tealBright : "rgba(255,255,255,0.4)", fontFamily: F.accent, fontWeight: tier === k ? 700 : 400, fontSize: 12, padding: "4px 8px", borderRadius: 6, cursor: "pointer", marginBottom: 1 }}>
              {tier === k ? "● " : "○ "}{v}
            </button>
          ))}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, paddingTop: 4 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: page === n.id ? `${C.tealBright}18` : "none", border: "none", borderLeft: page === n.id ? `3px solid ${C.tealBright}` : "3px solid transparent", color: page === n.id ? C.white : "rgba(255,255,255,0.45)", fontFamily: F.body, fontSize: 13, fontWeight: page === n.id ? 600 : 400, textAlign: "left", padding: "0.55rem 1.25rem", cursor: "pointer" }}>
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
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "2rem", overflowY: "auto", maxWidth: page === "My Course" || page === "Course Portfolio" ? 1200 : 900 }}>

        {/* Notification bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, position: "relative" }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: C.navy, border: "none", cursor: "pointer", fontSize: 22, fontWeight: 900, padding: "4px 10px", borderRadius: 8, color: C.tealBright, lineHeight: 1 }}>
            ↑
            <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, background: C.rose, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: C.white, fontFamily: F.accent }}>7</div>
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", top: 36, right: 0, width: 360, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
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

        {/* ── DASHBOARD ── */}
        {page === "Dashboard" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 28, marginBottom: 2 }}>Good morning, Dr. Chen</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Week 8 of Fall 2025 · {can("pro") ? "8 insights" : "2 insights"} ready for you</div>
            </div>

            {/* Snapshot */}
            <Card style={{ marginBottom: 14, borderLeft: `4px solid ${C.tealBright}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 1 }}>Week 8 Snapshot — MKT 301</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Auto-generated · Updated Sunday night</div>
                </div>
                <Tag label="This Week" color={C.teal} bg={C.tealLight} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {snap.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ color: s.ok ? C.sage : C.rose, fontWeight: 700 }}>{s.ok ? "✓" : "⚑"}</span>
                    <span style={{ color: s.ok ? C.text : C.rose }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: C.ivory, borderRadius: 8, padding: "0.65rem", fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: C.navy }}>Priority this week: </span>
                <span style={{ color: C.muted }}>Add a metacognitive exit ticket to Week 9 — highest-impact move based on your current pattern.</span>
              </div>
            </Card>

            {/* Up Score */}
            <Card style={{ marginBottom: 14, background: C.navy, border: "none", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, background: `${C.tealBright}12`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <ScoreRing score={83} size={90} color={C.tealBright} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: C.white }}>Your Up Score</div>
                    <Tag label="+31 pts this semester" color={C.tealBright} bg={`${C.tealBright}22`} />
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 10 }}>Composite score across all courses, uploads, engagement, and pedagogical growth.</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[{ label: "Uploads", val: "23" }, { label: "Weeks Active", val: "8" }, { label: "Dimensions Tracked", val: can("pro") ? "10" : "3" }, { label: "Courses", val: can("pro") ? "3" : "1" }].map((s, i) => (
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginBottom: 14 }}>
              {[{ name: "MKT 301", score: 83, trend: "+11" }, { name: "MKT 410", score: 71, trend: "+6" }, { name: "BUS 201", score: 67, trend: "+3" }].map((c, i) => (
                <Card key={i} style={{ position: "relative", overflow: "hidden" }}>
                  {i > 0 && !can("pro") && <LockOverlay onUpgrade={upgrade} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                      <div style={{ fontFamily: F.display, fontSize: 28, color: C.teal }}>{c.score}</div>
                      <div style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>{c.trend} this semester</div>
                    </div>
                    <ScoreRing score={c.score} />
                  </div>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Card>
                <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>WEEK OVER WEEK — MKT 301</div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: C.white }}>Career Connections</div>
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
                  <button style={{ flex: 1, background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10, padding: "9px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Copy Text</button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── MY COURSE ── */}
        {page === "My Course" && (() => {
          const hasMicro = Object.keys(microHistory).length > 0 || aiMicroLoading;
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
          const allEntries = Object.entries(microHistory).flatMap(([cat, entries]) =>
            entries.map(e => ({ ...e, category: cat }))
          );
          const newest = allEntries.length > 0
            ? allEntries.reduce((a, b) => a.timestamp > b.timestamp ? a : b)
            : null;
          return (
          <div style={{ display: "flex", gap: 20 }}>
            {/* Left column — uploads + score breakdown */}
            <div style={{ flex: hasMicro ? "0 0 55%" : "1 1 100%", minWidth: 0, transition: "flex 0.3s ease" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>My Course</div>
                <div style={{ color: C.muted, fontSize: 14 }}>The more you put in, the more KlasUp gives back.</div>
              </div>
              <WCS course={course} setCourse={setCourse} week={week} setWeek={setWeek} />
              <div style={{ display: "grid", gridTemplateColumns: hasMicro ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
                {UPLOADS.map((u, i) => {
                  const locked = !can(u.tier);
                  return (
                    <div key={i} style={{ position: "relative", background: C.white, border: uploadOpen === u.label ? `1.5px solid ${C.tealBright}` : `0.5px solid ${C.border}`, borderRadius: 14, padding: "1rem", cursor: locked ? "default" : "pointer", overflow: "hidden" }}
                      onClick={() => !locked && setUploadOpen(uploadOpen === u.label ? null : u.label)}>
                      {locked && <LockOverlay onUpgrade={upgrade} />}
                      <div style={{ fontSize: 18, marginBottom: 5 }}>{u.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{u.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{u.desc}</div>
                      <div style={{ fontSize: 10, fontFamily: F.accent, color: C.teal, fontWeight: 700 }}>{course} · {week}</div>
                      {uploaded[u.label] > 0 && <div style={{ fontSize: 11, color: C.sage, fontWeight: 700, marginTop: 4 }}>{uploaded[u.label]} added ✓</div>}
                      {uploadOpen === u.label && (
                        <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
                          <textarea placeholder={`Add your ${u.label.toLowerCase()} here...`} rows={3}
                            value={uploadText}
                            onChange={e => setUploadText(e.target.value)}
                            style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 8, fontFamily: F.body, fontSize: 12, resize: "none", boxSizing: "border-box", background: C.ivory }} />
                          <button onClick={() => {
                            const text = uploadText.trim();
                            setUploaded(p => ({ ...p, [u.label]: (p[u.label] || 0) + 1 }));
                            setUploadOpen(null);
                            setUploadText("");
                            if (text) {
                              setUploadLog(prev => [{ content: text, category: u.label, course, week, timestamp: Date.now() }, ...prev]);
                              setAiMicroLoading(true);
                              setAiMicroError(null);
                              generateMicroLearning({ content: text, category: u.label, course, week })
                                .then(recs => {
                                  setAiMicro(recs);
                                  setAiMicroLoading(false);
                                  setMicroHistory(prev => ({
                                    ...prev,
                                    [u.label]: [
                                      { recs, week, course, timestamp: Date.now() },
                                      ...(prev[u.label] || []),
                                    ],
                                  }));
                                })
                                .catch(err => { console.error(err); setAiMicroError(err.message); setAiMicroLoading(false); });
                            }
                          }}
                            style={{ marginTop: 6, background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "6px 16px", fontFamily: F.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                            Submit to KlasUp
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Card>
                <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 14 }}>UP SCORE BREAKDOWN — {course} · {week}</div>
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
              </Card>
            </div>

            {/* Right column — live micro-learning panel */}
            {hasMicro && (
              <div style={{ flex: "0 0 42%", minWidth: 0 }}>
                <div style={{ position: "sticky", top: 20 }}>
                  <div style={{ background: C.navy, borderRadius: 14, overflow: "hidden" }}>
                    {/* Panel header */}
                    <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, background: C.tealBright, borderRadius: "50%", boxShadow: `0 0 6px ${C.tealBright}` }} />
                        <span style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: C.tealBright, letterSpacing: "0.05em" }}>LIVE MICRO-LEARNING</span>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>AI recommendations update as you upload</div>
                    </div>

                    <div style={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
                      {/* Loading state */}
                      {aiMicroLoading && (
                        <div style={{ padding: "1.25rem", textAlign: "center" }}>
                          <div style={{ fontSize: 22, marginBottom: 8, animation: "spin 1.5s linear infinite", color: C.tealBright }}>◉</div>
                          <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.tealBright, fontSize: 12, marginBottom: 4 }}>Analyzing your content...</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Generating personalized recommendations</div>
                          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                        </div>
                      )}

                      {/* Error state */}
                      {aiMicroError && (
                        <div style={{ margin: "0.75rem", background: "rgba(196,104,122,0.15)", border: `0.5px solid ${C.rose}`, borderRadius: 10, padding: "0.75rem 1rem" }}>
                          <div style={{ fontFamily: F.accent, fontWeight: 700, color: C.rose, fontSize: 12, marginBottom: 3 }}>Could not generate recommendations</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{aiMicroError}</div>
                        </div>
                      )}

                      {/* Newest recommendation highlighted at top */}
                      {newest && !aiMicroLoading && (
                        <div style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ background: `${C.tealBright}18`, border: `1px solid ${C.tealBright}44`, borderRadius: 12, padding: "1rem", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                              <span style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, color: C.navy, background: C.tealBright, padding: "2px 8px", borderRadius: 20 }}>New · {newest.week}</span>
                              <span style={{ fontSize: 10, fontFamily: F.accent, color: "rgba(255,255,255,0.5)" }}>{newest.category} · {newest.course}</span>
                            </div>
                            {newest.recs.slice(0, 1).map((m, i) => {
                              const tc = TAG_COLORS[m.tag] || { color: C.teal, bg: C.tealLight };
                              return (
                                <div key={i}>
                                  <div style={{ marginBottom: 8 }}>
                                    <Tag label={m.tag} color={tc.color} bg={tc.bg} />
                                  </div>
                                  <div style={{ fontFamily: F.display, fontSize: 15, color: C.white, marginBottom: 6 }}>{m.title}</div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.55, marginBottom: 8 }}>{m.summary}</div>
                                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.5rem 0.75rem", marginBottom: 8 }}>
                                    <div style={{ fontSize: 9, fontFamily: F.accent, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 2 }}>RESEARCH</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>{m.article}</div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 3, height: 24, background: C.tealBright, borderRadius: 2 }} />
                                    <div style={{ fontSize: 12, color: C.tealBright, fontWeight: 600 }}>Try this: <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>{m.action}</span></div>
                                  </div>
                                  <StarRating ratingKey={`newest-${i}`} dark />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Category sections */}
                      {Object.entries(microHistory).map(([category, entries]) => {
                        const isOpen = panelSections[category] !== false;
                        const totalRecs = entries.reduce((sum, e) => sum + e.recs.length, 0);
                        return (
                          <div key={category}>
                            <button onClick={() => setPanelSections(p => ({ ...p, [category]: !isOpen }))}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "rgba(255,255,255,0.04)", border: "none", borderTop: "0.5px solid rgba(255,255,255,0.08)", padding: "0.7rem 1.25rem", cursor: "pointer" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▶</span>
                                <span style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, color: C.white }}>{category}</span>
                                <span style={{ fontSize: 10, fontFamily: F.accent, color: C.tealBright, fontWeight: 700, background: `${C.tealBright}22`, padding: "1px 7px", borderRadius: 10 }}>{totalRecs}</span>
                              </div>
                              <span style={{ fontSize: 10, fontFamily: F.accent, color: "rgba(255,255,255,0.3)" }}>{entries.length} upload{entries.length !== 1 ? "s" : ""}</span>
                            </button>
                            {isOpen && (
                              <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                                {entries.map((entry, ei) => (
                                  <div key={ei} style={{ marginBottom: ei < entries.length - 1 ? 10 : 0 }}>
                                    <div style={{ fontSize: 10, fontFamily: F.accent, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                                      {ei === 0 && entry.timestamp === newest?.timestamp && <span style={{ width: 5, height: 5, background: C.tealBright, borderRadius: "50%", display: "inline-block" }} />}
                                      {entry.course} · {entry.week}
                                    </div>
                                    {entry.recs.map((m, mi) => {
                                      const tc = TAG_COLORS[m.tag] || { color: C.teal, bg: C.tealLight };
                                      return (
                                        <div key={mi} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "0.75rem", marginBottom: 6 }}>
                                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                            <Tag label={m.tag} color={tc.color} bg={tc.bg} />
                                          </div>
                                          <div style={{ fontFamily: F.display, fontSize: 13, color: C.white, marginBottom: 4 }}>{m.title}</div>
                                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 6 }}>{m.summary}</div>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{ width: 3, height: 18, background: tc.color, borderRadius: 2 }} />
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{m.action}</div>
                                          </div>
                                          <StarRating ratingKey={`panel-${category}-${ei}-${mi}`} dark />
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Empty state while loading first result */}
                      {Object.keys(microHistory).length === 0 && aiMicroLoading && (
                        <div style={{ padding: "0 1.25rem 1.25rem", fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                          Your first recommendations will appear here momentarily.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── ASSIGNMENT BUILDER ── */}
        {page === "Assignment Builder" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Assignment Builder</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Write, scaffold, and align — with AI feedback as you go.</div>
            </div>
            {!can("pro") ? (
              <Card style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 8 }}>Assignment Builder is a Pro feature</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Build assignments with AI feedback on Bloom's level, scaffolding, clarity, and outcome alignment.</div>
                <button onClick={upgrade} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "10px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Upgrade to Pro ↗</button>
              </Card>
            ) : (
              <div>
                <WCS course={course} setCourse={setCourse} week={week} setWeek={setWeek} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Card>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>ASSIGNMENT TYPE</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["Case Study", "Team Project", "Group Work", "Socratic Seminar", "Active Learning", "Individual Essay", "Research Paper", "Presentation", "Reflection", "Discussion Post"].map(t => (
                          <button key={t} onClick={() => setAssignType(assignType === t ? "" : t)}
                            style={{ fontSize: 12, fontFamily: F.accent, fontWeight: assignType === t ? 700 : 400, padding: "5px 12px", borderRadius: 20, border: assignType === t ? `1.5px solid ${C.tealBright}` : `0.5px solid ${C.border}`, background: assignType === t ? C.tealLight : C.ivory, color: assignType === t ? C.teal : C.muted, cursor: "pointer" }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </Card>
                    <Card>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>ASSIGNMENT PROMPT</div>
                      <textarea value={assignText} onChange={e => setAssignText(e.target.value)} placeholder="Write your assignment prompt here. Be specific about what students should produce, how they should think, and what success looks like..." rows={6}
                        style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 10, fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box", background: C.ivory, lineHeight: 1.6 }} />
                    </Card>
                    <Card>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>LEARNING OUTCOME ALIGNMENT</div>
                      {OUTCOMES.map((o, i) => (
                        <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginBottom: 8, cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedOutcomes.includes(i)} onChange={() => setSelectedOutcomes(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])} style={{ marginTop: 2 }} />
                          <span>{o}</span>
                        </label>
                      ))}
                    </Card>
                    <Card>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>MILESTONES & CHECKPOINTS</div>
                      {milestones.map((m, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: C.sage, fontWeight: 700 }}>✓</span>
                          <input value={m} onChange={e => setMilestones(p => p.map((x, j) => j === i ? e.target.value : x))}
                            style={{ flex: 1, border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "5px 8px", fontFamily: F.body, fontSize: 12, background: C.ivory }} />
                          <button onClick={() => setMilestones(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.rose, cursor: "pointer", fontSize: 16 }}>×</button>
                        </div>
                      ))}
                      <button onClick={() => setMilestones(p => [...p, "New milestone"])} style={{ fontSize: 12, color: C.teal, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: F.body }}>+ Add milestone</button>
                    </Card>
                    <button onClick={genFeedback} style={{ background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "11px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Get AI Feedback ↗</button>
                  </div>
                  <Card style={{ background: C.navy, border: "none" }}>
                    <div style={{ fontFamily: F.accent, fontSize: 11, color: C.tealMid, fontWeight: 700, marginBottom: 12 }}>AI FEEDBACK PANEL</div>
                    {!aiFeedback ? (
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic", padding: "2.5rem 0", textAlign: "center" }}>Write your prompt and click "Get AI Feedback" to see your analysis.</div>
                    ) : (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
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
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SLIDE STUDIO ── */}
        {page === "Slide Studio" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Slide Studio</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Upload your deck — KlasUp analyses UDL, alignment, and active learning opportunities.</div>
            </div>
            {!can("pro") ? (
              <Card style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 8 }}>Slide Studio is a Pro feature</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Upload your decks for UDL scoring, text density flags, reuse detection, and active learning analysis.</div>
                <button onClick={upgrade} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 10, padding: "10px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Upgrade to Pro ↗</button>
              </Card>
            ) : (
              <div>
                <WCS course={course} setCourse={setCourse} week={week} setWeek={setWeek} />
                {!deckUploaded ? (
                  <Card style={{ textAlign: "center", padding: "2.5rem", border: `1.5px dashed ${C.tealBright}` }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>◫</div>
                    <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 4 }}>Upload your deck for {course} · {week}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Accepts .pptx, .ppt, .pdf, and .key files</div>
                    <label style={{ display: "inline-block", background: C.tealBright, color: C.white, borderRadius: 10, padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Choose File
                      <input type="file" accept=".pptx,.ppt,.pdf,.key" style={{ display: "none" }} onChange={(e) => { if (e.target.files.length > 0) setDeckUploaded(true); }} />
                    </label>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>or drag and drop here</div>
                  </Card>
                ) : (
                  <div>
                    <Card style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontFamily: F.display, fontSize: 18 }}>{course} — {week} Deck</div>
                          <div style={{ fontSize: 12, color: C.muted }}>7 slides · analysed today</div>
                        </div>
                        <button onClick={() => setDeckUploaded(false)} style={{ fontSize: 12, color: C.rose, background: "none", border: `0.5px solid ${C.rose}44`, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>Replace deck</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
                        {[{ label: "UDL Score", val: "71", color: C.sage }, { label: "Text Density", val: "High", color: C.rose }, { label: "Active Moments", val: "3/7", color: C.tealBright }, { label: "Outcome Alignment", val: "80%", color: C.sage }].map((s, i) => (
                          <div key={i} style={{ background: C.ivoryDark, borderRadius: 10, padding: "0.75rem" }}>
                            <div style={{ fontSize: 10, fontFamily: F.accent, color: C.muted, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                            <div style={{ fontSize: 18, fontFamily: F.display, color: s.color }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 12 }}>SLIDE-BY-SLIDE BREAKDOWN</div>
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
                    </Card>

                    {/* Learning Outcomes */}
                    <Card style={{ marginTop: 14 }}>
                      <div style={{ fontFamily: F.accent, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>LEARNING OUTCOME ALIGNMENT</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Select which course outcomes this deck addresses — shared with Assignment Builder.</div>
                      {OUTCOMES.map((o, i) => (
                        <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginBottom: 8, cursor: "pointer" }}>
                          <input type="checkbox" checked={slideOutcomes.includes(i)} onChange={() => setSlideOutcomes(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])} style={{ marginTop: 2 }} />
                          <span>{o}</span>
                        </label>
                      ))}
                      <div style={{ fontSize: 11, color: C.sage, fontWeight: 600, marginTop: 4 }}>{slideOutcomes.length} of {OUTCOMES.length} outcomes mapped</div>
                    </Card>

                    {/* AI Feedback */}
                    <Card style={{ marginTop: 14, background: C.navy, border: "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontFamily: F.accent, fontSize: 11, color: C.tealMid, fontWeight: 700 }}>AI DECK ANALYSIS</div>
                        <button onClick={() => setSlideFeedback({
                          engagement: 68,
                          cognitiveLoad: "Moderate-High",
                          pacing: 74,
                          outcomesCovered: slideOutcomes.length,
                          suggestions: [
                            "Slides 2 and 6 have high text density — consider breaking into two slides or adding a visual.",
                            "Slide 4 is reused from Week 3 — review for currency and relevance to this week's theme.",
                            slideOutcomes.length === 0 ? "No learning outcomes mapped yet — align slides to at least 2 outcomes for accreditation readiness." : `${slideOutcomes.length} outcome${slideOutcomes.length > 1 ? "s" : ""} mapped — strong alignment signal.`,
                            "Consider adding a retrieval moment after Slide 3 to reinforce the case study before moving to models.",
                            "Exit ticket on Slide 7 is excellent — this anchors metacognition at the end of the session.",
                          ],
                        })} style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: C.tealBright, color: C.navy, border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer" }}>
                          Analyse Deck
                        </button>
                      </div>
                      {!slideFeedback ? (
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic", padding: "2rem 0", textAlign: "center" }}>Click "Analyse Deck" to get AI-powered feedback on engagement, pacing, and outcome alignment.</div>
                      ) : (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                            {[
                              { label: "Engagement Score", val: `${slideFeedback.engagement}/100`, color: slideFeedback.engagement > 70 ? C.tealMid : "#F4C0D1" },
                              { label: "Cognitive Load", val: slideFeedback.cognitiveLoad, color: slideFeedback.cognitiveLoad === "Moderate-High" ? "#F4C0D1" : C.tealMid },
                              { label: "Pacing Score", val: `${slideFeedback.pacing}/100`, color: slideFeedback.pacing > 70 ? C.tealMid : "#F4C0D1" },
                              { label: "Outcomes Covered", val: `${slideFeedback.outcomesCovered}/${OUTCOMES.length}`, color: slideFeedback.outcomesCovered > 0 ? C.tealMid : "#F4C0D1" },
                            ].map((s, i) => (
                              <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.7rem" }}>
                                <div style={{ fontSize: 10, fontFamily: F.accent, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.accent, color: s.color }}>{s.val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontFamily: F.accent, fontSize: 11, color: C.tealMid, fontWeight: 700, marginBottom: 8 }}>SUGGESTIONS</div>
                          {slideFeedback.suggestions.map((s, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 10, lineHeight: 1.5 }}>
                              <span style={{ color: C.tealBright, flexShrink: 0 }}>→</span><span>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                )}
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
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Try this: <span style={{ fontWeight: 400 }}>{m.action}</span></div>
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
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Try this: <span style={{ fontWeight: 400 }}>{m.action}</span></div>
                  </div>
                  <StarRating ratingKey={`default-${i}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── COHORT FORUM ── */}
        {page === "Think Tank" && (
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
                        <textarea rows={2} placeholder="Share your experience..."
                          style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 8, fontFamily: F.body, fontSize: 13, resize: "none", boxSizing: "border-box", background: C.ivory }} />
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
        {page === "Reports" && (
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Reports</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Accreditation-ready documentation of faculty growth and engagement.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginBottom: 20 }}>
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
            {can("pro") && <button style={{ marginTop: 8, background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Export Accreditation Report ↓</button>}
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
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 26, marginBottom: 2 }}>Course Portfolio</div>
              <div style={{ color: C.muted, fontSize: 14 }}>Your complete semester record — uploads, AI insights, and reflective narrative.</div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <select value={portfolioCourse} onChange={e => setPortfolioCourse(e.target.value)}
                style={{ fontFamily: F.accent, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.white, color: C.navy, cursor: "pointer" }}>
                {COURSES.map(c => <option key={c}>{c}</option>)}
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
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
                      <button onClick={() => {
                        const blob = new Blob([reflectionText], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${portfolioCourse.replace(/ /g, "_")}_Semester_Reflection.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                        style={{ fontSize: 11, fontFamily: F.accent, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        Export ↓
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
                      <textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)}
                        style={{ width: "100%", minHeight: 400, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.tealBright}44`, borderRadius: 10, padding: "1rem", fontFamily: F.body, fontSize: 13, color: C.white, lineHeight: 1.75, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
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

        {/* ── PRICING ── */}
        {page === "Pricing" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontFamily: F.display, fontSize: 32, marginBottom: 6 }}>Simple, transparent pricing.</div>
              <div style={{ color: C.muted, fontSize: 15 }}>Start free. Grow with your practice. Scale with your institution.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
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
    </div>
  );
}
