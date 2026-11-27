// src/app/api/interview-prep/route.ts
// Manage domain interview prep kits with expanded Phase 1 intake validation

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  listUserInterviewKits,
  getOrCreateInterviewKit,
} from "@/lib/interview/service";
import { validateInterviewPrepIntake } from "@/lib/interview/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kits = await listUserInterviewKits(session.userId);
    return NextResponse.json({ kits });
  } catch (error) {
    console.error("Error listing interview kits:", error);
    return NextResponse.json(
      { error: "Failed to list interview prep kits" },
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

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Backward-compatible default when legacy callers omit domain
    const normalizedBody =
      typeof body === "object" && !Array.isArray(body) && !body.domain && body.jobTitle
        ? { ...body, domain: "Computer Science and IT" }
        : body;

    const validation = validateInterviewPrepIntake(normalizedBody);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error, field: validation.field },
        { status: 400 }
      );
    }

    const kit = await getOrCreateInterviewKit(session.userId, validation.data);
    return NextResponse.json(kit);
  } catch (error) {
    console.error("Error generating interview prep kit:", error);
    return NextResponse.json(
      { error: "Failed to generate interview kit" },
      { status: 500 }
    );
  }
}
