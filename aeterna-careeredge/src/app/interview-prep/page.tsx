// src/app/interview-prep/page.tsx
// Proof-Backed Domain Interview Prep Kits

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { listUserInterviewKits, type PreparedInterviewKit } from "@/lib/interview/service";
import { InterviewPrepClient } from "./interview-prep-client";

export default async function InterviewPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [kits, resolved] = await Promise.all([
    listUserInterviewKits(session.userId).catch(() => []),
    searchParams,
  ]);

  let initialActiveKit: PreparedInterviewKit | null = null;
  if (kits.length > 0) {
    const firstKit = await db.interviewPrepKit.findFirst({
      where: { id: kits[0].id, userId: session.userId },
    }).catch(() => null);

    if (firstKit) {
      let themes = [];
      try {
        themes = JSON.parse(firstKit.themesJson);
      } catch {}
      initialActiveKit = {
        id: firstKit.id,
        jobId: firstKit.jobId,
        jobTitle: firstKit.jobTitle,
        companyName: firstKit.companyName,
        themes,
        createdAt: firstKit.createdAt.toISOString(),
      };
    }
  }

  const initialJobTitle = typeof resolved.jobTitle === "string" ? resolved.jobTitle : undefined;
  const initialCompany = typeof resolved.company === "string" ? resolved.company : undefined;
  const initialDomain = typeof resolved.domain === "string" ? resolved.domain : undefined;

  return (
    <InterviewPrepClient
      studentName={session.name || "Student"}
      initialKits={kits}
      initialActiveKit={initialActiveKit}
      initialJobTitle={initialJobTitle}
      initialCompany={initialCompany}
      initialDomain={initialDomain}
    />
  );
}
