"use client";

// src/components/passport/project-modal.tsx
// Modal for adding or editing student practical projects

import React, { useState } from "react";
import { X, Save, AlertCircle, FolderGit2 } from "lucide-react";

export interface ProjectItem {
  id?: string;
  title: string;
  description?: string | null;
  role?: string | null;
  technologies?: string | null;
  toolsOrTechnologies?: string | null;
  projectType?: string | null;
  url?: string | null;
  projectUrl?: string | null;
  artifactUrl?: string | null;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: ProjectItem, score: number) => void;
  initialData?: ProjectItem | null;
}

const PROJECT_TYPES = [
  { value: "PRACTICAL", label: "Practical / Industry Project" },
  { value: "ACADEMIC", label: "Academic Capstone / Coursework" },
  { value: "RESEARCH", label: "Research Paper / Case Study" },
  { value: "CREATIVE", label: "Design / Creative Portfolio" },
];

export function ProjectModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProjectModalProps) {
  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [projectType, setProjectType] = useState(initialData?.projectType || "PRACTICAL");
  const [technologies, setTechnologies] = useState(
    initialData?.technologies || initialData?.toolsOrTechnologies || ""
  );
  const [projectUrl, setProjectUrl] = useState(
    initialData?.url || initialData?.projectUrl || ""
  );
  const [artifactUrl, setArtifactUrl] = useState(initialData?.artifactUrl || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      id: initialData?.id,
      title: title.trim(),
      role: role.trim() || null,
      projectType,
      technologies: technologies.trim() || null,
      projectUrl: projectUrl.trim() || null,
      artifactUrl: artifactUrl.trim() || null,
      description: description.trim() || "Executed practical deliverables.",
    };

    try {
      const res = await fetch("/api/passport/projects", {
          credentials: "include",
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save project.");
      }

      onSuccess(data.project, data.score);
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
      aria-labelledby="project-modal-title"
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
              <FolderGit2 size={18} />
            </div>
            <div>
              <h2 id="project-modal-title" className="text-lg font-bold text-[#2B1B1B]">
                {isEditing ? "Edit Practical Project" : "Add Practical Project"}
              </h2>
              <p className="text-xs text-[#907D79]">
                Showcase deliverables, tools used, and live artifact links.
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
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Healthcare Clinical Records Ledger"
              required
              className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Your Role in Project
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead Developer, Analyst, Sole Contributor"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Project Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs bg-white focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              >
                {PROJECT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#59413F]">
              Tools &amp; Technologies Used
            </label>
            <input
              type="text"
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              placeholder="e.g. Next.js, TypeScript, SQLite, Tailwind (comma-separated)"
              className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Live URL or Repository Link
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://github.com/... or https://..."
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#59413F]">
                Artifact / Demo Link
              </label>
              <input
                type="url"
                value={artifactUrl}
                onChange={(e) => setArtifactUrl(e.target.value)}
                placeholder="https://drive.google.com/... or demo link"
                className="mt-1 w-full rounded-xl border border-[#F0E1DE] px-3 py-2 text-xs focus:border-[#7A0F1F] focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#59413F]">
              Project Description &amp; Deliverables
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe key responsibilities, problem statement solved, and measurable outcomes..."
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
              <span>{saving ? "Saving…" : isEditing ? "Update Project" : "Add Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
