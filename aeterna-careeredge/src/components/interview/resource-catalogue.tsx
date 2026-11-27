"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Filter,
  Flag,
  Globe,
  Search,
  Sparkles,
  StickyNote,
} from "lucide-react";
import {
  getCuratedResourcesForDomain,
  resolveSupportedDomain,
} from "@/lib/interview/resources/registry";
import type {
  AccessClassification,
  LearningResourceEntry,
  ResourceFormat,
} from "@/lib/interview/resources/types";
import type {
  StudentResourceItem,
  StudentResourceProgressState,
} from "@/lib/interview/resources/service";
import { EmptyState } from "@/components/interview/ui/empty-state";
import { PageSection } from "@/components/interview/ui/page-section";
import { StatusBadge, type StatusTone } from "@/components/interview/ui/status-badge";
import { Toast } from "@/components/interview/ui/toast";

interface ResourceCatalogueProps {
  kitId: string | null;
  domain: string | null;
  roleTitle?: string | null;
  resourcesOverride?: StudentResourceItem[];
}

const FORMAT_LABELS: Record<ResourceFormat, string> = {
  OFFICIAL_DOCS: "Official Docs",
  FREE_COURSE: "Free Course",
  VIDEO: "Video",
  ARTICLE: "Article",
  INTERACTIVE: "Interactive",
  PRACTICE: "Practice",
  OPEN_SOURCE: "Open Source",
  STANDARDS: "Standards",
  GOVERNMENT_PORTAL: "Gov Portal",
  UNIVERSITY_OER: "University OER",
};

const ACCESS_META: Record<
  AccessClassification,
  { label: string; tone: StatusTone }
> = {
  COMPLETELY_FREE: { label: "Completely Free", tone: "free" },
  FREE_WITH_PAID_CERT: { label: "Free Content • Paid Cert", tone: "free_cert" },
  FREEMIUM: { label: "Freemium", tone: "freemium" },
  FREE_ACCOUNT_REQUIRED: { label: "Free Account Required", tone: "account_required" },
  PAID: { label: "Paid", tone: "paid" },
  UNVERIFIED: { label: "Access Unverified", tone: "unverified" },
};

export function ResourceCatalogue({
  kitId,
  domain,
  roleTitle,
  resourcesOverride,
}: ResourceCatalogueProps) {
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<ResourceFormat | "ALL">("ALL");
  const [accessFilter, setAccessFilter] = useState<AccessClassification | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [apiState, setApiState] = useState<{
    kitId: string;
    resources: LearningResourceEntry[];
  } | null>(null);
  const [progressById, setProgressById] = useState<Record<string, StudentResourceProgressState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openNotesById, setOpenNotesById] = useState<Record<string, boolean>>({});
  const [notesDraftById, setNotesDraftById] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [noteFeedbackById, setNoteFeedbackById] = useState<
    Record<string, { type: "saved" | "error"; message: string }>
  >({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoverStatus, setDiscoverStatus] = useState<string | null>(null);

  const resolvedDomain = useMemo(() => resolveSupportedDomain(domain), [domain]);

  const hydrateFromResources = (targetKitId: string, list: StudentResourceItem[]) => {
    const nextProgress: Record<string, StudentResourceProgressState> = {};
    const nextDrafts: Record<string, string> = {};
    for (const item of list) {
      if (item?.id && item?.progress) {
        nextProgress[item.id] = item.progress;
        if (typeof item.progress.notes === "string") {
          nextDrafts[item.id] = item.progress.notes;
        }
      }
    }
    setApiState({ kitId: targetKitId, resources: list });
    setProgressById(nextProgress);
    setNotesDraftById(nextDrafts);
  };

  useEffect(() => {
    if (!kitId || !resolvedDomain || resourcesOverride) return;

    let cancelled = false;
    fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/resources`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.resources)) return;
        hydrateFromResources(kitId, data.resources);
        setOpenNotesById({});
        setNoteFeedbackById({});
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [kitId, resolvedDomain, resourcesOverride]);

  const handleDiscoverOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitId || discovering) return;
    const q = (discoverQuery.trim() || roleTitle || resolvedDomain || "").trim();
    if (q.length < 2) {
      setActionError("Enter a topic keyword to search online.");
      return;
    }
    setDiscovering(true);
    setActionError(null);
    setDiscoverStatus(null);
    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/resources/discover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, limit: 3 }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Discovery failed");

      const reload = await fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/resources`);
      if (reload.ok) {
        const reloadJson = await reload.json().catch(() => null);
        if (Array.isArray(reloadJson?.resources)) {
          hydrateFromResources(kitId, reloadJson.resources);
        }
      }

      if ((data.addedCount ?? 0) > 0) {
        setDiscoverStatus(
          `Added ${data.addedCount} new resource(s) for "${data.topicTitle}". Newly discovered links are labeled Access Unverified until checked.`
        );
      } else {
        setDiscoverStatus(
          `No new relevant resources added for "${data.topicTitle}". Try a broader topic keyword.`
        );
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not search online");
    } finally {
      setDiscovering(false);
    }
  };

  const handleToggleProgress = async (
    resourceId: string,
    field: "saved" | "studied" | "reportedBroken"
  ) => {
    if (!kitId) return;
    const prev = progressById[resourceId] ?? {
      studied: false,
      saved: false,
      reportedBroken: false,
      notes: null,
      studiedAt: null,
    };
    const nextVal = !prev[field];
    setProgressById((curr) => ({
      ...curr,
      [resourceId]: { ...prev, [field]: nextVal },
    }));
    setSavingId(resourceId);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/resources/progress`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId, [field]: nextVal }),
        }
      );
      if (!res.ok) {
        setProgressById((curr) => ({ ...curr, [resourceId]: prev }));
        setActionError("Could not update resource progress. Please try again.");
      } else {
        const payload = await res.json().catch(() => null);
        if (payload?.progress) {
          setProgressById((curr) => ({
            ...curr,
            [resourceId]: {
              studied: Boolean(payload.progress.studied),
              saved: Boolean(payload.progress.saved),
              reportedBroken: Boolean(payload.progress.reportedBroken),
              notes: payload.progress.notes ?? null,
              studiedAt: payload.progress.studiedAt ?? null,
            },
          }));
        }
      }
    } catch {
      setProgressById((curr) => ({ ...curr, [resourceId]: prev }));
      setActionError("Network error while updating resource progress.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNote = async (resourceId: string) => {
    if (!kitId || savingNoteId === resourceId) return;

    const rawDraft = notesDraftById[resourceId] ?? "";
    const trimmed = rawDraft.trim().slice(0, 2000);
    const normalizedNote = trimmed.length > 0 ? trimmed : null;
    const persistedNote = progressById[resourceId]?.notes ?? null;

    if (normalizedNote === persistedNote) {
      setNoteFeedbackById((curr) => ({
        ...curr,
        [resourceId]: { type: "saved", message: "Saved" },
      }));
      return;
    }

    setSavingNoteId(resourceId);
    setNoteFeedbackById((curr) => {
      const next = { ...curr };
      delete next[resourceId];
      return next;
    });

    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/resources/progress`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId, notes: normalizedNote }),
        }
      );
      if (!res.ok) {
        setNoteFeedbackById((curr) => ({
          ...curr,
          [resourceId]: { type: "error", message: "Could not save note" },
        }));
        return;
      }

      const payload = await res.json().catch(() => null);
      const savedNote = payload?.progress?.notes ?? normalizedNote;
      const prev = progressById[resourceId] ?? {
        studied: false,
        saved: false,
        reportedBroken: false,
        notes: null,
        studiedAt: null,
      };
      setProgressById((curr) => ({
        ...curr,
        [resourceId]: {
          studied: Boolean(payload?.progress?.studied ?? prev.studied),
          saved: Boolean(payload?.progress?.saved ?? prev.saved),
          reportedBroken: Boolean(payload?.progress?.reportedBroken ?? prev.reportedBroken),
          notes: savedNote,
          studiedAt: payload?.progress?.studiedAt ?? prev.studiedAt,
        },
      }));
      setNotesDraftById((curr) => ({
        ...curr,
        [resourceId]: savedNote ?? "",
      }));
      setNoteFeedbackById((curr) => ({
        ...curr,
        [resourceId]: { type: "saved", message: savedNote ? "Saved" : "Cleared" },
      }));
    } catch {
      setNoteFeedbackById((curr) => ({
        ...curr,
        [resourceId]: { type: "error", message: "Network error saving note" },
      }));
    } finally {
      setSavingNoteId(null);
    }
  };

  const baseResources = useMemo(() => {
    if (resourcesOverride) {
      return resourcesOverride.filter(
        (r) => r.reviewStatus !== "REJECTED" && (r.reviewStatus as string) !== "ARCHIVED"
      );
    }
    if (!resolvedDomain) return [];
    if (kitId && apiState?.kitId === kitId) {
      return apiState.resources;
    }
    return getCuratedResourcesForDomain(resolvedDomain);
  }, [resolvedDomain, resourcesOverride, kitId, apiState]);

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseResources.filter((r) => {
      if (formatFilter !== "ALL" && r.format !== formatFilter) return false;
      if (accessFilter !== "ALL" && r.accessClassification !== accessFilter) return false;
      if (q) {
        const hay = [r.title, r.provider, r.description, ...r.subtopics].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [baseResources, search, formatFilter, accessFilter]);

  return (
    <PageSection
      id="resource-catalogue-heading"
      title={`Learning Resources${resolvedDomain ? ` — ${resolvedDomain}` : ""}`}
      summary="Official guides, open courses, and portals matched to your domain. Access terms are labeled honestly."
      action={
        <span className="text-xs font-bold text-[#59413F] bg-[#FFF8F0] border border-[#EBDDD1] px-3 py-1.5 rounded-xl inline-block">
          {filteredResources.length} resource{filteredResources.length === 1 ? "" : "s"}
        </span>
      }
    >
      {/* Discover More Online */}
      {kitId && !resourcesOverride && resolvedDomain && (
        <form
          onSubmit={handleDiscoverOnline}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#FFF0C7]/40 p-3 rounded-2xl border border-[#F2B63D]/50"
        >
          <input
            type="text"
            value={discoverQuery}
            onChange={(e) => setDiscoverQuery(e.target.value)}
            placeholder={`Find more online resources for ${roleTitle || resolvedDomain}...`}
            aria-label="Discover more online resources"
            className="flex-1 min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm text-[#2B1B1B]"
          />
          <button
            type="submit"
            disabled={discovering}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#7A0F1F] bg-white hover:bg-[#FFF8F0] disabled:opacity-60 text-[#7A0F1F] text-sm font-bold inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{discovering ? "Searching..." : "Find More Resources"}</span>
          </button>
        </form>
      )}

      {/* Search + Collapsible Filters on Mobile */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#765F5D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search learning resources"
              placeholder="Search topic, provider, or keyword..."
              className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white pl-9 pr-3 text-sm text-[#2B1B1B]"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="sm:hidden min-h-[44px] px-3.5 rounded-xl border border-[#D8C5B8] bg-white text-sm font-semibold text-[#2B1B1B] inline-flex items-center gap-1.5"
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span>Filters</span>
          </button>
        </div>

        <div
          className={`${filtersOpen ? "grid" : "hidden"} sm:grid grid-cols-1 sm:grid-cols-2 gap-2.5`}
        >
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as ResourceFormat | "ALL")}
            aria-label="Filter by resource format"
            className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm text-[#2B1B1B]"
          >
            <option value="ALL">All Formats</option>
            {Object.entries(FORMAT_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as AccessClassification | "ALL")}
            aria-label="Filter by access classification"
            className="w-full min-h-[44px] rounded-xl border border-[#D8C5B8] bg-white px-3 text-sm text-[#2B1B1B]"
          >
            <option value="ALL">All Access Types</option>
            {Object.entries(ACCESS_META).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {discoverStatus && (
        <Toast type="ok" message={discoverStatus} onDismiss={() => setDiscoverStatus(null)} />
      )}
      {actionError && (
        <Toast type="err" message={actionError} onDismiss={() => setActionError(null)} />
      )}

      {!resourcesOverride && !resolvedDomain ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No domain selected"
          description="Select or create an Interview Prep Kit with a professional domain to view tailored learning resources."
        />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No matching resources found"
          description="No resources match your current search or filter selections."
          action={
            (search || formatFilter !== "ALL" || accessFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFormatFilter("ALL");
                  setAccessFilter("ALL");
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#7A0F1F] text-[#7A0F1F] text-sm font-bold hover:bg-[#FFF8F0]"
              >
                Reset Filters
              </button>
            )
          }
        />
      ) : (
        <div className="divide-y divide-[#EBDDD1] rounded-2xl border border-[#EBDDD1] overflow-hidden bg-white">
          {filteredResources.map((res) => {
            const accessInfo = ACCESS_META[res.accessClassification] ?? ACCESS_META.UNVERIFIED;
            const prog = progressById[res.id];
            return (
              <article key={res.id} className="p-4 sm:p-5 space-y-3 hover:bg-[#FFF8F0]/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge tone={accessInfo.tone} label={accessInfo.label} />
                      <StatusBadge tone="info" label={FORMAT_LABELS[res.format]} />
                      {res.verificationStatus === "PENDING_REVIEW" && (
                        <StatusBadge tone="pending" label="Link Check Pending" />
                      )}
                      {res.verificationStatus === "INCONCLUSIVE" && (
                        <StatusBadge tone="inconclusive" label="Link Check Inconclusive" />
                      )}
                    </div>

                    <h4 className="font-heading text-base font-bold text-[#2B1B1B]">
                      {res.title}
                    </h4>
                    <p className="text-xs font-semibold text-[#7A0F1F]">
                      {res.provider}
                      <span className="text-[#765F5D] font-normal">
                        {" • "}
                        {res.difficulty}
                        {" • "}
                        <Globe className="w-3 h-3 inline mx-0.5" aria-hidden="true" />
                        {res.language}
                      </span>
                    </p>
                    <p className="text-sm text-[#59413F] leading-relaxed">{res.description}</p>
                    {res.accessRequirements && (
                      <p className="text-xs text-[#59413F]">
                        <strong>Access note:</strong> {res.accessRequirements}
                      </p>
                    )}
                  </div>

                  {/* Row Actions: Icon buttons with tooltips + Open Resource */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {kitId && !resourcesOverride && (
                      <>
                        <button
                          type="button"
                          disabled={savingId === res.id}
                          onClick={() => handleToggleProgress(res.id, "saved")}
                          aria-pressed={Boolean(prog?.saved)}
                          aria-label={prog?.saved ? `Saved ${res.title}` : `Save ${res.title}`}
                          title={prog?.saved ? "Saved" : "Save"}
                          className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                            prog?.saved
                              ? "bg-[#7A0F1F]/10 text-[#7A0F1F] border-[#7A0F1F]/40"
                              : "bg-white text-[#59413F] border-[#D8C5B8] hover:border-[#7A0F1F]"
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                          <span className="hidden sm:inline">{prog?.saved ? "Saved" : "Save"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingId === res.id}
                          onClick={() => handleToggleProgress(res.id, "studied")}
                          aria-pressed={Boolean(prog?.studied)}
                          aria-label={
                            prog?.studied
                              ? `Studied ${res.title}`
                              : `Mark Studied ${res.title}`
                          }
                          title={prog?.studied ? "Studied" : "Mark Studied"}
                          className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                            prog?.studied
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : "bg-white text-[#59413F] border-[#D8C5B8] hover:border-emerald-400"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {prog?.studied ? "Studied" : "Mark Studied"}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={savingId === res.id}
                          onClick={() => handleToggleProgress(res.id, "reportedBroken")}
                          aria-pressed={Boolean(prog?.reportedBroken)}
                          aria-label={`Report broken link for ${res.title}`}
                          title="Report broken link"
                          className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl border inline-flex items-center justify-center transition-colors ${
                            prog?.reportedBroken
                              ? "bg-amber-50 text-amber-900 border-amber-300"
                              : "bg-white text-[#59413F] border-[#D8C5B8] hover:text-[#7A0F1F]"
                          }`}
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenNotesById((curr) => ({
                              ...curr,
                              [res.id]: !curr[res.id],
                            }))
                          }
                          aria-expanded={Boolean(openNotesById[res.id])}
                          aria-label={`Toggle notes for ${res.title}`}
                          title="Notes"
                          className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border inline-flex items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                            openNotesById[res.id] || prog?.notes
                              ? "bg-[#FFF0C7]/70 text-[#4C0915] border-[#F2B63D]"
                              : "bg-white text-[#59413F] border-[#D8C5B8]"
                          }`}
                        >
                          <StickyNote className="w-4 h-4" />
                          <span className="hidden sm:inline">{prog?.notes ? "Notes •" : "Notes"}</span>
                        </button>
                      </>
                    )}

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] text-white text-sm font-bold inline-flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B63D]"
                    >
                      <span>Open Resource</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {/* Expandable Notes */}
                {kitId && !resourcesOverride && openNotesById[res.id] && (
                  <div className="pt-3 border-t border-[#EBDDD1] space-y-2">
                    <label
                      htmlFor={`resource-note-${res.id}`}
                      className="block text-xs font-bold text-[#2B1B1B]"
                    >
                      Study Notes
                    </label>
                    <textarea
                      id={`resource-note-${res.id}`}
                      aria-label={`Notes for ${res.title}`}
                      rows={2}
                      maxLength={2000}
                      value={notesDraftById[res.id] ?? prog?.notes ?? ""}
                      onChange={(e) =>
                        setNotesDraftById((curr) => ({
                          ...curr,
                          [res.id]: e.target.value,
                        }))
                      }
                      placeholder="Key takeaways or follow-up questions..."
                      className="w-full rounded-xl border border-[#D8C5B8] bg-white px-3 py-2 text-sm text-[#2B1B1B]"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[#765F5D]">
                        {(notesDraftById[res.id] ?? prog?.notes ?? "").length}/2000
                      </span>
                      <div className="flex items-center gap-2">
                        {noteFeedbackById[res.id] && (
                          <span
                            role="status"
                            className={`text-xs font-semibold ${
                              noteFeedbackById[res.id].type === "error"
                                ? "text-rose-700"
                                : "text-emerald-800"
                            }`}
                          >
                            {noteFeedbackById[res.id].message}
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={savingNoteId === res.id}
                          onClick={() => handleSaveNote(res.id)}
                          className="min-h-[44px] sm:min-h-[38px] px-4 py-1.5 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-xs font-bold"
                        >
                          {savingNoteId === res.id ? "Saving..." : "Save Note"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}
