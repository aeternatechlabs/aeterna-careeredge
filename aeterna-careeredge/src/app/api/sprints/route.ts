// src/app/api/sprints/route.ts
// Manage Gap-to-Action 30-Day Employability Sprints

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveSprint, generate30DaySprint } from "@/lib/sprints/service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sprint = await getActiveSprint(session.userId);
    return NextResponse.json({ sprint });
  } catch (error) {
    console.error("Error retrieving sprint:", error);
    return NextResponse.json(
      { error: "Failed to load active sprint" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const targetProfession = body.targetProfession || "Technology & Software";
    const targetRole = body.targetRole || "Junior Software Engineer";

    const sprint = await generate30DaySprint(
      session.userId,
      targetProfession,
      targetRole
    );

    return NextResponse.json({ sprint });
  } catch (error) {
    console.error("Error generating sprint:", error);
    return NextResponse.json(
      { error: "Failed to generate sprint plan" },
      { status: 500 }
    );
  }
}
