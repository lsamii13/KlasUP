import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PricingPage from './pages/PricingPage.jsx'
import LeadFormTest from './pages/LeadFormTest.jsx'
import NotifyMeTest from './pages/NotifyMeTest.jsx'
import FreePrompts from './pages/FreePrompts.jsx'
import GuidePage from './pages/GuidePage.jsx'
import Logo from './Logo.jsx'
import { useFeatureFlags } from './hooks/useFeatureFlags'

function ComingSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#2A9D8F22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🚀</span>
      </div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, color: "#1B2B4B", marginBottom: 8 }}>Coming Soon</div>
      <div style={{ color: "#2A9D8F", fontSize: 16, maxWidth: 360 }}>We're working on something great. Check back soon!</div>
    </div>
  );
}

function PricingRoute() {
  const { flags, loading } = useFeatureFlags();
  if (loading) return null;
  if (flags.pricing === false) return <ComingSoon />;
  return <PricingPage />;
}

/* ── Public Guide wrapper — matches Research Library chrome pattern ── */
function PublicGuide() {
  const [hovered, setHovered] = useState(null);
  const F = { display: "'Bricolage Grotesque', sans-serif", body: "'Manrope', sans-serif" };
  const navy = "#1B2B4B";
  const teal = "#0FB5B5";
  const linkStyle = (id) => ({
    background: "none", border: "none",
    color: hovered === id ? "#FFFFFF" : "rgba(255,255,255,0.7)",
    fontFamily: F.body, fontWeight: 600, fontSize: 14,
    padding: "8px 14px", borderRadius: 8, cursor: "pointer",
    textDecoration: "none", transition: "color 0.2s",
  });
  return (
    <div style={{ fontFamily: F.body, color: navy }}>
      {/* Header */}
      <header style={{ background: navy, padding: "20px 24px", borderBottom: `3px solid ${teal}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <Logo size="sm" dark />
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <a href="/research" style={linkStyle("research")}
              onMouseEnter={() => setHovered("research")} onMouseLeave={() => setHovered(null)}>
              Research
            </a>
            <a href="/pricing" style={linkStyle("pricing")}
              onMouseEnter={() => setHovered("pricing")} onMouseLeave={() => setHovered(null)}>
              Pricing
            </a>
            <a href="/" style={linkStyle("signin")}
              onMouseEnter={() => setHovered("signin")} onMouseLeave={() => setHovered(null)}>
              Sign In
            </a>
            <a href="/"
              onMouseEnter={() => setHovered("cta")} onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === "cta" ? "#FFFFFF" : teal,
                color: hovered === "cta" ? teal : "#FFFFFF",
                border: "none", padding: "10px 22px", borderRadius: 24,
                fontFamily: F.body, fontWeight: 700, fontSize: 14,
                textDecoration: "none", transition: "all 0.2s",
              }}>
              Try for Free
            </a>
          </div>
        </div>
      </header>

      {/* Guide content */}
      <GuidePage />

      {/* Footer */}
      <footer style={{ background: navy, padding: "48px 24px 32px", borderTop: `3px solid ${teal}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <Logo size="sm" dark />
          </div>
          <p style={{ fontFamily: F.body, fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            AI-powered pedagogical intelligence for faculty who care about teaching.
          </p>
          <a href="/"
            onMouseEnter={() => setHovered("fcta")} onMouseLeave={() => setHovered(null)}
            style={{
              display: "inline-block", background: teal, color: "#FFFFFF",
              border: "none", padding: "14px 32px", borderRadius: 10,
              fontFamily: F.body, fontWeight: 700, fontSize: 15,
              textDecoration: "none", transition: "all 0.2s",
              transform: hovered === "fcta" ? "translateY(-2px)" : "translateY(0)",
              boxShadow: hovered === "fcta" ? "0 8px 24px rgba(15,181,181,0.3)" : "none",
            }}>
            Get Started Free
          </a>
          <div style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            &copy; {new Date().getFullYear()} KlasUp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

const path = window.location.pathname
const isPricing = path === '/pricing'
const isLeadFormTest = path === '/lead-form-test'
const isNotifyMeTest = path === '/notify-me-test'
const isFreePrompts = path === '/free-prompts'
const isGuide = path === '/guide'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isGuide ? <PublicGuide /> : isFreePrompts ? <FreePrompts /> : isNotifyMeTest ? <NotifyMeTest /> : isLeadFormTest ? <LeadFormTest /> : isPricing ? <PricingRoute /> : <App />}
  </StrictMode>,
)
