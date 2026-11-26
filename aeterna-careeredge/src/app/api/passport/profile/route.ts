// src/app/api/passport/profile/route.ts
// PUT /api/passport/profile — updates student profile and basic user contact details

import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, isSecureCookie, SESSION_COOKIE_NAME } from "@/lib/session";
import { db } from "@/lib/db";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";

export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      mobile,
      headline,
      bio,
      academicDomain,
      specialization,
      educationLevel,
      institution,
      course,
      graduationYear,
      gradingType,
      gradeValue,
      preferredJobRole,
      targetIndustry,
    } = body;

    let refreshedToken: string | null = null;

    // 1. Update User name & mobile if provided
    if (name?.trim() || mobile?.trim()) {
      const normalizedMobile = mobile
        ? mobile.replace(/^\+91\s?/, "").replace(/\D/g, "")
        : undefined;

      await db.user.update({
        where: { id: session.userId },
        data: {
          ...(name?.trim() ? { name: name.trim() } : {}),
          ...(normalizedMobile ? { mobile: normalizedMobile } : {}),
        },
      });

      if (name?.trim() && name.trim() !== session.name) {
        refreshedToken = await createSession({
          ...session,
          name: name.trim(),
        });
      }
    }

    // 2. Upsert StudentProfile
    const profile = await db.studentProfile.upsert({
      where: { userId: session.userId },
      update: {
        headline: headline ?? null,
        bio: bio ?? null,
        academicDomain: academicDomain ?? null,
        specialization: specialization ?? null,
        educationLevel: educationLevel ?? null,
        institution: institution ?? null,
        course: course ?? null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        gradingType: gradingType ?? null,
        gradeValue: gradeValue ?? null,
        preferredJobRole: preferredJobRole ?? null,
        targetIndustry: targetIndustry ?? null,
      },
      create: {
        userId: session.userId,
        headline: headline ?? null,
        bio: bio ?? null,
        academicDomain: academicDomain ?? null,
        specialization: specialization ?? null,
        educationLevel: educationLevel ?? null,
        institution: institution ?? null,
        course: course ?? null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        gradingType: gradingType ?? null,
        gradeValue: gradeValue ?? null,
        preferredJobRole: preferredJobRole ?? null,
        targetIndustry: targetIndustry ?? null,
      },
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    const updatedUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, mobile: true },
    });

    const response = NextResponse.json({
      success: true,
      user: updatedUser,
      profile: {
        ...profile,
        passportScore: newScore,
      },
      score: newScore,
    });

    if (refreshedToken) {
      response.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
        httpOnly: true,
        secure: isSecureCookie(),
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    console.error("[Passport Profile Update Error]", err);
    return NextResponse.json(
      { error: "Failed to update profile details. Please try again." },
      { status: 500 }
    );
  }
}
