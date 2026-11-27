// src/app/interview-prep/page.tsx
// Proof-Backed Domain Interview Prep Kits

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import {
  listUserInterviewKits,
  serializeInterviewKit,
  type PreparedInterviewKit,
} from "@/lib/interview/service";
import { getInterviewPassportPreview } from "@/lib/interview/passport-preview";
import { InterviewPrepClient } from "./interview-prep-client";

export const dynamic = "force-dynamic";

export default async function InterviewPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [kits, passportPreview, resolved] = await Promise.all([
    listUserInterviewKits(session.userId).catch(() => []),
    getInterviewPassportPreview(session.userId),
    searchParams,
  ]);

  const requestedKitId = typeof resolved.kit === "string" ? resolved.kit : undefined;
  const requestedTab = typeof resolved.tab === "string" ? resolved.tab : undefined;
  const validTabs = new Set(["OVERVIEW", "ROADMAP", "QUESTIONS_STAR", "MOCK_INTERVIEW", "STUDY_PLAN"]);
  const initialTab =
    requestedTab && validTabs.has(requestedTab)
      ? (requestedTab as "OVERVIEW" | "ROADMAP" | "QUESTIONS_STAR" | "MOCK_INTERVIEW" | "STUDY_PLAN")
      : "OVERVIEW";

  let initialActiveKit: PreparedInterviewKit | null = null;
  if (kits.length > 0) {
    const preferredId =
      requestedKitId && kits.some((k) => k.id === requestedKitId) ? requestedKitId : kits[0].id;
    const firstKit = await db.interviewPrepKit
      .findFirst({
        where: { id: preferredId, userId: session.userId },
      })
      .catch(() => null);

    if (firstKit) {
      initialActiveKit = serializeInterviewKit(firstKit);
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
      passportPreview={passportPreview}
      initialJobTitle={initialJobTitle}
      initialCompany={initialCompany}
      initialDomain={initialDomain}
      initialTab={initialTab}
    />
  );
}
