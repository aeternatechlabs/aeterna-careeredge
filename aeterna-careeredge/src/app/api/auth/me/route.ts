// src/app/api/auth/me/route.ts
// GET /api/auth/me — returns the current user's public info (session-gated)

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getSupabaseRestConfig, supabaseRestFetch } from "@/lib/supabase/rest";

const PROFILE_COLUMNS = [
  "city",
  "state",
  "academicDomain",
  "specialization",
  "educationLevel",
  "institution",
  "course",
  "graduationYear",
  "gradingType",
  "gradeValue",
  "skills",
  "projects",
  "experience",
  "achievements",
  "certifications",
  "careerInterests",
  "preferredJobRole",
  "targetIndustry",
  "higherEducationGoal",
  "shortTermGoal",
  "longTermGoal",
  "studyAbroadCountries",
  "passportScore",
].join(",");

interface MeUserRecord {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  onboardingCompleted: boolean;
  profile: Record<string, unknown> | null;
}

async function findMeViaSupabaseRest(userId: string): Promise<MeUserRecord | null> {
  const config = getSupabaseRestConfig();
  if (!config) {
    throw new Error("Supabase REST fallback unavailable: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const userRes = await supabaseRestFetch<Array<Omit<MeUserRecord, "profile">>>(
    config,
    `/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=id,name,email,mobile,onboardingCompleted&limit=1`
  );

  if (!userRes.ok) {
    throw new Error(`Supabase REST /me user lookup failed (${userRes.status}): ${userRes.errorText}`);
  }

  const userRow = Array.isArray(userRes.data) && userRes.data.length > 0 ? userRes.data[0] : null;
  if (!userRow) return null;

  const profileRes = await supabaseRestFetch<Array<Record<string, unknown>>>(
    config,
    `/rest/v1/student_profiles?userId=eq.${encodeURIComponent(userId)}&select=${PROFILE_COLUMNS}&limit=1`
  );

  const profileRow =
    profileRes.ok && Array.isArray(profileRes.data) && profileRes.data.length > 0
      ? profileRes.data[0]
      : null;

  return {
    ...userRow,
    onboardingCompleted: Boolean(userRow.onboardingCompleted),
    profile: profileRow,
  };
}

export async function GET(): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let user: MeUserRecord | null = null;

  try {
    user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        onboardingCompleted: true,
        profile: {
          select: {
            city: true,
            state: true,
            academicDomain: true,
            specialization: true,
            educationLevel: true,
            institution: true,
            course: true,
            graduationYear: true,
            gradingType: true,
            gradeValue: true,
            skills: true,
            projects: true,
            experience: true,
            achievements: true,
            certifications: true,
            careerInterests: true,
            preferredJobRole: true,
            targetIndustry: true,
            higherEducationGoal: true,
            shortTermGoal: true,
            longTermGoal: true,
            studyAbroadCountries: true,
            passportScore: true,
          },
        },
      },
    });
  } catch (prismaErr) {
    console.warn("[/api/auth/me] Prisma unavailable, using Supabase REST fallback:", prismaErr);
    try {
      user = await findMeViaSupabaseRest(session.userId);
    } catch (restErr) {
      console.error("[/api/auth/me] Supabase REST fallback failed:", restErr);
      return NextResponse.json({ error: "Failed to load user profile." }, { status: 500 });
    }
  }

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}
