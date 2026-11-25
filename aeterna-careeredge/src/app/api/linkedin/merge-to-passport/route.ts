// src/app/api/linkedin/merge-to-passport/route.ts
// Student-Approved Merge from LinkedIn Import into Career Passport (Day 2 Part 4.2)
// Sets explicit dataOrigin and provenance; never overwrites existing records without student approval.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import {
  upsertEducationRecord,
  upsertSkillRecord,
  upsertExperienceRecord,
} from "@/lib/passport/deduplication";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      approvedSkills = [],
      approvedEducations = [],
      approvedExperiences = [],
      headline,
      provenance = "LINKEDIN_PDF",
    } = body;

    let mergedCount = 0;

    // 1. Merge Approved Skills (Deduplicated)
    for (const skillName of approvedSkills) {
      const clean = (skillName as string).trim();
      if (!clean) continue;

      await upsertSkillRecord(session.userId, {
        name: clean,
        category: "Technical / Core",
        proficiencyLevel: "INTERMEDIATE",
        dataOrigin: provenance,
      });
      mergedCount++;
    }

    // 2. Merge Approved Educations (Deduplicated with Year Extraction)
    for (const edu of approvedEducations) {
      if (!edu.institution || !edu.degree) continue;

      let startYear: number | undefined;
      let endYear: number | undefined;

      if (edu.year) {
        const yearMatches = String(edu.year).match(/\b(19\d\d|20\d\d)\b/g);
        if (yearMatches && yearMatches.length === 1) {
          endYear = parseInt(yearMatches[0], 10);
        } else if (yearMatches && yearMatches.length >= 2) {
          startYear = parseInt(yearMatches[0], 10);
          endYear = parseInt(yearMatches[1], 10);
        }
      }

      await upsertEducationRecord(session.userId, {
        institution: edu.institution,
        degree: edu.degree,
        level: "UG",
        startYear: startYear || null,
        endYear: endYear || null,
        dataOrigin: provenance,
      });
      mergedCount++;
    }

    // 3. Merge Approved Experiences (Deduplicated with Duration Parsing)
    for (const exp of approvedExperiences) {
      if (!exp.company || !exp.title) continue;

      let isCurrent = false;
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (exp.duration) {
        const durLower = String(exp.duration).toLowerCase();
        if (durLower.includes("present") || durLower.includes("current")) {
          isCurrent = true;
        }

        const yearMatches = String(exp.duration).match(/\b(19\d\d|20\d\d)\b/g);
        if (yearMatches && yearMatches.length >= 1) {
          startDate = new Date(parseInt(yearMatches[0], 10), 0, 1);
          if (yearMatches.length >= 2) {
            endDate = new Date(parseInt(yearMatches[1], 10), 11, 31);
          }
        }
      }

      await upsertExperienceRecord(session.userId, {
        companyName: exp.company,
        jobTitle: exp.title,
        description: exp.description || "",
        isCurrent,
        startDate: startDate || new Date(),
        endDate: isCurrent ? null : endDate || null,
        dataOrigin: provenance,
      });
      mergedCount++;
    }

    // 4. Update Headline in StudentProfile if requested
    if (headline && typeof headline === "string" && headline.trim()) {
      await db.studentProfile.upsert({
        where: { userId: session.userId },
        update: { headline: headline.trim() },
        create: {
          userId: session.userId,
          headline: headline.trim(),
          academicDomain: "General",
        },
      });
    }

    // 5. Update Recalculated Passport Score
    const updatedScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      mergedCount,
      skillsCount: approvedSkills.length,
      educationsCount: approvedEducations.length,
      experiencesCount: approvedExperiences.length,
      newPassportScore: updatedScore,
      message: `Successfully merged ${mergedCount} verified records into your Career Passport.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Merge operation failed." },
      { status: 500 }
    );
  }
}
