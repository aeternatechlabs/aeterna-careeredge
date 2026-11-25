// src/app/api/auth/me/route.ts
// GET /api/auth/me — returns the current user's public info (session-gated) directly via Supabase

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id, name, email, mobile, onboardingCompleted")
      .eq("id", session.userId)
      .maybeSingle();

    if (userErr) {
      throw new Error(`Failed to query user: ${userErr.message}`);
    }

    if (!userRow) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { data: profileRow } = await supabase
      .from("student_profiles")
      .select(PROFILE_COLUMNS)
      .eq("userId", session.userId)
      .maybeSingle();

    return NextResponse.json({
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        mobile: userRow.mobile,
        onboardingCompleted: Boolean(userRow.onboardingCompleted),
        profile: profileRow || null,
      },
    });
  } catch (err) {
    console.error("[/api/auth/me Route Error]:", {
      name: err instanceof Error ? err.name : "UnknownError",
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Failed to load user profile." }, { status: 500 });
  }
}
