// src/app/api/resumes/[id]/review/route.ts
// In-depth Resume Intelligence & JD Alignment API (Day 2 Part 3.4)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { analyzeResumeIntelligence } from "@/lib/resume/intelligence";
import { checkEntitlement } from "@/lib/monetization/entitlements";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: session.userId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    // Check Entitlement Quota
    const entitlement = await checkEntitlement(session.userId, "RESUME_REVIEW");
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: "You have reached your monthly Resume Review limit.",
          quotaExhausted: true,
          planName: entitlement.plan.displayName,
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { jobDescription } = body;

    let structured: Record<string, unknown> = {};
    try {
      if (resume.structuredData) {
        structured = JSON.parse(resume.structuredData);
      }
    } catch {
      structured = {};
    }

    const domain = (structured.domainKey as string) || "GENERAL";
    const targetRole = resume.targetRole || "Professional";
    const summary = (structured.summary as string) || "";
    const skills = Array.isArray(structured.skills) ? (structured.skills as string[]) : [];
    const educationList = Array.isArray(structured.education) ? structured.education : [];
    const educationSummary = educationList.map((e: { degree?: string; institution?: string }) => `${e.degree || ""} at ${e.institution || ""}`).join(", ");
    const expList = Array.isArray(structured.experience) ? structured.experience : [];
    const experienceSummary = expList.map((x: { title?: string; organization?: string; description?: string }) => `${x.title || ""} at ${x.organization || ""}${x.description ? `: ${x.description}` : ""}`).join("; ");
    const projList = Array.isArray(structured.projects) ? structured.projects : [];
    const projectsSummary = projList.map((p: { title?: string; description?: string }) => `${p.title || ""}: ${p.description || ""}`).join("; ");

    const report = await analyzeResumeIntelligence({
      userId: session.userId,
      domain,
      targetRole,
      summary,
      skills,
      educationSummary,
      experienceSummary,
      projectsSummary,
      jobDescription,
    });

    // Save updated ATS score and feedback in DB
    await prisma.resume.update({
      where: { id },
      data: {
        atsScore: report.atsReadabilityScore,
        feedback: JSON.stringify(report),
      },
    });

    return NextResponse.json({ report });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to analyze resume." },
      { status: 500 }
    );
  }
}
