// src/app/api/resumes/import/route.ts
// Imports approved extracted resume data into Career Passport, creates a new Resume Studio draft,
// and optionally triggers initial ATS analysis, with strict conflict resolution.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { ParsedResumePayload } from "@/lib/resume/parser";
import { convertParsedPayloadToResumeData } from "@/lib/resume/parser";
import { computeResumeContentHash } from "@/lib/resume/adapter";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";
import { analyzeFullResume } from "@/lib/resume/ai-analyzer";
import {
  upsertEducationRecord,
  upsertSkillRecord,
  upsertExperienceRecord,
  upsertProjectRecord,
  upsertCertificationRecord,
  normalizeSkillName,
} from "@/lib/passport/deduplication";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to import resume data." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      approvedPayload,
      createResume = true,
      analyzeResume = false,
      resumeTitle,
      targetRole,
      documentId,
    }: {
      approvedPayload: ParsedResumePayload;
      createResume?: boolean;
      saveToPassport?: boolean;
      importToPassport?: boolean;
      analyzeResume?: boolean;
      resumeTitle?: string;
      targetRole?: string;
      documentId?: string;
    } = body;

    const saveToPassport = Boolean(body.saveToPassport ?? body.importToPassport ?? false);

    if (!approvedPayload) {
      return NextResponse.json(
        { error: "No approved resume data provided for import." },
        { status: 400 }
      );
    }

    const userId = session.userId;
    let createdResumeId: string | null = null;
    let updatedPassportScore: number | null = null;

    // 1. Save to Career Passport (Student explicitly approved fields)
    if (saveToPassport) {
      // Update basic profile fields if provided
      const profileUpdates: Record<string, unknown> = {};
      if (approvedPayload.contactInfo.location) profileUpdates.city = approvedPayload.contactInfo.location;
      if (targetRole) profileUpdates.preferredJobRole = targetRole;

      if (Object.keys(profileUpdates).length > 0) {
        await prisma.studentProfile.updateMany({
          where: { userId },
          data: profileUpdates,
        });
      }

      if (approvedPayload.contactInfo.phone) {
        const cleanMobile = approvedPayload.contactInfo.phone.replace(/^\+91\s?/, "").replace(/\D/g, "");
        if (cleanMobile.length >= 10) {
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { mobile: cleanMobile },
            });
          } catch {
            // Mobile unique collision or validation: safe to ignore
          }
        }
      }

      // Add/Upsert Educations (Deduplicated)
      for (const edu of approvedPayload.education) {
        if (!edu.institution && !edu.degree) continue;
        const startYearNum = edu.startYear ? parseInt(edu.startYear, 10) || undefined : undefined;
        const endYearNum = edu.endYear ? parseInt(edu.endYear, 10) || undefined : undefined;

        await upsertEducationRecord(userId, {
          institution: edu.institution || "Institution",
          degree: edu.degree || "Degree",
          level: "UG",
          fieldOfStudy: edu.branch || undefined,
          startYear: startYearNum,
          endYear: endYearNum,
          scoreOrGrade: edu.score || undefined,
          dataOrigin: "DOCUMENT_EXTRACTED",
        });
      }

      // Batch Add/Upsert Skills (1 findMany + 1 createMany instead of 48 round trips)
      const existingSkills = await prisma.studentSkill.findMany({
        where: { userId },
        select: { name: true },
      });
      const existingSkillNorms = new Set(
        existingSkills.map((s) => normalizeSkillName(s.name))
      );

      const newSkillsToInsert: Array<{
        userId: string;
        name: string;
        category: "TECHNICAL" | "DOMAIN" | "TOOL" | "SOFT";
        proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
        dataOrigin: string;
        isVerified: boolean;
      }> = [];

      for (const sk of approvedPayload.skills) {
        if (!sk.name) continue;
        const norm = normalizeSkillName(sk.name);
        if (!norm || existingSkillNorms.has(norm)) continue;
        existingSkillNorms.add(norm);
        newSkillsToInsert.push({
          userId,
          name: sk.name.trim(),
          category: (sk.category as any) || "TECHNICAL",
          proficiencyLevel: "INTERMEDIATE",
          dataOrigin: "DOCUMENT_EXTRACTED",
          isVerified: false,
        });
      }

      if (newSkillsToInsert.length > 0) {
        await prisma.studentSkill.createMany({
          data: newSkillsToInsert,
        });
      }

      // Add/Upsert Experiences (Deduplicated)
      for (const exp of approvedPayload.experience) {
        if (!exp.title && !exp.company) continue;
        await upsertExperienceRecord(userId, {
          companyName: exp.company || "Organization",
          jobTitle: exp.title || "Role",
          description: exp.bullets.join("\n"),
          isCurrent: Boolean(exp.isCurrent),
          dataOrigin: "DOCUMENT_EXTRACTED",
        });
      }

      // Add/Upsert Projects (Deduplicated)
      for (const proj of approvedPayload.projects) {
        if (!proj.title) continue;
        await upsertProjectRecord(userId, {
          title: proj.title,
          description: proj.bullets.join("\n"),
          projectUrl: proj.url || undefined,
          repositoryUrl: proj.url || undefined,
          dataOrigin: "DOCUMENT_EXTRACTED",
        });
      }

      // Add/Upsert Certifications (Deduplicated)
      for (const cert of approvedPayload.certifications) {
        if (!cert.title) continue;
        await upsertCertificationRecord(userId, {
          title: cert.title,
          issuingOrganization: cert.issuer || "Issuing Organization",
          credentialUrl: cert.url || undefined,
          dataOrigin: "DOCUMENT_EXTRACTED",
        });
      }

      // Recalculate and persist Career Passport score
      updatedPassportScore = await recalculateAndSavePassportScore(userId);
    }

    // 2. Create Resume Studio Draft
    if (createResume) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { academicDomain: true, preferredJobRole: true },
      });

      const effectiveRole = targetRole || studentProfile?.preferredJobRole || "Professional";
      const domainKey = (studentProfile?.academicDomain || "engineering").toLowerCase();

      const resumeData = convertParsedPayloadToResumeData(
        approvedPayload,
        domainKey,
        effectiveRole
      );

      const title = resumeTitle || `${effectiveRole} Resume (Uploaded)`;
      const contentHash = computeResumeContentHash(resumeData);

      const createdResume = await prisma.resume.create({
        data: {
          userId,
          title,
          targetRole: effectiveRole,
          templateId: "standard-modern",
          structuredData: JSON.stringify(resumeData),
          styleData: JSON.stringify(resumeData.style),
          contentHash,
          documentId: documentId || null,
          atsScore: 82, // Baseline imported health score
        },
      });

      createdResumeId = createdResume.id;

      // Create snapshot version record
      await prisma.resumeVersion.create({
        data: {
          resumeId: createdResume.id,
          userId,
          versionName: "Initial Uploaded Draft",
          snapshot: JSON.stringify(resumeData),
          contentHash,
          changeNote: "Generated from student-approved resume upload",
        },
      });

      // 3. Optional Immediate Analysis
      if (analyzeResume) {
        try {
          await analyzeFullResume({
            userId,
            resumeId: createdResume.id,
            resumeData,
          });
        } catch (analysisErr) {
          console.warn("[ImportResume] Initial analysis warning:", analysisErr);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        resumeId: createdResumeId,
        passportScore: updatedPassportScore,
        updatedPassportScore: updatedPassportScore,
        message: "Resume imported successfully.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Resume Import Route Error]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to import resume data.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
