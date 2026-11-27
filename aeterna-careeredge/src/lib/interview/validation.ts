// src/lib/interview/validation.ts
// Server-side validation & sanitization for Interview Prep 2.0 intake

import {
  ACADEMIC_DOMAINS,
  EXPERIENCE_LEVELS,
  LEARNING_FORMATS,
  LEGACY_DOMAIN_MAP,
  OPPORTUNITY_TYPES,
  PREFERRED_LANGUAGES,
  PREPARATION_DURATIONS,
  TARGET_LEVELS,
  WEEKLY_AVAILABILITIES,
  normalizeDomainToAcademic,
  type ExperienceLevel,
  type InterviewFocusAreas,
  type InterviewPrepIntakePayload,
  type LearningFormat,
  type OpportunityType,
  type PassportContextPreview,
  type PreferredLanguage,
  type PreparationDuration,
  type TargetLevel,
  type WeeklyAvailability,
} from "./types";

const OPPORTUNITY_SET = new Set<string>(OPPORTUNITY_TYPES.map((o) => o.value));
const EXPERIENCE_SET = new Set<string>(EXPERIENCE_LEVELS.map((e) => e.value));
const TARGET_LEVEL_SET = new Set<string>(TARGET_LEVELS.map((t) => t.value));
const DURATION_SET = new Set<string>(PREPARATION_DURATIONS.map((d) => d.value));
const WEEKLY_SET = new Set<string>(WEEKLY_AVAILABILITIES.map((w) => w.value));
const FORMAT_SET = new Set<string>(LEARNING_FORMATS.map((f) => f.value));
const LANGUAGE_SET = new Set<string>(PREFERRED_LANGUAGES.map((l) => l.value));

/** Strip control characters & excessive whitespace from user-supplied text. */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Preserve line breaks in multi-line descriptions while stripping dangerous control chars. */
export function sanitizeMultilineText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeStringArray(
  value: unknown,
  maxItems = 25,
  maxItemLength = 100
): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const clean = sanitizeText(item, maxItemLength);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
    if (out.length >= maxItems) break;
  }
  return out;
}

export function sanitizeFocusAreas(value: unknown): InterviewFocusAreas {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      strengthenSkills: [],
      difficultTopics: [],
      targetRoleSkills: [],
      priorityAreas: [],
    };
  }
  const obj = value as Record<string, unknown>;
  return {
    strengthenSkills: sanitizeStringArray(obj.strengthenSkills, 20, 80),
    difficultTopics: sanitizeStringArray(obj.difficultTopics, 20, 80),
    targetRoleSkills: sanitizeStringArray(obj.targetRoleSkills, 20, 80),
    priorityAreas: sanitizeStringArray(obj.priorityAreas, 20, 80),
  };
}

export function sanitizePassportContext(value: unknown): PassportContextPreview | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;

  const educations = Array.isArray(obj.educations)
    ? obj.educations
        .filter((e) => e && typeof e === "object")
        .slice(0, 10)
        .map((e) => {
          const edu = e as Record<string, unknown>;
          return {
            level: edu.level ? sanitizeText(edu.level, 80) : null,
            degree: edu.degree ? sanitizeText(edu.degree, 120) : null,
            institution: edu.institution ? sanitizeText(edu.institution, 140) : null,
            fieldOfStudy: edu.fieldOfStudy ? sanitizeText(edu.fieldOfStudy, 100) : null,
            origin: edu.origin ? sanitizeText(edu.origin, 40) : undefined,
            isVerified: typeof edu.isVerified === "boolean" ? edu.isVerified : undefined,
          };
        })
    : undefined;

  const projects = Array.isArray(obj.projects)
    ? obj.projects
        .filter((p) => p && typeof p === "object" && typeof (p as Record<string, unknown>).title === "string")
        .slice(0, 15)
        .map((p) => {
          const proj = p as Record<string, unknown>;
          return {
            title: sanitizeText(proj.title, 120),
            role: proj.role ? sanitizeText(proj.role, 80) : null,
            technologies: sanitizeStringArray(proj.technologies, 12, 50),
            origin: proj.origin ? sanitizeText(proj.origin, 40) : undefined,
            isVerified: typeof proj.isVerified === "boolean" ? proj.isVerified : undefined,
          };
        })
        .filter((p) => p.title.length > 0)
    : [];

  const experiences = Array.isArray(obj.experiences)
    ? obj.experiences
        .filter(
          (e) =>
            e &&
            typeof e === "object" &&
            (typeof (e as Record<string, unknown>).companyName === "string" ||
              typeof (e as Record<string, unknown>).jobTitle === "string")
        )
        .slice(0, 15)
        .map((e) => {
          const exp = e as Record<string, unknown>;
          return {
            companyName: sanitizeText(exp.companyName, 120),
            jobTitle: sanitizeText(exp.jobTitle, 120),
            experienceType: exp.experienceType ? sanitizeText(exp.experienceType, 60) : null,
            origin: exp.origin ? sanitizeText(exp.origin, 40) : undefined,
            isVerified: typeof exp.isVerified === "boolean" ? exp.isVerified : undefined,
          };
        })
        .filter((e) => e.companyName.length > 0 || e.jobTitle.length > 0)
    : [];

  return {
    academicDomain: obj.academicDomain ? sanitizeText(obj.academicDomain, 100) : null,
    specialization: obj.specialization ? sanitizeText(obj.specialization, 100) : null,
    educationLevel: obj.educationLevel ? sanitizeText(obj.educationLevel, 80) : null,
    institution: obj.institution ? sanitizeText(obj.institution, 140) : null,
    course: obj.course ? sanitizeText(obj.course, 120) : null,
    graduationYear:
      typeof obj.graduationYear === "number" &&
      Number.isInteger(obj.graduationYear) &&
      obj.graduationYear >= 1970 &&
      obj.graduationYear <= 2040
        ? obj.graduationYear
        : null,
    preferredJobRole: obj.preferredJobRole ? sanitizeText(obj.preferredJobRole, 120) : null,
    skills: sanitizeStringArray(obj.skills, 30, 80),
    ...(educations ? { educations } : {}),
    projects,
    experiences,
    achievements: sanitizeStringArray(obj.achievements, 15, 200),
    certifications: obj.certifications ? sanitizeMultilineText(obj.certifications, 1500) : null,
  };
}

export function isValidDomainInput(domain: string): boolean {
  const trimmed = domain.trim();
  if ((ACADEMIC_DOMAINS as readonly string[]).includes(trimmed)) return true;
  if (trimmed.toUpperCase() in LEGACY_DOMAIN_MAP) return true;
  return ACADEMIC_DOMAINS.some((d) => d.toLowerCase() === trimmed.toLowerCase());
}

export interface ValidationResult {
  ok: true;
  data: InterviewPrepIntakePayload;
}

export interface ValidationError {
  ok: false;
  error: string;
  field?: string;
}

export function validateInterviewPrepIntake(
  raw: unknown
): ValidationResult | ValidationError {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid request payload." };
  }
  const body = raw as Record<string, unknown>;

  const jobTitle = sanitizeText(body.jobTitle, 160);
  if (!jobTitle || jobTitle.length < 2) {
    return {
      ok: false,
      error: "Job / Role Title is required (at least 2 characters).",
      field: "jobTitle",
    };
  }

  const rawDomain = sanitizeText(body.domain, 120);
  if (!rawDomain) {
    return {
      ok: false,
      error: "Professional Domain is required.",
      field: "domain",
    };
  }
  if (!isValidDomainInput(rawDomain)) {
    return {
      ok: false,
      error: "Please select a valid Professional Domain from the platform taxonomy.",
      field: "domain",
    };
  }
  const domain = normalizeDomainToAcademic(rawDomain);

  const companyName = sanitizeText(body.companyName, 140) || null;
  const targetIndustry = sanitizeText(body.targetIndustry, 120) || null;
  const location = sanitizeText(body.location, 120) || null;

  let opportunityType: OpportunityType | null = null;
  if (body.opportunityType !== undefined && body.opportunityType !== null && body.opportunityType !== "") {
    const val = String(body.opportunityType).trim().toUpperCase();
    if (!OPPORTUNITY_SET.has(val)) {
      return { ok: false, error: "Invalid opportunity type.", field: "opportunityType" };
    }
    opportunityType = val as OpportunityType;
  }

  let experienceLevel: ExperienceLevel | null = null;
  if (body.experienceLevel !== undefined && body.experienceLevel !== null && body.experienceLevel !== "") {
    const val = String(body.experienceLevel).trim().toUpperCase();
    if (!EXPERIENCE_SET.has(val)) {
      return { ok: false, error: "Invalid experience level.", field: "experienceLevel" };
    }
    experienceLevel = val as ExperienceLevel;
  }

  let targetLevel: TargetLevel | null = null;
  if (body.targetLevel !== undefined && body.targetLevel !== null && body.targetLevel !== "") {
    const val = String(body.targetLevel).trim().toUpperCase();
    if (!TARGET_LEVEL_SET.has(val)) {
      return { ok: false, error: "Invalid target role level.", field: "targetLevel" };
    }
    targetLevel = val as TargetLevel;
  }

  const interviewTypes = sanitizeStringArray(body.interviewTypes, 25, 100);

  let expectedInterviewDate: string | null = null;
  if (
    body.expectedInterviewDate !== undefined &&
    body.expectedInterviewDate !== null &&
    String(body.expectedInterviewDate).trim() !== ""
  ) {
    const parsed = new Date(String(body.expectedInterviewDate));
    if (isNaN(parsed.getTime())) {
      return {
        ok: false,
        error: "Expected interview date must be a valid date.",
        field: "expectedInterviewDate",
      };
    }
    expectedInterviewDate = parsed.toISOString();
  }

  let preparationDuration: PreparationDuration | null = null;
  if (body.preparationDuration !== undefined && body.preparationDuration !== null && body.preparationDuration !== "") {
    const val = String(body.preparationDuration).trim().toUpperCase();
    if (!DURATION_SET.has(val)) {
      return { ok: false, error: "Invalid preparation duration.", field: "preparationDuration" };
    }
    preparationDuration = val as PreparationDuration;
  }

  let weeklyAvailability: WeeklyAvailability | null = null;
  if (body.weeklyAvailability !== undefined && body.weeklyAvailability !== null && body.weeklyAvailability !== "") {
    const val = String(body.weeklyAvailability).trim().toUpperCase();
    if (!WEEKLY_SET.has(val)) {
      return { ok: false, error: "Invalid weekly availability.", field: "weeklyAvailability" };
    }
    weeklyAvailability = val as WeeklyAvailability;
  }

  let learningFormats: LearningFormat[] = [];
  if (Array.isArray(body.learningFormats)) {
    const invalid = body.learningFormats.find(
      (f) => typeof f !== "string" || !FORMAT_SET.has(f.trim().toUpperCase())
    );
    if (invalid !== undefined) {
      return { ok: false, error: "Invalid learning format selection.", field: "learningFormats" };
    }
    learningFormats = Array.from(
      new Set(body.learningFormats.map((f) => String(f).trim().toUpperCase() as LearningFormat))
    );
  }

  let preferredLanguage: PreferredLanguage = "English";
  if (body.preferredLanguage !== undefined && body.preferredLanguage !== null && String(body.preferredLanguage).trim() !== "") {
    const val = String(body.preferredLanguage).trim();
    if (!LANGUAGE_SET.has(val)) {
      return { ok: false, error: "Unsupported preferred language.", field: "preferredLanguage" };
    }
    preferredLanguage = val as PreferredLanguage;
  }

  // Strict explicit consent check: only true when explicitly boolean true
  const useCareerPassport = body.useCareerPassport === true;
  const passportContext = useCareerPassport
    ? sanitizePassportContext(body.passportContext)
    : null;

  const focusAreas = sanitizeFocusAreas(body.focusAreas);
  const jobDescriptionText = sanitizeMultilineText(body.jobDescriptionText, 12000) || null;

  return {
    ok: true,
    data: {
      kitId: body.kitId ? sanitizeText(body.kitId, 80) : undefined,
      jobId: body.jobId ? sanitizeText(body.jobId, 160) : undefined,
      createNew: body.createNew === true,
      jobTitle,
      companyName,
      domain,
      targetIndustry,
      location,
      opportunityType,
      experienceLevel,
      targetLevel,
      interviewTypes,
      expectedInterviewDate,
      preparationDuration,
      weeklyAvailability,
      learningFormats,
      preferredLanguage,
      useCareerPassport,
      passportContext,
      focusAreas,
      jobDescriptionText,
    },
  };
}
