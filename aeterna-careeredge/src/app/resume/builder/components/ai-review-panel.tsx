// src/app/resume/builder/components/ai-review-panel.tsx
// Comprehensive AI Review, Priority Fixes & Side-by-Side Improvement Panel (Part 1.4)
// Original vs Improved, Accept/Edit/Reject, Accept All Safe, and Missing Information prompts.

import React, { useState } from "react";
import type {
  FullResumeAnalysisReport,
  SectionSuggestion,
} from "@/lib/resume/types";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Edit3,
  RotateCw,
  Tag,
  HelpCircle,
  Loader2,
} from "lucide-react";

interface AiReviewPanelProps {
  report: FullResumeAnalysisReport | null;
  analyzingFull: boolean;
  onAnalyzeFull: () => void;
  onImproveSection: (sectionId: string) => Promise<void>;
  onAcceptSuggestion: (sectionId: string, suggestion: SectionSuggestion) => void;
  onAcceptAllSafe: () => void;
  onRejectSuggestion: (sectionId: string, suggestionId: string) => void;
  onRegenerateSuggestion: (sectionId: string, suggestion: SectionSuggestion) => Promise<void>;
  onScrollToSection?: (sectionId: string) => void;
  focusSectionId?: string | null;
  onClearFocusSection?: () => void;
}

export function AiReviewPanel({
  report,
  analyzingFull,
  onAnalyzeFull,
  onImproveSection,
  onAcceptSuggestion,
  onAcceptAllSafe,
  onRejectSuggestion,
  onRegenerateSuggestion,
  onScrollToSection,
  focusSectionId,
  onClearFocusSection,
}: AiReviewPanelProps) {
  const [improvingSectionId, setImprovingSectionId] = useState<string | null>(null);
  const [regeneratingSugId, setRegeneratingSugId] = useState<string | null>(null);
  const [editingSug, setEditingSug] = useState<{
    sectionId: string;
    suggestion: SectionSuggestion;
    editedText: string;
  } | null>(null);

  if (!report) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8E8EA] text-[#7A0F1F] border border-[#E8D2CE]">
          <Sparkles size={24} className="text-[#7A0F1F]" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold text-slate-900">
            Full-Resume AI Intelligence &amp; Audit
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Run an in-depth, multi-domain evaluation across all sections. Detect weak action verbs, missing metrics, and ATS formatting gaps.
          </p>
        </div>
        <button
          type="button"
          disabled={analyzingFull}
          onClick={onAnalyzeFull}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7A0F1F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#650B19] disabled:opacity-50 transition shadow-xs"
        >
          {analyzingFull ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          <span>{analyzingFull ? "Analyzing Entire Resume…" : "Analyze and Improve My Full Resume"}</span>
        </button>
      </div>
    );
  }

  // Count total safe suggestions
  let totalSafeCount = 0;
  report.sectionAnalyses.forEach((sec) => {
    sec.suggestions.forEach((sug) => {
      if (!sug.needsStudentConfirmation) totalSafeCount++;
    });
  });

  const focusedSection = focusSectionId
    ? report.sectionAnalyses.find((s) => s.sectionId === focusSectionId)
    : null;

  const sectionsToRender = focusedSection
    ? [focusedSection]
    : report.sectionAnalyses;

  return (
    <div className="space-y-6 text-xs">
      {/* Focused Section Context Header */}
      {focusedSection && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#7A0F1F]" />
            <span className="text-xs font-bold text-blue-950">
              Section Audit: {focusedSection.sectionTitle}
            </span>
          </div>
          {onClearFocusSection && (
            <button
              type="button"
              onClick={onClearFocusSection}
              className="text-[11px] font-bold text-[#7A0F1F] hover:underline"
            >
              View Full Resume Audit →
            </button>
          )}
        </div>
      )}

      {/* ── 1. Overall Score & Top Priority Fixes (Shown only when viewing full resume) ── */}
      {!focusedSection && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                CareerEdge AI Readiness Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-[#7A0F1F]">
                  {report.overallScore}/100
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Grounded &amp; Fact-Checked
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalSafeCount > 0 && (
                <button
                  type="button"
                  onClick={onAcceptAllSafe}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
                >
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span>Accept All Safe ({totalSafeCount})</span>
                </button>
              )}

              <button
                type="button"
                disabled={analyzingFull}
                onClick={onAnalyzeFull}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {analyzingFull ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
                <span>Re-analyze</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {report.scoreExplanation}
          </p>

          {/* Top 5 Priority Fixes */}
          {report.topPriorityFixes.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Top Priority High-Impact Fixes:
              </span>
              <div className="space-y-2">
                {report.topPriorityFixes.map((fix) => {
                  const impactBadge = {
                    high: "bg-rose-100 text-rose-800 border-rose-200",
                    medium: "bg-amber-100 text-amber-800 border-amber-200",
                    low: "bg-blue-100 text-blue-800 border-blue-200",
                  }[fix.impact];

                  return (
                    <div
                      key={fix.id}
                      onClick={() => onScrollToSection && onScrollToSection(fix.sectionId)}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition"
                    >
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border shrink-0 mt-0.5 ${impactBadge}`}>
                        {fix.impact.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{fix.title}</div>
                        <div className="text-[11px] text-slate-500 leading-snug">{fix.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2. Section-by-Section Review Cards ─────────────────────────── */}
      <div className="space-y-4">
        {sectionsToRender.map((sec) => (
          <div
            key={sec.sectionId}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {sec.sectionTitle}
                </span>
              </div>

              <button
                type="button"
                disabled={improvingSectionId === sec.sectionId}
                onClick={async () => {
                  setImprovingSectionId(sec.sectionId);
                  try {
                    await onImproveSection(sec.sectionId);
                  } finally {
                    setImprovingSectionId(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#7A0F1F] hover:bg-blue-100 transition disabled:opacity-50"
              >
                {improvingSectionId === sec.sectionId ? (
                  <Loader2 size={12} className="animate-spin text-[#7A0F1F]" />
                ) : (
                  <Sparkles size={12} className="text-[#7A0F1F]" />
                )}
                <span>Improve Section</span>
              </button>
            </div>

            {/* Strengths & Issues */}
            {sec.issues.length > 0 && (
              <div className="space-y-1">
                {sec.issues.map((iss) => (
                  <div key={iss.id} className="flex items-start gap-1.5 text-[11px] text-amber-900">
                    <AlertTriangle size={12} className="shrink-0 text-amber-600 mt-0.5" />
                    <span>{iss.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Missing Information Prompts */}
            {sec.missingInformation.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[10px] uppercase">
                  <HelpCircle size={12} />
                  <span>Missing Information (Add if True):</span>
                </div>
                {sec.missingInformation.map((q, qIdx) => (
                  <p key={qIdx} className="text-[11px] text-blue-800 leading-snug">
                    • {q}
                  </p>
                ))}
              </div>
            )}

            {/* Suggestions Side-by-Side Review */}
            {sec.suggestions.length > 0 && (
              <div className="space-y-3 pt-1">
                <span className="font-bold text-[#7A0F1F] text-[11px]">
                  Actionable AI Improvements ({sec.suggestions.length}):
                </span>

                <div className="space-y-3">
                  {sec.suggestions.map((sug) => {
                    const isRegenerating = regeneratingSugId === sug.id;

                    return (
                      <div
                        key={sug.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2.5"
                      >
                        {/* Original vs Improved */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Original */}
                          <div className="rounded-lg bg-white p-2.5 space-y-1 border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Original Text
                            </span>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {sug.original}
                            </p>
                          </div>

                          {/* Improved */}
                          <div className="rounded-lg bg-emerald-50/80 p-2.5 space-y-1 border border-emerald-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                                Recommended Rewrite
                              </span>
                              {sug.needsStudentConfirmation && (
                                <span className="rounded bg-amber-200/80 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                                  Confirm Details
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                              {sug.improved}
                            </p>
                          </div>
                        </div>

                        {/* Rationale & Source */}
                        <div className="text-[11px] text-slate-600 space-y-0.5 leading-snug">
                          <div>
                            <strong className="text-slate-900">Recruiter Impact:</strong> {sug.reason}
                          </div>
                          {sug.keywordsUsed.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <Tag size={11} className="text-[#7A0F1F] shrink-0" />
                              <span className="text-[10px] text-slate-600">
                                Keywords: {sug.keywordsUsed.join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onAcceptSuggestion(sec.sectionId, sug)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition"
                            >
                              <Check size={12} />
                              <span>Accept</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingSug({
                                  sectionId: sec.sectionId,
                                  suggestion: sug,
                                  editedText: sug.improved,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 transition"
                            >
                              <Edit3 size={12} />
                              <span>Edit &amp; Accept</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRejectSuggestion(sec.sectionId, sug.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-700 transition"
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isRegenerating}
                            onClick={async () => {
                              setRegeneratingSugId(sug.id);
                              try {
                                await onRegenerateSuggestion(sec.sectionId, sug);
                              } finally {
                                setRegeneratingSugId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7A0F1F] hover:underline disabled:opacity-50"
                          >
                            <RotateCw size={11} className={isRegenerating ? "animate-spin" : ""} />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Edit Then Accept Modal ────────────────────────────────────── */}
      {editingSug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 text-sm">
                Edit Suggestion Before Accepting
              </span>
              <button
                type="button"
                onClick={() => setEditingSug(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={4}
              value={editingSug.editedText}
              onChange={(e) =>
                setEditingSug({ ...editingSug, editedText: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSug(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onAcceptSuggestion(editingSug.sectionId, {
                    ...editingSug.suggestion,
                    improved: editingSug.editedText,
                  });
                  setEditingSug(null);
                }}
                className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
              >
                Accept Edited Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
