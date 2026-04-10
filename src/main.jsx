import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PricingPage from './pages/PricingPage.jsx'
import { useFeatureFlags } from './hooks/useFeatureFlags'

function ComingSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#2A9D8F22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🚀</span>
      </div>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#1B2B4B", marginBottom: 8 }}>Coming Soon</div>
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

const isPricing = window.location.pathname === '/pricing'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPricing ? <PricingRoute /> : <App />}
  </StrictMode>,
)
