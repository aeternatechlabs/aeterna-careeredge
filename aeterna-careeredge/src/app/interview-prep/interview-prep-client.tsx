"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PreparedInterviewKit, InterviewPrepTheme } from "@/lib/interview/service";

interface InterviewPrepClientProps {
  studentName: string;
  initialKits?: Array<{ id: string; jobTitle: string; companyName: string | null; themesCount: number; questionsCount: number; createdAt: string }>;
  initialActiveKit?: PreparedInterviewKit | null;
  initialJobTitle?: string;
  initialCompany?: string;
  initialDomain?: string;
}

export function InterviewPrepClient({
  studentName,
  initialKits,
  initialActiveKit,
  initialJobTitle,
  initialCompany,
  initialDomain,
}: InterviewPrepClientProps) {
  const [kits, setKits] = useState<Array<{ id: string; jobTitle: string; companyName: string | null; themesCount: number; questionsCount: number; createdAt: string }>>(initialKits || []);
  const [activeKit, setActiveKit] = useState<PreparedInterviewKit | null>(initialActiveKit || null);
  const [loading, setLoading] = useState(initialKits === undefined);
  const [kitLoading, setKitLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set(["q-tech-1", "q-health-1", "q-comm-1"]));

  // Generator modal state
  const [showGenerateModal, setShowGenerateModal] = useState(Boolean(initialJobTitle));
  const [roleInput, setRoleInput] = useState(initialJobTitle || "Full-Stack Software Engineer");
  const [companyInput, setCompanyInput] = useState(initialCompany || "");
  const [domainInput, setDomainInput] = useState(initialDomain || "TECH");
  const [generating, setGenerating] = useState(false);

  const loadKitDetails = useCallback(async (kitId: string) => {
    setKitLoading(true);
    try {
      const res = await fetch(`/api/interview-prep/${kitId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveKit(data);
      }
    } catch (err) {
      console.error("Failed to load kit details:", err);
    } finally {
      setKitLoading(false);
    }
  }, []);

  const fetchKits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview-prep");
      if (res.ok) {
        const data = await res.json();
        setKits(data.kits || []);
        if (data.kits?.length > 0 && !activeKit) {
          loadKitDetails(data.kits[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load interview kits:", err);
    } finally {
      setLoading(false);
    }
  }, [activeKit, loadKitDetails]);

  useEffect(() => {
    if (initialKits !== undefined) return;
    let ignore = false;
    fetch("/api/interview-prep")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.kits) {
          setKits(data.kits);
          if (data.kits.length > 0) {
            fetch(`/api/interview-prep/${data.kits[0].id}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((kit) => {
                if (!ignore && kit) setActiveKit(kit);
              });
          }
        }
      })
      .catch((err) => console.error("Error on mount:", err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [initialKits]);

  const handleCreateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput.trim()) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: roleInput.trim(),
          companyName: companyInput.trim() || undefined,
          domain: domainInput,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setActiveKit(created);
        setShowGenerateModal(false);
        fetchKits();
      }
    } catch (err) {
      console.error("Failed to create kit:", err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/40 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                <HelpCircle className="w-3.5 h-3.5" />
                Proof-Backed Interview Preparation
              </span>
              <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                STAR Method & Evidence Citations
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Interview Prep Kit
            </h1>
            <p className="text-sm text-gray-700 mt-1 max-w-3xl">
              Practice domain technical, scenario, and behavioral questions. Every answer is structured with proven frameworks and links directly to artifacts in your Proof Bank.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/evidence-vault"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Evidence Vault
            </Link>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm transition"
            >
              <Plus className="w-4 h-4 text-[#F2B63D]" />
              New Prep Kit
            </button>
          </div>
        </div>

        {/* Guidance Helper */}
        <HowItWorksPanel toolKey="interview-prep-kit" />

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Kit Selector */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Your Interview Kits ({kits.length})
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse h-20" />
                ))}
              </div>
            ) : kits.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-700">No interview kits generated yet.</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="text-xs font-bold text-[#7A0F1F] hover:underline"
                >
                  Create your first kit &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {kits.map((k) => {
                  const isSelected = activeKit?.id === k.id;
                  return (
                    <button
                      key={k.id}
                      onClick={() => loadKitDetails(k.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        isSelected
                          ? "bg-[#7A0F1F] text-white border-[#7A0F1F] shadow-sm"
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-900"
                      }`}
                    >
                      <h4 className="text-sm font-bold truncate">{k.jobTitle}</h4>
                      <p className={`text-xs mt-0.5 ${isSelected ? "text-amber-200" : "text-gray-700"}`}>
                        {k.companyName || "Standard Occupational Role"}
                      </p>
                      <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-white/20">
                        <span className={isSelected ? "text-white/80" : "text-gray-700"}>
                          {k.questionsCount} Questions &bull; {k.themesCount} Themes
                        </span>
                        <span className={isSelected ? "text-amber-300 font-bold" : "text-[#7A0F1F] font-bold"}>
                          View &rarr;
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Kit Details */}
          <div className="lg:col-span-8">
            {kitLoading ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 animate-pulse h-96" />
            ) : activeKit ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#7A0F1F]/10 text-[#7A0F1F]">
                      Proof Bank Ready
                    </span>
                    <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      STAR Framework
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mt-2">
                    {activeKit.jobTitle}
                  </h2>
                  <p className="text-xs text-gray-700">
                    {activeKit.companyName ? `Tailored for ${activeKit.companyName}` : "General Domain Practice"}
                  </p>
                </div>

                {/* Themes List */}
                <div className="space-y-6">
                  {activeKit.themes.map((theme: InterviewPrepTheme, tIdx: number) => (
                    <div key={tIdx} className="space-y-3">
                      <div className="bg-[#FFF8F0] border border-amber-200/80 rounded-2xl p-4">
                        <h3 className="text-sm font-bold text-gray-900">{theme.themeName}</h3>
                        <p className="text-xs text-gray-700 mt-0.5">{theme.description}</p>
                      </div>

                      {/* Questions */}
                      <div className="space-y-3">
                        {theme.questions.map((q) => {
                          const isExpanded = expandedQuestions.has(q.id);
                          return (
                            <div
                              key={q.id}
                              className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs"
                            >
                              {/* Question Bar */}
                              <div
                                onClick={() => toggleQuestionExpand(q.id)}
                                className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-gray-50/60 transition"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        q.category === "TECHNICAL"
                                          ? "bg-[#F8E8EA] text-[#7A0F1F] border border-[#E8D2CE]"
                                          : q.category === "SCENARIO"
                                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      }`}
                                    >
                                      {q.category}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-gray-900">
                                    {q.question}
                                  </h4>
                                </div>
                                <button className="text-gray-400 p-1">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              </div>

                              {/* Expanded Framework & Evidence Link */}
                              {isExpanded && (
                                <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/30 space-y-4 text-xs">
                                  {/* Context */}
                                  <p className="text-gray-700 italic pt-3">
                                    <strong>Evaluator Context:</strong> {q.context}
                                  </p>

                                  {/* Response Framework */}
                                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <strong className="text-gray-900 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#F2B63D]" />
                                        Recommended STAR Framework
                                      </strong>
                                      <button
                                        onClick={() => copyToClipboard(q.responseFramework, q.id)}
                                        className="text-[11px] text-[#7A0F1F] font-semibold hover:underline inline-flex items-center gap-1"
                                      >
                                        {copiedKey === q.id ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            Copied
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            Copy
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-gray-800 leading-relaxed font-mono text-[11px]">
                                      {q.responseFramework}
                                    </p>
                                  </div>

                                  {/* Proof Bank Citation */}
                                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-emerald-950">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="block text-emerald-900 font-semibold">
                                        Proof Bank Evidence Linkage
                                      </strong>
                                      <span>{q.proofBankCitationAdvice}</span>
                                    </div>
                                  </div>

                                  {/* Key Talking Points */}
                                  <div className="space-y-1">
                                    <strong className="text-gray-900">Key Points to Emphasize:</strong>
                                    <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                                      {q.keyTalkingPoints.map((pt, i) => (
                                        <li key={i}>{pt}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-base font-bold text-gray-900">Select or create an interview kit</h3>
                <p className="text-xs text-gray-700">Click &ldquo;New Prep Kit&rdquo; above to generate questions for your target position.</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Create Interview Prep Kit</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateKit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Job / Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Nurse, Junior Legal Associate, Frontend Engineer"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Company / Employer (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Hospitals, Razorpay, Trilegal"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Professional Domain
                  </label>
                  <select
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  >
                    <option value="TECH">Technology & Software</option>
                    <option value="HEALTHCARE">Healthcare & Nursing</option>
                    <option value="TEACHING">Teaching & Education</option>
                    <option value="COMMERCE">Commerce & Finance</option>
                    <option value="LAW">Law & Legal</option>
                    <option value="DESIGN">Design & UX</option>
                  </select>
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
                    {generating ? "Generating Kit..." : "Generate Kit"}
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
