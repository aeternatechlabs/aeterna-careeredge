// src/lib/interview/types.ts
// Shared types, constants, and domain-adaptive options for Interview Prep 2.0 (Phase 1)

import {
  ACADEMIC_DOMAINS,
  DOMAIN_DETAILS,
  type AcademicDomain,
} from "@/lib/constants/domains";

export { ACADEMIC_DOMAINS, DOMAIN_DETAILS, type AcademicDomain };

export interface InterviewQuestion {
  id: string;
  category: "TECHNICAL" | "SCENARIO" | "BEHAVIORAL";
  question: string;
  context: string;
  responseFramework: string;
  proofBankCitationAdvice: string;
  keyTalkingPoints: string[];
}

export interface InterviewPrepTheme {
  themeName: string;
  description: string;
  questions: InterviewQuestion[];
}

export const OPPORTUNITY_TYPES = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FULL_TIME", label: "Full-Time Role" },
  { value: "PART_TIME", label: "Part-Time Role" },
  { value: "GOVERNMENT_RECRUITMENT", label: "Government Recruitment / Exam" },
  { value: "APPRENTICESHIP", label: "Apprenticeship / Articleship" },
  { value: "FREELANCE", label: "Freelance / Consulting" },
  { value: "OTHER", label: "Other" },
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]["value"];

export const EXPERIENCE_LEVELS = [
  { value: "STUDENT", label: "Current Student" },
  { value: "FRESHER", label: "Fresher / No professional experience" },
  { value: "LT_1_YEAR", label: "Less than 1 year" },
  { value: "1_3_YEARS", label: "1–3 years" },
  { value: "3_5_YEARS", label: "3–5 years" },
  { value: "5_PLUS_YEARS", label: "5+ years" },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]["value"];

export const TARGET_LEVELS = [
  { value: "ENTRY_LEVEL", label: "Entry-Level / Trainee" },
  { value: "JUNIOR", label: "Junior / Associate" },
  { value: "MID_LEVEL", label: "Mid-Level / Executive" },
  { value: "SENIOR", label: "Senior" },
  { value: "SPECIALIST", label: "Specialist / Subject Matter Expert" },
  { value: "MANAGEMENT", label: "Management / Leadership" },
  { value: "GOVT_EXAM", label: "Government Examination / Recruitment" },
  { value: "OTHER", label: "Other" },
] as const;

export type TargetLevel = (typeof TARGET_LEVELS)[number]["value"];

export const PREPARATION_DURATIONS = [
  { value: "1_WEEK", label: "1 week" },
  { value: "2_WEEKS", label: "2 weeks" },
  { value: "1_MONTH", label: "1 month" },
  { value: "2_MONTHS", label: "2 months" },
  { value: "3_MONTHS", label: "3 months" },
  { value: "CUSTOM", label: "Custom / Flexible" },
] as const;

export type PreparationDuration = (typeof PREPARATION_DURATIONS)[number]["value"];

export const WEEKLY_AVAILABILITIES = [
  { value: "LT_3_HOURS", label: "Less than 3 hours / week" },
  { value: "3_5_HOURS", label: "3–5 hours / week" },
  { value: "5_10_HOURS", label: "5–10 hours / week" },
  { value: "10_15_HOURS", label: "10–15 hours / week" },
  { value: "15_PLUS_HOURS", label: "15+ hours / week" },
] as const;

export type WeeklyAvailability = (typeof WEEKLY_AVAILABILITIES)[number]["value"];

export const LEARNING_FORMATS = [
  { value: "DOCUMENTATION_ARTICLES", label: "Documentation & Articles" },
  { value: "VIDEO_TUTORIALS", label: "Video Tutorials" },
  { value: "STRUCTURED_COURSES", label: "Structured Courses" },
  { value: "PRACTICAL_EXERCISES", label: "Practical Exercises" },
  { value: "PROJECTS", label: "Projects" },
  { value: "PRACTICE_QUESTIONS", label: "Practice Questions" },
  { value: "MOCK_INTERVIEWS", label: "Mock Interviews" },
] as const;

export type LearningFormat = (typeof LEARNING_FORMATS)[number]["value"];

export const PREFERRED_LANGUAGES = [
  {
    value: "English",
    label: "English (Default)",
    note: "All current Interview Prep modules are available in English.",
  },
  {
    value: "Kannada",
    label: "Kannada (Preference)",
    note: "Saved as your language preference; verified Kannada resources will be prioritized when available.",
  },
  {
    value: "Hindi",
    label: "Hindi (Preference)",
    note: "Saved as your language preference; verified Hindi resources will be prioritized when available.",
  },
] as const;

export type PreferredLanguage = (typeof PREFERRED_LANGUAGES)[number]["value"];

export const UNIVERSAL_INTERVIEW_TYPES = [
  "HR Interview",
  "Behavioral Interview",
  "Technical / Subject Knowledge",
  "Practical / Hands-on Assessment",
  "Case Study / Scenario-Based Interview",
  "Portfolio / Project Discussion",
  "Group Discussion",
  "Written Assessment",
  "Presentation / Demonstration",
  "Domain-Specific Examination / Assessment",
] as const;

export interface InterviewFocusAreas {
  strengthenSkills: string[];
  difficultTopics: string[];
  targetRoleSkills: string[];
  priorityAreas: string[];
}

export type PassportPreviewStatus = "EMPTY" | "PARTIAL" | "COMPLETE" | "ERROR";

export interface PassportPreviewCounts {
  educations: number;
  skills: number;
  projects: number;
  experiences: number;
  achievements: number;
  certifications: number;
}

export interface PassportContextPreview {
  academicDomain?: string | null;
  specialization?: string | null;
  educationLevel?: string | null;
  institution?: string | null;
  course?: string | null;
  graduationYear?: number | null;
  preferredJobRole?: string | null;
  skills: string[];
  educations?: Array<{
    level?: string | null;
    degree?: string | null;
    institution?: string | null;
    fieldOfStudy?: string | null;
    origin?: string;
    isVerified?: boolean;
  }>;
  projects: Array<{
    title: string;
    role?: string | null;
    technologies?: string[];
    origin?: string;
    isVerified?: boolean;
  }>;
  experiences: Array<{
    companyName: string;
    jobTitle: string;
    experienceType?: string | null;
    origin?: string;
    isVerified?: boolean;
  }>;
  achievements: string[];
  certifications: string | null;
}

export interface InterviewPassportPreviewResult {
  status: PassportPreviewStatus;
  data: PassportContextPreview | null;
  counts: PassportPreviewCounts;
  availableSections: string[];
  missingSections: string[];
  errorMessage?: string;
}

export interface InterviewPrepIntakePayload {
  kitId?: string;
  jobId?: string;
  createNew?: boolean;
  // Step 1
  jobTitle: string;
  companyName?: string | null;
  domain: string;
  targetIndustry?: string | null;
  location?: string | null;
  opportunityType?: OpportunityType | null;
  // Step 2
  experienceLevel?: ExperienceLevel | null;
  targetLevel?: TargetLevel | null;
  // Step 3
  interviewTypes?: string[];
  // Step 4
  expectedInterviewDate?: string | null;
  preparationDuration?: PreparationDuration | null;
  weeklyAvailability?: WeeklyAvailability | null;
  learningFormats?: LearningFormat[];
  preferredLanguage?: PreferredLanguage | null;
  // Step 5
  useCareerPassport?: boolean;
  passportContext?: PassportContextPreview | null;
  focusAreas?: InterviewFocusAreas | null;
  jobDescriptionText?: string | null;
}

export interface PreparedInterviewKit {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string | null;
  domain: string | null;
  targetIndustry: string | null;
  location: string | null;
  opportunityType: string | null;
  experienceLevel: string | null;
  targetLevel: string | null;
  interviewTypes: string[];
  expectedInterviewDate: string | null;
  preparationDuration: string | null;
  weeklyAvailability: string | null;
  learningFormats: string[];
  preferredLanguage: string;
  useCareerPassport: boolean;
  passportContext: PassportContextPreview | null;
  focusAreas: InterviewFocusAreas;
  jobDescriptionText: string | null;
  themes: InterviewPrepTheme[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewKitSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string | null;
  domain: string | null;
  targetLevel: string | null;
  experienceLevel: string | null;
  preparationDuration: string | null;
  useCareerPassport: boolean;
  themesCount: number;
  questionsCount: number;
  createdAt: string;
}

/** Map legacy short domain keys (TECH, HEALTHCARE, etc.) to official ACADEMIC_DOMAINS. */
export const LEGACY_DOMAIN_MAP: Record<string, AcademicDomain> = {
  TECH: "Computer Science and IT",
  HEALTHCARE: "Pharmacy, Nursing and Allied Health",
  TEACHING: "Education and Teaching",
  COMMERCE: "Commerce, Accounting and Finance",
  LAW: "Law and Legal Studies",
  DESIGN: "Design, Architecture and Creative Industries",
};

/** Reverse map from official ACADEMIC_DOMAINS to legacy question-bank template keys. */
export function resolveTemplateKeyForDomain(domain?: string | null): string {
  if (!domain) return "TECH";
  const upper = domain.trim().toUpperCase();
  if (["TECH", "HEALTHCARE", "TEACHING", "COMMERCE", "LAW", "DESIGN"].includes(upper)) {
    return upper;
  }
  const d = domain.toLowerCase();
  if (d.includes("health") || d.includes("nursing") || d.includes("medical") || d.includes("pharmacy")) {
    return "HEALTHCARE";
  }
  if (d.includes("education") || d.includes("teach")) return "TEACHING";
  if (d.includes("commerce") || d.includes("account") || d.includes("finance") || d.includes("business")) {
    return "COMMERCE";
  }
  if (d.includes("law") || d.includes("legal")) return "LAW";
  if (d.includes("design") || d.includes("architect") || d.includes("creative") || d.includes("media")) {
    return "DESIGN";
  }
  return "TECH";
}

export function normalizeDomainToAcademic(domain?: string | null): string {
  if (!domain) return "Computer Science and IT";
  const trimmed = domain.trim();
  if ((ACADEMIC_DOMAINS as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  const mapped = LEGACY_DOMAIN_MAP[trimmed.toUpperCase()];
  if (mapped) return mapped;
  const match = ACADEMIC_DOMAINS.find(
    (d) => d.toLowerCase() === trimmed.toLowerCase()
  );
  return match || "Other / Emerging Fields";
}

/** Return domain-appropriate target level options. */
export function getTargetLevelsForDomain(domain: string) {
  const d = normalizeDomainToAcademic(domain).toLowerCase();
  if (d.includes("government")) {
    return TARGET_LEVELS.filter((l) =>
      ["GOVT_EXAM", "ENTRY_LEVEL", "JUNIOR", "MID_LEVEL", "SPECIALIST", "MANAGEMENT", "OTHER"].includes(l.value)
    );
  }
  if (d.includes("healthcare") || d.includes("nursing") || d.includes("pharmacy")) {
    return TARGET_LEVELS.map((l) => {
      if (l.value === "ENTRY_LEVEL") return { ...l, label: "Clinical Trainee / Intern" };
      if (l.value === "JUNIOR") return { ...l, label: "Staff / Junior Practitioner" };
      if (l.value === "SPECIALIST") return { ...l, label: "Clinical Specialist / Senior" };
      return l;
    });
  }
  if (d.includes("education") || d.includes("teach")) {
    return TARGET_LEVELS.map((l) => {
      if (l.value === "ENTRY_LEVEL") return { ...l, label: "Trainee / Assistant Teacher" };
      if (l.value === "JUNIOR") return { ...l, label: "Primary / Subject Teacher" };
      if (l.value === "MANAGEMENT") return { ...l, label: "Department Head / Principal" };
      return l;
    });
  }
  if (d.includes("law")) {
    return TARGET_LEVELS.map((l) => {
      if (l.value === "ENTRY_LEVEL") return { ...l, label: "Legal Intern / Trainee" };
      if (l.value === "JUNIOR") return { ...l, label: "Junior Associate / Advocate" };
      if (l.value === "SPECIALIST") return { ...l, label: "Senior Associate / Counsel" };
      return l;
    });
  }
  return TARGET_LEVELS;
}

/** Domain-specific interview focus chips adapted per AcademicDomain. */
const DOMAIN_FOCUS_TOPICS: Partial<Record<AcademicDomain, readonly string[]>> = {
  "Computer Science and IT": [
    "JavaScript & TypeScript",
    "React & Frontend",
    "Node.js & Backend",
    "Databases & SQL",
    "Data Structures & Algorithms",
    "System Design",
    "Practical Coding",
    "Project Discussion",
  ],
  "Engineering and Technology": [
    "Core Engineering Principles",
    "CAD / Simulation Tools",
    "Design & Manufacturing",
    "Quality & Safety Standards",
    "Troubleshooting & Failure Analysis",
    "Project Discussion",
  ],
  "Pharmacy, Nursing and Allied Health": [
    "Clinical Knowledge",
    "Patient-Care Scenarios",
    "Nursing / Clinical Procedures",
    "Patient Safety & Infection Control",
    "Medical Ethics",
    "Patient Communication",
    "Healthcare Regulations",
  ],
  "Healthcare and Medical Sciences": [
    "Clinical Reasoning & Diagnosis",
    "Patient Safety & Triage",
    "Medical Ethics",
    "Case Presentation",
    "Evidence-Based Practice",
    "Healthcare Regulations",
  ],
  "Education and Teaching": [
    "Pedagogy & Learning Theories",
    "Lesson Planning",
    "Classroom Management",
    "Subject Knowledge",
    "Teaching Demonstration",
    "Educational Psychology",
    "Inclusive Assessment",
  ],
  "Commerce, Accounting and Finance": [
    "Accounting Fundamentals",
    "GST & Statutory Taxation",
    "Financial Modeling & Excel",
    "Audit & Compliance",
    "Financial Statement Analysis",
    "Tally / Accounting Software",
  ],
  "Business and Management": [
    "Business Case Studies",
    "Market & Competitor Analysis",
    "Operations & Strategy",
    "Stakeholder Communication",
    "Analytics & KPIs",
    "Leadership Scenarios",
  ],
  "Law and Legal Studies": [
    "Constitutional & Statutory Law",
    "Contract Drafting & Review",
    "Case Law Analysis",
    "Moot Court & Advocacy",
    "Legal Research",
    "Professional Ethics",
  ],
  "Design, Architecture and Creative Industries": [
    "Design Principles & Systems",
    "User Research & Usability",
    "Wireframing & Prototyping",
    "Portfolio Walkthrough",
    "Accessibility & Critique",
    "Design Tools & Workflow",
  ],
  "Science and Research": [
    "Research Methodology",
    "Experimental Design",
    "Data & Statistical Analysis",
    "Literature Review",
    "Lab Safety & Instrumentation",
  ],
  "Agriculture and Environmental Sciences": [
    "Agronomy & Soil Science",
    "Crop Protection & Extension",
    "Sustainable Practices",
    "Field Survey & Data",
    "Government Agri Schemes",
  ],
  "Hospitality, Tourism and Hotel Management": [
    "Guest Relations & Service Recovery",
    "Front Office & Operations",
    "Food Safety & Hygiene",
    "Event & Revenue Management",
    "Crisis Handling Scenarios",
  ],
  "Media, Journalism and Communication": [
    "Editorial & Storytelling",
    "Fact-Checking & Media Ethics",
    "Portfolio / Published Work Review",
    "Content Strategy",
    "Public Speaking",
  ],
  "Government and Public Services": [
    "Public Policy & Governance",
    "Current Affairs & Polity",
    "Administrative Ethics",
    "Situational Judgment",
    "Written Essay & Comprehension",
  ],
  "Arts and Humanities": [
    "Critical Analysis & Writing",
    "Research & Documentation",
    "Communication & Presentation",
    "Interdisciplinary Case Discussion",
  ],
  "Vocational and Skill-Based Education": [
    "Practical Trade Demonstration",
    "Workplace Safety & Tools",
    "Quality & Troubleshooting",
    "Client Communication",
  ],
};

export function getInterviewFocusOptionsForDomain(domain: string): {
  interviewTypes: readonly string[];
  domainTopics: readonly string[];
  roleSuggestions: readonly string[];
} {
  const normalized = normalizeDomainToAcademic(domain) as AcademicDomain;
  const meta = DOMAIN_DETAILS[normalized];
  const domainTopics =
    DOMAIN_FOCUS_TOPICS[normalized] ||
    meta?.suggestedSkills || [
      "Core Domain Knowledge",
      "Practical Scenarios",
      "Communication & Ethics",
    ];

  const roleText = meta?.placeholders?.targetRole || "";
  const roleSuggestions = roleText
    .replace(/^e\.g\.\s*/i, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    interviewTypes: UNIVERSAL_INTERVIEW_TYPES,
    domainTopics,
    roleSuggestions,
  };
}
