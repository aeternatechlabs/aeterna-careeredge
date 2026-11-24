"use client";

// src/app/truth-check/truth-check-client.tsx
// Truth Check Verification Client (Day 2 Addendum Section B2)

import { useState } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  CheckCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { TruthCheckReport, ClaimVerificationItem } from "@/lib/truth-check/service";

interface TruthCheckClientProps {
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
    updatedAt: Date;
  }>;
  skills: Array<{ id: string; name: string }>;
  recentChecks: Array<{
    id: string;
    targetType: string;
    supportedCount: number;
    unsupportedCount: number;
    createdAt: Date;
  }>;
}

export function TruthCheckClient({
  user,
  resumes,
  skills: _skills,
  recentChecks: _recentChecks,
}: TruthCheckClientProps) {
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || "");
  const [manualSkillsInput, setManualSkillsInput] = useState("");
  const [activeTab, setActiveTab] = useState<"RESUME" | "MANUAL">("RESUME");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<TruthCheckReport | null>(null);
  const [confirmingClaim, setConfirmingClaim] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleRunCheck() {
    setRunning(true);
    setStatusMessage(null);

    try {
      if (activeTab === "RESUME" && selectedResumeId) {
        const res = await fetch(`/api/resumes/${selectedResumeId}/truth-check`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Truth check failed.");
        setReport(data.report);
      } else {
        const skillsList = manualSkillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const res = await fetch("/api/truth-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: "RESUME",
            claimedSkills: skillsList,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Truth check failed.");
        setReport(data.report);
      }
    } catch (err: unknown) {
      setStatusMessage((err as Error).message || "Verification check failed.");
    } finally {
      setRunning(false);
    }
  }

  async function handleConfirmClaim(item: ClaimVerificationItem) {
    setConfirmingClaim(item.claim);
    try {
      const res = await fetch("/api/truth-check", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: item.field,
          claim: item.claim,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not confirm claim.");

      setStatusMessage(`Claim "${item.claim}" recorded as verified student truth.`);
      // Update local report
      if (report) {
        setReport({
          ...report,
          items: report.items.map((i) =>
            i.claim === item.claim
              ? {
                  ...i,
                  status: "VERIFIED",
                  reason: "Self-confirmed by student (PROVENANCE: STUDENT_INPUT).",
                }
              : i
          ),
          verifiedCount: report.verifiedCount + 1,
          unsupportedCount: Math.max(0, report.unsupportedCount - 1),
        });
      }
    } catch (err: unknown) {
      setStatusMessage((err as Error).message || "Confirmation failed.");
    } finally {
      setConfirmingClaim(null);
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
            <CheckCheck size={16} />
            <span>Honesty & Provenance Verification</span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#2B1810] sm:text-3xl">
            Truth Check
          </h1>
          <p className="mt-1 text-sm text-[#765F5D]">
            Zero fake claims. Every line on your resume traces to your verified Career Passport or Evidence Vault.
          </p>
        </div>

        {/* Guidance Panel */}
        <HowItWorksPanel toolKey="truth-check" />

        {/* Status Message */}
        {statusMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            {statusMessage}
          </div>
        )}

        {/* Console / Selection Card */}
        <div className="rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#EBDDD1] pb-4">
            <button
              type="button"
              onClick={() => setActiveTab("RESUME")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === "RESUME"
                  ? "bg-[#7A0F1F] text-white"
                  : "bg-[#FCF9F6] text-[#765F5D] hover:bg-[#FDF7F5]"
              }`}
            >
              Verify Saved Resume
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MANUAL")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === "MANUAL"
                  ? "bg-[#7A0F1F] text-white"
                  : "bg-[#FCF9F6] text-[#765F5D] hover:bg-[#FDF7F5]"
              }`}
            >
              Custom Skills Check
            </button>
          </div>

          <div className="mt-5">
            {activeTab === "RESUME" ? (
              resumes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-[#765F5D]">No resumes created yet.</p>
                  <Link
                    href="/resume/studio"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#7A0F1F] hover:underline"
                  >
                    <span>Create a resume in Resume Studio</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#2B1810]">
                      Select Resume to Verify
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
                  <div className="sm:pt-5">
                    <button
                      type="button"
                      disabled={running}
                      onClick={handleRunCheck}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#600C18] disabled:opacity-50 transition-colors"
                    >
                      {running ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCheck size={14} />
                      )}
                      <span>Run Truth Check</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#2B1810]">
                  Enter Skills or Claims (comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={manualSkillsInput}
                  onChange={(e) => setManualSkillsInput(e.target.value)}
                  placeholder="e.g. Critical Care Nursing, IV Cannulation, Python, GST Filing"
                  className="w-full rounded-xl border border-[#EBDDD1] p-3 text-xs text-[#2B1810] focus:border-[#7A0F1F] focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={running || !manualSkillsInput.trim()}
                  onClick={handleRunCheck}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#600C18] disabled:opacity-50 transition-colors"
                >
                  {running ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                  <span>Verify Claims</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Report */}
        {report && (
          <div className="space-y-6">
            {/* Score & Category Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-[#EBDDD1] bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-[#765F5D] uppercase tracking-wider">
                  Honesty Score
                </span>
                <p className="mt-2 text-3xl font-bold text-[#7A0F1F]">
                  {report.honestyScore}%
                </p>
                <p className="mt-1 text-[11px] text-[#765F5D]">
                  Deterministic match against your owned data
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Fully Backed
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-emerald-900">
                  {report.verifiedCount}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Traced to Passport or Vault
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Needs Evidence
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-amber-900">
                  {report.needsEvidenceCount}
                </p>
                <p className="mt-1 text-[11px] text-amber-700">
                  Claimed by you, lacks artifact
                </p>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
                <div className="flex items-center gap-1.5 text-rose-800">
                  <XCircle size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Unsupported
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-rose-900">
                  {report.unsupportedCount}
                </p>
                <p className="mt-1 text-[11px] text-rose-700">
                  Not in your records
                </p>
              </div>
            </div>

            {/* Claims Audit Table */}
            <div className="rounded-2xl border border-[#EBDDD1] bg-white shadow-sm overflow-hidden">
              <div className="border-b border-[#EBDDD1] bg-[#FCF9F6] px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#2B1810]">
                    Claims Verification Breakdown
                  </h3>
                  <p className="text-xs text-[#765F5D]">
                    {report.totalClaimsChecked} items audited
                  </p>
                </div>
                <Link
                  href="/resume/studio"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A0F1F] hover:underline"
                >
                  <Plus size={12} />
                  <span>Review in Resume Studio</span>
                </Link>
              </div>

              <div className="divide-y divide-[#EBDDD1]">
                {report.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-[#FCF9F6] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2B1810]">
                          {item.claim}
                        </span>
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {item.field}
                        </span>
                        {item.status === "VERIFIED" && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 size={10} />
                            Verified
                          </span>
                        )}
                        {item.status === "NEEDS_EVIDENCE" && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <AlertTriangle size={10} />
                            Needs Evidence
                          </span>
                        )}
                        {item.status === "UNSUPPORTED" && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            <XCircle size={10} />
                            Unsupported
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#765F5D]">{item.reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === "NEEDS_EVIDENCE" && (
                        <Link
                          href="/resume/studio"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#EBDDD1] bg-white px-2.5 py-1 text-xs font-medium text-[#7A0F1F] hover:bg-[#FDF7F5]"
                        >
                          <span>Tailor in Studio</span>
                          <ArrowRight size={10} />
                        </Link>
                      )}

                      {item.status === "UNSUPPORTED" && (
                        <button
                          type="button"
                          disabled={confirmingClaim === item.claim}
                          onClick={() => handleConfirmClaim(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {confirmingClaim === item.claim ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <CheckCheck size={12} />
                          )}
                          <span>Confirm as True</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
