"use client";

// src/components/passport/experience-modal.tsx
// Modal for adding or editing work experience and internships

import React, { useState } from "react";
import { X, Save, AlertCircle, Briefcase } from "lucide-react";

export interface ExperienceItem {
  id?: string;
  jobTitle: string;
  companyName: string;
  employmentType?: string | null;
  startDate?: string;
  endDate?: string | null;
  rawStartDate?: string;
  rawEndDate?: string;
  isCurrent?: boolean;
  description?: string | null;
}

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: ExperienceItem, score: number) => void;
  initialData?: ExperienceItem | null;
}

const EMPLOYMENT_TYPES = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FULL_TIME", label: "Full-Time Employment" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "ARTICLESHIP", label: "Articleship / Apprenticeship" },
  { value: "FREELANCE", label: "Freelance / Contract" },
];

export function ExperienceModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ExperienceModalProps) {
  const isEditing = Boolean(initialData?.id);

  const [companyName, setCompanyName] = useState(initialData?.companyName || "");
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || "");
  const [employmentType, setEmploymentType] = useState(
    initialData?.employmentType || "INTERNSHIP"
  );
  const [startDate, setStartDate] = useState(
    initialData?.rawStartDate || ""
  );
  const [endDate, setEndDate] = useState(
    initialData?.rawEndDate || ""
  );
  const [isCurrent, setIsCurrent] = useState(Boolean(initialData?.isCurrent));
  const [description, setDescription] = useState(initialData?.description || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim()) {
      setError("Company name and job title are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      id: initialData?.id,
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      employmentType,
      startDate: startDate || null,
      endDate: isCurrent ? null : endDate || null,
      isCurrent,
      description: description.trim() || null,
    };

    try {
      const res = await fetch("/api/passport/experiences", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save experience.");
      }

      onSuccess(data.experience, data.score);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="experience-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto ce-scrollbar my-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0E1DE] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E8EA] text-[#7A0F1F]">
              <Briefcase size={18} />
            </div>
            <div>
              <h2 id="experience-modal-title" className="text-lg font-bold text-[#2B1B1B]">
                {isEditing ? "Edit Experience / Internship" : "Add Experience / Internship"}
              </h2>
              <p className="text-xs text-[#907D79]">
                Document work history and institutional tenure.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-[#59413F] transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Company / Organization Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Infosys, KPMG, Apollo"
                required
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Job / Role Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineering Intern"
                required
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#59413F]">
              Employment Type
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs bg-white focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
            >
              {EMPLOYMENT_TYPES.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isCurrent}
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentExp"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded text-[#7A0F1F] focus:ring-[#7A0F1F]"
            />
            <label htmlFor="isCurrentExp" className="text-xs text-[#59413F]">
              I am currently working here
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#59413F]">
              Key Responsibilities &amp; Impact
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project deliverables, teams collaborated with, and technologies applied..."
              className="mt-1 w-full rounded-xl border border-[#F0E1DE] p-3 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F0E1DE] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#F0E1DE] px-4 py-2 text-xs font-medium text-[#59413F] hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A0F1F] px-5 py-2 text-xs font-bold text-white hover:bg-[#650B19] disabled:opacity-50 shadow-xs transition"
            >
              <Save size={14} />
              <span>{saving ? "Saving…" : isEditing ? "Update Experience" : "Add Experience"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
