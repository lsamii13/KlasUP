import LeadCaptureForm from "../components/LeadCaptureForm";

export default function LeadFormTest() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#0F1F3D",
      }}
    >
      <LeadCaptureForm />
    </div>
  );
}
