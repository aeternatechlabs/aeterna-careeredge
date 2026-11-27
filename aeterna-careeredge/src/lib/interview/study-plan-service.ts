// src/lib/interview/study-plan-service.ts
// Skill Gap Analysis, Weekly Study Plan & Sprint Integration (Phase 9)

import { db } from "@/lib/db";
import { requireOwnedKit } from "./ownership";
import { getKitRoadmapView } from "./roadmap-engine";
import { sanitizeText } from "./validation";

export interface SkillGapAnalysis {
  declaredSkills: string[];
  evidenceBackedSkills: string[];
  completedTopics: string[];
  inProgressTopics: string[];
  missingOrRecommendedTopics: Array<{ topicId: string; title: string; estimatedMinutes: number }>;
  note: string;
}

export async function computeSkillGapAnalysis(kitId: string, userId: string): Promise<SkillGapAnalysis | null> {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) return null;

  const [skills, evidenceItems, projects, roadmap] = await Promise.all([
    db.studentSkill.findMany({ where: { userId } }),
    db.evidenceItem.findMany({ where: { userId } }),
    db.studentProject.findMany({ where: { userId } }),
    getKitRoadmapView(kitId, userId),
  ]);

  const declaredSkills = skills.map((s) => s.name);
  const evidenceText = [
    ...evidenceItems.map((e) => `${e.title} ${e.description || ""}`),
    ...projects.map((p) => `${p.title} ${p.techStack || ""} ${p.description || ""}`),
  ]
    .join(" ")
    .toLowerCase();

  const evidenceBackedSkills = declaredSkills.filter((s) =>
    evidenceText.includes(s.toLowerCase())
  );

  const completedTopics: string[] = [];
  const inProgressTopics: string[] = [];
  const missingOrRecommendedTopics: Array<{
    topicId: string;
    title: string;
    estimatedMinutes: number;
  }> = [];

  if (roadmap?.available) {
    for (const phase of roadmap.phases) {
      for (const topic of phase.topics) {
        const tStatus = (topic as { progress?: { status?: string }; status?: string }).progress?.status ??
          (topic as { status?: string }).status;
        if (tStatus === "COMPLETED") {
          completedTopics.push(topic.title);
        } else if (tStatus === "IN_PROGRESS") {
          inProgressTopics.push(topic.title);
        } else {
          missingOrRecommendedTopics.push({
            topicId: topic.id,
            title: topic.title,
            estimatedMinutes: topic.estimatedMinutes,
          });
        }
      }
    }
  }

  return {
    declaredSkills,
    evidenceBackedSkills,
    completedTopics,
    inProgressTopics,
    missingOrRecommendedTopics: missingOrRecommendedTopics.slice(0, 10),
    note: "Declared skills reflect self-reported profile entries and are separated from evidence-backed skills.",
  };
}

export async function getKitStudyPlanView(kitId: string, userId: string) {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) return null;

  const [skillGaps, plans, activeSprint] = await Promise.all([
    computeSkillGapAnalysis(kitId, userId),
    db.studyPlan.findMany({
      where: { userId, kitId: kit.id },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
    db.sprintPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activePlan = plans[0] ?? null;
  const [tasks, sprintTasks] = await Promise.all([
    activePlan
      ? db.studyPlanTask.findMany({
          where: { studyPlanId: activePlan.id },
          orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
    activeSprint
      ? db.sprintTask.findMany({
          where: { planId: activeSprint.id },
          select: { title: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    kitId: kit.id,
    roleTitle: kit.jobTitle,
    domain: kit.domain,
    skillGaps,
    syncedTaskTitles: sprintTasks.map((st) => st.title),
    studyPlan: activePlan ? { ...activePlan, tasks } : null,
  };
}

export async function createOrRegenerateStudyPlan(params: {
  userId: string;
  kitId: string;
  weeklyHours?: number;
  title?: string;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  // Realistic workload bounds (1..30 hours/week)
  const weeklyHours = Math.min(30, Math.max(1, Math.round(params.weeklyHours ?? 5)));
  const maxWeeklyMinutes = weeklyHours * 60;
  const gaps = await computeSkillGapAnalysis(kit.id, params.userId);

  const plan = await db.studyPlan.create({
    data: {
      userId: params.userId,
      kitId: kit.id,
      title: sanitizeText(params.title || `${kit.jobTitle} Weekly Study Plan`, 120),
      weeklyHours,
      status: "ACTIVE",
    },
  });

  const candidateTasks: Array<{
    topicId: string | null;
    title: string;
    taskType: string;
    estimatedMinutes: number;
  }> = [];

  for (const t of gaps?.missingOrRecommendedTopics ?? []) {
    candidateTasks.push({
      topicId: t.topicId,
      title: `Study: ${t.title}`,
      taskType: "TOPIC",
      estimatedMinutes: Math.min(90, Math.max(30, t.estimatedMinutes)),
    });
  }

  if (candidateTasks.length === 0) {
    candidateTasks.push(
      {
        topicId: null,
        title: `Review ${kit.jobTitle} interview questions & STAR stories`,
        taskType: "PRACTICE",
        estimatedMinutes: 45,
      },
      {
        topicId: null,
        title: "Complete 1 timed mock interview session",
        taskType: "PRACTICE",
        estimatedMinutes: 45,
      }
    );
  }

  // Schedule tasks across weeks without exceeding weeklyHours capacity
  let currentWeek = 1;
  let currentDay = 1;
  let weekMinutes = 0;
  const createdTasks = [];

  for (const item of candidateTasks) {
    if (weekMinutes + item.estimatedMinutes > maxWeeklyMinutes && weekMinutes > 0) {
      currentWeek++;
      currentDay = 1;
      weekMinutes = 0;
    }
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + (currentWeek - 1) * 7 + (currentDay - 1));

    const task = await db.studyPlanTask.create({
      data: {
        studyPlanId: plan.id,
        weekNumber: currentWeek,
        dayNumber: currentDay,
        topicId: item.topicId,
        title: item.title,
        taskType: item.taskType,
        estimatedMinutes: item.estimatedMinutes,
        status: "PENDING",
        scheduledDate,
      },
    });
    createdTasks.push(task);
    weekMinutes += item.estimatedMinutes;
    currentDay = (currentDay % 5) + 1;
  }

  return { ok: true as const, studyPlan: { ...plan, tasks: createdTasks } };
}

export async function updateStudyPlanTask(params: {
  userId: string;
  kitId: string;
  taskId: string;
  status?: "PENDING" | "COMPLETED" | "DEFERRED" | "SKIPPED";
  scheduledDate?: string | null;
  syncToSprint?: boolean;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const task = await db.studyPlanTask.findUnique({ where: { id: params.taskId } });
  if (!task) {
    return { ok: false as const, status: 404, error: "Study plan task not found" };
  }

  const plan = await db.studyPlan.findFirst({
    where: { id: task.studyPlanId, userId: params.userId, kitId: kit.id },
  });
  if (!plan) {
    return { ok: false as const, status: 404, error: "Study plan task not found" };
  }

  const validStatuses = new Set(["PENDING", "COMPLETED", "DEFERRED", "SKIPPED"]);
  if (params.status && !validStatuses.has(params.status)) {
    return { ok: false as const, status: 400, error: "Invalid study task status" };
  }

  let nextScheduled = task.scheduledDate;
  if (params.scheduledDate !== undefined) {
    if (params.scheduledDate === null) {
      nextScheduled = null;
    } else {
      const parsed = new Date(params.scheduledDate);
      if (Number.isNaN(parsed.getTime())) {
        return { ok: false as const, status: 400, error: "Invalid scheduledDate" };
      }
      nextScheduled = parsed;
    }
  }

  const nextStatus = params.status ?? task.status;
  const updated = await db.studyPlanTask.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      scheduledDate: nextScheduled,
      completedAt: nextStatus === "COMPLETED" ? task.completedAt ?? new Date() : null,
    },
  });

  // Optional Sprint integration without duplicating existing sprint tasks
  let sprintSynced = false;
  let alreadySynced = false;
  if (params.syncToSprint) {
    let sprint = await db.sprintPlan.findFirst({
      where: { userId: params.userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    if (!sprint) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 28);
      sprint = await db.sprintPlan.create({
        data: {
          userId: params.userId,
          targetProfession: kit.domain || "General",
          targetRole: kit.jobTitle,
          endDate,
          status: "ACTIVE",
        },
      });
    }
    const existingSprintTask = await db.sprintTask.findFirst({
      where: { planId: sprint.id, title: updated.title },
    });
    if (existingSprintTask) {
      alreadySynced = true;
    } else {
      await db.sprintTask.create({
        data: {
          planId: sprint.id,
          weekNumber: updated.weekNumber,
          dayNumber: updated.dayNumber ?? 1,
          title: updated.title,
          linkedGapType: "MISSING_SKILL",
          status: updated.status === "COMPLETED" ? "COMPLETED" : "PENDING",
        },
      });
    }
    sprintSynced = true;
  }

  return { ok: true as const, task: updated, sprintSynced, alreadySynced };
}
