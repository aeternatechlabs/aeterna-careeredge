"use client";

// src/components/compliance/consent-card.tsx
// Plain-Language Consent Card (Day 2 Section C2.1)
// Explicit transparency: what we read, why, which AI provider, no auto-posting, right to erasure.

import { useState } from "react";
import { ShieldCheck, Check, Lock, Trash2, ArrowRight } from "lucide-react";

interface ConsentCardProps {
  onConsentGranted?: () => void;
  className?: string;
}

export function ConsentCard({ onConsentGranted, className = "" }: ConsentCardProps) {
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);

  async function handleGrant() {
    setLoading(true);
    try {
      const res = await fetch("/api/consent", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentType: "AI_PROCESSING",
          isGranted: true,
          version: "2.0",
        }),
      });
      if (res.ok) {
        setGranted(true);
        onConsentGranted?.();
      }
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false);
    }
  }

  if (granted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border border-emerald-200">
        <Check size={16} className="text-emerald-600 shrink-0" />
        <span>Consent granted. Your data is encrypted and used only for your verified career analysis.</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE9E8] text-[#7A0F1F]">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h4 className="font-heading text-sm font-bold text-[#2B1B1B]">
            Data Privacy & AI Processing Consent
          </h4>
          <p className="text-xs text-[#765F5D]">
            India Digital Personal Data Protection (DPDP) Standard
          </p>
        </div>
      </div>

      <div className="space-y-3 text-xs text-[#2B1B1B] leading-relaxed">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-full bg-[#FFF0C7] p-1 text-[#7A0F1F]">
            <Check size={12} />
          </div>
          <p>
            <strong className="text-[#4C0915]">What we read:</strong> Only the education details, skills, and documents you explicitly choose to include in your Career Passport.
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-full bg-[#FFF0C7] p-1 text-[#7A0F1F]">
            <Check size={12} />
          </div>
          <p>
            <strong className="text-[#4C0915]">Why:</strong> To benchmark your career readiness, check resume honesty, and discover matching job opportunities.
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-full bg-[#FFF0C7] p-1 text-[#7A0F1F]">
            <Lock size={12} />
          </div>
          <p>
            <strong className="text-[#4C0915]">Zero Auto-Posting:</strong> We will never post to your LinkedIn profile, contact employers without permission, or invent false qualifications.
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-full bg-[#FFF0C7] p-1 text-[#7A0F1F]">
            <Trash2 size={12} />
          </div>
          <p>
            <strong className="text-[#4C0915]">Right to Erasure:</strong> You can export all your data or delete your account and all associated documents at any time under Settings.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#EBDDD1]/60">
        <p className="text-[11px] text-[#9A8580]">
          Timestamped consent recorded with cryptographic integrity.
        </p>

        <button
          type="button"
          onClick={handleGrant}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4C0915] transition-colors disabled:opacity-50"
        >
          <span>{loading ? "Recording consent…" : "I Agree & Continue"}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
