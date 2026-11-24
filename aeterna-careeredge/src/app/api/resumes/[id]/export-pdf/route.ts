// src/app/api/resumes/[id]/export-pdf/route.ts
// Direct ATS-Compliant PDF Export API (Ownership Protected)
// Streams selectable vector PDF with zero app chrome directly to client.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateResumePdf } from "@/lib/resume/pdf-export";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(req.url);
    const pageSizeParam = url.searchParams.get("pageSize");
    const pageSize = pageSizeParam === "Letter" ? "Letter" : "A4";

    // Enforce strict multi-tenant ownership check
    const [resume, user] = await Promise.all([
      prisma.resume.findFirst({
        where: { id, userId: session.userId },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
      }),
    ]);

    if (!resume || !user) {
      return NextResponse.json(
        { error: "Resume not found or access denied." },
        { status: 404 }
      );
    }

    const { buffer, fileName, fallbackUrl } = await generateResumePdf({
      resumeId: resume.id,
      userId: session.userId,
      studentName: user.name,
      targetRole: resume.targetRole,
      pageSize,
    });

    if (buffer) {
      return new Response(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // Serverless fallback: return client print URL
    return NextResponse.json(
      {
        fallback: "CLIENT_PRINT",
        printUrl: fallbackUrl,
        fileName,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[ExportPdfRoute] Export generation failed:", (err as Error).message);
    const { id } = await params;
    return NextResponse.json(
      {
        fallback: "CLIENT_PRINT",
        printUrl: `/resume/${id}/print?autoPrint=true`,
      },
      { status: 200 }
    );
  }
}
