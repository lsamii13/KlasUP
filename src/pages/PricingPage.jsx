import { useState } from "react";

const features = {
  free: [
    { label: "Course health scores", included: true },
    { label: "Micro-learning library", included: true },
    { label: "Think Tank forum", included: true },
    { label: "Klas — AI-Powered Brainstorming (limited)", included: true },
    { label: "Assignment Builder (3/month)", included: true },
    { label: "Slide Studio", included: false },
    { label: "Accreditation reports", included: false },
    { label: "Course Portfolio", included: false },
    { label: "Exports (PDF / Word / PPTX)", included: false },
  ],
  pro: [
    { label: "Everything in Free", included: true, bold: true },
    { label: "Klas — AI-Powered Brainstorming — unlimited", included: true },
    { label: "Assignment Builder — unlimited", included: true },
    { label: "Slide Studio", included: true },
    { label: "Accreditation reports (NECHE, HLC, SACSCOC, AACSB)", included: true },
    { label: "Course Portfolio", included: true },
    { label: "Exports — PDF, Word, PowerPoint", included: true },
    { label: "Voice input everywhere", included: true },
  ],
};

const CheckIcon = ({ included }) =>
  included ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="9" cy="9" r="8" fill="#E1F5EE" />
      <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#2A9D8F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="9" cy="9" r="8" fill="#f0f0f0" />
      <path d="M6 12l6-6M12 12L6 6" stroke="#ccc" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <div style={styles.page}>
      <p style={styles.eyebrow}>Simple Pricing</p>
      <h1 style={styles.headline}>Teach smarter. Not harder.</h1>
      <p style={styles.subheading}>Start free. Upgrade when you're ready.</p>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.toggleLabel, color: !annual ? "#1B2B4B" : "#8a9ab5" }}>Monthly</span>
        <div onClick={() => setAnnual(!annual)} style={{ ...styles.switchTrack, background: annual ? "#2A9D8F" : "#1B2B4B" }}>
          <div style={{ ...styles.switchThumb, transform: annual ? "translateX(22px)" : "translateX(0)" }} />
        </div>
        <span style={{ ...styles.toggleLabel, color: annual ? "#1B2B4B" : "#8a9ab5" }}>
          Annual <span style={styles.saveBadge}>Save $48</span>
        </span>
      </div>
      <div style={styles.trialBanner}>✦ Every new account includes a 14-day Pro trial — no credit card required</div>
      <div style={styles.grid}>
        <div style={styles.card}>
          <p style={styles.planName}>Free</p>
          <p style={styles.planDesc}>Explore KlasUp at your own pace</p>
          <div style={styles.priceRow}><span style={styles.priceAmount}>$0</span><span style={styles.pricePeriod}>/month</span></div>
          <p style={styles.billedNote}>&nbsp;</p>
          <button style={styles.btnFree}>Get started free</button>
          <hr style={styles.divider} />
          <ul style={styles.featureList}>
            {features.free.map((f, i) => (
              <li key={i} style={styles.featureItem}>
                <CheckIcon included={f.included} />
                <span style={{ color: f.included ? "#1B2B4B" : "#bbb" }}>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={styles.cardFeatured}>
          <div style={styles.popularBadge}>Most Popular</div>
          <p style={styles.planName}>Pro</p>
          <p style={styles.planDesc}>Everything you need to teach at your best</p>
          <div style={styles.priceRow}><span style={styles.priceAmount}>{annual ? "$15" : "$19"}</span><span style={styles.pricePeriod}>/month</span></div>
          <p style={styles.billedNote}>{annual ? "Billed $180/year — you save $48" : "\u00a0"}</p>
          <button style={styles.btnPro}>Start 14-day free trial</button>
          <hr style={styles.divider} />
          <ul style={styles.featureList}>
            {features.pro.map((f, i) => (
              <li key={i} style={styles.featureItem}>
                <CheckIcon included={f.included} />
                <span style={{ color: "#1B2B4B", fontWeight: f.bold ? 700 : 400 }}>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p style={styles.footerNote}>Need campus-wide access? <a href="mailto:hello@klasup.com" style={styles.footerLink}>Contact us about institutional pricing →</a></p>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Nunito', sans-serif", maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem" },
  eyebrow: { fontFamily: "'Poppins', sans-serif", fontSize: 13, letterSpacing: "2px", textTransform: "uppercase", color: "#2A9D8F", textAlign: "center", marginBottom: 8 },
  headline: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 42, color: "#1B2B4B", textAlign: "center", margin: "0 0 8px", lineHeight: 1.1 },
  subheading: { fontSize: 16, color: "#5a6a85", textAlign: "center", margin: "0 0 2rem" },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "2rem" },
  toggleLabel: { fontSize: 14, fontWeight: 700, transition: "color 0.2s" },
  switchTrack: { position: "relative", width: 48, height: 26, borderRadius: 26, cursor: "pointer", transition: "background 0.3s" },
  switchThumb: { position: "absolute", top: 3, left: 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "transform 0.3s" },
  saveBadge: { background: "#EAF3DE", color: "#3B6D11", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, marginLeft: 6 },
  trialBanner: { textAlign: "center", fontSize: 13, color: "#3B6D11", background: "#EAF3DE", borderRadius: 8, padding: "10px 16px", marginBottom: "2rem", fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: "2rem" },
  card: { background: "white", border: "1px solid #e8edf3", borderRadius: 16, padding: "2rem" },
  cardFeatured: { background: "white", border: "2px solid #2A9D8F", borderRadius: 16, padding: "2rem", position: "relative" },
  popularBadge: { position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#2A9D8F", color: "white", fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, padding: "4px 18px", borderRadius: 20, whiteSpace: "nowrap" },
  planName: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 24, color: "#1B2B4B", margin: "0 0 4px" },
  planDesc: { fontSize: 13, color: "#5a6a85", margin: "0 0 1.5rem" },
  priceRow: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 },
  priceAmount: { fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 48, color: "#1B2B4B", lineHeight: 1 },
  pricePeriod: { fontSize: 14, color: "#5a6a85" },
  billedNote: { fontSize: 12, color: "#5a6a85", marginBottom: "1.5rem", minHeight: 18 },
  btnFree: { display: "block", width: "100%", padding: "12px", borderRadius: 10, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, textAlign: "center", cursor: "pointer", background: "transparent", border: "1.5px solid #1B2B4B", color: "#1B2B4B", boxSizing: "border-box" },
  btnPro: { display: "block", width: "100%", padding: "12px", borderRadius: 10, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, textAlign: "center", cursor: "pointer", background: "#1B2B4B", border: "none", color: "white", boxSizing: "border-box" },
  divider: { border: "none", borderTop: "1px solid #eef1f5", margin: "1.5rem 0" },
  featureList: { listStyle: "none", padding: 0, margin: 0 },
  featureItem: { display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, padding: "5px 0" },
  footerNote: { textAlign: "center", fontSize: 13, color: "#5a6a85" },
  footerLink: { color: "#2A9D8F", textDecoration: "none", fontWeight: 700 },
};
