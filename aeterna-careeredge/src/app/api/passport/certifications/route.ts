// src/app/api/passport/certifications/route.ts
// CRUD endpoints for Student Certifications & Credentials

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";
import { upsertCertificationRecord } from "@/lib/passport/deduplication";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      name,
      title,
      issuingOrg,
      issuingOrganization,
      issueDate,
      credentialUrl,
    } = body;

    const certTitle = (title || name || "").trim();
    const org = (issuingOrganization || issuingOrg || "").trim();

    if (!certTitle || !org) {
      return NextResponse.json(
        { error: "Certification title and issuing organization are required." },
        { status: 400 }
      );
    }

    const created = await upsertCertificationRecord(session.userId, {
      title: certTitle,
      issuingOrganization: org,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      credentialUrl: credentialUrl?.trim() || null,
      dataOrigin: "STUDENT_INPUT",
      isVerified: false,
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      certification: {
        id: created.id,
        name: created.title,
        issuingOrg: created.issuingOrganization,
        issueDate: created.issueDate ? created.issueDate.toLocaleDateString() : null,
        rawIssueDate: created.issueDate ? created.issueDate.toISOString().split("T")[0] : "",
        credentialUrl: created.credentialUrl,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Certification Create Error]", err);
    return NextResponse.json({ error: "Could not create certification." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      name,
      title,
      issuingOrg,
      issuingOrganization,
      issueDate,
      credentialUrl,
    } = body;

    if (!id) return NextResponse.json({ error: "Missing certification ID." }, { status: 400 });

    const existing = await db.certification.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Certification not found." }, { status: 404 });

    const certTitle = (title || name || existing.title).trim();
    const org = (issuingOrganization || issuingOrg || existing.issuingOrganization).trim();

    const updated = await db.certification.update({
      where: { id },
      data: {
        title: certTitle,
        issuingOrganization: org,
        issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
        credentialUrl: credentialUrl !== undefined ? credentialUrl?.trim() || null : existing.credentialUrl,
      },
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      certification: {
        id: updated.id,
        name: updated.title,
        issuingOrg: updated.issuingOrganization,
        issueDate: updated.issueDate ? updated.issueDate.toLocaleDateString() : null,
        rawIssueDate: updated.issueDate ? updated.issueDate.toISOString().split("T")[0] : "",
        credentialUrl: updated.credentialUrl,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Certification Update Error]", err);
    return NextResponse.json({ error: "Could not update certification." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing certification ID." }, { status: 400 });

    const existing = await db.certification.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Certification not found." }, { status: 404 });

    await db.certification.delete({ where: { id } });
    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({ success: true, id, score: newScore });
  } catch (err) {
    console.error("[Certification Delete Error]", err);
    return NextResponse.json({ error: "Could not delete certification." }, { status: 500 });
  }
}
