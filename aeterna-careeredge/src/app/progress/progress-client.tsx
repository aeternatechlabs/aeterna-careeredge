"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  Clock,
  CheckCircle2,
  Briefcase,
  FileText,
  ShieldCheck,
  Zap,
  Award,
  Layers,
} from "lucide-react";

interface ProgressEventItem {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  refId: string | null;
  metadata: string | null;
  createdAt: string;
}

interface ProgressClientProps {
  studentName: string;
}

export function ProgressClient({ studentName }: ProgressClientProps) {
  const [events, setEvents] = useState<ProgressEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/progress", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.events) setEvents(data.events);
      })
      .catch((err) => console.error("Error loading progress events:", err))
      .finally(() => setLoading(false));
  }, []);

  const getEventBadge = (type: string) => {
    switch (type) {
      case "JOB_APPLIED":
        return { label: "Job Applied", color: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: Briefcase };
      case "JOB_SAVED":
        return { label: "Job Saved", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Briefcase };
      case "RESUME_CREATED":
        return { label: "Resume Created", color: "bg-purple-50 text-purple-700 border-purple-200", icon: FileText };
      case "EVIDENCE_ADDED":
        return { label: "Evidence Added", color: "bg-amber-50 text-amber-800 border-amber-200", icon: ShieldCheck };
      case "SPRINT_TASK_COMPLETED":
        return { label: "Sprint Task", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Zap };
      case "READINESS_REPORT_GENERATED":
        return { label: "Readiness / Kit", color: "bg-rose-50 text-rose-700 border-rose-200", icon: Award };
      default:
        return { label: type.replace(/_/g, " "), color: "bg-gray-100 text-gray-700 border-gray-200", icon: CheckCircle2 };
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType === "ALL") return true;
    return ev.eventType === filterType;
  });

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/40 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                <Clock className="w-3.5 h-3.5" />
                Immutable Audit Trail
              </span>
              <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                Verified Event Ledger
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Your Career Progress Ledger
            </h1>
            <p className="text-sm text-gray-700 mt-1 max-w-2xl">
              An unforgeable timeline of your preparation milestones, evidence uploads, resume checks, and confirmed applications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/value"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Award className="w-4 h-4 text-[#7A0F1F]" />
              Value Dashboard
            </Link>
          </div>
        </div>

        {/* Guidance Helper */}
        <HowItWorksPanel toolKey="progress-ledger" />

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
          {["ALL", "JOB_APPLIED", "SPRINT_TASK_COMPLETED", "EVIDENCE_ADDED", "RESUME_CREATED", "READINESS_REPORT_GENERATED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterType === f
                  ? "bg-[#7A0F1F] text-white shadow-sm"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f === "ALL" ? "All Events" : f.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Timeline List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No events logged yet</h3>
            <p className="text-xs text-gray-700 max-w-md mx-auto">
              Your actions in CareerEdge—such as saving a job, completing a sprint task, or adding proof artifacts—will automatically record here.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-200/60 space-y-6 my-4">
            {filteredEvents.map((ev) => {
              const badge = getEventBadge(ev.eventType);
              const Icon = badge.icon;
              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white bg-[#7A0F1F] shadow-sm flex items-center justify-center" />

                  {/* Event Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-gray-700 font-medium">
                        {new Date(ev.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </StudentLayout>
  );
}
