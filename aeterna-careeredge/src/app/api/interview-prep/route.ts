// src/app/api/interview-prep/route.ts
// Manage domain interview prep kits

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  listUserInterviewKits,
  getOrCreateInterviewKit,
} from "@/lib/interview/service";

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

    const body = await req.json();
    const kit = await getOrCreateInterviewKit(session.userId, {
      jobId: body.jobId,
      jobTitle: body.jobTitle || "Career Role",
      companyName: body.companyName,
      domain: body.domain,
    });

    return NextResponse.json(kit);
  } catch (error) {
    console.error("Error generating interview prep kit:", error);
    return NextResponse.json(
      { error: "Failed to generate interview kit" },
      { status: 500 }
    );
  }
}
