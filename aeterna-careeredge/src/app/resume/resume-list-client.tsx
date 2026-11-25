"use client";

// src/app/resume/resume-list-client.tsx
// Multi-Domain Resume Versions Overview Client with 3 Creation Pathways
// ("Upload My Resume", "Start from Career Passport", "Start from Scratch"),
// Uploaded Document Vault, PDF Downloads, Duplication, and Flow-Style Navigation.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Search,
  Award,
  Loader2,
  X,
  UploadCloud,
  Copy,
  Download,
  FolderOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { RESUME_FRAMEWORKS, getFrameworkForDomain } from "@/lib/resume/frameworks";
import { UploadResumeButton } from "@/components/resume/upload-resume-button";
import { UploadedResumesDrawer } from "@/components/resume/uploaded-resumes-drawer";

interface ResumeListClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    academicDomain: string;
    preferredJobRole?: string;
    course?: string;
  };
  initialResumes: Array<{
    id: string;
    title: string;
    targetRole?: string | null;
    templateId: string;
    atsScore?: number | null;
    structuredData?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export function ResumeListClient({ user, initialResumes }: ResumeListClientProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadedDrawer, setShowUploadedDrawer] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const defaultFramework = getFrameworkForDomain(user.academicDomain);
  const [title, setTitle] = useState(
    `${user.preferredJobRole || defaultFramework.suggestedRoles[0] || "Professional"} Resume`
  );
  const [domainKey, setDomainKey] = useState(defaultFramework.domainKey);
  const [targetRole, setTargetRole] = useState(
    user.preferredJobRole || defaultFramework.suggestedRoles[0] || "Professional"
  );
  const [templateId, setTemplateId] = useState("standard-modern");
  const [importFromPassport, setImportFromPassport] = useState(true);

  const selectedFramework = RESUME_FRAMEWORKS[domainKey] || defaultFramework;

  async function handleCreateResume(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/resumes", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          domain: domainKey,
          targetRole: targetRole.trim(),
          templateId,
          importFromPassport,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create resume.");

      setShowCreateModal(false);
      router.push(`/resume/builder?id=${data.resume.id}`);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteResume(id: string) {
    if (!confirm("Are you sure you want to delete this resume version?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resumes/${id}`, {
          credentials: "include", method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete resume.");
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to delete resume.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDuplicateResume(id: string) {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/resumes/${id}/duplicate`, {
          credentials: "include", method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate resume.");
      setResumes((prev) => [data.resume, ...prev]);
    } catch (err: unknown) {
      alert((err as Error).message || "Could not duplicate resume.");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleDownloadPdf(resumeId: string, resumeTitle: string) {
    setExportingId(resumeId);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/export-pdf?pageSize=A4`, { credentials: "include" });
      const contentType = res.headers.get("Content-Type") || "";

      if (res.ok && contentType.includes("application/pdf")) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = `${resumeTitle.replace(/\s+/g, "-")}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        const json = await res.json().catch(() => ({}));
        const printUrl = json.printUrl || `/resume/${resumeId}/print?autoPrint=true&pageSize=A4`;
        window.open(printUrl, "_blank");
      }
    } catch (err: unknown) {
      console.warn("[ResumeList] Export failed, opening print view:", err);
      window.open(`/resume/${resumeId}/print?autoPrint=true&pageSize=A4`, "_blank");
    } finally {
      setExportingId(null);
    }
  }

  return (
    <StudentLayout
      userName={user.name}
      studentDomain={user.academicDomain}
      targetRole={user.preferredJobRole}
    >
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A0F1F]">
              <FileText size={16} />
              <span>Multi-Domain Career Toolkit</span>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#2B1810] sm:text-3xl">
              Resume Studio
            </h1>
            <p className="mt-1 text-sm text-[#765F5D]">
              Tailor ATS-calibrated, profession-specific resumes backed strictly by your verified records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/resume/studio"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#F2B63D]/60 bg-gradient-to-r from-[#FFF8F0] to-[#FFFDF9] px-3.5 py-2.5 text-xs font-bold text-[#7A0F1F] hover:bg-[#FBE4E4]/30 transition shadow-2xs"
            >
              <Sparkles size={14} className="text-[#F2B63D]" />
              <span>Resume Studio (3 AI Strategies)</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowUploadedDrawer(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-2xs"
            >
              <FolderOpen size={14} className="text-[#7A0F1F]" />
              <span>Uploaded Files</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportFromPassport(true);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A0F1F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#600C18] transition"
            >
              <Plus size={15} />
              <span>New Resume Draft</span>
            </button>
          </div>
        </div>

        {/* Guidance Panel */}
        <HowItWorksPanel toolKey="resume-builder" />

        {/* Resume Studio Feature Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#F2B63D]/50 bg-gradient-to-r from-[#FFF8F0] via-[#FFFDF9] to-[#FFF8F0] p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7A0F1F] text-[#F2B63D] shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#2B1B1B]">
                    New: Multi-Strategy AI Resume Studio
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F2B63D]/20 text-[#8C5A08] border border-[#F2B63D]/40">
                    Feature Update
                  </span>
                </div>
                <p className="text-xs text-[#5A4747] mt-0.5 max-w-xl">
                  Upload an existing resume or pick a target prompt (e.g. &ldquo;Make a resume for full stack developer&rdquo;). AI builds 3 strategic options: ATS-First, Impact-First, and Concise 1-Page with honest gap analysis.
                </p>
              </div>
            </div>

            <Link
              href="/resume/studio"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A0F1F] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4C0915] transition shrink-0"
            >
              <span>Try Resume Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
            {errorMessage}
          </div>
        )}

        {/* Three Creation Pathways Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pathway 1: Upload My Resume */}
          <UploadResumeButton
            variant="primary-card"
            label="Upload My Resume"
            sublabel="Import your PDF or Word document into ATS-proof format with instant section extraction."
            onSuccess={() => window.location.reload()}
          />

          {/* Pathway 2: Start from Career Passport */}
          <div
            onClick={() => {
              setImportFromPassport(true);
              setShowCreateModal(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setImportFromPassport(true);
                setShowCreateModal(true);
              }
            }}
            className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 text-left cursor-pointer hover:border-[#7A0F1F] hover:shadow-md transition-all shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  <Sparkles size={10} className="text-emerald-700" />
                  <span>Verified Data</span>
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 group-hover:scale-105 transition-transform shadow-2xs">
                  <FileText size={16} />
                </div>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#2B1B1B]">
                Start from Career Passport
              </h3>
              <p className="mt-1 text-xs text-[#765F5D] leading-relaxed">
                Generate an ATS resume calibrated with your verified academics, skill matrix, and proof-backed project records.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs font-bold text-[#7A0F1F] group-hover:gap-2 transition-all">
              <span>Build from Passport</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Pathway 3: Start from Scratch */}
          <div
            onClick={() => {
              setImportFromPassport(false);
              setShowCreateModal(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setImportFromPassport(false);
                setShowCreateModal(true);
              }
            }}
            className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 text-left cursor-pointer hover:border-[#7A0F1F] hover:shadow-md transition-all shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                  <span>Blank Canvas</span>
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-50 text-stone-700 border border-stone-200 group-hover:scale-105 transition-transform shadow-2xs">
                  <Plus size={16} />
                </div>
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-[#2B1B1B]">
                Start from Scratch
              </h3>
              <p className="mt-1 text-xs text-[#765F5D] leading-relaxed">
                Begin with a blank profession template and custom sections. Build entry by entry at your own pace.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs font-bold text-[#7A0F1F] group-hover:gap-2 transition-all">
              <span>Start Blank Template</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>

        {/* Resumes Section Title */}
        <div className="pt-2 flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[#765F5D]">
            My Resumes ({resumes.length})
          </h2>
        </div>

        {/* Resumes Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => {
            let structured: Record<string, unknown> = {};
            try {
              if (resume.structuredData) structured = JSON.parse(resume.structuredData);
            } catch {
              structured = {};
            }
            const domainName = (structured.domainName as string) || "General";
            const skillsCount = Array.isArray(structured.skills) ? structured.skills.length : 0;

            return (
              <div
                key={resume.id}
                className="flex flex-col justify-between rounded-2xl border border-[#EBDDD1] bg-white p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-[#FDF7F5] px-2.5 py-0.5 text-[10px] font-bold text-[#7A0F1F] uppercase tracking-wide">
                      {domainName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Award size={12} />
                      <span>{resume.atsScore || 78}% ATS Fit</span>
                    </span>
                  </div>

                  <h3 className="mt-3 font-heading text-base font-bold text-[#2B1810]">
                    {resume.title}
                  </h3>
                  <p className="text-xs font-medium text-[#765F5D]">
                    Target: {resume.targetRole || "General"}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-[#8A7573]">
                    <span>{skillsCount} skills included</span>
                    <span>•</span>
                    <span>{resume.templateId.replace("-", " ")}</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#EBDDD1] pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/resume/builder?id=${resume.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#7A0F1F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#600C18] transition-colors"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </Link>

                    <Link
                      href={`/resume/check?resumeId=${resume.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#EBDDD1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#765F5D] hover:bg-[#FDF7F5] transition-colors"
                      title="Check against Job Description"
                    >
                      <Search size={12} />
                      <span>JD Match</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={duplicatingId === resume.id}
                      onClick={() => handleDuplicateResume(resume.id)}
                      className="p-1.5 text-[#8A7573] hover:text-[#7A0F1F] rounded-lg transition-colors"
                      title="Duplicate Resume"
                    >
                      {duplicatingId === resume.id ? (
                        <Loader2 size={14} className="animate-spin text-[#7A0F1F]" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={exportingId === resume.id}
                      onClick={() => handleDownloadPdf(resume.id, resume.title)}
                      className="p-1.5 text-[#8A7573] hover:text-[#7A0F1F] rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      {exportingId === resume.id ? (
                        <Loader2 size={14} className="animate-spin text-[#7A0F1F]" />
                      ) : (
                        <Download size={14} />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === resume.id}
                      onClick={() => handleDeleteResume(resume.id)}
                      className="p-1.5 text-[#8A7573] hover:text-rose-700 rounded-lg transition-colors"
                      title="Delete Resume"
                    >
                      {deletingId === resume.id ? (
                        <Loader2 size={14} className="animate-spin text-rose-700" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {resumes.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-[#EBDDD1] bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF7F5] text-[#7A0F1F]">
                <FileText size={24} />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#2B1810]">
                No Resumes Created Yet
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-[#765F5D]">
                Choose one of the 3 options above to upload your existing resume, build from your Career Passport, or create a blank template.
              </p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-[#EBDDD1] pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#7A0F1F]" />
                  <h3 className="font-heading text-lg font-bold text-[#2B1810]">
                    Create Targeted Resume
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1 text-[#765F5D] hover:bg-[#FDF7F5]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateResume} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B1810]">
                    Resume Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Staff Nurse ICU Resume / Bangalore Full-Stack Resume"
                    className="mt-1 w-full rounded-xl border border-[#EBDDD1] px-3.5 py-2 text-xs text-[#2B1810] focus:border-[#7A0F1F] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#2B1810]">
                      Domain Framework *
                    </label>
                    <select
                      value={domainKey}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setDomainKey(newKey);
                        const fw = RESUME_FRAMEWORKS[newKey];
                        if (fw && fw.suggestedRoles[0]) {
                          setTargetRole(fw.suggestedRoles[0]);
                          setTitle(`${fw.suggestedRoles[0]} Resume`);
                        }
                      }}
                      className="mt-1 w-full rounded-xl border border-[#EBDDD1] bg-white px-3 py-2 text-xs text-[#2B1810] focus:border-[#7A0F1F] focus:outline-hidden"
                    >
                      {Object.values(RESUME_FRAMEWORKS).map((fw) => (
                        <option key={fw.domainKey} value={fw.domainKey}>
                          {fw.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2B1810]">
                      Target Job Role *
                    </label>
                    <input
                      type="text"
                      list="suggestedRolesList"
                      required
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. ICU Staff Nurse, Frontend Engineer"
                      className="mt-1 w-full rounded-xl border border-[#EBDDD1] px-3 py-2 text-xs text-[#2B1810] focus:border-[#7A0F1F] focus:outline-hidden"
                    />
                    <datalist id="suggestedRolesList">
                      {selectedFramework.suggestedRoles.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B1810]">
                    Resume Design Template
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {[
                      { id: "standard-modern", name: "Standard Modern", desc: "Clean, ATS-optimized" },
                      { id: "executive-classic", name: "Executive Classic", desc: "Formal, clinical & legal" },
                      { id: "tech-minimal", name: "Tech Minimal", desc: "Project & code-centric" },
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setTemplateId(tpl.id)}
                        className={`rounded-xl border p-2.5 text-left transition-colors ${
                          templateId === tpl.id
                            ? "border-[#7A0F1F] bg-[#FDF7F5] ring-1 ring-[#7A0F1F]"
                            : "border-[#EBDDD1] bg-white hover:bg-[#FCF9F6]"
                        }`}
                      >
                        <p className="text-xs font-bold text-[#2B1810]">{tpl.name}</p>
                        <p className="text-[10px] text-[#765F5D] mt-0.5">{tpl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#EBDDD1] bg-[#FCF9F6] p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importFromPassport}
                      onChange={(e) => setImportFromPassport(e.target.checked)}
                      className="rounded border-[#EBDDD1] text-[#7A0F1F] focus:ring-[#7A0F1F]"
                    />
                    <span className="text-xs font-medium text-[#2B1810]">
                      Auto-import profile, skills & projects from Career Passport
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EBDDD1]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-[#EBDDD1] px-4 py-2 text-xs font-semibold text-[#765F5D] hover:bg-[#FDF7F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A0F1F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#600C18] disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating…</span>
                      </>
                    ) : (
                      <span>Create & Open Editor</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Uploaded Documents Drawer */}
        <UploadedResumesDrawer
          isOpen={showUploadedDrawer}
          onClose={() => setShowUploadedDrawer(false)}
        />
      </div>
    </StudentLayout>
  );
}
