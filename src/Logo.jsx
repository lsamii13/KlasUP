/**
 * KlasUp Logo Component
 *
 * Renders the KlasUp lightbulb-K mark + optional wordmark.
 *
 * Props:
 *   size  — "sm" (38px mark), "md" (58px mark), "lg" (96px mark)
 *   dark  — true for dark backgrounds (white wordmark), false for light (navy wordmark)
 *   mark  — render only the mark, no wordmark (default false)
 *   style — optional wrapper style overrides
 */

const F = {
  display: "'Fredoka One', cursive",
};

const sizes = {
  sm: { mark: 38, font: 24, gap: 9 },
  md: { mark: 58, font: 34, gap: 12 },
  lg: { mark: 96, font: 53, gap: 16 },
};

function LogoMark({ size = 58 }) {
  // All proportions are relative to `size` which controls the total height.
  // The bulb is the top ~68%, neck ~8%, base/socket ~24%.
  const s = size;

  // --- Layout ---
  const bulbR = s * 0.34;          // bulb circle radius
  const bulbCx = s * 0.5;          // bulb center x
  const bulbCy = s * 0.36;         // bulb center y
  const neckTop = bulbCy + bulbR * 0.82;  // where neck starts (overlaps bulb slightly)
  const neckW = s * 0.26;
  const neckH = s * 0.08;
  const neckX = bulbCx - neckW / 2;

  // Socket bars
  const socketTop = neckTop + neckH - s * 0.01;
  const barH = s * 0.055;
  const barGap = s * 0.015;
  const bar1W = s * 0.30;
  const bar2W = s * 0.26;
  const bar3W = s * 0.22;

  // --- K letterform inside bulb ---
  const kCx = bulbCx;              // center the K in the bulb
  const kCy = bulbCy;
  const kH = bulbR * 1.05;         // K height relative to bulb
  const stemX = kCx - bulbR * 0.18;
  const stemTop = kCy - kH * 0.48;
  const stemBot = kCy + kH * 0.48;
  const stemW = s * 0.065;
  const sw = s * 0.065;            // stroke width for diagonals

  const midY = kCy;
  const diagJoinX = stemX + stemW * 0.8;
  const diagTopX = kCx + bulbR * 0.35;
  const diagTopY = stemTop;
  const diagBotX = kCx + bulbR * 0.38;
  const diagBotY = stemBot;

  // --- Shine dots ---
  const sh1r = s * 0.028;
  const sh2r = s * 0.020;
  const sh3r = s * 0.014;

  // Total viewbox: width = s, height = s
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bulb — teal circle with slight taper via ellipse+rect blend */}
      <circle cx={bulbCx} cy={bulbCy} r={bulbR} fill="#0FB5B5" />
      {/* Taper: a rounded rect connecting bulb bottom to neck */}
      <rect
        x={bulbCx - neckW * 0.65}
        y={bulbCy + bulbR * 0.45}
        width={neckW * 1.3}
        height={bulbR * 0.55}
        rx={s * 0.04}
        fill="#0FB5B5"
      />

      {/* Neck — slightly darker teal connector */}
      <rect x={neckX} y={neckTop} width={neckW} height={neckH} rx={s * 0.02} fill="#0A9E9E" />

      {/* Base/Socket — navy horizontal bars, getting narrower */}
      <rect x={bulbCx - bar1W / 2} y={socketTop} width={bar1W} height={barH} rx={s * 0.015} fill="#0F1F3D" />
      <rect x={bulbCx - bar2W / 2} y={socketTop + barH + barGap} width={bar2W} height={barH} rx={s * 0.015} fill="#0F1F3D" />
      <rect x={bulbCx - bar3W / 2} y={socketTop + (barH + barGap) * 2} width={bar3W} height={barH} rx={s * 0.02} fill="#0F1F3D" />

      {/* K vertical stem */}
      <rect x={stemX - stemW / 2} y={stemTop} width={stemW} height={stemBot - stemTop} rx={stemW / 2} fill="white" />

      {/* K upper diagonal */}
      <line x1={diagJoinX} y1={midY} x2={diagTopX} y2={diagTopY}
        stroke="white" strokeWidth={sw} strokeLinecap="round" />

      {/* K lower diagonal */}
      <line x1={diagJoinX} y1={midY} x2={diagBotX} y2={diagBotY}
        stroke="white" strokeWidth={sw} strokeLinecap="round" />

      {/* Shine dots — upper right of bulb */}
      <circle cx={bulbCx + bulbR * 0.52} cy={bulbCy - bulbR * 0.48} r={sh1r} fill="white" opacity="0.9" />
      <circle cx={bulbCx + bulbR * 0.68} cy={bulbCy - bulbR * 0.25} r={sh2r} fill="white" opacity="0.6" />
      <circle cx={bulbCx + bulbR * 0.50} cy={bulbCy - bulbR * 0.22} r={sh3r} fill="white" opacity="0.45" />
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
