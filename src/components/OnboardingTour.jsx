import { useState } from "react";

const C = {
  navy: "#1B2B4B", navyMid: "#1A3260",
  teal: "#0B8A8A", tealBright: "#0FB5B5", tealLight: "#D6F5F5",
  ivory: "#FAF8F4", ivoryDark: "#F0EDE6",
  white: "#FFFFFF", text: "#0F1F3D", muted: "#4A5568",
};

const F = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
  accent: "'Manrope', sans-serif",
};

const STEPS = [
  {
    emoji: "🎉",
    heading: "Welcome to KlasUp.",
    body: "KlasUp is your AI teaching partner, built by someone who has seen higher ed from many angles — adjunct, faculty, the dean's office, a center for teaching and learning, and academic affairs. You're an expert in your field; no one trained any of us to teach it, or to support the whole student behind the work. That's what KlasUp is for. This is your home base — your courses, your weekly Career Connections, and what you've been working on, all in one place.",
  },
  {
    emoji: "💡",
    heading: "Teach smarter. Not harder.",
    body: "Bring in what you're already teaching — assignments, announcements, your syllabus — and KlasUp gives you personalized, research-backed micro-learnings to help every class get a little better.",
  },
  {
    emoji: "👤",
    heading: "Set up your profile.",
    body: "A few details — your institution, role, and LMS — help KlasUp fit how you actually teach. Takes about two minutes.",
    profileStep: true,
  },
  {
    emoji: "📄",
    heading: "Start with your syllabus.",
    body: "The fastest way to feel what KlasUp does: import your syllabus and watch it become your course — outcomes, weeks, and assignments — in moments. It's the quickest path from \"empty\" to \"this is mine.\"",
    syllabusStep: true,
  },
  {
    emoji: "📝",
    heading: "Build in Pedagogy Studio.",
    body: "Inside Course Architect, Pedagogy Studio is where you design assignments and lessons — with plain-English tools and feedback from Klas. Drop in what you're teaching and you'll get micro-learning recommendations backed by peer-reviewed research, with real citations you can click and read.",
  },
  {
    emoji: "🌿",
    heading: "Meet Klas, bottom-right.",
    body: "See that bubble in the corner? That's Klas, your teaching partner — always one click away. Ask about course design, an assignment, or anything you want to brainstorm from a pedagogy standpoint. Calm, research-informed, and always in your corner.",
  },
  {
    emoji: "📚",
    heading: "And there's more when you want it.",
    body: "Course Architect maps your whole term at a glance. Micro-Learning gives you bite-sized, research-backed tips. Pedagogical Resources connects you to peer-reviewed articles and top university teaching centers. And Wellness? That's for you — because good teachers are always learning.",
    finalStep: true,
  },
];

export default function OnboardingTour({ onComplete, onGoToProfile, onGoToSyllabus }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const total = STEPS.length;

  const finish = () => onComplete();
  const goProfile = () => {
    onComplete();
    if (onGoToProfile) onGoToProfile();
  };
  const goSyllabus = () => {
    onComplete();
    if (onGoToSyllabus) onGoToSyllabus();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(15,31,61,0.92)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: C.white, borderRadius: 20, maxWidth: 520, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        {/* Progress bar */}
        <div style={{ background: C.ivoryDark, height: 4 }}>
          <div style={{
            height: "100%", background: C.tealBright,
            width: `${((step + 1) / total) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>

        {/* Header with step counter and skip */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px 0",
        }}>
          <div style={{ fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted }}>
            Step {step + 1} of {total}
          </div>
          <button onClick={finish}
            style={{ background: "none", border: "none", fontSize: 13, fontFamily: F.accent, fontWeight: 600, color: C.muted, cursor: "pointer", padding: "4px 8px" }}>
            Skip tour
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 32px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{current.emoji}</div>
          <div style={{ fontFamily: F.display, fontSize: 24, color: C.navy, marginBottom: 12, lineHeight: 1.2 }}>
            {current.heading}
          </div>
          <div style={{ fontFamily: F.body, fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            {current.body}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{
                  background: C.navy, color: C.white, border: "none", borderRadius: 10,
                  padding: "12px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                  cursor: "pointer", minHeight: 44,
                }}>
                Back
              </button>
            )}

            {current.profileStep ? (
              <>
                <button onClick={goProfile}
                  style={{
                    background: C.tealBright, color: C.white, border: "none", borderRadius: 10,
                    padding: "12px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                    cursor: "pointer", minHeight: 44,
                  }}>
                  Go to Profile
                </button>
                <button onClick={() => setStep(s => s + 1)}
                  style={{
                    background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10,
                    padding: "12px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                    cursor: "pointer", minHeight: 44,
                  }}>
                  I'll do it later
                </button>
              </>
            ) : current.syllabusStep ? (
              <>
                <button onClick={goSyllabus}
                  style={{
                    background: C.tealBright, color: C.white, border: "none", borderRadius: 10,
                    padding: "12px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                    cursor: "pointer", minHeight: 44,
                  }}>
                  Import my syllabus →
                </button>
                <button onClick={() => setStep(s => s + 1)}
                  style={{
                    background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 10,
                    padding: "12px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                    cursor: "pointer", minHeight: 44,
                  }}>
                  I'll do it later
                </button>
              </>
            ) : current.finalStep ? (
              <button onClick={finish}
                style={{
                  background: C.tealBright, color: C.white, border: "none", borderRadius: 10,
                  padding: "12px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 15,
                  cursor: "pointer", minHeight: 44,
                }}>
                Let's go! →
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)}
                style={{
                  background: C.tealBright, color: C.white, border: "none", borderRadius: 10,
                  padding: "12px 24px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                  cursor: "pointer", minHeight: 44,
                }}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
