import { useState } from "react";
import { supabase } from "../supabase";

const C = {
  navy: "#1B2B4B",
  teal: "#2A9D8F",
  ivory: "#FAF7F2",
  white: "#FFFFFF",
  muted: "#4A5568",
  error: "#C4687A",
  border: "rgba(15,31,61,0.12)",
};

const F = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NotifyMeForm({
  headline = "Get notified when this launches.",
  subhead = "We'll email you the moment it's ready — Winter 2026–2027.",
  source = "accreditation_waitlist",
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from("leads")
        .insert({ email, source });

      if (dbError) throw dbError;
      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: C.ivory,
        borderRadius: 14,
        padding: "32px 28px",
        maxWidth: 520,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          fontFamily: F.display,
          fontSize: "clamp(20px, 3.5vw, 26px)",
          fontWeight: 700,
          color: C.navy,
          margin: "0 0 6px",
          lineHeight: 1.25,
        }}
      >
        {headline}
      </h3>

      <p
        style={{
          fontFamily: F.body,
          fontSize: 14,
          color: C.muted,
          margin: "0 0 20px",
          lineHeight: 1.5,
        }}
      >
        {subhead}
      </p>

      {success ? (
        <p
          style={{
            fontFamily: F.body,
            fontSize: 15,
            fontWeight: 600,
            color: C.teal,
            margin: 0,
          }}
        >
          ✓ You're on the list — we'll be in touch.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              style={{
                flex: "1 1 200px",
                fontFamily: F.body,
                fontSize: 14,
                padding: "12px 14px",
                borderRadius: 8,
                border: `1.5px solid ${error ? C.error : C.border}`,
                outline: "none",
                background: C.white,
                color: C.navy,
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                flex: "0 0 auto",
                fontFamily: F.body,
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 22px",
                borderRadius: 8,
                border: "none",
                background: C.teal,
                color: C.white,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                transform: btnHovered && !loading ? "translateY(-2px)" : "translateY(0)",
                boxShadow: btnHovered && !loading ? "0 6px 20px rgba(42,157,143,0.35)" : "none",
                transition: "all 0.25s ease",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Sending…" : "Notify me →"}
            </button>
          </div>

          {error && (
            <p
              style={{
                fontFamily: F.body,
                fontSize: 13,
                color: C.error,
                margin: "6px 0 0",
              }}
            >
              {error}
            </p>
          )}
        </form>
      )}

      <p
        style={{
          fontFamily: F.body,
          fontSize: 11,
          color: "#999",
          margin: "12px 0 0",
        }}
      >
        We respect your privacy. No spam, ever.
      </p>
    </div>
  );
}
