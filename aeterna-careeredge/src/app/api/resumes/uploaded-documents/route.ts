// src/app/api/resumes/uploaded-documents/route.ts
// Lists authenticated student's uploaded resume documents strictly with ownership filtering.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    let docs: Array<{
      id: string;
      originalFileName: string;
      mimeType: string;
      fileSizeBytes: number;
      createdAt: string;
    }> = [];

    if (supabase) {
      const { data, error } = await supabase
        .from("stored_documents")
        .select("id, originalFileName, mimeType, fileSizeBytes, createdAt")
        .eq("userId", session.userId)
        .eq("category", "RESUME")
        .order("createdAt", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      docs = data || [];
    } else {
      const dbDocs = await prisma.storedDocument.findMany({
        where: {
          userId: session.userId,
          category: "RESUME",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          originalFileName: true,
          mimeType: true,
          fileSizeBytes: true,
          createdAt: true,
        },
      });
      docs = dbDocs.map((d: any) => ({
        id: d.id,
        originalFileName: d.originalFileName,
        mimeType: d.mimeType,
        fileSizeBytes: d.fileSizeBytes,
        createdAt: typeof d.createdAt === "string" ? d.createdAt : new Date(d.createdAt).toISOString(),
      }));
    }

    return NextResponse.json({ documents: docs }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to list documents." },
      { status: 500 }
    );
  }
}
