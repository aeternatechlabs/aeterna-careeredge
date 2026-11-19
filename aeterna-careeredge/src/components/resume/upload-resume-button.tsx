"use client";

// src/components/resume/upload-resume-button.tsx
// Universal "Upload Your Resume" trigger component with variants for Dashboard,
// Resume Studio, Onboarding, Job Application Packs, and ATS Checker.

import React, { useState } from "react";
import { UploadCloud, FileUp, Sparkles, ArrowRight } from "lucide-react";
import { UploadResumeModal } from "./upload-resume-modal";
import type { ParsedResumePayload } from "@/lib/resume/parser";

export interface UploadResumeButtonProps {
  variant?: "primary-card" | "button" | "outline" | "compact" | "banner";
  label?: string;
  sublabel?: string;
  className?: string;
  defaultTargetRole?: string;
  mode?: "default" | "onboarding";
  onSuccess?: (result: {
    resumeId?: string | null;
    passportScore?: number | null;
    parsedData?: ParsedResumePayload | null;
  }) => void;
  onAutofill?: (parsed: ParsedResumePayload) => void;
}

export function UploadResumeButton({
  variant = "button",
  label,
  sublabel,
  className = "",
  defaultTargetRole = "",
  mode = "default",
  onSuccess,
  onAutofill,
}: UploadResumeButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Variant 1: Primary Hero Card (for Resume Studio start screen or Dashboard)
  if (variant === "primary-card") {
    return (
      <>
        <div
          onClick={() => setModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setModalOpen(true);
            }
          }}
          className={`group relative flex flex-col justify-between rounded-2xl border-2 border-dashed border-[#F2B63D] bg-gradient-to-br from-[#FFF9ED] via-white to-[#FDF7F5] p-5 text-left cursor-pointer hover:border-[#7A0F1F] hover:shadow-md transition-all ${className}`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#7A0F1F] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                <Sparkles size={10} className="text-[#F2B63D]" />
                <span>Fastest Import</span>
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#EBDDD1] text-[#7A0F1F] group-hover:scale-105 transition-transform shadow-2xs">
                <UploadCloud size={16} />
              </div>
            </div>

            <h3 className="mt-3 font-heading text-base font-bold text-[#2B1B1B]">
              {label || "Upload Existing Resume"}
            </h3>
            <p className="mt-1 text-xs text-[#765F5D] leading-relaxed">
              {sublabel ||
                "Upload your PDF or Word resume. We extract your degrees, experience, and skills into ATS-ready format with full review."}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EBDDD1]/60 flex items-center gap-1.5 text-xs font-bold text-[#7A0F1F] group-hover:gap-2 transition-all">
            <span>Choose File or Drag & Drop</span>
            <ArrowRight size={13} />
          </div>
        </div>

        <UploadResumeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultTargetRole={defaultTargetRole}
          mode={mode}
          onSuccess={onSuccess}
          onAutofill={onAutofill}
        />
      </>
    );
  }

  // Variant 2: Banner (for Onboarding / Passport top notice)
  if (variant === "banner") {
    return (
      <>
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-3.5 sm:p-4 text-slate-900 shadow-2xs min-w-0 ${className}`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <FileUp size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {label || "Already have a resume?"}
              </p>
              <p className="text-[11px] text-slate-600 line-clamp-2">
                {sublabel || "Upload your PDF or DOCX to auto-fill your credentials in under 30 seconds."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs w-full sm:w-auto"
          >
            <UploadCloud size={14} />
            <span>Upload Resume</span>
          </button>
        </div>

        <UploadResumeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultTargetRole={defaultTargetRole}
          mode={mode}
          onSuccess={onSuccess}
          onAutofill={onAutofill}
        />
      </>
    );
  }

  // Variant 3: Outline Button
  if (variant === "outline") {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-2 rounded-xl border border-[#7A0F1F] bg-white px-3.5 py-2 text-xs font-bold text-[#7A0F1F] hover:bg-[#FFF9ED] transition shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] ${className}`}
        >
          <UploadCloud size={14} />
          <span>{label || "Upload Resume"}</span>
        </button>

        <UploadResumeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultTargetRole={defaultTargetRole}
          mode={mode}
          onSuccess={onSuccess}
          onAutofill={onAutofill}
        />
      </>
    );
  }

  // Variant 4: Compact Toolbar Button
  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition ${className}`}
          title={label || "Upload Resume"}
        >
          <UploadCloud size={13} className="text-[#7A0F1F]" />
          <span>{label || "Upload"}</span>
        </button>

        <UploadResumeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultTargetRole={defaultTargetRole}
          mode={mode}
          onSuccess={onSuccess}
          onAutofill={onAutofill}
        />
      </>
    );
  }

  // Default Variant: Solid Button
  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl bg-[#7A0F1F] px-4 py-2 text-xs font-bold text-white hover:bg-[#600C18] transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] ${className}`}
      >
        <UploadCloud size={14} className="text-[#F2B63D]" />
        <span>{label || "Upload Resume"}</span>
      </button>

      <UploadResumeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTargetRole={defaultTargetRole}
        mode={mode}
        onSuccess={onSuccess}
        onAutofill={onAutofill}
      />
    </>
  );
}
