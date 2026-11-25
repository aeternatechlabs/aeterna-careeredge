// src/app/api/passport/projects/route.ts
// CRUD endpoints for Student Practical Projects

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";
import { upsertProjectRecord } from "@/lib/passport/deduplication";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      description,
      role,
      projectType,
      technologies,
      toolsOrTechnologies,
      projectUrl,
      artifactUrl,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Project title is required." }, { status: 400 });
    }

    const techString = technologies || toolsOrTechnologies || "";

    const created = await upsertProjectRecord(session.userId, {
      title: title.trim(),
      description: description?.trim() || "Executed practical deliverables.",
      role: role?.trim() || null,
      projectType: projectType || "PRACTICAL",
      toolsOrTechnologies: techString.trim() || null,
      projectUrl: projectUrl?.trim() || null,
      artifactUrl: artifactUrl?.trim() || null,
      dataOrigin: "STUDENT_INPUT",
      isVerified: false,
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      project: {
        id: created.id,
        title: created.title,
        description: created.description,
        role: created.role,
        technologies: created.toolsOrTechnologies,
        toolsOrTechnologies: created.toolsOrTechnologies,
        projectType: created.projectType,
        url: created.projectUrl,
        projectUrl: created.projectUrl,
        artifactUrl: created.artifactUrl,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Project Create Error]", err);
    return NextResponse.json({ error: "Could not create project." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      title,
      description,
      role,
      projectType,
      technologies,
      toolsOrTechnologies,
      projectUrl,
      artifactUrl,
    } = body;

    if (!id) return NextResponse.json({ error: "Missing project ID." }, { status: 400 });

    const existing = await db.studentProject.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const techString = technologies !== undefined ? technologies : toolsOrTechnologies !== undefined ? toolsOrTechnologies : existing.toolsOrTechnologies;

    const updated = await db.studentProject.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        description: description !== undefined ? description.trim() : existing.description,
        role: role !== undefined ? role?.trim() || null : existing.role,
        projectType: projectType || existing.projectType,
        toolsOrTechnologies: techString ? techString.trim() : null,
        techStack: techString
          ? JSON.stringify(techString.split(/[,+]/).map((t: string) => t.trim()).filter(Boolean))
          : null,
        projectUrl: projectUrl !== undefined ? projectUrl?.trim() || null : existing.projectUrl,
        artifactUrl: artifactUrl !== undefined ? artifactUrl?.trim() || null : existing.artifactUrl,
      },
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      project: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        role: updated.role,
        technologies: updated.toolsOrTechnologies,
        toolsOrTechnologies: updated.toolsOrTechnologies,
        projectType: updated.projectType,
        url: updated.projectUrl,
        projectUrl: updated.projectUrl,
        artifactUrl: updated.artifactUrl,
      },
      score: newScore,
    });
  } catch (err) {
    console.error("[Project Update Error]", err);
    return NextResponse.json({ error: "Could not update project." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing project ID." }, { status: 400 });

    const existing = await db.studentProject.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    await db.studentProject.delete({ where: { id } });
    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({ success: true, id, score: newScore });
  } catch (err) {
    console.error("[Project Delete Error]", err);
    return NextResponse.json({ error: "Could not delete project." }, { status: 500 });
  }
}
