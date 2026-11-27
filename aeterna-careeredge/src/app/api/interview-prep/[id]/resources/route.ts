// src/app/api/interview-prep/[id]/resources/route.ts
// GET /api/interview-prep/[id]/resources — returns domain-matched learning resources with student progress

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getKitResourcesView } from "@/lib/interview/resources/service";

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
    const sp = req.nextUrl.searchParams;
    const view = await getKitResourcesView(id, session.userId, {
      search: sp.get("search"),
      format: sp.get("format"),
      access: sp.get("access"),
      savedOnly: sp.get("savedOnly") === "true",
      studiedOnly: sp.get("studiedOnly") === "true",
    });

    if (!view) {
      return NextResponse.json({ error: "Interview kit not found" }, { status: 404 });
    }

    return NextResponse.json(view);
  } catch (error) {
    console.error("Error loading kit learning resources:", error);
    return NextResponse.json(
      { error: "Failed to load learning resources" },
      { status: 500 }
    );
  }
}
