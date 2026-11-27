"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/interview/ui/empty-state";
import { PageSection } from "@/components/interview/ui/page-section";
import { SkeletonList } from "@/components/interview/ui/skeleton-list";
import { StatusBadge } from "@/components/interview/ui/status-badge";
import { Toast } from "@/components/interview/ui/toast";

interface QuestionItem {
  id: string;
  stage: string;
  difficulty: string;
  topic: string;
  questionText: string;
  evaluatorFocus: string;
  responseFramework: string;
  commonMistakes: string[];
  followUpQuestions: string[];
  preparationApproach: string;
}

interface ProofItem {
  id: string;
  sourceType: string;
  title: string;
  summary: string;
}

interface StarEntry {
  id: string;
  questionText: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  evidenceIds?: string[];
  feedback?: {
    suggestions?: string[];
    attachedEvidenceCount?: number;
  };
  score: number | null;
}

export function StarPracticePanel({ kitId }: { kitId: string }) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [proofBank, setProofBank] = useState<ProofItem[]>([]);
  const [history, setHistory] = useState<StarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [selectedProofIds, setSelectedProofIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);

  const builderRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/questions`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load question bank");
    const data = await res.json();
    setQuestions(data.questions || []);
    setProofBank(data.proofBank || []);
    setHistory(data.starHistory || []);
    if (data.questions?.length) {
      setSelectedQuestion((curr) => curr || data.questions[0].questionText);
    }
  }, [kitId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/questions`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load question bank");
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setLoadError(null);
        setQuestions(data.questions || []);
        setProofBank(data.proofBank || []);
        setHistory(data.starHistory || []);
        if (data.questions?.length) {
          setSelectedQuestion((curr) => curr || data.questions[0].questionText);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load Question Bank");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kitId]);

  const liveCompleteness = useMemo(() => {
    let score = 0;
    if (situation.trim().length >= 25) score += 20;
    else if (situation.trim().length > 0) score += 10;
    if (task.trim().length >= 20) score += 20;
    else if (task.trim().length > 0) score += 10;
    if (action.trim().length >= 40) score += 25;
    else if (action.trim().length > 0) score += 10;
    if (result.trim().length >= 20) score += 20;
    else if (result.trim().length > 0) score += 10;
    if (selectedProofIds.length > 0) score += 15;
    return Math.min(100, score);
  }, [situation, task, action, result, selectedProofIds.length]);

  const handleSaveStar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (
      !selectedQuestion.trim() ||
      !situation.trim() ||
      !task.trim() ||
      !action.trim() ||
      !result.trim()
    ) {
      setMsg({
        type: "err",
        text: "Please complete the Question Prompt, Situation, Task, Action, and Result fields.",
      });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/questions/star`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: selectedQuestion.trim(),
          situation: situation.trim(),
          task: task.trim(),
          action: action.trim(),
          result: result.trim(),
          evidenceIds: selectedProofIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save STAR response");
      setSituation("");
      setTask("");
      setAction("");
      setResult("");
      setSelectedProofIds([]);
      setHistoryOpen(true);
      setMsg({
        type: "ok",
        text: `Saved STAR practice (${data.entry?.score ?? 100}% completeness check).`,
      });
      await load();
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const visibleQuestions = questions.filter((q) => {
    if (stageFilter !== "ALL" && q.stage !== stageFilter) return false;
    if (search.trim()) {
      const hay = `${q.questionText} ${q.topic} ${q.evaluatorFocus}`.toLowerCase();
      if (!hay.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  });

  const selectedProofItems = proofBank.filter((p) => selectedProofIds.includes(p.id));

  return (
    <PageSection
      id="questions-star-heading"
      title="Questions & STAR Story Builder"
      summary="Pick a domain question on the left, then structure your answer with Situation, Task, Action, Result, and real proof."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Question List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#765F5D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                aria-label="Search question bank"
                className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] pl-9 pr-3 text-sm bg-white"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              aria-label="Filter questions by stage"
              className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
            >
              <option value="ALL">All Stages ({questions.length})</option>
              <option value="TECHNICAL">Technical</option>
              <option value="DOMAIN_KNOWLEDGE">Domain Knowledge</option>
              <option value="BEHAVIORAL">Behavioral</option>
              <option value="SITUATIONAL">Situational</option>
              <option value="HR">HR</option>
              <option value="ROLE_SPECIFIC">Role-Specific</option>
              <option value="SCENARIO">Scenario</option>
            </select>
          </div>

          {loading ? (
            <SkeletonList count={3} />
          ) : loadError ? (
            <Toast type="err" message={loadError} />
          ) : visibleQuestions.length === 0 ? (
            <EmptyState
              title="No matching questions"
              description="No questions match your current stage filter or keyword search."
              nextStep="Reset filters to view all domain questions."
            />
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {visibleQuestions.map((q) => {
                const isSelected = selectedQuestion === q.questionText;
                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-4 space-y-2 transition-colors ${
                      isSelected
                        ? "border-[#7A0F1F] bg-[#FFF8F0]"
                        : "border-[#EBDDD1] bg-white hover:border-[#7A0F1F]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge tone="info" label={`${q.stage} • ${q.difficulty}`} />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestion(q.questionText);
                          builderRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#D8C5B8] bg-white hover:border-[#7A0F1F] text-xs font-bold text-[#7A0F1F]"
                      >
                        Practice STAR
                      </button>
                    </div>
                    <p className="text-sm font-bold text-[#2B1B1B]">{q.questionText}</p>
                    <p className="text-xs text-[#59413F]">
                      <strong>Focus:</strong> {q.evaluatorFocus}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: STAR Builder */}
        <form
          ref={builderRef}
          noValidate
          onSubmit={handleSaveStar}
          className="lg:col-span-7 rounded-2xl border border-[#EBDDD1] bg-[#FFF8F0]/60 p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-heading text-base font-bold text-[#2B1B1B]">
                STAR Builder &amp; Proof Bank
              </h4>
              <p className="text-xs text-[#59413F]">
                Practice feedback checks completeness only — not an official score.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#7A0F1F]">
                Completeness: {liveCompleteness}%
              </span>
              <div className="w-28 h-2 rounded-full bg-white border border-[#EBDDD1] overflow-hidden mt-1">
                <div
                  className="h-full bg-[#7A0F1F] transition-all duration-200 motion-reduce:transition-none"
                  style={{ width: `${liveCompleteness}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="star-prompt" className="block text-sm font-bold text-[#2B1B1B] mb-1">
              Question Prompt
            </label>
            <input
              id="star-prompt"
              type="text"
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              aria-label="STAR Question Prompt"
              placeholder="Select a question or type your own..."
              className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="star-s" className="block text-sm font-bold text-[#2B1B1B]">
                Situation
              </label>
              <p className="text-xs text-[#59413F] mb-1">
                Example: Team size, clinical setting, or project deadline.
              </p>
              <textarea
                id="star-s"
                rows={3}
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Context & stakes..."
                aria-label="STAR Situation"
                className="w-full rounded-xl border border-[#D8C5B8] bg-white p-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="star-t" className="block text-sm font-bold text-[#2B1B1B]">
                Task
              </label>
              <p className="text-xs text-[#59413F] mb-1">
                Example: What you specifically owned or needed to solve.
              </p>
              <textarea
                id="star-t"
                rows={3}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Your specific responsibility..."
                aria-label="STAR Task"
                className="w-full rounded-xl border border-[#D8C5B8] bg-white p-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="star-a" className="block text-sm font-bold text-[#2B1B1B]">
                Action
              </label>
              <p className="text-xs text-[#59413F] mb-1">
                Example: Exact steps, tools, or protocols you used.
              </p>
              <textarea
                id="star-a"
                rows={3}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Exact steps YOU took..."
                aria-label="STAR Action"
                className="w-full rounded-xl border border-[#D8C5B8] bg-white p-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="star-r" className="block text-sm font-bold text-[#2B1B1B]">
                Result
              </label>
              <p className="text-xs text-[#59413F] mb-1">
                Example: Measurable change, lesson learned, or verified outcome.
              </p>
              <textarea
                id="star-r"
                rows={3}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Measurable outcome or learning..."
                aria-label="STAR Result"
                className="w-full rounded-xl border border-[#D8C5B8] bg-white p-2.5 text-sm"
              />
            </div>
          </div>

          {/* Real Proof Bank Attachment */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#2B1B1B] inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>Attach Verified Proof Bank Evidence ({proofBank.length} available)</span>
            </p>
            {proofBank.length === 0 ? (
              <p className="text-xs text-[#59413F] bg-white rounded-xl px-3 py-2 border border-[#EBDDD1]">
                No Career Passport projects or Evidence Vault records yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {proofBank.slice(0, 12).map((p) => {
                  const active = selectedProofIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSelectedProofIds((curr) =>
                          curr.includes(p.id) ? curr.filter((id) => id !== p.id) : [...curr, p.id]
                        )
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                        active
                          ? "bg-[#7A0F1F] text-white border-[#7A0F1F]"
                          : "bg-white text-[#2B1B1B] border-[#D8C5B8] hover:border-[#7A0F1F]"
                      }`}
                    >
                      {p.sourceType}: {p.title}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedProofItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#59413F]">Attached:</span>
                {selectedProofItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-900"
                  >
                    <span>{item.title}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() =>
                        setSelectedProofIds((curr) => curr.filter((id) => id !== item.id))
                      }
                      className="hover:text-rose-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {msg && <Toast type={msg.type} message={msg.text} onDismiss={() => setMsg(null)} />}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-sm font-bold"
            >
              {saving ? "Saving..." : "Save STAR Practice"}
            </button>
          </div>

          {/* Collapsible Saved STAR History */}
          {history.length > 0 && (
            <div className="pt-3 border-t border-[#EBDDD1] space-y-2">
              <button
                type="button"
                aria-expanded={historyOpen}
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full min-h-[44px] flex items-center justify-between text-sm font-bold text-[#2B1B1B]"
              >
                <span>Saved STAR History ({history.length})</span>
                {historyOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {historyOpen && (
                <div className="space-y-2">
                  {history.slice(0, 5).map((h) => (
                    <div
                      key={h.id}
                      className="rounded-xl bg-white border border-[#EBDDD1] p-3 text-sm space-y-1"
                    >
                      <p className="font-bold text-[#2B1B1B] inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{h.questionText}</span>
                      </p>
                      <p className="text-xs text-[#59413F]">
                        Completeness check: {h.score ?? "N/A"}% • Attached evidence:{" "}
                        {h.feedback?.attachedEvidenceCount ?? h.evidenceIds?.length ?? 0}
                      </p>
                      {h.feedback?.suggestions && h.feedback.suggestions.length > 0 && (
                        <p className="text-xs text-[#7A0F1F]">
                          Suggestions: {h.feedback.suggestions.join(" ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </PageSection>
  );
}
