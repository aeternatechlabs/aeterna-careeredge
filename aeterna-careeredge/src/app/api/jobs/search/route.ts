// src/app/api/jobs/search/route.ts
// Job Search API supporting multi-domain filtering, location, profile similarity ranking, and pagination

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { jobProvider } from "@/lib/jobs/provider";
import { mapAcademicDomainToJobDomain, cleanRoleTitle } from "@/lib/jobs/domain-mapper";
import type { EmploymentType, JobDomain, JobListing } from "@/lib/jobs/types";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;
    const location = searchParams.get("location") || undefined;
    const domainParam = searchParams.get("domain") as JobDomain | null;
    const domain = domainParam && domainParam !== "ALL" ? domainParam : "ALL";
    const employmentType = (searchParams.get("type") as EmploymentType) || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);
    const matchProfile = searchParams.get("matchProfile") === "true";

    // 1. Fetch student's profile & skills for factual profile similarity scoring
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        profile: {
          select: {
            academicDomain: true,
            preferredJobRole: true,
            targetIndustry: true,
          },
        },
        skills: {
          select: { name: true },
        },
        resumes: {
          select: { targetRole: true },
          take: 1,
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    const studentDomain = mapAcademicDomainToJobDomain(user?.profile?.academicDomain);
    const rawRole = user?.profile?.preferredJobRole || user?.resumes?.[0]?.targetRole || "";
    const preferredRole = cleanRoleTitle(rawRole).toLowerCase().trim();
    const studentSkills = (user?.skills || []).map((s) => s.name.toLowerCase().trim());
    const studentSkillSet = new Set(studentSkills);

    // 2. Fetch search results from provider (using preferred role when matchProfile is active without manual query)
    const effectiveQuery = query ? query.trim() : (matchProfile && preferredRole ? preferredRole : undefined);

    const result = await jobProvider.searchJobs({
      query: effectiveQuery,
      location,
      domain,
      employmentType,
      page,
      pageSize,
    });

    // 3. Compute factual profile alignment for each returned job
    const enrichedJobs: JobListing[] = result.jobs.map((job) => {
      let score = 55; // Base score for verified open position
      let matchedCount = 0;

      // Domain match bonus
      const isDomainMatch = studentDomain !== "ALL" && job.domain === studentDomain;
      if (isDomainMatch) {
        score += 25;
      }

      // Preferred Role match bonus
      if (preferredRole) {
        const titleLower = job.title.toLowerCase();
        if (titleLower.includes(preferredRole) || preferredRole.includes(titleLower)) {
          score += 25;
        } else {
          const roleTokens = preferredRole.split(/[\s/,-]+/).filter((w) => w.length > 2);
          const matchedTokenCount = roleTokens.filter((token) => titleLower.includes(token)).length;
          if (matchedTokenCount > 0) {
            score += Math.min(20, matchedTokenCount * 8);
          }
        }
      }

      // Skills overlap calculation
      for (const req of job.requirements) {
        const reqLower = req.toLowerCase().trim();
        for (const s of studentSkillSet) {
          if (s.includes(reqLower) || reqLower.includes(s)) {
            matchedCount++;
            break;
          }
        }
      }

      const totalSkillsCount = job.requirements.length;
      if (totalSkillsCount > 0) {
        const skillsRatio = matchedCount / totalSkillsCount;
        score += Math.round(skillsRatio * 15);
      }

      const finalMatchScore = Math.min(Math.max(score, 50), 98);
      const isRecommended = isDomainMatch || finalMatchScore >= 75;

      return {
        ...job,
        matchScore: finalMatchScore,
        matchedSkillsCount: matchedCount,
        totalSkillsCount: totalSkillsCount || 4,
        isRecommended,
      };
    });

    // 4. If filtering by profile match, or if on page 1 with ALL domains and no explicit keyword, sort by matchScore
    if (matchProfile || (!query && domain === "ALL")) {
      enrichedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    const hasMore = page * pageSize < result.total;

    return NextResponse.json({
      jobs: enrichedJobs,
      total: result.total,
      page,
      pageSize,
      hasMore,
      sourceProvider: result.sourceProvider,
      studentProfile: {
        academicDomain: user?.profile?.academicDomain,
        defaultJobDomain: studentDomain,
        preferredRole: user?.profile?.preferredJobRole,
        skillsCount: studentSkills.length,
      },
    });
  } catch (error) {
    console.error("Error searching jobs:", error);
    return NextResponse.json(
      { error: "Failed to search job listings" },
      { status: 500 }
    );
  }
}
