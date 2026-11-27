"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LearningResourceEntry } from "@/lib/interview/resources/types";
import type {
  RoadmapExerciseItem,
  RoadmapTopicItem,
  TopicLookupEntry,
} from "@/lib/interview/roadmap-graph-utils";

interface RoadmapTopicDetailProps {
  entry: TopicLookupEntry | null;
  lookup: Map<string, TopicLookupEntry>;
  phaseExercises: RoadmapExerciseItem[];
  resources: LearningResourceEntry[];
  nextTopic: RoadmapTopicItem | null;
  isStarterPathway: boolean;
  busyId: string | null;
  panelFeedback: { type: "ok" | "err"; text: string } | null;
  focusSequence: number;
  noteDraft: string;
  onChangeNoteDraft: (val: string) => void;
  onSelectTopic: (topicId: string, opts?: { focusDetail?: boolean }) => void;
  onUpdateTopic: (
    topicId: string,
    patch: { status?: string; bookmarked?: boolean; notes?: string | null },
    options?: { feedbackText?: string; focusLearning?: boolean }
  ) => Promise<void>;
  onSubmitExercise: (
    exerciseId: string,
    payload: { notes: string; artifactUrl?: string | null }
  ) => Promise<boolean>;
  onCloseMobileDrawer?: () => void;
}

const ACCESS_LABELS: Record<string, string> = {
  COMPLETELY_FREE: "Completely Free",
  FREE_WITH_PAID_CERT: "Free Content • Paid Cert",
  FREEMIUM: "Freemium",
  FREE_ACCOUNT_REQUIRED: "Free Account Required",
  PAID: "Paid",
  UNVERIFIED: "Access Unverified",
};

export function RoadmapTopicDetail({
  entry,
  lookup,
  phaseExercises,
  resources,
  nextTopic,
  isStarterPathway,
  busyId,
  panelFeedback,
  focusSequence,
  noteDraft,
  onChangeNoteDraft,
  onSelectTopic,
  onUpdateTopic,
  onSubmitExercise,
  onCloseMobileDrawer,
}: RoadmapTopicDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const learningSectionRef = useRef<HTMLDivElement>(null);

  const [exerciseDrafts, setExerciseDrafts] = useState<
    Record<string, { notes: string; artifactUrl: string }>
  >({});

  // Scroll & move accessible keyboard focus into detail panel whenever explicitly triggered
  useEffect(() => {
    if (focusSequence <= 0 || !entry) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
    });
    headingRef.current?.focus({ preventScroll: true });
  }, [focusSequence, entry]);

  if (!entry) {
    return (
      <div
        ref={panelRef}
        className="bg-white rounded-2xl border border-[#E6D6CE] p-5 text-xs text-[#59413F] shadow-sm space-y-2"
      >
        <p className="font-heading text-sm font-bold text-[#2B1B1B]">
          Select a Topic on the Roadmap
        </p>
        <p>
          Click any topic node in the interactive graph or phase path to inspect its prerequisites,
          learning objectives, exercises, resources, and update your study progress.
        </p>
      </div>
    );
  }

  const { topic, phase, isLocked, derivedState, allPrerequisites, unmetPrerequisites } = entry;
  const isBusy = busyId === topic.id;
  const isInProgress = topic.status === "IN_PROGRESS" || topic.status === "NEEDS_REVISION";
  const isCompleted = topic.status === "COMPLETED";

  // Match exercises relevant to this specific topic first, else phase-level exercises
  const topicExercises = phaseExercises.filter(
    (ex) => !ex.topicId || ex.topicId === topic.id
  );

  // Match resources from real catalogue data (strictly NO fabricated links)
  const slugMatchedResources = resources.filter((r) =>
    r.topicSlugs.includes(topic.slug)
  );
  const topicWords = `${topic.title} ${topic.subtopics.join(" ")}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  const keywordMatchedResources =
    slugMatchedResources.length > 0
      ? slugMatchedResources
      : resources.filter((r) => {
          const hay = `${r.title} ${r.description} ${r.subtopics.join(" ")}`.toLowerCase();
          return topicWords.some((w) => hay.includes(w));
        });
  const displayResources =
    keywordMatchedResources.length > 0 ? keywordMatchedResources.slice(0, 4) : resources.slice(0, 2);

  const handleStartOrContinue = async () => {
    if (isLocked && !isCompleted) return;
    if (isInProgress) {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      learningSectionRef.current?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "nearest",
      });
      headingRef.current?.focus({ preventScroll: true });
      return;
    }

    await onUpdateTopic(
      topic.id,
      { status: "IN_PROGRESS" },
      { feedbackText: "Topic started — learning workspace active below.", focusLearning: true }
    );
  };

  return (
    <div
      ref={panelRef}
      data-testid="roadmap-topic-detail"
      className="bg-white rounded-2xl border-2 border-[#E6D6CE] p-4 sm:p-5 shadow-sm space-y-4"
    >
      {/* Top Meta & Bookmark */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-[#7A0F1F] text-[#F2B63D]">
              Phase {phase.orderIndex}
            </span>
            {isStarterPathway && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFF0C7] text-[#4C0915]">
                Starter Pathway
              </span>
            )}
            <span className="text-[#7A0F1F]">
              {topic.priority} • {topic.difficulty}
            </span>
            <span className="text-[#765F5D] inline-flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              ~{topic.estimatedMinutes}m
            </span>
          </div>

          <h4
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-base sm:text-lg font-bold text-[#2B1B1B] mt-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] rounded"
          >
            {topic.title}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              void onUpdateTopic(
                topic.id,
                { bookmarked: !topic.bookmarked },
                { feedbackText: topic.bookmarked ? "Bookmark removed" : "Topic bookmarked" }
              )
            }
            aria-pressed={topic.bookmarked}
            className={`min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors ${
              topic.bookmarked
                ? "bg-[#FFF0C7] border-[#F2B63D] text-[#4C0915]"
                : "bg-white border-[#D8C5B8] text-[#59413F] hover:border-[#7A0F1F]"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${topic.bookmarked ? "fill-[#F2B63D] text-[#7A0F1F]" : ""}`} />
            <span>{topic.bookmarked ? "Bookmarked" : "Bookmark"}</span>
          </button>
          {onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="Close topic details"
              className="lg:hidden min-h-[44px] px-3 py-1.5 rounded-xl border border-[#D8C5B8] bg-white text-xs font-bold text-[#2B1B1B]"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Status Pill + Locked Prerequisites Explanation */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid="topic-detail-status"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
            derivedState === "COMPLETED"
              ? "bg-emerald-100 text-emerald-900"
              : derivedState === "IN_PROGRESS"
              ? "bg-[#7A0F1F] text-white"
              : derivedState === "LOCKED"
              ? "bg-[#F8EFE7] text-[#59413F] border border-[#CBB9AE]"
              : derivedState === "NEEDS_REVISION"
              ? "bg-amber-100 text-amber-900"
              : "bg-[#FFF0C7] text-[#4C0915]"
          }`}
        >
          {derivedState === "COMPLETED" && <CheckCircle2 className="w-3.5 h-3.5" />}
          {derivedState === "LOCKED" && <Lock className="w-3.5 h-3.5" />}
          {derivedState === "IN_PROGRESS" && <Play className="w-3.5 h-3.5" />}
          <span>Status: {derivedState}</span>
        </span>
        {topic.completedAt && (
          <span className="text-[11px] text-[#765F5D]">
            Completed {new Date(topic.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {isLocked && !isCompleted && (
        <div
          role="note"
          className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 space-y-2"
        >
          <p className="font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 shrink-0 text-amber-800" />
            <span>Prerequisites Required Before Starting or Completing</span>
          </p>
          <p className="text-[11px] text-amber-900">
            Complete the following prerequisite topic{unmetPrerequisites.length > 1 ? "s" : ""} first to unlock this node:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unmetPrerequisites.map((pre) => (
              <button
                key={pre.id}
                type="button"
                onClick={() => onSelectTopic(pre.id, { focusDetail: true })}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-[11px] font-semibold text-[#7A0F1F] hover:bg-[#FFF0C7] inline-flex items-center gap-1"
              >
                <span>Go to: {pre.title}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons: single primary filled maroon CTA progressing Start -> Continue -> Mark Complete */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0DEDA]">
        <button
          type="button"
          disabled={isBusy || (isLocked && !isCompleted)}
          onClick={() => void handleStartOrContinue()}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
            isLocked && !isCompleted
              ? "bg-[#EFE2D5] text-[#765F5D] cursor-not-allowed"
              : !isInProgress && !isCompleted
              ? "bg-[#7A0F1F] hover:bg-[#4C0915] text-white"
              : "border border-[#7A0F1F] bg-white hover:bg-[#FFF8F0] text-[#7A0F1F]"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>
            {isBusy
              ? "Saving..."
              : isInProgress
              ? "Continue Topic"
              : isCompleted
              ? "Review Topic"
              : "Start Topic"}
          </span>
        </button>

        <button
          type="button"
          disabled={isBusy || isLocked}
          onClick={() =>
            void onUpdateTopic(
              topic.id,
              { status: "COMPLETED" },
              { feedbackText: "Marked completed! Unlocked dependent topics updated." }
            )
          }
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
            isLocked
              ? "bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed"
              : isInProgress
              ? "bg-[#7A0F1F] hover:bg-[#4C0915] text-white"
              : "border border-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-900"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Mark Complete</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() =>
            void onUpdateTopic(
              topic.id,
              { status: "NEEDS_REVISION" },
              { feedbackText: "Flagged for revision." }
            )
          }
          className="min-h-[40px] px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-semibold inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Needs Revision</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() =>
            void onUpdateTopic(
              topic.id,
              { status: isLocked ? "NOT_STARTED" : "AVAILABLE" },
              { feedbackText: "Topic progress reset." }
            )
          }
          className="min-h-[40px] px-3 py-2 rounded-xl border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-[#59413F] text-xs font-semibold"
        >
          Reset
        </button>
      </div>

      {panelFeedback && (
        <div
          role={panelFeedback.type === "err" ? "alert" : "status"}
          className={`rounded-xl px-3 py-2 text-xs font-medium flex items-start gap-2 ${
            panelFeedback.type === "err"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-emerald-50 text-emerald-900 border border-emerald-200"
          }`}
        >
          {panelFeedback.type === "err" && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{panelFeedback.text}</span>
        </div>
      )}

      {/* Topic Learning Experience Workspace */}
      <div
        ref={learningSectionRef}
        data-testid="topic-learning-content"
        className="space-y-4 pt-2 border-t border-[#F0DEDA]"
      >
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-[#2B1B1B]">Topic Overview</p>
          <p className="text-xs text-[#59413F] leading-relaxed">{topic.overview}</p>
          {topic.whyItMatters && (
            <p className="text-[11px] text-[#59413F] bg-[#FFF8F0] border border-[#F0DEDA] rounded-xl p-2.5">
              <strong className="text-[#7A0F1F]">Why it matters: </strong>
              {topic.whyItMatters}
            </p>
          )}
        </div>

        {/* Prerequisites */}
        {allPrerequisites.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#2B1B1B] mb-1.5">Prerequisites</p>
            <div className="flex flex-wrap gap-1.5">
              {allPrerequisites.map((pre) => {
                const preEntry = lookup.get(pre.id);
                const done = preEntry?.topic.status === "COMPLETED";
                return (
                  <button
                    key={pre.id}
                    type="button"
                    onClick={() => onSelectTopic(pre.id, { focusDetail: true })}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 ${
                      done
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-amber-50 border-amber-300 text-amber-950"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 shrink-0" />
                    )}
                    <span>{pre.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Subtopics */}
        {topic.subtopics.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#2B1B1B] mb-1.5">Key Concepts &amp; Subtopics</p>
            <div className="flex flex-wrap gap-1.5">
              {topic.subtopics.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full bg-[#FFF8F0] border border-[#F0DEDA] text-[11px] text-[#59413F]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Learning Outcomes */}
        {topic.learningOutcomes.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#2B1B1B] mb-1">Learning Objectives</p>
            <ul className="list-disc pl-4 text-xs text-[#59413F] space-y-1">
              {topic.learningOutcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Completion Criteria */}
        {topic.completionCriteria.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#2B1B1B] mb-1">Completion Checklist</p>
            <ul className="list-disc pl-4 text-xs text-[#59413F] space-y-1">
              {topic.completionCriteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Practice Prompts */}
        {topic.practicePrompts.length > 0 && (
          <div className="rounded-xl bg-[#FFF8F0] border border-[#F0DEDA] p-3 space-y-1.5">
            <p className="text-xs font-bold text-[#7A0F1F] inline-flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#F2B63D]" />
              <span>Practice Checkpoints</span>
            </p>
            <ul className="list-disc pl-4 text-xs text-[#2B1B1B] space-y-1">
              {topic.practicePrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Practical Exercises */}
        <div className="space-y-2 pt-2 border-t border-[#F0DEDA]">
          <p className="text-xs font-bold text-[#2B1B1B] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7A0F1F]" />
            <span>Practical Exercises ({topicExercises.length})</span>
          </p>
          {topicExercises.length === 0 ? (
            <p className="text-[11px] text-[#765F5D]">
              No standalone exercise attached to this topic yet. Use Study Notes below to record your summary.
            </p>
          ) : (
            topicExercises.map((ex) => {
              const draft = exerciseDrafts[ex.id] ?? {
                notes: ex.submissionNotes || "",
                artifactUrl: ex.artifactUrl || "",
              };
              const isSubmitted = ex.submissionStatus === "COMPLETED";
              return (
                <div
                  key={ex.id}
                  className="rounded-xl bg-[#FFF8F0]/80 border border-[#F0DEDA] p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#7A0F1F]">{ex.title}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSubmitted
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-white border border-[#E6D6CE] text-[#59413F]"
                      }`}
                    >
                      {isSubmitted ? "Submitted ✓" : ex.submissionStatus || "NOT_STARTED"}
                    </span>
                  </div>
                  <p className="text-xs text-[#2B1B1B]">{ex.objective}</p>
                  <p className="text-[11px] text-[#59413F]">
                    <strong>Expected Output:</strong> {ex.expectedOutput}
                  </p>
                  <textarea
                    rows={2}
                    value={draft.notes}
                    onChange={(e) =>
                      setExerciseDrafts((curr) => ({
                        ...curr,
                        [ex.id]: { ...draft, notes: e.target.value },
                      }))
                    }
                    placeholder="Write your solution summary or reflection..."
                    aria-label={`Exercise submission for ${ex.title}`}
                    className="w-full rounded-lg border border-[#D8C5B8] bg-white p-2 text-xs"
                  />
                  <input
                    type="url"
                    value={draft.artifactUrl}
                    onChange={(e) =>
                      setExerciseDrafts((curr) => ({
                        ...curr,
                        [ex.id]: { ...draft, artifactUrl: e.target.value },
                      }))
                    }
                    placeholder="Optional https:// artifact URL (GitHub/portfolio)..."
                    aria-label={`Artifact URL for ${ex.title}`}
                    className="w-full min-h-[36px] rounded-lg border border-[#D8C5B8] bg-white px-2.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={busyId === ex.id}
                    onClick={() =>
                      void onSubmitExercise(ex.id, {
                        notes: draft.notes,
                        artifactUrl: draft.artifactUrl.trim() || null,
                      })
                    }
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-xs font-semibold"
                  >
                    {busyId === ex.id ? "Submitting..." : isSubmitted ? "Update Exercise" : "Submit Exercise"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Recommended Learning Resources */}
        <div className="space-y-2 pt-2 border-t border-[#F0DEDA]">
          <p className="text-xs font-bold text-[#2B1B1B] inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#7A0F1F]" />
            <span>Recommended Resources ({displayResources.length})</span>
          </p>
          {displayResources.length === 0 ? (
            <p className="text-[11px] text-[#765F5D]">
              No curated learning resource matches this topic directly yet. Browse the full Learning
              Resource Catalogue below.
            </p>
          ) : (
            <div className="space-y-2">
              {displayResources.map((res) => (
                <div
                  key={res.id}
                  className="rounded-xl border border-[#F0DEDA] bg-[#FFF8F0]/60 p-2.5 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold text-[#2B1B1B] truncate">{res.title}</p>
                    <p className="text-[11px] text-[#765F5D]">{res.provider}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#E6D6CE] px-2 py-0.5 text-[10px] font-semibold text-[#59413F]">
                        {res.accessClassification === "COMPLETELY_FREE" ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 text-amber-700" />
                        )}
                        {ACCESS_LABELS[res.accessClassification] || "Access Unverified"}
                      </span>
                      {(res.verificationStatus === "PENDING_REVIEW" ||
                        res.verificationStatus === "INCONCLUSIVE") && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                          {res.verificationStatus === "INCONCLUSIVE"
                            ? "Link Check Inconclusive"
                            : "Link Check Pending"}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white border border-[#D8C5B8] hover:border-[#7A0F1F] text-[#7A0F1F] text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic Study Notes */}
        <div className="space-y-2 pt-2 border-t border-[#F0DEDA]">
          <label
            htmlFor={`topic-notes-${topic.id}`}
            className="block text-xs font-bold text-[#2B1B1B]"
          >
            Student Topic Notes
          </label>
          <textarea
            id={`topic-notes-${topic.id}`}
            rows={2}
            value={noteDraft}
            onChange={(e) => onChangeNoteDraft(e.target.value)}
            placeholder="Write your study notes, formulas, or revision takeaways..."
            className="w-full rounded-xl border border-[#D8C5B8] p-2.5 text-xs bg-white"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                void onUpdateTopic(
                  topic.id,
                  { notes: noteDraft },
                  { feedbackText: "Topic notes saved." }
                )
              }
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-xs font-bold"
            >
              {isBusy ? "Saving..." : "Save Topic Notes"}
            </button>

            {nextTopic && nextTopic.id !== topic.id && (
              <button
                type="button"
                onClick={() => onSelectTopic(nextTopic.id, { focusDetail: true })}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#7A0F1F] text-[#7A0F1F] hover:bg-[#FFF0C7] text-xs font-bold inline-flex items-center gap-1.5"
              >
                <span>Continue to Next Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
