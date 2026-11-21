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
import { AllToolsGrid } from "@/components/dashboard/all-tools-grid";
import { YourFilesSection } from "@/components/dashboard/your-files-section";
import {
  GraduationCap,
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
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }}
    >
      {/* Maximum content width ~1020px, 24px vertical rhythm (space-y-6) */}
      <div className="mx-auto max-w-[1020px] space-y-6 pb-12 w-full min-w-0">
        {/* ============================================================
            SECTION 1: GREETING ROW
        ============================================================ */}
        <section
          aria-label="Student Overview"
          className="rounded-2xl sm:rounded-[20px] border border-[#F0DFDC] bg-white p-4 sm:p-6 shadow-xs"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Greeting, verification badges, target role & score */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7A1A2B] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                  <GraduationCap size={12} aria-hidden="true" />
                  <span>Tier 1 Verified Student</span>
                </span>
                <span className="rounded-full bg-[#FDF6F3] border border-[#F0DFDC] px-2.5 py-0.5 text-[11px] font-semibold text-[#6F5A5D]">
                  {academicDomain}
                </span>
              </div>

              <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-[#2A1417]">
                Welcome back, {firstName} 👋
              </h1>

              <p className="text-xs sm:text-sm text-[#6F5A5D] leading-relaxed">
                Target Role:{" "}
                <strong className="text-[#2A1417] font-semibold">{preferredJobRole}</strong>
                {" • "}
                Verified Profile:{" "}
                <strong className="text-[#7A1A2B] font-bold">{score}% complete</strong>.
              </p>
            </div>

            {/* Right on desktop / Bottom on mobile: Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex flex-1 md:flex-initial items-center justify-center gap-1.5 rounded-xl border border-[#F0DFDC] bg-white px-3.5 py-2 text-xs font-bold text-[#2A1417] shadow-2xs hover:bg-[#FFF9F7] active:bg-[#F9E8E8] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
              >
                <Upload size={13} className="text-[#7A1A2B]" aria-hidden="true" />
                <span>Upload Resume</span>
              </button>

              <Link
                href="/onboarding?from=dashboard"
                className="inline-flex flex-1 md:flex-initial items-center justify-center gap-1.5 rounded-xl border border-[#F0DFDC] bg-white px-3.5 py-2 text-xs font-bold text-[#2A1417] shadow-2xs hover:bg-[#FFF9F7] active:bg-[#F9E8E8] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
              >
                <Pencil size={13} className="text-[#6F5A5D]" aria-hidden="true" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: DO THIS NEXT (Most Prominent Full-Width Maroon Card)
        ============================================================ */}
        <NextStepCard action={nextAction} />

        {/* ============================================================
            SECTION 3: GETTING STARTED STEPPER (6-step Progress)
        ============================================================ */}
        <GettingStartedStepper milestones={milestones} />

        {/* ============================================================
            SECTION 4: CAREER STATISTICS STRIP (4 Key Metrics)
        ============================================================ */}
        <StatsStrip
          profileReady={score}
          resumesCount={resumeCount}
          skillsCount={skillCount}
          applicationsCount={applicationCount}
        />

        {/* ============================================================
            SECTION 5: TOOLS TOUR CAROUSEL (Explore Our Tools)
        ============================================================ */}
        <ToolsCarousel />

        {/* ============================================================
            SECTION 6 & 7: ALL TOOLS GRID (2/3) + YOUR FILES (1/3)
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Section 6: All Tools Grid (Left 7 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-7">
            <AllToolsGrid onOpenUploadModal={() => setIsUploadModalOpen(true)} />
          </div>

          {/* Section 7: Your Files (Right 5 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-5">
            <YourFilesSection
              resumes={user.resumes}
              storedDocuments={user.storedDocuments}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          </div>
        </div>

        {/* ============================================================
            SECTION 8: COMING-SOON MESSAGE
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
