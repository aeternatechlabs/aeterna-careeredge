"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Plus,
  Compass,
} from "lucide-react";
import type { SprintSummary } from "@/lib/sprints/service";

interface SprintsClientProps {
  studentName: string;
  initialSprint?: SprintSummary | null;
  initialRole?: string;
  initialProfession?: string;
}

const WEEKS = [
  { num: 1, title: "Week 1: Proof Bank Audit & Grounding", desc: "Upload missing artifacts and audit claim truthfulness" },
  { num: 2, title: "Week 2: Practical Competency Deepening", desc: "Build concrete projects, case reflections, and solve gaps" },
  { num: 3, title: "Week 3: Professional Identity Alignment", desc: "Deploy official framework resume and optimize LinkedIn profile" },
  { num: 4, title: "Week 4: Application & Interview Launch", desc: "Generate tailored application packs and run interview prep" },
];

export function SprintsClient({
  studentName,
  initialSprint,
  initialRole,
  initialProfession,
}: SprintsClientProps) {
  const [sprint, setSprint] = useState<SprintSummary | null>(initialSprint !== undefined ? initialSprint : null);
  const [loading, setLoading] = useState(initialSprint === undefined);
  const [showGenerateModal, setShowGenerateModal] = useState(Boolean(initialRole));
  const [targetRoleInput, setTargetRoleInput] = useState(initialRole || "Junior Software Engineer");
  const [targetProfessionInput, setTargetProfessionInput] = useState(initialProfession || "Technology & Software");
  const [generating, setGenerating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchSprint = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sprints", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSprint(data.sprint || null);
      }
    } catch (err) {
      console.error("Failed to load sprint:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSprint !== undefined) return;
    let ignore = false;
    fetch("/api/sprints", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore) {
          setSprint(data?.sprint || null);
        }
      })
      .catch((err) => console.error("Error loading sprint on mount:", err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [initialSprint]);

  const handleGenerateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoleInput.trim()) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/sprints", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetRoleInput.trim(),
          targetProfession: targetProfessionInput.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSprint(data.sprint);
        setShowGenerateModal(false);
      }
    } catch (err) {
      console.error("Failed to generate sprint:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    setTogglingId(taskId);
    try {
      const res = await fetch(`/api/sprints/tasks/${taskId}`, {
          credentials: "include", method: "PATCH" });
      if (res.ok) {
        await fetchSprint();
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/40 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                <Zap className="w-3.5 h-3.5" />
                Gap-to-Action Accountability Engine
              </span>
              <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                Structured 30-Day Roadmap
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              30-Day Employability Sprint
            </h1>
            <p className="text-sm text-gray-700 mt-1 max-w-3xl">
              Turn readiness gaps into concrete weekly action items. Every completed milestone is recorded in your verified Career Passport.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/role-fit-explorer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Compass className="w-4 h-4 text-[#7A0F1F]" />
              Role Fit Explorer
            </Link>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm transition"
            >
              <Plus className="w-4 h-4 text-[#F2B63D]" />
              {sprint ? "Switch Target Role" : "Start New Sprint"}
            </button>
          </div>
        </div>

        {/* Guidance Helper */}
        <HowItWorksPanel toolKey="gap-to-action-sprint" />

        {/* Active Sprint Overview Card */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 animate-pulse h-48" />
        ) : sprint ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#7A0F1F]/10 text-[#7A0F1F]">
                  Active Sprint
                </span>
                <h2 className="text-2xl font-black text-gray-900 mt-2">
                  Target: {sprint.targetRole}
                </h2>
                <p className="text-xs text-gray-700 mt-1 flex items-center gap-2">
                  <span>Domain: {sprint.targetProfession}</span>
                  &bull;
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Target Completion: {new Date(sprint.endDate).toLocaleDateString()}
                  </span>
                </p>
              </div>

              {/* Progress Summary Gauge */}
              <div className="bg-[#FFF8F0] border border-amber-200/80 rounded-2xl p-4 md:w-72 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-800">Sprint Progress</span>
                  <span className="text-[#7A0F1F]">{sprint.progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#7A0F1F] h-full rounded-full transition-all duration-500"
                    style={{ width: `${sprint.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-700">
                  <span>{sprint.completedTasksCount} of {sprint.totalTasksCount} tasks complete</span>
                  {sprint.completedTasksCount === sprint.totalTasksCount && (
                    <span className="text-emerald-800 font-bold">Sprint Finished!</span>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Weeks Grid */}
            <div className="space-y-6 pt-4 border-t border-gray-100">
              {WEEKS.map((w) => {
                const weekTasks = sprint.tasks.filter((t) => t.weekNumber === w.num);
                const weekCompleted = weekTasks.filter((t) => t.status === "COMPLETED").length;
                return (
                  <div
                    key={w.num}
                    className="bg-[#FFF8F0]/30 rounded-2xl border border-gray-200 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{w.title}</h3>
                        <p className="text-xs text-gray-700">{w.desc}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                        {weekCompleted} / {weekTasks.length} Completed
                      </span>
                    </div>

                    {/* Task items */}
                    <div className="space-y-2">
                      {weekTasks.map((task) => {
                        const isDone = task.status === "COMPLETED";
                        const isBusy = togglingId === task.id;
                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                              isDone
                                ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                                : "bg-white border-gray-200 text-gray-900"
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() => handleToggleTask(task.id)}
                                disabled={isBusy}
                                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                                  isDone
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-gray-300 hover:border-gray-500 bg-white"
                                }`}
                              >
                                {isDone && <CheckCircle2 className="w-4 h-4 fill-white text-emerald-600" />}
                              </button>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-bold ${
                                      isDone ? "line-through text-gray-500" : "text-gray-900"
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  {task.dayNumber && (
                                    <span className="text-[10px] font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                      Day {task.dayNumber}
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <p
                                    className={`text-xs mt-0.5 ${
                                      isDone ? "text-gray-700" : "text-gray-700"
                                    }`}
                                  >
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-[10px] uppercase font-semibold text-gray-700 shrink-0 self-center">
                              {task.linkedGapType.replace("_", " ")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
            <Layers className="w-12 h-12 text-[#7A0F1F] mx-auto opacity-70" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">No active sprint running</h2>
              <p className="text-sm text-gray-700 mt-1 max-w-md mx-auto">
                Generate a 30-day employability sprint tailored to your chosen profession and role to bridge missing skills with verified proof.
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] transition shadow-sm"
            >
              <Zap className="w-4 h-4 text-[#F2B63D]" />
              Start 30-Day Sprint Now
            </button>
          </div>
        )}

        {/* Generate / Switch Sprint Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Configure 30-Day Sprint</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleGenerateSprint} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Role Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Junior Legal Associate, Staff Nurse, Software Engineer"
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Professional Domain
                  </label>
                  <select
                    value={targetProfessionInput}
                    onChange={(e) => setTargetProfessionInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  >
                    <option value="Technology & Software">Technology & Software</option>
                    <option value="Healthcare & Nursing">Healthcare & Nursing</option>
                    <option value="Teaching & Education">Teaching & Education</option>
                    <option value="Commerce & Finance">Commerce & Finance</option>
                    <option value="Law & Legal">Law & Legal</option>
                    <option value="Design & UX">Design & UX</option>
                  </select>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                  This creates 12 concrete milestone tasks across Proof Bank auditing, competency deepening, identity polish, and verified applications.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm disabled:opacity-50"
                  >
                    {generating ? "Generating Plan..." : "Generate 30-Day Sprint"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </StudentLayout>
  );
}
