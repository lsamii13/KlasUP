import { useState, useEffect, useCallback } from "react";

const C = {
  navy: "#1B2B4B",
  teal: "#2A9D8F",
  tealBright: "#0FB5B5",
  white: "#FFFFFF",
  ivory: "#FAF8F4",
  ivoryDark: "#F0EDE6",
  muted: "#4A5568",
};

const F = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Manrope', sans-serif",
  accent: "'Manrope', sans-serif",
};

const DESKTOP_STOPS = [
  {
    selector: '[data-tour="dashboard"]',
    heading: "This is your home base.",
    body: "Start here to access your courses, find weekly Career Connections with skills per class, quick micro-learnings, and see what you've been working on lately.",
    position: "below",
  },
  {
    selector: '[data-tour="klas"]',
    heading: "Meet Klas, bottom-right.",
    body: "Your teaching partner is always one click away — ask about course design, an assignment, anything you're working through or need to brainstorm from a pedagogy standpoint.",
    position: "above-left",
    requiresKlasBubble: true,
  },
  {
    selector: '[data-tour="nav-course-architect"]',
    heading: "Build your whole term here.",
    body: "Course Architect is where you design assignments, plan lessons, and see your term come together — all in one place.",
    position: "right",
  },
  {
    selector: '[data-tour="nav-learning-hub"]',
    heading: "Grow and recharge in the Learning Hub.",
    body: "Bite-sized teaching tips, peer-reviewed research, the faculty community, and Wellness — because good teachers are always learning.",
    position: "right",
  },
];

// Padding around the highlighted element
const PAD = 8;
// Gap between highlight edge and tooltip card
const TIP_GAP = 14;
// Tooltip card width
const TIP_W = 300;
// Arrow size (half-diagonal of the rotated square)
const ARROW = 8;

function getRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

// Returns { top, left, arrowSide, arrowOffset } — all in px, no transforms.
// arrowSide = which side of the card the arrow sits on ("top"|"bottom"|"left"|"right")
function calcPosition(rect, preferredPosition) {
  if (!rect) return { top: window.innerHeight / 2 - 80, left: window.innerWidth / 2 - TIP_W / 2, arrowSide: null, arrowOffset: 0 };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = rect.left + rect.width / 2;   // target center x
  const cy = rect.top + rect.height / 2;    // target center y

  // Try preferred, then fall back
  const attempts = preferredPosition === "right" ? ["right", "below", "above"]
    : preferredPosition === "above-left" ? ["above", "below", "right"]
    : ["below", "above", "right"]; // "below" default

  for (const dir of attempts) {
    if (dir === "below") {
      const top = rect.bottom + PAD + TIP_GAP;
      const left = Math.max(12, Math.min(cx - TIP_W / 2, vw - TIP_W - 12));
      if (top + 160 < vh) return { top, left, arrowSide: "top", arrowOffset: Math.max(20, Math.min(cx - left, TIP_W - 20)) };
    }
    if (dir === "above") {
      const left = Math.max(12, Math.min(cx - TIP_W / 2, vw - TIP_W - 12));
      const top = rect.top - PAD - TIP_GAP; // will subtract card height via "bottom-anchored" trick below
      if (top > 160) return { top, left, arrowSide: "bottom", arrowOffset: Math.max(20, Math.min(cx - left, TIP_W - 20)), anchorBottom: true };
    }
    if (dir === "right") {
      const left = rect.right + PAD + TIP_GAP;
      const top = Math.max(12, Math.min(cy - 60, vh - 200));
      if (left + TIP_W < vw - 12) return { top, left, arrowSide: "left", arrowOffset: Math.max(16, Math.min(cy - top, 160)) };
    }
  }
  // Last resort: below
  const top = rect.bottom + PAD + TIP_GAP;
  const left = Math.max(12, Math.min(cx - TIP_W / 2, vw - TIP_W - 12));
  return { top, left, arrowSide: "top", arrowOffset: Math.max(20, Math.min(cx - left, TIP_W - 20)) };
}

export default function Spotlights({ onDismiss, sageOpen }) {
  const [stopIdx, setStopIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Build the effective stops list, skipping Klas bubble stop if chat is open
  const effectiveStops = DESKTOP_STOPS.filter(
    s => !(s.requiresKlasBubble && sageOpen)
  );

  const measureTarget = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
    if (window.innerWidth >= 768 && effectiveStops[stopIdx]) {
      setRect(getRect(effectiveStops[stopIdx].selector));
    }
  }, [stopIdx, effectiveStops]);

  useEffect(() => {
    measureTarget();
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [measureTarget]);

  const dismiss = () => {
    localStorage.setItem("klasup_spotlights_seen", "1");
    onDismiss();
  };

  const next = () => {
    if (stopIdx < effectiveStops.length - 1) {
      setStopIdx(s => s + 1);
    } else {
      dismiss();
    }
  };

  const back = () => {
    if (stopIdx > 0) setStopIdx(s => s - 1);
  };

  // ── MOBILE: single combined card ──
  if (isMobile) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10001,
        background: "rgba(15,31,61,0.92)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          background: C.white, borderRadius: 20, maxWidth: 420, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", padding: "32px 28px",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: F.display, fontSize: 22, color: C.navy, marginBottom: 12, lineHeight: 1.2 }}>
            Welcome to your dashboard.
          </div>
          <div style={{ fontFamily: F.body, fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
            This is your home base — your courses, Career Connections, and Klas, your teaching partner, are all right here. Tap around and explore.
          </div>
          <button onClick={dismiss} style={{
            background: C.navy, color: C.white, border: "none", borderRadius: 10,
            padding: "12px 28px", fontFamily: F.accent, fontWeight: 700, fontSize: 14,
            cursor: "pointer", minHeight: 44,
          }}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  // ── DESKTOP: sequenced spotlight stops ──
  const stop = effectiveStops[stopIdx];
  const pos = calcPosition(rect, stop?.position);

  // Cutout dimensions — used by both the scrim hole and the bright lift
  const hole = rect ? {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  } : null;

  // Arrow styles per side — a small rotated square on the card edge
  const arrowBase = {
    position: "absolute", width: ARROW * 2, height: ARROW * 2,
    background: C.white, transform: "rotate(45deg)", zIndex: 10002,
  };
  const arrowStyles = {
    top:    { ...arrowBase, top: -ARROW + 1, left: pos.arrowOffset - ARROW },
    bottom: { ...arrowBase, bottom: -ARROW + 1, left: pos.arrowOffset - ARROW },
    left:   { ...arrowBase, left: -ARROW + 1, top: pos.arrowOffset - ARROW },
    right:  { ...arrowBase, right: -ARROW + 1, top: pos.arrowOffset - ARROW },
  };

  // For "above" placement, anchor from bottom edge of the card
  const cardStyle = pos.anchorBottom
    ? { position: "absolute", bottom: window.innerHeight - pos.top, left: pos.left }
    : { position: "absolute", top: pos.top, left: pos.left };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10001 }}>
      {/* Dark scrim with transparent hole — box-shadow trick so the cutout is truly clear */}
      {hole ? (
        <div style={{
          position: "absolute",
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          borderRadius: 12,
          boxShadow: "0 0 0 9999px rgba(15,31,61,0.82)",
          pointerEvents: "none",
          transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
        }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,31,61,0.82)" }} />
      )}

      {/* Bright lift inside the cutout — soft white glow so the element pops */}
      {hole && (
        <div style={{
          position: "absolute",
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          borderRadius: 12,
          background: "rgba(255,255,255,0.08)",
          boxShadow: "inset 0 0 16px 4px rgba(255,255,255,0.12)",
          pointerEvents: "none",
          transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
        }} />
      )}

      {/* Teal highlight ring around target */}
      {hole && (
        <div style={{
          position: "absolute",
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          borderRadius: 12,
          border: `2.5px solid ${C.tealBright}`,
          boxShadow: `0 0 0 5px rgba(11,181,181,0.25), 0 0 24px 8px rgba(11,181,181,0.18)`,
          pointerEvents: "none",
          transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
        }} />
      )}

      {/* Tooltip card — small, anchored next to the target */}
      <div style={{
        ...cardStyle,
        width: TIP_W,
        boxSizing: "border-box",
        background: C.white,
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
        padding: "16px 18px 14px",
        zIndex: 10002,
        transition: "top 0.25s ease, left 0.25s ease, bottom 0.25s ease",
      }}>
        {/* Arrow pointing at the target */}
        {pos.arrowSide && <div style={arrowStyles[pos.arrowSide]} />}

        {/* Step counter + skip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontFamily: F.accent, fontWeight: 700, color: C.muted }}>
            {stopIdx + 1} of {effectiveStops.length}
          </div>
          <button onClick={dismiss} style={{
            background: "none", border: "none", fontSize: 11, fontFamily: F.accent,
            fontWeight: 600, color: C.muted, cursor: "pointer", padding: "2px 4px",
          }}>
            Skip tour
          </button>
        </div>

        <div style={{ fontFamily: F.display, fontSize: 15, color: C.navy, fontWeight: 700, marginBottom: 4, lineHeight: 1.25 }}>
          {stop?.heading}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
          {stop?.body}
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {stopIdx > 0 && (
            <button onClick={back} style={{
              background: C.ivoryDark, color: C.navy, border: "none", borderRadius: 8,
              padding: "6px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12,
              cursor: "pointer", minHeight: 32,
            }}>
              Back
            </button>
          )}
          <button onClick={next} style={{
            background: C.navy, color: C.white, border: "none", borderRadius: 8,
            padding: "6px 14px", fontFamily: F.accent, fontWeight: 700, fontSize: 12,
            cursor: "pointer", minHeight: 32,
          }}>
            {stopIdx < effectiveStops.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
