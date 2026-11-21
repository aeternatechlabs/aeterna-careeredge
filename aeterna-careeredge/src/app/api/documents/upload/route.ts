// src/app/api/documents/upload/route.ts
// Authenticated student document upload with strict type and size validation

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  storeStudentDocument,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/storage/private-storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to upload documents." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "OTHER";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in upload request." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type (${file.type}). Allowed formats: PDF, DOCX, DOC, PNG, JPG.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the 5 MB limit. Provided size: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)} MB.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storedDoc = await storeStudentDocument({
      userId: session.userId,
      fileName: file.name,
      mimeType: file.type,
      buffer,
      category,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document uploaded securely.",
        document: {
          id: storedDoc.id,
          fileName: storedDoc.originalFileName,
          fileSizeBytes: storedDoc.fileSizeBytes,
          mimeType: storedDoc.mimeType,
          category: storedDoc.category,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Document Upload Error]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process document upload.";
    const isValidation =
      errorMessage.includes("File header") ||
      errorMessage.includes("Unsupported file type") ||
      errorMessage.includes("File size");
    return NextResponse.json(
      { error: errorMessage },
      { status: isValidation ? 400 : 500 }
    );
  }
}
