// src/app/jobs/page.tsx
// Job Discovery & Multi-Domain Market Exploration with Student Profile Matching

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { JobsClient } from "./jobs-client";
import { mapAcademicDomainToJobDomain, cleanRoleTitle } from "@/lib/jobs/domain-mapper";

export default async function JobsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const supabase = getSupabaseAdmin();

  const [
    { data: userRow },
    { data: profileRow },
    { data: skillsRows },
    { data: resumesRows },
  ] = await Promise.all([
    supabase.from("users").select("id, name").eq("id", session.userId).maybeSingle(),
    supabase.from("student_profiles").select("academicDomain, preferredJobRole, course, institution").eq("userId", session.userId).maybeSingle(),
    supabase.from("student_skills").select("name").eq("userId", session.userId),
    supabase.from("resumes").select("targetRole").eq("userId", session.userId).order("updatedAt", { ascending: false }).limit(1),
  ]);

  const studentDomain = profileRow?.academicDomain || "Engineering & Technology";
  const defaultJobDomain = mapAcademicDomainToJobDomain(studentDomain);
  const rawPreferredRole = profileRow?.preferredJobRole || resumesRows?.[0]?.targetRole || "";
  const preferredRole = cleanRoleTitle(rawPreferredRole);
  const studentSkills = skillsRows?.map((s) => s.name) || [];

  return (
    <JobsClient
      studentName={userRow?.name || session.name || "Student"}
      studentProfile={{
        academicDomain: studentDomain,
        defaultJobDomain: defaultJobDomain,
        preferredRole: preferredRole,
        skills: studentSkills,
        course: profileRow?.course || undefined,
      }}
    />
  );
}
