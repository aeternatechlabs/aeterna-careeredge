// src/lib/interview/mock-interviewer.ts
// One-Question-at-a-Time AI Mock Interviewer (Phase 8)
// Uses existing ServerAiService with graceful deterministic fallback; never fabricates student experiences.

import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/provider";
import { requireOwnedKit } from "./ownership";
import { buildDomainQuestions } from "./question-bank";
import { sanitizeMultilineText, sanitizeText } from "./validation";

export const VALID_MOCK_MODES = [
  "HR",
  "TECHNICAL",
  "SUBJECT",
  "BEHAVIORAL",
  "PROJECT",
  "SCENARIO",
  "MIXED",
] as const;
export type MockInterviewMode = (typeof VALID_MOCK_MODES)[number];

export interface MockTurnEvaluation {
  label: "CareerEdge Practice Assessment";
  disclaimer: string;
  dimensions: {
    relevance: number;
    clarity: number;
    completeness: number;
    accuracy: number;
    communication: number;
    evidence: number;
    structure: number;
  };
  overallTurnScore: number;
  strengths: string[];
  improvements: string[];
  aiProviderUsed: string;
}

function deterministicEvaluateTurn(answer: string): MockTurnEvaluation {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasExample = /\b(project|built|led|designed|tested|resolved|improved|patient|client|case)\b/i.test(answer);
  const hasMetric = /\b(\d+%|\d+\s*(ms|s|min|hours|days|users|patients|cases))\b/i.test(answer);

  const base = words >= 50 ? 78 : words >= 25 ? 68 : 52;
  const bonus = (hasExample ? 8 : 0) + (hasMetric ? 6 : 0);
  const score = Math.min(92, base + bonus);

  return {
    label: "CareerEdge Practice Assessment",
    disclaimer:
      "Approximate practice feedback generated locally for interview preparation — not an official recruiter evaluation or employability guarantee.",
    dimensions: {
      relevance: score,
      clarity: Math.min(95, base + 4),
      completeness: words >= 45 ? score : Math.max(45, score - 12),
      accuracy: score,
      communication: Math.min(92, base + 3),
      evidence: hasExample ? 82 : 54,
      structure: words >= 35 ? 76 : 55,
    },
    overallTurnScore: score,
    strengths: [
      words >= 30 ? "Clear, substantive response length." : "Concise initial framing.",
      ...(hasExample ? ["Anchored explanation in a concrete example."] : []),
    ],
    improvements: [
      ...(!hasExample ? ["Include a specific example from your Career Passport or coursework."] : []),
      ...(!hasMetric ? ["Add a measurable outcome or verification step to strengthen your Result."] : []),
    ],
    aiProviderUsed: "deterministic-fallback",
  };
}

async function generateSingleQuestion(params: {
  domain: string;
  roleTitle: string;
  mode: string;
  difficulty: string;
  turnNumber: number;
  previousQuestions: string[];
  focusTopics?: string[];
  language?: string;
}): Promise<string> {
  const bank = buildDomainQuestions(params.domain, params.roleTitle);
  const fallbackQ =
    bank.find((q) => !params.previousQuestions.includes(q.questionText))?.questionText ??
    `Question ${params.turnNumber}: Walk through how you would approach a ${params.difficulty.toLowerCase()} ${params.mode.toLowerCase()} challenge as a ${params.roleTitle} in ${params.domain}.`;

  try {
    const aiRes = await aiService.generateStructuredAdvice<{ questionText?: string }>({
      operation: "INTERVIEW_PREP",
      modelTier: "FAST",
      studentContext: {
        targetRole: params.roleTitle,
        academicDomain: params.domain,
        skills: params.focusTopics || [],
        summary: `Mode: ${params.mode}, Difficulty: ${params.difficulty}, Turn: ${params.turnNumber}, Language: ${params.language || "English"}`,
      },
      customPrompt: `Generate ONE concise ${params.difficulty} ${params.mode} interview question (#${params.turnNumber}) for a ${params.roleTitle} in ${params.domain}. Avoid repeating prior questions. Return JSON { "questionText": "..." }.`,
      schemaDescription: '{ "questionText": "string" }',
    });
    const text = aiRes.data?.questionText?.trim();
    return text && text.length >= 12 ? text : fallbackQ;
  } catch {
    return fallbackQ;
  }
}

export async function listMockInterviewSessions(kitId: string, userId: string) {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) return null;

  const sessions = await db.mockInterviewSession.findMany({
    where: {
      userId,
      kitId: kit.id,
      interviewMode: { not: "STAR_PRACTICE" },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const hydrated = [];
  for (const s of sessions) {
    const turns = await db.mockInterviewTurn.findMany({
      where: { sessionId: s.id },
      orderBy: { turnOrder: "asc" },
    });
    hydrated.push({ ...s, turns });
  }

  return { kitId: kit.id, domain: kit.domain, roleTitle: kit.jobTitle, sessions: hydrated };
}

export async function startMockInterviewSession(params: {
  userId: string;
  kitId: string;
  interviewMode?: string;
  difficulty?: string;
  totalQuestions?: number;
  focusTopics?: string[];
  language?: string;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const mode = VALID_MOCK_MODES.includes(params.interviewMode as MockInterviewMode)
    ? (params.interviewMode as MockInterviewMode)
    : "MIXED";
  const difficulty = ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(params.difficulty || "")
    ? (params.difficulty as string)
    : "INTERMEDIATE";
  const totalQuestions = Math.min(10, Math.max(1, Math.round(params.totalQuestions ?? 5)));

  const session = await db.mockInterviewSession.create({
    data: {
      userId: params.userId,
      kitId: kit.id,
      roleTitle: kit.jobTitle,
      interviewMode: mode,
      difficulty,
      totalQuestions,
      status: "IN_PROGRESS",
    },
  });

  const firstQuestion = await generateSingleQuestion({
    domain: kit.domain || "Other / Interdisciplinary",
    roleTitle: kit.jobTitle,
    mode,
    difficulty,
    turnNumber: 1,
    previousQuestions: [],
    focusTopics: params.focusTopics,
    language: params.language,
  });

  const firstTurn = await db.mockInterviewTurn.create({
    data: {
      sessionId: session.id,
      turnOrder: 1,
      questionText: firstQuestion,
    },
  });

  return { ok: true as const, session: { ...session, turns: [firstTurn] } };
}

export async function submitMockInterviewTurn(params: {
  userId: string;
  kitId: string;
  sessionId: string;
  answer: string;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const session = await db.mockInterviewSession.findFirst({
    where: { id: params.sessionId, userId: params.userId, kitId: kit.id },
  });
  if (!session) {
    return { ok: false as const, status: 404, error: "Mock interview session not found" };
  }
  if (session.status === "COMPLETED") {
    return { ok: false as const, status: 409, error: "Mock interview session is already completed" };
  }

  const cleanAnswer = sanitizeMultilineText(params.answer, 4000);
  if (cleanAnswer.length < 5) {
    return { ok: false as const, status: 400, error: "Please provide a substantive answer" };
  }

  const turns = await db.mockInterviewTurn.findMany({
    where: { sessionId: session.id },
    orderBy: { turnOrder: "asc" },
  });
  const currentTurn = turns.find((t) => !t.userAnswer) ?? turns[turns.length - 1];
  if (!currentTurn) {
    return { ok: false as const, status: 409, error: "No pending question turn found" };
  }

  const fallbackEval = deterministicEvaluateTurn(cleanAnswer);
  let evaluation: MockTurnEvaluation = fallbackEval;

  try {
    const aiRes = await aiService.generateStructuredAdvice<{
      overallTurnScore?: number;
      strengths?: string[];
      improvements?: string[];
      dimensions?: Partial<MockTurnEvaluation["dimensions"]>;
    }>({
      operation: "INTERVIEW_PREP",
      modelTier: "FAST",
      studentContext: {
        targetRole: session.roleTitle,
        academicDomain: kit.domain || "General",
        skills: [],
        summary: `Question: ${currentTurn.questionText}`,
      },
      customPrompt: `Evaluate this practice interview answer as "CareerEdge Practice Assessment" (not an official hiring score). Question: ${currentTurn.questionText}\nAnswer: ${sanitizeText(cleanAnswer, 1500)}`,
      schemaDescription:
        '{ "overallTurnScore": "number", "strengths": ["string"], "improvements": ["string"] }',
    });
    const providerUsed = aiRes.metadata?.provider || "mock";
    if (providerUsed !== "mock" && aiRes.data && typeof aiRes.data.overallTurnScore === "number") {
      evaluation = {
        ...fallbackEval,
        overallTurnScore: Math.min(100, Math.max(0, Math.round(aiRes.data.overallTurnScore))),
        strengths: Array.isArray(aiRes.data.strengths) ? aiRes.data.strengths.slice(0, 3) : fallbackEval.strengths,
        improvements: Array.isArray(aiRes.data.improvements)
          ? aiRes.data.improvements.slice(0, 3)
          : fallbackEval.improvements,
        aiProviderUsed: providerUsed,
      };
    }
  } catch {
    evaluation = fallbackEval;
  }

  const updatedTurn = await db.mockInterviewTurn.update({
    where: { id: currentTurn.id },
    data: {
      userAnswer: cleanAnswer,
      aiFeedbackJson: JSON.stringify(evaluation),
      score: evaluation.overallTurnScore,
    },
  });

  const answeredCount = turns.filter((t) => Boolean(t.userAnswer) || t.id === currentTurn.id).length;
  let nextTurn = null;
  let updatedSession = session;

  if (answeredCount < session.totalQuestions) {
    const nextQ = await generateSingleQuestion({
      domain: kit.domain || "Other / Interdisciplinary",
      roleTitle: session.roleTitle,
      mode: session.interviewMode,
      difficulty: session.difficulty,
      turnNumber: answeredCount + 1,
      previousQuestions: turns.map((t) => t.questionText),
    });
    nextTurn = await db.mockInterviewTurn.create({
      data: {
        sessionId: session.id,
        turnOrder: answeredCount + 1,
        questionText: nextQ,
      },
    });
  } else {
    const allScores = turns
      .map((t) => (t.id === currentTurn.id ? evaluation.overallTurnScore : t.score))
      .filter((s): s is number => typeof s === "number");
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : evaluation.overallTurnScore;

    updatedSession = await db.mockInterviewSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        overallScore: avgScore,
        completedAt: new Date(),
        feedbackSummaryJson: JSON.stringify({
          label: "CareerEdge Practice Assessment",
          disclaimer: evaluation.disclaimer,
          averageScore: avgScore,
          completedQuestions: answeredCount,
        }),
      },
    });
  }

  return {
    ok: true as const,
    session: updatedSession,
    evaluatedTurn: updatedTurn,
    evaluation,
    nextTurn,
  };
}
