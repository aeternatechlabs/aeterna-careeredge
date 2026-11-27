// src/lib/interview/ownership.ts
// Ownership & Authorization Helpers for Interview Prep 2.0 (Phase 2)

import { db } from "@/lib/db";

export async function requireOwnedKit(kitId: string, userId: string) {
  if (!kitId || !userId) return null;
  return db.interviewPrepKit.findFirst({
    where: { id: kitId, userId },
  });
}

export async function requireOwnedMockSession(sessionId: string, userId: string) {
  if (!sessionId || !userId) return null;
  return db.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
  });
}

export async function requireOwnedStudyPlan(planId: string, userId: string) {
  if (!planId || !userId) return null;
  return db.studyPlan.findFirst({
    where: { id: planId, userId },
  });
}

export async function requireOwnedEvidenceItem(evidenceItemId: string, userId: string) {
  if (!evidenceItemId || !userId) return null;
  return db.evidenceItem.findFirst({
    where: { id: evidenceItemId, userId },
  });
}
