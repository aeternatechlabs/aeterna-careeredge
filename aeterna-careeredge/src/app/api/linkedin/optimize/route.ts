// src/app/api/linkedin/optimize/route.ts
// LinkedIn Section-by-Section Optimization API (Day 2 Part 4.5)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkEntitlement } from "@/lib/monetization/entitlements";
import { optimizeLinkedInSection, type LinkedInSectionType } from "@/lib/linkedin/optimizer";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Entitlement Quota
    const entitlement = await checkEntitlement(session.userId, "LINKEDIN_OPTIMIZATION");
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: "You have reached your monthly LinkedIn Optimization limit.",
          quotaExhausted: true,
          planName: entitlement.plan.displayName,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      sectionType = "HEADLINE",
      currentText: inputCurrentText,
      variation = 1,
      bypassCache = true,
    } = body;

    const [user, existingLinkedIn] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        include: {
          profile: true,
          skills: true,
          educations: { orderBy: { startYear: "desc" } },
          experiences: { orderBy: { startDate: "desc" } },
          evidenceItems: {
            take: 5,
            select: { title: true },
          },
        },
      }),
      prisma.linkedInProfile.findUnique({
        where: { userId: session.userId },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Parse staged LinkedIn profile if available
    let stagedImport: {
      headline?: string;
      about?: string;
      skills?: string[];
      experiences?: Array<{ title: string; company: string; duration?: string; description?: string }>;
      educations?: Array<{ degree: string; institution: string; year?: string }>;
    } | null = null;

    if (existingLinkedIn?.importedRawJson) {
      try {
        stagedImport = JSON.parse(existingLinkedIn.importedRawJson);
      } catch {
        // Ignored
      }
    }

    // Merge skills: DB skills + staged imported skills (deduplicated, preserving order)
    const dbSkills = user.skills.map((s) => s.name);
    const importedSkills = stagedImport?.skills || [];
    const skillSet = new Set<string>();
    const combinedSkills: string[] = [];

    for (const s of [...dbSkills, ...importedSkills]) {
      const norm = s.trim().toLowerCase();
      if (norm && !skillSet.has(norm)) {
        skillSet.add(norm);
        combinedSkills.push(s.trim());
      }
    }

    // Merge experiences: DB experiences + staged imported experiences
    const combinedExperiences: Array<{
      title: string;
      company: string;
      duration?: string;
      description?: string;
    }> = [];

    if (user.experiences && user.experiences.length > 0) {
      for (const exp of user.experiences) {
        combinedExperiences.push({
          title: exp.jobTitle,
          company: exp.companyName,
          duration: exp.startDate
            ? `${new Date(exp.startDate).getFullYear()} - ${exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).getFullYear() : ""}`
            : undefined,
          description: exp.description || undefined,
        });
      }
    }

    if (stagedImport?.experiences && stagedImport.experiences.length > 0) {
      for (const exp of stagedImport.experiences) {
        const isDuplicate = combinedExperiences.some(
          (e) =>
            e.title.toLowerCase() === exp.title.toLowerCase() &&
            e.company.toLowerCase() === exp.company.toLowerCase()
        );
        if (!isDuplicate) {
          combinedExperiences.push(exp);
        }
      }
    }

    // Domain & Target Role
    const domain = user.profile?.academicDomain || "Engineering & Technology";
    let targetRole = user.profile?.preferredJobRole;
    if (!targetRole && stagedImport?.headline) {
      // Extract target role from headline prefix, e.g. "Full Stack Developer | React | Node"
      const parts = stagedImport.headline.split(/[|\-–]/);
      if (parts[0]?.trim()) {
        targetRole = parts[0].trim();
      }
    }
    if (!targetRole) {
      targetRole = "Software Engineer / Professional";
    }

    // Institution and Course
    const institution =
      user.profile?.institution ||
      user.educations?.[0]?.institution ||
      stagedImport?.educations?.[0]?.institution ||
      "Higher Education Institute";

    const course =
      user.profile?.course ||
      user.educations?.[0]?.degree ||
      stagedImport?.educations?.[0]?.degree ||
      "Bachelor's Degree";

    // Evidence summary
    const evidenceSummary =
      user.evidenceItems.map((e) => e.title).join(", ") ||
      (combinedSkills.length > 0
        ? `Hands-on practical projects in ${combinedSkills.slice(0, 4).join(", ")}.`
        : "Academic coursework and lab projects.");

    // Determine currentText fallback if not provided
    let currentText = inputCurrentText?.trim() || "";
    if (!currentText) {
      if (sectionType === "HEADLINE") {
        currentText =
          user.profile?.headline ||
          existingLinkedIn?.headlineSuggestion ||
          stagedImport?.headline ||
          `${targetRole} | ${course} Graduate`;
      } else if (sectionType === "ABOUT") {
        currentText =
          user.profile?.bio ||
          existingLinkedIn?.summarySuggestion ||
          stagedImport?.about ||
          "";
      } else if (sectionType === "EXPERIENCE") {
        if (combinedExperiences.length > 0) {
          currentText = combinedExperiences
            .map(
              (e) =>
                `${e.title} at ${e.company}${e.duration ? ` (${e.duration})` : ""}${e.description ? `:\n${e.description}` : ""}`
            )
            .join("\n\n");
        }
      } else if (sectionType === "FEATURED") {
        if (user.evidenceItems.length > 0) {
          currentText = user.evidenceItems.map((e) => e.title).join(", ");
        } else if (combinedSkills.length > 0) {
          currentText = `Key Projects & Competencies: ${combinedSkills.slice(0, 4).join(", ")}`;
        }
      }
    }

    const result = await optimizeLinkedInSection({
      userId: session.userId,
      sectionType: sectionType as LinkedInSectionType,
      domain,
      targetRole,
      currentText,
      skills: combinedSkills,
      evidenceSummary,
      institution,
      course,
      experiences: combinedExperiences,
      variation: typeof variation === "number" ? variation : 1,
      bypassCache: Boolean(bypassCache),
    });

    // Update LinkedInProfile record
    const updateData: Record<string, unknown> = {};
    if (sectionType === "HEADLINE") {
      updateData.headlineSuggestion = result.improvedText;
    } else if (sectionType === "ABOUT") {
      updateData.summarySuggestion = result.improvedText;
    }

    // Update sectionsJson
    const existing = existingLinkedIn;
    let currentSections: Record<string, unknown> = {};
    if (existing?.sectionsJson) {
      try {
        currentSections = JSON.parse(existing.sectionsJson);
      } catch {
        currentSections = {};
      }
    }
    currentSections[sectionType] = result;
    updateData.sectionsJson = JSON.stringify(currentSections);

    await prisma.linkedInProfile.upsert({
      where: { userId: session.userId },
      update: updateData,
      create: {
        userId: session.userId,
        ...updateData,
      },
    });

    return NextResponse.json({
      result,
      variation: typeof variation === "number" ? variation : 1,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Optimization failed." },
      { status: 500 }
    );
  }
}
