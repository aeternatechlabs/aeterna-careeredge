// src/app/jobs/jobs-client.tsx
// Job Discovery & Multi-Domain Market Exploration with Factual Student Profile Matching and Load More Pagination

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import {
  Briefcase,
  Search,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  Layers,
  Award,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import type { JobDomain, JobListing, JobMatchResult } from "@/lib/jobs/types";

export interface StudentProfileSummary {
  academicDomain: string;
  defaultJobDomain: JobDomain;
  preferredRole: string;
  skills: string[];
  course?: string;
}

interface JobsClientProps {
  studentName: string;
  studentProfile?: StudentProfileSummary;
}

const DOMAINS: { label: string; value: JobDomain }[] = [
  { label: "All Opportunities", value: "ALL" },
  { label: "Tech & Software", value: "TECH" },
  { label: "Healthcare & Nursing", value: "HEALTHCARE" },
  { label: "Commerce & Finance", value: "COMMERCE" },
  { label: "Law & Legal", value: "LAW" },
  { label: "Teaching & Education", value: "TEACHING" },
  { label: "Design & UX", value: "DESIGN" },
];

export function JobsClient({ studentName, studentProfile }: JobsClientProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  // Default to student's profile domain if known
  const initialDomain: JobDomain =
    studentProfile?.defaultJobDomain && studentProfile.defaultJobDomain !== "ALL"
      ? studentProfile.defaultJobDomain
      : "ALL";
  const [selectedDomain, setSelectedDomain] = useState<JobDomain>(initialDomain);
  const [matchProfileOnly, setMatchProfileOnly] = useState(
    Boolean(studentProfile?.preferredRole || (studentProfile?.defaultJobDomain && studentProfile.defaultJobDomain !== "ALL"))
  );

  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [saveActionMessage, setSaveActionMessage] = useState<string | null>(null);

  const fetchJobs = useCallback(
    async (pageToFetch = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (locationQuery.trim()) params.set("location", locationQuery.trim());
        if (selectedDomain !== "ALL") params.set("domain", selectedDomain);
        if (matchProfileOnly) params.set("matchProfile", "true");
        params.set("page", String(pageToFetch));
        params.set("pageSize", "9");

        const res = await fetch(`/api/jobs/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const incomingJobs: JobListing[] = data.jobs || [];

          if (append) {
            setJobs((prev) => {
              const existingIds = new Set(prev.map((j) => j.id));
              const uniqueNew = incomingJobs.filter((j) => !existingIds.has(j.id));
              return [...prev, ...uniqueNew];
            });
          } else {
            setJobs(incomingJobs);
          }

          setTotal(data.total || 0);
          setHasMore(Boolean(data.hasMore));
          setPage(pageToFetch);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, locationQuery, selectedDomain, matchProfileOnly]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs(1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const handleFetchMore = () => {
    if (loadingMore || !hasMore) return;
    fetchJobs(page + 1, true);
  };

  const handleOpenMatch = async (job: JobListing) => {
    setSelectedJob(job);
    setMatchResult(null);
    setMatchingLoading(true);
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(job.id)}/match`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setMatchResult(result);
      }
    } catch (err) {
      console.error("Failed to run match:", err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSaveJob = async (job: JobListing) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          companyName: job.company,
          jobListingRefId: job.id,
          jobUrl: job.officialUrl,
          location: job.location,
          salary: job.salary,
          employmentType: job.employmentType,
          applicationStatus: "SAVED",
        }),
      });
      if (res.ok) {
        setSavedJobIds((prev) => new Set(prev).add(job.id));
        setSaveActionMessage(`"${job.title}" saved to your Application Tracker!`);
        setTimeout(() => setSaveActionMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save job:", err);
    }
  };

  const handleTrackOutboundClick = async (job: JobListing) => {
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          companyName: job.company,
          jobListingRefId: job.id,
          jobUrl: job.officialUrl,
          location: job.location,
          salary: job.salary,
          employmentType: job.employmentType,
          applicationStatus: "VISITED",
        }),
      });
    } catch (err) {
      console.error("Failed to record outbound visit:", err);
    }
  };

  return (
    <StudentLayout
      userName={studentName}
      studentDomain={studentProfile?.academicDomain}
      targetRole={studentProfile?.preferredRole}
    >
      <div className="min-h-screen bg-[#FFF9F7]/60 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                  <Briefcase className="w-3.5 h-3.5" />
                  Verified Opportunities & Placement Hub
                </span>
                <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-700" />
                  <span>Verified Partner Feeds (India)</span>
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                Find Tailored Career Opportunities
              </h1>
              <p className="text-sm text-gray-700 mt-1 max-w-2xl">
                Explore authentic openings calibrated to your academic domain and target role. Match scores reflect verifiable requirements from your student profile.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/applications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
              >
                <Bookmark className="w-4 h-4 text-[#7A0F1F]" />
                Application Tracker
              </Link>
              <Link
                href="/resume/studio"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-xs transition"
              >
                <Sparkles className="w-4 h-4 text-[#F2B63D]" />
                Resume Studio
              </Link>
            </div>
          </div>

          {/* Guidance helper */}
          <HowItWorksPanel toolKey="job-discovery" />

          {/* Notification Toast */}
          {saveActionMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveActionMessage}</span>
              </div>
              <Link
                href="/applications"
                className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
              >
                View in Tracker &rarr;
              </Link>
            </div>
          )}

          {/* Search, Filter & Profile Alignment Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
            {/* Student Profile Alignment Callout Banner */}
            {studentProfile && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#FFF9F7] rounded-xl border border-[#F0E1DE]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8E8EA] text-[#7A0F1F] border border-[#E8D2CE]">
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Target Alignment:</span>
                      <strong className="text-[#7A0F1F] font-extrabold">
                        {studentProfile.preferredRole || studentProfile.academicDomain}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Ranking jobs according to your verified skills and academic domain.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMatchProfileOnly(!matchProfileOnly);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      matchProfileOnly
                        ? "bg-[#7A0F1F] text-white border-[#7A0F1F] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Sparkles size={12} className={matchProfileOnly ? "text-[#F2B63D]" : "text-[#7A0F1F]"} />
                    <span>{matchProfileOnly ? "✓ Matched to My Profile" : "Match to My Profile"}</span>
                  </button>

                  {(searchQuery || locationQuery || selectedDomain !== "ALL" || !matchProfileOnly) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setLocationQuery("");
                        setSelectedDomain(initialDomain);
                        setMatchProfileOnly(true);
                        setPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Keyword & Location Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by job title or skill (e.g. React, Spring Boot, Tax, ICU, Figma)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20 focus:border-[#7A0F1F] bg-slate-50/40"
                />
              </div>
              <div className="md:col-span-5 relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Location (e.g. Bengaluru, Pune, Mumbai, Remote)..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20 focus:border-[#7A0F1F] bg-slate-50/40"
                />
              </div>
            </div>

            {/* Domain Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {DOMAINS.map((dom) => {
                const isSelected = selectedDomain === dom.value;
                const isStudentDomain = studentProfile?.defaultJobDomain === dom.value;

                return (
                  <button
                    key={dom.value}
                    onClick={() => {
                      setSelectedDomain(dom.value);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#7A0F1F] text-white shadow-xs font-bold"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{dom.label}</span>
                    {isStudentDomain && dom.value !== "ALL" && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"}`}>
                        Your Field
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary & Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-700 px-1 gap-2">
            <span>
              Showing <strong className="text-gray-900 font-bold">{jobs.length}</strong> of <strong className="text-gray-900 font-bold">{total}</strong> verified opportunities
              {selectedDomain !== "ALL" && (
                <span> in <strong className="text-[#7A0F1F]">{DOMAINS.find((d) => d.value === selectedDomain)?.label}</strong></span>
              )}
              {matchProfileOnly && <span className="text-emerald-700 font-semibold"> • Ranked by profile alignment</span>}
            </span>
            <span className="flex items-center gap-1.5 text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <Info className="w-3.5 h-3.5 text-amber-700" />
              Verified employer provenance. Click "Evaluate Requirement Match" to cross-audit your profile.
            </span>
          </div>

          {/* Job Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-16 bg-gray-50 rounded" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
              <Briefcase className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">No matching jobs found</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Try switching domains, broadening your search keyword, or clearing the location filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setLocationQuery("");
                  setSelectedDomain("ALL");
                  setMatchProfileOnly(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A0F1F] hover:underline cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset all filters and view all opportunities</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const isSaved = savedJobIds.has(job.id);
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between hover:border-[#E8D2CE] hover:shadow-md transition-all duration-200 relative"
                  >
                    <div>
                      {/* Top Badges & Match Score Pill */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {job.domain}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {job.matchScore ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                job.matchScore >= 80
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : job.matchScore >= 65
                                  ? "bg-[#FFF9F7] text-[#7A0F1F] border-[#E8D2CE]"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                              title={`Calculated match against your verified profile`}
                            >
                              <Sparkles
                                size={11}
                                className={job.matchScore >= 80 ? "text-emerald-600" : "text-[#7A0F1F]"}
                              />
                              <span>{job.matchScore}% Match</span>
                              {job.isRecommended && <span className="hidden sm:inline">• Top Fit</span>}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Job Title & Company */}
                      <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2" title={job.title}>
                        {job.title}
                      </h3>
                      <p className="text-sm font-semibold text-gray-700 mt-1">{job.company}</p>

                      {/* Metadata chips */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 mt-3">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {job.salary}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {job.employmentType.replace("_", " ")}
                        </span>
                      </div>

                      {/* Matched skills highlight */}
                      {job.matchedSkillsCount !== undefined && job.matchedSkillsCount > 0 && (
                        <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-2.5 bg-emerald-50/60 px-2 py-1 rounded-lg border border-emerald-100">
                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                          <span>{job.matchedSkillsCount} of {job.totalSkillsCount} required skills found in your profile</span>
                        </p>
                      )}

                      {/* Description excerpt */}
                      <p className="text-xs text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Requirements Tags */}
                      {job.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.requirements.slice(0, 3).map((req, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] bg-[#FFF8F0] text-gray-700 px-2 py-0.5 rounded border border-amber-100"
                            >
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 3 && (
                            <span className="text-[11px] text-gray-400 px-1 py-0.5">
                              +{job.requirements.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-5 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenMatch(job)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] transition shadow-xs cursor-pointer"
                        >
                          Evaluate Requirement Match
                        </button>
                        <button
                          onClick={() => handleSaveJob(job)}
                          title={isSaved ? "Saved in Tracker" : "Save Job"}
                          className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                            isSaved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <Bookmark
                            className={`w-4 h-4 ${isSaved ? "fill-emerald-600 text-emerald-600" : ""}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                        <span className="truncate max-w-[170px]" title={job.source}>
                          Src: {job.source}
                        </span>
                        <a
                          href={job.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleTrackOutboundClick(job)}
                          className="inline-flex items-center gap-1 text-[#7A0F1F] font-semibold hover:underline"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Fetch More Jobs / Pagination Bar ── */}
          {!loading && jobs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-xs text-slate-600">
                Showing <strong className="text-slate-900 font-bold">{jobs.length}</strong> of <strong className="text-slate-900 font-bold">{total}</strong> verified career openings
                {selectedDomain !== "ALL" && (
                  <span> in <strong className="text-[#7A0F1F] font-bold">{DOMAINS.find((d) => d.value === selectedDomain)?.label}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {hasMore ? (
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={handleFetchMore}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] disabled:opacity-50 transition shadow-xs cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Fetching more jobs…</span>
                      </>
                    ) : (
                      <>
                        <span>Fetch More Jobs ({jobs.length} of {total})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All {total} available jobs loaded for your filter</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    fetchJobs(1, false);
                  }}
                  title="Refresh jobs feed"
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Match Evaluation Slide-Over / Modal */}
          {selectedJob && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 bg-[#FFF9F7] flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#7A0F1F]/10 text-[#7A0F1F]">
                      {selectedJob.domain}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedJob.title}</h2>
                    <p className="text-sm text-gray-600">
                      {selectedJob.company} &bull; {selectedJob.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 flex-1">
                  {matchingLoading ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-8 h-8 border-3 border-[#7A0F1F] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-medium text-gray-700">
                        Cross-verifying your Student Profile with job requirements...
                      </p>
                    </div>
                  ) : matchResult ? (
                    <div className="space-y-6">
                      {/* Score Card */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-600 uppercase font-semibold tracking-wider">
                            Factual Requirement Match
                          </span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-extrabold text-[#7A0F1F]">
                              {matchResult.matchScore}
                            </span>
                            <span className="text-sm text-gray-600">/ 100</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Calculated directly from your verified skills and qualifications.
                          </p>
                        </div>

                        <div className="text-right max-w-xs">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              matchResult.matchScore >= 75
                                ? "bg-emerald-100 text-emerald-800"
                                : matchResult.matchScore >= 50
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {matchResult.matchScore >= 75
                              ? "High Alignment"
                              : matchResult.matchScore >= 50
                              ? "Moderate Alignment"
                              : "Prerequisites Needed"}
                          </span>
                          <p className="text-[11px] text-gray-600 mt-1.5 leading-snug">
                            {matchResult.disclaimer}
                          </p>
                        </div>
                      </div>

                      {/* Disqualification / Warning */}
                      {matchResult.disqualifyingFactors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1">
                            <strong className="text-red-900 block font-semibold">
                              Mandatory Prerequisite Gap
                            </strong>
                            {matchResult.disqualifyingFactors.map((df, i) => (
                              <p key={i} className="text-red-800">
                                {df}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matching Skills */}
                      <div>
                        <h4 className="text-xs uppercase font-bold text-gray-600 tracking-wider mb-2">
                          Skills You Meet ({matchResult.matchingSkills.length})
                        </h4>
                        {matchResult.matchingSkills.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            No direct skill matches recorded yet. Add technical competencies to your profile.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {matchResult.matchingSkills.map((s, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {s.name}
                                {s.verified && (
                                  <span className="text-[10px] text-emerald-600 ml-1 font-bold">
                                    &bull; Verified
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Missing Skills & Bridging Recommendation */}
                      <div>
                        <h4 className="text-xs uppercase font-bold text-gray-600 tracking-wider mb-2">
                          Skill Gaps & Actionable Bridging ({matchResult.missingSkills.length})
                        </h4>
                        {matchResult.missingSkills.length === 0 ? (
                          <p className="text-xs text-emerald-700 font-medium">
                            No skill gaps found for this opening!
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {matchResult.missingSkills.map((ms, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-gray-900">{ms.name}</span>
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                    {ms.importance}
                                  </span>
                                </div>
                                <p className="text-gray-600">{ms.bridgeRecommendation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Evidence Recommendations */}
                      {matchResult.evidenceNeeded && matchResult.evidenceNeeded.length > 0 && (
                        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-2">
                          <strong className="text-amber-900 block font-semibold flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-amber-700" />
                            Strengthen Your Profile Proof
                          </strong>
                          <ul className="list-disc list-inside space-y-1 text-amber-800">
                            {matchResult.evidenceNeeded.map((er: string, idx: number) => (
                              <li key={idx}>{er}</li>
                            ))}
                          </ul>
                          <div className="pt-2">
                            <Link
                              href="/resume/studio"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#7A0F1F] hover:underline"
                            >
                              Tailor in Resume Studio &rarr;
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 bg-[#FFF9F7] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveJob(selectedJob)}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                    >
                      {savedJobIds.has(selectedJob.id) ? "✓ Saved to Tracker" : "Save to Tracker"}
                    </button>
                    <Link
                      href={`/resume/studio`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] transition shadow-xs"
                    >
                      Tailor Resume in Studio
                    </Link>
                  </div>

                  <a
                    href={selectedJob.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleTrackOutboundClick(selectedJob)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition"
                  >
                    <span>Proceed to Official Post</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
