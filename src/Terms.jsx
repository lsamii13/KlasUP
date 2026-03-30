import { useState } from "react";
import Logo from "./Logo";

const C = {
  navy: "#0F1F3D", navyMid: "#1A3260",
  teal: "#0B8A8A", tealBright: "#0FB5B5", tealLight: "#D6F5F5", tealMid: "#7FE0E0",
  ivory: "#FAF8F4", ivoryDark: "#F0EDE6",
  rose: "#C4687A", roseLight: "#FBEAF0",
  sage: "#5A8A62",
  white: "#FFFFFF", text: "#0F1F3D", muted: "#4A5568",
  border: "rgba(15,31,61,0.12)",
};

const F = {
  display: "'Fredoka One', cursive",
  body: "'Nunito', sans-serif",
  accent: "'Nunito', sans-serif",
};

const EFFECTIVE_DATE = "March 30, 2026";

function SectionHeading({ children }) {
  return (
    <h2 style={{
      fontFamily: F.display, fontSize: 24, color: C.navy,
      margin: "48px 0 16px", lineHeight: 1.3,
    }}>{children}</h2>
  );
}

function SubHeading({ children }) {
  return (
    <h3 style={{
      fontFamily: F.display, fontSize: 18, color: C.navy,
      margin: "28px 0 10px", lineHeight: 1.3,
    }}>{children}</h3>
  );
}

function P({ children }) {
  return (
    <p style={{
      fontFamily: F.body, fontSize: 15, color: C.muted,
      lineHeight: 1.75, margin: "0 0 16px",
    }}>{children}</p>
  );
}

function Li({ children }) {
  return (
    <li style={{
      fontFamily: F.body, fontSize: 15, color: C.muted,
      lineHeight: 1.75, marginBottom: 6,
    }}>{children}</li>
  );
}

export default function Terms({ onBack, initialTab = "terms" }) {
  const [tab, setTab] = useState(initialTab);

  const tabStyle = (active) => ({
    padding: "10px 24px", border: "none", borderRadius: 8,
    fontFamily: F.accent, fontWeight: 700, fontSize: 14, cursor: "pointer",
    background: active ? C.white : "transparent",
    color: active ? C.navy : C.muted,
    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
    transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: C.ivory, fontFamily: F.body, color: C.text }}>
      {/* Header */}
      <header style={{
        background: C.navy, padding: "0 24px", height: 72,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ maxWidth: 800, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ cursor: "pointer" }} onClick={onBack}>
            <Logo size="sm" dark />
          </div>
          <button onClick={onBack} style={{
            background: "transparent", border: `1px solid rgba(255,255,255,0.25)`,
            color: "rgba(255,255,255,0.8)", padding: "8px 18px", borderRadius: 8,
            fontFamily: F.accent, fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "all 0.2s",
          }}>
            &larr; Back
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Tab switcher */}
        <div style={{
          display: "flex", background: C.ivoryDark, borderRadius: 10,
          padding: 3, marginBottom: 40, width: "fit-content",
        }}>
          <button onClick={() => setTab("terms")} style={tabStyle(tab === "terms")}>Terms of Service</button>
          <button onClick={() => setTab("privacy")} style={tabStyle(tab === "privacy")}>Privacy Policy</button>
        </div>

        {tab === "terms" ? <TermsContent /> : <PrivacyContent />}

        {/* Contact footer */}
        <div style={{
          marginTop: 56, padding: "28px 32px", background: C.white,
          borderRadius: 16, border: `1px solid ${C.border}`,
          textAlign: "center",
        }}>
          <div style={{ fontFamily: F.display, fontSize: 20, color: C.navy, marginBottom: 8 }}>
            Questions?
          </div>
          <P>
            If you have any questions about these terms or our privacy practices, please contact us at{" "}
            <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, fontWeight: 700, textDecoration: "none" }}>
              hello@klasup.com
            </a>
          </P>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TERMS OF SERVICE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TermsContent() {
  return (
    <div>
      <h1 style={{
        fontFamily: F.display, fontSize: "clamp(28px, 4vw, 36px)",
        color: C.navy, margin: "0 0 8px", lineHeight: 1.2,
      }}>Terms of Service</h1>
      <P><strong>Effective Date:</strong> {EFFECTIVE_DATE}</P>
      <P>
        Welcome to KlasUp. These Terms of Service ("Terms") govern your access to and use of the KlasUp
        platform, website, and services (collectively, the "Service") operated by KlasUp ("we," "us," or "our").
        By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree,
        do not use the Service.
      </P>

      <SectionHeading>1. Eligibility & Account Registration</SectionHeading>
      <P>
        The Service is designed for higher education faculty, instructional staff, academic administrators, and
        institutional users. You must be at least 18 years old to create an account. You are responsible for
        maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
      </P>
      <P>
        You agree to provide accurate, current, and complete information during registration and to update such
        information to keep it accurate. We reserve the right to suspend or terminate accounts that contain
        inaccurate or fraudulent information.
      </P>

      <SectionHeading>2. Description of Service</SectionHeading>
      <P>
        KlasUp is an AI-powered pedagogical intelligence platform that helps faculty improve their teaching
        through micro-learning, course health analysis, career connection insights, accreditation reporting,
        and semester reflection tools. The Service uses artificial intelligence to analyze course content you
        upload and generate personalized recommendations.
      </P>
      <P>
        AI-generated content is provided as educational guidance and should not be considered a substitute for
        professional pedagogical consultation, institutional policy, or accreditation requirements. You are
        responsible for reviewing and validating all AI-generated outputs before use.
      </P>

      <SectionHeading>3. User Responsibilities</SectionHeading>
      <P>By using the Service, you agree to:</P>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li>Use the Service only for lawful purposes related to teaching and academic professional development</Li>
        <Li>Not upload content that contains student personally identifiable information (PII), including student names, grades, IDs, or other FERPA-protected data</Li>
        <Li>Not attempt to reverse-engineer, decompile, or disassemble any part of the Service</Li>
        <Li>Not use the Service to generate content that is misleading, discriminatory, or harmful</Li>
        <Li>Not share your account credentials with others or allow unauthorized access to your account</Li>
        <Li>Not use automated scripts, bots, or scrapers to access the Service</Li>
        <Li>Comply with your institution's policies regarding the use of AI tools in educational contexts</Li>
      </ul>

      <SectionHeading>4. FERPA Compliance</SectionHeading>
      <P>
        KlasUp is designed to be FERPA-compliant. The Service does not collect, store, or process student
        education records or student personally identifiable information (PII). Users are responsible for
        ensuring that any content uploaded to the platform does not contain student PII.
      </P>
      <P>
        The platform processes only faculty-created instructional content (syllabi, lecture materials, assignment
        prompts, and teaching reflections). No student data is required to use any feature of the Service.
        If you inadvertently upload content containing student PII, please contact us immediately at{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a>{" "}
        so we can remove it.
      </P>

      <SectionHeading>5. Subscription Terms</SectionHeading>
      <SubHeading>5.1 Free Tier</SubHeading>
      <P>
        The Free tier provides limited access to core features at no cost. Free accounts are subject to usage
        limits as described on our pricing page. We reserve the right to modify Free tier features and limits
        at any time.
      </P>

      <SubHeading>5.2 Pro Tier</SubHeading>
      <P>
        The Pro subscription is billed at $15.00 USD per month. By subscribing, you authorize us to charge
        your payment method on a recurring monthly basis until you cancel. Pro subscriptions may include
        a free trial period; if you do not cancel before the trial ends, you will be charged for the first
        billing cycle.
      </P>

      <SubHeading>5.3 Institutional Tier</SubHeading>
      <P>
        Institutional subscriptions are governed by a separate agreement between KlasUp and the subscribing
        institution. Pricing, terms, and features are determined on a per-institution basis. Contact us at{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a>{" "}
        for institutional pricing.
      </P>

      <SectionHeading>6. Cancellation & Refund Policy</SectionHeading>
      <P>
        You may cancel your Pro subscription at any time from your account Settings page. Upon cancellation:
      </P>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li>Your Pro features will remain active until the end of your current billing period</Li>
        <Li>Your account will automatically revert to the Free tier at the end of the billing period</Li>
        <Li>Your data (course content, micro-learning history, reflections, and portfolio) will be retained and accessible under Free tier limitations</Li>
        <Li>No partial refunds are provided for unused portions of a billing period</Li>
      </ul>
      <P>
        If you believe you were charged in error, contact us at{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a>{" "}
        within 30 days of the charge, and we will review your case.
      </P>

      <SectionHeading>7. Intellectual Property</SectionHeading>
      <SubHeading>7.1 Your Content</SubHeading>
      <P>
        You retain all ownership rights to the instructional content you upload to KlasUp (syllabi, lecture
        materials, assignments, reflections, etc.). By uploading content, you grant us a limited, non-exclusive
        license to process that content solely for the purpose of providing the Service to you. We do not
        claim ownership of your content, and we will not use your content to train AI models, share it with
        third parties, or use it for any purpose other than delivering the Service.
      </P>

      <SubHeading>7.2 Our Content</SubHeading>
      <P>
        The KlasUp platform, including its design, code, branding, AI models, and generated outputs, is the
        intellectual property of KlasUp. You may use AI-generated outputs (micro-learning tips, course health
        analyses, reflection narratives, etc.) freely in your professional work, but you may not resell,
        redistribute, or commercially exploit the Service itself or its underlying technology.
      </P>

      <SectionHeading>8. Limitation of Liability</SectionHeading>
      <P>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, KLASUP AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS
        SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
        INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF REVENUE, OR LOSS OF ACADEMIC STANDING, ARISING
        OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
      </P>
      <P>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
        OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
      </P>
      <P>
        Our total liability for any claims arising from your use of the Service shall not exceed the total
        amount you paid to us in the twelve (12) months preceding the claim.
      </P>
      <P>
        AI-generated content may contain inaccuracies. KlasUp is not responsible for decisions made based on
        AI-generated recommendations. You are solely responsible for reviewing and validating all outputs
        before relying on them for teaching, accreditation, or professional development purposes.
      </P>

      <SectionHeading>9. Data Deletion & Account Termination</SectionHeading>
      <P>
        You may request deletion of your account and all associated data at any time through your account
        Settings page or by contacting us at{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a>.
        Upon receiving a deletion request, we will permanently remove your account and all associated data
        within 30 days, except where retention is required by law.
      </P>
      <P>
        We reserve the right to suspend or terminate your account if you violate these Terms, engage in
        fraudulent activity, or use the Service in a manner that could harm other users or the platform.
      </P>

      <SectionHeading>10. Modifications to Terms</SectionHeading>
      <P>
        We may update these Terms from time to time. If we make material changes, we will notify you via
        email or through a notice on the platform. Your continued use of the Service after such changes
        constitutes acceptance of the revised Terms.
      </P>

      <SectionHeading>11. Governing Law</SectionHeading>
      <P>
        These Terms shall be governed by and construed in accordance with the laws of the State of Florida,
        without regard to its conflict of law provisions. Any disputes arising under these Terms shall be
        resolved in the courts located in Miami-Dade County, Florida.
      </P>

      <SectionHeading>12. Contact Information</SectionHeading>
      <P>
        For questions, concerns, or requests related to these Terms, please contact us:
      </P>
      <P>
        <strong style={{ color: C.navy }}>KlasUp</strong><br />
        Email:{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a><br />
        Website: klasup.com
      </P>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PRIVACY POLICY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PrivacyContent() {
  return (
    <div>
      <h1 style={{
        fontFamily: F.display, fontSize: "clamp(28px, 4vw, 36px)",
        color: C.navy, margin: "0 0 8px", lineHeight: 1.2,
      }}>Privacy Policy</h1>
      <P><strong>Effective Date:</strong> {EFFECTIVE_DATE}</P>
      <P>
        KlasUp ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains
        how we collect, use, store, and share information when you use the KlasUp platform and services
        (the "Service"). By using the Service, you agree to the practices described in this policy.
      </P>

      <SectionHeading>1. Information We Collect</SectionHeading>
      <SubHeading>1.1 Information You Provide</SubHeading>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li><strong>Account information:</strong> Name, email address, institution, job title, and LMS preference</Li>
        <Li><strong>Instructional content:</strong> Syllabi, lecture materials, assignment prompts, and teaching reflections you upload for analysis</Li>
        <Li><strong>Usage data:</strong> Features used, micro-learning interactions, course portfolio entries, and Think Tank questions</Li>
        <Li><strong>Payment information:</strong> For Pro subscribers, payment details are processed securely through our payment processor. We do not store full credit card numbers.</Li>
      </ul>

      <SubHeading>1.2 Information We Collect Automatically</SubHeading>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li><strong>Session data:</strong> Login timestamps, session duration, and last active time</Li>
        <Li><strong>Security logs:</strong> Authentication events (login, logout, failed attempts) for fraud prevention</Li>
        <Li><strong>Browser information:</strong> Browser type, device type, and general location (country/region level only)</Li>
      </ul>

      <SubHeading>1.3 Information We Do NOT Collect</SubHeading>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li>Student personally identifiable information (PII)</Li>
        <Li>Student grades, IDs, or education records</Li>
        <Li>Classroom recordings or student work</Li>
        <Li>Any data protected under FERPA</Li>
      </ul>

      <SectionHeading>2. How We Use Your Information</SectionHeading>
      <P>We use the information we collect to:</P>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li>Provide, maintain, and improve the Service</Li>
        <Li>Generate personalized AI-powered teaching insights from your uploaded content</Li>
        <Li>Create course health analyses, micro-learning tips, and semester reflections</Li>
        <Li>Process payments and manage subscriptions</Li>
        <Li>Send service-related communications (account verification, subscription updates, security alerts)</Li>
        <Li>Monitor for fraud, abuse, and security threats</Li>
        <Li>Generate anonymized, aggregate analytics to improve the platform</Li>
      </ul>
      <P>
        <strong style={{ color: C.navy }}>We do not sell your personal information.</strong> We do not share
        your uploaded instructional content with third parties. We do not use your content to train AI models
        beyond providing the Service to you.
      </P>

      <SectionHeading>3. FERPA Compliance</SectionHeading>
      <P>
        KlasUp is designed from the ground up to be FERPA-compliant. Because the Service operates exclusively
        on faculty-created instructional content and does not collect, store, or process student education
        records or student PII, FERPA regulations regarding student data do not apply to the data we handle.
      </P>
      <P>
        We strongly advise all users to review their uploaded content to ensure it does not inadvertently
        include student PII. If student PII is uploaded in error, contact us immediately at{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a>{" "}
        and we will delete the affected content within 24 hours.
      </P>

      <SectionHeading>4. Data Storage & Security</SectionHeading>
      <P>
        Your data is stored securely using Supabase, which provides enterprise-grade infrastructure with:
      </P>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li>Encryption at rest and in transit (TLS 1.2+)</Li>
        <Li>Row-level security (RLS) ensuring users can only access their own data</Li>
        <Li>Regular security audits and monitoring</Li>
        <Li>SOC 2 Type II compliant infrastructure</Li>
      </ul>
      <P>
        API keys are stored securely as environment variables and are never exposed to the client. AI processing
        is handled through server-side edge functions to protect API credentials.
      </P>

      <SectionHeading>5. Data Retention</SectionHeading>
      <P>We retain your data as follows:</P>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li><strong>Active accounts:</strong> Data is retained for as long as your account is active</Li>
        <Li><strong>Cancelled subscriptions:</strong> Your data is retained and accessible under Free tier limitations. You can request full deletion at any time.</Li>
        <Li><strong>Deleted accounts:</strong> All data is permanently deleted within 30 days of a deletion request, except where retention is required by law</Li>
        <Li><strong>Security logs:</strong> Retained for 90 days for fraud prevention, then automatically purged</Li>
      </ul>

      <SectionHeading>6. Third-Party Services</SectionHeading>
      <P>We use the following third-party services to operate the platform:</P>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li><strong>Supabase:</strong> Database, authentication, and file storage</Li>
        <Li><strong>Anthropic (Claude):</strong> AI processing for micro-learning, course analysis, and reflection generation. Content sent to the AI is processed in real-time and is not retained by the AI provider for training purposes.</Li>
        <Li><strong>Vercel:</strong> Application hosting and deployment</Li>
      </ul>
      <P>
        Each third-party provider operates under its own privacy policy and data processing agreements. We
        select providers that meet our security and privacy standards.
      </P>

      <SectionHeading>7. Your Rights</SectionHeading>
      <P>Depending on your jurisdiction, you may have the following rights:</P>
      <ul style={{ paddingLeft: 24, margin: "0 0 16px" }}>
        <Li><strong>Access:</strong> Request a copy of the personal information we hold about you</Li>
        <Li><strong>Correction:</strong> Request correction of inaccurate personal information</Li>
        <Li><strong>Deletion:</strong> Request deletion of your account and all associated data</Li>
        <Li><strong>Portability:</strong> Request your data in a machine-readable format</Li>
        <Li><strong>Objection:</strong> Object to processing of your personal information in certain circumstances</Li>
      </ul>
      <P>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a>.
        We will respond to your request within 30 days.
      </P>

      <SectionHeading>8. Children's Privacy</SectionHeading>
      <P>
        The Service is not intended for use by individuals under the age of 18. We do not knowingly collect
        personal information from children. If you believe a child has provided us with personal information,
        please contact us immediately.
      </P>

      <SectionHeading>9. Changes to This Policy</SectionHeading>
      <P>
        We may update this Privacy Policy from time to time. If we make material changes, we will notify you
        via email or through a notice on the platform. The "Effective Date" at the top of this policy indicates
        when it was last revised.
      </P>

      <SectionHeading>10. Contact Information</SectionHeading>
      <P>
        For privacy-related questions or requests, please contact us:
      </P>
      <P>
        <strong style={{ color: C.navy }}>KlasUp — Privacy</strong><br />
        Email:{" "}
        <a href="mailto:hello@klasup.com" style={{ color: C.tealBright, textDecoration: "none", fontWeight: 600 }}>hello@klasup.com</a><br />
        Website: klasup.com
      </P>
    </div>
  );
}
