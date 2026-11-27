"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  HelpCircle,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  InterviewKitSummary,
  InterviewPassportPreviewResult,
  InterviewPrepTheme,
  PreparedInterviewKit,
} from "@/lib/interview/types";
import { CreateKitWizard } from "@/components/interview/create-kit-wizard";
import { ResourceCatalogue } from "@/components/interview/resource-catalogue";
import { InteractiveRoadmap } from "@/components/interview/interactive-roadmap";
import { StarPracticePanel } from "@/components/interview/star-practice-panel";
import { MockInterviewPanel } from "@/components/interview/mock-interview-panel";
import { StudyPlanPanel } from "@/components/interview/study-plan-panel";
import { EmptyState } from "@/components/interview/ui/empty-state";
import { PageSection } from "@/components/interview/ui/page-section";
import { SkeletonList } from "@/components/interview/ui/skeleton-list";
import { StatusBadge } from "@/components/interview/ui/status-badge";
import { Toast } from "@/components/interview/ui/toast";

interface InterviewPrepClientProps {
  studentName: string;
  initialKits?: InterviewKitSummary[];
  initialActiveKit?: PreparedInterviewKit | null;
  passportPreview?: InterviewPassportPreviewResult | null;
  initialJobTitle?: string;
  initialCompany?: string;
  initialDomain?: string;
  initialTab?: "OVERVIEW" | "ROADMAP" | "QUESTIONS_STAR" | "MOCK_INTERVIEW" | "STUDY_PLAN";
}

type WorkspaceTab = "OVERVIEW" | "ROADMAP" | "QUESTIONS_STAR" | "MOCK_INTERVIEW" | "STUDY_PLAN";

const WORKSPACE_TABS: readonly { key: WorkspaceTab; label: string }[] = [
  { key: "OVERVIEW", label: "Prep Overview" },
  { key: "ROADMAP", label: "Roadmap" },
  { key: "QUESTIONS_STAR", label: "Questions & STAR" },
  { key: "MOCK_INTERVIEW", label: "AI Mock Interview" },
  { key: "STUDY_PLAN", label: "Study Plan & Gaps" },
];

export function InterviewPrepClient({
  studentName,
  initialKits,
  initialActiveKit,
  passportPreview = null,
  initialJobTitle,
  initialCompany,
  initialDomain,
  initialTab = "OVERVIEW",
}: InterviewPrepClientProps) {
  const [kits, setKits] = useState<InterviewKitSummary[]>(initialKits || []);
  const [activeKit, setActiveKit] = useState<PreparedInterviewKit | null>(initialActiveKit || null);
  const [loading, setLoading] = useState(initialKits === undefined);
  const [kitLoading, setKitLoading] = useState(false);
  const [kitError, setKitError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyErrorKey, setCopyErrorKey] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(["q-tech-1", "q-health-1", "q-comm-1"])
  );
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>(initialTab);
  const [roadmapPercent, setRoadmapPercent] = useState<number | null>(null);
  const [nextStepTopic, setNextStepTopic] = useState<string | null>(null);

  const [showGenerateModal, setShowGenerateModal] = useState(Boolean(initialJobTitle));

  const syncUrlParams = useCallback((kitId: string | null, tab: WorkspaceTab) => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (kitId) url.searchParams.set("kit", kitId);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }, []);

  const handleTabChange = (nextTab: WorkspaceTab) => {
    setWorkspaceTab(nextTab);
    syncUrlParams(activeKit?.id ?? null, nextTab);
  };

  const loadKitDetails = useCallback(
    async (kitId: string) => {
      setKitLoading(true);
      setKitError(null);
      try {
        const res = await fetch(`/api/interview-prep/${kitId}`, { credentials: "include" });
        if (!res.ok) {
          throw new Error("Could not load the selected interview kit.");
        }
        const data = (await res.json()) as PreparedInterviewKit;
        setActiveKit(data);
        syncUrlParams(data.id, workspaceTab);
      } catch (err) {
        setKitError(err instanceof Error ? err.message : "Failed to load kit details");
      } finally {
        setKitLoading(false);
      }
    },
    [syncUrlParams, workspaceTab]
  );

  const fetchKits = useCallback(
    async (skipAutoSelect = false) => {
      setLoading(true);
      try {
        const res = await fetch("/api/interview-prep", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setKits(data.kits || []);
          if (!skipAutoSelect && data.kits?.length > 0 && !activeKit) {
            void loadKitDetails(data.kits[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load interview kits:", err);
      } finally {
        setLoading(false);
      }
    },
    [activeKit, loadKitDetails]
  );

  useEffect(() => {
    if (initialKits !== undefined) return;
    let ignore = false;
    fetch("/api/interview-prep", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.kits) {
          setKits(data.kits);
          if (data.kits.length > 0) {
            fetch(`/api/interview-prep/${data.kits[0].id}`, { credentials: "include" })
              .then((r) => (r.ok ? r.json() : null))
              .then((kit) => {
                if (!ignore && kit) setActiveKit(kit);
              });
          }
        }
      })
      .catch((err) => console.error("Error on mount:", err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [initialKits]);

  // Fetch active kit roadmap progress summary for header & "Next best step" card
  useEffect(() => {
    if (!activeKit?.id) return;
    let cancelled = false;
    fetch(`/api/interview-prep/${encodeURIComponent(activeKit.id)}/roadmap`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((rm) => {
        if (cancelled || !rm) return;
        if (rm.available && rm.stats) {
          setRoadmapPercent(rm.stats.percentComplete ?? 0);
          const nextUncompleted = (rm.phases || [])
            .flatMap((p: { topics?: Array<{ title: string; status: string; unmetPrerequisiteIds?: string[] }> }) => p.topics || [])
            .find((t: { status: string; unmetPrerequisiteIds?: string[] }) => t.status !== "COMPLETED" && (t.unmetPrerequisiteIds?.length ?? 0) === 0);
          setNextStepTopic(nextUncompleted?.title ?? null);
        } else {
          setRoadmapPercent(0);
          setNextStepTopic(null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeKit?.id, workspaceTab]);

  const handleWizardCreated = (created: PreparedInterviewKit) => {
    setActiveKit(created);
    setShowGenerateModal(false);
    syncUrlParams(created.id, workspaceTab);
    void fetchKits(true);
  };

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const copyToClipboard = async (text: string, key: string) => {
    setCopyErrorKey(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      setCopyErrorKey(key);
      setTimeout(() => setCopyErrorKey(null), 3500);
    }
  };

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/50 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Strip */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B1B1B]">
                  Interview Prep
                </h1>
                {activeKit && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0C7] border border-[#F2B63D]/60 px-3 py-0.5 text-xs font-bold text-[#4C0915]">
                    <span>{activeKit.jobTitle}</span>
                    {roadmapPercent !== null && <span>• {roadmapPercent}%</span>}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#59413F] max-w-2xl">
                Prepare step by step with domain roadmaps, STAR stories, mock interviews, and free learning resources.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href="/resume/studio"
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-[#D8C5B8] text-[#2B1B1B] hover:bg-[#FFF8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
              >
                <Sparkles className="w-4 h-4 text-[#7A0F1F]" aria-hidden="true" />
                <span>Resume Studio</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#7A0F1F] text-white hover:bg-[#4C0915] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B63D]"
              >
                <Plus className="w-4 h-4 text-[#F2B63D]" aria-hidden="true" />
                <span>New Prep Kit</span>
              </button>
            </div>
          </header>

          {/* Guidance Helper */}
          <HowItWorksPanel toolKey="interview-prep-kit" />

          {/* Kit Switcher: Dropdown on Mobile, Compact Cards on Tablet/Desktop */}
          {loading ? (
            <SkeletonList count={2} />
          ) : kits.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-10 h-10" />}
              title="No interview prep kits yet"
              description="An interview prep kit tailors your roadmap, practice questions, STAR builder, and learning resources to your target role."
              nextStep="Create your first kit to get started in under two minutes."
              action={
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(true)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] text-white text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B63D]"
                >
                  <Plus className="w-4 h-4 text-[#F2B63D]" aria-hidden="true" />
                  <span>Create your first kit</span>
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="sm:hidden">
                <label
                  htmlFor="mobile-kit-switcher"
                  className="block text-xs font-bold uppercase tracking-wide text-[#59413F] mb-1.5"
                >
                  Active Prep Kit ({kits.length})
                </label>
                <select
                  id="mobile-kit-switcher"
                  value={activeKit?.id || ""}
                  onChange={(e) => {
                    if (e.target.value) void loadKitDetails(e.target.value);
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm font-semibold text-[#2B1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  {kits.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.jobTitle} {k.companyName ? `— ${k.companyName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {kits.map((k) => {
                  const isSelected = activeKit?.id === k.id;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => void loadKitDetails(k.id)}
                      className={`min-h-[44px] w-full text-left px-4 py-3 rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] ${
                        isSelected
                          ? "bg-[#7A0F1F] text-white border-[#7A0F1F] shadow-xs"
                          : "bg-white border-[#EBDDD1] hover:border-[#7A0F1F]/50 text-[#2B1B1B]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-heading text-sm font-bold truncate">{k.jobTitle}</h3>
                        <span
                          className={`text-xs font-bold shrink-0 ${
                            isSelected ? "text-[#F2B63D]" : "text-[#7A0F1F]"
                          }`}
                        >
                          {isSelected ? "Active" : "Open"}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          isSelected ? "text-amber-100" : "text-[#59413F]"
                        }`}
                      >
                        {k.companyName || k.domain || "General Practice"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Kit Workspace */}
          {kitError && <Toast type="err" message={kitError} onDismiss={() => setKitError(null)} />}

          {kitLoading ? (
            <SkeletonList count={3} />
          ) : activeKit ? (
            <div className="space-y-6">
              {/* Next Best Step Card */}
              <div className="rounded-2xl border border-[#F2B63D]/60 bg-[#FFF0C7]/45 px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#7A0F1F]">
                    Next Best Step
                  </p>
                  <p className="text-sm font-semibold text-[#2B1B1B]">
                    {nextStepTopic
                      ? `Continue: ${nextStepTopic}`
                      : "Practice 1 interview question with STAR & your Proof Bank"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange(nextStepTopic ? "ROADMAP" : "QUESTIONS_STAR")}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#7A0F1F] bg-white hover:bg-[#FFF8F0] text-[#7A0F1F] text-sm font-bold inline-flex items-center justify-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  <span>{nextStepTopic ? "Open Roadmap" : "Start practicing"}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Active Kit Header & 5-Section Workspace Navigation */}
              <div className="bg-white rounded-2xl border border-[#EBDDD1] p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="info" label={activeKit.domain || "General Practice"} />
                      {activeKit.useCareerPassport && (
                        <StatusBadge tone="completed" label="Career Passport Linked" />
                      )}
                    </div>
                    <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#2B1B1B] pt-1">
                      {activeKit.jobTitle}
                    </h2>
                    <p className="text-sm text-[#59413F]">
                      {[
                        activeKit.companyName
                          ? `Tailored for ${activeKit.companyName}`
                          : "General Domain Practice",
                        activeKit.targetLevel ? activeKit.targetLevel.replace(/_/g, " ") : null,
                        activeKit.location || null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                </div>

                {/* Workspace Navigation Tabs (Scrollable on Mobile, Horizontal on Desktop) */}
                <div
                  role="tablist"
                  aria-label="Interview Prep workspace sections"
                  className="flex items-center gap-2 overflow-x-auto pb-1 pt-3 border-t border-[#EBDDD1]"
                >
                  {WORKSPACE_TABS.map(({ key, label }) => {
                    const active = workspaceTab === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => handleTabChange(key)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] ${
                          active
                            ? "bg-[#7A0F1F] text-white border-[#7A0F1F]"
                            : "bg-[#FFF8F0] text-[#2B1B1B] border-[#D8C5B8] hover:border-[#7A0F1F]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Tab Content */}
              {workspaceTab === "ROADMAP" && (
                <InteractiveRoadmap kitId={activeKit.id} domain={activeKit.domain || null} />
              )}
              {workspaceTab === "QUESTIONS_STAR" && (
                <StarPracticePanel kitId={activeKit.id} />
              )}
              {workspaceTab === "MOCK_INTERVIEW" && (
                <MockInterviewPanel kitId={activeKit.id} />
              )}
              {workspaceTab === "STUDY_PLAN" && (
                <StudyPlanPanel kitId={activeKit.id} />
              )}

              {/* Prep Overview: Simple Question Rows */}
              {workspaceTab === "OVERVIEW" && (
                <PageSection
                  id="prep-overview-heading"
                  title="Recommended Interview Questions"
                  summary="Expand any question to review what interviewers evaluate, the STAR structure, and which evidence to cite."
                >
                  <div className="space-y-6">
                    {activeKit.themes.map((theme: InterviewPrepTheme, tIdx: number) => (
                      <div key={tIdx} className="space-y-3">
                        <div className="border-l-4 border-[#F2B63D] pl-3">
                          <h4 className="font-heading text-sm font-bold text-[#2B1B1B]">
                            {theme.themeName}
                          </h4>
                          <p className="text-sm text-[#59413F]">{theme.description}</p>
                        </div>

                        <div className="divide-y divide-[#EBDDD1] rounded-2xl border border-[#EBDDD1] overflow-hidden">
                          {theme.questions.map((q) => {
                            const isExpanded = expandedQuestions.has(q.id);
                            return (
                              <div key={q.id} className="bg-white">
                                <button
                                  type="button"
                                  aria-expanded={isExpanded}
                                  onClick={() => toggleQuestionExpand(q.id)}
                                  className="w-full min-h-[52px] px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-[#FFF8F0]/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7A0F1F]"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                                    <StatusBadge
                                      tone={q.category === "TECHNICAL" ? "info" : "available"}
                                      label={q.category}
                                      className="self-start sm:self-center shrink-0"
                                    />
                                    <span className="text-sm font-bold text-[#2B1B1B]">
                                      {q.question}
                                    </span>
                                  </div>
                                  <span className="text-[#59413F] shrink-0" aria-hidden="true">
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 border-t border-[#EBDDD1] bg-[#FFF8F0]/45 space-y-3 text-sm">
                                    <p className="text-[#59413F]">
                                      <strong className="text-[#2B1B1B]">Evaluator context: </strong>
                                      {q.context}
                                    </p>

                                    <div className="rounded-xl border border-[#EBDDD1] bg-white p-3.5 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <strong className="text-[#2B1B1B] inline-flex items-center gap-1.5">
                                          <Sparkles className="w-4 h-4 text-[#F2B63D]" aria-hidden="true" />
                                          <span>Recommended STAR Framework</span>
                                        </strong>
                                        <button
                                          type="button"
                                          onClick={() => void copyToClipboard(q.responseFramework, q.id)}
                                          className="min-h-[44px] sm:min-h-[36px] px-3 py-1 rounded-lg border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-xs font-bold text-[#7A0F1F] inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                                        >
                                          {copiedKey === q.id ? (
                                            <>
                                              <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                                              <span>Copied</span>
                                            </>
                                          ) : copyErrorKey === q.id ? (
                                            <span className="text-rose-700">Copy blocked</span>
                                          ) : (
                                            <>
                                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                              <span>Copy</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      <p className="text-sm text-[#2B1B1B] leading-relaxed">
                                        {q.responseFramework}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-start gap-2 text-emerald-950">
                                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                                      <div>
                                        <strong className="block font-semibold">
                                          Proof Bank Evidence Linkage
                                        </strong>
                                        <span>{q.proofBankCitationAdvice}</span>
                                      </div>
                                    </div>

                                    {q.keyTalkingPoints.length > 0 && (
                                      <div className="space-y-1">
                                        <strong className="text-[#2B1B1B]">Key points to emphasize:</strong>
                                        <ul className="list-disc pl-5 space-y-1 text-[#59413F]">
                                          {q.keyTalkingPoints.map((pt, i) => (
                                            <li key={i}>{pt}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </PageSection>
              )}

              {/* Learning Resource Catalogue */}
              <ResourceCatalogue
                kitId={activeKit.id}
                domain={activeKit.domain || null}
                roleTitle={activeKit.jobTitle || null}
              />
            </div>
          ) : null}

          {showGenerateModal && (
            <CreateKitWizard
              open={true}
              onClose={() => setShowGenerateModal(false)}
              onCreated={handleWizardCreated}
              passportPreview={passportPreview}
              initialJobTitle={initialJobTitle}
              initialCompany={initialCompany}
              initialDomain={initialDomain}
            />
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
