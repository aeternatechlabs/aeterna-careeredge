import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, Clock, Mail, Phone, MapPin, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/layouts/marketing-layout";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Aeterna CareerEdge Refund and Cancellation Policy. Transparent guidelines for subscription cancellations, refunds, and payment reversals.",
};

export default function RefundPolicyPage() {
  const lastUpdated = "November 23, 2026";
  const effectiveDate = "November 23, 2026";

  return (
    <MarketingLayout>
      <div className="bg-[#FFF8F6] py-12 sm:py-16">
        <div className="page-container max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-[#EBDDD1] pb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FCE9E8] px-3.5 py-1 text-xs font-bold text-[#7A0F1F] mb-4">
              <RefreshCw size={14} aria-hidden="true" />
              <span>Customer Satisfaction & Billing Policy</span>
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-[#2B1B1B] sm:text-4xl">
              Refund & Cancellation Policy
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

          {/* Quick Summary Box */}
          <div className="mb-8 rounded-2xl border border-[#F0DFDC] bg-white p-6 shadow-xs text-xs text-[#6F5A5D] space-y-3">
            <div className="flex items-center gap-2 text-[#7A1A2B] font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-[#F2B33D]" />
              <span>The CareerEdge Fair Billing Commitment</span>
            </div>
            <p className="leading-relaxed">
              At Aeterna CareerEdge, we believe in honest value and complete billing transparency. You can cancel recurring subscriptions at any time with a single click. If you encounter any technical defect preventing service delivery, our support team will promptly assist or process a refund.
            </p>
          </div>

          {/* Policy Content */}
          <div className="space-y-10 text-sm leading-relaxed text-[#352020]">
            {/* 1. Cancellation Policy */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                1. Subscription Cancellation Policy
              </h2>
              <p>
                Students can cancel active monthly subscriptions (such as <strong>CareerEdge Pro</strong>) at any time directly through their student dashboard under <strong>Settings &gt; Billing</strong>, or by emailing our support desk at <a href="mailto:support@aeternastudyabroad.com" className="text-[#7A1A2B] font-medium underline">support@aeternastudyabroad.com</a>.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Effective Immediately:</strong> Upon cancellation, your subscription will not renew for the subsequent billing cycle.
                </li>
                <li>
                  <strong>Retain Access:</strong> You will retain full access to all paid features until the end of your current 30-day billing cycle.
                </li>
                <li>
                  <strong>No Penalty or Lock-in:</strong> We never charge cancellation fees or early termination penalties.
                </li>
              </ul>
            </section>

            {/* 2. Refund Eligibility */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                2. Refund Eligibility &amp; Windows
              </h2>
              <p>
                We evaluate refund requests under the following fair guidelines:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-[#F0DFDC] bg-white p-4 space-y-2">
                  <h3 className="font-bold text-[#2A1417] text-sm">
                    Monthly Subscription (CareerEdge Pro)
                  </h3>
                  <p className="text-xs text-[#6F5A5D]">
                    Eligible for a full refund within <strong>7 days</strong> of the initial purchase or renewal if you have encountered technical service failure or have not excessively exhausted paid generation quotas (e.g. under 3 resume tailored checks).
                  </p>
                </div>
                <div className="rounded-2xl border border-[#F0DFDC] bg-white p-4 space-y-2">
                  <h3 className="font-bold text-[#2A1417] text-sm">
                    Placement Season Pass (45 Days)
                  </h3>
                  <p className="text-xs text-[#6F5A5D]">
                    The Placement Season Pass is a fixed-window pass that does not auto-renew. Refund requests submitted within <strong>48 hours</strong> of purchase are eligible for a full refund if paid AI kits or sprints were not substantially utilized.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Non-Refundable Situations */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                3. Non-Refundable Circumstances
              </h2>
              <p>
                Refunds will not be issued in the following instances:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-[#554040]">
                <li>Requests submitted beyond the stated eligibility window (7 days for monthly plans, 48 hours for placement passes).</li>
                <li>Accounts suspended or terminated due to violation of our Terms of Service (e.g., fraud, scraping, abuse).</li>
                <li>Hiring outcomes or external third-party employer decisions (CareerEdge guarantees skill readiness and ATS alignment, not third-party employment offers).</li>
              </ul>
            </section>

            {/* 4. Processing Time */}
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                4. Refund Processing Timelines &amp; Methods
              </h2>
              <p>
                Once an authorized refund is approved:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Refunds are credited directly to the <strong>original payment method</strong> (UPI, Credit/Debit Card, or Net Banking) via our payment gateway partner, Razorpay.
                </li>
                <li>
                  In compliance with banking regulations, the refund will reflect in your bank account within <strong>5 to 7 business days</strong> depending on your card issuer or banking partner.
                </li>
              </ul>
            </section>

            {/* 5. Contact & Support Escalation */}
            <section className="space-y-4 pt-4 border-t border-[#EBDDD1]">
              <h2 className="font-heading text-xl font-bold text-[#2B1B1B]">
                5. How to Request a Refund
              </h2>
              <p>
                To request a refund, please send an email with your registered account email and payment reference ID to our billing desk:
              </p>
              <div className="rounded-2xl bg-white border border-[#F0DFDC] p-5 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#7A1A2B] shrink-0" />
                  <span><strong>Billing Support Email:</strong> <a href="mailto:support@aeternastudyabroad.com" className="text-[#7A1A2B] underline">support@aeternastudyabroad.com</a> / <a href="mailto:info@aeternatechlabs.com" className="text-[#7A1A2B] underline">info@aeternatechlabs.com</a></span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#7A1A2B] shrink-0" />
                  <span><strong>Helpline:</strong> +91 98861 09955 (Monday to Saturday, 9:30 AM – 6:30 PM IST)</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#7A1A2B] shrink-0" />
                  <span><strong>Operating Address:</strong> Bengaluru · Mysuru · Belagavi, Karnataka, India</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
