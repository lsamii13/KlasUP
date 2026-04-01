import { useState } from "react";
import Logo from "./Logo";
import { supabase } from "./supabase";

const C = {
  navy: "#0F1F3D", navyMid: "#1A3260",
  teal: "#0B8A8A", tealBright: "#0FB5B5", tealLight: "#D6F5F5",
  ivory: "#FAF8F4", ivoryDark: "#F0EDE6",
  sage: "#5A8A62", sageLight: "#E6F4E8",
  rose: "#C4687A",
  white: "#FFFFFF", text: "#0F1F3D", muted: "#4A5568",
  border: "rgba(15,31,61,0.12)",
};

const F = {
  display: "'Fredoka One', cursive",
  body: "'Nunito', sans-serif",
  accent: "'Nunito', sans-serif",
};

const AGREEMENT_TEXT = `This Beta Tester Agreement is between KlasUP, LLC and the individual signing below. By signing, you agree to: (1) keep all non-public Platform features confidential and not share publicly; (2) provide honest feedback to help improve the Platform; (3) grant KlasUP a perpetual license to use your feedback — you retain no IP claims on feedback provided; (4) confirm you are signing as an individual, not on behalf of any institution or employer. KlasUP provides the Platform as-is during the beta period. This Agreement is governed by the laws of New Hampshire. Effective Date: April 1, 2026. Questions? Email leilavsamii@gmail.com`;

export default function BetaAgreement({ onBack }) {
  const [form, setForm] = useState({ full_name: "", email: "", job_title: "", institution: "", digital_signature: "" });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = form.full_name.trim() && form.email.trim() && form.digital_signature.trim() && agreed;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: insertErr } = await supabase.from("beta_agreements").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        job_title: form.job_title.trim() || null,
        institution: form.institution.trim() || null,
        digital_signature: form.digital_signature.trim(),
        agreed: true,
      });
      if (insertErr) throw insertErr;
      setSuccess(true);
      // Notify admin via SMS — fire and forget, don't block success
      try {
        const smsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`;
        fetch(smsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            message: `New KlasUP beta tester signed! Name: ${form.full_name.trim()}, Email: ${form.email.trim()}, Institution: ${form.institution.trim() || "N/A"}`,
          }),
        }).catch(() => {});
      } catch (_) {}
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again or email leilavsamii@gmail.com");
    }
    setSubmitting(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 10,
    fontFamily: F.body, fontSize: 14, boxSizing: "border-box", outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = { display: "block", fontSize: 12, fontFamily: F.accent, fontWeight: 700, color: C.muted, marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text }}>
      {/* Header */}
      <header style={{ background: C.navy, padding: "24px", borderBottom: `3px solid ${C.tealBright}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div onClick={onBack} style={{ cursor: "pointer" }}>
            <Logo size="sm" dark />
          </div>
          <button onClick={onBack}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", fontFamily: F.accent, fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 8, cursor: "pointer", minHeight: 44 }}>
            Back to KlasUp
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 60px" }}>
        <div style={{ fontFamily: F.display, fontSize: 32, color: C.navy, marginBottom: 8 }}>Beta Tester Agreement</div>
        <div style={{ fontSize: 15, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
          Thank you for your interest in testing KlasUp. Please read the agreement below and sign to participate.
        </div>

        {success ? (
          <div style={{
            background: C.sageLight, border: `1px solid ${C.sage}44`, borderRadius: 16,
            padding: "2.5rem", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <div style={{ fontFamily: F.display, fontSize: 22, color: C.sage, marginBottom: 8 }}>Thank you!</div>
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>
              Your agreement has been received. You'll hear from us soon at <strong>{form.email}</strong>.
            </div>
          </div>
        ) : (
          <>
            {/* Agreement text */}
            <div style={{
              background: C.white, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: "1.5rem", marginBottom: 28, lineHeight: 1.8, fontSize: 14, color: C.text,
            }}>
              {AGREEMENT_TEXT}
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Dr. Jane Smith" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.tealBright}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane.smith@university.edu" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.tealBright}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              <div>
                <label style={labelStyle}>Job Title</label>
                <input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="Associate Professor of Marketing" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.tealBright}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              <div>
                <label style={labelStyle}>Institution <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></label>
                <input value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
                  placeholder="Boston University" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.tealBright}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              <div>
                <label style={labelStyle}>Digital Signature *</label>
                <input value={form.digital_signature} onChange={e => setForm(p => ({ ...p, digital_signature: e.target.value }))}
                  placeholder="Type your full name as your signature" style={{ ...inputStyle, fontStyle: "italic", fontFamily: "'Georgia', serif", fontSize: 16 }}
                  onFocus={e => e.target.style.borderColor = C.tealBright}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 13, lineHeight: 1.6, color: C.text }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: 3, accentColor: C.tealBright }} />
                <span>I have read and agree to the Beta Tester Agreement and confirm I am signing in my individual capacity, not on behalf of my institution.</span>
              </label>

              {error && (
                <div style={{ background: "#FBEAF0", border: `1px solid ${C.rose}44`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.rose }}>
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                style={{
                  background: canSubmit ? C.tealBright : C.ivoryDark,
                  color: canSubmit ? C.white : C.muted,
                  border: "none", borderRadius: 12, padding: "14px 28px",
                  fontFamily: F.accent, fontWeight: 700, fontSize: 15,
                  cursor: canSubmit && !submitting ? "pointer" : "default",
                  transition: "all 0.2s", minHeight: 48,
                }}>
                {submitting ? "Submitting..." : "Sign & Submit Agreement"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
