// src/app/dashboard/page.tsx

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

async function getDashboardUserData(userId: string) {
  const supabase = getSupabaseAdmin();

  // 1. Fetch user core
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", userId)
    .maybeSingle();

  if (userErr || !user) return null;

  // 2. Fetch student profile
  const { data: profile } = await supabase
    .from("student_profiles")
    .select(
      "academicDomain, specialization, educationLevel, institution, course, gradingType, gradeValue, careerInterests, preferredJobRole, targetIndustry, passportScore"
    )
    .eq("userId", userId)
    .maybeSingle();

  // 3. Fetch recent documents
  const { data: storedDocuments } = await supabase
    .from("stored_documents")
    .select("id, originalFileName, fileSizeBytes, mimeType, category, createdAt")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(5);

  // 4. Fetch recent resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, targetRole, templateId, atsScore, updatedAt")
    .eq("userId", userId)
    .order("updatedAt", { ascending: false })
    .limit(5);

  // 5. Fetch counts in parallel
  const [
    { count: educationsCount },
    { count: skillsCount },
    { count: projectsCount },
    { count: experiencesCount },
    { count: certificationsCount },
    { count: resumesCount },
    { count: applicationsCount },
    { count: evidenceCount },
    { count: prepKitsCount },
  ] = await Promise.all([
    supabase.from("education_records").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("student_skills").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("student_projects").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("student_experiences").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("certifications").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("resumes").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("evidence_items").select("*", { count: "exact", head: true }).eq("userId", userId),
    supabase.from("interview_prep_kits").select("*", { count: "exact", head: true }).eq("userId", userId),
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: profile || null,
    storedDocuments: storedDocuments || [],
    resumes: resumes || [],
    _count: {
      educations: educationsCount || 0,
      skills: skillsCount || 0,
      projects: projectsCount || 0,
      experiences: experiencesCount || 0,
      certifications: certificationsCount || 0,
      resumes: resumesCount || 0,
      applications: applicationsCount || 0,
      evidenceItems: evidenceCount || 0,
      interviewPrepKits: prepKitsCount || 0,
    },
  };
}

export default async function DashboardPage() {
  const session = await getSession();

  // Server-side auth check
  if (!session) {
    redirect("/login");
  }

  if (!session.onboardingCompleted) {
    redirect("/onboarding");
  }

  const user = await getDashboardUserData(session.userId);

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient user={user} />;
}
