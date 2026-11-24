// src/lib/monetization/plans.ts
// Configurable Plan & Entitlement Definitions for Aeterna CareerEdge (Day 2 Section E)
// No hardcoded prices in UI or business logic; all read from this central configuration.

export interface FeatureQuota {
  featureKey: string;
  monthlyQuota: number; // -1 = unlimited
  description: string;
}

export interface PlanConfig {
  id: string; // "FREE" | "PREMIUM" | "INSTITUTION"
  name: string;
  displayName: string;
  description: string;
  priceInr: number; // 0 for free; configured for later payment integration
  interval: "monthly" | "short_term_pass" | "annual";
  isDefault: boolean;
  features: string[];
  quotas: Record<string, number>; // featureKey -> monthlyQuota (-1 = unlimited)
}

export const PLANS: Record<string, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "FREE",
    displayName: "Career Starter",
    description: "Essential career tools to build your verified baseline.",
    priceInr: 0,
    interval: "monthly",
    isDefault: true,
    features: [
      "Student Career Profile & Readiness Baseline",
      "Secure Document Storage (up to 10 files)",
      "1 Profession-specific Resume with direct PDF export",
      "Resume Studio ATS Alignment & Check",
      "Full Application Journey Tracker",
      "Getting Started Guide & Next Best Action",
      "Role-Fit Exploration & Job Matching",
      "AI Career Guide (15 questions/month)",
    ],
    quotas: {
      RESUME_CREATION: 1,
      RESUME_CHECK: 3,
      RESUME_REVIEW: 5,
      EVIDENCE_ITEMS: 10,
      READINESS_REPORT: 1,
      JOB_MATCH: 15,
      GUIDE_MESSAGES: 15,
      TRUTH_CHECK: 5,
    },
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "PREMIUM",
    displayName: "CareerEdge Pro",
    description: "Deep optimization, tailored packs, interview kit, and sprint roadmap.",
    priceInr: 499, // Recommended reference price; configurable
    interval: "monthly",
    isDefault: false,
    features: [
      "Unlimited Resume versions tailored to target roles",
      "Multi-Strategy Resume Studio with ATS tailoring",
      "Detailed LinkedIn Optimizer (Profile & headline polish)",
      "1-Click Application Packs (Outreach notes & talking points)",
      "Role-Specific Interview Prep Kits with STAR frameworks",
      "30-Day Employability Sprints with daily milestones",
      "Expanded Document Storage (up to 50 files)",
      "Full Truth-Check & Claim Verification",
      "AI Career Guide (150 questions/month)",
    ],
    quotas: {
      RESUME_CREATION: -1, // unlimited
      RESUME_CHECK: 50,
      RESUME_REVIEW: 50,
      EVIDENCE_ITEMS: 50,
      READINESS_REPORT: 10,
      JOB_MATCH: 100,
      GUIDE_MESSAGES: 150,
      TRUTH_CHECK: -1,
      APPLICATION_PACK: 20,
      INTERVIEW_PREP: 20,
      SPRINT_PLAN: 5,
    },
  },
  PLACEMENT_PASS: {
    id: "PLACEMENT_PASS",
    name: "PLACEMENT_PASS",
    displayName: "Placement Season Pass (45 Days)",
    description: "Fixed-window premium access designed for campus placement season.",
    priceInr: 799,
    interval: "short_term_pass",
    isDefault: false,
    features: [
      "All CareerEdge Pro features for 45 calendar days",
      "Unlimited resumes, application packs, and interview prep kits",
      "Priority guidance during active recruitment season",
    ],
    quotas: {
      RESUME_CREATION: -1,
      RESUME_CHECK: 50,
      RESUME_REVIEW: 50,
      EVIDENCE_ITEMS: 50,
      READINESS_REPORT: 20,
      JOB_MATCH: 200,
      GUIDE_MESSAGES: 250,
      TRUTH_CHECK: -1,
      APPLICATION_PACK: 50,
      INTERVIEW_PREP: 50,
      SPRINT_PLAN: 10,
    },
  },
  INSTITUTION: {
    id: "INSTITUTION",
    name: "INSTITUTION",
    displayName: "Campus Enterprise",
    description: "Sponsored by college or university placement cell.",
    priceInr: 0,
    interval: "annual",
    isDefault: false,
    features: [
      "College-sponsored full Pro access for enrolled students",
      "Institutional placement cohort alignment",
      "Counsellor verified reviews",
    ],
    quotas: {
      RESUME_CREATION: -1,
      RESUME_CHECK: -1,
      RESUME_REVIEW: -1,
      EVIDENCE_ITEMS: 100,
      READINESS_REPORT: -1,
      JOB_MATCH: -1,
      GUIDE_MESSAGES: 300,
      TRUTH_CHECK: -1,
      APPLICATION_PACK: -1,
      INTERVIEW_PREP: -1,
      SPRINT_PLAN: -1,
    },
  },
};
