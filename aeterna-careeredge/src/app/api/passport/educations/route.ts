// src/app/api/passport/educations/route.ts
// CRUD endpoints for Student Education Records

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";
import { upsertEducationRecord } from "@/lib/passport/deduplication";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      institution,
      degree,
      level,
      fieldOfStudy,
      startYear,
      endYear,
      scoreOrGrade,
      isCurrent,
    } = body;

    if (!institution?.trim()) {
      return NextResponse.json({ error: "Institution name is required." }, { status: 400 });
    }

    const created = await upsertEducationRecord(session.userId, {
      institution: institution.trim(),
      degree: degree?.trim() || level || "Degree",
      level: level || "UG",
      fieldOfStudy: fieldOfStudy?.trim() || null,
      startYear: startYear ? Number(startYear) : null,
      endYear: isCurrent ? null : endYear ? Number(endYear) : null,
      isCurrent: Boolean(isCurrent),
      scoreOrGrade: scoreOrGrade?.trim() || null,
      dataOrigin: "STUDENT_INPUT",
      isVerified: false,
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      education: {
        id: created.id,
        institution: created.institution,
        degree: created.degree || created.level,
        fieldOfStudy: created.fieldOfStudy,
        startDate: created.startYear ? String(created.startYear) : "N/A",
        endDate: created.endYear ? String(created.endYear) : created.isCurrent ? "Present" : null,
        score: created.scoreOrGrade,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Education Create Error]", err);
    return NextResponse.json({ error: "Could not create education record." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      institution,
      degree,
      level,
      fieldOfStudy,
      startYear,
      endYear,
      scoreOrGrade,
      isCurrent,
    } = body;

    if (!id) return NextResponse.json({ error: "Missing record ID." }, { status: 400 });

    const existing = await db.educationRecord.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Record not found." }, { status: 404 });

    const updated = await db.educationRecord.update({
      where: { id },
      data: {
        institution: institution ? institution.trim() : existing.institution,
        degree: degree?.trim() || existing.degree,
        level: level || existing.level,
        fieldOfStudy: fieldOfStudy !== undefined ? fieldOfStudy?.trim() || null : existing.fieldOfStudy,
        startYear: startYear ? Number(startYear) : existing.startYear,
        endYear: isCurrent ? null : endYear ? Number(endYear) : existing.endYear,
        isCurrent: Boolean(isCurrent),
        scoreOrGrade: scoreOrGrade !== undefined ? scoreOrGrade?.trim() || null : existing.scoreOrGrade,
      },
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      education: {
        id: updated.id,
        institution: updated.institution,
        degree: updated.degree || updated.level,
        fieldOfStudy: updated.fieldOfStudy,
        startDate: updated.startYear ? String(updated.startYear) : "N/A",
        endDate: updated.endYear ? String(updated.endYear) : updated.isCurrent ? "Present" : null,
        score: updated.scoreOrGrade,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Education Update Error]", err);
    return NextResponse.json({ error: "Could not update education record." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing record ID." }, { status: 400 });

    const existing = await db.educationRecord.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Record not found." }, { status: 404 });

    await db.educationRecord.delete({ where: { id } });
    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({ success: true, id, score: newScore });
  } catch (err) {
    console.error("[Education Delete Error]", err);
    return NextResponse.json({ error: "Could not delete education record." }, { status: 500 });
  }
}
