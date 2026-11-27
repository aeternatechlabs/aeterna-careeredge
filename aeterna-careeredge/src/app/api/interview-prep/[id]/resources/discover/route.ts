// src/app/api/interview-prep/[id]/resources/discover/route.ts
// Student-facing rate-limited resource discovery endpoint (uses OpenAlex, DOAJ, plus optional Brave/YouTube/AI)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { discoverResourcesForKit } from "@/lib/interview/resources/student-discovery";

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
    const body = (await req.json().catch(() => ({}))) as {
      query?: string;
      limit?: number;
    };

    const result = await discoverResourcesForKit({
      kitId: id,
      userId: session.userId,
      query: body.query,
      limit: body.limit,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[StudentResourceDiscover POST]", err);
    return NextResponse.json({ error: "Failed to discover resources" }, { status: 500 });
  }
}
