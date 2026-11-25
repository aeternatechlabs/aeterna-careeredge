"use client";

// src/app/dashboard/dashboard-client.tsx
// Redesigned Student Career Dashboard for Aeterna CareerEdge.
// Structure (Strict F-pattern & 24px vertical rhythm):
// 1. Greeting row (Personalized greeting, verification chips, target role, quick actions)
// 2. Do this next (Most prominent maroon banner with priority action)
// 3. Getting started stepper (6-step milestones, progress count once "X of 6 done")
// 4. Career statistics strip (Slim 4-metric strip: Profile Ready %, Resumes, Skills, Applications)
// 5. Tools tour carousel (5 slides with inline SVG illustrations, auto-advance, controls)
// 6. All tools grid (9 searchable tools with real-time text filter)
// 7. Your files (Recent resumes with dates + document upload area)
// 8. Coming-soon message (Subtle muted line at page bottom)

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getNextBestAction,
  type StudentContextSnapshot,
} from "@/lib/guidance/next-best-action";
import { StudentLayout } from "@/components/layouts/student-layout";
import { UploadResumeModal } from "@/components/resume/upload-resume-modal";
import { NextStepCard } from "@/components/dashboard/next-step-card";
import {
  GettingStartedStepper,
  type StepperMilestone,
} from "@/components/dashboard/getting-started-stepper";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { ToolsCarousel } from "@/components/dashboard/tools-carousel";
import { YourFilesSection } from "@/components/dashboard/your-files-section";
import {
  Upload,
  Pencil,
  Lightbulb,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StoredDoc {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  category: string;
  createdAt: string | Date;
}

interface EvidenceDoc {
  id: string;
  title: string;
  type: string;
  relatedSkill: string | null;
  provenance?: string;
  verificationStatus?: string;
  createdAt: string | Date;
}

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  profile: {
    academicDomain: string | null;
    specialization: string | null;
    educationLevel: string | null;
    institution: string | null;
    course: string | null;
    gradingType: string | null;
    gradeValue: string | null;
    careerInterests: string | null;
    preferredJobRole: string | null;
    targetIndustry: string | null;
    passportScore: number | null;
  } | null;
  storedDocuments?: StoredDoc[];
  evidenceItems?: EvidenceDoc[];
  resumes?: Array<{
    id: string;
    title: string;
    targetRole?: string | null;
    templateId?: string | null;
    atsScore?: number | null;
    updatedAt: string | Date;
  }>;
  applications?: Array<{
    id: string;
    jobTitle: string;
    companyName: string;
    applicationStatus?: string;
    status?: string;
    updatedAt: string | Date;
  }>;
  _count?: {
    educations: number;
    skills: number;
    projects: number;
    experiences: number;
    certifications: number;
    resumes?: number;
    applications?: number;
    evidenceItems?: number;
    interviewPrepKits?: number;
  };
}

interface DashboardClientProps {
  user: DashboardUser;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Derive Name & Student Identity
  const firstName = user.name ? user.name.split(" ")[0] : "Student";
  const academicDomain = user.profile?.academicDomain || "General Academic";
  const preferredJobRole = user.profile?.preferredJobRole || "Aspiring Professional";
  const score = user.profile?.passportScore ?? 95;

  // Real Database Counts
  const educationCount = user._count?.educations ?? 0;
  const skillCount = user._count?.skills ?? 0;
  const evidenceCount = user._count?.evidenceItems ?? (user.evidenceItems?.length ?? 0);
  const resumeCount = user._count?.resumes ?? (user.resumes?.length ?? 0);
  const applicationCount = user._count?.applications ?? (user.applications?.length ?? 0);

  // 1. Compute Next Best Action (Rules Engine)
  const contextSnapshot: StudentContextSnapshot = useMemo(() => {
    return {
      onboardingCompleted: Boolean(user.profile?.institution && user.profile?.academicDomain),
      passportScore: score,
      hasDomain: Boolean(user.profile?.academicDomain),
      hasRole: Boolean(user.profile?.preferredJobRole),
      educationCount,
      skillCount,
      evidenceCount,
      unsupportedClaimsCount: resumeCount > 0 && evidenceCount === 0 ? 1 : 0,
      resumeCount,
      savedJobsCount: 0,
      activeApplicationsCount: applicationCount,
      overdueFollowUpsCount: 0,
      activeSprintTasksDue: 0,
    };
  }, [user.profile, score, educationCount, skillCount, evidenceCount, resumeCount, applicationCount]);

  const rawNextAction = useMemo(() => getNextBestAction(contextSnapshot), [contextSnapshot]);

  // Clean up action presentation for high visual impact
  const nextAction = useMemo(() => {
    return {
      title: rawNextAction.title,
      description: rawNextAction.description,
      actionLabel: rawNextAction.actionLabel || "Review Now",
      actionRoute: rawNextAction.actionRoute || "/resume/studio",
      badgeText: rawNextAction.badgeText,
    };
  }, [rawNextAction]);

  // 2. Compute 6 Getting Started Milestones
  const milestones: StepperMilestone[] = useMemo(() => {
    return [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Complete Profile",
        isComplete: Boolean(user.profile?.institution && user.profile?.course),
        route: "/onboarding?from=dashboard",
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Choose a Target Role",
        isComplete: Boolean(user.profile?.preferredJobRole),
        route: "/role-fit-explorer",
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Upload Resume",
        isComplete: resumeCount > 0,
        route: "/resume/studio",
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Optimize LinkedIn",
        isComplete: false,
        route: "/linkedin",
      },
      {
        id: "step-5",
        stepNumber: 5,
        title: "Explore Jobs",
        isComplete: applicationCount > 0,
        route: "/jobs",
      },
      {
        id: "step-6",
        stepNumber: 6,
        title: "Start Sprint",
        isComplete: false,
        route: "/sprints",
      },
    ];
  }, [user.profile, resumeCount, applicationCount]);

  return (
    <StudentLayout
      userName={user.name}
      studentDomain={academicDomain}
      targetRole={preferredJobRole}
      onLogout={async () => {
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch {}
        window.location.href = "/login";
      }}
    >
      {/* Full available width on all screens, 24px vertical rhythm (space-y-6) */}
      <div className="w-full space-y-6 pb-12 min-w-0">
        {/* ============================================================
            SECTION 1: GREETING ROW
        ============================================================ */}
        <section
          aria-label="Student Overview"
          className="relative overflow-hidden rounded-2xl sm:rounded-[20px] border border-[#F0DFDC] bg-white p-4 sm:p-6 shadow-xs"
        >
          {/* Decorative Background Shapes & Accents: Soft pastel glow, wave curves & gold sparkles */}
          <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            {/* Soft Ambient Pastel Glow Orbs */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#F9E8E8]/70 blur-2xl" />
            <div className="absolute -bottom-10 left-1/4 w-52 h-28 rounded-full bg-[#F2B33D]/10 blur-xl" />

            {/* Subtle Flowing Wave Curves */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.08]"
              viewBox="0 0 900 120"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 0 90 C 250 20, 500 100, 900 30"
                stroke="#7A1A2B"
                strokeWidth="1.5"
              />
              <path
                d="M 0 110 C 300 40, 600 110, 900 60"
                stroke="#F2B33D"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Subtle Concentric Rings (Right side behind action buttons) */}
            <svg
              className="absolute -right-6 top-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.07]"
              viewBox="0 0 160 160"
              fill="none"
            >
              <circle cx="80" cy="80" r="35" stroke="#7A1A2B" strokeWidth="1" />
              <circle cx="80" cy="80" r="60" stroke="#F2B33D" strokeWidth="1" strokeDasharray="3 4" />
              <circle cx="80" cy="80" r="85" stroke="#7A1A2B" strokeWidth="0.75" />
            </svg>

            {/* Delicate 4-Point Gold & Blush Sparkles */}
            <svg
              className="absolute top-3.5 right-1/3 w-3 h-3 text-[#F2B33D] opacity-45 animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
            <svg
              className="absolute bottom-3 left-1/3 w-2 h-2 text-[#7A1A2B] opacity-25"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Greeting, target role */}
            <div className="space-y-1.5 min-w-0">
              <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-[#2A1417]">
                Welcome back, {firstName} 👋
              </h1>

              <p className="text-xs sm:text-sm text-[#6F5A5D] leading-relaxed">
                Target Role:{" "}
                <strong className="text-[#2A1417] font-bold">{preferredJobRole}</strong>
              </p>
            </div>

            {/* Right on desktop / Bottom on mobile: Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex flex-1 md:flex-initial items-center justify-center gap-1.5 rounded-full bg-[#7A1A2B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#650B19] active:bg-[#4C0915] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
              >
                <Upload size={13} className="text-white" aria-hidden="true" />
                <span>Upload Resume</span>
              </button>

              <Link
                href="/onboarding?from=dashboard"
                className="inline-flex flex-1 md:flex-initial items-center justify-center gap-1.5 rounded-full border border-[#2B1B1B]/20 bg-white px-5 py-2 text-xs font-bold text-[#2A1417] shadow-2xs hover:bg-[#FFF9F7] active:bg-[#F9E8E8] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
              >
                <Pencil size={13} className="text-[#6F5A5D]" aria-hidden="true" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: TOOLS FOR YOUR CAREER (Moved directly below Greeting)
        ============================================================ */}
        <ToolsCarousel />

        {/* ============================================================
            SECTION 3: DO THIS NEXT (Most Prominent Full-Width Maroon Hero Card)
        ============================================================ */}
        <NextStepCard action={nextAction} />

        {/* ============================================================
            SECTION 4: GETTING STARTED STEPPER (6-step Progress with Chevrons)
        ============================================================ */}
        <GettingStartedStepper milestones={milestones} />

        {/* ============================================================
            SECTION 5: CAREER STATISTICS STRIP (4 Key Metrics)
        ============================================================ */}
        <StatsStrip
          profileReady={score}
          resumesCount={resumeCount}
          skillsCount={skillCount}
          applicationsCount={applicationCount}
        />

        {/* ============================================================
            SECTION 6: YOUR FILES (Recent Resumes & Document Upload Box)
        ============================================================ */}
        <YourFilesSection
          resumes={user.resumes}
          storedDocuments={user.storedDocuments}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />

        {/* ============================================================
            SECTION 7: COMING-SOON MESSAGE
        ============================================================ */}
        <div className="flex items-center justify-center gap-2 pt-2 pb-4 text-center text-xs text-[#907D79]">
          <Lightbulb size={14} className="text-[#F2B33D] shrink-0" aria-hidden="true" />
          <span>Coming soon: more AI-powered tools to boost your career journey.</span>
        </div>
      </div>

      {/* Global Upload Resume Modal */}
      <UploadResumeModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultTargetRole={preferredJobRole}
        onSuccess={({ resumeId }) => {
          setIsUploadModalOpen(false);
          if (resumeId) {
            router.push(`/resume/builder?id=${resumeId}`);
          } else {
            router.refresh();
          }
        }}
      />
    </StudentLayout>
  );
}
