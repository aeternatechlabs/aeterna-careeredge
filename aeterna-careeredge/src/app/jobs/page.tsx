// src/app/jobs/page.tsx
// Job Discovery & Multi-Domain Market Exploration with Student Profile Matching

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { JobsClient } from "./jobs-client";
import { mapAcademicDomainToJobDomain, cleanRoleTitle } from "@/lib/jobs/domain-mapper";

export default async function JobsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      profile: {
        select: {
          academicDomain: true,
          preferredJobRole: true,
          course: true,
          institution: true,
        },
      },
      skills: {
        select: { name: true },
      },
      resumes: {
        select: { targetRole: true },
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const studentDomain = user?.profile?.academicDomain || "Engineering & Technology";
  const defaultJobDomain = mapAcademicDomainToJobDomain(studentDomain);
  const rawPreferredRole = user?.profile?.preferredJobRole || user?.resumes?.[0]?.targetRole || "";
  const preferredRole = cleanRoleTitle(rawPreferredRole);
  const studentSkills = user?.skills.map((s) => s.name) || [];

  return (
    <JobsClient
      studentName={user?.name || session.name || "Student"}
      studentProfile={{
        academicDomain: studentDomain,
        defaultJobDomain,
        preferredRole,
        skills: studentSkills,
        course: user?.profile?.course || undefined,
      }}
    />
  );
}
