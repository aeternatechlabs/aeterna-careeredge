// src/app/api/role-fit/route.ts
// Evaluate student role fit against occupational standards

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { evaluateRoleFit } from "@/lib/readiness/service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const profession = searchParams.get("profession") || "TECH";

    const result = await evaluateRoleFit(session.userId, profession);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error evaluating role fit:", error);
    return NextResponse.json(
      { error: "Failed to evaluate role fit" },
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

    const body = await req.json().catch(() => ({}));
    const profession = body.profession || "TECH";

    const result = await evaluateRoleFit(session.userId, profession);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error evaluating role fit:", error);
    return NextResponse.json(
      { error: "Failed to evaluate role fit" },
      { status: 500 }
    );
  }
}
