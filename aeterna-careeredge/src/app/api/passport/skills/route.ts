// src/app/api/passport/skills/route.ts
// CRUD endpoints for Student Skills

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, category, proficiencyLevel } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Skill name is required." }, { status: 400 });
    }

    const trimmedName = name.trim();
    const supabase = getSupabaseAdmin();

    if (supabase) {
      // Check if skill already exists for this user
      const { data: existing } = await supabase
        .from("student_skills")
        .select("*")
        .eq("userId", session.userId)
        .ilike("name", trimmedName)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          skill: existing,
          message: "Skill already exists.",
        });
      }

      const { data: created, error: createError } = await supabase
        .from("student_skills")
        .insert({
          userId: session.userId,
          name: trimmedName,
          category: category || "TECHNICAL",
          proficiencyLevel: proficiencyLevel || "INTERMEDIATE",
          dataOrigin: "STUDENT_INPUT",
          isVerified: false,
        })
        .select()
        .single();

      if (createError || !created) {
        throw new Error(createError?.message || "Could not create skill.");
      }

      // Also update StudentProfile.skills serialized list
      const { data: allSkills } = await supabase
        .from("student_skills")
        .select("name")
        .eq("userId", session.userId);

      if (allSkills) {
        await supabase
          .from("student_profiles")
          .update({ skills: JSON.stringify(allSkills.map((s) => s.name)) })
          .eq("userId", session.userId);
      }

      const newScore = await recalculateAndSavePassportScore(session.userId);

      return NextResponse.json({
        success: true,
        skill: created,
        score: newScore,
      });
    }

    // Check if skill already exists for this user
    const existing = await db.studentSkill.findFirst({
      where: {
        userId: session.userId,
        name: { equals: trimmedName },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        skill: existing,
        message: "Skill already exists.",
      });
    }

    const created = await db.studentSkill.create({
      data: {
        userId: session.userId,
        name: trimmedName,
        category: category || "TECHNICAL",
        proficiencyLevel: proficiencyLevel || "INTERMEDIATE",
        dataOrigin: "STUDENT_INPUT",
        isVerified: false,
      },
    });

    // Also update StudentProfile.skills serialized list
    const allSkills = await db.studentSkill.findMany({
      where: { userId: session.userId },
      select: { name: true },
    });
    await db.studentProfile.updateMany({
      where: { userId: session.userId },
      data: { skills: JSON.stringify(allSkills.map((s) => s.name)) },
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({
      success: true,
      skill: created,
      score: newScore,
    });
  } catch (err) {
    console.error("[Skill Create Error]", err);
    return NextResponse.json({ error: "Could not create skill." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing skill ID." }, { status: 400 });

    const supabase = getSupabaseAdmin();

    if (supabase) {
      const { data: existing } = await supabase
        .from("student_skills")
        .select("id")
        .eq("id", id)
        .eq("userId", session.userId)
        .maybeSingle();

      if (!existing) return NextResponse.json({ error: "Skill not found." }, { status: 404 });

      await supabase.from("student_skills").delete().eq("id", id);

      // Update StudentProfile.skills serialized list
      const { data: allSkills } = await supabase
        .from("student_skills")
        .select("name")
        .eq("userId", session.userId);

      if (allSkills) {
        await supabase
          .from("student_profiles")
          .update({ skills: JSON.stringify(allSkills.map((s) => s.name)) })
          .eq("userId", session.userId);
      }

      const newScore = await recalculateAndSavePassportScore(session.userId);

      return NextResponse.json({ success: true, id, score: newScore });
    }

    const existing = await db.studentSkill.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Skill not found." }, { status: 404 });

    await db.studentSkill.delete({ where: { id } });

    // Update StudentProfile.skills serialized list
    const allSkills = await db.studentSkill.findMany({
      where: { userId: session.userId },
      select: { name: true },
    });
    await db.studentProfile.updateMany({
      where: { userId: session.userId },
      data: { skills: JSON.stringify(allSkills.map((s) => s.name)) },
    });

    const newScore = await recalculateAndSavePassportScore(session.userId);

    return NextResponse.json({ success: true, id, score: newScore });
  } catch (err) {
    console.error("[Skill Delete Error]", err);
    return NextResponse.json({ error: "Could not delete skill." }, { status: 500 });
  }
}
