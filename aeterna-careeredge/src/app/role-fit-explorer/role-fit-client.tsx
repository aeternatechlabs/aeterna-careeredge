"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  Info,
} from "lucide-react";
import type { EvaluatedRoleFit } from "@/lib/readiness/service";

interface RoleFitClientProps {
  studentName: string;
}

const PROFESSIONS = [
  { key: "TECH", label: "Tech & Software", badge: "NASSCOM / AICTE" },
  { key: "HEALTHCARE", label: "Healthcare & Nursing", badge: "INC / NABH" },
  { key: "TEACHING", label: "Teaching & Education", badge: "NCTE / CBSE" },
  { key: "COMMERCE", label: "Commerce & Finance", badge: "ICAI / NSDC" },
  { key: "LAW", label: "Law & Legal", badge: "Bar Council of India" },
  { key: "DESIGN", label: "Design & UX", badge: "India Design Council" },
];

export function RoleFitClient({ studentName }: RoleFitClientProps) {
  const [selectedProfession, setSelectedProfession] = useState("TECH");
  const [roles, setRoles] = useState<EvaluatedRoleFit[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/role-fit?profession=${encodeURIComponent(selectedProfession)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data) {
          setRoles(data.evaluatedRoles || []);
          setRecommendations(data.topRecommendations || []);
        }
      })
      .catch((err) => console.error("Failed to load role fit:", err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selectedProfession]);

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/40 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                <Compass className="w-3.5 h-3.5" />
                Occupational Readiness Engine
              </span>
              <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                Official Standards Aligned
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Role Fit & Career Readiness Explorer
            </h1>
            <p className="text-sm text-gray-700 mt-1 max-w-3xl">
              Compare your verified Career Passport against authentic national occupational standards. Scores measure factual criteria alignment — never false hiring guarantees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sprints"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm transition"
            >
              <Zap className="w-4 h-4 text-[#F2B63D]" />
              30-Day Sprints
            </Link>
          </div>
        </div>

        {/* Guidance Helper */}
        <HowItWorksPanel toolKey="role-fit-explorer" />

        {/* Profession Switcher Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
          {PROFESSIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedProfession(p.key)}
              className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                selectedProfession === p.key
                  ? "bg-[#7A0F1F] text-white shadow-sm"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{p.label}</span>
              <span
                className={`text-[10px] font-normal ${
                  selectedProfession === p.key ? "text-amber-200" : "text-gray-700"
                }`}
              >
                {p.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Top Insights Callout */}
        {recommendations.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-700" />
              Strategic Employability Recommendations
            </div>
            <ul className="text-xs text-amber-950/90 grid grid-cols-1 md:grid-cols-2 gap-2 list-disc pl-4">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Roles List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 animate-pulse h-80"
              />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
            <Compass className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No benchmark roles available</h3>
            <p className="text-xs text-gray-700">Please choose another professional domain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md transition"
              >
                <div className="space-y-4">
                  {/* Top Bar: Title & Readiness Gauge */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        Occupational Benchmark
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{role.roleTitle}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl font-black text-[#7A0F1F]">
                          {role.readinessScore}
                        </span>
                        <span className="text-xs text-gray-700">/ 100</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          role.readinessScore >= 75
                            ? "bg-emerald-100 text-emerald-800"
                            : role.readinessScore >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {role.readinessScore >= 75
                          ? "High Readiness"
                          : role.readinessScore >= 50
                          ? "Moderate Alignment"
                          : "Gaps to Bridge"}
                      </span>
                    </div>
                  </div>

                  {/* Evidence Vault Coverage Meter */}
                  <div className="bg-[#FFF8F0] border border-amber-100 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Evidence Vault Coverage
                      </span>
                      <span className="font-bold text-[#7A0F1F]">
                        {role.evidenceCoveragePercent}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#7A0F1F] h-full rounded-full transition-all"
                        style={{ width: `${role.evidenceCoveragePercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-700">
                      Proportion of core role competencies backed by verified artifacts in your Proof Bank.
                    </p>
                  </div>

                  {/* Prerequisite Alert */}
                  {!role.prerequisiteSatisfied && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-900">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Statutory Prerequisite Gap:</strong> {role.prerequisiteNote}
                      </div>
                    </div>
                  )}

                  {/* Competencies Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Factual Competencies ({role.matchedCompetencies.length} Fulfilled)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {role.matchedCompetencies.map((m, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border bg-white border-gray-200 text-gray-800"
                        >
                          {m.name}
                          {m.verified ? (
                            <span title={`Verified by: ${m.evidenceTitle}`}>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold" title="Claim only">
                              *
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Competencies */}
                  {role.missingCompetencies.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Missing Competencies to Target ({role.missingCompetencies.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {role.missingCompetencies.map((m, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg border bg-gray-50 border-gray-200 text-gray-700"
                          >
                            + {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions & Regulatory Citation */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-gray-700">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                    <span>Std:</span>
                    <a
                      href={role.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#7A0F1F] underline inline-flex items-center gap-0.5"
                    >
                      {role.regulatorySource}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <Link
                    href={`/sprints?profession=${encodeURIComponent(
                      selectedProfession
                    )}&role=${encodeURIComponent(role.roleTitle)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-[#F2B63D] text-gray-900 hover:bg-[#e0a632] shadow-sm transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#7A0F1F]" />
                    Start 30-Day Sprint
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </StudentLayout>
  );
}
