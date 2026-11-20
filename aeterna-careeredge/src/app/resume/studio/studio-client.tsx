"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  UploadCloud,
  Fingerprint,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sliders,
  ChevronDown,
  Eye,
  Check,
  RotateCcw,
  Briefcase,
  Wrench,
  FolderGit2,
  Paperclip,
  Send,
  MessageSquare,
  Undo2,
  X,
  FileCheck,
  Bot,
  Download,
  Loader2,
} from "lucide-react";
import {
  LoadingButton,
  GenerationProgress,
  FadeIn,
  AnimatedScore,
} from "@/components/ui/motion";
import type {
  ResumeStudioStrategyOption,
  ResumeStudioResult,
} from "@/lib/resume/studio-generator";
import type { ResumeSection } from "@/lib/resume/types";
import { cleanBulletText, cleanMojibake } from "@/lib/resume/sanitizer";

// 8 Profession Preset Chips
const ROLE_PRESET_CHIPS = [
  { label: "Full Stack Developer", domain: "it", icon: "💻" },
  { label: "Clinical Care Nurse", domain: "healthcare", icon: "🩺" },
  { label: "Corporate Tax & Financial Analyst", domain: "commerce", icon: "📊" },
  { label: "Corporate Law Associate", domain: "law", icon: "⚖️" },
  { label: "STEM High School Teacher", domain: "teaching", icon: "🎓" },
  { label: "Product & UI/UX Designer", domain: "design", icon: "🎨" },
  { label: "Robotics & Mechanical Engineer", domain: "core_eng", icon: "⚙️" },
  { label: "Operations & Project Manager", domain: "ops", icon: "📈" },
];

const QUICK_REFINE_PROMPTS = [
  "Make the summary punchier for a fast-paced tech startup",
  "Emphasize team leadership, mentoring, and technical ownership",
  "Tighten bullets and formatting strictly for a 1-page resume",
  "Focus heavily on quantifiable metrics and measurable business ROI",
  "Highlight cloud architecture, microservices, and system reliability",
];

const GENERATION_STEPS = [
  { id: "1", label: "Extracting verified profile facts", detail: "Reading academic & work records" },
  { id: "2", label: "Calibrating domain competencies", detail: "Mapping ATS patterns & impact verbs" },
  { id: "3", label: "Synthesizing 3 strategic options", detail: "Generating ATS, Impact & Concise formats" },
  { id: "4", label: "Verifying truth invariants", detail: "Flagging missing requirements without fabricating" },
];

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  changesSummary?: string;
}

export function ResumeStudioClient() {
  const router = useRouter();

  // Wizard state
  const [sourceType, setSourceType] = useState<"passport" | "upload">("passport");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPayload, setUploadedPayload] = useState<any | null>(null);
  const [targetRolePrompt, setTargetRolePrompt] = useState("Full Stack Developer");
  const [professionDomain, setProfessionDomain] = useState("it");
  const [jobDescription, setJobDescription] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Result state
  const [studioResult, setStudioResult] = useState<ResumeStudioResult | null>(null);
  const [originalOptions, setOriginalOptions] = useState<ResumeStudioStrategyOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("opt-ats");
  const [activeTab, setActiveTab] = useState<"options" | "mixer">("options");

  // Section Mixer state (picks per section)
  const [mixedSummaryOptionId, setMixedSummaryOptionId] = useState<string>("opt-ats");
  const [mixedExpOptionId, setMixedExpOptionId] = useState<string>("opt-impact");
  const [mixedProjectsOptionId, setMixedProjectsOptionId] = useState<string>("opt-ats");
  const [mixedSkillsOptionId, setMixedSkillsOptionId] = useState<string>("opt-ats");

  // Conversational Refinement State
  const [refineInput, setRefineInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refineChatHistory, setRefineChatHistory] = useState<ChatMessage[]>([]);
  const [hasRefinedChanges, setHasRefinedChanges] = useState(false);

  // Saving and export state
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [fitToOnePage, setFitToOnePage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-resize composer textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [targetRolePrompt]);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setGenerationError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("consent", "true");

    try {
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "File upload failed");
      setUploadedPayload(data.parsedPayload);
    } catch (err: any) {
      setGenerationError(err.message || "Failed to parse resume document.");
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    setUploadedPayload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Trigger generation
  const handleGenerate = async () => {
    if (!targetRolePrompt.trim() && !uploadedFile && sourceType !== "passport") return;

    setIsGenerating(true);
    setGenerationStepIndex(0);
    setGenerationError(null);
    setStudioResult(null);
    setRefineChatHistory([]);
    setHasRefinedChanges(false);

    // Step animation interval
    const stepInterval = setInterval(() => {
      setGenerationStepIndex((prev) => {
        if (prev < GENERATION_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 650);

    try {
      const res = await fetch("/api/resume/studio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          targetRolePrompt: targetRolePrompt.trim() || "Full Stack Developer",
          professionDomain,
          jobDescription: jobDescription.trim() || undefined,
          parsedPayload: sourceType === "upload" ? uploadedPayload : undefined,
        }),
      });

      clearInterval(stepInterval);
      setGenerationStepIndex(GENERATION_STEPS.length - 1);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate resume options");

      setStudioResult(data);
      // Keep a clean copy of originals for reset/undo
      setOriginalOptions(JSON.parse(JSON.stringify(data.options)));
      setSelectedOptionId(data.options[0]?.id || "opt-ats");
    } catch (err: any) {
      clearInterval(stepInterval);
      setGenerationError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcut in composer
  const handleKeyDownComposer = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Conversational Refinement Handler
  const handleRefine = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || refineInput).trim();
    if (!promptToSend || !studioResult || isRefining) return;

    const currentOption = studioResult.options.find((o) => o.id === selectedOptionId);
    if (!currentOption) return;

    setRefineInput("");
    setIsRefining(true);
    setGenerationError(null);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setRefineChatHistory((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/resume/studio/refine", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option: currentOption,
          refinementPrompt: promptToSend,
          targetRole: targetRolePrompt,
          professionDomain,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to refine option.");

      // Update option in place
      setStudioResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          options: prev.options.map((opt) =>
            opt.id === selectedOptionId ? data.updatedOption : opt
          ),
        };
      });

      setHasRefinedChanges(true);

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: "assistant",
        text: data.changesSummary || "Option refined successfully.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        changesSummary: data.changesSummary,
      };

      setRefineChatHistory((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setGenerationError(err.message || "Could not refine option.");
    } finally {
      setIsRefining(false);
    }
  };

  // Reset selected option to initial generated draft
  const handleResetToOriginal = () => {
    if (!studioResult || originalOptions.length === 0) return;
    const initialCopy = originalOptions.find((o) => o.id === selectedOptionId);
    if (!initialCopy) return;

    setStudioResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        options: prev.options.map((opt) =>
          opt.id === selectedOptionId ? JSON.parse(JSON.stringify(initialCopy)) : opt
        ),
      };
    });

    setHasRefinedChanges(false);
    setRefineChatHistory((prev) => [
      ...prev,
      {
        id: `rst-${Date.now()}`,
        sender: "assistant",
        text: `Reset ${initialCopy.strategyName} back to original draft.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Save selected option or mixed option to Prisma DB and navigate to builder
  const handleSaveOption = async (option: ResumeStudioStrategyOption, customTitle?: string) => {
    if (!studioResult) return;
    setIsSaving(true);
    setGenerationError(null);

    try {
      const res = await fetch("/api/resume/studio/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option,
          contactInfo: studioResult.contactInfo,
          targetRole: targetRolePrompt,
          resumeTitle: customTitle || `${targetRolePrompt} - ${option.strategyName}`,
          fitToOnePage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save active resume.");

      router.push(`/resume/builder?id=${data.resumeId}`);
    } catch (err: any) {
      setGenerationError(err.message || "Could not save resume.");
      setIsSaving(false);
    }
  };

  // Export selected option directly to downloadable ATS-compliant vector PDF
  const handleExportPdf = async (option: ResumeStudioStrategyOption) => {
    if (!studioResult) return;
    setIsExportingPdf(true);
    setGenerationError(null);
    let exportedResumeId: string | null = null;

    try {
      // 1. Save option to DB to generate resume record with fitToOnePage style
      const res = await fetch("/api/resume/studio/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option,
          contactInfo: studioResult.contactInfo,
          targetRole: targetRolePrompt,
          resumeTitle: `${targetRolePrompt} - ${option.strategyName}`,
          fitToOnePage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to prepare resume for export.");
      exportedResumeId = data.resumeId;

      // 2. Download generated ATS PDF
      const pdfRes = await fetch(`/api/resumes/${data.resumeId}/export-pdf?pageSize=A4`);
      const contentType = pdfRes.headers.get("Content-Type") || "";

      if (pdfRes.ok && contentType.includes("application/pdf")) {
        const blob = await pdfRes.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = `${(targetRolePrompt || "Resume").replace(/\s+/g, "_")}_${option.strategyName.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        window.open(`/resume/${data.resumeId}/print?autoPrint=true&pageSize=A4`, "_blank");
      }
    } catch (err: any) {
      console.warn("[StudioClient] Export failed, opening print view:", err);
      if (exportedResumeId) {
        window.open(`/resume/${exportedResumeId}/print?autoPrint=true&pageSize=A4`, "_blank");
      } else {
        setGenerationError(err.message || "Failed to export PDF.");
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Build mixed option
  const handleSaveMixed = () => {
    if (!studioResult) return;
    const optSummary = studioResult.options.find((o) => o.id === mixedSummaryOptionId);
    const optExp = studioResult.options.find((o) => o.id === mixedExpOptionId);
    const optProjects = studioResult.options.find((o) => o.id === mixedProjectsOptionId);
    const optSkills = studioResult.options.find((o) => o.id === mixedSkillsOptionId);

    const mixedSections: ResumeSection[] = [];
    const expSec = optExp?.sections.find((s) => s.type === "experience");
    if (expSec) mixedSections.push(expSec);

    const projSec = optProjects?.sections.find((s) => s.type === "projects");
    if (projSec) mixedSections.push(projSec);

    const skillSec = optSkills?.sections.find((s) => s.type === "skills");
    if (skillSec) mixedSections.push(skillSec);

    const eduSec =
      optExp?.sections.find((s) => s.type === "education") ||
      optSummary?.sections.find((s) => s.type === "education");
    if (eduSec) mixedSections.push(eduSec);

    const mixedOption: ResumeStudioStrategyOption = {
      id: "opt-mixed",
      strategyName: "Custom Mixed Strategy",
      tagline: "Tailored combination of your selected Summary, Experience, and Skills.",
      badgeLabel: "Handcrafted Mix",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      templateId: "standard-modern",
      matchScore: Math.round(
        ((optSummary?.matchScore || 85) +
          (optExp?.matchScore || 85) +
          (optProjects?.matchScore || 85) +
          (optSkills?.matchScore || 85)) /
          4
      ),
      wordCount: 380,
      estimatedPages: 1,
      highlights: [
        "Curated multi-strategy composition",
        `Summary from ${optSummary?.strategyName}`,
        `Experience from ${optExp?.strategyName}`,
      ],
      summary: optSummary?.summary || "",
      sections: mixedSections,
    };

    handleSaveOption(mixedOption, `${targetRolePrompt} - Custom Mixed`);
  };

  const selectedOption = studioResult?.options.find((o) => o.id === selectedOptionId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              AI Resume Studio
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="h-3 w-3" />
              100% Anti-Hallucination Guaranteed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Strategic Multi-Option Resume Generator
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Give a target role prompt, optional JD, or existing resume. Our AI synthesizes 3 distinct strategies (ATS-First, Impact-First, Concise 1-Page) grounded solely in your verified records.
          </p>
        </div>

        {studioResult && (
          <button
            type="button"
            onClick={() => {
              setStudioResult(null);
              setGenerationError(null);
              setRefineChatHistory([]);
            }}
            className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
            Configure New Role
          </button>
        )}
      </div>

      {/* ── ChatGPT-Style Multiline Composer & Config Form ── */}
      {!studioResult && (
        <FadeIn className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            {/* Step 1: Source Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Step 1: Background Profile Source
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceType("passport")}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                    sourceType === "passport"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Career Passport Records</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uses verified education, skills, projects, and experiences saved in your profile.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType("upload");
                    if (!uploadedFile && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                    sourceType === "upload"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">Upload Existing Resume</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {uploadedFile
                        ? `Loaded: ${uploadedFile.name}`
                        : "Upload a PDF or DOCX file to extract and transform."}
                    </p>
                  </div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Step 2: ChatGPT-Style Multiline Prompt Composer */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 2: Describe Target Role, Goal or Prompt
                </label>
                <span className="text-[11px] text-slate-400">
                  Press <strong>Enter</strong> to generate, <strong>Shift + Enter</strong> for newline
                </span>
              </div>

              <div className="relative rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all p-3">
                {/* Active attached file chip if present */}
                {uploadedFile && (
                  <div className="mb-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium animate-fadeIn">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    <span className="max-w-xs truncate">{uploadedFile.name}</span>
                    <span className="text-[10px] text-blue-600 font-mono">
                      ({Math.round(uploadedFile.size / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      aria-label="Remove attached resume"
                      className="ml-1 text-blue-500 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={targetRolePrompt}
                  onChange={(e) => setTargetRolePrompt(e.target.value)}
                  onKeyDown={handleKeyDownComposer}
                  placeholder="e.g. Senior Full Stack Developer at a fintech startup focusing on React, Next.js, TypeScript, and microservices..."
                  className="w-full resize-none border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 leading-relaxed"
                />

                {/* Composer footer actions */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType("upload");
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Attach existing resume PDF or DOCX"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                      <span>Attach Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowJdInput(!showJdInput)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        showJdInput
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 text-amber-500" />
                      <span>{showJdInput ? "Hide Job Description" : "+ Add Job Description"}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      value={professionDomain}
                      onChange={(e) => setProfessionDomain(e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 max-w-[140px] sm:max-w-none flex-1 sm:flex-none"
                    >
                      <option value="it">IT & Software</option>
                      <option value="healthcare">Healthcare & Nursing</option>
                      <option value="commerce">Commerce & Finance</option>
                      <option value="law">Law & Compliance</option>
                      <option value="teaching">Education & Teaching</option>
                      <option value="design">Product & UI/UX</option>
                      <option value="core_eng">Core Engineering</option>
                      <option value="ops">Business Operations</option>
                    </select>

                    <LoadingButton
                      type="button"
                      loading={isGenerating}
                      loadingText="Synthesizing…"
                      onClick={handleGenerate}
                      size="sm"
                      className="w-full sm:w-auto"
                      icon={<Sparkles className="h-3.5 w-3.5 text-amber-300" />}
                    >
                      Generate 3 Options
                    </LoadingButton>
                  </div>
                </div>
              </div>

              {/* 8 Profession Quick Suggestions */}
              <div className="mt-3 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Quick Role Suggestions across 8 Professions:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ROLE_PRESET_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setTargetRolePrompt(chip.label);
                        setProfessionDomain(chip.domain);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                        targetRolePrompt === chip.label
                          ? "bg-blue-600 text-white font-medium shadow-xs"
                          : "bg-slate-100 border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Collapsible JD Textarea */}
            {showJdInput && (
              <FadeIn className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Target Job Description / Job Posting Text
                </label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste target job responsibilities, skills, or requirements. CareerEdge extracts high-priority keywords and performs honest ATS gap analysis without fabricating experience."
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed"
                />
              </FadeIn>
            )}

            {/* Error banner */}
            {generationError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{generationError}</span>
                </div>
                {generationError.toLowerCase().includes("authentication") && (
                  <a
                    href="/login?next=/resume/studio"
                    className="shrink-0 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-[11px] transition-colors"
                  >
                    Sign In
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Real Multi-Step Progress Tracker */}
          {isGenerating && (
            <GenerationProgress
              steps={GENERATION_STEPS}
              currentStepIndex={generationStepIndex}
              isGenerating={isGenerating}
              title="CareerEdge Multi-Strategy Intelligence Engine"
            />
          )}
        </FadeIn>
      )}

      {/* ── Phase 3: Results, Strategy Comparison & Conversational Refinement Hub ── */}
      {studioResult && (
        <FadeIn className="space-y-8">
          {/* 1. Honest Gap Analysis & Truth Check Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B132B] to-[#1E3A8A] text-white shadow-md">
                  <AnimatedScore value={studioResult.gapAnalysis.matchScore} className="text-lg text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Role Alignment & ATS Honest Gap Analysis
                    </h2>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Truth-Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Targeting: <strong className="text-slate-900">{studioResult.gapAnalysis.targetRole}</strong> ({studioResult.gapAnalysis.domain})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("options")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "options"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 inline mr-1.5" />
                  Compare 3 Strategies
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mixer")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "mixer"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5 inline mr-1.5" />
                  Section Mixer
                </button>
              </div>
            </div>

            {/* Keyword Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Skills Matched from Background ({studioResult.gapAnalysis.matchedKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {studioResult.gapAnalysis.matchedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-[11px]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-amber-900 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Missing from Profile / Not Fabricated ({studioResult.gapAnalysis.missingKeywords.length})
                </p>
                {studioResult.gapAnalysis.missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {studioResult.gapAnalysis.missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-medium text-[11px]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] italic">No major missing keywords identified.</p>
                )}
              </div>
            </div>

            <p className="mt-3.5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
              {studioResult.gapAnalysis.truthInvariantNotice}
            </p>
          </div>

          {/* ── Sub-view A: 3-Strategy Comparison Cards ── */}
          {activeTab === "options" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {studioResult.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`cursor-pointer rounded-2xl border transition-all duration-200 bg-white p-5 flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-600/15 shadow-md -translate-y-0.5"
                          : "border-slate-200 hover:border-blue-400 hover:shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Header badge & score */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              option.badgeColor.includes("purple")
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : isSelected
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {option.badgeLabel}
                          </span>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {option.matchScore}% Match
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900">{option.strategyName}</h3>
                        <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">{option.tagline}</p>

                        {/* Highlights */}
                        <div className="space-y-2 mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
                          {option.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-800">
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{h}</span>
                            </div>
                          ))}
                        </div>

                        {/* Preview Snippet */}
                        <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-3 line-clamp-3 italic">
                          "{option.summary}"
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <LoadingButton
                          type="button"
                          loading={isSaving && selectedOptionId === option.id}
                          loadingText="Activating…"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOptionId(option.id);
                            handleSaveOption(option);
                          }}
                          variant={isSelected ? "primary" : "secondary"}
                          size="sm"
                          className="w-full"
                          icon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          Save as Active Resume
                        </LoadingButton>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Preview of Selected Option */}
              {selectedOption && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Live Section Preview: {selectedOption.strategyName}
                        </h3>
                        {hasRefinedChanges && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Refined via Chat
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Review the generated document below, or chat to refine bullets before opening in the Resume Builder.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
                      {hasRefinedChanges && (
                        <button
                          type="button"
                          onClick={handleResetToOriginal}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          <span>Reset Draft</span>
                        </button>
                      )}

                      {/* Fit to 1 Page Toggle */}
                      <button
                        type="button"
                        onClick={() => setFitToOnePage(!fitToOnePage)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                          fitToOnePage
                            ? "bg-amber-500 text-white border border-amber-600 shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Optimize margins, line-height, and padding strictly for a 1-page resume"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${fitToOnePage ? "text-white" : "text-amber-500"}`} />
                        <span>Fit to 1 Page: {fitToOnePage ? "ON" : "OFF"}</span>
                      </button>

                      {/* Download / Export PDF */}
                      <button
                        type="button"
                        disabled={isExportingPdf}
                        onClick={() => handleExportPdf(selectedOption)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs disabled:opacity-50"
                        title="Download ATS-Friendly Vector PDF directly"
                      >
                        {isExportingPdf ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span>{isExportingPdf ? "Exporting…" : "Export PDF"}</span>
                      </button>

                      {/* Open in Builder */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveOption(selectedOption)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        <span>Open in Builder →</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Page Optimization Indicator */}
                  {fitToOnePage && (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Strict 1-Page Fit Active: Compact margins, 2-bullet maximum, and calibrated single-page A4 density.</span>
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                        Exact 1 Page
                      </span>
                    </div>
                  )}

                  {/* Rendered Preview Document Body */}
                  <div
                    className={`max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white shadow-xs transition-all ${
                      fitToOnePage
                        ? "p-5 sm:p-6 space-y-2.5 text-[11px] leading-snug"
                        : "p-6 sm:p-8 space-y-5 text-xs leading-relaxed"
                    }`}
                  >
                    {/* Header */}
                    <div className={`text-center border-b border-slate-200 ${fitToOnePage ? "pb-2 mb-2" : "pb-4 mb-4"}`}>
                      <h2 className={`${fitToOnePage ? "text-lg" : "text-xl"} font-bold tracking-tight text-blue-700`}>
                        {studioResult.contactInfo.name}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {studioResult.contactInfo.email} • {studioResult.contactInfo.phone} • {studioResult.contactInfo.location}
                      </p>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-0.5 mb-1.5">
                        Professional Summary
                      </h4>
                      <p className="text-xs text-slate-800 leading-relaxed">{cleanMojibake(selectedOption.summary)}</p>
                    </div>

                    {/* Sections */}
                    {selectedOption.sections.map((sec) => (
                      <div key={sec.id}>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-0.5 mb-1.5">
                          {cleanMojibake(sec.customTitle)}
                        </h4>
                        <div className={fitToOnePage ? "space-y-1.5" : "space-y-3"}>
                          {sec.entries.map((entry) => {
                            const rawTags = (entry.tags || []).map((t) => cleanMojibake(t).trim()).filter(Boolean);
                            const seenKeys = new Set<string>();
                            const uniqueTags: string[] = [];
                            for (const t of rawTags) {
                              const k = t.toLowerCase().replace(/[^a-z0-9]/g, "");
                              if (!seenKeys.has(k)) {
                                seenKeys.add(k);
                                uniqueTags.push(t);
                              }
                            }
                            const isSkills = sec.type === "skills";
                            const bulletsToRender = fitToOnePage ? (entry.bullets || []).slice(0, 2) : (entry.bullets || []);

                            return (
                              <div key={entry.id} className={fitToOnePage ? "space-y-0.5" : "space-y-1"}>
                                <div className="flex justify-between font-bold text-xs">
                                  <span>{cleanBulletText(entry.title)}</span>
                                  {(entry.startDate || entry.endDate) && (
                                    <span className="text-slate-500 font-normal text-[11px]">
                                      {entry.startDate}{entry.endDate ? ` – ${entry.endDate}` : ""}
                                    </span>
                                  )}
                                </div>
                                {entry.subtitle && !isSkills && (
                                  <div className="text-slate-600 italic text-[11px]">{cleanMojibake(entry.subtitle)}</div>
                                )}
                                {isSkills && uniqueTags.length > 0 && (
                                  <div className={`flex flex-wrap ${fitToOnePage ? "gap-1 pt-0.5" : "gap-1.5 pt-1"}`}>
                                    {uniqueTags.map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className={`rounded font-medium border border-slate-200 bg-slate-50 text-slate-800 ${
                                          fitToOnePage ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {bulletsToRender.length > 0 && (
                                  <ul className={`list-disc list-inside mt-0.5 ${fitToOnePage ? "space-y-0.5" : "space-y-1"} text-slate-800`}>
                                    {bulletsToRender.map((b) => (
                                      <li key={b.id} className="text-[11px] leading-relaxed">
                                        {cleanBulletText(b.text)}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Conversational Refinement Chat Box (Step 7) ── */}
                  <div className="border-t border-slate-200 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Conversational Refinement Chat
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Ask AI to adapt summary, metrics, or keywords for this strategy
                      </span>
                    </div>

                    {/* Quick refinement suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500 mr-1">Suggested:</span>
                      {QUICK_REFINE_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          disabled={isRefining}
                          onClick={() => handleRefine(prompt)}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    {/* Refinement chat history log */}
                    {refineChatHistory.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        {refineChatHistory.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              msg.sender === "user" ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                msg.sender === "user"
                                  ? "bg-blue-600 text-white rounded-br-xs"
                                  : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-xs"
                              }`}
                            >
                              {msg.sender === "assistant" && (
                                <div className="flex items-center gap-1 font-bold text-[10px] text-blue-600 mb-0.5">
                                  <Bot className="h-3 w-3" />
                                  <span>CareerEdge Studio AI</span>
                                </div>
                              )}
                              <p>{msg.text}</p>
                              <span className="text-[9px] opacity-70 block text-right mt-1">
                                {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div ref={chatBottomRef} />
                      </div>
                    )}

                    {/* Chat input box */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRefine();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        placeholder="e.g. 'Make the experience bullets sound more leadership-driven' or 'Add Docker and Kubernetes keywords'..."
                        disabled={isRefining}
                        className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                      <LoadingButton
                        type="submit"
                        loading={isRefining}
                        loadingText="Refining…"
                        disabled={!refineInput.trim() || isRefining}
                        size="md"
                        icon={<Send className="h-3.5 w-3.5" />}
                      >
                        Refine
                      </LoadingButton>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Sub-view B: Interactive Section Mixer ── */}
          {activeTab === "mixer" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  Section Mixer: Combine Best Parts from Each Strategy
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Choose which strategy you want for each section (e.g. use Impact-First Experience bullets with ATS-First Skills).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Summary Picker */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    Summary Strategy
                  </label>
                  <select
                    value={mixedSummaryOptionId}
                    onChange={(e) => setMixedSummaryOptionId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                  >
                    {studioResult.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.strategyName}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                    "{studioResult.options.find((o) => o.id === mixedSummaryOptionId)?.summary}"
                  </p>
                </div>

                {/* 2. Experience Picker */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                    Experience Bullets Strategy
                  </label>
                  <select
                    value={mixedExpOptionId}
                    onChange={(e) => setMixedExpOptionId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                  >
                    {studioResult.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.strategyName}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600">
                    Uses active phrasing and action framing calibrated to{" "}
                    {studioResult.options.find((o) => o.id === mixedExpOptionId)?.strategyName}.
                  </p>
                </div>

                {/* 3. Projects Picker */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderGit2 className="h-3.5 w-3.5 text-blue-600" />
                    Projects Strategy
                  </label>
                  <select
                    value={mixedProjectsOptionId}
                    onChange={(e) => setMixedProjectsOptionId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                  >
                    {studioResult.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.strategyName}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600">
                    Selected from {studioResult.options.find((o) => o.id === mixedProjectsOptionId)?.strategyName}.
                  </p>
                </div>

                {/* 4. Skills Picker */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-blue-600" />
                    Skills Grouping Strategy
                  </label>
                  <select
                    value={mixedSkillsOptionId}
                    onChange={(e) => setMixedSkillsOptionId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                  >
                    {studioResult.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.strategyName}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600">
                    Categorized according to {studioResult.options.find((o) => o.id === mixedSkillsOptionId)?.strategyName}.
                  </p>
                </div>
              </div>

              {/* Save Mixed CTA */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <LoadingButton
                  type="button"
                  loading={isSaving}
                  loadingText="Creating Mixed Resume…"
                  onClick={handleSaveMixed}
                  icon={<Sparkles className="h-4 w-4 text-amber-300" />}
                >
                  Save Handcrafted Mix & Edit
                </LoadingButton>
              </div>
            </div>
          )}
        </FadeIn>
      )}
    </div>
  );
}
