// src/lib/guidance/next-best-action.ts
// Deterministic Next Best Action Rules Engine (Day 2 Section C6)
// Zero AI cost: computes the student's highest priority next step purely from database records.

export interface NextAction {
  id: string;
  priority: number; // lower number = higher priority
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
  badgeText?: string;
}

export interface StudentContextSnapshot {
  onboardingCompleted: boolean;
  passportScore: number;
  hasDomain: boolean;
  hasRole: boolean;
  educationCount: number;
  skillCount: number;
  evidenceCount: number;
  unsupportedClaimsCount: number;
  resumeCount: number;
  savedJobsCount: number;
  activeApplicationsCount: number;
  overdueFollowUpsCount: number;
  activeSprintTasksDue: number;
}

export const NEXT_ACTION_RULES: Array<{
  id: string;
  priority: number;
  condition: (ctx: StudentContextSnapshot) => boolean;
  buildAction: (ctx: StudentContextSnapshot) => NextAction;
}> = [
  {
    id: "COMPLETE_ONBOARDING",
    priority: 1,
    condition: (ctx) => !ctx.onboardingCompleted || !ctx.hasDomain,
    buildAction: () => ({
      id: "COMPLETE_ONBOARDING",
      priority: 1,
      title: "Set up your Career Passport",
      description: "Pick your academic field and education level so CareerEdge can tailor your tools.",
      actionLabel: "Complete Profile",
      actionRoute: "/onboarding?from=dashboard",
      badgeText: "Required",
    }),
  },
  {
    id: "CHOOSE_TARGET_ROLE",
    priority: 2,
    condition: (ctx) => ctx.onboardingCompleted && !ctx.hasRole,
    buildAction: () => ({
      id: "CHOOSE_TARGET_ROLE",
      priority: 2,
      title: "Choose your target role",
      description: "Explore realistic roles for your profession to unlock custom resumes and matching.",
      actionLabel: "Explore Roles",
      actionRoute: "/role-fit-explorer",
      badgeText: "Recommended",
    }),
  },
  {
    id: "CREATE_FIRST_RESUME",
    priority: 3,
    condition: (ctx) => ctx.resumeCount === 0,
    buildAction: (ctx) => ({
      id: "CREATE_FIRST_RESUME",
      priority: 3,
      title: ctx.passportScore < 30 ? "Upload your resume or build one" : "Draft your profession resume",
      description:
        ctx.passportScore < 30
          ? "Upload your existing resume to instantly fill your Career Passport, or build a clean ATS draft from scratch."
          : "Generate a clean, targeted resume built directly from your verified Career Passport.",
      actionLabel: ctx.passportScore < 30 ? "Upload or Build" : "Build Resume",
      actionRoute: "/resume",
      badgeText: "Resume Studio",
    }),
  },
  {
    id: "UPLOAD_EVIDENCE",
    priority: 5,
    condition: (ctx) => ctx.resumeCount > 0 && ctx.unsupportedClaimsCount > 0,
    buildAction: (ctx) => ({
      id: "UPLOAD_EVIDENCE",
      priority: 5,
      title: "Review resume claims in Resume Studio",
      description: `You have ${ctx.unsupportedClaimsCount} skill claims needing review. Refine and tailor them in Resume Studio.`,
      actionLabel: "Open Resume Studio",
      actionRoute: "/resume/studio",
      badgeText: "Resume",
    }),
  },
  {
    id: "OVERDUE_FOLLOW_UPS",
    priority: 6,
    condition: (ctx) => ctx.overdueFollowUpsCount > 0,
    buildAction: (ctx) => ({
      id: "OVERDUE_FOLLOW_UPS",
      priority: 6,
      title: "Follow up on job applications",
      description: `You have ${ctx.overdueFollowUpsCount} job follow-up dates due in your Application Tracker.`,
      actionLabel: "View Tracker",
      actionRoute: "/applications",
      badgeText: "Action Due",
    }),
  },
  {
    id: "SPRINT_DAILY_TASK",
    priority: 7,
    condition: (ctx) => ctx.activeSprintTasksDue > 0,
    buildAction: (ctx) => ({
      id: "SPRINT_DAILY_TASK",
      priority: 7,
      title: "Complete today's sprint task",
      description: `You have ${ctx.activeSprintTasksDue} task ready in your 30-day Gap-to-Action Sprint.`,
      actionLabel: "Open Sprint",
      actionRoute: "/sprint",
      badgeText: "30-Day Sprint",
    }),
  },
  {
    id: "DISCOVER_JOBS",
    priority: 8,
    condition: () => true, // Fallback rule: always matches
    buildAction: () => ({
      id: "DISCOVER_JOBS",
      priority: 8,
      title: "Explore matching job vacancies",
      description: "Find real vacancies from authorized employers matching your verified skills.",
      actionLabel: "Explore Jobs",
      actionRoute: "/job-matcher",
      badgeText: "Verified Jobs",
    }),
  },
];

/**
 * Determine the student's Next Best Action deterministically.
 */
export function getNextBestAction(ctx: StudentContextSnapshot): NextAction {
  for (const rule of NEXT_ACTION_RULES) {
    if (rule.condition(ctx)) {
      return rule.buildAction(ctx);
    }
  }
  // Ultimate fallback
  return NEXT_ACTION_RULES[NEXT_ACTION_RULES.length - 1].buildAction(ctx);
}
