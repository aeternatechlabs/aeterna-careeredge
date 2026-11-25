// src/app/api/linkedin/import-pdf/route.ts
// LinkedIn Profile PDF Upload & Import API (Day 2 Part 4.2)
// Uses private storage; never exposes uploaded files to public/.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage/provider";
import { MAX_FILE_SIZE_BYTES } from "@/lib/storage/private-storage";
import { parseLinkedInProfileText } from "@/lib/linkedin/parser";
import { extractTextFromPdf } from "@/lib/resume/extractor";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only official LinkedIn PDF exports are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 5 MB size limit." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const storageProvider = getStorageProvider();
    const storageKey = `linkedin_${session.userId}_${Date.now()}.pdf`;

    // 1. Save strictly to private storage
    await storageProvider.upload(storageKey, bytes, file.type);

    // 2. Save StoredDocument record
    const storedDoc = await db.storedDocument.create({
      data: {
        userId: session.userId,
        originalFileName: file.name,
        storageKey,
        mimeType: file.type,
        fileSizeBytes: file.size,
        category: "RESUME",
        isPrivate: true,
      },
    });

    // 3. Extract text from PDF buffer using the unified, robust PDF extractor
    const extractionResult = await extractTextFromPdf(bytes);
    const extractedText = extractionResult.text.trim();

    if (extractionResult.isEncrypted) {
      return NextResponse.json(
        { error: "This PDF is password-protected. Please upload an unprotected PDF." },
        { status: 422 }
      );
    }

    if (extractionResult.isScanned || !extractedText) {
      return NextResponse.json(
        {
          error: "This PDF appears to have no selectable text. Please upload an official text-based LinkedIn PDF export or use the text paste option.",
        },
        { status: 422 }
      );
    }

    const parsed = parseLinkedInProfileText(extractedText, "LINKEDIN_PDF");

    // 4. Save staged import in LinkedInProfile
    await db.linkedInProfile.upsert({
      where: { userId: session.userId },
      update: {
        importedRawJson: JSON.stringify(parsed),
      },
      create: {
        userId: session.userId,
        importedRawJson: JSON.stringify(parsed),
      },
    });

    return NextResponse.json({
      success: true,
      documentId: storedDoc.id,
      parsed,
      message: "LinkedIn PDF parsed successfully. Review extracted data before saving to Career Passport.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to process LinkedIn PDF." },
      { status: 500 }
    );
  }
}
