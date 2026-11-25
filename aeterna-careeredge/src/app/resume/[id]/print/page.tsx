// src/app/resume/[id]/print/page.tsx
// Dedicated Clean Resume Print & Export Page
// Ownership-enforced, zero layout chrome, ATS-ready print rendering.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeResumeData } from "@/lib/resume/adapter";
import { verifyExportToken } from "@/lib/resume/pdf-export";
import { PrintClient } from "./print-client";

interface PrintPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    autoPrint?: string;
    exportToken?: string;
    isPdfExport?: string;
    pageSize?: string;
  }>;
}

export async function generateMetadata({ params }: PrintPageProps): Promise<Metadata> {
  const { id } = await params;
  const resumeRecord = await db.resume.findUnique({
    where: { id },
    select: {
      targetRole: true,
      user: { select: { name: true } },
    },
  });

  const candidateName = resumeRecord?.user?.name?.trim() || "";
  const targetRole = resumeRecord?.targetRole?.trim() || "";
  const title = candidateName
    ? `${candidateName}${targetRole ? ` - ${targetRole}` : " - Resume"}`
    : "Resume";

  return {
    title,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ResumePrintPage({ params, searchParams }: PrintPageProps) {
  const { id } = await params;
  const { autoPrint, exportToken, isPdfExport, pageSize } = await searchParams;

  const resumeRecord = await db.resume.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!resumeRecord) {
    notFound();
  }

  let authenticatedUserId: string | null = null;

  // 1. Check exportToken if invoked by internal PDF generator
  if (exportToken && verifyExportToken(exportToken, id, resumeRecord.userId)) {
    authenticatedUserId = resumeRecord.userId;
  } else {
    // 2. Otherwise require valid student session
    const session = await getSession();
    if (!session || !session.userId) {
      redirect("/login");
    }
    if (session.userId !== resumeRecord.userId) {
      notFound();
    }
    authenticatedUserId = session.userId;
  }

  const [resume, user] = await Promise.all([
    db.resume.findUnique({
      where: { id },
    }),
    db.user.findUnique({
      where: { id: authenticatedUserId },
      include: { profile: true },
    }),
  ]);

  if (!resume || !user) {
    notFound();
  }

  const normalizedData = normalizeResumeData(
    resume.structuredData,
    {
      name: user.name,
      email: user.email,
      domain: user.profile?.academicDomain || undefined,
      preferredJobRole: resume.targetRole || user.profile?.preferredJobRole || undefined,
    },
    resume.styleData
  );

  return (
    <PrintClient
      resumeId={resume.id}
      data={normalizedData}
      autoPrint={autoPrint === "true"}
      isPdfExport={isPdfExport === "true"}
      pageSize={pageSize === "Letter" ? "Letter" : "A4"}
    />
  );
}
