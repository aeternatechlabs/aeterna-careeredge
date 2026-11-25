// src/app/api/resumes/[id]/improve-section/route.ts
// Single Section Improvement API (Cheaper, Focused AI Action)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { checkEntitlement } from "@/lib/monetization/entitlements";
import { normalizeResumeData } from "@/lib/resume/adapter";
import { improveSingleSection } from "@/lib/resume/ai-analyzer";

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
    let resume: any = null;

    if (supabase) {
      const [rRes, uRes, pRes] = await Promise.all([
        supabase.from("resumes").select("*").eq("id", id).eq("userId", session.userId).maybeSingle(),
        supabase.from("users").select("name, email, mobile").eq("id", session.userId).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("userId", session.userId).maybeSingle(),
      ]);
      if (rRes.data) {
        resume = {
          ...rRes.data,
          user: {
            name: uRes.data?.name || "Student",
            email: uRes.data?.email || "",
            mobile: uRes.data?.mobile || null,
            profile: pRes.data || null,
          },
        };
      }
    } else {
      resume = await db.resume.findFirst({
        where: { id, userId: session.userId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              mobile: true,
              profile: true,
            },
          },
        },
      });
    }

    if (!resume) {
      return NextResponse.json({ error: "Resume not found or access denied." }, { status: 404 });
    }

    const entitlement = await checkEntitlement(session.userId, "RESUME_CHECK");
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: "You have reached your monthly AI Section Optimization limit.",
          quotaExhausted: true,
          meter: entitlement.meter,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sectionId, updatedResumeData } = body;

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId is required." }, { status: 400 });
    }

    const resumeData = updatedResumeData
      ? normalizeResumeData(updatedResumeData, {
          name: resume.user.name,
          email: resume.user.email,
          phone: resume.user.mobile || undefined,
          domain: resume.user.profile?.academicDomain || undefined,
          preferredJobRole: resume.targetRole || undefined,
        }, resume.styleData)
      : normalizeResumeData(resume.structuredData, {
          name: resume.user.name,
          email: resume.user.email,
          phone: resume.user.mobile || undefined,
          domain: resume.user.profile?.academicDomain || undefined,
          preferredJobRole: resume.targetRole || undefined,
        }, resume.styleData);

    const sectionResult = await improveSingleSection({
      userId: session.userId,
      resumeId: id,
      resumeData,
      sectionId,
    });

    return NextResponse.json({ sectionResult });
  } catch (err: unknown) {
    console.error("[ImproveSectionRoute] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to optimize section." },
      { status: 500 }
    );
  }
}
