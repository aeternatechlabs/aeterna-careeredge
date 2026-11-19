"use client";

// src/components/resume/upload-resume-modal.tsx
// Comprehensive Accessible Resume Upload, Consent & Mandatory Review Dialog
// Supports Drag & Drop (PDF, DOCX), Paste Text fallback, Consent audit, Section-by-Section Review,
// and Flexible Next-Step Routing (Resume Studio, Career Passport merge, ATS Analysis).

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Sparkles,
  ClipboardPaste,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { ParsedResumePayload } from "@/lib/resume/parser";

export interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: {
    resumeId?: string | null;
    passportScore?: number | null;
    parsedData?: ParsedResumePayload | null;
  }) => void;
  defaultTargetRole?: string;
  mode?: "default" | "onboarding";
  onAutofill?: (parsed: ParsedResumePayload) => void;
}

type Step = "choose" | "processing" | "review" | "success" | "error";

export function UploadResumeModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTargetRole = "",
  mode = "default",
  onAutofill,
}: UploadResumeModalProps) {
  const router = useRouter();

  // Wizard State
  const [step, setStep] = useState<Step>("choose");
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");

  // File & Input State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);

  // Processing & Error State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extracted Data for Review
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumePayload | null>(null);

  // Action Choices for Import
  const [createResumeOption, setCreateResumeOption] = useState(true);
  const [saveToPassportOption, setSaveToPassportOption] = useState(false);
  const [analyzeResumeOption, setAnalyzeResumeOption] = useState(false);
  const [customResumeTitle, setCustomResumeTitle] = useState("");
  const [customTargetRole, setCustomTargetRole] = useState(defaultTargetRole);

  // Final Created Output
  const [importedResumeId, setImportedResumeId] = useState<string | null>(null);
  const [savingApproved, setSavingApproved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("choose");
      setSelectedFile(null);
      setPastedText("");
      setConsentGranted(false);
      setErrorMessage(null);
      setErrorCode(null);
      setParsedData(null);
      setCreateResumeOption(true);
      setSaveToPassportOption(false);
      setAnalyzeResumeOption(false);
      setCustomTargetRole(defaultTargetRole);
    }
  }, [isOpen, defaultTargetRole]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && step !== "processing") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, onClose]);

  // File Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMessage(null);
    setErrorCode(null);
    const validExts = [".pdf", ".docx", ".txt"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExts.includes(ext)) {
      setErrorMessage("Please upload a PDF (.pdf) or Microsoft Word (.docx) document.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File exceeds the 5 MB limit. Please choose a smaller resume file.");
      return;
    }
    setSelectedFile(file);
  };

  // Start Upload & Parsing
  const handleStartUpload = async () => {
    if (!consentGranted) {
      setErrorMessage("Please agree to the data processing terms to proceed.");
      return;
    }

    if (activeTab === "file" && !selectedFile) {
      setErrorMessage("Please select a resume file to upload.");
      return;
    }

    if (activeTab === "paste" && pastedText.trim().length < 20) {
      setErrorMessage("Please paste at least 20 characters of resume text.");
      return;
    }

    setStep("processing");
    setUploadProgress(20);
    setStatusMessage("Uploading document securely to private storage...");
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      if (activeTab === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("pastedText", pastedText.trim());
      }
      formData.append("consent", "true");

      setUploadProgress(45);
      setStatusMessage("Reading document streams and extracting selectable text...");

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      setUploadProgress(75);
      setStatusMessage("Structuring candidate education, experience, and competencies...");

      const data = await res.json();

      if (!res.ok) {
        setErrorCode(data.code || "UPLOAD_FAILED");
        throw new Error(data.error || "Failed to process resume.");
      }

      setUploadProgress(100);
      setDocumentId(data.documentId || null);
      setParsedData(data.parsed);
      setCustomResumeTitle(`${data.parsed.contactInfo.name || "Professional"} Resume`);
      if (data.parsed.experience?.[0]?.title && !customTargetRole) {
        setCustomTargetRole(data.parsed.experience[0].title);
      }

      // If in onboarding mode, automatically autofill the profile immediately!
      if (mode === "onboarding" && data.parsed) {
        if (onAutofill) {
          try {
            onAutofill(data.parsed);
          } catch (e) {
            console.error("Auto-fill error:", e);
          }
        }
        if (onSuccess) {
          try {
            onSuccess({
              resumeId: null,
              passportScore: null,
              parsedData: data.parsed,
            });
          } catch (e) {
            console.error("onSuccess error:", e);
          }
        }
      }

      // Transition to Review Screen
      setTimeout(() => {
        setStep("review");
      }, 350);
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        setStep("choose");
        return;
      }
      setErrorMessage((err as Error).message || "An error occurred while uploading your resume.");
      setStep("error");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStep("choose");
  };

  const handleApplyToOnboarding = () => {
    if (!parsedData) return;
    if (onAutofill) {
      onAutofill(parsedData);
    }
    if (onSuccess) {
      onSuccess({
        resumeId: null,
        passportScore: null,
        parsedData,
      });
    }
    onClose();
  };

  // Project editing handlers
  const handleUpdateProject = (idx: number, updates: Partial<ParsedResumePayload["projects"][0]>) => {
    if (!parsedData) return;
    const updated = [...parsedData.projects];
    updated[idx] = { ...updated[idx], ...updates };
    setParsedData({ ...parsedData, projects: updated });
  };

  const handleDeleteProject = (idx: number) => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      projects: parsedData.projects.filter((_, i) => i !== idx),
    });
  };

  const handleMergeProjectIntoPrevious = (idx: number) => {
    if (!parsedData || idx <= 0) return;
    const current = parsedData.projects[idx];
    const prev = parsedData.projects[idx - 1];

    const mergedBullets = [...prev.bullets];
    if (current.title && !current.title.toLowerCase().startsWith("project")) {
      mergedBullets.push(current.title);
    }
    mergedBullets.push(...current.bullets);

    const updatedProjects = parsedData.projects
      .map((p, i) => {
        if (i === idx - 1) {
          return {
            ...p,
            bullets: mergedBullets,
            url: p.url || current.url,
            lowConfidence: false,
          };
        }
        return p;
      })
      .filter((_, i) => i !== idx);

    setParsedData({ ...parsedData, projects: updatedProjects });
  };

  const handleMoveProject = (idx: number, dir: "up" | "down") => {
    if (!parsedData) return;
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= parsedData.projects.length) return;

    const updated = [...parsedData.projects];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setParsedData({ ...parsedData, projects: updated });
  };

  const handleAddProject = () => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      projects: [
        ...parsedData.projects,
        {
          title: "New Project",
          bullets: ["Developed core features and implemented system functionality."],
        },
      ],
    });
  };

  const handleAddProjectBullet = (projIdx: number) => {
    if (!parsedData) return;
    const updated = [...parsedData.projects];
    updated[projIdx] = {
      ...updated[projIdx],
      bullets: [...updated[projIdx].bullets, "Add key project contribution or achievement"],
      lowConfidence: false,
    };
    setParsedData({ ...parsedData, projects: updated });
  };

  const handleUpdateProjectBullet = (projIdx: number, bulletIdx: number, text: string) => {
    if (!parsedData) return;
    const updated = [...parsedData.projects];
    const newBullets = [...updated[projIdx].bullets];
    newBullets[bulletIdx] = text;
    updated[projIdx] = { ...updated[projIdx], bullets: newBullets };
    setParsedData({ ...parsedData, projects: updated });
  };

  const handleDeleteProjectBullet = (projIdx: number, bulletIdx: number) => {
    if (!parsedData) return;
    const updated = [...parsedData.projects];
    updated[projIdx] = {
      ...updated[projIdx],
      bullets: updated[projIdx].bullets.filter((_, bIdx) => bIdx !== bulletIdx),
    };
    setParsedData({ ...parsedData, projects: updated });
  };

  // Experience editing handlers
  const handleUpdateExperience = (idx: number, updates: Partial<ParsedResumePayload["experience"][0]>) => {
    if (!parsedData) return;
    const updated = [...parsedData.experience];
    updated[idx] = { ...updated[idx], ...updates };
    setParsedData({ ...parsedData, experience: updated });
  };

  const handleDeleteExperience = (idx: number) => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      experience: parsedData.experience.filter((_, i) => i !== idx),
    });
  };

  const handleAddExperience = () => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      experience: [
        ...parsedData.experience,
        {
          title: "Software Engineer",
          company: "Company Name",
          bullets: ["Engineered scalable features and collaborated with product teams."],
        },
      ],
    });
  };

  const handleAddExpBullet = (expIdx: number) => {
    if (!parsedData) return;
    const updated = [...parsedData.experience];
    updated[expIdx] = {
      ...updated[expIdx],
      bullets: [...updated[expIdx].bullets, "Key responsibility or metric-driven achievement"],
    };
    setParsedData({ ...parsedData, experience: updated });
  };

  const handleUpdateExpBullet = (expIdx: number, bulletIdx: number, text: string) => {
    if (!parsedData) return;
    const updated = [...parsedData.experience];
    const newBullets = [...updated[expIdx].bullets];
    newBullets[bulletIdx] = text;
    updated[expIdx] = { ...updated[expIdx], bullets: newBullets };
    setParsedData({ ...parsedData, experience: updated });
  };

  const handleDeleteExpBullet = (expIdx: number, bulletIdx: number) => {
    if (!parsedData) return;
    const updated = [...parsedData.experience];
    updated[expIdx] = {
      ...updated[expIdx],
      bullets: updated[expIdx].bullets.filter((_, bIdx) => bIdx !== bulletIdx),
    };
    setParsedData({ ...parsedData, experience: updated });
  };

  // Submit Approved Review to Import API
  const handleApproveAndImport = async () => {
    if (!parsedData) return;
    setSavingApproved(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/resumes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedPayload: parsedData,
          createResume: createResumeOption,
          saveToPassport: saveToPassportOption,
          analyzeResume: analyzeResumeOption,
          resumeTitle: customResumeTitle.trim() || undefined,
          targetRole: customTargetRole.trim() || undefined,
          documentId,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to import resume.");
      }

      setImportedResumeId(resData.resumeId || null);
      if (onAutofill) {
        try {
          onAutofill(parsedData);
        } catch (e) {
          console.error("onAutofill error:", e);
        }
      }
      if (onSuccess) {
        onSuccess({
          resumeId: resData.resumeId,
          passportScore: resData.passportScore,
          parsedData,
        });
      }
      setStep("success");
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to import resume.");
    } finally {
      setSavingApproved(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-resume-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-stone-200 flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200/80 px-6 py-4.5 bg-[#FFFDF9] rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7A0F1F] text-white shadow-xs">
              <UploadCloud size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 id="upload-resume-title" className="font-heading text-lg font-bold text-[#2B1B1B]">
                {step === "review"
                  ? "Review Extracted Resume Details"
                  : step === "success"
                  ? "Resume Ready & Imported!"
                  : "Upload Your Existing Resume"}
              </h2>
              <p className="text-xs text-[#765F5D]">
                {step === "review"
                  ? "Verify your details before creating a draft or updating your profile."
                  : "Turn your PDF or Word document into an ATS-proof verified resume."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={step === "processing"}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition disabled:opacity-30"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* STEP 1: CHOOSE FILE OR PASTE */}
          {step === "choose" && (
            <div className="space-y-5">
              {/* Tabs: Upload File vs Paste Text */}
              <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold text-stone-600">
                <button
                  type="button"
                  onClick={() => setActiveTab("file")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                    activeTab === "file"
                      ? "bg-white text-[#7A0F1F] shadow-xs"
                      : "hover:text-[#2B1B1B]"
                  }`}
                >
                  <FileText size={14} />
                  <span>Upload PDF or Word Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("paste")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                    activeTab === "paste"
                      ? "bg-white text-[#7A0F1F] shadow-xs"
                      : "hover:text-[#2B1B1B]"
                  }`}
                >
                  <ClipboardPaste size={14} />
                  <span>Paste Resume Text</span>
                </button>
              </div>

              {/* Tab Content: File Dropzone */}
              {activeTab === "file" && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                    isDragging
                      ? "border-[#7A0F1F] bg-[#FFF8F8]"
                      : selectedFile
                      ? "border-emerald-400 bg-emerald-50/40"
                      : "border-stone-300 bg-stone-50 hover:bg-stone-100/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="font-semibold text-xs text-stone-900">{selectedFile.name}</p>
                      <p className="text-[11px] text-stone-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0D4] text-[#7A0F1F]">
                        <UploadCloud size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-800">
                          Click to browse or drag and drop your resume
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Supported formats: PDF (.pdf) or Word (.docx) • Max size: 5 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Paste Text */}
              {activeTab === "paste" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700">
                    Paste your resume text directly:
                  </label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste education, experience, projects, skills, and summary here..."
                    className="w-full text-xs rounded-xl border border-stone-300 p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]"
                  />
                  <p className="text-[11px] text-stone-500">
                    Helpful if your PDF is scanned or password-locked.
                  </p>
                </div>
              )}

              {/* Mandatory DPDP / Privacy Consent Box */}
              <div className="rounded-2xl border border-amber-200/80 bg-[#FFFDF5] p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Lock size={15} className="text-[#7A0F1F] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-[#2B1B1B]">Strict Data Privacy Guarantee</p>
                    <p className="text-[11px] text-[#765F5D] leading-relaxed">
                      Your document is stored in an encrypted private vault and is never accessible
                      via public URLs. We read your resume only to structure your career profile.
                      Nothing is saved without your explicit review and approval.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-1.5 cursor-pointer text-xs font-medium text-stone-800 select-none">
                  <input
                    type="checkbox"
                    checked={consentGranted}
                    onChange={(e) => setConsentGranted(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-[#7A0F1F] focus:ring-[#7A0F1F]"
                  />
                  <span>
                    I consent to processing my resume to extract career information under CareerEdge Privacy Terms.
                  </span>
                </label>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 animate-in fade-in">
                  <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!consentGranted || (activeTab === "file" ? !selectedFile : !pastedText.trim())}
                  onClick={handleStartUpload}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#600C18] disabled:opacity-40 transition shadow-xs"
                >
                  <span>Read & Review Resume</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROCESSING & EXTRACTION PROGRESS */}
          {step === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-stone-200 border-t-[#7A0F1F] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={20} className="text-[#F2B63D]" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="font-heading text-base font-bold text-[#2B1B1B]">
                  Analyzing Your Document
                </h3>
                <p className="text-xs text-[#765F5D] leading-relaxed">{statusMessage}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-64 h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full bg-[#7A0F1F] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <button
                type="button"
                onClick={handleCancelProcessing}
                className="mt-4 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
              >
                Cancel Processing
              </button>
            </div>
          )}

          {/* STEP 3: MANDATORY REVIEW SCREEN */}
          {step === "review" && parsedData && (
            <div className="space-y-6">
              {mode === "onboarding" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">
                        Credentials Extracted &amp; Profile Auto-filled!
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        We loaded your education, skills, and projects into your form. You can review them below or continue directly.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyToOnboarding}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition w-full sm:w-auto"
                  >
                    <CheckCircle2 size={14} />
                    <span>View Filled Form</span>
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>
                  Extracted <strong>{parsedData.education.length} degrees</strong>,{" "}
                  <strong>{parsedData.projects.length} projects</strong>,{" "}
                  <strong>{parsedData.experience.length} roles</strong>, and{" "}
                  <strong>{parsedData.skills.length} skills</strong> with verified provenance.
                </span>
              </div>

              {/* Review Section 1: Contact Details */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
                    1. Contact Information
                  </h4>
                  <span className="text-[10px] font-semibold text-stone-400">Editable</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={parsedData.contactInfo.name}
                      onChange={(e) =>
                        setParsedData({
                          ...parsedData,
                          contactInfo: { ...parsedData.contactInfo, name: e.target.value },
                        })
                      }
                      className="mt-1 w-full text-xs rounded-lg border border-stone-300 p-2 text-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Email</label>
                    <input
                      type="email"
                      value={parsedData.contactInfo.email}
                      onChange={(e) =>
                        setParsedData({
                          ...parsedData,
                          contactInfo: { ...parsedData.contactInfo, email: e.target.value },
                        })
                      }
                      className="mt-1 w-full text-xs rounded-lg border border-stone-300 p-2 text-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Phone</label>
                    <input
                      type="text"
                      value={parsedData.contactInfo.phone}
                      onChange={(e) =>
                        setParsedData({
                          ...parsedData,
                          contactInfo: { ...parsedData.contactInfo, phone: e.target.value },
                        })
                      }
                      className="mt-1 w-full text-xs rounded-lg border border-stone-300 p-2 text-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase">City / Location</label>
                    <input
                      type="text"
                      value={parsedData.contactInfo.location}
                      onChange={(e) =>
                        setParsedData({
                          ...parsedData,
                          contactInfo: { ...parsedData.contactInfo, location: e.target.value },
                        })
                      }
                      className="mt-1 w-full text-xs rounded-lg border border-stone-300 p-2 text-stone-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Review Section 2: Education */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
                    2. Academic Degrees ({parsedData.education.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setParsedData({
                        ...parsedData,
                        education: [
                          ...parsedData.education,
                          { degree: "Bachelor of Technology", institution: "University Name", endYear: "2026" },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A0F1F] hover:underline"
                  >
                    <Plus size={11} />
                    <span>Add Degree</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {parsedData.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-stone-900">{edu.degree || "Degree"}</p>
                        <p className="text-[11px] text-stone-600">
                          {edu.institution || "Institution"} • {edu.endYear || "Graduation Year"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setParsedData({
                            ...parsedData,
                            education: parsedData.education.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-stone-400 hover:text-rose-600 p-1"
                        aria-label="Remove education entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Section 3: Projects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
                      3. Projects & Work Showcase
                    </h4>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                      {parsedData.projects.length} {parsedData.projects.length === 1 ? "project" : "projects"} found
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A0F1F] hover:underline"
                  >
                    <Plus size={11} />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {parsedData.projects.map((proj, idx) => {
                    const isLowConfidence = Boolean(proj.lowConfidence || proj.bullets.length === 0);
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-4 text-xs transition space-y-3 ${
                          isLowConfidence
                            ? "border-amber-300 bg-amber-50/40"
                            : "border-stone-200 bg-stone-50"
                        }`}
                      >
                        {/* Low confidence warning banner */}
                        {isLowConfidence && (
                          <div className="flex items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-100/60 p-2.5 text-[11px] text-amber-900">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <AlertTriangle size={13} className="text-amber-700 shrink-0" />
                              <span>
                                {proj.bullets.length === 0
                                  ? "Zero bullets detected for this project. Is this an un-bulleted line from above?"
                                  : "Low confidence boundary. Please verify project title."}
                              </span>
                            </div>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMergeProjectIntoPrevious(idx)}
                                className="shrink-0 rounded-lg bg-amber-700 text-white px-2 py-1 text-[10px] font-bold hover:bg-amber-800 transition"
                              >
                                Merge into #{idx}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Title, URL, Subtitle and Action Controls */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="text-[10px] font-bold text-stone-500 uppercase">
                                Project Title
                              </label>
                              <input
                                type="text"
                                value={proj.title}
                                onChange={(e) => handleUpdateProject(idx, { title: e.target.value })}
                                placeholder="Project Title"
                                className="mt-0.5 w-full rounded-lg border border-stone-300 p-2 text-xs font-bold text-stone-900 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-stone-500 uppercase">
                                  Technologies / Subtitle
                                </label>
                                <input
                                  type="text"
                                  value={proj.subtitle || ""}
                                  onChange={(e) => handleUpdateProject(idx, { subtitle: e.target.value })}
                                  placeholder="e.g. Next.js, TypeScript, PostgreSQL"
                                  className="mt-0.5 w-full rounded-lg border border-stone-300 p-1.5 text-xs text-stone-800 bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-stone-500 uppercase">
                                  Project Link / GitHub URL
                                </label>
                                <input
                                  type="text"
                                  value={proj.url || ""}
                                  onChange={(e) => handleUpdateProject(idx, { url: e.target.value })}
                                  placeholder="https://github.com/..."
                                  className="mt-0.5 w-full rounded-lg border border-stone-300 p-1.5 text-xs text-stone-800 bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions (Move Up, Move Down, Merge, Delete) */}
                          <div className="flex items-center gap-1 shrink-0 pt-4">
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Move up"
                                onClick={() => handleMoveProject(idx, "up")}
                                className="rounded-lg border border-stone-200 bg-white p-1 text-stone-600 hover:bg-stone-100"
                              >
                                <ArrowUp size={12} />
                              </button>
                            )}
                            {idx < parsedData.projects.length - 1 && (
                              <button
                                type="button"
                                title="Move down"
                                onClick={() => handleMoveProject(idx, "down")}
                                className="rounded-lg border border-stone-200 bg-white p-1 text-stone-600 hover:bg-stone-100"
                              >
                                <ArrowDown size={12} />
                              </button>
                            )}
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Merge into previous project"
                                onClick={() => handleMergeProjectIntoPrevious(idx)}
                                className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-[10px] font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                Merge Up
                              </button>
                            )}
                            <button
                              type="button"
                              title="Delete project"
                              onClick={() => handleDeleteProject(idx)}
                              className="rounded-lg border border-stone-200 bg-white p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Bullets List */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-500 uppercase">
                              Bullet Points ({proj.bullets.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddProjectBullet(idx)}
                              className="text-[10px] font-bold text-[#7A0F1F] hover:underline"
                            >
                              + Add Bullet
                            </button>
                          </div>
                          {proj.bullets.map((b, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-1.5">
                              <span className="text-stone-400 mt-1.5">•</span>
                              <textarea
                                rows={2}
                                value={b}
                                onChange={(e) => handleUpdateProjectBullet(idx, bIdx, e.target.value)}
                                className="flex-1 rounded-lg border border-stone-300 p-1.5 text-xs text-stone-800 bg-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteProjectBullet(idx, bIdx)}
                                className="text-stone-400 hover:text-rose-600 p-1 mt-1"
                                title="Delete bullet"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Section 4: Experience */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
                      4. Experience & Internships
                    </h4>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                      {parsedData.experience.length} {parsedData.experience.length === 1 ? "role" : "roles"} found
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A0F1F] hover:underline"
                  >
                    <Plus size={11} />
                    <span>Add Role</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {parsedData.experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Role / Title</label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => handleUpdateExperience(idx, { title: e.target.value })}
                              className="mt-0.5 w-full rounded-lg border border-stone-300 p-1.5 text-xs font-bold text-stone-900 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(idx, { company: e.target.value })}
                              className="mt-0.5 w-full rounded-lg border border-stone-300 p-1.5 text-xs text-stone-900 bg-white"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(idx)}
                          className="text-stone-400 hover:text-rose-600 p-1 mt-3"
                          title="Delete role"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Bullets */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-500 uppercase">
                            Key Responsibilities ({exp.bullets.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddExpBullet(idx)}
                            className="text-[10px] font-bold text-[#7A0F1F] hover:underline"
                          >
                            + Add Bullet
                          </button>
                        </div>
                        {exp.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-stone-400 mt-1.5">•</span>
                            <textarea
                              rows={2}
                              value={b}
                              onChange={(e) => handleUpdateExpBullet(idx, bIdx, e.target.value)}
                              className="flex-1 rounded-lg border border-stone-300 p-1.5 text-xs text-stone-800 bg-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#7A0F1F]"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteExpBullet(idx, bIdx)}
                              className="text-stone-400 hover:text-rose-600 p-1 mt-1"
                              title="Delete bullet"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Section 5: Skills */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
                    5. Extracted Skills ({parsedData.skills.length})
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-stone-50 border border-stone-200 max-h-36 overflow-y-auto">
                  {parsedData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-800"
                    >
                      <span>{skill.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setParsedData({
                            ...parsedData,
                            skills: parsedData.skills.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Review Section 4: What to do next */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-stone-900">
                  Select Action Destination
                </h4>
                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-[#FFFDF9] p-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createResumeOption}
                      onChange={(e) => setCreateResumeOption(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#7A0F1F] focus:ring-[#7A0F1F]"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-stone-900">
                        Create a new resume in Resume Studio
                      </p>
                      <p className="text-[11px] text-stone-600">
                        Creates an editable draft with your approved content and ATS templates.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToPassportOption}
                      onChange={(e) => setSaveToPassportOption(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#7A0F1F] focus:ring-[#7A0F1F]"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-stone-900">
                        Save & merge into my Career Passport
                      </p>
                      <p className="text-[11px] text-stone-600">
                        Populates your verified education, skills, and projects without overwriting existing entries.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyzeResumeOption}
                      onChange={(e) => setAnalyzeResumeOption(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#7A0F1F] focus:ring-[#7A0F1F]"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-stone-900">
                        Run full ATS & Evidence readiness analysis
                      </p>
                      <p className="text-[11px] text-stone-600">
                        Benchmarks your resume against recruiters and scans for unbacked claims.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setStep("choose")}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Back to Upload
                </button>

                <div className="flex items-center gap-2">
                  {mode === "onboarding" && (
                    <button
                      type="button"
                      onClick={handleApplyToOnboarding}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Fill Form Now</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={savingApproved || (!createResumeOption && !saveToPassportOption && mode !== "onboarding")}
                    onClick={handleApproveAndImport}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#600C18] disabled:opacity-40 transition shadow-xs"
                  >
                    {savingApproved ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>{mode === "onboarding" ? "Saving & Filling..." : "Importing..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === "onboarding" ? "Approve, Save & Fill Form" : "Approve & Save"}</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-xs">
                <Check size={28} />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="font-heading text-lg font-bold text-stone-900">
                  {mode === "onboarding" ? "Onboarding Profile Updated!" : "Resume Imported Successfully!"}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {mode === "onboarding"
                    ? "Your degrees, experience, and verified skills have been filled directly into your onboarding steps."
                    : "Your approved credentials have been imported. Where would you like to go next?"}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                {mode === "onboarding" ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#600C18] shadow-xs transition"
                  >
                    <CheckCircle2 size={14} />
                    <span>Continue Onboarding (Form Populated)</span>
                  </button>
                ) : (
                  <>
                    {importedResumeId && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          router.push(`/resume/builder?id=${importedResumeId}`);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#600C18] shadow-xs transition"
                      >
                        <span>Open in Resume Studio</span>
                        <ArrowRight size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push("/passport");
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                    >
                      <span>View Career Passport</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: ERROR */}
          {step === "error" && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="font-heading text-base font-bold text-stone-900">
                  Upload Unsuccessful
                </h3>
                <p className="text-xs text-rose-800 leading-relaxed">{errorMessage}</p>
              </div>

              {errorCode === "SCANNED_PDF" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 text-left max-w-md space-y-1">
                  <p className="font-bold">Recommendation for Scanned Resumes:</p>
                  <p className="text-[11px] leading-relaxed">
                    Scanned image PDFs lack text streams. You can open your resume file, select all
                    text (Ctrl+A), copy it, and use the <strong>Paste Resume Text</strong> tab.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("choose")}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
