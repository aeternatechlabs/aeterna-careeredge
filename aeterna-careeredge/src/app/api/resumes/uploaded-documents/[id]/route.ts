// src/app/api/resumes/uploaded-documents/[id]/route.ts
// Secure document deletion with strict ownership authorization and file cleanup.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { authorizeDocumentAccess } from "@/lib/storage/private-storage";
import { getStorageProvider } from "@/lib/storage/provider";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const authorized = await authorizeDocumentAccess(id, session.userId);
    if (!authorized) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    // 1. Delete physical file from private storage
    const storageProvider = getStorageProvider();
    try {
      await storageProvider.delete(authorized.storageKey);
    } catch (e) {
      console.warn("[DocumentDelete] Storage file deletion notice:", e);
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
      // 2. Unlink from any resumes
      await supabase.from("resumes").update({ documentId: null }).eq("documentId", id);

      // 3. Remove DB record
      await supabase.from("stored_documents").delete().eq("id", id);
    } else {
      // 2. Unlink from any resumes
      await db.resume.updateMany({
        where: { documentId: id },
        data: { documentId: null },
      });

      // 3. Remove DB record
      await db.storedDocument.delete({
        where: { id },
      });
    }

    return NextResponse.json(
      { success: true, message: "Uploaded resume removed securely." },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to delete document." },
      { status: 500 }
    );
  }
}
