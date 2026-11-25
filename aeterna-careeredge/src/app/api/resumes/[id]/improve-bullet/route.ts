// src/app/api/resumes/[id]/improve-bullet/route.ts
// Targeted Bullet Improvement API (Make Specific, Shorten, Strengthen, Fix Grammar)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkEntitlement } from "@/lib/monetization/entitlements";
import { improveBullet } from "@/lib/resume/ai-analyzer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    let resume: any = null;

    if (supabase) {
      const [rRes, pRes] = await Promise.all([
        supabase.from("resumes").select("*").eq("id", id).eq("userId", session.userId).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("userId", session.userId).maybeSingle(),
      ]);
      if (rRes.data) {
        resume = {
          ...rRes.data,
          user: { profile: pRes.data || null },
        };
      }
    } else {
      resume = await prisma.resume.findFirst({
        where: { id, userId: session.userId },
        include: {
          user: {
            select: { profile: true },
          },
        },
      });
    }

    if (!resume) {
      return NextResponse.json({ error: "Resume not found or access denied." }, { status: 404 });
    }

    // Bullet improvement is lightweight and accessible
    const entitlement = await checkEntitlement(session.userId, "RESUME_CHECK");
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: "You have reached your monthly AI Optimization limit.",
          quotaExhausted: true,
          meter: entitlement.meter,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bulletText, action } = body;

    if (!bulletText || typeof bulletText !== "string") {
      return NextResponse.json({ error: "bulletText string is required." }, { status: 400 });
    }

    const validActions = ["make_specific", "shorten", "strengthen", "fix_grammar"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const suggestion = await improveBullet({
      userId: session.userId,
      targetRole: resume.targetRole || "Professional",
      domain: resume.user.profile?.academicDomain || "General",
      bulletText: bulletText.trim(),
      action,
    });

    return NextResponse.json({ suggestion });
  } catch (err: unknown) {
    console.error("[ImproveBulletRoute] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to optimize bullet." },
      { status: 500 }
    );
  }
}
