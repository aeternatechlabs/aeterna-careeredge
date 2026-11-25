// src/app/api/progress/route.ts
// Retrieve student progress ledger events

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStudentProgressLedger } from "@/lib/guidance/progress";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const events = await getStudentProgressLedger(session.userId, limit);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error retrieving progress ledger:", error);
    return NextResponse.json(
      { error: "Failed to load progress ledger" },
      { status: 500 }
    );
  }
}
