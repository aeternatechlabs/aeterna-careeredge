// src/app/linkedin/page.tsx
// LinkedIn Profile Intelligence & Optimization Page (Day 2 Part 4)

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { LinkedInClient } from "./linkedin-client";
import { isLinkedInConfigured } from "@/lib/linkedin/oauth";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LinkedInPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const resolved = await searchParams;
  const errorParam = typeof resolved.error === "string" ? resolved.error : undefined;
  const connectedParam = typeof resolved.connected === "string" ? resolved.connected : undefined;

  const supabase = getSupabaseAdmin();

  const [
    { data: userRow },
    { data: profileRow },
    { data: skillsRows },
    { count: experiencesCount },
    { data: linkedInRow },
  ] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", session.userId).maybeSingle(),
    supabase.from("student_profiles").select("academicDomain, preferredJobRole, course, institution").eq("userId", session.userId).maybeSingle(),
    supabase.from("student_skills").select("id, name, category").eq("userId", session.userId),
    supabase.from("student_experiences").select("*", { count: "exact", head: true }).eq("userId", session.userId),
    supabase.from("linkedin_profiles").select("*").eq("userId", session.userId).maybeSingle(),
  ]);

  if (!userRow) {
    redirect("/login");
  }

  return (
    <LinkedInClient
      user={{
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        academicDomain: profileRow?.academicDomain || "Multi-Domain",
        preferredJobRole: profileRow?.preferredJobRole || undefined,
        course: profileRow?.course || undefined,
        institution: profileRow?.institution || undefined,
      }}
      initialProfile={linkedInRow || null}
      skills={skillsRows || []}
      experiencesCount={experiencesCount || 0}
      isOidcConfigured={isLinkedInConfigured()}
      errorParam={errorParam}
      connectedParam={connectedParam}
    />
  );
}
