"use client";

// src/components/passport/skill-modal.tsx
// Modal for adding a new student skill or competency

import React, { useState } from "react";
import { X, Plus, AlertCircle, Code } from "lucide-react";

export interface SkillItem {
  id?: string;
  name: string;
  category?: string | null;
  level?: string | null;
  proficiencyLevel?: string | null;
}

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: SkillItem, score: number) => void;
}

const SKILL_CATEGORIES = [
  { value: "TECHNICAL", label: "Technical Competency" },
  { value: "DOMAIN", label: "Academic / Industry Domain" },
  { value: "TOOL", label: "Software / Tool" },
  { value: "SOFT", label: "Professional & Soft Skill" },
];

const PROFICIENCY_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
];

export function SkillModal({
  isOpen,
  onClose,
  onSuccess,
}: SkillModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("TECHNICAL");
  const [level, setLevel] = useState("INTERMEDIATE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Skill name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/passport/skills", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          proficiencyLevel: level,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add skill.");
      }

      onSuccess(
        {
          id: data.skill.id,
          name: data.skill.name,
          category: data.skill.category,
          level: data.skill.proficiencyLevel || level,
        },
        data.score
      );
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
      aria-labelledby="skill-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto ce-scrollbar my-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0E1DE] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E8EA] text-[#7A0F1F]">
              <Code size={18} />
            </div>
            <div>
              <h2 id="skill-modal-title" className="text-lg font-bold text-[#2B1B1B]">
                Add Skill to Passport
              </h2>
              <p className="text-xs text-[#907D79]">
                Benchmark verified competency against industry standards.
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
              Skill / Tool Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Python, Financial Modeling, React.js"
              required
              className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs bg-white focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Proficiency Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs bg-white focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              >
                {PROFICIENCY_LEVELS.map((pl) => (
                  <option key={pl.value} value={pl.value}>
                    {pl.label}
                  </option>
                ))}
              </select>
            </div>
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
              <Plus size={14} />
              <span>{saving ? "Adding…" : "Add Skill"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
