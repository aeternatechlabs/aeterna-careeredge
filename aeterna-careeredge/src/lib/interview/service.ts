// src/lib/interview/service.ts
// Multi-Domain Interview Prep Kit Service with Proof Bank Linkage & Expanded Intake Persistence

import { db } from "@/lib/db";
import { trackProgressEvent } from "@/lib/guidance/progress";
import { getInterviewPassportPreview } from "./passport-preview";
import {
  resolveTemplateKeyForDomain,
  normalizeDomainToAcademic,
  type InterviewFocusAreas,
  type InterviewKitSummary,
  type InterviewPrepIntakePayload,
  type InterviewPrepTheme,
  type PassportContextPreview,
  type PreparedInterviewKit,
} from "./types";
import { sanitizeFocusAreas, sanitizePassportContext } from "./validation";

export type {
  InterviewQuestion,
  InterviewPrepTheme,
  PreparedInterviewKit,
  InterviewKitSummary,
} from "./types";

const DOMAIN_QUESTION_TEMPLATES: Record<string, InterviewPrepTheme[]> = {
  HEALTHCARE: [
    {
      themeName: "Clinical Judgment & Patient Safety",
      description: "Critical care scenarios, infection control protocols, and hemodynamic vitals monitoring.",
      questions: [
        {
          id: "q-health-1",
          category: "SCENARIO",
          question: "Describe a situation where a patient under your care experienced sudden hemodynamic instability. How did you respond?",
          context: "Assesses ABC triage protocol, doctor notification, and bedside calm under NABH protocols.",
          responseFramework: "Situation: Ward setting and baseline vitals -> Task: Immediate stabilization -> Action: Airway check, oxygenation, emergency call -> Result: Patient stabilized.",
          proofBankCitationAdvice: "Reference your Clinical Rotation Logbook or BLS/ACLS certificate in your Evidence Vault.",
          keyTalkingPoints: [
            "Followed NABH protocol on code blue escalation",
            "Maintained accurate real-time hemodynamic charting",
            "Collaborated with attending resident doctor",
          ],
        },
        {
          id: "q-health-2",
          category: "TECHNICAL",
          question: "What are the standard steps you follow for preventing central line-associated bloodstream infections (CLABSI)?",
          context: "Tests strict adherence to sterile techniques and hospital infection control guidelines.",
          responseFramework: "Detail five critical sterile barrier procedures followed before catheter insertion and daily chlorhexidine dressing protocols.",
          proofBankCitationAdvice: "Link to your Infection Control training certificate or hospital internship completion letter.",
          keyTalkingPoints: [
            "Hand hygiene and chlorhexidine prep",
            "Maximal sterile barrier precautions",
            "Daily site assessment and prompt line removal",
          ],
        },
      ],
    },
  ],
  TEACHING: [
    {
      themeName: "Pedagogy, Lesson Planning & Classroom Dynamic",
      description: "Differentiated instruction, formative assessment, and student engagement strategies.",
      questions: [
        {
          id: "q-teach-1",
          category: "SCENARIO",
          question: "How do you handle a diverse classroom where students have significantly varied learning paces?",
          context: "Evaluates differentiated instruction, scaffolding, and inclusive education methods under NEP 2020.",
          responseFramework: "Situation: 40-student mixed-ability classroom -> Task: Ensure foundational concept clarity for all -> Action: Multi-tiered worksheets and peer learning -> Result: Improved formative test scores.",
          proofBankCitationAdvice: "Reference your Teaching Practicum Portfolio or Sample Lesson Plan artifact in the Evidence Vault.",
          keyTalkingPoints: [
            "Implemented tiered learning stations",
            "Used formative exit tickets to assess comprehension",
            "Provided scaffolding without lowering expectations",
          ],
        },
      ],
    },
  ],
  COMMERCE: [
    {
      themeName: "Statutory Tax & Financial Modeling",
      description: "GST reconciliation, TDS compliance, and audit defense fundamentals.",
      questions: [
        {
          id: "q-comm-1",
          category: "TECHNICAL",
          question: "Walk us through the monthly reconciliation process between GSTR-2B and purchase register books.",
          context: "Tests practical mastery of input tax credit (ITC) matching and dealing with vendor defaults.",
          responseFramework: "Explain data extraction from Tally/Zoho, Excel VLOOKUP/PowerQuery reconciliation, identifying ineligible credits under Sec 16(2)(aa), and vendor follow-up.",
          proofBankCitationAdvice: "Reference your Advanced Excel Financial Model or GST Certification in the Evidence Vault.",
          keyTalkingPoints: [
            "Matched invoice dates, tax rates, and GSTINs",
            "Flagged vendor mismatches for supplier credit notes",
            "Protected firm from 18% statutory penalty interest",
          ],
        },
      ],
    },
  ],
  TECH: [
    {
      themeName: "Software Architecture & System Design",
      description: "Distributed systems, API contracts, automated testing, and technical trade-offs.",
      questions: [
        {
          id: "q-tech-1",
          category: "TECHNICAL",
          question: "Walk us through a full-stack feature you built end-to-end. What architectural trade-offs did you make?",
          context: "Evaluates modularity, database indexing, API error handling, and state management.",
          responseFramework: "Situation: Project requirements -> Task: Architecture design -> Action: Database schema, server actions/REST APIs, UI caching -> Result: Measured latency and maintainability.",
          proofBankCitationAdvice: "Direct the interviewer to your verified GitHub repository artifact in your Proof Bank.",
          keyTalkingPoints: [
            "Strict TypeScript contracts across client and server",
            "Database query optimization using Prisma indexes",
            "Automated test coverage for mission-critical endpoints",
          ],
        },
        {
          id: "q-tech-2",
          category: "BEHAVIORAL",
          question: "Tell me about a time you encountered a severe production bug or broken build. How did you resolve it?",
          context: "Assesses root cause analysis, composure under pressure, and post-mortem practices.",
          responseFramework: "Situation: Deployment failure or edge case -> Task: Rapid isolation -> Action: Bisecting git commits, isolating bug, writing regression test -> Result: Safe deployment.",
          proofBankCitationAdvice: "Cite your engineering project documentation and CI/CD workflow logs in your Vault.",
          keyTalkingPoints: [
            "Used systematic logging rather than guesswork",
            "Added regression test before deploying the fix",
            "Documented learnings to prevent recurrence",
          ],
        },
      ],
    },
  ],
  LAW: [
    {
      themeName: "Contractual Risk Analysis & Moot Court Advocacy",
      description: "Indemnity clauses, limitation of liability, and statutory interpretation.",
      questions: [
        {
          id: "q-law-1",
          category: "TECHNICAL",
          question: "How do you evaluate limitation of liability and indemnity carve-outs in a commercial vendor agreement?",
          context: "Tests nuanced comprehension of Indian Contract Act 1872 and commercial risk mitigation.",
          responseFramework: "Detail standard exclusions (gross negligence, willful misconduct, confidentiality breach) and market standard caps (12 months fees).",
          proofBankCitationAdvice: "Reference your Moot Court Memorial or Legal Research Brief in the Evidence Vault.",
          keyTalkingPoints: [
            "Distinguished between direct and consequential damages",
            "Structured mutual indemnification clauses",
            "Aligned with Indian Contract Act Section 73 & 74 standards",
          ],
        },
      ],
    },
  ],
  DESIGN: [
    {
      themeName: "Design Process & Usability Testing",
      description: "Problem discovery, wireframing, component tokens, and user testing feedback loops.",
      questions: [
        {
          id: "q-des-1",
          category: "SCENARIO",
          question: "Present a case study from your portfolio where user feedback contradicted your initial design hypothesis.",
          context: "Assesses intellectual humility, user empathy, and iterative design cycles.",
          responseFramework: "Situation: Initial design concept -> Task: Usability testing session -> Action: Identifying friction in task completion -> Result: Redesigned information architecture.",
          proofBankCitationAdvice: "Reference your verified Figma Prototype / Case Study artifact in the Evidence Vault.",
          keyTalkingPoints: [
            "Conducted unmoderated user usability tests",
            "Iterated wireframes based on measured task completion time",
            "Documented design system component tokens",
          ],
        },
      ],
    },
  ],
};

function toIsoString(val: Date | string | null | undefined): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function toNullableIsoString(val: Date | string | null | undefined): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString();
  return null;
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;
  try {
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export interface RawInterviewKitRow {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName?: string | null;
  domain?: string | null;
  targetIndustry?: string | null;
  location?: string | null;
  opportunityType?: string | null;
  experienceLevel?: string | null;
  targetLevel?: string | null;
  interviewTypesJson?: string | null;
  expectedInterviewDate?: Date | string | null;
  preparationDuration?: string | null;
  weeklyAvailability?: string | null;
  learningFormatsJson?: string | null;
  preferredLanguage?: string | null;
  useCareerPassport?: boolean | null;
  passportContextJson?: string | null;
  focusAreasJson?: string | null;
  jobDescriptionText?: string | null;
  themesJson: string;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
}

export function serializeInterviewKit(kit: RawInterviewKitRow): PreparedInterviewKit {
  const themes = safeJsonParse<InterviewPrepTheme[]>(kit.themesJson, []);
  const interviewTypes = safeJsonParse<string[]>(kit.interviewTypesJson, []);
  const learningFormats = safeJsonParse<string[]>(kit.learningFormatsJson, []);
  const rawPassport = safeJsonParse<PassportContextPreview | null>(kit.passportContextJson, null);
  const rawFocus = safeJsonParse<InterviewFocusAreas | null>(kit.focusAreasJson, null);

  return {
    id: String(kit.id),
    jobId: String(kit.jobId),
    jobTitle: String(kit.jobTitle),
    companyName: kit.companyName ?? null,
    domain: kit.domain ?? null,
    targetIndustry: kit.targetIndustry ?? null,
    location: kit.location ?? null,
    opportunityType: kit.opportunityType ?? null,
    experienceLevel: kit.experienceLevel ?? null,
    targetLevel: kit.targetLevel ?? null,
    interviewTypes: Array.isArray(interviewTypes) ? interviewTypes : [],
    expectedInterviewDate: toNullableIsoString(kit.expectedInterviewDate),
    preparationDuration: kit.preparationDuration ?? null,
    weeklyAvailability: kit.weeklyAvailability ?? null,
    learningFormats: Array.isArray(learningFormats) ? learningFormats : [],
    preferredLanguage: kit.preferredLanguage || "English",
    useCareerPassport: Boolean(kit.useCareerPassport),
    passportContext: kit.useCareerPassport && rawPassport ? sanitizePassportContext(rawPassport) : null,
    focusAreas: sanitizeFocusAreas(rawFocus),
    jobDescriptionText: kit.jobDescriptionText ?? null,
    themes: Array.isArray(themes) ? themes : [],
    createdAt: toIsoString(kit.createdAt),
    updatedAt: toIsoString(kit.updatedAt || kit.createdAt),
  };
}

/** Build a sanitized Passport preview for the authenticated student (supports partial Passport without student_profiles). */
export async function getSanitizedPassportPreview(
  userId: string
): Promise<PassportContextPreview | null> {
  const result = await getInterviewPassportPreview(userId);
  return result.data;
}

export async function getOrCreateInterviewKit(
  userId: string,
  params: InterviewPrepIntakePayload | {
    jobId?: string;
    jobTitle: string;
    companyName?: string | null;
    domain?: string | null;
  }
): Promise<PreparedInterviewKit> {
  const intake = params as InterviewPrepIntakePayload;
  const slug = intake.jobTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "role";
  const targetJobId =
    intake.jobId ||
    (intake.createNew ? `role-${slug}-${Date.now().toString(36)}` : `role-${slug}`);

  // If updating an explicit kitId or matching existing jobId without createNew
  const existing = intake.kitId
    ? await db.interviewPrepKit.findFirst({ where: { id: intake.kitId, userId } })
    : !intake.createNew
    ? await db.interviewPrepKit.findFirst({ where: { userId, jobId: targetJobId } })
    : null;

  // Only load/persist Career Passport snapshot when explicit student consent is granted
  let resolvedPassportJson: string | null = null;
  if (intake.useCareerPassport === true) {
    const contextToSave =
      intake.passportContext ?? (await getSanitizedPassportPreview(userId));
    if (contextToSave) {
      resolvedPassportJson = JSON.stringify(contextToSave);
    }
  }

  const normalizedDomain = intake.domain
    ? normalizeDomainToAcademic(intake.domain)
    : normalizeDomainToAcademic(inferDomainFromTitle(intake.jobTitle));

  const expandedFields = {
    jobTitle: intake.jobTitle,
    companyName: intake.companyName || null,
    domain: normalizedDomain,
    targetIndustry: intake.targetIndustry || null,
    location: intake.location || null,
    opportunityType: intake.opportunityType || null,
    experienceLevel: intake.experienceLevel || null,
    targetLevel: intake.targetLevel || null,
    interviewTypesJson:
      intake.interviewTypes && intake.interviewTypes.length > 0
        ? JSON.stringify(intake.interviewTypes)
        : null,
    expectedInterviewDate: intake.expectedInterviewDate
      ? new Date(intake.expectedInterviewDate)
      : null,
    preparationDuration: intake.preparationDuration || null,
    weeklyAvailability: intake.weeklyAvailability || null,
    learningFormatsJson:
      intake.learningFormats && intake.learningFormats.length > 0
        ? JSON.stringify(intake.learningFormats)
        : null,
    preferredLanguage: intake.preferredLanguage || "English",
    useCareerPassport: Boolean(intake.useCareerPassport),
    passportContextJson: resolvedPassportJson,
    focusAreasJson: intake.focusAreas ? JSON.stringify(intake.focusAreas) : null,
    jobDescriptionText: intake.jobDescriptionText || null,
  };

  if (existing) {
    const hasExpandedUpdates =
      intake.kitId !== undefined ||
      intake.domain !== undefined ||
      intake.experienceLevel !== undefined ||
      intake.targetLevel !== undefined ||
      intake.useCareerPassport !== undefined ||
      intake.jobDescriptionText !== undefined ||
      (intake.interviewTypes && intake.interviewTypes.length > 0);

    if (hasExpandedUpdates) {
      const updated = await db.interviewPrepKit.update({
        where: { id: existing.id },
        data: expandedFields,
      });
      return serializeInterviewKit(updated);
    }

    return serializeInterviewKit(existing);
  }

  // Determine template bank from normalized or inferred domain
  const templateKey = resolveTemplateKeyForDomain(
    intake.domain || inferDomainFromTitle(intake.jobTitle)
  );
  const themes = DOMAIN_QUESTION_TEMPLATES[templateKey] || DOMAIN_QUESTION_TEMPLATES.TECH;

  const created = await db.interviewPrepKit.create({
    data: {
      userId,
      jobId: targetJobId,
      ...expandedFields,
      themesJson: JSON.stringify(themes),
    },
  });

  // Track progress event
  await trackProgressEvent({
    userId,
    eventType: "READINESS_REPORT_GENERATED",
    title: `Generated Interview Prep Kit for ${intake.jobTitle}`,
    description: `Personalized ${themes.reduce((acc, t) => acc + t.questions.length, 0)} questions with Proof Bank talking points`,
    refId: created.id,
    metadata: {
      jobTitle: intake.jobTitle,
      domain: normalizedDomain,
      useCareerPassport: Boolean(intake.useCareerPassport),
    },
  });

  return serializeInterviewKit(created);
}

export async function listUserInterviewKits(userId: string): Promise<InterviewKitSummary[]> {
  const kits = await db.interviewPrepKit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return kits.map((k) => {
    const themes = safeJsonParse<InterviewPrepTheme[]>(k.themesJson, []);
    return {
      id: k.id,
      jobId: k.jobId,
      jobTitle: k.jobTitle,
      companyName: k.companyName ?? null,
      domain: k.domain ?? null,
      targetLevel: k.targetLevel ?? null,
      experienceLevel: k.experienceLevel ?? null,
      preparationDuration: k.preparationDuration ?? null,
      useCareerPassport: Boolean(k.useCareerPassport),
      themesCount: Array.isArray(themes) ? themes.length : 0,
      questionsCount: Array.isArray(themes)
        ? themes.reduce((acc, t) => acc + (Array.isArray(t.questions) ? t.questions.length : 0), 0)
        : 0,
      createdAt: toIsoString(k.createdAt),
    };
  });
}

function inferDomainFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("nurse") || t.includes("health") || t.includes("clinic")) return "HEALTHCARE";
  if (t.includes("teach") || t.includes("school") || t.includes("educat") || t.includes("lecturer")) return "TEACHING";
  if (t.includes("tax") || t.includes("account") || t.includes("finance") || t.includes("gst")) return "COMMERCE";
  if (t.includes("law") || t.includes("legal") || t.includes("contract")) return "LAW";
  if (t.includes("design") || t.includes("ui/ux") || t.includes("figma")) return "DESIGN";
  return "TECH";
}
