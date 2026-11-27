"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Clock, MoreVertical } from "lucide-react";
import { EmptyState } from "@/components/interview/ui/empty-state";
import { PageSection } from "@/components/interview/ui/page-section";
import { SkeletonList } from "@/components/interview/ui/skeleton-list";
import { StatCard } from "@/components/interview/ui/stat-card";
import { StatusBadge } from "@/components/interview/ui/status-badge";
import { Toast } from "@/components/interview/ui/toast";

interface StudyTask {
  id: string;
  weekNumber: number;
  dayNumber: number | null;
  title: string;
  taskType: string;
  estimatedMinutes: number;
  status: string;
  scheduledDate: string | null;
}

interface SkillGaps {
  declaredSkills: string[];
  evidenceBackedSkills: string[];
  completedTopics: string[];
  inProgressTopics: string[];
  missingOrRecommendedTopics: Array<{ topicId: string; title: string; estimatedMinutes: number }>;
  note: string;
}

export function StudyPlanPanel({ kitId }: { kitId: string }) {
  const [gaps, setGaps] = useState<SkillGaps | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [syncedTitles, setSyncedTitles] = useState<Set<string>>(new Set());
  const [planWeeklyHours, setPlanWeeklyHours] = useState<number | null>(null);
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/study-plan`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load study plan");
    const data = await res.json();
    setGaps(data.skillGaps || null);
    setTasks(data.studyPlan?.tasks || []);
    setPlanWeeklyHours(data.studyPlan?.weeklyHours ?? null);
    setSyncedTitles(
      new Set(Array.isArray(data.syncedTaskTitles) ? data.syncedTaskTitles : [])
    );
  }, [kitId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/study-plan`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load study plan");
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setGaps(data.skillGaps || null);
        setTasks(data.studyPlan?.tasks || []);
        setPlanWeeklyHours(data.studyPlan?.weeklyHours ?? null);
        setSyncedTitles(
          new Set(Array.isArray(data.syncedTaskTitles) ? data.syncedTaskTitles : [])
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setMsg({
            type: "err",
            text: err instanceof Error ? err.message : "Could not load study plan",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kitId]);

  const handleGenerate = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/study-plan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyHours }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to generate study plan");
      await load();
      setMsg({ type: "ok", text: `Weekly study plan created (${weeklyHours} hrs/week).` });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Generation failed" });
    } finally {
      setBusy(false);
    }
  };

  const handleTaskAction = async (
    taskId: string,
    payload: { status?: string; scheduledDate?: string; syncToSprint?: boolean }
  ) => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    setOpenMenuTaskId(null);
    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/study-plan/tasks/${encodeURIComponent(
          taskId
        )}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update task");
      await load();
      if (payload.syncToSprint) {
        setMsg({
          type: "ok",
          text: data.alreadySynced ? "Already synced to active Sprint." : "Synced to active Sprint.",
        });
      } else if (payload.status === "COMPLETED") {
        setMsg({ type: "ok", text: "Study task marked completed." });
      } else if (payload.status === "DEFERRED") {
        setMsg({ type: "ok", text: "Study task deferred by 2 days." });
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setBusy(false);
    }
  };

  const tasksByWeek = useMemo(() => {
    const map = new Map<number, StudyTask[]>();
    for (const t of tasks) {
      const list = map.get(t.weekNumber) || [];
      list.push(t);
      map.set(t.weekNumber, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Skill Gap Summary */}
      <PageSection
        id="skill-gap-heading"
        title="Skill Gap Analysis"
        summary={gaps?.note || "Compares self-reported skills against verified project and Evidence Vault records."}
      >
        {loading ? (
          <SkeletonList count={2} />
        ) : gaps ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              label="Declared"
              value={gaps.declaredSkills.length}
              hint={gaps.declaredSkills.length ? gaps.declaredSkills.join(", ") : "None listed yet"}
              tone="neutral"
            />
            <StatCard
              label="Evidence-backed"
              value={gaps.evidenceBackedSkills.length}
              hint={
                gaps.evidenceBackedSkills.length
                  ? gaps.evidenceBackedSkills.join(", ")
                  : "Link projects or Evidence Vault items"
              }
              tone="success"
            />
            <StatCard
              label="Recommended"
              value={gaps.missingOrRecommendedTopics.length}
              hint={
                gaps.missingOrRecommendedTopics.length
                  ? gaps.missingOrRecommendedTopics.slice(0, 3).map((t) => t.title).join(", ")
                  : "Activate a roadmap to sequence topics"
              }
              tone="gold"
            />
          </div>
        ) : null}
      </PageSection>

      {/* Weekly Agenda */}
      <PageSection
        id="study-plan-heading"
        title={`Weekly Study Plan${planWeeklyHours !== null ? ` (${planWeeklyHours} hrs/wk)` : ""}`}
        summary="Tasks are scheduled inside your weekly hour budget and sync with CareerEdge Sprints."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              aria-label="Weekly study hours"
              className="min-h-[44px] rounded-xl border border-[#D8C5B8] px-3 text-sm bg-white"
            >
              <option value={3}>3 hrs / week</option>
              <option value={5}>5 hrs / week</option>
              <option value={10}>10 hrs / week</option>
              <option value={15}>15 hrs / week</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGenerate()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-sm font-bold"
            >
              {busy ? "Working..." : "Generate Plan"}
            </button>
          </div>
        }
      >
        {msg && <Toast type={msg.type} message={msg.text} onDismiss={() => setMsg(null)} />}

        {tasks.length === 0 ? (
          <EmptyState
            title="No study plan scheduled yet"
            description="Pick your weekly hours, then Generate plan to build a week-by-week agenda from your roadmap gaps."
          />
        ) : (
          <div className="space-y-5">
            {tasksByWeek.map(([weekNum, weekTasks]) => (
              <div key={weekNum} className="space-y-2.5">
                <h4 className="font-heading text-sm font-bold uppercase tracking-wide text-[#7A0F1F]">
                  Week {weekNum}
                </h4>
                <div className="divide-y divide-[#EBDDD1] rounded-2xl border border-[#EBDDD1] overflow-visible bg-white">
                  {weekTasks.map((t) => {
                    const isSynced = syncedTitles.has(t.title);
                    const menuOpen = openMenuTaskId === t.id;
                    return (
                      <div
                        key={t.id}
                        className="p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              tone={t.status === "COMPLETED" ? "completed" : "available"}
                              label={t.status}
                            />
                            <span className="text-xs text-[#59413F] inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              {t.estimatedMinutes}m
                            </span>
                            {t.scheduledDate && (
                              <span className="text-xs text-[#59413F] inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                {new Date(t.scheduledDate).toLocaleDateString()}
                              </span>
                            )}
                            {isSynced && <StatusBadge tone="completed" label="Synced to Sprint ✓" />}
                          </div>
                          <p className="text-sm font-bold text-[#2B1B1B]">{t.title}</p>
                        </div>

                        {/* Desktop Inline Actions */}
                        <div className="hidden md:flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={busy || t.status === "COMPLETED"}
                            onClick={() => void handleTaskAction(t.id, { status: "COMPLETED" })}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t.status === "COMPLETED" ? "Completed" : "Complete"}</span>
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              const next = new Date(t.scheduledDate || Date.now());
                              next.setDate(next.getDate() + 2);
                              void handleTaskAction(t.id, {
                                status: "DEFERRED",
                                scheduledDate: next.toISOString(),
                              });
                            }}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] disabled:opacity-50 text-xs font-semibold text-[#2B1B1B]"
                          >
                            Defer +2d
                          </button>
                          <button
                            type="button"
                            disabled={busy || isSynced}
                            onClick={() => void handleTaskAction(t.id, { syncToSprint: true })}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#7A0F1F]/40 bg-white hover:bg-[#FFF0C7] disabled:opacity-50 text-[#7A0F1F] text-xs font-bold"
                          >
                            {isSynced ? "Synced ✓" : "Sync to Sprint"}
                          </button>
                        </div>

                        {/* Mobile Overflow Menu */}
                        <div className="relative md:hidden shrink-0">
                          <button
                            type="button"
                            aria-expanded={menuOpen}
                            aria-label={`Actions for ${t.title}`}
                            onClick={() => setOpenMenuTaskId(menuOpen ? null : t.id)}
                            className="min-h-[44px] min-w-[44px] rounded-xl border border-[#D8C5B8] bg-white inline-flex items-center justify-center text-[#2B1B1B]"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpen && (
                            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[#EBDDD1] bg-white shadow-lg p-1.5 z-20 space-y-1">
                              <button
                                type="button"
                                disabled={busy || t.status === "COMPLETED"}
                                onClick={() => void handleTaskAction(t.id, { status: "COMPLETED" })}
                                className="w-full min-h-[44px] px-3 text-left rounded-lg text-sm font-semibold hover:bg-[#FFF8F0] disabled:opacity-50"
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  const next = new Date(t.scheduledDate || Date.now());
                                  next.setDate(next.getDate() + 2);
                                  void handleTaskAction(t.id, {
                                    status: "DEFERRED",
                                    scheduledDate: next.toISOString(),
                                  });
                                }}
                                className="w-full min-h-[44px] px-3 text-left rounded-lg text-sm font-semibold hover:bg-[#FFF8F0]"
                              >
                                Defer +2d
                              </button>
                              <button
                                type="button"
                                disabled={busy || isSynced}
                                onClick={() => void handleTaskAction(t.id, { syncToSprint: true })}
                                className="w-full min-h-[44px] px-3 text-left rounded-lg text-sm font-semibold text-[#7A0F1F] hover:bg-[#FFF0C7] disabled:opacity-50"
                              >
                                {isSynced ? "Synced ✓" : "Sync to Sprint"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </div>
  );
}
