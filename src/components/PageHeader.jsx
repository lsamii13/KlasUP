const PageHeader = ({ breadcrumb, title, subtitle, featureInfo }) => (
  <div style={{ padding: "22px 0px 20px", position: "relative" }}>
    {breadcrumb && (
      <div style={{
        fontFamily: "'Manrope', sans-serif", fontSize: 12, fontWeight: 500,
        color: "#5a6a85", letterSpacing: "0.04em", marginBottom: 10,
      }}>
        {breadcrumb}
      </div>
    )}
    <h1 style={{
      fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 700,
      color: "#1B2B4B", lineHeight: 1.15, letterSpacing: "-0.01em",
      margin: "0 0 6px 0", display: "flex", alignItems: "center",
    }}>
      {title}
      {featureInfo || null}
    </h1>
    {subtitle && (
      <p style={{
        fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 400,
        color: "#5a6a85", lineHeight: 1.5, margin: 0, maxWidth: 540,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

export default PageHeader;
