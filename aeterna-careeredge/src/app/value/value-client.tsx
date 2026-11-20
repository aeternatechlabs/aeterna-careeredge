"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Award,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Briefcase,
  FileText,
  Zap,
} from "lucide-react";

interface ValueMetrics {
  evidenceItemsInVault: number;
  totalSkillsRecorded: number;
  verifiedSkills: number;
  truthScorePercent: number;
  resumesCreated: number;
  applicationPacksGenerated: number;
  applicationsTracked: number;
  applicationsSubmitted: number;
  interviewsProgressed: number;
  activeSprints: number;
  estimatedHoursSaved: number;
}

interface ValueClientProps {
  studentName: string;
}

export function ValueClient({ studentName }: ValueClientProps) {
  const [metrics, setMetrics] = useState<ValueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/value")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.metrics) setMetrics(data.metrics);
      })
      .catch((err) => console.error("Error loading value:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/40 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                <TrendingUp className="w-3.5 h-3.5" />
                Value-Proof & Employability Return
              </span>
              <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                Measurable Student ROI
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Your Value & Impact Dashboard
            </h1>
            <p className="text-sm text-gray-700 mt-1 max-w-2xl">
              See the concrete return on your preparation: hours saved, proof artifacts banked, and verified applications tracked.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/progress"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Clock className="w-4 h-4 text-[#7A0F1F]" />
              Progress Ledger
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-[#F2B63D]" />
              Manage Plan
            </Link>
          </div>
        </div>

        {/* Guidance Helper */}
        <HowItWorksPanel toolKey="value-roi" />

        {/* 4 Hero ROI Metric Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-200 p-6 animate-pulse h-32" />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Hours Saved */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Time Saved</span>
                <Clock className="w-4 h-4 text-[#7A0F1F]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900">
                  {metrics.estimatedHoursSaved}
                </span>
                <span className="text-xs font-semibold text-gray-700">hrs</span>
              </div>
              <p className="text-[11px] text-gray-700 leading-snug">
                Saved on resume drafting, formatting, and manual cover letters.
              </p>
            </div>

            {/* Card 2: Proof Bank Artifacts */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Proof Bank</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-700">
                  {metrics.evidenceItemsInVault}
                </span>
                <span className="text-xs font-semibold text-gray-700">items</span>
              </div>
              <p className="text-[11px] text-gray-700 leading-snug">
                Verified documents, repos, and certifications backing your claims.
              </p>
            </div>

            {/* Card 3: Truth Score */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Truth Score</span>
                <Award className="w-4 h-4 text-[#F2B63D]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#7A0F1F]">
                  {metrics.truthScorePercent}
                </span>
                <span className="text-xs font-semibold text-gray-700">%</span>
              </div>
              <p className="text-[11px] text-gray-700 leading-snug">
                Percentage of claims grounded in verified evidence. Zero hallucination.
              </p>
            </div>

            {/* Card 4: Applications Prepared */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Pipeline</span>
                <Briefcase className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-purple-700">
                  {metrics.applicationsTracked}
                </span>
                <span className="text-xs font-semibold text-gray-700">jobs</span>
              </div>
              <p className="text-[11px] text-gray-700 leading-snug">
                {metrics.applicationsSubmitted} submitted &bull; {metrics.interviewsProgressed} interviews progressed.
              </p>
            </div>
          </div>
        ) : null}

        {/* Detailed Value Pillars */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#7A0F1F] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Career Documents</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                You have generated {metrics.resumesCreated} profession-tailored resumes and {metrics.applicationPacksGenerated} complete 4-part application packs with custom cover notes and verified talking points.
              </p>
              <Link
                href="/resume"
                className="text-xs font-bold text-[#7A0F1F] hover:underline inline-flex items-center gap-1 pt-1"
              >
                Review Resumes &rarr;
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Verified Profile Integrity</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {metrics.evidenceItemsInVault} verified items link to {metrics.verifiedSkills} of your {metrics.totalSkillsRecorded} recorded skills, protecting you from embarrassing recruiter screening dropouts.
              </p>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-[#7A0F1F] hover:underline inline-flex items-center gap-1 pt-1"
              >
                View Dashboard &rarr;
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Accountability & Sprints</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                Active 30-day employability sprints ensure your missing skills are bridged into concrete artifacts and audited milestones before applications open.
              </p>
              <Link
                href="/sprints"
                className="text-xs font-bold text-[#7A0F1F] hover:underline inline-flex items-center gap-1 pt-1"
              >
                Open 30-Day Sprint &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Value Reassurance */}
        <div className="bg-[#FFF8F0] rounded-3xl border border-amber-200/80 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Every recommendation is grounded in authentic student facts
            </h4>
            <p className="text-xs text-gray-700 max-w-2xl">
              CareerEdge never fabricates false work experience, never inflates grades, and never makes speculative hiring guarantees. You always see where you honestly stand.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm shrink-0"
          >
            Explore Opportunities
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
    </StudentLayout>
  );
}
