// src/app/api/resumes/[id]/duplicate/route.ts
// Duplicate Resume Version API (Part 2.3)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateId } from "@/lib/supabase/db-proxy";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    let existing: any = null;

    if (supabase) {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", id)
        .eq("userId", session.userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      existing = data;
    } else {
      existing = await prisma.resume.findFirst({
        where: { id, userId: session.userId },
      });
    }

    if (!existing) {
      return NextResponse.json({ error: "Resume not found or access denied." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const newTitle = body.title || `${existing.title} (Copy)`;
    const newTargetRole = body.targetRole || existing.targetRole;

    const duplicatePayload = {
      userId: session.userId,
      title: newTitle,
      targetRole: newTargetRole,
      templateId: existing.templateId,
      structuredData: existing.structuredData,
      styleData: existing.styleData,
      atsScore: existing.atsScore,
      contentHash: existing.contentHash,
    };

    let duplicated: any = null;

    if (supabase) {
      const { data, error } = await supabase
        .from("resumes")
        .insert({ id: generateId(), ...duplicatePayload, updatedAt: new Date().toISOString() })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || "Failed to duplicate resume.");
      duplicated = data;
    } else {
      duplicated = await prisma.resume.create({
        data: duplicatePayload,
      });
    }

    return NextResponse.json({ resume: duplicated }, { status: 201 });
  } catch (err: unknown) {
    console.error("[DuplicateResumeRoute] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to duplicate resume." },
      { status: 500 }
    );
  }
}
