import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Clock, Mail, MapPin, CheckCircle, FileText } from "lucide-react";
import { MarketingLayout } from "@/components/layouts/marketing-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Aeterna CareerEdge Privacy Policy. Learn how we collect, process, protect, and handle your student data, resumes, and career profile.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 21, 2026";
  const effectiveDate = "November 21, 2026";

  return (
    <MarketingLayout>
      <div className="bg-[#FFF8F6] py-12 sm:py-16">
        <div className="page-container max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-[#EBDDD1] pb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FCE9E8] px-3.5 py-1 text-xs font-bold text-[#7A0F1F] mb-4">
              <Shield size={14} aria-hidden="true" />
              <span>Data Protection & Privacy Notice</span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-[#2B1B1B] sm:text-4xl">
              Privacy Policy
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#765F5D]">
              <span className="flex items-center gap-1.5">
                <Clock size={14} aria-hidden="true" />
                Effective Date: {effectiveDate}
              </span>
              <span>•</span>
              <span>Last Updated: {lastUpdated}</span>
              <span>•</span>
              <span className="font-medium text-[#7A0F1F]">Version 1.0</span>
            </div>
          </div>

          {/* Legal Notice Callout */}
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-xs text-amber-950 leading-relaxed">
            <p className="font-semibold mb-1">Transparency Statement:</p>
            <p>
              This Privacy Policy reflects the actual data processing, AI integrations, and storage architectures
              utilized by Aeterna CareerEdge. Placeholders marked with brackets (e.g.,{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">[Legal Entity Name]</code>)
              denote corporate details pending final statutory entity registration and legal review.
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-10 text-sm leading-relaxed text-[#352020]">
            {/* 1. Introduction & Scope */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                1. Introduction & Overview
              </h2>
              <p>
                Aeterna CareerEdge (&quot;CareerEdge&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an AI-powered
                employability platform operated by{" "}
                <span className="font-semibold text-[#7A0F1F]">
                  [Legal Entity: Aeterna Tech Labs Private Limited / Legal Entity Name Pending Confirmation]
                </span>
                . We empower students and early-career jobseekers to build verified Career Passports, optimize
                resumes, analyze job fit, and receive personalized career guidance.
              </p>
              <p>
                We respect your personal privacy and comply with the{" "}
                <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> (India), and international
                fair information privacy standards. This policy describes how we collect, store, process, and protect your information.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                2. Information We Collect
              </h2>
              <p>We collect information directly from you when you register, upload documents, or use our tools:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Credentials:</strong> Full name, email address, 10-digit mobile number, and
                  one-way cryptographically salted password hash (PBKDF2/scrypt). We never store plaintext passwords.
                </li>
                <li>
                  <strong>Academic & Career Profile:</strong> Institution name, academic domain (Engineering, Business,
                  Design, etc.), degree level, graduation year, GPA/percentage, career interests, and target destinations.
                </li>
                <li>
                  <strong>Uploaded Resumes & Documents:</strong> Resumes (PDF, DOCX), statement of purpose (SOP) drafts,
                  and academic certificates uploaded for verification and analysis.
                </li>
                <li>
                  <strong>Career Passport Records:</strong> Work experiences, academic projects, verified technical skills,
                  certifications, and achievement evidence submitted to your student vault.
                </li>
                <li>
                  <strong>Prospective Student Inquiries:</strong> Contact information submitted via landing page guidance
                  forms, including city, career interests, and counselling consent.
                </li>
              </ul>
            </section>

            {/* 3. AI Processing & Generated Content */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                3. AI Processing & Third-Party Intelligence Providers
              </h2>
              <p>
                Aeterna CareerEdge uses advanced Large Language Model (LLM) APIs to provide resume optimization,
                action verb enhancements, ATS compatibility scoring, and role-fit analysis.
              </p>
              <div className="rounded-xl border border-[#EBDDD1] bg-white p-4 space-y-2">
                <p className="font-semibold text-[#2B1B1B]">Our AI Transparency Principles:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#765F5D]">
                  <li>
                    <strong>Server-to-Server Only:</strong> AI requests are processed strictly via private server-side API calls.
                    No AI provider credentials or raw keys are ever loaded into your browser.
                  </li>
                  <li>
                    <strong>No Model Training:</strong> Prompt data sent to enterprise AI partners (Google Gemini / xAI Grok / Anthropic)
                    is used solely to generate real-time feedback for your session and is not used to train public foundation models.
                  </li>
                  <li>
                    <strong>Human-in-the-Loop:</strong> AI recommendations are advisory. You maintain complete editorial control over all resume content.
                  </li>
                </ul>
              </div>
            </section>

            {/* 4. Third-Party Integrations & OAuth */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                4. Third-Party Integrations & OAuth
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Google OAuth 2.0:</strong> When you choose &quot;Continue with Google&quot;, we receive basic profile info
                  (your verified email address, full name, and avatar URL) via openid scopes.
                </li>
                <li>
                  <strong>LinkedIn OAuth / Profile Import:</strong> When initiated by you, we request read-only access to your public
                  LinkedIn profile to assist in importing past roles into your Career Passport. We{" "}
                  <strong>never auto-post, send messages, or modify your LinkedIn profile</strong>.
                </li>
                <li>
                  <strong>Transactional Communications:</strong> We use Resend to deliver transactional account security notifications,
                  password reset links, and confirmation emails.
                </li>
                <li>
                  <strong>Payment Processing:</strong> When premium plans or assessments are purchased, transactions are processed by
                  authorized payment gateways (e.g., Razorpay). We do not store complete credit card or debit card numbers on our servers.
                </li>
              </ul>
            </section>

            {/* 5. Cookies & Tracking Technologies */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                5. Cookies & Tracking Technologies
              </h2>
              <p>We use cookies and browser storage under the following categories:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#EBDDD1] bg-white p-4">
                  <div className="flex items-center gap-2 font-bold text-[#2B1B1B] text-xs">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>Essential Cookies (Strictly Necessary)</span>
                  </div>
                  <p className="mt-1 text-xs text-[#765F5D]">
                    Authentication session cookie (<code className="font-mono">ace_session</code>),
                    CSRF defense tokens, and encrypted session security. Essential cookies cannot be disabled.
                  </p>
                </div>

                <div className="rounded-xl border border-[#EBDDD1] bg-white p-4">
                  <div className="flex items-center gap-2 font-bold text-[#2B1B1B] text-xs">
                    <FileText size={14} className="text-[#7A0F1F]" />
                    <span>Analytics & Preference Cookies (Optional)</span>
                  </div>
                  <p className="mt-1 text-xs text-[#765F5D]">
                    Pseudonymous telemetry to understand feature usage and improve resume workflows.
                    Requires explicit user consent via our Cookie Preferences banner.
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#765F5D]">
                You can review or change your cookie preferences at any time by clicking the{" "}
                <strong>&quot;Cookie Preferences&quot;</strong> link in our website footer.
              </p>
            </section>

            {/* 6. Data Storage & Security */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                6. Data Storage & Security Measures
              </h2>
              <p>We employ multi-layered technical safeguards to protect your records:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Transport Layer Security:</strong> All web traffic and API transmissions are encrypted using modern HTTPS (TLS 1.3/1.2) with HSTS headers.
                </li>
                <li>
                  <strong>Magic-Byte Document Inspection:</strong> Uploaded resumes and evidence files undergo binary header validation to block malicious executables.
                </li>
                <li>
                  <strong>Isolated Storage:</strong> Uploaded documents reside outside public web directories in private, access-controlled cloud object storage.
                </li>
                <li>
                  <strong>Sliding Window Rate Limiting:</strong> Authentication endpoints protect against brute-force attacks and credential stuffing.
                </li>
              </ul>
            </section>

            {/* 7. Data Retention & Erasure */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                7. Data Retention & Your Rights (DPDP Act 2023)
              </h2>
              <p>
                We retain your Career Passport and resume records for as long as your account remains active.
                Under applicable data protection laws, you hold the following rights:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Right to Access & Data Portability:</strong> You may request a complete export of your student profile,
                  resumes, and Career Passport in machine-readable JSON format.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> You can edit and update personal, education, and skill records directly within your dashboard.
                </li>
                <li>
                  <strong>Right to Erasure (Account Deletion):</strong> You may request permanent deletion of your account and all associated
                  uploaded documents under Settings or by contacting our privacy team.
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> You may toggle optional counselling contact or analytics consent at any time.
                </li>
              </ul>
            </section>

            {/* 8. Contact & Legal Entity Details */}
            <section className="space-y-3 border-t border-[#EBDDD1] pt-6">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                8. Privacy Inquiries & Grievance Officer
              </h2>
              <p>
                If you have questions regarding this Privacy Policy, wish to exercise your rights, or have privacy concerns,
                please reach out to our designated Data Protection & Grievance Officer:
              </p>
              <div className="rounded-xl border border-[#EBDDD1] bg-white p-5 space-y-2 text-xs">
                <p>
                  <strong>Entity:</strong>{" "}
                  <span>[Aeterna Tech Labs Private Limited / Legal Entity Name Pending Final Statutory Registration]</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-[#7A0F1F]" />
                  <strong>Privacy Email:</strong>{" "}
                  <a href="mailto:privacy@aeternatechlabs.com" className="text-[#7A0F1F] underline">
                    privacy@aeternatechlabs.com
                  </a>{" "}
                  (Alternate: info@aeternatechlabs.com)
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#7A0F1F]" />
                  <strong>Jurisdiction:</strong>{" "}
                  <span>Bengaluru, Karnataka, India [Registered Office Address Pending Legal Confirmation]</span>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
