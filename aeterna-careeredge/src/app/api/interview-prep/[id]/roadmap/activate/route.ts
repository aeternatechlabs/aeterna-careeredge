// src/app/api/interview-prep/[id]/roadmap/activate/route.ts
// POST /api/interview-prep/[id]/roadmap/activate — activates domain starter roadmap for kit

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { activateDomainStarterRoadmap } from "@/lib/interview/roadmap-engine";

export const dynamic = "force-dynamic";

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
    const result = await activateDomainStarterRoadmap(id, session.userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ versionId: result.versionId });
  } catch (err) {
    console.error("[RoadmapActivate POST]", err);
    return NextResponse.json({ error: "Failed to activate domain roadmap" }, { status: 500 });
  }
}
