// src/app/dashboard/page.tsx

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();

  // Server-side auth check (belt + suspenders alongside proxy.ts)
  if (!session) {
    redirect("/login");
  }

  if (!session.onboardingCompleted) {
    redirect("/onboarding");
  }

  // Fetch the actual user + profile from the DB (not just the JWT)
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      profile: {
        select: {
          academicDomain: true,
          specialization: true,
          educationLevel: true,
          institution: true,
          course: true,
          gradingType: true,
          gradeValue: true,
          careerInterests: true,
          preferredJobRole: true,
          targetIndustry: true,
          passportScore: true,
        },
      },
      storedDocuments: {
        take: 5,
        select: {
          id: true,
          originalFileName: true,
          fileSizeBytes: true,
          mimeType: true,
          category: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      resumes: {
        take: 1,
        select: {
          id: true,
          title: true,
          targetRole: true,
          templateId: true,
          atsScore: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      },
      _count: {
        select: {
          educations: true,
          skills: true,
          projects: true,
          experiences: true,
          certifications: true,
          resumes: true,
          applications: true,
          evidenceItems: true,
          interviewPrepKits: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient user={user} />;
}
