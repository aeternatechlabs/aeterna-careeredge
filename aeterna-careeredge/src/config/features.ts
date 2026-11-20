// src/config/features.ts
// Single Source of Truth for Feature Availability, Status, and Tool Metadata
// Used across Dashboard, Navigation Sidebar, and Coming Soon states.

export type FeatureStatus = "AVAILABLE" | "BETA" | "COMING_SOON";

export type FeatureGroup = "BUILD" | "IMPROVE" | "JOBS" | "TRACK" | "GUIDANCE";

export interface FeatureDefinition {
  id: string;
  name: string;
  shortDescription: string;
  route: string;
  group: FeatureGroup;
  status: FeatureStatus;
  badgeLabel?: string;
  expectedNote?: string;
  relatedFeatureRoute?: string;
  relatedFeatureName?: string;
  iconName: string;
  planAccess?: "FREE" | "PRO" | "ALL";
}

export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  // --- BUILD & DOCUMENT ---
  "career-passport": {
    id: "career-passport",
    name: "Career Passport",
    shortDescription: "Your unified, verified academic and professional identity.",
    route: "/passport",
    group: "BUILD",
    status: "AVAILABLE",
    iconName: "Fingerprint",
    planAccess: "ALL",
  },
  "resume-builder": {
    id: "resume-builder",
    name: "Resume Builder",
    shortDescription: "Tailor profession-specific, ATS-calibrated resumes with full section control.",
    route: "/resume",
    group: "BUILD",
    status: "AVAILABLE",
    iconName: "FileText",
    planAccess: "ALL",
  },
  "resume-studio": {
    id: "resume-studio",
    name: "Resume Studio",
    shortDescription: "Upload any resume or choose a profession, apply target prompt, and generate 3 strategic ATS-verified resumes.",
    route: "/resume/studio",
    group: "BUILD",
    status: "AVAILABLE",
    badgeLabel: "New",
    iconName: "Sparkles",
    planAccess: "ALL",
  },
  "sop-builder": {
    id: "sop-builder",
    name: "Statement of Purpose (SOP)",
    shortDescription: "Draft university-calibrated Statements of Purpose backed strictly by verified facts.",
    route: "/sop",
    group: "BUILD",
    status: "COMING_SOON",
    badgeLabel: "Coming soon",
    expectedNote: "In design & development. Backed by university admissions criteria.",
    relatedFeatureRoute: "/resume",
    relatedFeatureName: "Resume Builder",
    iconName: "BookOpen",
    planAccess: "PRO",
  },

  // --- IMPROVE & VERIFY ---
  "evidence-vault": {
    id: "evidence-vault",
    name: "Evidence Vault",
    shortDescription: "Secure repository for certificates, transcripts, project repos, and proof.",
    route: "/evidence-vault",
    group: "IMPROVE",
    status: "AVAILABLE",
    iconName: "ShieldCheck",
    planAccess: "ALL",
  },
  "linkedin-optimizer": {
    id: "linkedin-optimizer",
    name: "LinkedIn Builder & Optimizer",
    shortDescription: "Align your public professional headline, summary, and experience.",
    route: "/linkedin",
    group: "IMPROVE",
    status: "AVAILABLE",
    iconName: "Network",
    planAccess: "ALL",
  },
  "resume-check": {
    id: "resume-check",
    name: "Resume ATS Checker",
    shortDescription: "Compare your resume against real target job descriptions for skill match scoring.",
    route: "/resume/check",
    group: "IMPROVE",
    status: "AVAILABLE",
    iconName: "FileSearch",
    planAccess: "ALL",
  },

  // --- EXPLORE & APPLY ---
  "job-matches": {
    id: "job-matches",
    name: "Job Matches",
    shortDescription: "Curated multi-domain job opportunities with automated skill gap analysis.",
    route: "/jobs",
    group: "JOBS",
    status: "AVAILABLE",
    badgeLabel: "Sample Data",
    iconName: "BriefcaseBusiness",
    planAccess: "ALL",
  },
  "applications-tracker": {
    id: "applications-tracker",
    name: "Application Tracker",
    shortDescription: "Track your job applications, interviews, follow-ups, and tailored packs.",
    route: "/applications",
    group: "JOBS",
    status: "AVAILABLE",
    iconName: "ClipboardList",
    planAccess: "ALL",
  },
  "role-fit-explorer": {
    id: "role-fit-explorer",
    name: "Role Fit Explorer",
    shortDescription: "Benchmark your skills against National Occupational Standards (NOS).",
    route: "/role-fit-explorer",
    group: "JOBS",
    status: "AVAILABLE",
    iconName: "Compass",
    planAccess: "ALL",
  },

  // --- TRACK & ACCELERATE ---
  "employability-sprints": {
    id: "employability-sprints",
    name: "30-Day Placement Sprints",
    shortDescription: "Structured daily actionable tasks to close critical skill and evidence gaps.",
    route: "/sprints",
    group: "TRACK",
    status: "AVAILABLE",
    iconName: "Zap",
    planAccess: "ALL",
  },
  "interview-prep": {
    id: "interview-prep",
    name: "Interview Prep Kits",
    shortDescription: "Generate profession-specific technical and behavioral interview questionnaires.",
    route: "/interview-prep",
    group: "TRACK",
    status: "AVAILABLE",
    iconName: "HelpCircle",
    planAccess: "ALL",
  },
  "career-counselling": {
    id: "career-counselling",
    name: "1-on-1 Counselling",
    shortDescription: "Book personal guidance sessions with domain placement mentors.",
    route: "/counselling",
    group: "TRACK",
    status: "COMING_SOON",
    badgeLabel: "Coming soon",
    expectedNote: "Mentorship booking system is launching in a future update.",
    relatedFeatureRoute: "/passport",
    relatedFeatureName: "Career Passport",
    iconName: "CalendarDays",
    planAccess: "PRO",
  },
  "settings": {
    id: "settings",
    name: "Settings & Privacy",
    shortDescription: "Manage your account, explicit recruiter unlock consent, and security.",
    route: "/settings",
    group: "GUIDANCE",
    status: "AVAILABLE",
    iconName: "Settings",
    planAccess: "ALL",
  },
  "pricing": {
    id: "pricing",
    name: "Plans & Pricing",
    shortDescription: "Transparent subscription options calibrated for Indian students.",
    route: "/pricing",
    group: "GUIDANCE",
    status: "AVAILABLE",
    iconName: "Sparkles",
    planAccess: "ALL",
  },
};

export const FEATURE_GROUPS: Array<{
  id: FeatureGroup;
  title: string;
  description: string;
}> = [
  { id: "BUILD", title: "Build & Document", description: "Create your core verified career artifacts" },
  { id: "IMPROVE", title: "Improve & Verify", description: "Ground claims, audit truth, and calibrate for ATS" },
  { id: "JOBS", title: "Explore & Apply", description: "Discover aligned roles and track application packs" },
  { id: "TRACK", title: "Track & Accelerate", description: "30-day sprints, interview kits, and milestone ledger" },
  { id: "GUIDANCE", title: "Account & System", description: "Subscription, privacy controls, and settings" },
];

export function getFeature(id: string): FeatureDefinition | undefined {
  return FEATURE_REGISTRY[id];
}

export function getFeatureByRoute(route: string): FeatureDefinition | undefined {
  return Object.values(FEATURE_REGISTRY).find((f) => f.route === route || route.startsWith(`${f.route}/`));
}

export function getAvailableFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter((f) => f.status === "AVAILABLE" || f.status === "BETA");
}

export function getComingSoonFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter((f) => f.status === "COMING_SOON");
}

export function isFeatureAvailable(route: string): boolean {
  const feat = getFeatureByRoute(route);
  return feat ? feat.status !== "COMING_SOON" : true;
}
