// src/app/api/resumes/upload/route.ts
// Authenticated Student Resume Upload, Magic-Byte Validation, Private Storage & Parsing Engine
// Strict DPDP / GDPR consent recording, zero public leaks, and DOCUMENT_EXTRACTED provenance.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { storeStudentDocument } from "@/lib/storage/private-storage";
import { recordConsent } from "@/lib/compliance/consent";
import {
  extractResumeText,
  ResumeValidationError,
  joinWrappedLines,
  normalizeBulletGlyphs,
  normalizeTextEncoding,
} from "@/lib/resume/extractor";
import { parseResumeWithIntelligence } from "@/lib/resume/parser";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to upload a resume." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = (formData.get("pastedText") as string) || "";
    const hasConsented =
      formData.get("consent") === "true" || formData.get("consentGiven") === "true";

    // 1. Mandatory Consent Check: Must record consent with timestamp & version before processing
    if (!hasConsented) {
      return NextResponse.json(
        {
          error:
            "Consent required. Please accept the data processing terms before uploading your resume.",
          code: "CONSENT_REQUIRED",
        },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Record consent in audit trail
    await recordConsent({
      userId: session.userId,
      consentType: "AI_PROCESSING",
      isGranted: true,
      version: "1.0",
      ipAddress,
      userAgent,
    });

    let extractedText = "";
    let isScanned = false;
    let format: "pdf" | "docx" | "txt" = "txt";
    let documentId: string | null = null;
    let originalFileName = "Pasted Resume Text";

    // Handle File Upload vs Pasted Text
    if (file && file.size > 0) {
      originalFileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate & Extract Text
      try {
        const extraction = await extractResumeText(buffer, file.name, file.type);
        extractedText = extraction.text;
        isScanned = extraction.isScanned;
        format = extraction.format;
      } catch (validationErr: any) {
        if (validationErr instanceof ResumeValidationError || validationErr?.code) {
          return NextResponse.json(
            { error: validationErr.message, code: validationErr.code },
            { status: 422 }
          );
        }
        throw validationErr;
      }

      // If PDF appears to be a scanned image or photograph without selectable text,
      // attempt AI Multimodal Vision OCR if API key / AI provider is active
      if (isScanned) {
        const apiKey =
          process.env.GEMINI_API_KEY ||
          process.env.ANTHROPIC_API_KEY ||
          process.env.OPENAI_API_KEY;
        const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();

        if (apiKey || provider !== "mock") {
          try {
            const { ServerAiService } = await import("@/lib/ai/provider");
            const aiService = new ServerAiService(25000);
            const base64Data = buffer.toString("base64");
            const ocrResponse = await aiService.generateStructuredAdvice<{
              extractedText?: string;
              summary?: string;
            }>({
              operation: "EXTRACTION",
              modelTier: "FAST",
              studentContext: {
                skills: [],
                name: session.name,
              },
              customPrompt:
                "Perform high-accuracy OCR on this scanned resume document. Transcribe all text faithfully preserving headers, contact details, dates, and bullet points.",
              schemaDescription: "Extracted candidate details from scanned document",
              documentAttachment: {
                mimeType: file.type || "application/pdf",
                base64Data,
              },
            });

            if (ocrResponse.success && ocrResponse.data?.extractedText && ocrResponse.data.extractedText.length >= 30) {
              extractedText = ocrResponse.data.extractedText;
              isScanned = false;
            }
          } catch (ocrErr) {
            console.warn("[Upload Route] Vision OCR fallback attempt:", ocrErr);
          }
        }

        // If after Vision OCR it remains unreadable/blank, return friendly 422 with text-paste fallback
        if (isScanned) {
          return NextResponse.json(
            {
              error:
                "This PDF appears to be a scanned image or photograph without selectable text. Please upload a digital PDF/DOCX or use the 'Paste Text' option below.",
              code: "SCANNED_PDF",
              isScanned: true,
            },
            { status: 422 }
          );
        }
      }

      // Store securely in private storage (NEVER public)
      const storedDoc = await storeStudentDocument({
        userId: session.userId,
        fileName: file.name,
        mimeType: file.type || (format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        buffer,
        category: "RESUME",
      });
      documentId = storedDoc.id;
    } else if (pastedText.trim().length > 0) {
      extractedText = joinWrappedLines(normalizeBulletGlyphs(normalizeTextEncoding(pastedText.trim())));
      originalFileName = "Pasted Resume Text";
    } else {
      return NextResponse.json(
        { error: "No resume file or text was provided in the upload request." },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.length < 15) {
      return NextResponse.json(
        {
          error:
            "No extractable text found in your document. Please ensure your PDF or DOCX contains selectable text.",
          code: "EMPTY_TEXT",
        },
        { status: 422 }
      );
    }

    // Retrieve user academic domain for domain-specific classification
    let domainKey = "ENGINEERING_TECH";
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: userProfile } = await supabase
        .from("student_profiles")
        .select("academicDomain, preferredJobRole")
        .eq("userId", session.userId)
        .maybeSingle();
      if (userProfile?.academicDomain) {
        domainKey = userProfile.academicDomain;
      }
    } else {
      const userProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.userId },
        select: { academicDomain: true, preferredJobRole: true },
      });
      if (userProfile?.academicDomain) {
        domainKey = userProfile.academicDomain;
      }
    }

    // Parse extracted text into structured entities
    const parsedPayload = await parseResumeWithIntelligence(extractedText, domainKey);

    return NextResponse.json(
      {
        success: true,
        documentId,
        fileName: originalFileName,
        format,
        parsed: parsedPayload,
        parsedData: parsedPayload,
        parsedPayload,
        rawTextSnippet: parsedPayload.rawTextSnippet,
        message:
          "Resume extracted successfully. Please review the details below before saving or creating your resume draft.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Resume Upload Route Error]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during resume upload.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
