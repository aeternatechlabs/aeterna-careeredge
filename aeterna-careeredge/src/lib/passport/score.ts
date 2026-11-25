// src/lib/passport/score.ts
// Centralized Passport Readiness Score calculator.
// Computes transparent readiness score based on documented academic history,
// verified competencies, projects, work experience, and certifications.

import { db } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface ScoreBreakdown {
  score: number;
  baseAccount: number;
  profileDetails: number;
  educationScore: number;
  skillsScore: number;
  projectsScore: number;
  experienceScore: number;
  certificationsScore: number;
}

export async function recalculateAndSavePassportScore(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  let user: any = null;

  if (supabase) {
    const [uRes, pRes, eRes, sRes, prjRes, expRes, cRes] = await Promise.all([
      supabase.from("users").select("id").eq("id", userId).maybeSingle(),
      supabase.from("student_profiles").select("*").eq("userId", userId).maybeSingle(),
      supabase.from("education_records").select("id").eq("userId", userId),
      supabase.from("student_skills").select("id").eq("userId", userId),
      supabase.from("student_projects").select("id").eq("userId", userId),
      supabase.from("student_experiences").select("id").eq("userId", userId),
      supabase.from("certifications").select("id").eq("userId", userId),
    ]);

    if (!uRes.data) return 15;

    user = {
      profile: pRes.data,
      educations: eRes.data || [],
      skills: sRes.data || [],
      projects: prjRes.data || [],
      experiences: expRes.data || [],
      certifications: cRes.data || [],
    };
  } else {
    user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        educations: true,
        skills: true,
        projects: true,
        experiences: true,
        certifications: true,
      },
    });
  }

  if (!user) return 15;

  let score = 15; // Base verified student account

  // Academic Profile completeness (up to 25 pts)
  const p = user.profile;
  if (p) {
    if (p.academicDomain && p.institution && p.course) score += 15;
    if (p.gradingType && p.gradeValue) score += 5;
    if (p.preferredJobRole) score += 5;
  }

  // Education Records (up to 15 pts)
  if (user.educations.length > 0) {
    score += Math.min(15, user.educations.length * 8);
  }

  // Verified Competencies & Skills (up to 15 pts)
  if (user.skills.length > 0) {
    score += Math.min(15, user.skills.length * 3);
  }

  // Practical Projects (up to 15 pts)
  if (user.projects.length > 0) {
    score += Math.min(15, user.projects.length * 8);
  }

  // Work Experience / Internships (up to 10 pts)
  if (user.experiences.length > 0) {
    score += Math.min(10, user.experiences.length * 5);
  }

  // Certifications / Proof Credentials (up to 10 pts)
  if (user.certifications.length > 0) {
    score += Math.min(10, user.certifications.length * 5);
  }

  const finalScore = Math.min(100, Math.max(15, score));

  // Save to StudentProfile if profile exists
  if (p) {
    if (supabase) {
      await supabase
        .from("student_profiles")
        .update({ passportScore: finalScore })
        .eq("userId", userId);
    } else {
      await db.studentProfile.update({
        where: { userId },
        data: { passportScore: finalScore },
      });
    }
  }

  return finalScore;
}
