// src/app/api/onboarding/route.ts
// POST /api/onboarding — saves completed or partial onboarding data for the current user

import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie, createSession, isSecureCookie } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateId } from "@/lib/supabase/db-proxy";
import { db } from "@/lib/db";
import type { OnboardingData } from "@/types/onboarding";

interface OnboardingRequestBody extends Partial<OnboardingData> {
  partialSave?: boolean;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const data = (await req.json()) as OnboardingRequestBody;
    const isPartial = Boolean(data.partialSave);

    // Calculate realistic Passport completion score
    let score = 15; // base for verified account
    if (data.city && data.state) score += 10;
    if (data.academicDomain && data.educationLevel && data.institution && data.course) score += 20;
    if (data.gradingType && data.gradeValue) score += 10;
    if (Array.isArray(data.skills) && data.skills.length > 0) score += 15;
    const rawProjects = data.projects as unknown;
    const hasProjects = Array.isArray(rawProjects)
      ? rawProjects.length > 0 && rawProjects.some((p) => p && typeof p === "object" && "title" in p && String((p as Record<string, unknown>).title).trim().length > 0)
      : typeof rawProjects === "string" && rawProjects.trim().length > 0;
    if (hasProjects) score += 15;
    if (data.experience?.trim() || data.certifications?.trim() || data.achievements?.trim()) score += 10;
    if (data.preferredJobRole?.trim() && Array.isArray(data.careerInterests) && data.careerInterests.length > 0) score += 5;
    const passportScore = Math.min(100, Math.max(15, score));

    const serializedProjects = Array.isArray(data.projects)
      ? JSON.stringify(data.projects)
      : (data.projects ?? null);

    const profileData = {
      userId: session.userId,
      city: data.city ?? null,
      state: data.state ?? null,
      academicDomain: data.academicDomain ?? null,
      specialization: data.specialization ?? null,
      educationLevel: data.educationLevel ?? null,
      institution: data.institution ?? null,
      course: data.course ?? null,
      graduationYear: data.graduationYear ? Number(data.graduationYear) : null,
      gradingType: data.gradingType ?? null,
      gradeValue: data.gradeValue ?? null,
      skills: data.skills ? JSON.stringify(data.skills) : null,
      projects: serializedProjects,
      experience: data.experience ?? null,
      achievements: data.achievements ?? null,
      certifications: data.certifications ?? null,
      careerInterests: data.careerInterests ? JSON.stringify(data.careerInterests) : null,
      preferredJobRole: data.preferredJobRole ?? null,
      targetIndustry: data.targetIndustry ?? null,
      higherEducationGoal: data.higherEducationGoal ?? null,
      shortTermGoal: data.shortTermGoal ?? null,
      longTermGoal: data.longTermGoal ?? null,
      studyAbroadCountries: data.studyAbroadCountries
        ? JSON.stringify(data.studyAbroadCountries)
        : null,
      passportScore,
    };

    const supabase = getSupabaseAdmin();

    // 1. Persist the student profile (upsert — idempotent)
    if (supabase) {
      const { data: existingProfile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("userId", session.userId)
        .maybeSingle();

      const nowIso = new Date().toISOString();
      if (existingProfile) {
        const { error: profileError } = await supabase
          .from("student_profiles")
          .update({ ...profileData, updatedAt: nowIso })
          .eq("userId", session.userId);
        if (profileError) {
          console.error("[Onboarding] Supabase profile update error:", profileError.message);
          throw new Error(profileError.message);
        }
      } else {
        const { error: profileError } = await supabase
          .from("student_profiles")
          .insert({ id: generateId(), ...profileData, updatedAt: nowIso });
        if (profileError) {
          console.error("[Onboarding] Supabase profile insert error:", profileError.message);
          throw new Error(profileError.message);
        }
      }
    } else {
      await db.studentProfile.upsert({
        where: { userId: session.userId },
        update: profileData,
        create: profileData,
      });
    }

    // 1b. Synchronize structured projects to relational StudentProject table
    if (Array.isArray(data.projects)) {
      const validProjects = data.projects.filter(
        (p) => p && typeof p === "object" && p.title && p.title.trim().length > 0
      );
      if (validProjects.length > 0) {
        const projectRows = validProjects.map((p) => ({
          userId: session.userId,
          title: p.title.trim(),
          role: p.role?.trim() || null,
          description: p.description?.trim() || "Executed practical deliverables.",
          toolsOrTechnologies: p.technologies?.trim() || null,
          techStack: p.technologies
            ? JSON.stringify(p.technologies.split(/[,+]/).map((t) => t.trim()).filter(Boolean))
            : null,
          projectUrl: p.url?.trim() || null,
          dataOrigin: "STUDENT_INPUT",
          isVerified: false,
        }));

        if (supabase) {
          await supabase.from("student_projects").delete().eq("userId", session.userId);
          const nowIso = new Date().toISOString();
          await supabase
            .from("student_projects")
            .insert(projectRows.map((row) => ({ id: generateId(), ...row, updatedAt: nowIso })));
        } else {
          await db.studentProject.deleteMany({ where: { userId: session.userId } });
          await db.studentProject.createMany({ data: projectRows });
        }
      }
    }

    // 2. Synchronize core User record (Name & Mobile)
    const normalizedMobile = data.mobile
      ? data.mobile.replace(/^\+91\s?/, "").replace(/\D/g, "")
      : undefined;

    let canUpdateMobile = false;
    if (normalizedMobile && normalizedMobile.length === 10) {
      if (supabase) {
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("mobile", normalizedMobile)
          .neq("id", session.userId)
          .maybeSingle();
        canUpdateMobile = !existing;
      } else {
        const existing = await db.user.findFirst({
          where: {
            mobile: normalizedMobile,
            NOT: { id: session.userId },
          },
          select: { id: true },
        });
        canUpdateMobile = !existing;
      }
    }

    const userUpdatePayload = {
      ...(isPartial ? {} : { onboardingCompleted: true }),
      ...(data.name?.trim() ? { name: data.name.trim() } : {}),
      ...(canUpdateMobile ? { mobile: normalizedMobile } : {}),
    };

    let updatedUser: { id: string; name: string; email: string; mobile: string | null; onboardingCompleted: boolean };

    if (supabase) {
      const { data: updated, error: userError } = await supabase
        .from("users")
        .update(userUpdatePayload)
        .eq("id", session.userId)
        .select("id, name, email, mobile, onboardingCompleted")
        .single();

      if (userError || !updated) {
        throw new Error(userError?.message || "Failed to update user record.");
      }
      updatedUser = updated;
    } else {
      updatedUser = await db.user.update({
        where: { id: session.userId },
        data: userUpdatePayload,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          onboardingCompleted: true,
        },
      });
    }

    // 3. Refresh session cookie with synced name and onboarding status
    const refreshedPayload = {
      ...session,
      name: updatedUser.name,
      onboardingCompleted: updatedUser.onboardingCompleted,
    };
    const refreshedToken = await createSession(refreshedPayload);
    await setSessionCookie(refreshedPayload);

    const response = NextResponse.json({
      message: isPartial ? "Progress saved." : "Onboarding complete.",
      partial: isPartial,
      user: updatedUser,
    });

    response.cookies.set("ace_session", refreshedToken, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[Onboarding Error]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
