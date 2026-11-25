// src/app/resume/check/page.tsx
// Resume Check & Job Description Alignment Analysis (Day 2 Part 3.4)

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ResumeCheckClient } from "./resume-check-client";

export default async function ResumeCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ resumeId?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { resumeId } = await searchParams;
  const supabase = getSupabaseAdmin();

  const [
    { data: userRow },
    { data: profileRow },
    { data: resumesRows },
  ] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", session.userId).maybeSingle(),
    supabase.from("student_profiles").select("academicDomain, preferredJobRole").eq("userId", session.userId).maybeSingle(),
    supabase
      .from("resumes")
      .select("id, title, targetRole, atsScore, structuredData, feedback")
      .eq("userId", session.userId)
      .order("updatedAt", { ascending: false }),
  ]);

  if (!userRow) {
    redirect("/login");
  }

  return (
    <ResumeCheckClient
      user={{
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        academicDomain: profileRow?.academicDomain || "Multi-Domain",
        preferredJobRole: profileRow?.preferredJobRole || undefined,
      }}
      resumes={resumesRows || []}
      initialResumeId={resumeId || resumesRows?.[0]?.id}
    />
  );
}
