// src/app/api/linkedin/profile/route.ts
// LinkedIn Profile Status & Analysis API (Day 2 Part 4.3 & 4.4)

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { analyzeLinkedInProfile } from "@/lib/linkedin/analysis";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        include: {
          profile: true,
          skills: true,
          experiences: true,
          certifications: true,
        },
      }),
      prisma.linkedInProfile.findUnique({
        where: { userId: session.userId },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const academicDomain = user.profile?.academicDomain || "General";
    const targetRole = user.profile?.preferredJobRole || "Professional";

    let parsedImport = null;
    if (profile?.importedRawJson) {
      try {
        parsedImport = JSON.parse(profile.importedRawJson);
      } catch {
        // Ignored
      }
    }

    let savedSections = null;
    if (profile?.sectionsJson) {
      try {
        savedSections = JSON.parse(profile.sectionsJson);
      } catch {
        // Ignored
      }
    }

    // Combine skills and experiences from DB and staged import for comprehensive readiness assessment
    const dbSkills = user.skills.map((s) => s.name);
    const importSkills: string[] = parsedImport?.skills || [];
    const skillSet = new Set<string>();
    const allSkills: string[] = [];
    for (const s of [...dbSkills, ...importSkills]) {
      const norm = s.trim().toLowerCase();
      if (norm && !skillSet.has(norm)) {
        skillSet.add(norm);
        allSkills.push(s.trim());
      }
    }

    const effectiveExpCount = Math.max(
      user.experiences.length,
      parsedImport?.experiences?.length || 0
    );

    const effectiveCertCount = Math.max(
      user.certifications.length,
      parsedImport?.certifications?.length || 0
    );

    const effectiveRole =
      user.profile?.preferredJobRole ||
      (parsedImport?.headline ? parsedImport.headline.split(/[|\-–]/)[0].trim() : "") ||
      "Professional";

    const analysisReport = await analyzeLinkedInProfile({
      userId: session.userId,
      domain: academicDomain,
      targetRole: effectiveRole,
      headline: profile?.headlineSuggestion || parsedImport?.headline || "",
      about: profile?.summarySuggestion || parsedImport?.about || "",
      skills: allSkills,
      experiencesCount: effectiveExpCount,
      certificationsCount: effectiveCertCount,
    });

    // Save optimization score in database
    if (profile) {
      await prisma.linkedInProfile.update({
        where: { userId: session.userId },
        data: { optimizationScore: analysisReport.overallScore },
      });
    }

    return NextResponse.json({
      profile,
      parsedImport,
      savedSections,
      analysisReport,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to load LinkedIn profile." },
      { status: 500 }
    );
  }
}
