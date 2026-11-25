// src/app/api/value/route.ts
// Compute honest student value metrics & ROI

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    const [
      evidenceCount,
      skills,
      resumes,
      applications,
      packsCount,
      truthChecks,
      sprintPlans,
    ] = await Promise.all([
      db.evidenceItem.count({ where: { userId } }),
      db.studentSkill.findMany({ where: { userId } }),
      db.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      db.jobApplication.findMany({ where: { userId } }),
      db.applicationPack.count({ where: { userId } }),
      db.truthCheckResult.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 1 }),
      db.sprintPlan.count({ where: { userId, status: "ACTIVE" } }),
    ]);

    const totalSkills = skills.length;
    const verifiedSkills = skills.filter((s) => s.isVerified).length;
    const tc = truthChecks[0];
    const truthScore = tc
      ? Math.round((tc.supportedCount / Math.max(1, tc.supportedCount + tc.unsupportedCount)) * 100)
      : totalSkills > 0
      ? Math.round((verifiedSkills / totalSkills) * 100)
      : 100;

    const applicationsApplied = applications.filter((a) => a.applicationStatus === "APPLIED" || a.applicationStatus === "INTERVIEWING" || a.applicationStatus === "OFFER").length;
    const interviewsScheduled = applications.filter((a) => a.applicationStatus === "INTERVIEWING" || a.applicationStatus === "OFFER").length;

    // Time savings calculations:
    // ~3 hours per tailored resume & cover note
    // ~1.5 hours per interview kit & question analysis
    // ~2 hours per truth check claim audit
    const hoursSaved = resumes.length * 3 + packsCount * 2 + truthChecks.length * 2 + 5;

    return NextResponse.json({
      metrics: {
        evidenceItemsInVault: evidenceCount,
        totalSkillsRecorded: totalSkills,
        verifiedSkills,
        truthScorePercent: truthScore,
        resumesCreated: resumes.length,
        applicationPacksGenerated: packsCount,
        applicationsTracked: applications.length,
        applicationsSubmitted: applicationsApplied,
        interviewsProgressed: interviewsScheduled,
        activeSprints: sprintPlans,
        estimatedHoursSaved: hoursSaved,
      },
      latestResume: resumes[0]
        ? {
            title: resumes[0].title,
            targetRole: resumes[0].targetRole,
            atsScore: resumes[0].atsScore,
            updatedAt: resumes[0].updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error computing value metrics:", error);
    return NextResponse.json(
      { error: "Failed to compute value metrics" },
      { status: 500 }
    );
  }
}
