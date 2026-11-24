import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, Clock, Mail, MapPin, AlertTriangle, Scale } from "lucide-react";
import { MarketingLayout } from "@/components/layouts/marketing-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Aeterna CareerEdge Terms of Service and Conditions. Understand student rights, acceptable use, AI content limitations, and account guidelines.",
};

export default function TermsAndConditionsPage() {
  const lastUpdated = "November 21, 2026";
  const effectiveDate = "November 21, 2026";

  return (
    <MarketingLayout>
      <div className="bg-[#FFF8F6] py-12 sm:py-16">
        <div className="page-container max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-[#EBDDD1] pb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FCE9E8] px-3.5 py-1 text-xs font-bold text-[#7A0F1F] mb-4">
              <Scale size={14} aria-hidden="true" />
              <span>User Agreement & Terms of Service</span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-[#2B1B1B] sm:text-4xl">
              Terms & Conditions
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

          {/* Legal Placeholder Disclaimer */}
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-xs text-amber-950 leading-relaxed">
            <p className="font-semibold mb-1">Contractual Clarity Notice:</p>
            <p>
              These Terms & Conditions outline the rights and responsibilities of students using Aeterna CareerEdge.
              Placeholders enclosed in brackets (e.g.,{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">[Legal Entity Name]</code>)
              denote corporate details pending final statutory entity incorporation and legal counsel review.
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-10 text-sm leading-relaxed text-[#352020]">
            {/* 1. Acceptance of Terms */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using Aeterna CareerEdge (the &quot;Platform&quot;), operated by{" "}
                <span className="font-semibold text-[#7A0F1F]">
                  [Legal Entity: Aeterna Tech Labs Private Limited / Legal Entity Name Pending Confirmation]
                </span>{" "}
                (&quot;CareerEdge&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you agree to be bound by these Terms & Conditions
                and our{" "}
                <Link href="/privacy-policy" className="text-[#7A0F1F] underline font-medium">
                  Privacy Policy
                </Link>
                . If you do not agree to these terms, you must discontinue using the Platform immediately.
              </p>
            </section>

            {/* 2. Eligibility & Account Responsibilities */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                2. Eligibility & Account Security
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Eligibility:</strong> You must be at least 18 years of age or the age of legal majority in your jurisdiction,
                  or possess parental/guardian consent if accessing as an authorized student minor.
                </li>
                <li>
                  <strong>Account Truthfulness:</strong> You agree to provide accurate, current, and complete information during registration
                  and to keep your Career Passport records up to date.
                </li>
                <li>
                  <strong>Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your login
                  credentials and for all activities that occur under your account. Notify us immediately of any unauthorized account access.
                </li>
              </ul>
            </section>

            {/* 3. Acceptable Use Policy */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                3. Acceptable Use Policy
              </h2>
              <p>When using Aeterna CareerEdge, you agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Submit forged, falsified, or fraudulent academic degrees, marksheets, or employment certificates.</li>
                <li>Use automated scripts, bots, scrapers, or crawlers to harvest platform content or user profiles.</li>
                <li>Attempt to probe, scan, or compromise our security controls, authentication mechanisms, or server infrastructure.</li>
                <li>Reverse-engineer, decompile, or copy platform software, proprietary prompts, or scoring algorithms.</li>
                <li>Impersonate any person, college official, employer, or institutional entity.</li>
              </ul>
            </section>

            {/* 4. AI Content Limitations & No Employment Guarantee */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                4. AI Content Advisory & No Hiring Guarantee
              </h2>
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                  <AlertTriangle size={16} />
                  <span>Crucial Disclaimer Regarding AI Output:</span>
                </div>
                <p>
                  Aeterna CareerEdge utilizes artificial intelligence algorithms to provide resume phrasing suggestions,
                  skills gap identification, and ATS formatting recommendations. All AI recommendations are{" "}
                  <strong>strictly advisory and educational in nature</strong>.
                </p>
                <p>
                  <strong>No Guarantee of Employment:</strong> Aeterna CareerEdge makes no warranty, guarantee, or promise that
                  using our resume tools, interview prep, or job matching will result in employment offers, interview calls,
                  university admissions, or visa issuances. Final hiring decisions rest solely with prospective employers.
                </p>
              </div>
              <p>
                <strong>Student Responsibility for Accuracy:</strong> Large language models can occasionally produce inaccurate
                or incomplete suggestions (&quot;hallucinations&quot;). You hold sole responsibility to review, verify, and validate
                all content, dates, and claims in your resume before submitting it to any third party.
              </p>
            </section>

            {/* 5. Job Opportunities & Third-Party Websites */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                5. External Job Links & Third-Party Platforms
              </h2>
              <p>
                CareerEdge may surface job opportunities and links to external career portals or company hiring pages.
                These listings are provided for student convenience. We do not control or endorse external websites,
                their hiring policies, or their data practices. Any engagement or application submitted on external
                websites is subject to the respective third-party&apos;s terms and privacy policies.
              </p>
            </section>

            {/* 6. LinkedIn & Third-Party Services */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                6. LinkedIn & OAuth Integrations
              </h2>
              <p>
                When connecting your LinkedIn account, our access is strictly read-only and initiated by you to import past
                experience. We do not post content, send messages, or modify your external social accounts. You can revoke
                OAuth access at any time through your LinkedIn or Google account settings.
              </p>
            </section>

            {/* 7. Intellectual Property & User Content */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                7. Intellectual Property Rights & Ownership
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Your Content:</strong> You retain full intellectual property ownership of your uploaded resumes,
                  personal portfolios, certificates, and academic documents (&quot;User Content&quot;). You grant us a non-exclusive,
                  royalty-free license solely to host, process, and analyze your documents to deliver the Platform&apos;s services to you.
                </li>
                <li>
                  <strong>CareerEdge IP:</strong> The platform design, codebase, logos, branding, proprietary evaluation models,
                  and documentation are the intellectual property of Aeterna CareerEdge and protected by applicable copyright and trademark laws.
                </li>
              </ul>
            </section>

            {/* 8. Account Termination & Suspension */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                8. Account Suspension & Termination
              </h2>
              <p>
                You may terminate your account at any time by requesting deletion in your account settings or contacting support.
                We reserve the right to suspend or terminate accounts that violate our Acceptable Use Policy, submit fraudulent documents,
                or engage in malicious activities, without prior notice.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                9. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Aeterna CareerEdge and its directors, employees, and partners
                shall not be liable for any indirect, incidental, punitive, or consequential damages arising from: (a) your use or
                inability to use the platform; (b) any loss of employment opportunities; (c) unauthorized access to your account;
                or (d) any third-party links or content. Our total liability for any claim shall not exceed the amount paid by you,
                if any, to CareerEdge in the preceding 12 months.
              </p>
            </section>

            {/* 10. Governing Law & Jurisdiction */}
            <section className="space-y-3 border-t border-[#EBDDD1] pt-6">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                10. Governing Law & Dispute Resolution
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising
                under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in{" "}
                <span className="font-semibold text-[#7A0F1F]">
                  [Bengaluru, Karnataka, India / Jurisdiction Subject to Legal Confirmation]
                </span>
                .
              </p>
              <div className="rounded-xl border border-[#EBDDD1] bg-white p-5 space-y-2 text-xs mt-4">
                <p>
                  <strong>Entity:</strong>{" "}
                  <span>[Aeterna Tech Labs Private Limited / Legal Entity Name Pending Final Statutory Registration]</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-[#7A0F1F]" />
                  <strong>Legal Inquiries:</strong>{" "}
                  <a href="mailto:info@aeternatechlabs.com" className="text-[#7A0F1F] underline">
                    info@aeternatechlabs.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#7A0F1F]" />
                  <strong>Headquarters:</strong>{" "}
                  <span>Bengaluru · Mysuru · Belagavi, Karnataka, India</span>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
