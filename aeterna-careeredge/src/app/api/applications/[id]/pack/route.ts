// src/app/api/applications/[id]/pack/route.ts
// Generate or retrieve 4-part Application Pack (Resume, Cover Note, Intro, Proof Talking Points)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { generateApplicationPack } from "@/lib/applications/pack";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if `id` is a JobApplication id or a direct jobId
    const app = await db.jobApplication.findFirst({
      where: { id, userId: session.userId },
    });

    const targetJobId = app?.jobListingRefId || id;
    const targetTitle = app?.jobTitle || "Career Role";
    const targetCompany = app?.companyName || "Employer";
    const targetUrl = app?.jobUrl || undefined;

    // Check if an ApplicationPack already exists
    const existing = await db.applicationPack.findFirst({
      where: { userId: session.userId, jobId: targetJobId },
    });

    if (existing) {
      let talkingPoints = [];
      let checklist = [];
      try {
        if (existing.talkingPointsJson) talkingPoints = JSON.parse(existing.talkingPointsJson);
        if (existing.checklist) checklist = JSON.parse(existing.checklist);
      } catch {}

      return NextResponse.json({
        id: existing.id,
        jobId: existing.jobId,
        jobTitle: existing.jobTitle || targetTitle,
        companyName: existing.companyName || targetCompany,
        coverNoteDraft: existing.coverNoteDraft,
        introMessageDraft: existing.introMessageDraft,
        talkingPoints,
        checklist,
        externalUrl: existing.externalUrl,
        resumeVersionId: existing.resumeVersionId,
      });
    }

    // Otherwise generate a fresh pack
    const pack = await generateApplicationPack(session.userId, {
      jobId: targetJobId,
      jobTitle: targetTitle,
      companyName: targetCompany,
      jobUrl: targetUrl,
    });

    return NextResponse.json(pack);
  } catch (error) {
    console.error("Error generating application pack:", error);
    return NextResponse.json(
      { error: "Failed to generate application pack" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Check application or use body overrides
    const app = await db.jobApplication.findFirst({
      where: { id, userId: session.userId },
    });

    const targetJobId = body.jobId || app?.jobListingRefId || id;
    const targetTitle = body.jobTitle || app?.jobTitle || "Career Role";
    const targetCompany = body.companyName || app?.companyName || "Employer";
    const targetUrl = body.jobUrl || app?.jobUrl || undefined;

    const pack = await generateApplicationPack(session.userId, {
      jobId: targetJobId,
      jobTitle: targetTitle,
      companyName: targetCompany,
      jobUrl: targetUrl,
    });

    return NextResponse.json(pack);
  } catch (error) {
    console.error("Error regenerating application pack:", error);
    return NextResponse.json(
      { error: "Failed to regenerate application pack" },
      { status: 500 }
    );
  }
}
