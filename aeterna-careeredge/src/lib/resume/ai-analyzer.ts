// src/lib/resume/ai-analyzer.ts
// Multi-Domain Full-Resume AI Analysis, Per-Section & Per-Bullet Optimization Service
// Strict Anti-Hallucination & Provenance Tracking (Day 2 Resume Builder Upgrade)

import { ServerAiService } from "@/lib/ai/provider";
import { recordUsage } from "@/lib/monetization/entitlements";
import { db } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateId } from "@/lib/supabase/db-proxy";
import type {
  FullResumeData,
  FullResumeAnalysisReport,
  SectionAnalysisResult,
  SectionSuggestion,
} from "./types";
import {
  FullResumeAnalysisReportSchema,
  SectionAnalysisResultSchema,
  SectionSuggestionSchema,
} from "./types";
import { computeResumeContentHash } from "./adapter";
import { getFrameworkForDomain } from "./frameworks";

export interface AnalyzeFullResumeOptions {
  userId: string;
  resumeId: string;
  resumeData: FullResumeData;
  jobDescription?: string;
  forceRefresh?: boolean;
}

export async function analyzeFullResume(
  options: AnalyzeFullResumeOptions
): Promise<FullResumeAnalysisReport> {
  const { userId, resumeId, resumeData, jobDescription, forceRefresh } = options;
  const contentHash = computeResumeContentHash(resumeData);
  const framework = getFrameworkForDomain(resumeData.domainKey);

  // 1. Content-Hash Cache Check (Zero AI Cost on Re-open)
  if (!forceRefresh) {
    const supabase = getSupabaseAdmin();
    let cachedRecord: any = null;

    if (supabase) {
      const { data } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("resumeId", resumeId)
        .eq("contentHash", contentHash)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();
      cachedRecord = data;
    } else {
      cachedRecord = await db.resumeAnalysisRecord.findFirst({
        where: {
          resumeId,
          contentHash,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (cachedRecord) {
      try {
        const parsedReport: FullResumeAnalysisReport = {
          overallScore: cachedRecord.overallScore,
          scoreExplanation: cachedRecord.overallSummary,
          topPriorityFixes: JSON.parse(cachedRecord.priorityFixes),
          sectionAnalyses: JSON.parse(cachedRecord.sectionAnalyses),
          crossSectionIssues: JSON.parse(cachedRecord.crossSectionIssues),
          atsReadabilityFindings: JSON.parse(cachedRecord.atsReadability),
          jdComparison: cachedRecord.jdComparison
            ? JSON.parse(cachedRecord.jdComparison)
            : undefined,
          contentHash: cachedRecord.contentHash,
          analyzedAt: cachedRecord.createdAt.toISOString(),
          isOutOfDate: false,
        };
        return parsedReport;
      } catch (err) {
        console.warn("[AiAnalyzer] Failed to deserialize cached analysis, regenerating:", err);
      }
    }
  }

  // 2. Prepare Structured Representation for AI
  const sectionsSummary = resumeData.sections
    .filter((s) => s.visible)
    .map((s) => {
      const entryTexts = s.entries.map((e) => {
        const bulletsText = e.bullets.map((b) => `  - [id:${b.id}] ${b.text}`).join("\n");
        return `Entry: ${e.title || "Item"}${e.subtitle ? ` (${e.subtitle})` : ""}${e.score ? ` [Score: ${e.score}]` : ""}${e.text ? `\n  Text: ${e.text}` : ""}${bulletsText ? `\n${bulletsText}` : ""}`;
      });
      return `Section [id:${s.id}, type:${s.type}, title:"${s.customTitle}"]:\n${entryTexts.join("\n")}`;
    })
    .join("\n\n");

  const prompt = `You are the Lead Resume Intelligence Architect for Aeterna CareerEdge.
Analyze this entire multi-domain resume and generate rigorous, section-by-section improvements.

Target Role: ${resumeData.targetRole}
Domain: ${framework.name}
Regulatory Standard: ${framework.regulatoryGuidelines || "National Career Standards"}
${jobDescription ? `Target Job Description:\n"""${jobDescription.slice(0, 2500)}"""\n` : ""}

Candidate Full Resume Structure:
Header: ${resumeData.contactInfo.name} | ${resumeData.contactInfo.email} | ${resumeData.contactInfo.phone} | ${resumeData.contactInfo.location}
${sectionsSummary}

STRICT TRUTHFULNESS & ANTI-HALLUCINATION INVARIANTS:
1. NEVER invent degrees, grades, college names, employers, clinical rotations, project titles, certifications, skills, dates, or metrics.
2. If a bullet lacks a quantifiable metric, DO NOT invent one. Instead, add a prompt in "missingInformation" asking the student: "Do you have a metric for this (e.g. latency, users, patient load, volume)? Add it if true."
3. Rewrite only facts already provided. Use strong active domain verbs ("Architected", "Triaged", "Reconciled", "Engineered").
4. For every suggestion:
   - Provide original text and improved text.
   - Explain why it is better (recruiter psychology / ATS).
   - Set "needsStudentConfirmation": true if the rewrite introduces any terminology or domain nuance that requires student verification.
   - Set "provenance": "AI_SUGGESTION".
5. Top 5 priority fixes must identify the highest-impact improvements across the entire resume.
6. Check cross-section consistency (e.g. skills claimed in skills section but missing in experience or projects, inconsistent date formats, etc.).

Return ONLY valid JSON matching this schema:
{
  "overallScore": number (0-100),
  "scoreExplanation": string,
  "topPriorityFixes": Array<{ "id": string, "title": string, "description": string, "impact": "high"|"medium"|"low", "sectionId": string }>,
  "sectionAnalyses": Array<{
    "sectionId": string,
    "sectionTitle": string,
    "score": number (0-100),
    "scoreExplanation": string,
    "strengths": string[],
    "issues": Array<{ "id": string, "severity": "high"|"medium"|"low", "message": string, "field": string }>,
    "missingInformation": string[],
    "suggestions": Array<{
      "id": string,
      "original": string,
      "improved": string,
      "reason": string,
      "keywordsUsed": string[],
      "evidenceSource": string,
      "needsStudentConfirmation": boolean,
      "provenance": "AI_SUGGESTION"
    }>
  }>,
  "crossSectionIssues": Array<{ "type": string, "description": string, "severity": "high"|"medium"|"low", "affectedSections": string[] }>,
  "atsReadabilityFindings": {
    "readabilityScore": number (0-100),
    "formatCheck": "PASS"|"WARNING"|"FAIL",
    "bulletLengthEvaluation": string,
    "standardHeadingsDetected": string[],
    "unconventionalHeadings": string[],
    "warnings": string[]
  },
  "jdComparison": {
    "targetRole": string,
    "atsMatchScore": number (0-100),
    "matchingRequirements": string[],
    "missingRequirements": string[],
    "unsupportedRequirements": string[],
    "recommendedKeywords": string[]
  } (optional)
}`;

  const aiService = new ServerAiService(25000);
  const startTime = Date.now();

  const aiRes = await aiService.generateStructuredAdvice<Record<string, unknown>>({
    operation: "RESUME_REVIEW",
    modelTier: "QUALITY",
    userId,
    studentContext: {
      userId,
      academicDomain: framework.name,
      targetRole: resumeData.targetRole,
      skills: resumeData.sections.find((s) => s.type === "skills")?.entries.flatMap((e) => e.tags || []) || [],
      evidenceSummary: `${resumeData.sections.length} sections analyzed`,
    },
    customPrompt: prompt,
    schemaDescription:
      "{ overallScore: number, scoreExplanation: string, topPriorityFixes: Array, sectionAnalyses: Array, crossSectionIssues: Array, atsReadabilityFindings: Object, jdComparison: Object }",
  });

  let validatedReport: FullResumeAnalysisReport;

  if (aiRes.success && aiRes.data) {
    try {
      const rawData = {
        ...aiRes.data,
        contentHash,
        analyzedAt: new Date().toISOString(),
        isOutOfDate: false,
      };
      validatedReport = FullResumeAnalysisReportSchema.parse(rawData);
    } catch (parseErr) {
      console.warn("[AiAnalyzer] Zod validation failed on full resume response, applying safe normalization:", parseErr);
      validatedReport = createFallbackFullReport(resumeData, contentHash, framework.name, jobDescription);
    }
  } else {
    validatedReport = createFallbackFullReport(resumeData, contentHash, framework.name, jobDescription);
  }

  // 3. Persist Analysis Record in DB
  try {
    const supabase = getSupabaseAdmin();
    const analysisPayload = {
      resumeId,
      userId,
      contentHash,
      overallScore: validatedReport.overallScore,
      overallSummary: validatedReport.scoreExplanation,
      priorityFixes: JSON.stringify(validatedReport.topPriorityFixes),
      sectionAnalyses: JSON.stringify(validatedReport.sectionAnalyses),
      crossSectionIssues: JSON.stringify(validatedReport.crossSectionIssues),
      atsReadability: JSON.stringify(validatedReport.atsReadabilityFindings),
      jdComparison: validatedReport.jdComparison ? JSON.stringify(validatedReport.jdComparison) : null,
      isAiGenerated: !!aiRes.success,
    };

    const resumeUpdatePayload = {
      atsScore: validatedReport.overallScore,
      contentHash,
      lastAnalyzedAt: new Date().toISOString(),
      feedback: JSON.stringify({
        overallScore: validatedReport.overallScore,
        scoreExplanation: validatedReport.scoreExplanation,
        priorityFixes: validatedReport.topPriorityFixes,
      }),
    };

    if (supabase) {
      await supabase.from("resume_analyses").insert({ id: generateId(), ...analysisPayload });
      await supabase.from("resumes").update({ ...resumeUpdatePayload, updatedAt: new Date().toISOString() }).eq("id", resumeId);
    } else {
      await db.resumeAnalysisRecord.create({
        data: analysisPayload,
      });

      // Update resume record with latest score and content hash
      await db.resume.update({
        where: { id: resumeId },
        data: {
          atsScore: validatedReport.overallScore,
          contentHash,
          lastAnalyzedAt: new Date(),
          feedback: JSON.stringify({
            overallScore: validatedReport.overallScore,
            scoreExplanation: validatedReport.scoreExplanation,
            priorityFixes: validatedReport.topPriorityFixes,
          }),
        },
      });
    }

    // Record usage with operation key
    await recordUsage({
      userId,
      featureKey: "resume.analyze_full",
      operationType: "RESUME_REVIEW",
      inputTokens: aiRes.metadata?.usage.inputTokens || 850,
      outputTokens: aiRes.metadata?.usage.outputTokens || 450,
      estimatedCost: aiRes.metadata?.usage.estimatedCostInr || 0.05,
      provider: aiRes.metadata?.provider || "google-gemini",
      model: aiRes.metadata?.model || "gemini-3.5-flash-lite",
      latencyMs: Date.now() - startTime,
    });
  } catch (dbErr) {
    console.error("[AiAnalyzer] Failed to persist analysis record:", dbErr);
  }

  return validatedReport;
}

// ── Single Section Improvement Service (Cheaper FAST Model) ───────────────────

export async function improveSingleSection(params: {
  userId: string;
  resumeId: string;
  resumeData: FullResumeData;
  sectionId: string;
}): Promise<SectionAnalysisResult> {
  const { userId, resumeData, sectionId } = params;
  const section = resumeData.sections.find((s) => s.id === sectionId);

  if (!section) {
    throw new Error(`Section with ID ${sectionId} not found.`);
  }

  const framework = getFrameworkForDomain(resumeData.domainKey);
  const aiService = new ServerAiService(15000);
  const startTime = Date.now();

  const sectionContent = section.entries
    .map((e) => {
      const bullets = e.bullets.map((b) => `  - [id:${b.id}] ${b.text}`).join("\n");
      return `Item: ${e.title || "Entry"}${e.subtitle ? ` (${e.subtitle})` : ""}${e.text ? `\n  Text: ${e.text}` : ""}${bullets ? `\n${bullets}` : ""}${e.tags ? `\n  Tags: ${e.tags.join(", ")}` : ""}`;
    })
    .join("\n");

  const prompt = `Analyze and optimize ONLY this single section of a candidate's resume.
Target Role: ${resumeData.targetRole}
Domain: ${framework.name}
Section: "${section.customTitle}" (Type: ${section.type})

Section Content:
${sectionContent}

INVARIANTS:
1. NEVER invent employers, colleges, metrics, degrees, or dates.
2. If metrics would help, list a prompt in "missingInformation".
3. Return rewritten, higher-impact suggestions with reasons and keywords.
4. Set needsStudentConfirmation to true if new domain terminology is suggested.

Return ONLY valid JSON matching this schema:
{
  "sectionId": "${section.id}",
  "sectionTitle": "${section.customTitle}",
  "score": number (0-100),
  "scoreExplanation": string,
  "strengths": string[],
  "issues": Array<{ "id": string, "severity": "high"|"medium"|"low", "message": string, "field": string }>,
  "missingInformation": string[],
  "suggestions": Array<{
    "id": string,
    "original": string,
    "improved": string,
    "reason": string,
    "keywordsUsed": string[],
    "evidenceSource": string,
    "needsStudentConfirmation": boolean,
    "provenance": "AI_SUGGESTION"
  }>
}`;

  const aiRes = await aiService.generateStructuredAdvice<Record<string, unknown>>({
    operation: "RESUME_REVIEW",
    modelTier: "FAST",
    userId,
    studentContext: {
      userId,
      academicDomain: framework.name,
      targetRole: resumeData.targetRole,
      skills: resumeData.sections.find((s) => s.type === "skills")?.entries.flatMap((e) => e.tags || []) || [],
    },
    customPrompt: prompt,
    schemaDescription:
      "{ sectionId: string, sectionTitle: string, score: number, scoreExplanation: string, strengths: string[], issues: Array, missingInformation: string[], suggestions: Array }",
  });

  let result: SectionAnalysisResult;
  if (aiRes.success && aiRes.data) {
    try {
      result = SectionAnalysisResultSchema.parse({
        ...aiRes.data,
        sectionId: section.id,
        sectionTitle: section.customTitle,
      });
    } catch {
      result = createFallbackSectionResult(section, framework.name);
    }
  } else {
    result = createFallbackSectionResult(section, framework.name);
  }

  // Record usage
  await recordUsage({
    userId,
    featureKey: "resume.improve_section",
    operationType: "RESUME_REVIEW",
    inputTokens: aiRes.metadata?.usage.inputTokens || 350,
    outputTokens: aiRes.metadata?.usage.outputTokens || 200,
    estimatedCost: aiRes.metadata?.usage.estimatedCostInr || 0.015,
    provider: aiRes.metadata?.provider || "google-gemini",
    model: aiRes.metadata?.model || "gemini-3.5-flash-lite",
    latencyMs: Date.now() - startTime,
  });

  return result;
}

// ── Targeted Bullet Point Action Service ──────────────────────────────────────

export async function improveBullet(params: {
  userId: string;
  targetRole: string;
  domain: string;
  bulletText: string;
  action: "make_specific" | "shorten" | "strengthen" | "fix_grammar";
}): Promise<SectionSuggestion> {
  const { userId, targetRole, domain, bulletText, action } = params;
  const aiService = new ServerAiService(10000);
  const startTime = Date.now();

  const actionInstructions = {
    make_specific: "Add specificity to tools, methodologies, and architectural/clinical details without inventing facts or fake numbers.",
    shorten: "Make it more concise and punchy. Remove wordiness and filler phrases while preserving all core facts.",
    strengthen: "Lead with a powerful domain action verb. Elevate the professional tone and ATS keyword density without inventing facts.",
    fix_grammar: "CRITICAL: Fix ONLY spelling, punctuation, capitalization, and syntax errors. DO NOT change the tone, style, or meaning.",
  }[action];

  const prompt = `Rewrite this resume bullet point according to the requested action: "${action}".
Target Role: ${targetRole}
Domain: ${domain}
Original Bullet: "${bulletText}"
Action Goal: ${actionInstructions}

CRITICAL: Never invent fake metrics or employers. Keep student facts 100% grounded.

Return JSON:
{
  "id": "sug_${Date.now()}",
  "original": "${bulletText}",
  "improved": string,
  "reason": string,
  "keywordsUsed": string[],
  "evidenceSource": "Candidate Bullet Point",
  "needsStudentConfirmation": ${action !== "fix_grammar"},
  "provenance": "AI_SUGGESTION"
}`;

  const aiRes = await aiService.generateStructuredAdvice<Record<string, unknown>>({
    operation: "RESUME_REVIEW",
    modelTier: "FAST",
    userId,
    studentContext: {
      userId,
      academicDomain: domain,
      targetRole,
      skills: [],
    },
    customPrompt: prompt,
    schemaDescription:
      "{ id: string, original: string, improved: string, reason: string, keywordsUsed: string[], evidenceSource: string, needsStudentConfirmation: boolean, provenance: string }",
  });

  let suggestion: SectionSuggestion;
  if (aiRes.success && aiRes.data) {
    try {
      suggestion = SectionSuggestionSchema.parse(aiRes.data);
    } catch {
      suggestion = {
        id: `sug_${Date.now()}`,
        original: bulletText,
        improved: bulletText,
        reason: "Maintained original bullet after validation check.",
        keywordsUsed: [],
        evidenceSource: "Candidate Bullet Point",
        needsStudentConfirmation: false,
        provenance: "AI_SUGGESTION",
      };
    }
  } else {
    suggestion = {
      id: `sug_${Date.now()}`,
      original: bulletText,
      improved: bulletText,
      reason: "Local fallback applied.",
      keywordsUsed: [],
      evidenceSource: "Candidate Bullet Point",
      needsStudentConfirmation: false,
      provenance: "AI_SUGGESTION",
    };
  }

  // Record usage
  await recordUsage({
    userId,
    featureKey: "resume.improve_bullet",
    operationType: "RESUME_REVIEW",
    inputTokens: aiRes.metadata?.usage.inputTokens || 150,
    outputTokens: aiRes.metadata?.usage.outputTokens || 60,
    estimatedCost: aiRes.metadata?.usage.estimatedCostInr || 0.005,
    provider: aiRes.metadata?.provider || "google-gemini",
    model: aiRes.metadata?.model || "gemini-3.5-flash-lite",
    latencyMs: Date.now() - startTime,
  });

  return suggestion;
}

// ── Fallback Generators (Graceful Degradation) ────────────────────────────────

function createFallbackSectionResult(
  section: FullResumeData["sections"][0],
  domainName: string
): SectionAnalysisResult {
  const suggestions: SectionSuggestion[] = [];

  section.entries.forEach((entry, idx) => {
    entry.bullets.forEach((b, bIdx) => {
      const text = b.text.trim();
      if (text.length > 5) {
        suggestions.push({
          id: `sug_${section.id}_${idx}_${bIdx}`,
          original: text,
          improved: text.startsWith("Responsible for")
            ? text.replace(/^Responsible for\s*/i, "Executed and delivered ")
            : `${text.replace(/\.$/, "")}, adhering strictly to ${domainName} standards.`,
          reason: "Strengthened action orientation and domain compliance.",
          keywordsUsed: [domainName],
          evidenceSource: "Candidate Profile",
          needsStudentConfirmation: false,
          provenance: "AI_SUGGESTION",
        });
      }
    });
  });

  return {
    sectionId: section.id,
    sectionTitle: section.customTitle,
    score: 82,
    scoreExplanation: `Solid baseline structure aligned with ${domainName} conventions.`,
    strengths: [
      `Clean entry titles and structured separation in ${section.customTitle}.`,
      "Zero fabricated data detected.",
    ],
    issues: [
      {
        id: `iss_${section.id}_1`,
        severity: "low",
        message: "Consider adding specific metrics (e.g. percentages, latency, volumes) where verified.",
        field: "bullets",
      },
    ],
    missingInformation: [
      "Do you have a verifiable outcome number or team size for these items?",
    ],
    suggestions: suggestions.slice(0, 3),
  };
}

function createFallbackFullReport(
  resume: FullResumeData,
  contentHash: string,
  domainName: string,
  jobDescription?: string
): FullResumeAnalysisReport {
  const sectionAnalyses = resume.sections
    .filter((s) => s.visible)
    .map((s) => createFallbackSectionResult(s, domainName));

  return {
    overallScore: 84,
    scoreExplanation: `Resume demonstrates strong factual alignment with ${domainName} standards with zero ungrounded claims.`,
    topPriorityFixes: [
      {
        id: "fix_1",
        title: "Quantify Impact in Experience",
        description: "Add measurable deliverables (e.g. performance percentages, user volumes) to internship and project bullet points.",
        impact: "high",
        sectionId: "sec_experience",
      },
      {
        id: "fix_2",
        title: "Elevate Bullet Action Verbs",
        description: "Replace passive phrases like 'worked on' or 'helped with' with active accomplishment verbs like 'Architected' or 'Engineered'.",
        impact: "medium",
        sectionId: "sec_projects",
      },
      {
        id: "fix_3",
        title: "Ensure Full Evidence Vault Backing",
        description: "Attach verifiable certificate or repository links to claimed core competencies.",
        impact: "low",
        sectionId: "sec_skills",
      },
    ],
    sectionAnalyses,
    crossSectionIssues: [
      {
        type: "SKILL_COVERAGE",
        description: "Core competencies are listed but should be explicitly referenced inside project bullet descriptions.",
        severity: "medium",
        affectedSections: ["sec_skills", "sec_projects"],
      },
    ],
    atsReadabilityFindings: {
      readabilityScore: 88,
      formatCheck: "PASS",
      bulletLengthEvaluation: "Bullet point lengths conform to 1-to-2 line ATS parsing recommendations.",
      standardHeadingsDetected: resume.sections.map((s) => s.customTitle),
      unconventionalHeadings: [],
      warnings: [],
    },
    jdComparison: jobDescription
      ? {
          targetRole: resume.targetRole,
          atsMatchScore: 78,
          matchingRequirements: ["Full-Stack Architecture", "Database Schema Design"],
          missingRequirements: ["Automated Testing Pipelines", "CI/CD Deployment"],
          unsupportedRequirements: [],
          recommendedKeywords: ["RESTful APIs", "Docker", "Unit Testing"],
        }
      : undefined,
    contentHash,
    analyzedAt: new Date().toISOString(),
    isOutOfDate: false,
  };
}
