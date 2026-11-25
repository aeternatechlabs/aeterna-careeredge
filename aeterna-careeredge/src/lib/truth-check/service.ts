// src/lib/truth-check/service.ts
// Truth Check Engine (Day 2 Addendum Section B2)
// Deterministic verification engine ensuring every resume or LinkedIn claim is traceable to the Career Passport or Evidence Vault.

import { db } from "@/lib/db";

export interface ClaimVerificationItem {
  field: string;
  claim: string;
  status: "VERIFIED" | "NEEDS_EVIDENCE" | "UNSUPPORTED";
  reason: string;
  provenance?: string;
  sourceRecordId?: string;
}

export interface TruthCheckReport {
  documentType: "RESUME" | "LINKEDIN";
  documentId?: string;
  totalClaimsChecked: number;
  verifiedCount: number;
  needsEvidenceCount: number;
  unsupportedCount: number;
  honestyScore: number; // 0 to 100%
  items: ClaimVerificationItem[];
  checkedAt: string;
}

/**
 * Executes a deterministic truth check on a set of claimed resume or profile data.
 */
export async function runTruthCheck(params: {
  userId: string;
  documentType: "RESUME" | "LINKEDIN";
  documentId?: string;
  claimedSkills: string[];
  claimedDegrees?: string[];
  claimedInstitutions?: string[];
  claimedEmployers?: string[];
  claimedCertifications?: string[];
}): Promise<TruthCheckReport> {
  const { userId, documentType, documentId } = params;

  // 1. Fetch Student Ground Truth from Career Passport & Evidence Vault
  const [profile, educations, skills, experiences, _projects, certifications, evidenceItems] =
    await Promise.all([
      db.studentProfile.findUnique({ where: { userId } }),
      db.educationRecord.findMany({ where: { userId } }),
      db.studentSkill.findMany({ where: { userId } }),
      db.studentExperience.findMany({ where: { userId } }),
      db.studentProject.findMany({ where: { userId } }),
      db.certification.findMany({ where: { userId } }),
      db.evidenceItem.findMany({ where: { userId } }),
    ]);

  const verifiedSkills = new Set<string>(skills.map((s: { name: string }) => s.name.toLowerCase().trim()));
  const evidenceSkills = new Set<string>(
    evidenceItems.filter((e: { relatedSkill: string | null }) => e.relatedSkill).map((e: { relatedSkill: string | null }) => e.relatedSkill!.toLowerCase().trim())
  );

  const verifiedDegrees = new Set<string>(
    [
      profile?.course,
      ...educations.map((e: { degree: string | null; level: string }) => e.degree || e.level),
    ]
      .filter(Boolean)
      .map((d) => (d as string).toLowerCase().trim())
  );

  const verifiedInstitutions = new Set<string>(
    [
      profile?.institution,
      ...educations.map((e: { institution: string }) => e.institution),
    ]
      .filter(Boolean)
      .map((i) => (i as string).toLowerCase().trim())
  );

  const verifiedEmployers = new Set<string>(
    experiences.map((e: { companyName: string }) => e.companyName.toLowerCase().trim())
  );

  const verifiedCerts = new Set<string>([
    ...certifications.map((c: { title: string }) => c.title.toLowerCase().trim()),
    ...evidenceItems
      .filter((e: { type: string }) => e.type === "CERTIFICATE")
      .map((e: { title: string }) => e.title.toLowerCase().trim()),
  ]);

  const items: ClaimVerificationItem[] = [];

  // 2. Check Skills
  for (const skill of params.claimedSkills) {
    const clean = skill.toLowerCase().trim();
    if (!clean) continue;

    if (evidenceSkills.has(clean)) {
      items.push({
        field: "Skill",
        claim: skill,
        status: "VERIFIED",
        reason: "Backed by an artifact in Evidence Vault.",
        provenance: "DOCUMENT_EXTRACTED",
      });
    } else if (verifiedSkills.has(clean)) {
      items.push({
        field: "Skill",
        claim: skill,
        status: "NEEDS_EVIDENCE",
        reason: "Stated in Career Passport, but has no backing certificate or repository proof.",
        provenance: "STUDENT_INPUT",
      });
    } else {
      items.push({
        field: "Skill",
        claim: skill,
        status: "UNSUPPORTED",
        reason: "Not found in your Career Passport or Evidence Vault.",
      });
    }
  }

  // 3. Check Degrees & Qualifications
  if (params.claimedDegrees) {
    for (const deg of params.claimedDegrees) {
      const clean = deg.toLowerCase().trim();
      if (!clean) continue;

      const hasMatch = Array.from(verifiedDegrees).some(
        (vd: string) => vd.includes(clean) || clean.includes(vd)
      );

      if (hasMatch) {
        items.push({
          field: "Degree",
          claim: deg,
          status: "VERIFIED",
          reason: "Matches verified education history in Career Passport.",
          provenance: "STUDENT_INPUT",
        });
      } else {
        items.push({
          field: "Degree",
          claim: deg,
          status: "UNSUPPORTED",
          reason: "Degree is not listed in your verified academic education records.",
        });
      }
    }
  }

  // 4. Check Institutions
  if (params.claimedInstitutions) {
    for (const inst of params.claimedInstitutions) {
      const clean = inst.toLowerCase().trim();
      if (!clean) continue;

      const hasMatch = Array.from(verifiedInstitutions).some(
        (vi: string) => vi.includes(clean) || clean.includes(vi)
      );

      if (hasMatch) {
        items.push({
          field: "Institution",
          claim: inst,
          status: "VERIFIED",
          reason: "Matches college/university in your verified profile.",
          provenance: "STUDENT_INPUT",
        });
      } else {
        items.push({
          field: "Institution",
          claim: inst,
          status: "UNSUPPORTED",
          reason: "Institution not found in your educational records.",
        });
      }
    }
  }

  // 5. Check Employers
  if (params.claimedEmployers) {
    for (const emp of params.claimedEmployers) {
      const clean = emp.toLowerCase().trim();
      if (!clean) continue;

      const hasMatch = Array.from(verifiedEmployers).some(
        (ve: string) => ve.includes(clean) || clean.includes(ve)
      );

      if (hasMatch) {
        items.push({
          field: "Employer / Organization",
          claim: emp,
          status: "VERIFIED",
          reason: "Matches recorded internship or work experience.",
          provenance: "STUDENT_INPUT",
        });
      } else {
        items.push({
          field: "Employer / Organization",
          claim: emp,
          status: "UNSUPPORTED",
          reason: "Organization is not documented in your verified work/internship records.",
        });
      }
    }
  }

  // 6. Check Certifications
  if (params.claimedCertifications) {
    for (const cert of params.claimedCertifications) {
      const clean = cert.toLowerCase().trim();
      if (!clean) continue;

      const hasMatch = Array.from(verifiedCerts).some(
        (vc: string) => vc.includes(clean) || clean.includes(vc)
      );

      if (hasMatch) {
        items.push({
          field: "Certification",
          claim: cert,
          status: "VERIFIED",
          reason: "Certificate verified in Evidence Vault or achievements.",
          provenance: "DOCUMENT_EXTRACTED",
        });
      } else {
        items.push({
          field: "Certification",
          claim: cert,
          status: "UNSUPPORTED",
          reason: "Certificate credential is not in your Evidence Vault.",
        });
      }
    }
  }

  // 7. Calculate Counts & Honesty Score
  const total = items.length;
  const verifiedCount = items.filter((i) => i.status === "VERIFIED").length;
  const needsEvidenceCount = items.filter((i) => i.status === "NEEDS_EVIDENCE").length;
  const unsupportedCount = items.filter((i) => i.status === "UNSUPPORTED").length;

  const honestyScore = total === 0 ? 100 : Math.round(((verifiedCount + needsEvidenceCount * 0.7) / total) * 100);

  // 8. Persist to TruthCheckResult database table
  await db.truthCheckResult.create({
    data: {
      userId,
      targetType: documentType,
      targetId: documentId || null,
      flaggedItems: JSON.stringify(items.filter((i) => i.status !== "VERIFIED")),
      supportedCount: verifiedCount,
      unsupportedCount: unsupportedCount + needsEvidenceCount,
    },
  });

  return {
    documentType,
    documentId,
    totalClaimsChecked: total,
    verifiedCount,
    needsEvidenceCount,
    unsupportedCount,
    honestyScore,
    items,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Confirm a student claim as genuine student truth (assigns PROVENANCE: STUDENT_INPUT).
 */
export async function confirmClaimAsTruth(params: {
  userId: string;
  field: string;
  claim: string;
}) {
  const { userId, field, claim } = params;
  const clean = claim.trim();

  if (field === "Skill") {
    // Add to studentSkill
    const existing = await db.studentSkill.findFirst({
      where: { userId, name: clean },
    });
    if (!existing) {
      await db.studentSkill.create({
        data: {
          userId,
          name: clean,
          category: "Technical / Core",
          proficiencyLevel: "INTERMEDIATE",
        },
      });
    }
  } else if (field === "Certification") {
    await db.evidenceItem.create({
      data: {
        userId,
        title: clean,
        type: "CERTIFICATE",
        provenance: "STUDENT_INPUT",
        description: "Self-certified student input verified via Truth Check confirmation.",
      },
    });
  }

  return { success: true, message: `Claim "${clean}" confirmed as verified student input.` };
}
