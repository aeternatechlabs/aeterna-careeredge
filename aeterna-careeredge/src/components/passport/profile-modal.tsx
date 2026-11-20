"use client";

// src/components/passport/profile-modal.tsx
// Modal for editing student master profile & contact details

import React, { useState } from "react";
import { X, Save, AlertCircle, UserCheck } from "lucide-react";
import { ACADEMIC_DOMAINS } from "@/types/onboarding";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: {
    user: { name: string; mobile?: string | null };
    profile: {
      headline?: string | null;
      academicDomain?: string | null;
      course?: string | null;
      institution?: string | null;
      preferredJobRole?: string | null;
      targetIndustry?: string | null;
      gradingType?: string | null;
      gradeValue?: string | null;
      graduationYear?: number | null;
      passportScore?: number | null;
    };
    score: number;
  }) => void;
  initialData: {
    name: string;
    mobile?: string | null;
    headline?: string | null;
    academicDomain?: string | null;
    course?: string | null;
    institution?: string | null;
    preferredJobRole?: string | null;
    targetIndustry?: string | null;
    gradingType?: string | null;
    gradeValue?: string | null;
    graduationYear?: number | null;
  };
}

export function ProfileModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProfileModalProps) {
  const [name, setName] = useState(initialData.name || "");
  const [mobile, setMobile] = useState(initialData.mobile || "");
  const [academicDomain, setAcademicDomain] = useState(initialData.academicDomain || "");
  const [institution, setInstitution] = useState(initialData.institution || "");
  const [course, setCourse] = useState(initialData.course || "");
  const [graduationYear, setGraduationYear] = useState(
    initialData.graduationYear ? String(initialData.graduationYear) : ""
  );
  const [gradingType, setGradingType] = useState(initialData.gradingType || "CGPA");
  const [gradeValue, setGradeValue] = useState(initialData.gradeValue || "");
  const [preferredJobRole, setPreferredJobRole] = useState(initialData.preferredJobRole || "");
  const [targetIndustry, setTargetIndustry] = useState(initialData.targetIndustry || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/passport/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim() || null,
          academicDomain: academicDomain || null,
          institution: institution.trim() || null,
          course: course.trim() || null,
          graduationYear: graduationYear ? Number(graduationYear) : null,
          gradingType: gradingType || null,
          gradeValue: gradeValue.trim() || null,
          preferredJobRole: preferredJobRole.trim() || null,
          targetIndustry: targetIndustry.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile changes.");
      }

      onSuccess(data);
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
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto ce-scrollbar my-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0E1DE] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E8EA] text-[#7A0F1F]">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-lg font-bold text-[#2B1B1B]">
                Edit Master Career Profile
              </h2>
              <p className="text-xs text-[#907D79]">
                Update your academic domain, institution, and target roles.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#59413F]">
              Academic & Professional Domain
            </label>
            <select
              value={academicDomain}
              onChange={(e) => setAcademicDomain(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs bg-white focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
            >
              <option value="">Select Domain…</option>
              {ACADEMIC_DOMAINS.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                College / Institution Name
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. RV College of Engineering"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Course / Degree Program
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Graduation Year
              </label>
              <input
                type="number"
                min="2000"
                max="2035"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="e.g. 2025"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Grading System
              </label>
              <select
                value={gradingType}
                onChange={(e) => setGradingType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs bg-white focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              >
                <option value="CGPA">CGPA (out of 10)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="GRADE">Letter Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Score / Grade
              </label>
              <input
                type="text"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                placeholder="e.g. 8.85 or 88%"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Target Professional Role
              </label>
              <input
                type="text"
                value={preferredJobRole}
                onChange={(e) => setPreferredJobRole(e.target.value)}
                placeholder="e.g. Full Stack Engineer / Financial Analyst"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Target Industry
              </label>
              <input
                type="text"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                placeholder="e.g. Technology / FinTech / Healthcare"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              <span>{saving ? "Saving…" : "Save Profile Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
