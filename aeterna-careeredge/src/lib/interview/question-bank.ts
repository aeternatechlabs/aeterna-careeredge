// src/lib/interview/question-bank.ts
// Multi-Domain Extended Question Bank, Proof Bank & STAR Practice (Phase 7)

import { db } from "@/lib/db";
import { requireOwnedKit } from "./ownership";
import { sanitizeMultilineText, sanitizeText } from "./validation";
import type { AcademicDomain } from "@/lib/constants/domains";

export const QUESTION_CATEGORIES = [
  "TECHNICAL",
  "DOMAIN_KNOWLEDGE",
  "BEHAVIORAL",
  "SITUATIONAL",
  "HR",
  "ROLE_SPECIFIC",
  "SCENARIO",
] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export interface ExtendedInterviewQuestion {
  id: string;
  domain: string;
  roleTitle: string;
  topic: string;
  stage: QuestionCategory;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  questionText: string;
  evaluatorFocus: string;
  responseFramework: string;
  commonMistakes: string[];
  followUpQuestions: string[];
  preparationApproach: string;
}

export interface ProofBankEvidenceItem {
  id: string;
  sourceType: "PROJECT" | "EXPERIENCE" | "CERTIFICATION" | "ACHIEVEMENT" | "SKILL" | "EVIDENCE_VAULT";
  title: string;
  summary: string;
}

export function buildDomainQuestions(
  domain: string,
  roleTitle: string
): ExtendedInterviewQuestion[] {
  const safeRole = roleTitle || "Candidate";
  const safeDomain = (domain || "General") as AcademicDomain | string;

  return [
    {
      id: "qb_tech_1",
      domain: safeDomain,
      roleTitle: safeRole,
      topic: "Core Methodology & Fundamentals",
      stage: "TECHNICAL",
      difficulty: "INTERMEDIATE",
      questionText: `Walk through the core methodology or technical workflow you rely on most for ${safeRole} work in ${safeDomain}.`,
      evaluatorFocus: "Clarity of foundational concepts, accuracy, and ability to explain trade-offs.",
      responseFramework: "Context -> Core Principle -> Step-by-Step Application -> Verification Check",
      commonMistakes: [
        "Reciting textbook definitions without showing how you apply them.",
        "Skipping edge cases or quality/safety checks.",
      ],
      followUpQuestions: [
        "What assumption in that workflow is most likely to fail under pressure?",
        "How do you verify your output before handing it off?",
      ],
      preparationApproach: "Review 1 real project or lab assignment and map each step to a measurable check.",
    },
    {
      id: "qb_domain_1",
      domain: safeDomain,
      roleTitle: safeRole,
      topic: "Domain Standards & Best Practices",
      stage: "DOMAIN_KNOWLEDGE",
      difficulty: "INTERMEDIATE",
      questionText: `What quality, ethical, or safety standards matter most in ${safeDomain}, and how have you applied them in your coursework or projects?`,
      evaluatorFocus: "Domain awareness, ethical judgment, and practical compliance habits.",
      responseFramework: "Standard / Principle -> Real Example -> Outcome & Lesson",
      commonMistakes: [
        "Claiming familiarity with regulations you have not actually used.",
        "Giving vague answers without naming a concrete check.",
      ],
      followUpQuestions: [
        "What would you do if a deadline conflicted with a quality check?",
      ],
      preparationApproach: "Pick one verified Career Passport project or certification to anchor your answer.",
    },
    {
      id: "qb_behav_1",
      domain: safeDomain,
      roleTitle: safeRole,
      topic: "Ownership & Problem Resolution",
      stage: "BEHAVIORAL",
      difficulty: "INTERMEDIATE",
      questionText: "Tell me about a time you spotted a problem or ambiguity early and took ownership to resolve it.",
      evaluatorFocus: "Individual initiative (I vs We), structured execution, and measurable result.",
      responseFramework: "STAR (Situation, Task, Action, Result)",
      commonMistakes: [
        "Spending 70% of the answer on Situation and rushing Action/Result.",
        "Using 'we' without clarifying your personal contribution.",
      ],
      followUpQuestions: [
        "What would you do differently if you faced that situation again?",
      ],
      preparationApproach: "Draft a 90-second STAR story linked to your Evidence Vault.",
    },
    {
      id: "qb_sit_1",
      domain: safeDomain,
      roleTitle: safeRole,
      topic: "Prioritization Under Constraints",
      stage: "SITUATIONAL",
      difficulty: "INTERMEDIATE",
      questionText: `Suppose you are given two urgent ${safeRole} deliverables with conflicting deadlines. How do you triage and communicate?`,
      evaluatorFocus: "Calm triage, risk assessment, and proactive stakeholder communication.",
      responseFramework: "Assess Impact & Risk -> Clarify Priorities -> Communicate Plan -> Execute",
      commonMistakes: [
        "Silently trying to do everything without flagging trade-offs.",
      ],
      followUpQuestions: [
        "How do you decide what can be deferred safely?",
      ],
      preparationApproach: "Practice framing trade-offs around impact, risk, and dependencies.",
    },
    {
      id: "qb_hr_1",
      domain: safeDomain,
      roleTitle: safeRole,
      topic: "Motivation & Role Alignment",
      stage: "HR",
      difficulty: "BEGINNER",
      questionText: `Why are you targeting ${safeRole} roles in ${safeDomain}, and what evidence from your background prepares you for this step?`,
      evaluatorFocus: "Authentic motivation, self-awareness, and alignment with real experience.",
      responseFramework: "Present Focus -> Verified Past Evidence -> Future Contribution",
      commonMistakes: [
        "Generic flattery without connecting to specific skills or projects.",
      ],
      followUpQuestions: [
        "What skill are you actively strengthening right now?",
      ],
      preparationApproach: "Reference 2 specific skills or projects from your Career Passport.",
    },
    {
      id: "qb_role_1",
      domain: safeDomain,
      roleTitle: safeRole,
      topic: "Role-Specific Execution",
      stage: "ROLE_SPECIFIC",
      difficulty: "ADVANCED",
      questionText: `Describe the most complex ${safeRole} task you have completed so far, including the constraints you worked within.`,
      evaluatorFocus: "Depth of execution, constraint awareness, and honest reflection.",
      responseFramework: "Goal & Constraints -> Key Decisions -> Trade-offs -> Verified Outcome",
      commonMistakes: [
        "Exaggerating your scope or claiming team-wide metrics as solely yours.",
      ],
      followUpQuestions: [
        "Which constraint forced the hardest trade-off?",
      ],
      preparationApproach: "Use your Evidence Vault artifacts to verify exact dates and metrics.",
    },
    {
      id: "qb_scen_1",
      domain: safeDomain,
      roleTitle: safeRole,
      topic: "Error Recovery & Escalation",
      stage: "SCENARIO",
      difficulty: "ADVANCED",
      questionText: `If you discovered an error in work that was already shared with a stakeholder or client in ${safeDomain}, what exact steps would you take?`,
      evaluatorFocus: "Accountability, speed of containment, and prevention mindset.",
      responseFramework: "Contain Impact -> Notify & Document -> Remediate -> Prevent Recurrence",
      commonMistakes: [
        "Hiding the issue or blaming teammates instead of containing impact.",
      ],
      followUpQuestions: [
        "How would you prevent that error class in future workflows?",
      ],
      preparationApproach: "Prepare a calm, structured escalation checklist.",
    },
  ];
}

export async function loadStudentProofBank(userId: string): Promise<ProofBankEvidenceItem[]> {
  const [projects, experiences, certs, achievements, skills, evidenceItems] = await Promise.all([
    db.studentProject.findMany({ where: { userId }, take: 20 }),
    db.studentExperience.findMany({ where: { userId }, take: 20 }),
    db.certification.findMany({ where: { userId }, take: 20 }),
    db.studentAchievement.findMany({ where: { userId }, take: 20 }),
    db.studentSkill.findMany({ where: { userId }, take: 30 }),
    db.evidenceItem.findMany({ where: { userId }, take: 20 }),
  ]);

  const items: ProofBankEvidenceItem[] = [];
  for (const p of projects) {
    items.push({
      id: p.id,
      sourceType: "PROJECT",
      title: p.title,
      summary: p.description || p.techStack || "Student Project",
    });
  }
  for (const e of experiences) {
    items.push({
      id: e.id,
      sourceType: "EXPERIENCE",
      title: `${e.jobTitle} @ ${e.companyName}`,
      summary: e.description || "Work / Internship Experience",
    });
  }
  for (const c of certs) {
    items.push({
      id: c.id,
      sourceType: "CERTIFICATION",
      title: c.title,
      summary: c.issuingOrganization || "Certification",
    });
  }
  for (const a of achievements) {
    items.push({
      id: a.id,
      sourceType: "ACHIEVEMENT",
      title: a.title,
      summary: a.description || a.issuer || "Achievement",
    });
  }
  for (const s of skills) {
    items.push({
      id: s.id,
      sourceType: "SKILL",
      title: s.name,
      summary: `${s.proficiencyLevel || "Declared"} (${s.dataOrigin || "Passport"})`,
    });
  }
  for (const ev of evidenceItems) {
    items.push({
      id: ev.id,
      sourceType: "EVIDENCE_VAULT",
      title: ev.title,
      summary: ev.description || ev.type,
    });
  }

  return items;
}

export async function getKitQuestionBankView(kitId: string, userId: string) {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) return null;

  const [proofBank, starSessions] = await Promise.all([
    loadStudentProofBank(userId),
    db.mockInterviewSession.findMany({
      where: { userId, kitId: kit.id, interviewMode: "STAR_PRACTICE" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const starHistory = [];
  for (const s of starSessions) {
    const turns = await db.mockInterviewTurn.findMany({
      where: { sessionId: s.id },
      orderBy: { turnOrder: "asc" },
    });
    for (const t of turns) {
      let parsedAnswer: Record<string, unknown> = {};
      let parsedFeedback: Record<string, unknown> = {};
      try {
        if (t.userAnswer) parsedAnswer = JSON.parse(t.userAnswer);
      } catch {}
      try {
        if (t.aiFeedbackJson) parsedFeedback = JSON.parse(t.aiFeedbackJson);
      } catch {}
      starHistory.push({
        id: t.id,
        questionText: t.questionText,
        ...parsedAnswer,
        feedback: parsedFeedback,
        score: t.score,
        createdAt: t.createdAt,
      });
    }
  }

  return {
    kitId: kit.id,
    domain: kit.domain || "Other / Interdisciplinary",
    roleTitle: kit.jobTitle,
    questions: buildDomainQuestions(kit.domain || "Other / Interdisciplinary", kit.jobTitle),
    proofBank,
    starHistory,
  };
}

export async function saveStarPracticeResponse(params: {
  userId: string;
  kitId: string;
  questionText: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  evidenceIds?: string[];
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const questionText = sanitizeText(params.questionText, 500);
  const situation = sanitizeMultilineText(params.situation, 1500);
  const task = sanitizeMultilineText(params.task, 1500);
  const action = sanitizeMultilineText(params.action, 2000);
  const result = sanitizeMultilineText(params.result, 1500);

  if (!questionText || !situation || !task || !action || !result) {
    return {
      ok: false as const,
      status: 400,
      error: "Question, Situation, Task, Action, and Result are all required.",
    };
  }

  // Verify any referenced evidence IDs belong to the authenticated student
  const validProofIds = new Set((await loadStudentProofBank(params.userId)).map((p) => p.id));
  const attachedEvidenceIds = (params.evidenceIds || []).filter((id) => validProofIds.has(id));

  const missingChecks: string[] = [];
  if (situation.length < 25) missingChecks.push("Add more context to Situation.");
  if (task.length < 20) missingChecks.push("Clarify your specific Task/responsibility.");
  if (action.length < 40) missingChecks.push("Expand on your individual Action steps.");
  if (result.length < 20) missingChecks.push("Add concrete Result or learning outcome.");
  if (attachedEvidenceIds.length === 0) {
    missingChecks.push("Consider linking a Career Passport or Evidence Vault record.");
  }

  const completenessScore = Math.max(
    40,
    100 - missingChecks.length * 15
  );

  const feedback = {
    label: "CareerEdge Practice Assessment",
    disclaimer: "Practice completeness feedback only — not an official interview score or placement guarantee.",
    completenessScore,
    suggestions: missingChecks,
    attachedEvidenceCount: attachedEvidenceIds.length,
  };

  let session = await db.mockInterviewSession.findFirst({
    where: { userId: params.userId, kitId: kit.id, interviewMode: "STAR_PRACTICE" },
  });
  if (!session) {
    session = await db.mockInterviewSession.create({
      data: {
        userId: params.userId,
        kitId: kit.id,
        roleTitle: kit.jobTitle,
        interviewMode: "STAR_PRACTICE",
        difficulty: "INTERMEDIATE",
        totalQuestions: 1,
        status: "IN_PROGRESS",
      },
    });
  }

  const existingTurns = await db.mockInterviewTurn.findMany({
    where: { sessionId: session.id },
  });

  const turn = await db.mockInterviewTurn.create({
    data: {
      sessionId: session.id,
      turnOrder: existingTurns.length + 1,
      questionText,
      userAnswer: JSON.stringify({
        situation,
        task,
        action,
        result,
        evidenceIds: attachedEvidenceIds,
      }),
      aiFeedbackJson: JSON.stringify(feedback),
      score: completenessScore,
    },
  });

  return {
    ok: true as const,
    entry: {
      id: turn.id,
      questionText,
      situation,
      task,
      action,
      result,
      evidenceIds: attachedEvidenceIds,
      feedback,
      score: completenessScore,
      createdAt: turn.createdAt,
    },
  };
}
