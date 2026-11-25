// src/app/api/documents/route.ts
// Returns list of documents uploaded by the authenticated student

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to view documents." },
        { status: 401 }
      );
    }

    const documents = await db.storedDocument.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        originalFileName: true,
        fileSizeBytes: true,
        mimeType: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error: unknown) {
    console.error("[Documents List Error]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve documents." },
      { status: 500 }
    );
  }
}
