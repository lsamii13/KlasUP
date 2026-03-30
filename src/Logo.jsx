/**
 * KlasUp Logo Component
 *
 * Renders the KlasUp lightbulb-K mark + optional wordmark.
 *
 * Props:
 *   size  — "sm" (32px mark), "md" (48px mark), "lg" (80px mark)
 *   dark  — true for dark backgrounds (white wordmark), false for light (navy wordmark)
 *   mark  — render only the mark, no wordmark (default false)
 *   style — optional wrapper style overrides
 */

const F = {
  display: "'Fredoka One', cursive",
};

const sizes = {
  sm: { mark: 32, font: 20, gap: 8, shine: [2.5, 2, 1.5] },
  md: { mark: 48, font: 28, gap: 10, shine: [3.5, 2.8, 2] },
  lg: { mark: 80, font: 44, gap: 14, shine: [5, 4, 3] },
};

function LogoMark({ size = 48 }) {
  // K letterform: vertical stem + upper diagonal + lower diagonal
  // Shine dots in upper-right quadrant
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2;

  // K proportions relative to mark size
  const stemX = s * 0.32;
  const stemTop = s * 0.24;
  const stemBot = s * 0.76;
  const stemW = s * 0.09;

  const midY = s * 0.50;
  const diagTopX = s * 0.65;
  const diagTopY = s * 0.24;
  const diagBotX = s * 0.67;
  const diagBotY = s * 0.76;
  const diagJoinX = s * 0.42;

  const sw = s * 0.09; // stroke width for diagonals

  // Shine dots
  const shineR1 = s * 0.035;
  const shineR2 = s * 0.028;
  const shineR3 = s * 0.02;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Teal circle */}
      <circle cx={cx} cy={cy} r={r} fill="#0FB5B5" />

      {/* K vertical stem */}
      <rect x={stemX - stemW / 2} y={stemTop} width={stemW} height={stemBot - stemTop} rx={stemW / 2} fill="white" />

      {/* K upper diagonal (stem mid → top right) */}
      <line x1={diagJoinX} y1={midY} x2={diagTopX} y2={diagTopY}
        stroke="white" strokeWidth={sw} strokeLinecap="round" />

      {/* K lower diagonal (stem mid → bottom right) */}
      <line x1={diagJoinX} y1={midY} x2={diagBotX} y2={diagBotY}
        stroke="white" strokeWidth={sw} strokeLinecap="round" />

      {/* Shine dots — upper right */}
      <circle cx={s * 0.72} cy={s * 0.20} r={shineR1} fill="white" opacity="0.9" />
      <circle cx={s * 0.80} cy={s * 0.30} r={shineR2} fill="white" opacity="0.6" />
      <circle cx={s * 0.74} cy={s * 0.34} r={shineR3} fill="white" opacity="0.4" />
    </svg>
  );
}

export default function Logo({ size = "md", dark = false, mark = false, style }) {
  const cfg = sizes[size] || sizes.md;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: cfg.gap,
      ...style,
    }}>
      <LogoMark size={cfg.mark} />
      {!mark && (
        <div style={{ fontFamily: F.display, fontSize: cfg.font, lineHeight: 1 }}>
          <span style={{ color: dark ? "#FFFFFF" : "#0F1F3D" }}>Klas</span>
          <span style={{ color: "#0FB5B5" }}>Up</span>
        </div>
      )}
    </div>
  );
}

export { LogoMark };
