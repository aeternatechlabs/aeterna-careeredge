// src/app/api/passport/experiences/route.ts
// CRUD endpoints for Student Experience & Internships

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";
import { upsertExperienceRecord } from "@/lib/passport/deduplication";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      companyName,
      jobTitle,
      employmentType,
      experienceType,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
    } = body;

    if (!companyName?.trim() || !jobTitle?.trim()) {
      return NextResponse.json(
        { error: "Company name and job title are required." },
        { status: 400 }
      );
    }

    const created = await upsertExperienceRecord(session.userId, {
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      employmentType: employmentType || "INTERNSHIP",
      experienceType: experienceType || "INTERNSHIP",
      location: location?.trim() || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: isCurrent ? null : endDate ? new Date(endDate) : null,
      isCurrent: Boolean(isCurrent),
      description: description?.trim() || null,
      dataOrigin: "STUDENT_INPUT",
      isVerified: false,
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      experience: {
        id: created.id,
        jobTitle: created.jobTitle,
        companyName: created.companyName,
        employmentType: created.employmentType,
        startDate: created.startDate ? created.startDate.toLocaleDateString() : "N/A",
        endDate: created.endDate ? created.endDate.toLocaleDateString() : created.isCurrent ? "Present" : null,
        rawStartDate: created.startDate ? created.startDate.toISOString().split("T")[0] : "",
        rawEndDate: created.endDate ? created.endDate.toISOString().split("T")[0] : "",
        isCurrent: created.isCurrent,
        description: created.description,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Experience Create Error]", err);
    return NextResponse.json({ error: "Could not create experience." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      companyName,
      jobTitle,
      employmentType,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
    } = body;

    if (!id) return NextResponse.json({ error: "Missing experience ID." }, { status: 400 });

    const existing = await db.studentExperience.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Experience not found." }, { status: 404 });

    const updated = await db.studentExperience.update({
      where: { id },
      data: {
        companyName: companyName ? companyName.trim() : existing.companyName,
        jobTitle: jobTitle ? jobTitle.trim() : existing.jobTitle,
        employmentType: employmentType || existing.employmentType,
        location: location !== undefined ? location?.trim() || null : existing.location,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: isCurrent ? null : endDate ? new Date(endDate) : existing.endDate,
        isCurrent: Boolean(isCurrent),
        description: description !== undefined ? description?.trim() || null : existing.description,
      },
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      experience: {
        id: updated.id,
        jobTitle: updated.jobTitle,
        companyName: updated.companyName,
        employmentType: updated.employmentType,
        startDate: updated.startDate ? updated.startDate.toLocaleDateString() : "N/A",
        endDate: updated.endDate ? updated.endDate.toLocaleDateString() : updated.isCurrent ? "Present" : null,
        rawStartDate: updated.startDate ? updated.startDate.toISOString().split("T")[0] : "",
        rawEndDate: updated.endDate ? updated.endDate.toISOString().split("T")[0] : "",
        isCurrent: updated.isCurrent,
        description: updated.description,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Experience Update Error]", err);
    return NextResponse.json({ error: "Could not update experience." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing experience ID." }, { status: 400 });

    const existing = await db.studentExperience.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Experience not found." }, { status: 404 });

    await db.studentExperience.delete({ where: { id } });
    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({ success: true, id, score: newScore });
  } catch (err) {
    console.error("[Experience Delete Error]", err);
    return NextResponse.json({ error: "Could not delete experience." }, { status: 500 });
  }
}
