"use client";

// src/components/passport/education-modal.tsx
// Modal for adding or editing student education records

import React, { useState } from "react";
import { X, Save, AlertCircle, GraduationCap } from "lucide-react";

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  level?: string | null;
  fieldOfStudy?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  isCurrent?: boolean;
  startDate?: string;
  endDate?: string | null;
  score?: string | null;
  scoreOrGrade?: string | null;
}

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: EducationItem, score: number) => void;
  initialData?: EducationItem | null;
}

const EDUCATION_LEVELS = [
  "B.E. / B.Tech",
  "B.Com",
  "B.Sc",
  "BBA",
  "BCA",
  "MBBS",
  "LLB",
  "M.Tech / M.E.",
  "MBA",
  "MCA",
  "Diploma",
  "12th (PUC / HSC)",
  "10th (SSLC / CBSE)",
];

export function EducationModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EducationModalProps) {
  const isEditing = Boolean(initialData?.id);

  const [institution, setInstitution] = useState(initialData?.institution || "");
  const [degree, setDegree] = useState(initialData?.degree || "");
  const [level, setLevel] = useState(initialData?.level || "UG");
  const [fieldOfStudy, setFieldOfStudy] = useState(initialData?.fieldOfStudy || "");
  const [startYear, setStartYear] = useState(
    initialData?.startYear ? String(initialData.startYear) : ""
  );
  const [endYear, setEndYear] = useState(
    initialData?.endYear ? String(initialData.endYear) : ""
  );
  const [isCurrent, setIsCurrent] = useState(Boolean(initialData?.isCurrent));
  const [score, setScore] = useState(initialData?.score || initialData?.scoreOrGrade || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!institution.trim()) {
      setError("Institution name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      id: initialData?.id,
      institution: institution.trim(),
      degree: degree.trim() || level,
      level,
      fieldOfStudy: fieldOfStudy.trim() || null,
      startYear: startYear ? Number(startYear) : null,
      endYear: isCurrent ? null : endYear ? Number(endYear) : null,
      isCurrent,
      scoreOrGrade: score.trim() || null,
    };

    try {
      const res = await fetch("/api/passport/educations", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save education record.");
      }

      onSuccess(data.education, data.score);
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
      aria-labelledby="education-modal-title"
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
              <GraduationCap size={18} />
            </div>
            <div>
              <h2 id="education-modal-title" className="text-lg font-bold text-[#2B1B1B]">
                {isEditing ? "Edit Education Record" : "Add Education Record"}
              </h2>
              <p className="text-xs text-[#907D79]">
                Document your academic milestone and credentials.
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
          <div>
            <label className="block text-xs font-semibold text-[#59413F]">
              Institution / College Name *
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Visvesvaraya Technological University"
              required
              className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Degree / Qualification Level
              </label>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  if (!degree) setDegree(e.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs bg-white focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              >
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Field of Study / Specialization
              </label>
              <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="e.g. Computer Science, Accounting"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Start Year
              </label>
              <input
                type="number"
                min="1990"
                max="2035"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                placeholder="2021"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                End Year
              </label>
              <input
                type="number"
                min="1990"
                max="2035"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                disabled={isCurrent}
                placeholder="2025"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Score / CGPA
              </label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 8.85 or 88%"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentEducation"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded text-[#7A0F1F] focus:ring-[#7A0F1F]"
            />
            <label htmlFor="isCurrentEducation" className="text-xs text-[#59413F]">
              I am currently pursuing this degree
            </label>
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
              <span>{saving ? "Saving…" : isEditing ? "Update Education" : "Add Education"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
