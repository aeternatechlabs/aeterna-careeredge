// src/lib/evidence/service.ts
// Evidence Vault ("Proof Bank") Service (Day 2 Addendum Section B1)
// Tracks verified artifacts, certificates, project URLs, and clinical logs with strict provenance.

import { db } from "@/lib/db";

export type EvidenceType =
  | "CERTIFICATE"
  | "PROJECT_LINK"
  | "INTERNSHIP_LETTER"
  | "MARK_SHEET"
  | "CLINICAL_LOG"
  | "LESSON_PLAN"
  | "MOOT_COURT"
  | "PORTFOLIO"
  | "GITHUB_REPO"
  | "AWARD"
  | "OTHER";

export type EvidenceStatus = "SUPPORTED" | "NEEDS_EVIDENCE" | "UNSUPPORTED";

export interface CreateEvidenceInput {
  title: string;
  type: EvidenceType;
  relatedSkill?: string;
  date?: string;
  issuer?: string;
  url?: string;
  storedDocId?: string;
  provenance?: "STUDENT_INPUT" | "DOCUMENT_EXTRACTED" | "VERIFIED_REFERENCE";
  notes?: string;
}

/**
 * Retrieve all evidence vault items for an authenticated student.
 */
export async function getEvidenceItems(userId: string) {
  return db.evidenceItem.findMany({
    where: { userId },
    include: {
      storedDocument: {
        select: {
          id: true,
          originalFileName: true,
          mimeType: true,
          fileSizeBytes: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Add a new evidence item to the vault.
 */
export async function createEvidenceItem(userId: string, input: CreateEvidenceInput) {
  // If storedDocId is provided, verify it belongs to this user
  if (input.storedDocId) {
    const doc = await db.storedDocument.findFirst({
      where: { id: input.storedDocId, userId },
    });
    if (!doc) {
      throw new Error("Referenced document does not exist or access is unauthorized.");
    }
  }

  let parsedDate: Date | null = null;
  if (input.date) {
    const d = new Date(input.date);
    if (!isNaN(d.getTime())) parsedDate = d;
  }

  return db.evidenceItem.create({
    data: {
      userId,
      title: input.title,
      type: input.type,
      relatedSkill: input.relatedSkill?.trim() || null,
      date: parsedDate,
      issuer: input.issuer?.trim() || null,
      url: input.url?.trim() || null,
      documentId: input.storedDocId || null,
      provenance: input.provenance || "STUDENT_INPUT",
      description: input.notes?.trim() || null,
    },
  });
}

/**
 * Delete an evidence item with ownership guarantee.
 */
export async function deleteEvidenceItem(userId: string, id: string) {
  const existing = await db.evidenceItem.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Evidence item not found or unauthorized.");
  }

  return db.evidenceItem.delete({
    where: { id },
  });
}

/**
 * Evaluate evidence coverage for a list of skills.
 * Categorizes each skill as SUPPORTED, NEEDS_EVIDENCE, or UNSUPPORTED.
 */
export async function evaluateSkillEvidence(
  userId: string,
  claimedSkills: string[]
): Promise<Record<string, { status: EvidenceStatus; evidenceTitles: string[] }>> {
  const evidenceItems = await db.evidenceItem.findMany({
    where: { userId },
    select: { title: true, relatedSkill: true, url: true, documentId: true },
  });

  const passportSkills = await db.studentSkill.findMany({
    where: { userId },
    select: { name: true },
  });
  const passportSkillSet = new Set(passportSkills.map((s: { name: string }) => s.name.toLowerCase().trim()));

  const result: Record<string, { status: EvidenceStatus; evidenceTitles: string[] }> = {};

  for (const skill of claimedSkills) {
    const cleanSkill = skill.toLowerCase().trim();
    const matchingEvidence = evidenceItems.filter(
      (item: { relatedSkill: string | null; title: string }) => item.relatedSkill && item.relatedSkill.toLowerCase().trim() === cleanSkill
    );

    if (matchingEvidence.length > 0) {
      result[skill] = {
        status: "SUPPORTED",
        evidenceTitles: matchingEvidence.map((e: { title: string }) => e.title),
      };
    } else if (passportSkillSet.has(cleanSkill)) {
      result[skill] = {
        status: "NEEDS_EVIDENCE",
        evidenceTitles: [],
      };
    } else {
      result[skill] = {
        status: "UNSUPPORTED",
        evidenceTitles: [],
      };
    }
  }

  return result;
}
