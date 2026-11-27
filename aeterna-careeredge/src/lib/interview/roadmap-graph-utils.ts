// src/lib/interview/roadmap-graph-utils.ts
// Pure graph transformation & topological layout helpers for the Interactive Roadmap Graph.

import { MarkerType, type Edge, type Node } from "@xyflow/react";

export interface RoadmapTopicItem {
  id: string;
  slug: string;
  orderIndex?: number;
  title: string;
  overview: string;
  whyItMatters?: string;
  difficulty: string;
  estimatedMinutes: number;
  priority: string;
  subtopics: string[];
  learningOutcomes: string[];
  completionCriteria: string[];
  practicePrompts: string[];
  prerequisiteTopicIds: string[];
  unmetPrerequisiteIds?: string[];
  status: string;
  bookmarked: boolean;
  notes: string | null;
  completedAt: string | null;
}

export interface RoadmapExerciseItem {
  id: string;
  topicId?: string | null;
  title: string;
  objective: string;
  skillsPracticed?: string[];
  requirements?: string[];
  expectedOutput: string;
  checklist?: string[];
  difficulty: string;
  estimatedMinutes: number;
  submissionStatus?: string;
  submissionNotes?: string | null;
  artifactUrl?: string | null;
}

export interface RoadmapPhaseItem {
  id: string;
  orderIndex: number;
  title: string;
  description: string | null;
  estimatedHours: number;
  topics: RoadmapTopicItem[];
  exercises: RoadmapExerciseItem[];
}

export interface RoadmapViewResponse {
  available: boolean;
  reason?: string;
  message?: string;
  roadmap?: {
    id: string;
    slug: string;
    title: string;
    domain: string;
    versionId: string;
    versionNumber: number;
  };
  stats: {
    totalTopics: number;
    completedTopics: number;
    inProgressTopics: number;
    percentComplete: number;
    estimatedRemainingMinutes: number;
  };
  phases: RoadmapPhaseItem[];
}

export type DerivedTopicState =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NEEDS_REVISION";

export interface TopicLookupEntry {
  topic: RoadmapTopicItem;
  phase: RoadmapPhaseItem;
  isLocked: boolean;
  derivedState: DerivedTopicState;
  unmetPrerequisites: RoadmapTopicItem[];
  allPrerequisites: RoadmapTopicItem[];
}

export interface TopicNodeData extends Record<string, unknown> {
  topic: RoadmapTopicItem;
  phaseOrder: number;
  phaseTitle: string;
  derivedState: DerivedTopicState;
  isSelected: boolean;
  unmetPrereqCount: number;
  prereqCount: number;
  isDimmed: boolean;
  onSelectTopic: (topicId: string) => void;
}

export interface PhaseBandNodeData extends Record<string, unknown> {
  orderIndex: number;
  title: string;
  description: string | null;
  estimatedHours: number;
  completedCount: number;
  totalCount: number;
  bandWidth: number;
}

export function buildTopicLookup(phases: RoadmapPhaseItem[]): Map<string, TopicLookupEntry> {
  const byId = new Map<string, { topic: RoadmapTopicItem; phase: RoadmapPhaseItem }>();
  const completedIds = new Set<string>();

  for (const phase of phases) {
    for (const topic of phase.topics) {
      byId.set(topic.id, { topic, phase });
      if (topic.status === "COMPLETED") {
        completedIds.add(topic.id);
      }
    }
  }

  const lookup = new Map<string, TopicLookupEntry>();
  for (const [id, entry] of byId.entries()) {
    const allPrerequisites = entry.topic.prerequisiteTopicIds
      .map((pid) => byId.get(pid)?.topic)
      .filter((t): t is RoadmapTopicItem => Boolean(t));
    const unmetPrerequisites = allPrerequisites.filter((t) => !completedIds.has(t.id));
    const isCompleted = entry.topic.status === "COMPLETED";
    const isLocked = !isCompleted && unmetPrerequisites.length > 0;

    let derivedState: DerivedTopicState = "AVAILABLE";
    if (isCompleted) derivedState = "COMPLETED";
    else if (isLocked) derivedState = "LOCKED";
    else if (entry.topic.status === "IN_PROGRESS") derivedState = "IN_PROGRESS";
    else if (entry.topic.status === "NEEDS_REVISION") derivedState = "NEEDS_REVISION";

    lookup.set(id, {
      topic: entry.topic,
      phase: entry.phase,
      isLocked,
      derivedState,
      unmetPrerequisites,
      allPrerequisites,
    });
  }

  return lookup;
}

/**
 * Generates layered DAG React Flow nodes (phase headers + topic nodes) and directed prerequisite edges.
 * Preserves parallel branches side-by-side within each phase while flowing sequentially top-to-bottom.
 */
export function buildRoadmapGraphData(params: {
  phases: RoadmapPhaseItem[];
  lookup: Map<string, TopicLookupEntry>;
  selectedTopicId: string | null;
  search: string;
  priorityFilter: string;
  phaseFilter: string;
  onSelectTopic: (topicId: string) => void;
}): {
  nodes: Node[];
  edges: Edge[];
  visibleTopicIds: Set<string>;
} {
  const { phases, lookup, selectedTopicId, search, priorityFilter, phaseFilter, onSelectTopic } =
    params;

  const q = search.trim().toLowerCase();
  const visiblePhases =
    phaseFilter === "ALL" ? phases : phases.filter((p) => p.id === phaseFilter);

  const visibleTopicIds = new Set<string>();
  const matchingTopicIds = new Set<string>();

  for (const phase of visiblePhases) {
    for (const topic of phase.topics) {
      visibleTopicIds.add(topic.id);
      const priorityMatch = priorityFilter === "ALL" || topic.priority === priorityFilter;
      const hay = `${topic.title} ${topic.overview} ${topic.subtopics.join(" ")}`.toLowerCase();
      const searchMatch = !q || hay.includes(q);
      if (priorityMatch && searchMatch) {
        matchingTopicIds.add(topic.id);
      }
    }
  }

  const NODE_W = 248;
  const NODE_H = 128;
  const COL_GAP = 36;
  const ROW_GAP = 54;
  const PHASE_HEADER_H = 68;
  const PHASE_PADDING_BOTTOM = 42;
  const CANVAS_CENTER_X = 480;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let cursorY = 16;

  for (const phase of visiblePhases) {
    const phaseTopicIds = new Set(phase.topics.map((t) => t.id));
    // Compute intra-phase topological layer so dependent topics sit below their phase prerequisites,
    // while independent/parallel topics sit in side-by-side columns.
    const layerOf = new Map<string, number>();
    const computeLayer = (topicId: string, stack = new Set<string>()): number => {
      if (layerOf.has(topicId)) return layerOf.get(topicId)!;
      if (stack.has(topicId)) return 0;
      const nextStack = new Set(stack);
      nextStack.add(topicId);
      const entry = lookup.get(topicId);
      if (!entry) return 0;
      const intraPrereqs = entry.topic.prerequisiteTopicIds.filter((pid) => phaseTopicIds.has(pid));
      const depth =
        intraPrereqs.length === 0
          ? 0
          : Math.max(...intraPrereqs.map((pid) => computeLayer(pid, nextStack))) + 1;
      layerOf.set(topicId, depth);
      return depth;
    };

    const byLayer = new Map<number, RoadmapTopicItem[]>();
    for (const topic of phase.topics) {
      const layer = computeLayer(topic.id);
      const list = byLayer.get(layer) || [];
      list.push(topic);
      byLayer.set(layer, list);
    }

    const sortedLayers = Array.from(byLayer.keys()).sort((a, b) => a - b);
    const maxCols = Math.max(1, ...Array.from(byLayer.values()).map((l) => l.length));
    const bandWidth = Math.max(580, maxCols * NODE_W + (maxCols - 1) * COL_GAP + 80);

    const completedInPhase = phase.topics.filter((t) => t.status === "COMPLETED").length;

    nodes.push({
      id: `phase-band-${phase.id}`,
      type: "phaseBand",
      position: { x: CANVAS_CENTER_X - bandWidth / 2, y: cursorY },
      draggable: false,
      selectable: false,
      focusable: false,
      data: {
        orderIndex: phase.orderIndex,
        title: phase.title,
        description: phase.description,
        estimatedHours: phase.estimatedHours,
        completedCount: completedInPhase,
        totalCount: phase.topics.length,
        bandWidth,
      } satisfies PhaseBandNodeData,
      style: { width: bandWidth, zIndex: 0 },
    });

    cursorY += PHASE_HEADER_H + 18;

    for (const layerIdx of sortedLayers) {
      const rowTopics = byLayer.get(layerIdx) || [];
      const rowWidth = rowTopics.length * NODE_W + (rowTopics.length - 1) * COL_GAP;
      const startX = CANVAS_CENTER_X - rowWidth / 2;

      rowTopics.forEach((topic, colIdx) => {
        const entry = lookup.get(topic.id);
        const derivedState = entry?.derivedState ?? "AVAILABLE";
        const unmetPrereqCount = entry?.unmetPrerequisites.length ?? 0;
        const isDimmed = (Boolean(q) || priorityFilter !== "ALL") && !matchingTopicIds.has(topic.id);

        nodes.push({
          id: topic.id,
          type: "roadmapTopic",
          position: {
            x: startX + colIdx * (NODE_W + COL_GAP),
            y: cursorY,
          },
          draggable: false,
          selected: selectedTopicId === topic.id,
          data: {
            topic,
            phaseOrder: phase.orderIndex,
            phaseTitle: phase.title,
            derivedState,
            isSelected: selectedTopicId === topic.id,
            unmetPrereqCount,
            prereqCount: topic.prerequisiteTopicIds.length,
            isDimmed,
            onSelectTopic,
          } satisfies TopicNodeData,
          style: { width: NODE_W, zIndex: 2 },
        });
      });

      cursorY += NODE_H + ROW_GAP;
    }

    cursorY += PHASE_PADDING_BOTTOM;
  }

  // Create edges from real prerequisite relationships
  for (const phase of visiblePhases) {
    for (const topic of phase.topics) {
      for (const prereqId of topic.prerequisiteTopicIds) {
        if (!visibleTopicIds.has(prereqId)) continue;
        const prereqEntry = lookup.get(prereqId);
        const prereqCompleted = prereqEntry?.topic.status === "COMPLETED";
        const touchesSelected = selectedTopicId === topic.id || selectedTopicId === prereqId;

        const stroke = touchesSelected
          ? "#7A0F1F"
          : prereqCompleted
          ? "#2E9E5B"
          : "#B9A398";

        edges.push({
          id: `edge-${prereqId}->${topic.id}`,
          source: prereqId,
          target: topic.id,
          type: "smoothstep",
          animated: touchesSelected && !prereqCompleted,
          style: {
            stroke,
            strokeWidth: touchesSelected ? 2.5 : prereqCompleted ? 2 : 1.5,
            strokeDasharray: prereqCompleted || touchesSelected ? undefined : "5 4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
            width: 16,
            height: 16,
          },
          ariaLabel: `${prereqEntry?.topic.title || "Prerequisite"} prerequisite for ${topic.title}`,
        });
      }
    }
  }

  return { nodes, edges, visibleTopicIds };
}
