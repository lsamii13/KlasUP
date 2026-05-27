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

export default function LeadCaptureForm({
  headline = "Get 13 free AI prompts for faculty",
  subhead = "Built by a former faculty member and academic administrator.",
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
        .insert({ email, source: "prompts_pdf" });

      if (dbError) throw dbError;

      const link = document.createElement("a");
      link.href = "/KlasUp-12-Faculty-AI-Prompts.pdf";
      link.download = "KlasUp-12-Faculty-AI-Prompts.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        background: C.ivory,
        borderRadius: 16,
        padding: "48px 32px",
        maxWidth: 640,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          fontFamily: F.display,
          fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 700,
          color: C.navy,
          margin: "0 0 8px",
          lineHeight: 1.25,
        }}
      >
        {headline}
      </h2>

      <p
        style={{
          fontFamily: F.body,
          fontSize: 16,
          color: C.muted,
          margin: "0 0 28px",
          lineHeight: 1.5,
        }}
      >
        {subhead}
      </p>

      {success ? (
        <p
          style={{
            fontFamily: F.body,
            fontSize: 17,
            fontWeight: 600,
            color: C.teal,
            margin: 0,
          }}
        >
          ✓ Check your downloads — the PDF is on its way!
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
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
                flex: "1 1 240px",
                fontFamily: F.body,
                fontSize: 15,
                padding: "14px 16px",
                borderRadius: 10,
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
                fontSize: 15,
                padding: "14px 28px",
                borderRadius: 10,
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
              {loading ? "Sending…" : "Get the prompts →"}
            </button>
          </div>

          {error && (
            <p
              style={{
                fontFamily: F.body,
                fontSize: 13,
                color: C.error,
                margin: "8px 0 0",
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
          fontSize: 12,
          color: "#999",
          margin: "16px 0 0",
        }}
      >
        We respect your privacy. No spam, ever.
      </p>
    </section>
  );
}
