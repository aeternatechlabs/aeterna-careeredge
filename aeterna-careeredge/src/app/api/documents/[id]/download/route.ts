// src/app/api/documents/[id]/download/route.ts
// Authenticated secure download endpoint with student ownership enforcement

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { authorizeDocumentAccess } from "@/lib/storage/private-storage";
import { getStorageProvider } from "@/lib/storage/provider";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to access documents." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Document ID parameter is missing." },
        { status: 400 }
      );
    }

    // Check if document exists first to distinguish 404 from 403
    const exists = await db.storedDocument.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!exists) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    // Strict ownership verification
    const authorizedDoc = await authorizeDocumentAccess(id, session.userId);
    if (!authorizedDoc) {
      return NextResponse.json(
        { error: "Access denied. You can only access your own documents." },
        { status: 403 }
      );
    }

    // Retrieve file buffer from storage provider
    const provider = getStorageProvider();
    const buffer = await provider.download(authorizedDoc.storageKey);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": authorizedDoc.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          authorizedDoc.originalFileName
        )}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("[Document Download Error]:", error);
    return NextResponse.json(
      { error: "Failed to download document." },
      { status: 500 }
    );
  }
}
