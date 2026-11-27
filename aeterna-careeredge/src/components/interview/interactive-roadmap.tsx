"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Bookmark,
  CheckCircle2,
  List,
  Lock,
  Map as MapIcon,
  Maximize2,
  Network,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { LearningResourceEntry } from "@/lib/interview/resources/types";
import {
  buildRoadmapGraphData,
  buildTopicLookup,
  type RoadmapPhaseItem,
  type RoadmapViewResponse,
} from "@/lib/interview/roadmap-graph-utils";
import {
  RoadmapPhaseBandNode,
  RoadmapTopicNode,
} from "@/components/interview/roadmap-topic-node";
import { RoadmapTopicDetail } from "@/components/interview/roadmap-topic-detail";

const NODE_TYPES = {
  phaseBand: RoadmapPhaseBandNode,
  roadmapTopic: RoadmapTopicNode,
} as const;

interface GraphToolbarProps {
  showMinimap: boolean;
  onToggleMinimap: () => void;
  viewMode: "GRAPH" | "LIST";
  onChangeViewMode: (m: "GRAPH" | "LIST") => void;
}

function GraphCanvasControls({
  showMinimap,
  onToggleMinimap,
  viewMode,
  onChangeViewMode,
}: GraphToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {viewMode === "GRAPH" && (
        <>
          <button
            type="button"
            onClick={() => void zoomIn({ duration: 150 })}
            aria-label="Zoom in roadmap"
            title="Zoom in"
            className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-xs font-semibold text-[#2B1B1B] inline-flex items-center gap-1"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[#7A0F1F]" />
            <span className="hidden sm:inline">Zoom In</span>
          </button>
          <button
            type="button"
            onClick={() => void zoomOut({ duration: 150 })}
            aria-label="Zoom out roadmap"
            title="Zoom out"
            className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-xs font-semibold text-[#2B1B1B] inline-flex items-center gap-1"
          >
            <ZoomOut className="w-3.5 h-3.5 text-[#7A0F1F]" />
            <span className="hidden sm:inline">Zoom Out</span>
          </button>
          <button
            type="button"
            onClick={() => void fitView({ padding: 0.14, duration: 200 })}
            aria-label="Fit roadmap to screen"
            title="Fit view"
            className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-xs font-semibold text-[#2B1B1B] inline-flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#7A0F1F]" />
            <span>Fit View</span>
          </button>
          <button
            type="button"
            onClick={onToggleMinimap}
            aria-pressed={showMinimap}
            aria-label="Toggle roadmap minimap"
            className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 ${
              showMinimap
                ? "bg-[#FFF0C7] border-[#F2B63D] text-[#4C0915]"
                : "bg-white border-[#D8C5B8] text-[#59413F]"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Minimap</span>
          </button>
        </>
      )}

      <div className="inline-flex rounded-xl border border-[#D8C5B8] bg-[#FFF8F0] p-0.5 ml-auto">
        <button
          type="button"
          onClick={() => onChangeViewMode("GRAPH")}
          aria-pressed={viewMode === "GRAPH"}
          className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
            viewMode === "GRAPH"
              ? "bg-[#7A0F1F] text-white"
              : "text-[#59413F] hover:text-[#2B1B1B]"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Graph</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode("LIST")}
          aria-pressed={viewMode === "LIST"}
          className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
            viewMode === "LIST"
              ? "bg-[#7A0F1F] text-white"
              : "text-[#59413F] hover:text-[#2B1B1B]"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Path List</span>
        </button>
      </div>
    </div>
  );
}

function InteractiveRoadmapInner({
  kitId,
  domain,
}: {
  kitId: string;
  domain?: string | null;
}) {
  const [data, setData] = useState<RoadmapViewResponse | null>(null);
  const [resources, setResources] = useState<LearningResourceEntry[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [panelFeedback, setPanelFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [focusSequence, setFocusSequence] = useState(0);
  const [showMinimap, setShowMinimap] = useState(true);
  const [viewMode, setViewMode] = useState<"GRAPH" | "LIST">("GRAPH");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const { fitView } = useReactFlow();

  const pickDefaultTopicId = useCallback((json: RoadmapViewResponse, currentSelected: string | null) => {
    const allTopics = (json.phases || []).flatMap((p) => p.topics);
    if (allTopics.length === 0) return null;

    if (currentSelected && allTopics.some((t) => t.id === currentSelected)) {
      return currentSelected;
    }

    if (typeof window !== "undefined") {
      try {
        const storedId = window.sessionStorage.getItem(`ce_roadmap_topic_${kitId}`);
        if (storedId && allTopics.some((t) => t.id === storedId)) {
          return storedId;
        }
      } catch {}
    }

    const active = allTopics.find((t) => t.status === "IN_PROGRESS");
    if (active) return active.id;

    const firstUnlocked = allTopics.find(
      (t) => t.status !== "COMPLETED" && (t.unmetPrerequisiteIds?.length ?? 0) === 0
    );
    return firstUnlocked?.id ?? allTopics[0].id;
  }, [kitId]);

  const fetchRoadmapAndResources = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      setError(null);
      try {
        const [rmRes, resRes] = await Promise.all([
          fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/roadmap`, {
            credentials: "include",
          }),
          fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/resources`, {
            credentials: "include",
          }),
        ]);
        if (!rmRes.ok) {
          throw new Error("Failed to load interactive roadmap");
        }
        const rmJson = (await rmRes.json()) as RoadmapViewResponse;
        setData(rmJson);

        if (resRes.ok) {
          const rJson = await resRes.json().catch(() => null);
          if (Array.isArray(rJson?.resources)) {
            setResources(rJson.resources);
          }
        }

        const chosenId = pickDefaultTopicId(rmJson, selectedTopicId);
        if (chosenId) {
          setSelectedTopicId(chosenId);
          const matchTopic = rmJson.phases
            .flatMap((p) => p.topics)
            .find((t) => t.id === chosenId);
          if (matchTopic && !isBackgroundRefresh) {
            setNoteDraft(matchTopic.notes || "");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load roadmap");
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [kitId, pickDefaultTopicId, selectedTopicId]
  );

  // Initial mount load (async Promise chain avoids setState synchronously in effect)
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/roadmap`, { credentials: "include" }),
      fetch(`/api/interview-prep/${encodeURIComponent(kitId)}/resources`, { credentials: "include" }),
    ])
      .then(async ([rmRes, resRes]) => {
        if (!rmRes.ok) throw new Error("Failed to load interactive roadmap");
        const rmJson = (await rmRes.json()) as RoadmapViewResponse;
        const rJson = resRes.ok ? await resRes.json().catch(() => null) : null;
        return { rmJson, resourcesList: Array.isArray(rJson?.resources) ? rJson.resources : [] };
      })
      .then(({ rmJson, resourcesList }) => {
        if (cancelled) return;
        setError(null);
        setData(rmJson);
        setResources(resourcesList);
        const chosenId = pickDefaultTopicId(rmJson, null);
        if (chosenId) {
          setSelectedTopicId(chosenId);
          const matchTopic = rmJson.phases
            .flatMap((p) => p.topics)
            .find((t) => t.id === chosenId);
          if (matchTopic) setNoteDraft(matchTopic.notes || "");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load roadmap");
        }
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kitId, pickDefaultTopicId]);

  const lookup = useMemo(() => buildTopicLookup(data?.phases || []), [data?.phases]);

  const selectedEntry = selectedTopicId ? lookup.get(selectedTopicId) ?? null : null;

  const nextRecommendedTopic = useMemo(() => {
    for (const p of data?.phases || []) {
      for (const t of p.topics) {
        const entry = lookup.get(t.id);
        if (entry && t.status !== "COMPLETED" && !entry.isLocked) {
          return t;
        }
      }
    }
    return null;
  }, [data?.phases, lookup]);

  const handleSelectTopic = useCallback(
    (topicId: string, opts?: { focusDetail?: boolean }) => {
      setSelectedTopicId(topicId);
      setPanelFeedback(null);
      const entry = lookup.get(topicId);
      setNoteDraft(entry?.topic.notes || "");
      try {
        window.sessionStorage.setItem(`ce_roadmap_topic_${kitId}`, topicId);
        const url = new URL(window.location.href);
        if (entry?.topic.slug) {
          url.searchParams.set("topic", entry.topic.slug);
          window.history.replaceState({}, "", url.toString());
        }
      } catch {}
      if (opts?.focusDetail !== false) {
        setFocusSequence((n) => n + 1);
        setMobileDetailOpen(true);
      }
    },
    [kitId, lookup]
  );

  const { nodes, edges } = useMemo(
    () =>
      buildRoadmapGraphData({
        phases: data?.phases || [],
        lookup,
        selectedTopicId,
        search,
        priorityFilter,
        phaseFilter,
        onSelectTopic: (tid) => handleSelectTopic(tid, { focusDetail: true }),
      }),
    [data?.phases, lookup, selectedTopicId, search, priorityFilter, phaseFilter, handleSelectTopic]
  );

  const handleActivateStarter = async () => {
    setBusyId("activate");
    setPanelFeedback(null);
    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/roadmap/activate`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Could not activate starter roadmap");
      }
      await fetchRoadmapAndResources(true);
    } catch (err) {
      setPanelFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Activation failed",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateTopic = async (
    topicId: string,
    patch: { status?: string; bookmarked?: boolean; notes?: string | null },
    options?: { feedbackText?: string; focusLearning?: boolean }
  ) => {
    if (busyId) return;
    setBusyId(topicId);
    setPanelFeedback(null);
    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/roadmap/progress`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, ...patch }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to save topic progress");
      }
      try {
        window.sessionStorage.setItem(`ce_roadmap_topic_${kitId}`, topicId);
        window.sessionStorage.setItem(`ce_workspace_tab_${kitId}`, "ROADMAP");
      } catch {}
      await fetchRoadmapAndResources(true);
      setPanelFeedback({
        type: "ok",
        text: options?.feedbackText || "Progress saved",
      });
      if (options?.focusLearning) {
        setFocusSequence((n) => n + 1);
      }
    } catch (err) {
      setPanelFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitExercise = async (
    exerciseId: string,
    payload: { notes: string; artifactUrl?: string | null }
  ) => {
    if (!payload.notes.trim()) {
      setPanelFeedback({
        type: "err",
        text: "Please enter solution notes before submitting the exercise.",
      });
      return false;
    }
    setBusyId(exerciseId);
    setPanelFeedback(null);
    try {
      const res = await fetch(
        `/api/interview-prep/${encodeURIComponent(kitId)}/exercises/${encodeURIComponent(
          exerciseId
        )}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            notes: payload.notes.trim(),
            artifactUrl: payload.artifactUrl || null,
          }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Submission failed");
      await fetchRoadmapAndResources(true);
      setPanelFeedback({
        type: "ok",
        text: "Exercise submitted and saved to your roadmap.",
      });
      return true;
    } catch (err) {
      setPanelFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Submission failed",
      });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleResetFiltersAndView = () => {
    setSearch("");
    setPriorityFilter("ALL");
    setPhaseFilter("ALL");
    void fitView({ padding: 0.14, duration: 200 });
  };

  if (initialLoading) {
    return (
      <div className="bg-white rounded-3xl border border-[#F0DEDA] p-6 text-xs text-[#907D79]">
        Loading interactive roadmap...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-3xl border border-red-200 p-5 text-xs text-red-800 space-y-2">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void fetchRoadmapAndResources(false)}
          className="px-3 py-1.5 rounded-lg bg-white border border-red-300 font-semibold text-red-900"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="bg-white rounded-3xl border border-[#F0DEDA] p-6 space-y-3 shadow-sm">
        <h3 className="font-heading text-base font-bold text-[#2B1B1B]">
          {domain ? `${domain} Starter Roadmap` : "Domain Starter Roadmap"}
        </h3>
        <p className="text-xs text-[#59413F]">
          {data?.reason ||
            data?.message ||
            "Activate a domain-authentic starter pathway with phases, topics, prerequisites, and practical exercises."}
        </p>
        {domain && (
          <button
            type="button"
            disabled={busyId === "activate"}
            onClick={() => void handleActivateStarter()}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-[#F2B63D]" />
            <span>
              {busyId === "activate"
                ? "Activating..."
                : `Activate ${domain} Starter Roadmap`}
            </span>
          </button>
        )}
        {panelFeedback && <p className="text-xs text-red-700">{panelFeedback.text}</p>}
      </div>
    );
  }

  const isStarterPathway = data.phases.length <= 3 && data.stats.totalTopics <= 8;
  const percent = data.stats.percentComplete ?? 0;
  const remainingHours = (data.stats.estimatedRemainingMinutes / 60).toFixed(1);
  const visiblePhases: RoadmapPhaseItem[] =
    phaseFilter === "ALL" ? data.phases : data.phases.filter((p) => p.id === phaseFilter);

  return (
    <div className="space-y-4">
      {/* Progress & Filter Header */}
      <div className="bg-white rounded-2xl border border-[#F0DEDA] p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base sm:text-lg font-bold text-[#2B1B1B]">
                Interactive Learning Roadmap
              </h3>
              <span className="rounded-full bg-[#FFF0C7] px-2.5 py-0.5 text-[11px] font-bold text-[#4C0915]">
                {isStarterPathway
                  ? `Starter Pathway (${data.phases.length} Phases • ${data.stats.totalTopics} Topics)`
                  : `${data.phases.length}-Phase Path`}
              </span>
              {refreshing && (
                <span className="text-[11px] text-[#7A0F1F] font-medium">Updating...</span>
              )}
            </div>
            <p className="text-xs text-[#59413F] mt-1">
              {data.stats.completedTopics} of {data.stats.totalTopics} topics completed ({percent}%)
              {" • "}
              {data.stats.inProgressTopics} active {" • "}~{remainingHours}h remaining
            </p>
          </div>

          {nextRecommendedTopic && (
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => {
                if (nextRecommendedTopic.status === "IN_PROGRESS") {
                  handleSelectTopic(nextRecommendedTopic.id, { focusDetail: true });
                } else {
                  setSelectedTopicId(nextRecommendedTopic.id);
                  setNoteDraft(nextRecommendedTopic.notes || "");
                  void handleUpdateTopic(
                    nextRecommendedTopic.id,
                    { status: "IN_PROGRESS" },
                    { feedbackText: "Started next recommended topic.", focusLearning: true }
                  );
                }
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-[#F2B63D]" />
              <span className="truncate max-w-[220px]">
                {nextRecommendedTopic.status === "IN_PROGRESS" ? "Continue: " : "Start Next: "}
                {nextRecommendedTopic.title}
              </span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Roadmap completion progress"
          className="w-full h-2.5 bg-[#FFF8F0] rounded-full overflow-hidden border border-[#F0DEDA]"
        >
          <div
            className="h-full bg-[#7A0F1F] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Filters & Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#907D79] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roadmap topics..."
              aria-label="Search roadmap topics"
              className="w-full min-h-[38px] rounded-xl border border-[#D8C5B8] pl-9 pr-3 text-xs bg-white"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter topics by priority"
            className="min-h-[38px] rounded-xl border border-[#D8C5B8] px-3 text-xs bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="ESSENTIAL">Essential Only</option>
            <option value="RECOMMENDED">Recommended</option>
            <option value="OPTIONAL">Optional</option>
          </select>
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            aria-label="Filter topics by phase"
            className="min-h-[38px] rounded-xl border border-[#D8C5B8] px-3 text-xs bg-white"
          >
            <option value="ALL">All Phases ({data.phases.length})</option>
            {data.phases.map((p) => (
              <option key={p.id} value={p.id}>
                Phase {p.orderIndex}: {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Graph Controls + Reset View + Phase Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F0DEDA]">
          <GraphCanvasControls
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap((v) => !v)}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />
          <button
            type="button"
            onClick={handleResetFiltersAndView}
            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#D8C5B8] bg-white hover:bg-[#FFF8F0] text-xs font-semibold text-[#59413F] inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#59413F] bg-[#FFF8F0] rounded-xl px-3 py-2 border border-[#F0DEDA]">
          <span className="inline-flex items-center gap-1 font-medium">
            <Lock className="w-3 h-3 text-[#6B5754]" /> Locked
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-white border border-[#D8C5B8]" /> Available
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <Play className="w-3 h-3 text-[#7A0F1F]" /> In Progress
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-[#2E9E5B]" /> Completed
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm border-2 border-[#7A0F1F]" /> Selected
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <Bookmark className="w-3 h-3 fill-[#F2B63D] text-[#7A0F1F]" /> Bookmarked
          </span>
        </div>
      </div>

      {/* Interactive Graph + Detail Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Connected Graph Canvas OR Accessible Mobile/List View */}
        <div className="lg:col-span-7 space-y-3">
          {viewMode === "GRAPH" ? (
            <div
              data-testid="roadmap-graph-canvas"
              className="w-full h-[520px] sm:h-[600px] lg:h-[680px] rounded-2xl border-2 border-[#E6D6CE] bg-[#FFF8F0] overflow-hidden shadow-sm relative"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                onNodeClick={(_event, node) => {
                  if (node.type === "roadmapTopic") {
                    handleSelectTopic(node.id, { focusDetail: true });
                  }
                }}
                fitView
                fitViewOptions={{ padding: 0.14 }}
                minZoom={0.35}
                maxZoom={1.65}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                proOptions={{ hideAttribution: true }}
                className="bg-[#FFF8F0]"
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={18}
                  size={1}
                  color="#D8C5B8"
                />
                {showMinimap && (
                  <MiniMap
                    pannable
                    zoomable
                    style={{ width: 116, height: 82 }}
                    nodeColor={(n) => {
                      if (n.type === "phaseBand") return "#F5DCDD";
                      const st = (n.data as { derivedState?: string })?.derivedState;
                      if (st === "COMPLETED") return "#2E9E5B";
                      if (st === "IN_PROGRESS") return "#7A0F1F";
                      if (st === "LOCKED") return "#CBB9AE";
                      return "#F2B63D";
                    }}
                    className="!bg-white/95 !border !border-[#E6D6CE] !rounded-xl hidden sm:block"
                  />
                )}
              </ReactFlow>
            </div>
          ) : (
            <div className="space-y-3" data-testid="roadmap-path-list">
              {visiblePhases.map((phase) => {
                const filteredTopics = phase.topics.filter((t) => {
                  const pMatch = priorityFilter === "ALL" || t.priority === priorityFilter;
                  const hay = `${t.title} ${t.overview} ${t.subtopics.join(" ")}`.toLowerCase();
                  const sMatch = !search.trim() || hay.includes(search.trim().toLowerCase());
                  return pMatch && sMatch;
                });
                if (filteredTopics.length === 0) return null;

                return (
                  <div
                    key={phase.id}
                    className="bg-white rounded-2xl border border-[#F0DEDA] p-4 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#7A0F1F]">
                          Phase {phase.orderIndex} • ~{phase.estimatedHours}h
                        </span>
                        <h4 className="font-heading text-sm font-bold text-[#2B1B1B]">
                          {phase.title}
                        </h4>
                      </div>
                    </div>
                    <div className="space-y-2 border-l-2 border-[#F2B63D] pl-3">
                      {filteredTopics.map((topic) => {
                        const entry = lookup.get(topic.id);
                        const derivedState = entry?.derivedState ?? "AVAILABLE";
                        const isSelected = selectedTopicId === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => handleSelectTopic(topic.id, { focusDetail: true })}
                            className={`w-full text-left rounded-xl border p-3 transition-colors ${
                              isSelected
                                ? "border-[#7A0F1F] bg-[#FFF8F0] ring-2 ring-[#7A0F1F]/20"
                                : "border-[#E6D6CE] hover:border-[#7A0F1F]/60 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-heading text-xs font-bold text-[#2B1B1B] inline-flex items-center gap-1.5">
                                {derivedState === "COMPLETED" && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E5B]" />
                                )}
                                {derivedState === "LOCKED" && (
                                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                                )}
                                {derivedState === "IN_PROGRESS" && (
                                  <Play className="w-3.5 h-3.5 text-[#7A0F1F]" />
                                )}
                                <span>{topic.title}</span>
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0C7] text-[#4C0915]">
                                {derivedState}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compact Mobile Quick-Select Bar below Canvas */}
          <div className="lg:hidden bg-white rounded-2xl border border-[#F0DEDA] p-3 space-y-2">
            <p className="text-[11px] font-bold text-[#59413F]">Quick Topic Jump</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {visiblePhases.flatMap((p) => p.topics).map((topic) => {
                const active = selectedTopicId === topic.id;
                const st = lookup.get(topic.id)?.derivedState ?? "AVAILABLE";
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopic(topic.id, { focusDetail: true })}
                    className={`min-h-[36px] px-3 py-1 rounded-xl border text-[11px] font-semibold shrink-0 inline-flex items-center gap-1 ${
                      active
                        ? "bg-[#7A0F1F] text-white border-[#7A0F1F]"
                        : "bg-[#FFF8F0] text-[#2B1B1B] border-[#E6D6CE]"
                    }`}
                  >
                    {st === "LOCKED" && <Lock className="w-3 h-3" />}
                    {st === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                    <span>{topic.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Dedicated Sticky Learning Experience Detail Panel (Bottom Sheet/Drawer on Mobile/Tablet) */}
        <div
          className={`lg:col-span-5 lg:sticky lg:top-4 ${
            mobileDetailOpen
              ? "fixed inset-0 z-40 bg-[#2B1B1B]/60 flex items-end sm:items-center justify-center sm:p-4 lg:static lg:z-auto lg:bg-transparent lg:block lg:p-0"
              : "hidden lg:block"
          }`}
        >
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl lg:rounded-none lg:max-h-none lg:overflow-visible bg-[#FFF8F0] lg:bg-transparent p-3 sm:p-0">
            <RoadmapTopicDetail
              entry={selectedEntry}
              lookup={lookup}
              phaseExercises={selectedEntry?.phase.exercises ?? []}
              resources={resources}
              nextTopic={nextRecommendedTopic}
              isStarterPathway={isStarterPathway}
              busyId={busyId}
              panelFeedback={panelFeedback}
              focusSequence={focusSequence}
              noteDraft={noteDraft}
              onChangeNoteDraft={setNoteDraft}
              onSelectTopic={handleSelectTopic}
              onUpdateTopic={handleUpdateTopic}
              onSubmitExercise={handleSubmitExercise}
              onCloseMobileDrawer={() => setMobileDetailOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function InteractiveRoadmap({
  kitId,
  domain,
}: {
  kitId: string;
  domain?: string | null;
}) {
  return (
    <ReactFlowProvider>
      <InteractiveRoadmapInner kitId={kitId} domain={domain} />
    </ReactFlowProvider>
  );
}
