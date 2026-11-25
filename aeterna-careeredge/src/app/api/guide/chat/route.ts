// src/app/api/guide/chat/route.ts
// AI Career Guide Chat API (Day 2 Section D)
// Server-side workflow: answers static platform questions with 0 AI cost;
// routes contextual career questions through ServerAiService with quota enforcement and citations.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/provider";
import { checkEntitlement } from "@/lib/monetization/entitlements";
import { STATIC_GUIDE_FAQS } from "@/content/guide/en";
import { isWhitelistedToolRoute } from "@/lib/tools/registry";

interface GuideChatRequest {
  message: string;
  currentPath?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { message, currentPath = "/dashboard" } =
      (await req.json()) as GuideChatRequest;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    const trimmed = message.trim();

    // ── 1. Check for Static FAQs (0 AI Cost!) ────────────────────────────────
    const lower = trimmed.toLowerCase();
    const matchedFaq = STATIC_GUIDE_FAQS.find(
      (f) =>
        lower.includes(f.question.toLowerCase()) ||
        f.question.toLowerCase().includes(lower)
    );

    if (matchedFaq) {
      return NextResponse.json({
        answer: matchedFaq.answer,
        actionRoute: matchedFaq.actionRoute,
        actionLabel: matchedFaq.actionLabel,
        isStaticFaq: true,
        isAiGenerated: false,
        citations: ["CareerEdge Help Documentation"],
      });
    }

    // ── 2. Check Entitlement Quota for AI Guide Messages ─────────────────────
    const entitlement = await checkEntitlement(session.userId, "GUIDE_MESSAGES");
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: entitlement.reason,
          quotaExhausted: true,
          resetsAt: entitlement.meter.resetsAt,
        },
        { status: 429 }
      );
    }

    // ── 3. Fetch Scoped Student Context (Read-Only) ──────────────────────────
    const student = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            academicDomain: true,
            specialization: true,
            educationLevel: true,
            institution: true,
            course: true,
            preferredJobRole: true,
            targetIndustry: true,
            skills: true,
            passportScore: true,
          },
        },
        storedDocuments: {
          select: { id: true, category: true, originalFileName: true },
        },
        evidenceItems: {
          select: { id: true, type: true, title: true, relatedSkill: true },
        },
        resumes: {
          select: { id: true, title: true, targetRole: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const skills = student.profile?.skills
      ? (JSON.parse(student.profile.skills) as string[])
      : [];

    const evidenceSummary = student.evidenceItems.length
      ? `${student.evidenceItems.length} items (${student.evidenceItems.map((e) => e.title).slice(0, 3).join(", ")})`
      : "No evidence items yet";

    // ── 4. Call ServerAiService with FAST Model Tier ────────────────────────
    const aiResponse = await aiService.generateStructuredAdvice<{
      answer: string;
      nextBestStep: string;
      actionRoute: string;
      citedSources: string[];
    }>({
      operation: "CAREER_GUIDE",
      modelTier: "FAST",
      userId: session.userId,
      studentContext: {
        userId: session.userId,
        name: student.name,
        academicDomain: student.profile?.academicDomain || undefined,
        specialization: student.profile?.specialization || undefined,
        educationLevel: student.profile?.educationLevel || undefined,
        institution: student.profile?.institution || undefined,
        course: student.profile?.course || undefined,
        targetRole: student.profile?.preferredJobRole || undefined,
        preferredJobRole: student.profile?.preferredJobRole || undefined,
        targetIndustry: student.profile?.targetIndustry || undefined,
        skills,
        evidenceSummary,
      },
      customPrompt: `Student is currently viewing page "${currentPath}". Question: "${trimmed}". Provide a concise, truthful answer at Grade 8 reading level. End with exactly 1 concrete next step. Do not invent qualifications or stats.`,
      schemaDescription:
        "{ answer: string, nextBestStep: string, actionRoute: string, citedSources: string[] }",
    });

    if (!aiResponse.success || !aiResponse.data) {
      return NextResponse.json(
        { error: aiResponse.error || "Could not generate advice right now." },
        { status: 500 }
      );
    }

    // Whitelist validate action route
    const rawRoute = aiResponse.data.actionRoute || "/dashboard";
    const safeRoute = isWhitelistedToolRoute(rawRoute) ? rawRoute : "/dashboard";

    return NextResponse.json({
      answer: aiResponse.data.answer,
      nextBestStep: aiResponse.data.nextBestStep,
      actionRoute: safeRoute,
      citations: aiResponse.data.citedSources || ["Career Passport"],
      isAiGenerated: true,
      metadata: aiResponse.metadata,
      remainingQuota: entitlement.meter.remaining - 1,
    });
  } catch (err) {
    console.error("[GuideChat Error]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
