// src/app/api/resumes/[id]/truth-check/route.ts
// Run Truth Check on a specific resume's data (Day 2 Addendum Section B2)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { runTruthCheck } from "@/lib/truth-check/service";

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
    const resume = await db.resume.findFirst({
      where: { id, userId: session.userId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    let structured: Record<string, unknown> = {};
    try {
      if (resume.structuredData) {
        structured = JSON.parse(resume.structuredData);
      }
    } catch {
      structured = {};
    }

    const claimedSkills = Array.isArray(structured.skills) ? (structured.skills as string[]) : [];
    const educationList = Array.isArray(structured.education) ? (structured.education as Array<{ degree?: string; institution?: string }>) : [];
    const claimedDegrees = educationList.map((e) => e.degree).filter(Boolean) as string[];
    const claimedInstitutions = educationList.map((e) => e.institution).filter(Boolean) as string[];

    const expList = Array.isArray(structured.experience) ? (structured.experience as Array<{ organization?: string }>) : [];
    const claimedEmployers = expList.map((x) => x.organization).filter(Boolean) as string[];

    const claimedCertifications = Array.isArray(structured.certifications) ? (structured.certifications as string[]) : [];

    const report = await runTruthCheck({
      userId: session.userId,
      documentType: "RESUME",
      documentId: id,
      claimedSkills,
      claimedDegrees,
      claimedInstitutions,
      claimedEmployers,
      claimedCertifications,
    });

    return NextResponse.json({ report });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to execute Truth Check." },
      { status: 500 }
    );
  }
}
