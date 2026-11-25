// src/app/api/resumes/[id]/ai-summary/route.ts
// AI-Powered Professional Resume Summary Generator (Day 2 Part 3.6)
// Strictly grounds summaries in verified student passport data — no hallucinations.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ServerAiService } from "@/lib/ai/provider";
import { getFrameworkForDomain } from "@/lib/resume/frameworks";
import { checkEntitlement } from "@/lib/monetization/entitlements";

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
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", id)
        .eq("userId", session.userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      resume = data;
    } else {
      resume = await prisma.resume.findFirst({
        where: { id, userId: session.userId },
      });
    }

    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    // Check entitlement
    const entitlement = await checkEntitlement(session.userId, "RESUME_CHECK");
    if (!entitlement.allowed) {
      return NextResponse.json(
        { error: "Monthly AI resume optimization limit reached." },
        { status: 403 }
      );
    }

    let structured: Record<string, unknown> = {};
    try {
      if (resume.structuredData) structured = JSON.parse(resume.structuredData);
    } catch {
      structured = {};
    }

    const targetRole = resume.targetRole || "Professional";
    const domainKey = (structured.domainKey as string) || "ENGINEERING";
    const framework = getFrameworkForDomain(domainKey);
    const skills = Array.isArray(structured.skills) ? (structured.skills as string[]) : [];
    const educationList = Array.isArray(structured.education) ? structured.education : [];
    const expList = Array.isArray(structured.experience) ? structured.experience : [];
    const projList = Array.isArray(structured.projects) ? structured.projects : [];

    const eduText = educationList
      .map((e: { degree?: string; institution?: string }) => `${e.degree || ""} at ${e.institution || ""}`)
      .filter(Boolean)
      .join(", ");
    const expText = expList
      .map((x: { title?: string; organization?: string; description?: string }) => `${x.title || ""} at ${x.organization || ""}: ${x.description || ""}`)
      .filter(Boolean)
      .join("; ");
    const projText = projList
      .map((p: { title?: string; description?: string }) => `${p.title || ""}: ${p.description || ""}`)
      .filter(Boolean)
      .join("; ");

    const aiService = new ServerAiService(15000);
    const aiRes = await aiService.generateStructuredAdvice<{
      summary: string;
      options?: Array<{ style: string; label: string; text: string }>;
    }>({
      operation: "RESUME_REVIEW",
      modelTier: "FAST",
      userId: session.userId,
      studentContext: {
        targetRole,
        academicDomain: framework.name,
        skills,
        educationSummary: eduText,
        projectsSummary: projText,
        experienceSummary: expText,
      },
      customPrompt: `You are the Lead Resume Intelligence Architect for Aeterna CareerEdge.
Generate 3 distinct, highly specialized professional resume summaries for a candidate targeting the role of "${targetRole}" in the domain of "${framework.name}".

Candidate Profile (Strict Ground Truth):
- Education: ${eduText || "Undergraduate degree in domain"}
- Verified Technical/Domain Skills: ${skills.slice(0, 10).join(", ") || "Domain fundamentals"}
- Flagship Projects: ${projText || "Practical project implementations"}
- Professional Experience & Internships: ${expText || "Academic practical training"}

STRICT ANTI-GENERIC EDITORIAL INVARIANTS:
1. ABSOLUTELY FORBIDDEN BUZZWORDS AND EMPTY CLICHÉS:
   Never use any of these phrases or words:
   - "Results-driven"
   - "Passionate"
   - "Motivated"
   - "Detail-oriented"
   - "Dynamic"
   - "Self-starter"
   - "Hard-working"
   - "Dedicated professional"
   - "Seeking an opportunity"
   - "Seeking an entry-level position"
   - "Eager to learn and contribute"
   - "Proven track record"
   - "Continuous learning"
   Any summary starting with "Results-driven" or "Passionate" will be rejected.

2. STRUCTURE REQUIREMENTS (3 CONCISE SENTENCES TOTAL):
   - Sentence 1 (Identity & Core Specialization): State domain title, academic foundation, and exact functional specialty anchored in their actual tools/stack (e.g. "Computer Science graduate specializing in TypeScript, Next.js, and relational database systems...").
   - Sentence 2 (Concrete Evidence & Flagship Accomplishment): Directly cite their actual project names, tools, or measurable results (e.g. citing the APMC Mandi price discovery portal, Razorpay internship optimization, pediatric clinical rotations, or audit reconciliations).
   - Sentence 3 (Targeted Value Proposition): State the immediate technical or clinical value they bring to a "${targetRole}" role, without begging or stating "seeking to learn".

3. DOMAIN-SPECIFIC TONE:
   - Engineering / IT: Focus on system architecture, code reliability, API patterns, and modern tech stacks.
   - Healthcare / Nursing: Focus on clinical rotation hours, NABH/JCI patient safety standards, vital monitoring, and bedside triage.
   - Commerce / Finance: Focus on GST/TDS compliance, Ind-AS statutory accounting, financial modeling, and reconciliation accuracy.
   - Teaching / Education: Focus on pedagogical frameworks, student engagement, experiential lesson design, and curriculum standards.

Generate 3 specialized options:
- style "impact" (label "🎯 Project & Deliverables Focus"): Centers heavily on flagship build, architecture, and tangible outcomes.
- style "technical" (label "⚡ Technical Stack & Depth"): Centers on technical mastery, toolchain proficiency, and core competencies.
- style "targeted" (label "🚀 Role-Targeted Value"): Directly aligned with the target role "${targetRole}" and immediate team impact.

Provide:
- summary: The premier, most impactful summary option.
- options: Array of the 3 distinct styled options with { style, label, text }.`,
      schemaDescription:
        "{ summary: string, options: Array<{ style: string, label: string, text: string }> }",
    });

    if (aiRes.success && (aiRes.data?.summary || aiRes.data?.options?.[0]?.text)) {
      const bestSummary =
        aiRes.data.options?.[0]?.text && aiRes.data.options[0].text.length > 50
          ? aiRes.data.options[0].text
          : (aiRes.data.summary?.trim() || "");

      return NextResponse.json({
        summary: bestSummary,
        options: Array.isArray(aiRes.data.options) ? aiRes.data.options : [],
      });
    }

    // High-quality deterministic fallback if AI provider is unavailable
    const topSkills = skills.slice(0, 3).join(", ") || "modern domain tools";
    const firstProj = projList[0]?.title || expList[0]?.title || "applied practical coursework";
    const fallbackSummary = `${targetRole} candidate with solid academic grounding from ${educationList[0]?.institution || "university"} and practical execution in ${topSkills}. Demonstrated practical delivery through ${firstProj}, emphasizing rigorous standards and systematic problem solving. Prepared to contribute directly to ${framework.name.toLowerCase()} initiatives requiring verified competence and strong fundamentals.`;

    return NextResponse.json({
      summary: fallbackSummary,
      options: [
        {
          style: "impact",
          label: "🎯 Project & Deliverables Focus",
          text: fallbackSummary,
        },
      ],
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate summary." },
      { status: 500 }
    );
  }
}
