// src/app/resume/studio/page.tsx
// AI Resume Studio: Multi-Strategy Resume Generation, Gap Analysis, & Saved Resumes Hub

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { StudentLayout } from "@/components/layouts/student-layout";
import { ResumeStudioClient } from "./studio-client";

export default async function ResumeStudioPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

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
      .select("id, title, targetRole, templateId, atsScore, createdAt, updatedAt")
      .eq("userId", session.userId)
      .order("updatedAt", { ascending: false }),
  ]);

  if (!userRow) {
    redirect("/login");
  }

  const formattedResumes = (resumesRows || []).map((r) => ({
    id: r.id,
    title: r.title,
    targetRole: r.targetRole,
    templateId: r.templateId,
    atsScore: r.atsScore,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date(r.updatedAt).toISOString(),
  }));

  return (
    <StudentLayout userName={userRow.name}>
      <ResumeStudioClient initialResumes={formattedResumes} />
    </StudentLayout>
  );
}
