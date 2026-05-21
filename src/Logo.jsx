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
  display: "'Bricolage Grotesque', sans-serif",
};

const sizes = {
  sm: { mark: 38, font: 24, gap: 9 },
  md: { mark: 58, font: 34, gap: 12 },
  lg: { mark: 96, font: 53, gap: 16 },
};

function LogoMark({ size = 58, dark = false }) {
  return (
    <img
      src={dark ? "/logo/klasup-icon-dark.png" : "/logo/klasup-icon.png"}
      alt="KlasUp logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

export default function Logo({ size = "md", dark = false, mark = false, style }) {
  const cfg = sizes[size] || sizes.md;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: cfg.gap,
      ...style,
    }}>
      <LogoMark size={cfg.mark} dark={dark} />
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
