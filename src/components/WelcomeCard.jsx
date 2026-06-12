export default function WelcomeCard({ onDismiss }) {
  const C = {
    navy: "#1B2B4B",
    teal: "#2A9D8F",
    white: "#FFFFFF",
    ivory: "#FAF8F4",
    muted: "#4A5568",
  };

  const F = {
    display: "'Bricolage Grotesque', sans-serif",
    body: "'Manrope', sans-serif",
    accent: "'Manrope', sans-serif",
  };

  const dismiss = () => {
    localStorage.setItem("klasup_welcome_card_shown", "1");
    onDismiss();
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
        <div style={{ padding: "32px 32px 36px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div style={{
            fontFamily: F.display, fontSize: 24, color: C.navy,
            marginBottom: 16, lineHeight: 1.2,
          }}>
            Welcome to KlasUp.
          </div>
          <div style={{
            fontFamily: F.body, fontSize: 15, color: C.muted,
            lineHeight: 1.7, textAlign: "left",
            maxWidth: 420, margin: "0 auto 28px",
          }}>
            <p style={{ margin: "0 0 14px" }}>
              KlasUp is your AI teaching partner, built by someone who has seen academics in higher ed from many angles — adjunct, faculty, leadership positions in the dean's office, center for teaching and learning, and academic affairs.
            </p>
            <p style={{ margin: "0 0 14px" }}>
              You're an expert in your field. No one trained any of us to teach it — or to support the whole student behind the work. That's what KlasUp is for.
            </p>
            <p style={{ margin: 0, fontFamily: F.display, fontWeight: 700, color: C.navy, textAlign: "center" }}>
              Teach smarter. Not harder.
            </p>
          </div>

          <button onClick={dismiss}
            style={{
              background: C.navy, color: C.white, border: "none", borderRadius: 10,
              padding: "12px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
              cursor: "pointer", minHeight: 44,
            }}>
            Let's go →
          </button>
        </div>
      </div>
    </div>
  );
}
