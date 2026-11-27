"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Play, RotateCcw, Send } from "lucide-react";
import { PageSection } from "@/components/interview/ui/page-section";
import { SkeletonList } from "@/components/interview/ui/skeleton-list";
import { StatusBadge } from "@/components/interview/ui/status-badge";
import { Toast } from "@/components/interview/ui/toast";

interface MockTurn {
  id: string;
  turnOrder: number;
  questionText: string;
  userAnswer: string | null;
  aiFeedbackJson: string | null;
  score: number | null;
}

interface MockSession {
  id: string;
  roleTitle: string;
  interviewMode: string;
  difficulty: string;
  totalQuestions: number;
  status: string;
  overallScore: number | null;
  turns: MockTurn[];
}

export function MockInterviewPanel({ kitId }: { kitId: string }) {
  const [sessions, setSessions] = useState<MockSession[]>([]);
  const [activeSession, setActiveSession] = useState<MockSession | null>(null);
  const [viewOverride, setViewOverride] = useState<"SETUP" | "ACTIVE" | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("MIXED");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const res = await fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/mock-interview`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = (data.sessions || []) as MockSession[];
    setSessions(list);
    if (list.length > 0) {
      setActiveSession((curr) => curr ?? list[0]);
    }
  }, [kitId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/mock-interview`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list = (data.sessions || []) as MockSession[];
        setSessions(list);
        if (list.length > 0) {
          setActiveSession((curr) => curr ?? list[0]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kitId]);

  const handleStart = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/mock-interview`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewMode: mode, difficulty, totalQuestions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start session");
      setActiveSession(data.session);
      setViewOverride("ACTIVE");
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || busy) return;
    if (!answer.trim()) {
      setError("Please enter your interview response before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/mock-interview/${encodeURIComponent(
          activeSession.id
        )}/turn`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit answer");
      setAnswer("");
      const updatedTurns = activeSession.turns.map((t) =>
        t.id === data.evaluatedTurn.id ? data.evaluatedTurn : t
      );
      if (data.nextTurn) updatedTurns.push(data.nextTurn);
      setActiveSession({ ...data.session, turns: updatedTurns });
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate");
    } finally {
      setBusy(false);
    }
  };

  const pendingTurn = activeSession?.turns.find((t) => !t.userAnswer) ?? null;
  const screenState: "SETUP" | "LIVE" | "RESULTS" =
    viewOverride === "SETUP" || !activeSession
      ? "SETUP"
      : activeSession.status === "COMPLETED" || !pendingTurn
      ? "RESULTS"
      : "LIVE";

  return (
    <PageSection
      id="mock-interview-heading"
      title="AI Mock Interview • CareerEdge Practice Assessment"
      summary="Practice one question at a time. Feedback is CareerEdge Practice Assessment guidance, not an official hiring score."
      action={
        screenState !== "SETUP" ? (
          <button
            type="button"
            onClick={() => setViewOverride("SETUP")}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-sm font-semibold text-[#2B1B1B]"
          >
            New session setup
          </button>
        ) : undefined
      }
    >
      {error && <Toast type="err" message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <SkeletonList count={2} />
      ) : screenState === "SETUP" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="mock-mode" className="block text-sm font-bold text-[#2B1B1B] mb-1">
                Interview Mode
              </label>
              <select
                id="mock-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                aria-label="Mock interview mode"
                className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
              >
                <option value="MIXED">Mixed</option>
                <option value="TECHNICAL">Technical</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="SCENARIO">Scenario</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div>
              <label htmlFor="mock-diff" className="block text-sm font-bold text-[#2B1B1B] mb-1">
                Difficulty
              </label>
              <select
                id="mock-diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                aria-label="Mock interview difficulty"
                className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div>
              <label htmlFor="mock-len" className="block text-sm font-bold text-[#2B1B1B] mb-1">
                Session Length
              </label>
              <select
                id="mock-len"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                aria-label="Number of questions"
                className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleStart()}
            className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-[#F2B63D]" aria-hidden="true" />
            <span>{busy ? "Starting session..." : "Start session"}</span>
          </button>

          {sessions.length > 0 && (
            <div className="pt-4 border-t border-[#EBDDD1] space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#59413F]">
                Recent Practice Sessions
              </p>
              <div className="flex flex-wrap gap-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveSession(s);
                      setViewOverride("ACTIVE");
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D8C5B8] bg-[#FFF8F0] hover:border-[#7A0F1F] text-sm font-semibold text-[#2B1B1B]"
                  >
                    {s.interviewMode} ({s.status})
                    {s.overallScore !== null ? ` • ${s.overallScore}/100` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : screenState === "LIVE" && activeSession && pendingTurn ? (
        /* Focus Mode: One question, progress dots, one answer box */
        <div className="space-y-5 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-[#7A0F1F]">
              Question {pendingTurn.turnOrder} of {activeSession.totalQuestions}
            </span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: activeSession.totalQuestions }).map((_, i) => {
                const qNum = i + 1;
                const answered = activeSession.turns.some(
                  (t) => t.turnOrder === qNum && Boolean(t.userAnswer)
                );
                const current = qNum === pendingTurn.turnOrder;
                return (
                  <span
                    key={qNum}
                    className={`h-2.5 rounded-full transition-all ${
                      current
                        ? "w-6 bg-[#7A0F1F]"
                        : answered
                        ? "w-2.5 bg-emerald-600"
                        : "w-2.5 bg-[#EBDDD1]"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#EBDDD1] bg-[#FFF8F0]/70 p-4 sm:p-5">
            <p className="text-base font-bold text-[#2B1B1B] leading-relaxed">
              Q{pendingTurn.turnOrder}: {pendingTurn.questionText}
            </p>
          </div>

          <form noValidate onSubmit={handleSubmitTurn} className="space-y-3">
            <label htmlFor="mock-answer" className="block text-sm font-bold text-[#2B1B1B]">
              Your Answer
            </label>
            <textarea
              id="mock-answer"
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write a clear, structured response using a real example..."
              aria-label="Mock interview answer"
              className="w-full rounded-xl border border-[#D8C5B8] bg-white p-3 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{busy ? "Evaluating..." : "Submit Answer"}</span>
            </button>
          </form>
        </div>
      ) : (
        /* Results State */
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#F2B63D]/60 bg-[#FFF0C7]/45 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <StatusBadge
                tone="completed"
                label={`CareerEdge Practice Assessment: ${activeSession?.overallScore ?? 0}/100`}
              />
              <p className="text-sm font-semibold text-[#2B1B1B] mt-1.5">
                Session completed ({activeSession?.interviewMode} • {activeSession?.difficulty})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewOverride("SETUP")}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] text-white text-sm font-bold inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Practice again</span>
            </button>
          </div>

          <div className="space-y-3">
            {(activeSession?.turns || []).map((turn) => {
              let parsedEval: { strengths?: string[]; improvements?: string[] } | null = null;
              try {
                if (turn.aiFeedbackJson) parsedEval = JSON.parse(turn.aiFeedbackJson);
              } catch {}
              return (
                <div
                  key={turn.id}
                  className="rounded-2xl border border-[#EBDDD1] bg-[#FFF8F0]/55 p-4 space-y-2 text-sm"
                >
                  <p className="font-bold text-[#2B1B1B]">
                    Q{turn.turnOrder}: {turn.questionText}
                  </p>
                  {turn.userAnswer && (
                    <p className="text-[#59413F] bg-white rounded-xl p-3 border border-[#EBDDD1]">
                      <strong>Your response:</strong> {turn.userAnswer}
                    </p>
                  )}
                  {parsedEval && (
                    <div className="text-sm text-[#59413F] space-y-1">
                      <p className="font-bold text-[#7A0F1F]">
                        CareerEdge Practice Assessment • Turn Score: {turn.score}/100
                      </p>
                      {parsedEval.strengths && (
                        <p>
                          <strong>Strengths:</strong> {parsedEval.strengths.join(" ")}
                        </p>
                      )}
                      {parsedEval.improvements && (
                        <p>
                          <strong>Improvements:</strong> {parsedEval.improvements.join(" ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageSection>
  );
}
