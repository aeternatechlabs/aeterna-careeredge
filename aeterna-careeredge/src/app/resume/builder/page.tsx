// src/app/resume/builder/page.tsx
// Interactive Multi-Domain Resume Builder Page (Day 2 Part 3.5)

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { BuilderClient } from "./builder-client";

export default async function ResumeBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const rawSession = session as unknown as Record<string, unknown>;
  const sessionUserId =
    session.userId ||
    (typeof rawSession.id === "string" ? rawSession.id : undefined) ||
    (typeof rawSession.sub === "string" ? rawSession.sub : undefined);

  const supabase = getSupabaseAdmin();
  const { id } = await searchParams;
  let targetResumeId = id;

  if (!targetResumeId) {
    let query = supabase.from("resumes").select("id").order("updatedAt", { ascending: false }).limit(1);
    if (sessionUserId) {
      query = query.eq("userId", sessionUserId);
    }
    const { data: latestResume } = await query.maybeSingle();

    if (latestResume?.id) {
      targetResumeId = latestResume.id;
    } else {
      redirect("/resume");
    }
  }

  let resumeQuery = supabase.from("resumes").select("*").eq("id", targetResumeId);
  if (sessionUserId) {
    resumeQuery = resumeQuery.eq("userId", sessionUserId);
  }
  const { data: resume } = await resumeQuery.maybeSingle();

  if (!resume) {
    redirect("/resume");
  }

  const targetUserId = sessionUserId || resume.userId;

  const [
    { data: userRow },
    { data: profileRow },
    { data: evidenceRows },
    { data: allUserResumes },
  ] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", targetUserId).maybeSingle(),
    supabase.from("student_profiles").select("academicDomain, preferredJobRole").eq("userId", targetUserId).maybeSingle(),
    supabase.from("evidence_items").select("id, title, type, relatedSkill, url").eq("userId", targetUserId),
    supabase
      .from("resumes")
      .select("id, title, targetRole, templateId, atsScore, styleData, updatedAt, createdAt")
      .eq("userId", targetUserId)
      .order("updatedAt", { ascending: false }),
  ]);

  if (!userRow) {
    redirect("/login");
  }

  return (
    <BuilderClient
      user={{
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        academicDomain: profileRow?.academicDomain || "Multi-Domain",
        preferredJobRole: profileRow?.preferredJobRole || undefined,
      }}
      resume={resume}
      savedResumes={allUserResumes || []}
      evidenceItems={evidenceRows || []}
    />
  );
}
