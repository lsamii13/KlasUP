import { useState } from "react";

const C = {
  navy: "#1B2B4B", teal: "#2A9D8F", tealBright: "#0FB5B5", tealLight: "#D6F5F5",
  ivory: "#F9F8F4", white: "#FFFFFF", text: "#1B2B4B", muted: "#5a6a85",
  border: "#E5E7EB",
};

const F = {
  display: "'Poppins', sans-serif",
  body: "'Nunito', sans-serif",
  accent: "'Nunito', sans-serif",
};

const STRATEGIES = [
  {
    icon: "🎫",
    name: "Exit Tickets",
    description: "Quick end-of-class checks that reveal what students understood — and what they didn't. Takes 3 minutes and transforms your next lesson.",
    prompts: [
      "What's one thing you learned today that surprised you?",
      "What's still confusing? Be as specific as you can.",
      "If you had to explain today's main concept to a friend, what would you say?",
    ],
  },
  {
    icon: "🔒",
    name: "Anonymous Surveys",
    description: "When students know their name isn't attached, they tell you the truth. Anonymous feedback is some of the most valuable data you'll ever collect.",
    prompts: [
      "What's one thing I could do differently to help you learn better?",
      "On a scale of 1-5, how confident do you feel about this week's material? What would move you up one point?",
      "What's something you wish I knew about how this class is going for you?",
    ],
  },
  {
    icon: "💬",
    name: "Class Discussions",
    description: "Structured discussions give every student a voice — not just the loudest ones. The key is designing the question, not just asking it.",
    prompts: [
      "Before we discuss: write down your answer for 2 minutes, then share with a partner.",
      "What's a perspective on this topic we haven't heard yet?",
      "What would you push back on from what we just heard?",
    ],
  },
  {
    icon: "📓",
    name: "Journaling",
    description: "Regular low-stakes writing helps students process learning and gives you a window into their thinking that class discussions never could.",
    prompts: [
      "What's one thing from this week you're still thinking about? Why does it stick with you?",
      "What connection can you make between today's topic and something from your own life?",
      "What question do you wish someone would ask you about this material?",
    ],
  },
  {
    icon: "🤝",
    name: "Peer Feedback",
    description: "When students give each other structured feedback, they learn twice — once from the content and once from explaining it to someone else.",
    prompts: [
      "What's the strongest part of your partner's work? Be specific.",
      "What's one question you have after reading their work?",
      "What's one suggestion that would make this even stronger?",
    ],
  },
];

const PRO_CARDS = [
  { title: "Full Prompt Library", description: "50+ research-backed prompts across 10 categories" },
  { title: "Assignment Templates", description: "Ready-to-use Student Voice assignments you can customize" },
  { title: "Klas Integration", description: "Ask Klas to build a custom Student Voice assignment for your course" },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button onClick={handleCopy}
      style={{
        background: copied ? `${C.teal}22` : "none",
        color: C.teal, border: `1px solid ${copied ? C.teal : C.border}`,
        borderRadius: 8, padding: "4px 12px", fontSize: 11,
        fontFamily: F.accent, fontWeight: 700, cursor: "pointer",
        transition: "all 0.2s", whiteSpace: "nowrap", minWidth: 64,
      }}>
      {copied ? "Copied! \u2713" : "Copy"}
    </button>
  );
}

export default function StudentVoicePage({ canPro = false, onUpgrade }) {
  const mob = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: mob ? "20px 16px" : "32px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: F.display, fontSize: mob ? 26 : 34, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
          Student Voice
        </div>
        <div style={{ fontFamily: F.body, fontSize: 15, color: C.muted, marginBottom: 18, lineHeight: 1.6 }}>
          Give your students a seat at the table. Here's how.
        </div>
        <div style={{
          background: `${C.teal}12`, border: `1px solid ${C.teal}33`,
          borderRadius: 12, padding: "14px 18px",
          fontFamily: F.body, fontSize: 14, color: C.teal, lineHeight: 1.6, fontWeight: 600,
        }}>
          &#10022; Research shows that amplifying student voice improves engagement, retention, and learning outcomes.
        </div>
      </div>

      {/* Free Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: F.display, fontSize: mob ? 20 : 24, fontWeight: 700, color: C.navy, marginBottom: 20 }}>
          5 Ways to Gather Student Voice
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {STRATEGIES.map((s, i) => (
            <div key={i} style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: mob ? 20 : 28,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.navy }}>
                  {s.name}
                </div>
              </div>

              <div style={{ fontFamily: F.body, fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>
                {s.description}
              </div>

              <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Example Prompts
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {s.prompts.map((p, j) => (
                  <div key={j} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    background: C.ivory, borderRadius: 10, padding: "10px 14px",
                  }}>
                    <div style={{ fontFamily: F.body, fontSize: 13, color: C.text, lineHeight: 1.55, flex: 1 }}>
                      "{p}"
                    </div>
                    <CopyButton text={p} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ fontFamily: F.display, fontSize: mob ? 20 : 24, fontWeight: 700, color: C.navy }}>
            Advanced Student Voice Tools
          </div>
          {!canPro && (
            <span style={{
              background: C.tealLight, color: C.teal,
              fontFamily: F.accent, fontSize: 10, fontWeight: 800,
              padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              Pro
            </span>
          )}
        </div>

        <div style={{
          position: "relative",
          borderRadius: 16, overflow: "hidden",
        }}>
          {/* Cards */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 14,
            filter: canPro ? "none" : "blur(2px)",
            opacity: canPro ? 1 : 0.6,
            pointerEvents: canPro ? "auto" : "none",
          }}>
            {PRO_CARDS.map((card, i) => (
              <div key={i} style={{
                background: canPro ? C.white : C.white,
                border: `1px solid ${canPro ? C.teal : C.border}`,
                borderRadius: 14, padding: mob ? 18 : 24,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  {!canPro && <span style={{ color: C.teal, fontSize: 16 }}>&#128274;</span>}
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.navy }}>
                    {card.title}
                  </div>
                </div>
                <div style={{ fontFamily: F.body, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                  {canPro ? (
                    <div style={{
                      background: `${C.teal}10`, border: `1px dashed ${C.teal}44`,
                      borderRadius: 10, padding: "16px 18px", textAlign: "center",
                      color: C.teal, fontWeight: 600,
                    }}>
                      Coming soon
                    </div>
                  ) : card.description}
                </div>
              </div>
            ))}
          </div>

          {/* Lock overlay for free users */}
          {!canPro && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "rgba(249,248,244,0.5)", borderRadius: 16,
            }}>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
                Unlock Advanced Tools
              </div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted, marginBottom: 16, textAlign: "center", maxWidth: 300 }}>
                Get the full prompt library, assignment templates, and Klas-powered Student Voice tools.
              </div>
              <button onClick={onUpgrade}
                style={{
                  background: C.teal, color: C.white, border: "none", borderRadius: 12,
                  padding: "12px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(42,157,143,0.3)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
