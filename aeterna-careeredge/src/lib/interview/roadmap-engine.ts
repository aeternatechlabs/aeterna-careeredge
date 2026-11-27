// src/lib/interview/roadmap-engine.ts
// Multi-Domain Roadmap Engine, DAG Cycle Guard, Template Seeding & Kit Progress (Phase 3)
// All DB operations use sequential db-proxy-compatible calls (zero $transaction / nested writes).

import { db } from "@/lib/db";
import {
  requireOwnedEvidenceItem,
  requireOwnedKit,
} from "./ownership";
import {
  FULL_STACK_PHASES,
  FULL_STACK_ROADMAP_META,
} from "./templates/full-stack-developer";
import { getDomainRoadmapTemplate } from "./templates/domain-roadmaps";
import { sanitizeMultilineText, sanitizeText } from "./validation";

export const VALID_TOPIC_STATUSES = [
  "NOT_STARTED",
  "AVAILABLE",
  "IN_PROGRESS",
  "COMPLETED",
  "NEEDS_REVISION",
] as const;

export type TopicProgressStatus = (typeof VALID_TOPIC_STATUSES)[number];

export const VALID_EXERCISE_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export type ExerciseSubmissionStatus = (typeof VALID_EXERCISE_STATUSES)[number];

export interface PrerequisiteEdge {
  topicId: string;
  prerequisiteTopicId: string;
}

/**
 * Pure DAG cycle detector.
 * Returns true if adding edge (topicId -> prerequisiteTopicId) creates a self-loop or cycle.
 */
export function wouldCreatePrerequisiteCycle(
  existingEdges: PrerequisiteEdge[],
  topicId: string,
  prerequisiteTopicId: string
): boolean {
  if (!topicId || !prerequisiteTopicId) return true;
  if (topicId === prerequisiteTopicId) return true;

  // Build adjacency: node -> its prerequisites
  const adj = new Map<string, string[]>();
  for (const edge of existingEdges) {
    const list = adj.get(edge.topicId) || [];
    list.push(edge.prerequisiteTopicId);
    adj.set(edge.topicId, list);
  }

  // If topicId is reachable from prerequisiteTopicId, adding (topicId -> prerequisiteTopicId) forms a cycle.
  const visited = new Set<string>();
  const stack = [prerequisiteTopicId];
  while (stack.length > 0) {
    const curr = stack.pop()!;
    if (curr === topicId) return true;
    if (visited.has(curr)) continue;
    visited.add(curr);
    for (const next of adj.get(curr) || []) {
      if (!visited.has(next)) stack.push(next);
    }
  }
  return false;
}

/**
 * Safely insert a RoadmapPrerequisite edge after checking for self-loops and cycles.
 */
export async function addPrerequisiteEdge(
  topicId: string,
  prerequisiteTopicId: string,
  existingEdges?: PrerequisiteEdge[]
) {
  const edges =
    existingEdges ??
    (await db.roadmapPrerequisite.findMany({
      select: { topicId: true, prerequisiteTopicId: true },
    }));

  if (wouldCreatePrerequisiteCycle(edges, topicId, prerequisiteTopicId)) {
    throw new Error(
      `Cannot add prerequisite edge (${topicId} -> ${prerequisiteTopicId}): would create a self-loop or cycle.`
    );
  }

  return db.roadmapPrerequisite.create({
    data: { topicId, prerequisiteTopicId },
  });
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

let fullStackSeeded = false;

/**
 * Idempotently seed the published Full-Stack Developer roadmap template (v1).
 * Uses sequential db-proxy-compatible calls.
 */
export async function ensureFullStackDeveloperRoadmapSeeded(): Promise<{
  roadmapId: string;
  versionId: string;
  phasesCount: number;
  topicsCount: number;
  exercisesCount: number;
}> {
  const existingRoadmap = await db.careerRoadmap.findUnique({
    where: { slug: FULL_STACK_ROADMAP_META.slug },
  });

  if (existingRoadmap) {
    const existingVersion = await db.roadmapVersion.findFirst({
      where: { roadmapId: existingRoadmap.id, status: "PUBLISHED" },
      orderBy: { versionNumber: "desc" },
    });
    if (existingVersion) {
      const phases = await db.roadmapPhase.findMany({
        where: { versionId: existingVersion.id },
      });
      if (phases.length >= FULL_STACK_PHASES.length) {
        fullStackSeeded = true;
        return {
          roadmapId: existingRoadmap.id,
          versionId: existingVersion.id,
          phasesCount: phases.length,
          topicsCount: FULL_STACK_PHASES.reduce((a, p) => a + p.topics.length, 0),
          exercisesCount: FULL_STACK_PHASES.length,
        };
      }
    }
  }

  const roadmap =
    existingRoadmap ??
    (await db.careerRoadmap.create({
      data: {
        slug: FULL_STACK_ROADMAP_META.slug,
        domain: FULL_STACK_ROADMAP_META.domain,
        roleTitle: FULL_STACK_ROADMAP_META.roleTitle,
        description: FULL_STACK_ROADMAP_META.description,
        isPublished: true,
      },
    }));

  const existingVersion = await db.roadmapVersion.findFirst({
    where: { roadmapId: roadmap.id, versionNumber: FULL_STACK_ROADMAP_META.versionNumber },
  });

  const version =
    existingVersion ??
    (await db.roadmapVersion.create({
      data: {
        roadmapId: roadmap.id,
        versionNumber: FULL_STACK_ROADMAP_META.versionNumber,
        status: "PUBLISHED",
        notes: "Initial curated 10-phase Full-Stack Developer template",
        publishedAt: new Date(),
      },
    }));

  const slugToTopicId = new Map<string, string>();
  const pendingPrereqs: Array<{ topicId: string; prereqSlug: string }> = [];
  let phasesCount = 0;
  let topicsCount = 0;
  let exercisesCount = 0;

  for (const phaseDef of FULL_STACK_PHASES) {
    const phase = await db.roadmapPhase.create({
      data: {
        versionId: version.id,
        orderIndex: phaseDef.orderIndex,
        title: phaseDef.title,
        description: phaseDef.description,
        estimatedHours: phaseDef.estimatedHours,
      },
    });
    phasesCount++;

    for (let tIdx = 0; tIdx < phaseDef.topics.length; tIdx++) {
      const tDef = phaseDef.topics[tIdx];
      const topic = await db.roadmapTopic.create({
        data: {
          phaseId: phase.id,
          slug: tDef.slug,
          orderIndex: tIdx + 1,
          title: tDef.title,
          overview: tDef.overview,
          whyItMatters: tDef.whyItMatters,
          difficulty: tDef.difficulty,
          priority: tDef.priority,
          estimatedMinutes: tDef.estimatedMinutes,
          subtopicsJson: JSON.stringify(tDef.subtopics),
          learningOutcomesJson: JSON.stringify(tDef.learningOutcomes),
          completionCriteriaJson: JSON.stringify(tDef.completionCriteria),
          practicePromptsJson: JSON.stringify(tDef.practicePrompts),
        },
      });
      topicsCount++;
      slugToTopicId.set(tDef.slug, topic.id);

      for (const prereqSlug of tDef.prerequisiteSlugs) {
        pendingPrereqs.push({ topicId: topic.id, prereqSlug });
      }
    }

    const exDef = phaseDef.exercise;
    await db.practiceExercise.create({
      data: {
        phaseId: phase.id,
        topicId: exDef.topicSlug ? slugToTopicId.get(exDef.topicSlug) ?? null : null,
        title: exDef.title,
        objective: exDef.objective,
        skillsPracticedJson: JSON.stringify(exDef.skillsPracticed),
        requirementsJson: JSON.stringify(exDef.requirements),
        expectedOutput: exDef.expectedOutput,
        checklistJson: JSON.stringify(exDef.checklist),
        difficulty: exDef.difficulty,
        estimatedMinutes: exDef.estimatedMinutes,
      },
    });
    exercisesCount++;
  }

  // Insert prerequisite edges with in-memory DAG cycle verification
  const createdEdges: PrerequisiteEdge[] = [];
  for (const item of pendingPrereqs) {
    const prereqId = slugToTopicId.get(item.prereqSlug);
    if (!prereqId) continue;
    if (wouldCreatePrerequisiteCycle(createdEdges, item.topicId, prereqId)) {
      throw new Error(`Template cycle detected: ${item.topicId} -> ${prereqId}`);
    }
    await db.roadmapPrerequisite.create({
      data: { topicId: item.topicId, prerequisiteTopicId: prereqId },
    });
    createdEdges.push({ topicId: item.topicId, prerequisiteTopicId: prereqId });
  }

  fullStackSeeded = true;
  return {
    roadmapId: roadmap.id,
    versionId: version.id,
    phasesCount,
    topicsCount,
    exercisesCount,
  };
}

function isTechFullStackKit(domain?: string | null, jobTitle?: string | null): boolean {
  const d = (domain || "").toLowerCase();
  const r = (jobTitle || "").toLowerCase();
  const isCsDomain =
    d.includes("computer science") ||
    d.includes("information technology") ||
    d === "tech" ||
    d.includes("software");
  const isNonProgrammingRole =
    r.includes("nurse") ||
    r.includes("doctor") ||
    r.includes("accountant") ||
    r.includes("teacher") ||
    r.includes("advocate") ||
    r.includes("legal") ||
    r.includes("architect");
  if (isNonProgrammingRole) return false;
  if (isCsDomain) return true;
  return (
    r.includes("full stack") ||
    r.includes("full-stack") ||
    r.includes("software") ||
    r.includes("web developer") ||
    r.includes("frontend") ||
    r.includes("backend")
  );
}

export async function attachRoadmapToKit(kitId: string, userId: string): Promise<string | null> {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) return null;
  if (kit.activeRoadmapVersionId) return kit.activeRoadmapVersionId;

  if (!isTechFullStackKit(kit.domain, kit.jobTitle)) {
    // Do not force a software engineering roadmap onto non-IT professions
    return null;
  }

  if (!fullStackSeeded) {
    await ensureFullStackDeveloperRoadmapSeeded();
  }

  const roadmap = await db.careerRoadmap.findUnique({
    where: { slug: FULL_STACK_ROADMAP_META.slug },
  });
  if (!roadmap) return null;

  const version = await db.roadmapVersion.findFirst({
    where: { roadmapId: roadmap.id, status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  });
  if (!version) return null;

  await db.interviewPrepKit.update({
    where: { id: kit.id },
    data: { activeRoadmapVersionId: version.id },
  });

  return version.id;
}

export interface KitRoadmapView {
  available: boolean;
  reason?: string;
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
  phases: Array<{
    id: string;
    orderIndex: number;
    title: string;
    description: string | null;
    estimatedHours: number;
    topics: Array<{
      id: string;
      slug: string;
      orderIndex: number;
      title: string;
      overview: string;
      whyItMatters: string;
      difficulty: string;
      priority: string;
      estimatedMinutes: number;
      subtopics: string[];
      learningOutcomes: string[];
      completionCriteria: string[];
      practicePrompts: string[];
      prerequisiteTopicIds: string[];
      unmetPrerequisiteIds: string[];
      status: TopicProgressStatus;
      bookmarked: boolean;
      notes: string | null;
      completedAt: string | null;
      isHighlightedMatch: boolean;
    }>;
    exercises: Array<{
      id: string;
      topicId: string | null;
      title: string;
      objective: string;
      skillsPracticed: string[];
      requirements: string[];
      expectedOutput: string;
      checklist: string[];
      difficulty: string;
      estimatedMinutes: number;
      submissionStatus: ExerciseSubmissionStatus;
      submissionNotes: string | null;
      artifactUrl: string | null;
      evidenceItemId: string | null;
    }>;
  }>;
}

export async function getKitRoadmapView(
  kitId: string,
  userId: string
): Promise<KitRoadmapView | null> {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) return null;

  const versionId = kit.activeRoadmapVersionId || (await attachRoadmapToKit(kitId, userId));
  if (!versionId) {
    return {
      available: false,
      reason: `A published roadmap template for "${kit.domain || kit.jobTitle}" is not yet populated. Your custom intake preferences and Proof Bank questions remain active.`,
      stats: {
        totalTopics: 0,
        completedTopics: 0,
        inProgressTopics: 0,
        percentComplete: 0,
        estimatedRemainingMinutes: 0,
      },
      phases: [],
    };
  }

  const version = await db.roadmapVersion.findUnique({
    where: { id: versionId },
    include: { roadmap: true },
  });
  if (!version || !version.roadmap) {
    return {
      available: false,
      reason: "Attached roadmap version could not be found.",
      stats: {
        totalTopics: 0,
        completedTopics: 0,
        inProgressTopics: 0,
        percentComplete: 0,
        estimatedRemainingMinutes: 0,
      },
      phases: [],
    };
  }

  const [phases, progressRows, submissionRows] = await Promise.all([
    db.roadmapPhase.findMany({
      where: { versionId: version.id },
      orderBy: { orderIndex: "asc" },
    }),
    db.studentRoadmapProgress.findMany({
      where: { userId, kitId: kit.id },
    }),
    db.practiceSubmission.findMany({
      where: { userId, kitId: kit.id },
    }),
  ]);

  const phaseIds = phases.map((p) => p.id);
  const [allTopics, allExercises] =
    phaseIds.length > 0
      ? await Promise.all([
          db.roadmapTopic.findMany({
            where: { phaseId: { in: phaseIds } },
            orderBy: { orderIndex: "asc" },
          }),
          db.practiceExercise.findMany({
            where: { phaseId: { in: phaseIds } },
          }),
        ])
      : [[], []];

  const topicIds = allTopics.map((t) => t.id);
  const allPrereqs =
    topicIds.length > 0
      ? await db.roadmapPrerequisite.findMany({
          where: { topicId: { in: topicIds } },
        })
      : [];

  const progressMap = new Map(progressRows.map((p) => [p.topicId, p]));
  const submissionMap = new Map(submissionRows.map((s) => [s.exerciseId, s]));
  const prereqsByTopic = new Map<string, string[]>();
  for (const edge of allPrereqs) {
    const list = prereqsByTopic.get(edge.topicId) || [];
    list.push(edge.prerequisiteTopicId);
    prereqsByTopic.set(edge.topicId, list);
  }

  // Personalization keywords from Passport & Focus Areas
  const highlightTokens = new Set<string>();
  if (kit.useCareerPassport && kit.passportContextJson) {
    try {
      const pCtx = JSON.parse(kit.passportContextJson) as { skills?: string[] };
      for (const s of pCtx.skills || []) highlightTokens.add(s.toLowerCase());
    } catch {}
  }
  if (kit.focusAreasJson) {
    try {
      const fCtx = JSON.parse(kit.focusAreasJson) as { priorityAreas?: string[]; difficultTopics?: string[] };
      for (const s of [...(fCtx.priorityAreas || []), ...(fCtx.difficultTopics || [])]) {
        highlightTokens.add(s.toLowerCase());
      }
    } catch {}
  }

  let totalTopics = 0;
  let completedTopics = 0;
  let inProgressTopics = 0;
  let estimatedRemainingMinutes = 0;

  const builtPhases = phases.map((phase) => {
    const phaseTopics = allTopics
      .filter((t) => t.phaseId === phase.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((topic) => {
        totalTopics++;
        const prog = progressMap.get(topic.id);
        const prereqIds = prereqsByTopic.get(topic.id) || [];
        const unmetPrerequisiteIds = prereqIds.filter(
          (pid) => progressMap.get(pid)?.status !== "COMPLETED"
        );
        const rawStatus = (prog?.status || (unmetPrerequisiteIds.length === 0 ? "AVAILABLE" : "NOT_STARTED")) as TopicProgressStatus;

        if (rawStatus === "COMPLETED") {
          completedTopics++;
        } else {
          if (rawStatus === "IN_PROGRESS") inProgressTopics++;
          estimatedRemainingMinutes += topic.estimatedMinutes;
        }

        const titleLower = topic.title.toLowerCase();
        const isHighlightedMatch = Array.from(highlightTokens).some(
          (tok) => tok.length >= 2 && titleLower.includes(tok)
        );

        const completedAtVal = prog?.completedAt as unknown;
        const completedAtIso = !completedAtVal
          ? null
          : typeof completedAtVal === "string"
          ? completedAtVal
          : completedAtVal instanceof Date
          ? completedAtVal.toISOString()
          : null;

        return {
          id: topic.id,
          slug: topic.slug,
          orderIndex: topic.orderIndex,
          title: topic.title,
          overview: topic.overview,
          whyItMatters: topic.whyItMatters,
          difficulty: topic.difficulty,
          priority: topic.priority,
          estimatedMinutes: topic.estimatedMinutes,
          subtopics: safeParseArray(topic.subtopicsJson),
          learningOutcomes: safeParseArray(topic.learningOutcomesJson),
          completionCriteria: safeParseArray(topic.completionCriteriaJson),
          practicePrompts: safeParseArray(topic.practicePromptsJson),
          prerequisiteTopicIds: prereqIds,
          unmetPrerequisiteIds,
          status: rawStatus,
          bookmarked: Boolean(prog?.bookmarked),
          notes: prog?.notes ?? null,
          completedAt: completedAtIso,
          isHighlightedMatch,
        };
      });

    const phaseExercises = allExercises
      .filter((e) => e.phaseId === phase.id)
      .map((ex) => {
        const sub = submissionMap.get(ex.id);
        return {
          id: ex.id,
          topicId: ex.topicId ?? null,
          title: ex.title,
          objective: ex.objective,
          skillsPracticed: safeParseArray(ex.skillsPracticedJson),
          requirements: safeParseArray(ex.requirementsJson),
          expectedOutput: ex.expectedOutput,
          checklist: safeParseArray(ex.checklistJson),
          difficulty: ex.difficulty,
          estimatedMinutes: ex.estimatedMinutes,
          submissionStatus: (sub?.status || "NOT_STARTED") as ExerciseSubmissionStatus,
          submissionNotes: sub?.notes ?? null,
          artifactUrl: sub?.artifactUrl ?? null,
          evidenceItemId: sub?.evidenceItemId ?? null,
        };
      });

    return {
      id: phase.id,
      orderIndex: phase.orderIndex,
      title: phase.title,
      description: phase.description ?? null,
      estimatedHours: phase.estimatedHours,
      topics: phaseTopics,
      exercises: phaseExercises,
    };
  });

  const percentComplete =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return {
    available: true,
    roadmap: {
      id: version.roadmap.id,
      slug: version.roadmap.slug,
      title: version.roadmap.roleTitle,
      domain: version.roadmap.domain,
      versionId: version.id,
      versionNumber: version.versionNumber,
    },
    stats: {
      totalTopics,
      completedTopics,
      inProgressTopics,
      percentComplete,
      estimatedRemainingMinutes,
    },
    phases: builtPhases,
  };
}

export async function updateTopicProgress(params: {
  userId: string;
  kitId: string;
  topicId: string;
  status?: TopicProgressStatus;
  bookmarked?: boolean;
  notes?: string | null;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const topic = await db.roadmapTopic.findUnique({ where: { id: params.topicId } });
  if (!topic) {
    return { ok: false as const, status: 404, error: "Roadmap topic not found" };
  }

  if (params.status && !(VALID_TOPIC_STATUSES as readonly string[]).includes(params.status)) {
    return { ok: false as const, status: 400, error: "Invalid topic progress status" };
  }

  if (params.status === "COMPLETED") {
    const prereqs = await db.roadmapPrerequisite.findMany({
      where: { topicId: topic.id },
    });
    if (prereqs.length > 0) {
      const prereqIds = prereqs.map((p) => p.prerequisiteTopicId);
      const completedRows = await db.studentRoadmapProgress.findMany({
        where: {
          userId: params.userId,
          kitId: kit.id,
          topicId: { in: prereqIds },
          status: "COMPLETED",
        },
      });
      const completedSet = new Set(completedRows.map((r) => r.topicId));
      const missingIds = prereqIds.filter((id) => !completedSet.has(id));
      if (missingIds.length > 0) {
        return {
          ok: false as const,
          status: 409,
          error: "Complete prerequisite topics before marking this topic completed.",
        };
      }
    }
  }

  const existing = await db.studentRoadmapProgress.findUnique({
    where: {
      userId_kitId_topicId: {
        userId: params.userId,
        kitId: kit.id,
        topicId: topic.id,
      },
    },
  });

  const nextStatus = params.status ?? (existing?.status as TopicProgressStatus) ?? "IN_PROGRESS";
  const nextBookmarked =
    typeof params.bookmarked === "boolean" ? params.bookmarked : Boolean(existing?.bookmarked);
  const nextNotes =
    params.notes !== undefined
      ? params.notes === null
        ? null
        : sanitizeMultilineText(params.notes, 4000)
      : existing?.notes ?? null;
  const nextCompletedAt =
    nextStatus === "COMPLETED" ? existing?.completedAt ?? new Date() : null;

  const saved = await db.studentRoadmapProgress.upsert({
    where: {
      userId_kitId_topicId: {
        userId: params.userId,
        kitId: kit.id,
        topicId: topic.id,
      },
    },
    create: {
      userId: params.userId,
      kitId: kit.id,
      topicId: topic.id,
      status: nextStatus,
      bookmarked: nextBookmarked,
      notes: nextNotes,
      completedAt: nextCompletedAt,
    },
    update: {
      status: nextStatus,
      bookmarked: nextBookmarked,
      notes: nextNotes,
      completedAt: nextCompletedAt,
    },
  });

  return { ok: true as const, progress: saved };
}

export async function submitPracticeExercise(params: {
  userId: string;
  kitId: string;
  exerciseId: string;
  status: ExerciseSubmissionStatus;
  notes?: string | null;
  artifactUrl?: string | null;
  evidenceItemId?: string | null;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const exercise = await db.practiceExercise.findUnique({ where: { id: params.exerciseId } });
  if (!exercise) {
    return { ok: false as const, status: 404, error: "Practice exercise not found" };
  }

  if (!(VALID_EXERCISE_STATUSES as readonly string[]).includes(params.status)) {
    return { ok: false as const, status: 400, error: "Invalid exercise submission status" };
  }

  // Enforce ownership of any linked Evidence Vault artifact
  let verifiedEvidenceId: string | null = null;
  if (params.evidenceItemId) {
    const cleanId = sanitizeText(params.evidenceItemId, 100);
    const ownedEvidence = await requireOwnedEvidenceItem(cleanId, params.userId);
    if (!ownedEvidence) {
      return {
        ok: false as const,
        status: 403,
        error: "Referenced Evidence Vault item not found or unauthorized.",
      };
    }
    verifiedEvidenceId = ownedEvidence.id;
  }

  let safeUrl: string | null = null;
  if (params.artifactUrl && params.artifactUrl.trim()) {
    try {
      const parsed = new URL(params.artifactUrl.trim());
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { ok: false as const, status: 400, error: "Artifact URL must use http or https." };
      }
      safeUrl = parsed.toString().slice(0, 500);
    } catch {
      return { ok: false as const, status: 400, error: "Invalid artifact URL." };
    }
  }

  const cleanNotes = params.notes ? sanitizeMultilineText(params.notes, 4000) : null;
  const completedAt = params.status === "COMPLETED" ? new Date() : null;

  const submission = await db.practiceSubmission.upsert({
    where: {
      userId_kitId_exerciseId: {
        userId: params.userId,
        kitId: kit.id,
        exerciseId: exercise.id,
      },
    },
    create: {
      userId: params.userId,
      kitId: kit.id,
      exerciseId: exercise.id,
      status: params.status,
      notes: cleanNotes,
      artifactUrl: safeUrl,
      evidenceItemId: verifiedEvidenceId,
      completedAt,
    },
    update: {
      status: params.status,
      notes: cleanNotes,
      artifactUrl: safeUrl,
      evidenceItemId: verifiedEvidenceId,
      completedAt,
    },
  });

  return { ok: true as const, submission };
}

/**
 * Seeds and attaches a domain-authentic starter roadmap for any of the 17 supported domains
 * when explicitly activated by the student (preserves non-IT isolation for auto-attachment).
 */
export async function activateDomainStarterRoadmap(
  kitId: string,
  userId: string
): Promise<
  | { ok: true; versionId: string }
  | { ok: false; status: number; error: string }
> {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) {
    return { ok: false, status: 404, error: "Interview kit not found" };
  }

  if (kit.activeRoadmapVersionId) {
    return { ok: true, versionId: kit.activeRoadmapVersionId };
  }

  if (isTechFullStackKit(kit.domain, kit.jobTitle)) {
    const versionId = await attachRoadmapToKit(kit.id, userId);
    if (!versionId) {
      return { ok: false, status: 500, error: "Failed to attach roadmap" };
    }
    return { ok: true, versionId };
  }

  const template = getDomainRoadmapTemplate(kit.domain, kit.jobTitle);
  if (!template) {
    return { ok: false, status: 400, error: "No domain template available for this kit" };
  }

  let roadmap = await db.careerRoadmap.findUnique({ where: { slug: template.slug } });
  if (!roadmap) {
    roadmap = await db.careerRoadmap.create({
      data: {
        slug: template.slug,
        domain: template.domain,
        roleTitle: template.roleTitle,
        description: template.description,
        isPublished: true,
      },
    });
  }

  let version = await db.roadmapVersion.findFirst({
    where: { roadmapId: roadmap.id, status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  });

  if (!version) {
    version = await db.roadmapVersion.create({
      data: {
        roadmapId: roadmap.id,
        versionNumber: 1,
        status: "PUBLISHED",
        notes: `${template.domain} starter pathway. ${template.regionNote}`,
        publishedAt: new Date(),
      },
    });

    const slugToTopicId = new Map<string, string>();
    const pendingPrereqs: Array<{ topicId: string; prereqSlug: string }> = [];

    for (const phaseDef of template.phases) {
      const phase = await db.roadmapPhase.create({
        data: {
          versionId: version.id,
          orderIndex: phaseDef.orderIndex,
          title: phaseDef.title,
          description: phaseDef.description,
          estimatedHours: phaseDef.estimatedHours,
        },
      });

      for (const topicDef of phaseDef.topics) {
        const topic = await db.roadmapTopic.create({
          data: {
            phaseId: phase.id,
            slug: topicDef.slug,
            orderIndex: topicDef.orderIndex,
            title: topicDef.title,
            overview: topicDef.overview,
            whyItMatters: topicDef.whyItMatters,
            difficulty: topicDef.difficulty,
            estimatedMinutes: topicDef.estimatedMinutes,
            priority: topicDef.priority,
            subtopicsJson: JSON.stringify(topicDef.subtopics),
            learningOutcomesJson: JSON.stringify(topicDef.learningOutcomes),
            completionCriteriaJson: JSON.stringify(topicDef.completionCriteria),
            practicePromptsJson: JSON.stringify(topicDef.practicePrompts),
          },
        });
        slugToTopicId.set(topicDef.slug, topic.id);
        for (const pSlug of topicDef.prerequisiteSlugs) {
          pendingPrereqs.push({ topicId: topic.id, prereqSlug: pSlug });
        }
      }

      if (phaseDef.exercise) {
        await db.practiceExercise.create({
          data: {
            phaseId: phase.id,
            title: phaseDef.exercise.title,
            objective: phaseDef.exercise.objective,
            expectedOutput: phaseDef.exercise.expectedOutput,
            difficulty: phaseDef.exercise.difficulty,
            estimatedMinutes: phaseDef.exercise.estimatedMinutes,
          },
        });
      }
    }

    for (const edge of pendingPrereqs) {
      const prereqId = slugToTopicId.get(edge.prereqSlug);
      if (prereqId) {
        await db.roadmapPrerequisite.create({
          data: { topicId: edge.topicId, prerequisiteTopicId: prereqId },
        });
      }
    }
  }

  await db.interviewPrepKit.update({
    where: { id: kit.id },
    data: { activeRoadmapVersionId: version.id },
  });

  return { ok: true, versionId: version.id };
}
