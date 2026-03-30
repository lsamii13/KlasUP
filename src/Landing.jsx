import { useState, useEffect, useRef } from "react";
import Logo, { LogoMark } from "./Logo";

const C = {
  navy: "#0F1F3D", navyMid: "#1A3260", navyLight: "#243D75",
  teal: "#0B8A8A", tealBright: "#0FB5B5", tealLight: "#D6F5F5", tealMid: "#7FE0E0",
  ivory: "#FAF8F4", ivoryDark: "#F0EDE6",
  rose: "#C4687A", roseLight: "#FBEAF0",
  sage: "#5A8A62", sageLight: "#E6F4E8",
  white: "#FFFFFF", text: "#0F1F3D", muted: "#4A5568",
  border: "rgba(15,31,61,0.12)",
};

const F = {
  display: "'Fredoka One', cursive",
  body: "'Nunito', sans-serif",
  accent: "'Nunito', sans-serif",
};

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function RevealSection({ children, style, delay = 0 }) {
  const [ref, visible] = useReveal(0.12);
  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ── Reusable button ── */
function Btn({ children, primary, onClick, style }) {
  const [hovered, setHovered] = useState(false);
  const base = primary
    ? { background: C.tealBright, color: C.white, border: "none" }
    : { background: "transparent", color: C.white, border: `2px solid rgba(255,255,255,0.4)` };
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        ...base, padding: "14px 32px", borderRadius: 12, fontFamily: F.accent,
        fontWeight: 700, fontSize: 15, cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(15,181,181,0.3)" : "none",
        transition: "all 0.25s ease", ...style,
      }}>
      {children}
    </button>
  );
}

function BtnSolid({ children, onClick, style }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: C.tealBright, color: C.white, border: "none",
        padding: "16px 40px", borderRadius: 12, fontFamily: F.accent,
        fontWeight: 700, fontSize: 16, cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(15,181,181,0.35)" : "0 4px 12px rgba(15,181,181,0.15)",
        transition: "all 0.25s ease", ...style,
      }}>
      {children}
    </button>
  );
}

/* ── Section wrapper ── */
function Section({ bg, children, style }) {
  return (
    <section style={{ padding: "96px 24px", background: bg || C.ivory, ...style }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function SectionTitle({ children, light, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: sub ? 16 : 56 }}>
      <h2 style={{
        fontFamily: F.display, fontSize: "clamp(28px, 4vw, 42px)",
        color: light ? C.white : C.navy, margin: 0, lineHeight: 1.2,
      }}>{children}</h2>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Landing Page Component
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Landing({ onSignIn, onGetStarted, onTerms, onPrivacy }) {
  const [scrollY, setScrollY] = useState(0);
  const [navSolid, setNavSolid] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setNavSolid(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ─── NAVBAR ─── */
  const Navbar = (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 24px", height: 72,
      background: navSolid ? "rgba(15,31,61,0.97)" : "transparent",
      backdropFilter: navSolid ? "blur(12px)" : "none",
      transition: "background 0.3s, backdrop-filter 0.3s",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ maxWidth: 1100, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Logo size="sm" dark />
        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onSignIn} style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.85)",
            fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer",
            padding: "8px 16px", borderRadius: 8, transition: "color 0.2s",
          }}>Sign In</button>
          <button onClick={onGetStarted} style={{
            background: C.tealBright, color: C.white, border: "none",
            padding: "10px 22px", borderRadius: 10, fontFamily: F.accent,
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}>Get Started Free</button>
        </div>
      </div>
    </nav>
  );

  /* ─── HERO ─── */
  const Hero = (
    <section style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 40%, #0D4F5A 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "120px 24px 96px", position: "relative", overflow: "hidden",
    }}>
      {/* Decorative circles */}
      <div style={{
        position: "absolute", top: -120, right: -120, width: 400, height: 400,
        borderRadius: "50%", background: "rgba(15,181,181,0.06)",
        transform: `translateY(${scrollY * 0.1}px)`,
      }} />
      <div style={{
        position: "absolute", bottom: -80, left: -80, width: 300, height: 300,
        borderRadius: "50%", background: "rgba(196,104,122,0.05)",
        transform: `translateY(${scrollY * -0.08}px)`,
      }} />

      <div style={{ textAlign: "center", maxWidth: 780, position: "relative", zIndex: 1 }}>
        {/* Hero brand moment — stacked mark + wordmark */}
        <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <LogoMark size={120} />
          <div style={{ fontFamily: F.display, fontSize: "clamp(40px, 5vw, 56px)", lineHeight: 1 }}>
            <span style={{ color: "#FFFFFF" }}>Klas</span>
            <span style={{ color: "#0FB5B5" }}>Up</span>
          </div>
        </div>
        <div style={{
          display: "inline-block", padding: "6px 18px", borderRadius: 20,
          background: "rgba(15,181,181,0.12)", color: C.tealBright,
          fontFamily: F.accent, fontWeight: 700, fontSize: 13,
          marginBottom: 28, letterSpacing: 0.5,
        }}>
          AI-powered pedagogical intelligence for faculty
        </div>

        <h1 style={{
          fontFamily: F.display, fontSize: "clamp(32px, 4.8vw, 54px)",
          color: C.white, margin: "0 0 20px", lineHeight: 1.1,
        }}>
          Teach smarter.<br />Not harder.
        </h1>

        <p style={{
          fontFamily: F.body, fontSize: "clamp(17px, 2.2vw, 21px)",
          color: "rgba(255,255,255,0.7)", margin: "0 0 44px", lineHeight: 1.6,
          maxWidth: 560, marginLeft: "auto", marginRight: "auto",
        }}>
          You bring the expertise. We help every class get better.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn primary onClick={onGetStarted}>Start Free</Btn>
          <Btn onClick={() => scrollTo("how-it-works")}>See How It Works</Btn>
        </div>

        {/* Social proof */}
        <div style={{
          marginTop: 56, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 32, flexWrap: "wrap", opacity: 0.5,
        }}>
          {["Built by faculty, for faculty", "FERPA compliant", "No student data stored"].map((t) => (
            <span key={t} style={{ fontFamily: F.accent, fontSize: 12, color: C.white, fontWeight: 600, letterSpacing: 0.3 }}>
              ✓ {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );

  /* ─── THE PROBLEM ─── */
  const Problem = (
    <Section bg={C.ivory}>
      <SectionTitle>The hard truths nobody talks about</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
        {[
          {
            icon: "📅",
            title: "Development is a one-time event",
            body: "Professional development is a one-time event. Teaching is a daily practice. The workshop you attended last August doesn't help you on a Tuesday in October.",
          },
          {
            icon: "🎓",
            title: "Nobody taught you to teach",
            body: "You know your subject. Nobody taught you how to teach it. You earned a doctorate in your discipline — not in pedagogy. And yet teaching is half your job.",
          },
          {
            icon: "📋",
            title: "Accreditation without tools",
            body: "Accreditation asks for growth documentation. Nobody gives you the tools. You're expected to prove continuous improvement with no system to track it.",
          },
        ].map((item, i) => (
          <RevealSection key={i} delay={i * 0.12}>
            <div style={{
              background: C.white, borderRadius: 18, padding: "36px 30px",
              boxShadow: "0 2px 20px rgba(15,31,61,0.05)",
              borderTop: `3px solid ${[C.tealBright, C.rose, C.sage][i]}`,
              height: "100%", boxSizing: "border-box",
            }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontFamily: F.display, fontSize: 20, color: C.navy, margin: "0 0 12px" }}>{item.title}</h3>
              <p style={{ fontFamily: F.body, fontSize: 15, color: C.muted, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
            </div>
          </RevealSection>
        ))}
      </div>
    </Section>
  );

  /* ─── HOW IT WORKS ─── */
  const HowItWorks = (
    <Section bg={C.white} style={{ paddingTop: 96, paddingBottom: 96 }}>
      <div id="how-it-works" style={{ position: "relative", top: -80 }} />
      <SectionTitle>How it works</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 40 }}>
        {[
          { step: "01", icon: "📤", title: "Upload your content", desc: "Drop in your syllabus, lecture slides, or assignment prompts. KlasUp reads what you're already teaching." },
          { step: "02", icon: "🧠", title: "Get AI-powered insights", desc: "Receive personalized micro-learning, course health analysis, and career connection data — tailored to your exact content." },
          { step: "03", icon: "📈", title: "Watch your teaching grow", desc: "Track improvement over time with semester reflections, accreditation-ready reports, and a living course portfolio." },
        ].map((item, i) => (
          <RevealSection key={i} delay={i * 0.15}>
            <div style={{ textAlign: "center", padding: "0 12px" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
                background: `linear-gradient(135deg, ${C.tealLight}, ${C.tealMid})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36,
              }}>{item.icon}</div>
              <div style={{
                fontFamily: F.accent, fontSize: 12, fontWeight: 700, color: C.tealBright,
                letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase",
              }}>Step {item.step}</div>
              <h3 style={{ fontFamily: F.display, fontSize: 22, color: C.navy, margin: "0 0 10px" }}>{item.title}</h3>
              <p style={{ fontFamily: F.body, fontSize: 15, color: C.muted, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          </RevealSection>
        ))}
      </div>
    </Section>
  );

  /* ─── FEATURES ─── */
  const Features = (
    <Section bg={C.ivory}>
      <div id="features" style={{ position: "relative", top: -80 }} />
      <SectionTitle>Everything you need to teach brilliantly</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 24 }}>
        {[
          { icon: "◉", title: "AI Micro-Learning", desc: "Bite-sized pedagogical tips generated from your actual course content — not generic advice. Delivered weekly.", color: C.tealBright, bg: C.tealLight },
          { icon: "❤", title: "Course Health Score", desc: "A living diagnostic that evaluates alignment, engagement strategies, assessment design, and inclusivity across your syllabus.", color: C.rose, bg: C.roseLight },
          { icon: "🔗", title: "Career Connections", desc: "Show students how this week's lesson connects to real, growing careers — with labor market data and shareable cards.", color: C.sage, bg: C.sageLight },
          { icon: "◈", title: "Think Tank", desc: "Ask any teaching question and get research-backed, practical answers. Like office hours with a pedagogical expert.", color: "#6B4E9B", bg: "#F0EBF8" },
          { icon: "☑", title: "Accreditation Reports", desc: "Auto-generate documentation that proves continuous teaching improvement — ready for AACSB, HLC, or SACSCOC review.", color: "#B8860B", bg: "#FFF8E7" },
          { icon: "✦", title: "Semester Reflection", desc: "End each term with an AI-powered narrative that captures what changed, what improved, and what to try next.", color: C.navy, bg: C.ivoryDark },
        ].map((f, i) => (
          <RevealSection key={i} delay={(i % 3) * 0.1}>
            <div style={{
              background: C.white, borderRadius: 16, padding: "30px 28px",
              boxShadow: "0 2px 16px rgba(15,31,61,0.04)",
              display: "flex", gap: 18, alignItems: "flex-start",
              height: "100%", boxSizing: "border-box",
              transition: "transform 0.25s, box-shadow 0.25s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(15,31,61,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(15,31,61,0.04)"; }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: f.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, color: f.color, flexShrink: 0,
              }}>{f.icon}</div>
              <div>
                <h3 style={{ fontFamily: F.display, fontSize: 18, color: C.navy, margin: "0 0 6px" }}>{f.title}</h3>
                <p style={{ fontFamily: F.body, fontSize: 14, color: C.muted, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </Section>
  );

  /* ─── FOR INSTITUTIONS ─── */
  const Institutions = (
    <Section bg={`linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`}>
      <div id="institutions" style={{ position: "relative", top: -80 }} />
      <RevealSection>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            fontFamily: F.accent, fontSize: 12, fontWeight: 700, color: C.tealBright,
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16,
          }}>For Institutions</div>
          <h2 style={{
            fontFamily: F.display, fontSize: "clamp(28px, 4vw, 40px)",
            color: C.white, margin: "0 0 24px", lineHeight: 1.2,
          }}>
            Accreditation documentation,<br />solved.
          </h2>
          <p style={{
            fontFamily: F.body, fontSize: 17, color: "rgba(255,255,255,0.7)",
            lineHeight: 1.7, margin: "0 0 36px",
          }}>
            Provosts and academic leaders: KlasUp gives your faculty a tool they'll actually use —
            and gives you the continuous improvement documentation accreditors demand.
            Every micro-learning completed, every course portfolio updated, every semester
            reflection written becomes evidence of institutional commitment to teaching excellence.
            No more scrambling before site visits.
          </p>
          <BtnSolid onClick={onGetStarted} style={{ background: C.white, color: C.navy }}>
            Request Institutional Demo
          </BtnSolid>
        </div>
      </RevealSection>
    </Section>
  );

  /* ─── FOUNDER STORY ─── */
  const FounderStory = (
    <Section bg={C.white}>
      <div id="founder" style={{ position: "relative", top: -80 }} />
      <RevealSection>
        <div style={{
          maxWidth: 680, margin: "0 auto", textAlign: "center",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
            background: `linear-gradient(135deg, ${C.tealLight}, ${C.roseLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F.display, fontSize: 28, color: C.navy,
          }}>LS</div>
          <h2 style={{
            fontFamily: F.display, fontSize: "clamp(24px, 3.5vw, 34px)",
            color: C.navy, margin: "0 0 20px", lineHeight: 1.3,
          }}>Built by a professor who lived it</h2>
          <p style={{
            fontFamily: F.body, fontSize: 16, color: C.muted, lineHeight: 1.75,
            margin: 0,
          }}>
            KlasUp was built by <strong style={{ color: C.navy }}>Dr. Leila Samii</strong>, former
            Associate Vice President of Academic Affairs and marketing professor, who watched
            talented faculty struggle with professional development that never transferred into
            the classroom. She saw brilliant researchers who cared deeply about their students
            but had no system to grow as teachers. She built the tool she wished she had.
          </p>
        </div>
      </RevealSection>
    </Section>
  );

  /* ─── PRICING ─── */
  const Pricing = (
    <Section bg={C.ivory}>
      <div id="pricing" style={{ position: "relative", top: -80 }} />
      <SectionTitle>Simple, transparent pricing</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, maxWidth: 940, margin: "0 auto" }}>
        {[
          {
            name: "Free", price: "$0", period: "forever", desc: "Get started and explore the basics.",
            features: ["1 course", "AI Micro-Learning (1/week)", "Course Health Score", "Career Connections (1 role)", "Think Tank (5 questions/mo)"],
            cta: "Start Free", featured: false,
          },
          {
            name: "Pro", price: "$15", period: "/month", desc: "For faculty ready to level up.",
            features: ["Unlimited courses", "Unlimited Micro-Learning", "Full Course Health diagnostics", "All Career Connection roles", "Unlimited Think Tank", "Accreditation Reports", "Semester Reflection", "Course Portfolio"],
            cta: "Start Free Trial", featured: true,
          },
          {
            name: "Institutional", price: "Custom", period: "", desc: "For departments & universities.",
            features: ["Everything in Pro", "Admin dashboard & analytics", "Faculty usage reports", "Accreditation export suite", "SSO & LMS integration", "Dedicated onboarding", "Priority support"],
            cta: "Contact Us", featured: false,
          },
        ].map((tier, i) => (
          <RevealSection key={i} delay={i * 0.1}>
            <div style={{
              background: C.white, borderRadius: 20, padding: "36px 30px",
              boxShadow: tier.featured ? `0 8px 40px rgba(15,181,181,0.15)` : "0 2px 16px rgba(15,31,61,0.04)",
              border: tier.featured ? `2px solid ${C.tealBright}` : `1px solid ${C.border}`,
              position: "relative", height: "100%", boxSizing: "border-box",
              display: "flex", flexDirection: "column",
            }}>
              {tier.featured && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: C.tealBright, color: C.white, fontFamily: F.accent,
                  fontWeight: 700, fontSize: 11, padding: "4px 16px", borderRadius: 20,
                  letterSpacing: 0.5,
                }}>MOST POPULAR</div>
              )}
              <h3 style={{ fontFamily: F.display, fontSize: 24, color: C.navy, margin: "0 0 4px" }}>{tier.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: F.display, fontSize: 40, color: C.navy }}>{tier.price}</span>
                {tier.period && <span style={{ fontFamily: F.body, fontSize: 15, color: C.muted }}>{tier.period}</span>}
              </div>
              <p style={{ fontFamily: F.body, fontSize: 14, color: C.muted, margin: "0 0 24px" }}>{tier.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", flex: 1 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{
                    fontFamily: F.body, fontSize: 14, color: C.text, padding: "6px 0",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ color: C.tealBright, fontWeight: 700, fontSize: 15 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <BtnSolid onClick={onGetStarted} style={{
                width: "100%",
                background: tier.featured ? C.tealBright : C.ivory,
                color: tier.featured ? C.white : C.navy,
                padding: "14px 24px", fontSize: 15,
              }}>
                {tier.cta}
              </BtnSolid>
            </div>
          </RevealSection>
        ))}
      </div>
    </Section>
  );

  /* ─── FINAL CTA ─── */
  const FinalCTA = (
    <Section bg={`linear-gradient(135deg, ${C.navy} 0%, #0D4F5A 100%)`} style={{ paddingTop: 80, paddingBottom: 80 }}>
      <RevealSection>
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            fontFamily: F.display, fontSize: "clamp(30px, 4.5vw, 48px)",
            color: C.white, margin: "0 0 16px", lineHeight: 1.15,
          }}>
            Your best semester starts now.
          </h2>
          <p style={{
            fontFamily: F.body, fontSize: 17, color: "rgba(255,255,255,0.6)",
            margin: "0 0 36px",
          }}>
            Join faculty who are growing as teachers — one class at a time.
          </p>
          <BtnSolid onClick={onGetStarted}>Get Started Free</BtnSolid>
        </div>
      </RevealSection>
    </Section>
  );

  /* ─── FOOTER ─── */
  const Footer = (
    <footer style={{
      background: C.navy, padding: "48px 24px 32px", borderTop: `1px solid rgba(255,255,255,0.06)`,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexWrap: "wrap", gap: 32, marginBottom: 40,
        }}>
          {/* Logo + tagline */}
          <div>
            <div style={{ marginBottom: 10 }}>
              <Logo size="sm" dark />
            </div>
            <p style={{ fontFamily: F.body, fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, maxWidth: 280 }}>
              AI-powered pedagogical intelligence.<br />Teach smarter. Not harder.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            {[
              { title: "Product", links: [
                { label: "Features", action: () => scrollTo("features") },
                { label: "Pricing", action: () => scrollTo("pricing") },
                { label: "For Institutions", action: () => scrollTo("institutions") },
              ]},
              { title: "Company", links: [
                { label: "About", action: () => scrollTo("founder") },
                { label: "Contact", action: () => window.location.href = "mailto:hello@klasup.com" },
                { label: "Privacy Policy", action: onPrivacy },
              ]},
              { title: "Support", links: [
                { label: "Help Center", action: () => window.location.href = "mailto:hello@klasup.com" },
                { label: "Terms of Service", action: onTerms },
                { label: "FERPA Compliance", action: onTerms },
              ]},
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontFamily: F.accent, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
                  {col.title}
                </div>
                {col.links.map((l) => (
                  <div key={l.label} onClick={l.action} style={{
                    fontFamily: F.body, fontSize: 13, color: "rgba(255,255,255,0.55)",
                    padding: "4px 0", cursor: "pointer", transition: "color 0.2s",
                  }}
                    onMouseEnter={(e) => e.target.style.color = C.tealBright}
                    onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.55)"}>
                    {l.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <span style={{ fontFamily: F.body, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} KlasUp. All rights reserved.
          </span>
          <span style={{ fontFamily: F.body, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Made with care for the faculty who care about teaching.
          </span>
        </div>
      </div>
    </footer>
  );

  /* ─── RENDER ─── */
  return (
    <div style={{ fontFamily: F.body, color: C.text, overflowX: "hidden" }}>
      {Navbar}
      {Hero}
      {Problem}
      {HowItWorks}
      {Features}
      {Institutions}
      {FounderStory}
      {Pricing}
      {FinalCTA}
      {Footer}
    </div>
  );
}
