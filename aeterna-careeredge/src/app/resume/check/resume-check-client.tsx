"use client";

// src/app/resume/check/resume-check-client.tsx
// Job Description Alignment & Resume Completeness Review Client (Day 2 Part 3.4)

import { useState } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Loader2,
  Target,
  Key,
  MessageSquare,
  Check,
  UploadCloud,
} from "lucide-react";
import type { ResumeIntelligenceReport } from "@/lib/resume/intelligence";
import { UploadResumeButton } from "@/components/resume/upload-resume-button";

interface ResumeCheckClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    academicDomain: string;
    preferredJobRole?: string;
  };
  resumes: Array<{
    id: string;
    title: string;
    targetRole?: string | null;
    atsScore?: number | null;
    structuredData?: string | null;
    feedback?: string | null;
  }>;
  initialResumeId?: string;
}

export function ResumeCheckClient({
  user,
  resumes,
  initialResumeId,
}: ResumeCheckClientProps) {
  const [selectedResumeId, setSelectedResumeId] = useState(
    initialResumeId || resumes[0]?.id || ""
  );
  const [jobDescription, setJobDescription] = useState("");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<ResumeIntelligenceReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!selectedResumeId) return;
    setRunning(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/resumes/${selectedResumeId}/review`, {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setReport(data.report);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to analyze resume.");
    } finally {
      setRunning(false);
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
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A0F1F]">
            <FileSearch size={16} />
            <span>Job Description Alignment & ATS Testing</span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#2B1810] sm:text-3xl">
            Resume Check
          </h1>
          <p className="mt-1 text-sm text-[#765F5D]">
            Test your resume against real job descriptions. Detect missing requirements, evidence gaps, and readability benchmarks.
          </p>
        </div>

        {/* Guidance Panel */}
        <HowItWorksPanel toolKey="resume-check" />

        {/* Error notification */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
            {errorMessage}
          </div>
        )}

        {/* Resumes Empty State */}
        {resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#EBDDD1] bg-white p-10 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0D4] text-[#7A0F1F]">
              <UploadCloud size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-stone-900">
                Upload a Resume to Analyze
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                You haven&apos;t created or imported any resumes yet. Upload an existing PDF or Word resume to test ATS keyword match.
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <UploadResumeButton
                variant="button"
                label="Upload Resume for Analysis"
                onSuccess={() => window.location.reload()}
              />
            </div>
          </div>
        ) : (
          /* Console Card */
          <div className="rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#2B1810]">
                  Select Resume Version *
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBDDD1] bg-white px-3.5 py-2.5 text-xs text-[#2B1810] focus:border-[#7A0F1F] focus:outline-hidden"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.targetRole || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end justify-between sm:justify-end gap-3">
                <UploadResumeButton
                  variant="outline"
                  label="Upload Another Resume"
                  onSuccess={() => window.location.reload()}
                />
                <Link
                  href={`/resume/builder?id=${selectedResumeId}`}
                  className="text-xs font-bold text-[#7A0F1F] hover:underline flex items-center gap-1"
                >
                  Open Editor →
                </Link>
              </div>
            </div>

            <div>
            <label className="block text-xs font-bold text-[#2B1810]">
              Paste Job Description (Optional for JD Alignment)
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the employer's job description here to check matching skills, keyword density, and missing competencies..."
              className="mt-1 w-full rounded-xl border border-[#EBDDD1] p-3 text-xs leading-relaxed text-[#2B1810] focus:border-[#7A0F1F] focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={running || !selectedResumeId}
              onClick={handleAnalyze}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#600C18] disabled:opacity-50 transition-colors"
            >
              {running ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              <span>Analyze Alignment & Completeness</span>
            </button>
          </div>
        </div>
        )}

        {/* Results Report */}
        {report && (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#EBDDD1] bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-[#765F5D] uppercase tracking-wider">
                  ATS Readability
                </span>
                <p className="mt-2 text-3xl font-bold text-[#7A0F1F]">
                  {report.atsReadabilityScore}%
                </p>
                <p className="mt-1 text-[11px] text-[#765F5D]">
                  Formatting & keyword density score
                </p>
              </div>

              <div className="rounded-2xl border border-[#EBDDD1] bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-[#765F5D] uppercase tracking-wider">
                  Evidence Coverage
                </span>
                <p className="mt-2 text-3xl font-bold text-emerald-800">
                  {report.evidenceCoverageScore}%
                </p>
                <p className="mt-1 text-[11px] text-[#765F5D]">
                  Skills backed by Proof Bank artifacts
                </p>
              </div>

              <div className="rounded-2xl border border-[#EBDDD1] bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-[#765F5D] uppercase tracking-wider">
                  Framework Compliance
                </span>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {report.completenessScore}%
                </p>
                <p className="mt-1 text-[11px] text-[#765F5D]">
                  {report.frameworkCompliance.domainName} standards
                </p>
              </div>
            </div>

            {/* Official Research Source Citation */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex items-center gap-3">
              <BookOpen size={20} className="text-[#7A0F1F] shrink-0" />
              <div className="text-xs text-[#2B1810]">
                <strong className="font-semibold">Authoritative Research Benchmark:</strong>{" "}
                Evaluated against {report.frameworkCompliance.officialResearchSource}. No requirements invented.
              </div>
            </div>

            {/* JD Alignment Section */}
            {report.jdAlignment && (() => {
              const jd = report.jdAlignment;
              const matching = jd.matchingSkills || [];
              const missing = jd.missingSkills || [];
              const evidenceReq = jd.evidenceRequired || [];
              const gaps = jd.detailedGaps || [];
              const keywords = jd.atsKeywordsToIncorporate || [];
              const talkingPoints = jd.interviewTalkingPoints || [];

              const verdictConfig = {
                STRONG_MATCH: {
                  title: "High Role Fit — Ready for Targeted Application",
                  border: "border-emerald-300 bg-emerald-50/70 text-emerald-950",
                  badge: "bg-emerald-600 text-white",
                  icon: CheckCircle2,
                },
                COMPETITIVE_WITH_GAPS: {
                  title: "Competitive Candidate — Strategic Gaps Identified",
                  border: "border-amber-300 bg-amber-50/70 text-amber-950",
                  badge: "bg-amber-600 text-white",
                  icon: Target,
                },
                REQUIRES_UPSKILLING: {
                  title: "Prerequisite Gaps — Targeted Upskilling Advised",
                  border: "border-rose-300 bg-rose-50/70 text-rose-950",
                  badge: "bg-rose-600 text-white",
                  icon: AlertTriangle,
                },
              }[jd.roleReadinessVerdict || "COMPETITIVE_WITH_GAPS"] || {
                title: "Role Alignment Analysis",
                border: "border-amber-300 bg-amber-50/70 text-amber-950",
                badge: "bg-amber-600 text-white",
                icon: Target,
              };

              const VerdictIcon = verdictConfig.icon;

              return (
                <div className="space-y-4">
                  {/* Executive Alignment Verdict Banner */}
                  <div className={`rounded-2xl border p-5 shadow-xs ${verdictConfig.border}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <VerdictIcon size={18} className="shrink-0" />
                        <span className="font-heading text-sm font-bold">
                          {verdictConfig.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {jd.jobRoleExtracted && (
                          <span className="rounded-full bg-white/80 border border-current/20 px-2.5 py-0.5 font-medium">
                            Role: {jd.jobRoleExtracted}
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 font-bold text-[11px] ${verdictConfig.badge}`}>
                          ATS Match: {jd.atsKeywordDensityScore}%
                        </span>
                      </div>
                    </div>
                    {jd.alignmentSummary && (
                      <p className="mt-2 text-xs leading-relaxed opacity-90">
                        {jd.alignmentSummary}
                      </p>
                    )}
                  </div>

                  {/* Skills Grid */}
                  <div className="rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm space-y-4">
                    <h3 className="font-heading text-sm font-bold text-[#2B1810]">
                      Core Skills Alignment Overview
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {/* Matching */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 size={14} />
                          <span>Matching Skills ({matching.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {matching.map((s, i) => (
                            <span key={i} className="rounded bg-emerald-200/60 px-2 py-0.5 text-xs font-medium text-emerald-900">
                              {s}
                            </span>
                          ))}
                          {matching.length === 0 && (
                            <span className="text-xs text-stone-500">None detected</span>
                          )}
                        </div>
                      </div>

                      {/* Missing */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle size={14} />
                          <span>Missing In Resume ({missing.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {missing.map((s, i) => (
                            <span key={i} className="rounded bg-amber-200/60 px-2 py-0.5 text-xs font-medium text-amber-900">
                              {s}
                            </span>
                          ))}
                          {missing.length === 0 && (
                            <span className="text-xs text-stone-500">Zero missing gaps</span>
                          )}
                        </div>
                      </div>

                      {/* Evidence Required */}
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-blue-900 text-xs font-bold uppercase tracking-wider">
                          <ShieldCheck size={14} />
                          <span>Proof Required ({evidenceReq.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {evidenceReq.map((s, i) => (
                            <span key={i} className="rounded bg-blue-200/60 px-2 py-0.5 text-xs font-medium text-blue-900">
                              {s}
                            </span>
                          ))}
                          {evidenceReq.length === 0 && (
                            <span className="text-xs text-stone-500">All matching skills have proof</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirement-by-Requirement Gap Breakdown */}
                  {gaps.length > 0 && (
                    <div className="rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-heading text-sm font-bold text-[#2B1810]">
                          Requirement-by-Requirement Evidence Breakdown
                        </h3>
                        <p className="text-xs text-[#765F5D]">
                          Granular evaluation of candidate profile against priority JD specifications:
                        </p>
                      </div>

                      <div className="space-y-3">
                        {gaps.map((item, idx) => {
                          const statusStyle = {
                            MATCHED: "bg-emerald-100 text-emerald-800 border-emerald-200",
                            PARTIAL: "bg-amber-100 text-amber-800 border-amber-200",
                            MISSING: "bg-rose-100 text-rose-800 border-rose-200",
                          }[item.candidateStatus] || "bg-stone-100 text-stone-800 border-stone-200";

                          const statusLabel = {
                            MATCHED: "✓ Matched in Profile",
                            PARTIAL: "⚠ Partial Evidence",
                            MISSING: "✗ Missing Requirement",
                          }[item.candidateStatus] || item.candidateStatus;

                          return (
                            <div
                              key={idx}
                              className="rounded-xl border border-[#EBDDD1] bg-[#FDFBF9] p-4 text-xs space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-[#2B1810] text-xs">
                                  {item.requirement}
                                </span>
                                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusStyle}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <div className="text-[#765F5D] text-[11px] leading-relaxed">
                                <strong className="text-[#2B1810]">Candidate Evidence:</strong>{" "}
                                {item.evidenceOrContext}
                              </div>
                              <div className="text-[#7A0F1F] text-[11px] font-medium leading-relaxed bg-[#FFF9ED] rounded-lg p-2 border border-[#F6B51C]/40">
                                <strong className="text-[#7A0F1F]">Actionable Fix:</strong>{" "}
                                {item.actionableFix}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* High-Value ATS Semantic Keywords to Incorporate */}
                  {keywords.length > 0 && (
                    <div className="rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-[#7A0F1F]" />
                        <h3 className="font-heading text-sm font-bold text-[#2B1810]">
                          ATS Semantic Keywords to Naturally Incorporate
                        </h3>
                      </div>
                      <p className="text-xs text-[#765F5D]">
                        High-frequency JD terms you have background in. Weave these phrases naturally into your project and experience bullet points:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EBDDD1] bg-[#FDF7F5] px-2.5 py-1 text-xs font-semibold text-[#7A0F1F]"
                          >
                            <Check size={12} className="text-[#7A0F1F]" />
                            <span>{kw}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interview Preparation & Gap Defense Strategy */}
                  {talkingPoints.length > 0 && (
                    <div className="rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-[#7A0F1F]" />
                        <h3 className="font-heading text-sm font-bold text-[#2B1810]">
                          Interview Readiness & Gap Defense Strategy
                        </h3>
                      </div>
                      <p className="text-xs text-[#765F5D]">
                        Strategic talking points to defend partial skills and pivot to your verified strengths:
                      </p>
                      <div className="space-y-2 pt-1">
                        {talkingPoints.map((tp, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs leading-relaxed text-[#2B1810]"
                          >
                            <span className="font-bold text-[#7A0F1F] shrink-0">#{i + 1}</span>
                            <span>{tp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Recommendations */}
            <div className="rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-heading text-sm font-bold text-[#2B1810]">
                Actionable Optimization Steps
              </h3>
              <ul className="space-y-2 text-xs text-[#2B1810]">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#7A0F1F] font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
