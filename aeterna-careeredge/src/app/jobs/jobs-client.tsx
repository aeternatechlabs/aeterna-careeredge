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
} from "lucide-react";
import type { JobDomain, JobListing, JobMatchResult } from "@/lib/jobs/types";

interface JobsClientProps {
  studentName: string;
}

const DOMAINS: { label: string; value: JobDomain }[] = [
  { label: "All Opportunities", value: "ALL" },
  { label: "Healthcare & Nursing", value: "HEALTHCARE" },
  { label: "Teaching & Education", value: "TEACHING" },
  { label: "Commerce & Finance", value: "COMMERCE" },
  { label: "Tech & Software", value: "TECH" },
  { label: "Law & Legal", value: "LAW" },
  { label: "Design & UX", value: "DESIGN" },
];

export function JobsClient({ studentName: _studentName }: JobsClientProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<JobDomain>("ALL");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [saveActionMessage, setSaveActionMessage] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (locationQuery) params.set("location", locationQuery);
      if (selectedDomain !== "ALL") params.set("domain", selectedDomain);
      params.set("pageSize", "16");

      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, locationQuery, selectedDomain]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

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
      // Record outbound application visit as VISITED status in tracker
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
    <StudentLayout userName={_studentName}>
      <div className="min-h-screen bg-[#FFF8F0]/40 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A0F1F]/10 text-[#7A0F1F]">
                <Briefcase className="w-3.5 h-3.5" />
                Multi-Domain Market Exploration
              </span>
              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                Sample listings (Live feeds connecting)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Find Verified Career Opportunities
            </h1>
            <p className="text-sm text-gray-700 mt-1 max-w-2xl">
              Explore authentic openings tailored to your domain. Match scores measure factual requirement alignment from your Career Passport — never false hiring guarantees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/applications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Bookmark className="w-4 h-4 text-[#7A0F1F]" />
              Application Tracker
            </Link>
            <Link
              href="/resume/studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] shadow-sm transition"
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
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
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

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-7 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by job title, skill (e.g. React, GSTR-1, ICU, B.Ed)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20 focus:border-[#7A0F1F]"
              />
            </div>
            <div className="md:col-span-5 relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Location (e.g. Bengaluru, Remote, Karnataka)..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7A0F1F]/20 focus:border-[#7A0F1F]"
              />
            </div>
          </div>

          {/* Domain Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DOMAINS.map((dom) => (
              <button
                key={dom.value}
                onClick={() => setSelectedDomain(dom.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedDomain === dom.value
                    ? "bg-[#7A0F1F] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {dom.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter & Transparency Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-700 px-1 gap-2">
          <span>
            Showing <strong className="text-gray-900">{jobs.length}</strong> of {total} listings
            {selectedDomain !== "ALL" && ` in ${selectedDomain}`}
          </span>
          <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            <Info className="w-3.5 h-3.5" />
            Verified data provenance on all listings. No fake or unverified opportunities.
          </span>
        </div>

        {/* Job Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-semibold text-gray-900">No matching jobs found</h3>
            <p className="text-sm text-gray-700 max-w-md mx-auto">
              Try broadening your search term, switching domains, or clearing your location filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setLocationQuery("");
                setSelectedDomain("ALL");
              }}
              className="text-xs font-semibold text-[#7A0F1F] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {job.domain}
                      </span>
                      {job.isDemoJob ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Verified Demo
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F8E8EA] text-[#7A0F1F] border border-[#E8D2CE]">
                          Partner Feed
                        </span>
                      )}
                    </div>

                    {/* Job Title & Company */}
                    <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-700 mt-1">{job.company}</p>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 mt-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {job.salary}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {job.employmentType.replace("_", " ")}
                      </span>
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs text-gray-700 mt-3 line-clamp-3 leading-relaxed">
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
                          <span className="text-[10px] text-gray-700 self-center">
                            +{job.requirements.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenMatch(job)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-[#7A0F1F] text-white hover:bg-[#600C18] transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#F2B63D]" />
                        Evaluate Match
                      </button>
                      <button
                        onClick={() => handleSaveJob(job)}
                        title={isSaved ? "Saved" : "Save Job"}
                        className={`p-2 rounded-xl border text-xs transition ${
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

                    <div className="flex items-center justify-between text-[11px] text-gray-700 px-1">
                      <span className="truncate max-w-[170px]" title={job.source}>
                        Src: {job.source}
                      </span>
                      <a
                        href={job.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleTrackOutboundClick(job)}
                        className="inline-flex items-center gap-1 text-[#7A0F1F] font-medium hover:underline"
                      >
                        Official Post
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Match Evaluation Slide-Over / Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 bg-[#FFF8F0]/50 flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#7A0F1F]/10 text-[#7A0F1F]">
                    {selectedJob.domain}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedJob.title}</h2>
                  <p className="text-sm text-gray-700">
                    {selectedJob.company} &bull; {selectedJob.location}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
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
                      Cross-verifying your Career Passport with job requirements...
                    </p>
                  </div>
                ) : matchResult ? (
                  <div className="space-y-6">
                    {/* Score Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-700 uppercase font-semibold tracking-wider">
                          Factual Requirement Match
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-extrabold text-[#7A0F1F]">
                            {matchResult.matchScore}
                          </span>
                          <span className="text-sm text-gray-700">/ 100</span>
                        </div>
                        <p className="text-xs text-gray-700 mt-1">
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
                        <p className="text-[11px] text-gray-700 mt-1.5 leading-snug">
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

                    {/* Suitability Explanation */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
                        <Info className="w-4 h-4 text-amber-700" />
                        Honest Suitability Breakdown
                      </div>
                      <p className="text-xs text-amber-900/90 leading-relaxed">
                        {matchResult.suitabilityExplanation}
                      </p>
                    </div>

                    {/* Academic Alignment */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#7A0F1F]" />
                        Academic & Regulatory Standing
                      </h4>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Your Record:</span>
                          <span className="font-semibold text-gray-900">
                            {matchResult.academicAlignment.studentQualification}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Required:</span>
                          <span className="font-semibold text-gray-900">
                            {matchResult.academicAlignment.requiredQualification}
                          </span>
                        </div>
                        <p className="text-gray-700 text-[11px] pt-1 border-t border-gray-200">
                          {matchResult.academicAlignment.details}
                        </p>
                      </div>
                    </div>

                    {/* Matching Skills */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Matching Skills ({matchResult.matchingSkills.length})
                      </h4>
                      {matchResult.matchingSkills.length === 0 ? (
                        <p className="text-xs text-gray-700 italic">No direct skill matches found.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {matchResult.matchingSkills.map((ms, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white text-xs"
                            >
                              <span className="font-medium text-gray-900">{ms.name}</span>
                              {ms.verified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  Proof Verified
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Claim Only
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Missing Skills */}
                    {matchResult.missingSkills.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#7A0F1F]" />
                          Missing Skills & Action Steps ({matchResult.missingSkills.length})
                        </h4>
                        <div className="space-y-2">
                          {matchResult.missingSkills.map((sk, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg border border-gray-200 bg-gray-50/70 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">{sk.name}</span>
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  {sk.importance}
                                </span>
                              </div>
                              <p className="text-gray-700 text-[11px]">
                                {sk.bridgeRecommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence Needed */}
                    {matchResult.evidenceNeeded.length > 0 && (
                      <div className="bg-[#FFF9F7] border border-[#F0E1DE] rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2B1B1B] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#7A0F1F]" />
                            Proof Bank Evidence Needed
                          </span>
                          <Link
                            href="/resume/studio"
                            className="text-xs font-semibold text-[#7A0F1F] underline hover:text-[#650B19]"
                          >
                            Tailor in Studio &rarr;
                          </Link>
                        </div>
                        <ul className="text-xs text-[#604B49] list-disc pl-4 space-y-1">
                          {matchResult.evidenceNeeded.map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">Unable to load match evaluation.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50/70 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSaveJob(selectedJob)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#7A0F1F]" />
                    Save in Tracker
                  </button>
                  <Link
                    href={`/applications?jobTitle=${encodeURIComponent(
                      selectedJob.title
                    )}&company=${encodeURIComponent(
                      selectedJob.company
                    )}&refId=${encodeURIComponent(selectedJob.id)}`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#F2B63D] text-gray-900 hover:bg-[#e0a632] shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7A0F1F]" />
                    Generate Application Pack
                  </Link>
                </div>

                <a
                  href={selectedJob.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleTrackOutboundClick(selectedJob)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#600C18] transition shadow-sm"
                >
                  Apply on Official Site
                  <ArrowRight className="w-3.5 h-3.5" />
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
