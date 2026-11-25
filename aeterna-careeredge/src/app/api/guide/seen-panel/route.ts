// src/app/api/guide/seen-panel/route.ts
// GET / POST — persists whether a student has seen/dismissed a "How this works" panel

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ seen: false, dismissed: false });
  }

  const { searchParams } = new URL(req.url);
  const panelId = searchParams.get("panelId");
  if (!panelId) {
    return NextResponse.json({ error: "Missing panelId" }, { status: 400 });
  }

  const record = await db.guideSeenPanel.findUnique({
    where: {
      userId_panelId: {
        userId: session.userId,
        panelId,
      },
    },
  });

  return NextResponse.json({
    seen: Boolean(record),
    dismissed: Boolean(record?.dismissed),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { panelId, dismissed } = (await req.json()) as {
      panelId?: string;
      dismissed?: boolean;
    };

    if (!panelId) {
      return NextResponse.json({ error: "Missing panelId" }, { status: 400 });
    }

    const updated = await db.guideSeenPanel.upsert({
      where: {
        userId_panelId: {
          userId: session.userId,
          panelId,
        },
      },
      update: {
        dismissed: dismissed !== undefined ? Boolean(dismissed) : true,
        seenAt: new Date(),
      },
      create: {
        userId: session.userId,
        panelId,
        dismissed: dismissed !== undefined ? Boolean(dismissed) : true,
      },
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (err) {
    console.error("[GuideSeenPanel Error]", err);
    return NextResponse.json({ error: "Failed to update seen state" }, { status: 500 });
  }
}
