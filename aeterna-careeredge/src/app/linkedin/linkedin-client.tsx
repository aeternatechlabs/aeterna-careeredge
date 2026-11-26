"use client";

// src/app/linkedin/linkedin-client.tsx
// LinkedIn Profile Intelligence & Optimization Workspace (Day 2 Part 4)

import { useState, useEffect } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  Network,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  FileText,
  Upload,
  ChevronRight,
  Loader2,
  X,
  Info,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type { LinkedInSectionType, OptimizedSectionResult } from "@/lib/linkedin/optimizer";
import type { LinkedInAnalysisReport } from "@/lib/linkedin/analysis";
import type { ParsedLinkedInProfile } from "@/lib/linkedin/parser";

interface LinkedInClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    academicDomain: string;
    preferredJobRole?: string;
    course?: string;
    institution?: string;
  };
  initialProfile: {
    id: string;
    profileUrl?: string | null;
    linkedInSubId?: string | null;
    linkedInName?: string | null;
    linkedInEmail?: string | null;
    linkedInPictureUrl?: string | null;
    connectedAt?: Date | null;
    headlineSuggestion?: string | null;
    summarySuggestion?: string | null;
    optimizationScore?: number | null;
    importedRawJson?: string | null;
    sectionsJson?: string | null;
  } | null;
  skills: Array<{ id: string; name: string; category?: string | null }>;
  experiencesCount: number;
  isOidcConfigured: boolean;
  errorParam?: string;
  connectedParam?: string;
}

export function LinkedInClient({
  user,
  initialProfile,
  skills: _skills,
  experiencesCount: _experiencesCount,
  isOidcConfigured,
  errorParam,
  connectedParam,
}: LinkedInClientProps) {
  const [activeSection, setActiveSection] = useState<LinkedInSectionType>("HEADLINE");
  const [profile, setProfile] = useState(initialProfile);
  const [optimizing, setOptimizing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ type: "error" | "success"; message: string } | null>(() => {
    if (errorParam) return { type: "error", message: decodeURIComponent(errorParam) };
    if (connectedParam) {
      return {
        type: "success",
        message: "LinkedIn account successfully linked!",
      };
    }
    return null;
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<"TEXT" | "PDF">("TEXT");
  const [rawText, setRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [stagedImport, setStagedImport] = useState<ParsedLinkedInProfile | null>(() => {
    if (initialProfile?.importedRawJson) {
      try {
        return JSON.parse(initialProfile.importedRawJson);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [savedSections, setSavedSections] = useState<Record<string, OptimizedSectionResult>>(() => {
    if (initialProfile?.sectionsJson) {
      try {
        return JSON.parse(initialProfile.sectionsJson);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [analysisReport, setAnalysisReport] = useState<LinkedInAnalysisReport | null>(null);

  // Passport Merge Selection States
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(() => {
    return new Set(stagedImport?.skills || []);
  });
  const [selectedEducations, setSelectedEducations] = useState<Set<number>>(() => {
    return new Set((stagedImport?.educations || []).map((_, i) => i));
  });
  const [selectedExperiences, setSelectedExperiences] = useState<Set<number>>(() => {
    return new Set((stagedImport?.experiences || []).map((_, i) => i));
  });
  const [approveHeadline, setApproveHeadline] = useState(true);
  const [mergingPassport, setMergingPassport] = useState(false);
  const [passportMergedSuccess, setPassportMergedSuccess] = useState<string | null>(null);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [sectionVariations, setSectionVariations] = useState<Record<string, number>>({});

  // User-editable Draft Inputs for each section
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>(() => {
    const drafts: Record<string, string> = {};
    if (initialProfile?.headlineSuggestion || stagedImport?.headline) {
      drafts["HEADLINE"] = initialProfile?.headlineSuggestion || stagedImport?.headline || "";
    }
    if (initialProfile?.summarySuggestion || stagedImport?.about) {
      drafts["ABOUT"] = initialProfile?.summarySuggestion || stagedImport?.about || "";
    }
    if (stagedImport?.experiences && stagedImport.experiences.length > 0) {
      drafts["EXPERIENCE"] = stagedImport.experiences
        .map(
          (e) =>
            `${e.title} at ${e.company}${e.duration ? ` (${e.duration})` : ""}${e.description ? `:\n${e.description}` : ""}`
        )
        .join("\n\n");
    }
    return drafts;
  });

  // Keep draft and selections in sync when stagedImport changes
  useEffect(() => {
    if (stagedImport) {
      setSelectedSkills(new Set(stagedImport.skills || []));
      setSelectedEducations(new Set((stagedImport.educations || []).map((_, i) => i)));
      setSelectedExperiences(new Set((stagedImport.experiences || []).map((_, i) => i)));
      setDraftInputs((prev) => ({
        ...prev,
        HEADLINE: prev.HEADLINE || stagedImport.headline || "",
        ABOUT: prev.ABOUT || stagedImport.about || "",
        EXPERIENCE:
          prev.EXPERIENCE ||
          (stagedImport.experiences && stagedImport.experiences.length > 0
            ? stagedImport.experiences
                .map(
                  (e) =>
                    `${e.title} at ${e.company}${e.duration ? ` (${e.duration})` : ""}${e.description ? `:\n${e.description}` : ""}`
                )
                .join("\n\n")
            : ""),
      }));
    }
  }, [stagedImport]);

  // Load Analysis Report on mount
  useEffect(() => {
    fetch("/api/linkedin/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.analysisReport) setAnalysisReport(data.analysisReport);
        if (data.savedSections) setSavedSections(data.savedSections);
      })
      .catch(() => {});
  }, []);

  async function handleOptimize(sectionType: LinkedInSectionType, isNewVariation = false) {
    setOptimizing(true);
    try {
      const currentVar = sectionVariations[sectionType] || 1;
      const nextVar = isNewVariation ? currentVar + 1 : currentVar;

      const currentDraft =
        draftInputs[sectionType]?.trim() ||
        (sectionType === "HEADLINE"
          ? profile?.headlineSuggestion || stagedImport?.headline || ""
          : sectionType === "ABOUT"
          ? profile?.summarySuggestion || stagedImport?.about || ""
          : sectionType === "EXPERIENCE" && stagedImport?.experiences?.length
          ? stagedImport.experiences.map((e) => `${e.title} at ${e.company}`).join(", ")
          : "");

      const res = await fetch("/api/linkedin/optimize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType,
          currentText: currentDraft,
          variation: nextVar,
          bypassCache: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization failed.");

      setSectionVariations((prev) => ({
        ...prev,
        [sectionType]: data.variation || nextVar,
      }));

      setSavedSections((prev) => ({
        ...prev,
        [sectionType]: data.result,
      }));

      // Update local profile state
      if (sectionType === "HEADLINE") {
        setProfile((prev) => (prev ? { ...prev, headlineSuggestion: data.result.improvedText } : null));
      } else if (sectionType === "ABOUT") {
        setProfile((prev) => (prev ? { ...prev, summarySuggestion: data.result.improvedText } : null));
      }
    } catch (err: unknown) {
      alert((err as Error).message || "Optimization request failed.");
    } finally {
      setOptimizing(false);
    }
  }

  async function handleMergeToPassport() {
    if (!stagedImport) return;
    setMergingPassport(true);
    setPassportMergedSuccess(null);
    try {
      const approvedSkills = stagedImport.skills.filter((s) => selectedSkills.has(s));
      const approvedEducations = stagedImport.educations.filter((_, idx) => selectedEducations.has(idx));
      const approvedExperiences = stagedImport.experiences.filter((_, idx) => selectedExperiences.has(idx));

      const res = await fetch("/api/linkedin/merge-to-passport", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedSkills,
          approvedEducations,
          approvedExperiences,
          headline: approveHeadline ? stagedImport.headline : undefined,
          provenance: stagedImport.provenance,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to merge into Career Passport.");

      setPassportMergedSuccess(data.message || `Merged ${data.mergedCount} verified records into your Career Passport!`);

      // Refresh LinkedIn profile analysis report
      fetch("/api/linkedin/profile", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.analysisReport) setAnalysisReport(d.analysisReport);
        })
        .catch(() => {});
    } catch (err: unknown) {
      alert((err as Error).message || "Could not merge to Career Passport.");
    } finally {
      setMergingPassport(false);
    }
  }

  async function handleApplyToProfile(text: string, section: LinkedInSectionType) {
    try {
      const body: Record<string, string> = {};
      if (section === "HEADLINE") body.headline = text;
      if (section === "ABOUT") body.bio = text;

      const res = await fetch("/api/passport/profile", {
          credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to apply to profile.");
      }

      setAppliedKey(section);
      if (section === "HEADLINE") {
        setProfile((prev) => (prev ? { ...prev, headlineSuggestion: text } : null));
      } else if (section === "ABOUT") {
        setProfile((prev) => (prev ? { ...prev, summarySuggestion: text } : null));
      }
      setTimeout(() => setAppliedKey(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to apply to profile.");
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/oauth/linkedin", {
          credentials: "include", method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to disconnect.");
      }
      setProfile((prev) => (prev ? { ...prev, linkedInSubId: null, linkedInName: null } : null));
      setBannerNotice({ type: "success", message: "LinkedIn account disconnected successfully." });
    } catch (err: unknown) {
      setBannerNotice({ type: "error", message: (err as Error).message || "Failed to disconnect." });
    } finally {
      setDisconnecting(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  async function handleTextImport(e: React.FormEvent) {
    e.preventDefault();
    if (!rawText.trim()) return;
    setImporting(true);
    setImportError(null);

    try {
      const res = await fetch("/api/linkedin/import-text", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");

      setStagedImport(data.parsed);
      setShowImportModal(false);
      setRawText("");
      setPassportMergedSuccess(null);
      setBannerNotice({
        type: "success",
        message: `Successfully extracted ${data.parsed.skills?.length || 0} skills and ${data.parsed.experiences?.length || 0} positions from your LinkedIn profile. Review and merge into Career Passport below!`,
      });
    } catch (err: unknown) {
      setImportError((err as Error).message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/linkedin/import-pdf", {
          credentials: "include",
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PDF import failed.");

      setStagedImport(data.parsed);
      setShowImportModal(false);
      setPassportMergedSuccess(null);
      setBannerNotice({
        type: "success",
        message: `Successfully extracted ${data.parsed.skills?.length || 0} skills and ${data.parsed.experiences?.length || 0} positions from your LinkedIn PDF. Review and merge into Career Passport below!`,
      });
    } catch (err: unknown) {
      setImportError((err as Error).message || "PDF import failed.");
    } finally {
      setImporting(false);
    }
  }

  function loadStagedForSection(section: LinkedInSectionType) {
    if (!stagedImport) return;
    if (section === "HEADLINE" && stagedImport.headline) {
      setDraftInputs((prev) => ({ ...prev, HEADLINE: stagedImport.headline || "" }));
    } else if (section === "ABOUT" && stagedImport.about) {
      setDraftInputs((prev) => ({ ...prev, ABOUT: stagedImport.about || "" }));
    } else if (section === "EXPERIENCE" && stagedImport.experiences?.length) {
      const expText = stagedImport.experiences
        .map(
          (e) =>
            `${e.title} at ${e.company}${e.duration ? ` (${e.duration})` : ""}${e.description ? `:\n${e.description}` : ""}`
        )
        .join("\n\n");
      setDraftInputs((prev) => ({ ...prev, EXPERIENCE: expText }));
    } else if (section === "FEATURED" && stagedImport.skills?.length) {
      setDraftInputs((prev) => ({
        ...prev,
        FEATURED: `Core Competencies: ${stagedImport.skills.slice(0, 5).join(", ")}`,
      }));
    }
  }

  const currentResult: OptimizedSectionResult | undefined = savedSections[activeSection];

  return (
    <StudentLayout
      userName={user.name}
      studentDomain={user.academicDomain}
      targetRole={user.preferredJobRole}
    >
      <div className="mx-auto max-w-6xl space-y-6 min-w-0 w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A0F1F]">
              <Network size={16} />
              <span>Professional Identity Suite</span>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#2B1B1B] sm:text-3xl">
              LinkedIn Profile Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Domain-specific headline, summary, and experience optimization. Compare before &amp; after drafts with 1-click copying.
            </p>
          </div>

          <div className="flex flex-wrap items-center sm:justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0E1DE] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Upload size={14} className="text-[#7A0F1F]" />
              <span>Import Profile</span>
            </button>

            {profile?.linkedInSubId ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={14} />
                  <span>Connected ({profile.linkedInName || "LinkedIn"})</span>
                </span>
                <button
                  type="button"
                  disabled={disconnecting}
                  onClick={handleDisconnect}
                  className="rounded-xl border border-[#F0E1DE] bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            ) : isOidcConfigured ? (
              <a
                href="/api/auth/oauth/linkedin"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#084e96] transition-colors"
              >
                <Network size={14} />
                <span>Connect LinkedIn</span>
              </a>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0E1DE] bg-white/60 px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed"
                title="LinkedIn integration credentials are not configured"
              >
                <Network size={14} />
                <span>LinkedIn Integration Unavailable</span>
              </span>
            )}
          </div>
        </div>

        {/* Banner Notice */}
        {bannerNotice && (
          <div
            className={`rounded-xl border p-4 flex items-center justify-between text-xs ${
              bannerNotice.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerNotice.type === "error" ? (
                <Info size={16} className="text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              )}
              <span>{bannerNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setBannerNotice(null);
                window.history.replaceState({}, "", "/linkedin");
              }}
              className="text-stone-500 hover:text-stone-800 font-bold ml-4"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Connected LinkedIn Account Card */}
        {profile?.linkedInSubId && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {profile.linkedInPictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.linkedInPictureUrl}
                  alt={profile.linkedInName || "LinkedIn Profile"}
                  className="h-12 w-12 rounded-full object-cover border border-emerald-200 shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white font-bold text-lg shrink-0">
                  {(profile.linkedInName || user.name || "L").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#2B1B1B]">
                    {profile.linkedInName || user.name}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={11} />
                    LinkedIn Connected
                  </span>
                </div>
                {profile.linkedInEmail && (
                  <p className="text-xs text-slate-500 mt-0.5">{profile.linkedInEmail}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  LinkedIn Sign-In verifies your name, email &amp; photo. Use <strong>Import Profile</strong> to pull in your full work history, education &amp; skills.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#7A0F1F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#5c0b17] transition-colors shrink-0"
            >
              <Upload size={14} />
              <span>Import Full Profile</span>
            </button>
          </div>
        )}

        {/* Guidance Panel */}
        <HowItWorksPanel toolKey="linkedin-check" />

        {/* OIDC Disclosure Banner */}
        <div className="rounded-xl border border-[#F0E1DE] bg-[#FFF9F7] p-4 flex items-start gap-3 text-xs text-[#2B1B1B]">
          <Info size={18} className="text-[#7A0F1F] shrink-0 mt-0.5" />
          <p>
            <strong>Official LinkedIn OIDC Policy:</strong> Standard LinkedIn connection grants identity verification. Complete historical education, skills, and work details are imported securely via <strong>LinkedIn PDF export</strong> or <strong>direct text paste</strong> without sharing LinkedIn credentials.
          </p>
        </div>

        {/* Readiness Overview Cards */}
        {analysisReport && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#F0E1DE] bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Readiness Score
              </span>
              <p className="mt-2 text-3xl font-bold text-[#7A0F1F]">
                {analysisReport.overallScore}%
              </p>
              <p className="mt-1 text-[11px] text-slate-500">CareerEdge domain benchmark</p>
            </div>

            <div className="rounded-2xl border border-[#F0E1DE] bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Proof Ratio
              </span>
              <p className="mt-2 text-3xl font-bold text-emerald-800">
                {analysisReport.evidenceBackedRatio}%
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Skills backed by Proof Bank</p>
            </div>

            <div className="rounded-2xl border border-[#F0E1DE] bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Headline Status
              </span>
              <p className="mt-2 text-lg font-bold text-[#2B1B1B]">
                {analysisReport.sectionScores.find((s) => s.section === "Headline")?.status.replace("_", " ")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Target role alignment</p>
            </div>

            <div className="rounded-2xl border border-[#F0E1DE] bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                About Narrative
              </span>
              <p className="mt-2 text-lg font-bold text-[#2B1B1B]">
                {analysisReport.sectionScores.find((s) => s.section === "About")?.status.replace("_", " ")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">3-paragraph structure</p>
            </div>
          </div>
        )}

        {/* Section Optimization Studio */}
        <div className="rounded-2xl border border-[#F0E1DE] bg-white p-6 shadow-sm space-y-6">
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#F0E1DE] pb-4">
            {[
              { id: "HEADLINE", label: "Headline Optimization" },
              { id: "ABOUT", label: "About Narrative" },
              { id: "FEATURED", label: "Featured Artifacts" },
              { id: "EXPERIENCE", label: "Experience Presentation" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as LinkedInSectionType)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  activeSection === tab.id
                    ? "bg-[#7A0F1F] text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Studio Content */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#2B1B1B]">
                  {activeSection === "HEADLINE" && "Optimized Professional Headline"}
                  {activeSection === "ABOUT" && "3-Paragraph Narrative Summary"}
                  {activeSection === "FEATURED" && "High-Proof Featured Section Recommendations"}
                  {activeSection === "EXPERIENCE" && "Role Description & Impact Formula"}
                </h3>
                <p className="text-xs text-slate-500">
                  Crafted strictly for {user.academicDomain} targeting {user.preferredJobRole || "entry-level roles"}.
                </p>
              </div>

              {stagedImport && (
                <button
                  type="button"
                  onClick={() => loadStagedForSection(activeSection)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EBDDD1] bg-white px-3 py-1.5 text-xs font-semibold text-[#765F5D] hover:bg-[#FCF9F6] transition shadow-2xs"
                >
                  <RefreshCw size={12} />
                  <span>Load Imported LinkedIn Draft</span>
                </button>
              )}
            </div>

            {/* Split Drafting & Optimization Workspace */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column: Editable Source Draft */}
              <div className="flex flex-col space-y-3 rounded-2xl border border-[#EBDDD1] bg-[#FCF9F6] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#765F5D]">
                    1. Current Draft / Source Text
                  </span>
                  <span className="text-[11px] font-medium text-[#765F5D]">
                    {activeSection === "HEADLINE" && (
                      <span className={((draftInputs.HEADLINE || "").length > 220 ? "text-amber-700 font-bold" : "text-emerald-800 font-semibold")}>
                        {(draftInputs.HEADLINE || "").length} / 220 chars (LinkedIn limit)
                      </span>
                    )}
                    {activeSection === "ABOUT" && (
                      <span className={((draftInputs.ABOUT || "").length > 2600 ? "text-amber-700 font-bold" : "text-emerald-800 font-semibold")}>
                        {(draftInputs.ABOUT || "").length} / 2,600 chars (LinkedIn limit)
                      </span>
                    )}
                  </span>
                </div>

                <textarea
                  rows={activeSection === "ABOUT" ? 10 : activeSection === "EXPERIENCE" ? 8 : 4}
                  value={draftInputs[activeSection] || ""}
                  onChange={(e) =>
                    setDraftInputs((prev) => ({
                      ...prev,
                      [activeSection]: e.target.value,
                    }))
                  }
                  placeholder={
                    activeSection === "HEADLINE"
                      ? "e.g. Full Stack Developer | React, Node.js, Next.js | BE Computer Engineering"
                      : activeSection === "ABOUT"
                      ? "Enter your current professional summary or click 'Load Imported LinkedIn Draft'..."
                      : activeSection === "EXPERIENCE"
                      ? "List your role, company, and key contributions..."
                      : "List your key projects or artifacts..."
                  }
                  className="w-full resize-y rounded-xl border border-[#F0E1DE] bg-white p-3.5 text-xs text-[#2B1B1B] focus:border-[#7A0F1F] focus:outline-hidden focus:ring-1 focus:ring-[#7A0F1F] leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-500">
                    {activeSection === "HEADLINE"
                      ? "Recruiter-preferred formula: [Target Role] | [Core Specialization] | [Verified Credential]"
                      : activeSection === "ABOUT"
                      ? "Structured 3-paragraph format: Domain Focus → Core Proof → High-Intent Call to Action"
                      : "Synthesizes STAR impact formula with your verified skills and experiences."}
                  </p>

                  <button
                    type="button"
                    disabled={optimizing}
                    onClick={() => handleOptimize(activeSection, Boolean(currentResult))}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#7A0F1F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#650B19] disabled:opacity-50 transition-colors shadow-sm text-center"
                  >
                    {optimizing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : currentResult ? (
                      <>
                        <RefreshCw size={13} />
                        <span>
                          Generate New Variation (Angle #{((sectionVariations[activeSection] || 1) % 3) + 1})
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate Improved Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: AI-Optimized Output */}
              <div className="flex flex-col space-y-4">
                {currentResult ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-5 space-y-3 relative shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                            CareerEdge Optimized Copy
                          </span>
                          <span className="rounded-md bg-white border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                            Variation #{sectionVariations[activeSection] || 1}
                          </span>
                          {activeSection === "HEADLINE" && (
                            <span className="text-[10px] font-bold text-emerald-800">
                              {currentResult.improvedText.length} / 220 chars (Optimal)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {/* New Variation / Angle Button */}
                          <button
                            type="button"
                            disabled={optimizing}
                            onClick={() => handleOptimize(activeSection, true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs disabled:opacity-50"
                            title="Generate a fresh alternative variation"
                          >
                            <RefreshCw size={12} className={optimizing ? "animate-spin text-emerald-700" : "text-emerald-700"} />
                            <span>Try Another Angle</span>
                          </button>

                          {/* Copy Button */}
                          <button
                            type="button"
                            onClick={() => handleCopy(currentResult.improvedText, activeSection)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs"
                            title="Copy improved copy to clipboard"
                          >
                            {copiedKey === activeSection ? (
                              <>
                                <Check size={13} className="text-emerald-700" />
                                <span>Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Improved Copy</span>
                              </>
                            )}
                          </button>

                          {/* Apply to Passport Button */}
                          {(activeSection === "HEADLINE" || activeSection === "ABOUT") && (
                            <button
                              type="button"
                              onClick={() => handleApplyToProfile(currentResult.improvedText, activeSection)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 transition shadow-2xs"
                              title="Save this copy directly to your Career Passport profile"
                            >
                              {appliedKey === activeSection ? (
                                <>
                                  <CheckCircle2 size={13} className="text-emerald-300" />
                                  <span>Applied to Profile!</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck size={13} />
                                  <span>Apply to Profile</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-medium text-emerald-950 whitespace-pre-wrap leading-relaxed min-h-[90px]">
                        {currentResult.improvedText}
                      </p>
                    </div>

                    {/* Rationale & Keyword Badges */}
                    <div className="rounded-2xl border border-[#EBDDD1] bg-[#FCF9F6] p-5 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#2B1810]">
                          Why This Improves Your Visibility:
                        </h4>
                        <p className="mt-1 text-xs text-[#765F5D] leading-relaxed">
                          {currentResult.whyBetter}
                        </p>
                      </div>

                      {currentResult.keywordsTargeted.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-bold text-[#2B1B1B]">Targeted Keywords:</span>
                          {currentResult.keywordsTargeted.map((kw, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-white border border-[#F0E1DE] px-2 py-0.5 text-[10px] font-semibold text-[#7A0F1F]"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0E1DE] bg-slate-50 p-8 text-center min-h-[260px]">
                    <div className="rounded-full bg-white p-3 border border-[#F0E1DE] shadow-2xs text-[#7A0F1F]">
                      <Sparkles size={24} />
                    </div>
                    <h4 className="mt-3 text-xs font-bold text-[#2B1B1B]">
                      Ready to Optimize Your {activeSection}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm">
                      Click <strong>&quot;Generate Improved Copy&quot;</strong> to synthesize an evidence-backed version incorporating your verified skills and target role.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Staged Import Review & Career Passport Sync Card */}
        {stagedImport && (
          <div className="rounded-2xl border border-emerald-300 bg-white p-4 sm:p-6 shadow-sm space-y-5 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-100 pb-4">
              <div className="space-y-1 min-w-0">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                  Staged LinkedIn Import ({stagedImport.provenance})
                </span>
                <h3 className="font-heading text-base font-bold text-[#2B1B1B]">
                  Review &amp; Save to Career Passport
                </h3>
                <p className="text-xs text-slate-500">
                  Select verified skills, experience, and degrees to merge into your permanent student profile.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  disabled={
                    mergingPassport ||
                    selectedSkills.size + selectedEducations.size + selectedExperiences.size === 0
                  }
                  onClick={handleMergeToPassport}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 sm:px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 shadow-xs transition disabled:opacity-50 text-center"
                >
                  {mergingPassport ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Merging Records...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>
                        Save & Merge to Profile (
                        {selectedSkills.size + selectedEducations.size + selectedExperiences.size} Records)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Merge Success Alert */}
            {passportMergedSuccess && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-950 text-xs font-semibold">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                  <span>{passportMergedSuccess}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                >
                  <span>Go to Dashboard &rarr;</span>
                </Link>
              </div>
            )}

            {/* Interactive Review Grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* 1. Skills Review */}
              <div className="rounded-xl border border-[#EBDDD1] p-4 space-y-3 bg-[#FCF9F6]/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2B1810]">
                    Detected Skills ({stagedImport.skills.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSkills.size === stagedImport.skills.length) {
                        setSelectedSkills(new Set());
                      } else {
                        setSelectedSkills(new Set(stagedImport.skills));
                      }
                    }}
                    className="text-[11px] font-semibold text-[#7A0F1F] hover:underline"
                  >
                    {selectedSkills.size === stagedImport.skills.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {stagedImport.skills.map((skill) => {
                    const isSelected = selectedSkills.has(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const next = new Set(selectedSkills);
                          if (isSelected) next.delete(skill);
                          else next.add(skill);
                          setSelectedSkills(next);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                            : "bg-white border-[#F0E1DE] text-slate-500 opacity-60"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                          isSelected ? "bg-emerald-700 border-emerald-700 text-white" : "border-stone-300"
                        }`}>
                          {isSelected && "✓"}
                        </span>
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Experience Review */}
              <div className="rounded-xl border border-[#EBDDD1] p-4 space-y-3 bg-[#FCF9F6]/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2B1810]">
                    Work Experiences ({stagedImport.experiences.length})
                  </span>
                  <span className="text-[11px] text-[#765F5D]">
                    {selectedExperiences.size} selected
                  </span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-xs">
                  {stagedImport.experiences.map((exp, idx) => {
                    const isSelected = selectedExperiences.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const next = new Set(selectedExperiences);
                          if (isSelected) next.delete(idx);
                          else next.add(idx);
                          setSelectedExperiences(next);
                        }}
                        className={`cursor-pointer rounded-lg border p-2.5 transition ${
                          isSelected
                            ? "bg-emerald-50/60 border-emerald-300"
                            : "bg-white border-[#EBDDD1] opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-emerald-700 focus:ring-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#2B1810] truncate">{exp.title}</p>
                            <p className="text-[#765F5D] text-[11px] truncate">
                              {exp.company} {exp.duration ? `• ${exp.duration}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Education & Headline Review */}
              <div className="rounded-xl border border-[#EBDDD1] p-4 space-y-3 bg-[#FCF9F6]/40">
                <span className="font-bold text-xs text-[#2B1810]">
                  Education & Headline ({stagedImport.educations.length} records)
                </span>

                {/* Headline Checkbox */}
                {stagedImport.headline && (
                  <div
                    onClick={() => setApproveHeadline(!approveHeadline)}
                    className={`cursor-pointer rounded-lg border p-2.5 transition text-xs ${
                      approveHeadline ? "bg-emerald-50/60 border-emerald-300" : "bg-white border-[#EBDDD1] opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={approveHeadline}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-700 focus:ring-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          Set as Passport Headline
                        </span>
                        <p className="font-medium text-[#2B1810] text-[11px] truncate mt-0.5">
                          {stagedImport.headline}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-xs">
                  {stagedImport.educations.map((edu, idx) => {
                    const isSelected = selectedEducations.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const next = new Set(selectedEducations);
                          if (isSelected) next.delete(idx);
                          else next.add(idx);
                          setSelectedEducations(next);
                        }}
                        className={`cursor-pointer rounded-lg border p-2.5 transition ${
                          isSelected
                            ? "bg-emerald-50/60 border-emerald-300"
                            : "bg-white border-[#EBDDD1] opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-emerald-700 focus:ring-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#2B1810] truncate">{edu.degree}</p>
                            <p className="text-[#765F5D] text-[11px] truncate">
                              {edu.institution} {edu.year ? `• ${edu.year}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-[#F0E1DE] pb-3">
                <div className="flex items-center gap-2">
                  <Upload size={18} className="text-[#7A0F1F]" />
                  <h3 className="font-heading text-lg font-bold text-[#2B1B1B]">
                    Import LinkedIn Profile
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex gap-2 border-b border-[#F0E1DE] pb-3">
                <button
                  type="button"
                  onClick={() => setImportMode("TEXT")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    importMode === "TEXT"
                      ? "bg-[#7A0F1F] text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Paste Profile Text
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("PDF")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    importMode === "PDF"
                      ? "bg-[#7A0F1F] text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Upload Profile PDF
                </button>
              </div>

              {importError && (
                <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                  {importError}
                </div>
              )}

              {importMode === "TEXT" ? (
                <form onSubmit={handleTextImport} className="mt-4 space-y-3">
                  <label className="block text-xs font-bold text-[#2B1B1B]">
                    Paste Copied Profile Text
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Copy all text from your LinkedIn profile or 'Save to PDF' text and paste here..."
                    className="w-full rounded-xl border border-[#F0E1DE] p-3 text-xs text-[#2B1B1B] focus:border-[#7A0F1F] focus:outline-hidden"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="rounded-xl border border-[#F0E1DE] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={importing}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A0F1F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#650B19] disabled:opacity-50"
                    >
                      {importing && <Loader2 size={12} className="animate-spin" />}
                      <span>Parse Profile</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border-2 border-dashed border-[#F0E1DE] p-6 text-center">
                    <FileText size={28} className="text-[#7A0F1F] mx-auto" />
                    <p className="mt-2 text-xs font-bold text-[#2B1B1B]">
                      Upload Official LinkedIn PDF Export
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      On LinkedIn, click More → Save to PDF. Max size: 5 MB.
                    </p>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      disabled={importing}
                      className="mt-3 block w-full text-xs text-stone-500 file:mr-2 file:rounded-lg file:border-0 file:bg-[#7A0F1F] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                  </div>
                  {importing && (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#7A0F1F] font-bold">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Parsing PDF text streams...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
