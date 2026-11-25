"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  FileText,
  Copy,
  Trash2,
  Check,
  AlertCircle,
  X,
  Compass,
} from "lucide-react";
import { UploadResumeButton } from "@/components/resume/upload-resume-button";
import type { ApplicationStatus } from "@/lib/applications/service";
import type { GeneratedApplicationPack } from "@/lib/applications/pack";

interface ApplicationRecord {
  id: string;
  jobTitle: string;
  companyName: string;
  jobListingRefId?: string | null;
  jobUrl?: string | null;
  location?: string | null;
  salary?: string | null;
  employmentType?: string | null;
  applicationStatus: ApplicationStatus;
  appliedDate?: string | null;
  notes?: string | null;
  followUpDate?: string | null;
  statusHistoryJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationsClientProps {
  studentName: string;
  initialApplications?: ApplicationRecord[];
  initialJobTitle?: string;
  initialCompany?: string;
  initialRefId?: string;
}

const STAGES: { key: ApplicationStatus; label: string; color: string }[] = [
  { key: "SAVED", label: "Saved", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { key: "VISITED", label: "Visited Portal", color: "bg-[#F8E8EA] text-[#7A0F1F] border-[#E8D2CE]" },
  { key: "APPLIED", label: "Applied", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "INTERVIEWING", label: "Interviewing", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "OFFER", label: "Offer Received", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  { key: "REJECTED", label: "Not Selected", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export function ApplicationsClient({
  studentName,
  initialApplications,
  initialJobTitle,
  initialCompany,
  initialRefId,
}: ApplicationsClientProps) {
  const [applications, setApplications] = useState<ApplicationRecord[]>(initialApplications || []);
  const [loading, setLoading] = useState(initialApplications === undefined);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Pack Modal state
  const [activePackApp, setActivePackApp] = useState<ApplicationRecord | null>(null);
  const [packData, setPackData] = useState<GeneratedApplicationPack | null>(null);
  const [packLoading, setPackLoading] = useState(false);
  const [packActiveTab, setPackActiveTab] = useState<"cover" | "intro" | "proof" | "checklist">("cover");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Application Modal state
  const [showNewModal, setShowNewModal] = useState(Boolean(initialJobTitle && initialCompany));
  const [newTitle, setNewTitle] = useState(initialJobTitle || "");
  const [newCompany, setNewCompany] = useState(initialCompany || "");
  const [newUrl, setNewUrl] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStatus, setNewStatus] = useState<ApplicationStatus>("SAVED");
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Confirmation modal for marking as APPLIED
  const [confirmApplyApp, setConfirmApplyApp] = useState<ApplicationRecord | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialApplications !== undefined) return;
    let ignore = false;
    fetch("/api/applications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.applications) {
          setApplications(data.applications);
        }
      })
      .catch((err) => console.error("Failed to load applications on mount:", err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [initialApplications]);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: newTitle.trim(),
          companyName: newCompany.trim(),
          jobListingRefId: initialRefId,
          jobUrl: newUrl.trim() || undefined,
          location: newLocation.trim() || undefined,
          applicationStatus: newStatus,
          notes: newNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setNewTitle("");
        setNewCompany("");
        setNewUrl("");
        setNewLocation("");
        setNewNotes("");
        fetchApplications();
      }
    } catch (err) {
      console.error("Failed to create application:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (app: ApplicationRecord, newStage: ApplicationStatus) => {
    if (newStage === "APPLIED" && app.applicationStatus !== "APPLIED") {
      setConfirmApplyApp(app);
      return;
    }

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
          credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleConfirmApplied = async () => {
    if (!confirmApplyApp) return;
    try {
      const res = await fetch(`/api/applications/${confirmApplyApp.id}`, {
          credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPLIED" }),
      });
      if (res.ok) {
        setConfirmApplyApp(null);
        fetchApplications();
      }
    } catch (err) {
      console.error("Failed to confirm applied status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this application from your tracker?")) return;
    try {
      const res = await fetch(`/api/applications/${id}`, {
          credentials: "include", method: "DELETE" });
      if (res.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  const handleOpenPack = async (app: ApplicationRecord) => {
    setActivePackApp(app);
    setPackData(null);
    setPackLoading(true);
    setPackActiveTab("cover");
    try {
      const res = await fetch(`/api/applications/${app.id}/pack`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPackData(data);
      }
    } catch (err) {
      console.error("Failed to load application pack:", err);
    } finally {
      setPackLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const filteredApps = applications.filter((app) => {
    if (activeTab === "ALL") return true;
    return app.applicationStatus === activeTab;
  });

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/40 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                <Briefcase className="w-3.5 h-3.5" />
                Application Journey Manager
              </span>
              <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                Truthful Tracking & Evidence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Job Application Tracker
            </h1>
            <p className="text-sm text-gray-700 mt-1">
              Track your application pipeline with verified audit trails and 1-click tailored application packs backed by your Proof Bank.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Compass className="w-4 h-4 text-[#7A0F1F]" />
              Explore Jobs
            </Link>
            <UploadResumeButton variant="outline" label="Upload Resume" />
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm transition"
            >
              <Plus className="w-4 h-4 text-[#F2B63D]" />
              Track New Application
            </button>
          </div>
        </div>

        {/* Guidance Helper */}
        <HowItWorksPanel toolKey="application-tracker" />

        {/* Pipeline Stage Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((st) => {
            const count = applications.filter((a) => a.applicationStatus === st.key).length;
            const isCurrent = activeTab === st.key;
            return (
              <button
                key={st.key}
                onClick={() => setActiveTab(isCurrent ? "ALL" : st.key)}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  isCurrent
                    ? "bg-[#7A0F1F] text-white border-[#7A0F1F] shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300 text-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isCurrent ? "text-amber-200" : "text-gray-700"}`}>
                    {st.label}
                  </span>
                  <span className={`text-lg font-bold ${isCurrent ? "text-white" : "text-gray-900"}`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Filter & Total */}
        <div className="flex items-center justify-between text-xs text-gray-700 px-1">
          <span>
            Showing <strong className="text-gray-900">{filteredApps.length}</strong> applications
            {activeTab !== "ALL" && ` in stage ${activeTab}`}
          </span>
          {activeTab !== "ALL" && (
            <button
              onClick={() => setActiveTab("ALL")}
              className="text-[#7A0F1F] font-semibold hover:underline"
            >
              Clear stage filter &rarr;
            </button>
          )}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-gray-900">No applications in this view</h3>
              <p className="text-sm text-gray-700 mt-1 max-w-md mx-auto">
                Explore openings in the Jobs directory to save positions, or manually log an application you submitted outside.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18]"
              >
                Find Opportunities &rarr;
              </Link>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        STAGES.find((s) => s.key === app.applicationStatus)?.color || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STAGES.find((s) => s.key === app.applicationStatus)?.label || app.applicationStatus}
                    </span>
                    {app.location && (
                      <span className="text-xs text-gray-700">{app.location}</span>
                    )}
                    {app.salary && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {app.salary}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{app.jobTitle}</h3>
                  <p className="text-sm font-medium text-gray-700">{app.companyName}</p>

                  {app.notes && (
                    <p className="text-xs text-gray-700 bg-[#FFF8F0] p-2 rounded-lg border border-amber-100 max-w-xl">
                      <strong>Notes:</strong> {app.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-700 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      Updated: {new Date(app.updatedAt).toLocaleDateString()}
                    </span>
                    {app.appliedDate && (
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Stage Control & Action Pack */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Status Dropdown */}
                  <select
                    value={app.applicationStatus}
                    onChange={(e) => handleUpdateStatus(app, e.target.value as ApplicationStatus)}
                    className="text-xs font-semibold py-2 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  >
                    {STAGES.map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.label}
                      </option>
                    ))}
                  </select>

                  {/* Application Pack Button */}
                  <button
                    onClick={() => handleOpenPack(app)}
                    className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-[#F2B63D] text-gray-900 hover:bg-[#e0a632] shadow-sm transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7A0F1F]" />
                    Application Pack
                  </button>

                  {/* External Link */}
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                      title="Open job link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4-Part Application Pack Modal */}
        {activePackApp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
              {/* Pack Header */}
              <div className="p-6 border-b border-gray-100 bg-[#FFF8F0]/60 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#7A0F1F]/10 text-[#7A0F1F]">
                      Proof-Backed Application Pack
                    </span>
                    <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                      Truthful Student Data
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">
                    Application Pack for {activePackApp.jobTitle}
                  </h2>
                  <p className="text-xs text-gray-700">{activePackApp.companyName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <UploadResumeButton
                    variant="compact"
                    label="Use my uploaded resume as base"
                    defaultTargetRole={activePackApp.jobTitle}
                    onSuccess={() => {
                      if (activePackApp) handleOpenPack(activePackApp);
                    }}
                  />
                  <button
                    onClick={() => setActivePackApp(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Pack Navigation Tabs */}
              <div className="flex border-b border-gray-100 px-6 bg-white gap-2 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setPackActiveTab("cover")}
                  className={`py-3 px-3 border-b-2 transition ${
                    packActiveTab === "cover"
                      ? "border-[#7A0F1F] text-[#7A0F1F]"
                      : "border-transparent text-gray-700 hover:text-gray-900"
                  }`}
                >
                  1. Targeted Cover Note
                </button>
                <button
                  onClick={() => setPackActiveTab("intro")}
                  className={`py-3 px-3 border-b-2 transition ${
                    packActiveTab === "intro"
                      ? "border-[#7A0F1F] text-[#7A0F1F]"
                      : "border-transparent text-gray-700 hover:text-gray-900"
                  }`}
                >
                  2. Outreach Intro
                </button>
                <button
                  onClick={() => setPackActiveTab("proof")}
                  className={`py-3 px-3 border-b-2 transition ${
                    packActiveTab === "proof"
                      ? "border-[#7A0F1F] text-[#7A0F1F]"
                      : "border-transparent text-gray-700 hover:text-gray-900"
                  }`}
                >
                  3. Proof Bank Talking Points
                </button>
                <button
                  onClick={() => setPackActiveTab("checklist")}
                  className={`py-3 px-3 border-b-2 transition ${
                    packActiveTab === "checklist"
                      ? "border-[#7A0F1F] text-[#7A0F1F]"
                      : "border-transparent text-gray-700 hover:text-gray-900"
                  }`}
                >
                  4. Pre-Application Checklist
                </button>
              </div>

              {/* Pack Body */}
              <div className="p-6 space-y-4 flex-1">
                {packLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-[#7A0F1F] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium text-gray-700">
                      Generating tailored application pack from your verified passport...
                    </p>
                  </div>
                ) : packData ? (
                  <div>
                    {/* Tab 1: Cover Note */}
                    {packActiveTab === "cover" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-700">
                            Concise pitch grounded strictly in your Career Passport facts. No exaggerated metrics.
                          </p>
                          <button
                            onClick={() => copyToClipboard(packData.coverNoteDraft, "cover")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                          >
                            {copiedKey === "cover" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Cover Note
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-[#FFF8F0]/50 border border-amber-100 rounded-2xl p-5 text-sm text-gray-800 whitespace-pre-line leading-relaxed font-sans">
                          {packData.coverNoteDraft}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Outreach Intro */}
                    {packActiveTab === "intro" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-700">
                            Short 3-paragraph outreach for email or LinkedIn InMail to the recruiter.
                          </p>
                          <button
                            onClick={() => copyToClipboard(packData.introMessageDraft, "intro")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                          >
                            {copiedKey === "intro" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Message
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm text-gray-800 whitespace-pre-line leading-relaxed font-sans">
                          {packData.introMessageDraft}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Proof Bank Talking Points */}
                    {packActiveTab === "proof" && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-700">
                            Use these 3 talking points in recruiter screenings to back your claims with verified achievements.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {packData.talkingPoints.map((tp, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-xl border border-gray-200 bg-white space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-900">
                                  Point {idx + 1}: {tp.skill}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  {tp.verificationBadge}
                                </span>
                              </div>
                              <p className="text-xs text-gray-800 font-medium">
                                &ldquo;{tp.talkingPoint}&rdquo;
                              </p>
                              <p className="text-[11px] text-gray-700">
                                Backed by Proof Artifact: <strong>{tp.evidenceTitle}</strong>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Pre-Application Checklist */}
                    {packActiveTab === "checklist" && (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-700">
                          Complete these verification checks before submitting your application:
                        </p>
                        <div className="space-y-2">
                          {packData.checklist.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">Unable to generate application pack.</p>
                )}
              </div>

              {/* Pack Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50/70 rounded-b-3xl flex items-center justify-between">
                <Link
                  href="/resume/studio?tab=resumes"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A0F1F] hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Tailored Resume
                </Link>
                <button
                  onClick={() => setActivePackApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Explicit Confirmation for APPLIED Status */}
        {confirmApplyApp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Confirm Application Submission</h3>
                  <p className="text-xs text-gray-700 mt-1">
                    To maintain an honest application ledger, confirm that you have actually submitted your application for:
                  </p>
                  <p className="text-xs font-bold text-gray-900 mt-1.5">
                    {confirmApplyApp.jobTitle} at {confirmApplyApp.companyName}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700">
                Marking this as applied records an official event timestamp in your Application Tracker.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmApplyApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApplied}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] transition shadow-sm"
                >
                  Yes, I Have Applied
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Track New Application Manually */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">Track a Job Application</h2>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Junior Legal Associate, Staff Nurse, Software Engineer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20 focus:border-[#7A0F1F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Company / Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trilegal, Manipal Hospital, Razorpay"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20 focus:border-[#7A0F1F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, Remote"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Stage</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Job Post URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Application details, recruiter contact, interview date..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Application"}
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
