import { useState } from "react";

const C = {
  navy: "#0F1F3D", navyMid: "#1A3260",
  teal: "#0B8A8A", tealBright: "#0FB5B5", tealLight: "#D6F5F5",
  ivory: "#FAF8F4", ivoryDark: "#F0EDE6",
  white: "#FFFFFF", text: "#0F1F3D", muted: "#4A5568",
};

const F = {
  display: "'Fredoka One', cursive",
  body: "'Nunito', sans-serif",
  accent: "'Nunito', sans-serif",
};

const STEPS = [
  {
    emoji: "🎉",
    heading: "Welcome to KlasUP!",
    body: "You're one of our first beta testers — and that means a lot. KlasUP is your AI-powered teaching partner, built by a professor who lived the same challenges you do. Let's show you around.",
  },
  {
    emoji: "💡",
    heading: "Teach smarter. Not harder.",
    body: "Every week you upload what you're already teaching — slides, assignments, announcements. KlasUP reads your content and gives you personalized, research-backed coaching to help every class get better.",
  },
  {
    emoji: "👤",
    heading: "Set up your profile",
    body: "Your profile helps KlasUP personalize everything for you. Make sure your institution, teaching level, and LMS are filled in — it takes less than 2 minutes.",
    profileStep: true,
  },
  {
    emoji: "📊",
    heading: "Your teaching command center",
    body: "The Dashboard shows your course health score, weekly insights, and career connections. The more you upload, the smarter it gets. Check in here every week.",
  },
  {
    emoji: "📝",
    heading: "Upload what you're already teaching",
    body: "Head to My Course and drop in a lecture slide, assignment prompt, or class announcement. KlasUP will read it and give you instant micro-learning recommendations tailored to your content.",
  },
  {
    emoji: "🌿",
    heading: "Meet Klas, your instructional design partner",
    body: "See that navy bubble in the bottom right? That's Klas. Ask anything about your teaching — course design, student engagement, assignment feedback. Klas is calm, research-informed, and always in your corner.",
  },
  {
    emoji: "📚",
    heading: "Everything else you need",
    body: "Micro-Learning gives you bite-sized, research-backed teaching tips. Pedagogical Resources connects you to peer-reviewed articles and top university CTLs. And Wellness? That's just for you — because good teaching starts with a good teacher.",
    finalStep: true,
  },
];

export default function OnboardingTour({ onComplete, onGoToProfile }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const total = STEPS.length;

  const finish = () => onComplete();
  const goProfile = () => {
    onComplete();
    if (onGoToProfile) onGoToProfile();
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
