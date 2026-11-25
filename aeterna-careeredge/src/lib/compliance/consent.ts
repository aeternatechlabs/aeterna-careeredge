// src/lib/compliance/consent.ts
// Compliance, Consent Audit Trail & Data Privacy Foundations

import { db } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ConsentType =
  | "TERMS_AND_PRIVACY"
  | "COUNSELLOR_CONTACT"
  | "RECRUITER_DATA_SHARING"
  | "AI_PROCESSING";

/**
 * Record a student's consent event with timestamp, IP, and user-agent.
 */
export async function recordConsent(params: {
  userId: string;
  consentType: ConsentType;
  isGranted: boolean;
  ipAddress?: string;
  userAgent?: string;
  version?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("consent_records")
      .insert({
        userId: params.userId,
        consentType: params.consentType,
        isGranted: params.isGranted,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        version: params.version ?? "1.0",
        revokedAt: params.isGranted ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("[recordConsent] Supabase insert warning:", error.message);
    } else if (data) {
      return data;
    }
  }

  return db.consentRecord.create({
    data: {
      userId: params.userId,
      consentType: params.consentType,
      isGranted: params.isGranted,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      version: params.version ?? "1.0",
      revokedAt: params.isGranted ? null : new Date(),
    },
  });
}

/**
 * Foundation for Student Data Export (DPDP / GDPR compliance).
 * Bundles all data owned by the student in the Career Passport.
 */
export async function exportStudentData(userId: string) {
  const student = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      educations: true,
      skills: true,
      projects: true,
      experiences: true,
      certifications: true,
      resumes: true,
      sopDocuments: true,
      assessments: true,
      recommendations: true,
      applications: true,
      counsellingRequests: true,
      consentRecords: true,
    },
  });

  if (!student) return null;

  // Scrub password hash before returning
  const exportPayload = { ...student, passwordHash: undefined };
  delete exportPayload.passwordHash;
  return {
    exportedAt: new Date().toISOString(),
    complianceStandard: "India DPDP Act 2023 / Digital Personal Data Protection",
    studentData: exportPayload,
  };
}

/**
 * Foundation for Right to Erasure / Account Deletion.
 * Cascades across all linked student records.
 */
export async function deleteStudentAccount(userId: string) {
  // Cascading foreign keys in Prisma delete all linked profile, records, and documents
  return db.user.delete({
    where: { id: userId },
  });
}
