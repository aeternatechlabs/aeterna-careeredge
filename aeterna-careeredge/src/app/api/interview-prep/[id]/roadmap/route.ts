// src/app/api/interview-prep/[id]/roadmap/route.ts
// GET /api/interview-prep/[id]/roadmap — returns personalized roadmap phases, topics, prerequisites & exercises

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getKitRoadmapView } from "@/lib/interview/roadmap-engine";

export const dynamic = "force-dynamic";

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
    const roadmapView = await getKitRoadmapView(id, session.userId);
    if (!roadmapView) {
      return NextResponse.json({ error: "Interview kit not found" }, { status: 404 });
    }

    return NextResponse.json(roadmapView);
  } catch (error) {
    console.error("Error loading kit roadmap:", error);
    return NextResponse.json(
      { error: "Failed to load interview roadmap" },
      { status: 500 }
    );
  }
}
