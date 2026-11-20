"use client";

// src/app/dashboard/dashboard-client.tsx
// Restructured Dashboard following strict UI/UX visual hierarchy and F-pattern ordering:
// 1. Greeting + one-line status bar
// 2. Next Best Action (single most prominent card)
// 3. Urgent / Attention items (shown ONLY when real items exist; hidden otherwise)
// 4. Progress / Getting Started Checklist (real data, progress bar, collapsible)
// 5. Quick Actions (3-5 high-contrast action cards)
// 6. Key Metrics (real records, empty states when zero)
// 7. Recent Activity (short list, "View all in Progress Ledger")
// 8. All Tools Overview (grouped by purpose; coming soon items visually separated at the end)

import { useState, type ChangeEvent, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getNextBestAction,
  type StudentContextSnapshot,
} from "@/lib/guidance/next-best-action";
import { GettingStartedChecklist, type ChecklistItem } from "@/components/guidance/getting-started-checklist";
import { HowItWorksPanel } from "@/components/guidance/how-it-works-panel";
import { StudentLayout } from "@/components/layouts/student-layout";
import { StatCard } from "@/components/shared/stat-card";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ComingSoonCard } from "@/components/ui/coming-soon-card";
import { ToolShowcaseCarousel } from "@/components/dashboard/tool-showcase-carousel";
import { UploadResumeButton } from "@/components/resume/upload-resume-button";
import {
  getAvailableFeatures,
  getComingSoonFeatures,
} from "@/config/features";
import {
  FileText,
  Upload,
  Download,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  BriefcaseBusiness,
  ShieldCheck,
  CheckCheck,
  Network,
  Compass,
  Zap,
  HelpCircle,
  TrendingUp,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  GraduationCap,
  Fingerprint,
  ClipboardList,
  Pencil,
  type LucideIcon,
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

interface UrgentItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  actionHref: string;
  severity: "high" | "medium";
}

/* ------------------------------------------------------------------ */
/*  Component Implementation                                           */
/* ------------------------------------------------------------------ */

export function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<StoredDoc[]>(user.storedDocuments || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Derive Name & Identity
  const firstName = user.name ? user.name.split(" ")[0] : "Student";
  const academicDomain = user.profile?.academicDomain || "General Academic";
  const preferredJobRole = user.profile?.preferredJobRole || "Aspiring Professional";
  const score = user.profile?.passportScore ?? 65;

  // Real Counts
  const educationCount = user._count?.educations ?? 0;
  const skillCount = user._count?.skills ?? 0;
  const evidenceCount = user._count?.evidenceItems ?? (user.evidenceItems?.length ?? 0);
  const resumeCount = user._count?.resumes ?? (user.resumes?.length ?? 0);
  const applicationCount = user._count?.applications ?? (user.applications?.length ?? 0);

  // 1. Compute Next Best Action (Deterministic Rules Engine)
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

  const nextAction = useMemo(() => getNextBestAction(contextSnapshot), [contextSnapshot]);

  // 2. Compute Urgent / Attention Items (Show ONLY real records; hide if none)
  const urgentItems: UrgentItem[] = useMemo(() => {
    const list: UrgentItem[] = [];

    // Check required profile fields
    if (!user.profile?.institution || !user.profile?.course) {
      list.push({
        id: "missing-education",
        title: "Complete Academic Institution & Degree",
        description: "Your college and degree program are required to unlock verified Karnataka employer matching.",
        icon: AlertTriangle,
        actionLabel: "Update Passport",
        actionHref: "/passport",
        severity: "high",
      });
    }

    if (!user.profile?.preferredJobRole) {
      list.push({
        id: "missing-role",
        title: "Define Target Career Role",
        description: "Setting a target role calibrates your Resume Builder and Job Matches to official NOS standards.",
        icon: AlertCircle,
        actionLabel: "Set Target Role",
        actionHref: "/role-fit-explorer",
        severity: "medium",
      });
    }

    // Check upcoming interviews
    const activeInterviews = (user.applications || []).filter(
      (app) => app.applicationStatus === "INTERVIEWING" || app.status === "INTERVIEWING"
    );
    if (activeInterviews.length > 0) {
      list.push({
        id: "interview-prep",
        title: `Interview Scheduled with ${activeInterviews[0].companyName}`,
        description: `Prepare for your ${activeInterviews[0].jobTitle} round using our domain technical questionnaire.`,
        icon: Calendar,
        actionLabel: "Open Interview Prep",
        actionHref: "/interview-prep",
        severity: "high",
      });
    }

    // Check resume with 0 evidence
    if (resumeCount > 0 && evidenceCount === 0) {
      list.push({
        id: "unverified-resume",
        title: "Resume Claims Lack Documented Proof",
        description: "You have active resumes without backed evidence. Upload proof to pass recruiter verification.",
        icon: ShieldCheck,
        actionLabel: "Add Proof to Vault",
        actionHref: "/evidence-vault",
        severity: "medium",
      });
    }

    return list;
  }, [user.profile, user.applications, resumeCount, evidenceCount]);

  // 3. Compute Getting Started Checklist Items
  const checklistItems: ChecklistItem[] = useMemo(() => {
    return [
      {
        id: "profile",
        label: "Complete Career Passport basics",
        description: "Add your institution, domain, and current degree details.",
        isComplete: Boolean(user.profile?.institution && user.profile?.course),
        route: "/passport",
        actionText: "Update Passport",
      },
      {
        id: "role",
        label: "Choose a target role & benchmark skills",
        description: "Explore realistic roles for your academic domain.",
        isComplete: Boolean(user.profile?.preferredJobRole),
        route: "/role-fit-explorer",
        actionText: "Explore Roles",
      },
      {
        id: "proof",
        label: "Upload academic credentials & projects",
        description: "Add your mark sheets, certificates, or project repositories.",
        isComplete: evidenceCount > 0,
        route: "/evidence-vault",
        actionText: "Open Vault",
      },
      {
        id: "resume",
        label: "Upload your resume or build one",
        description: "Upload an existing resume or generate a targeted ATS draft from your passport.",
        isComplete: resumeCount > 0,
        route: "/resume",
        actionText: "Upload or Build",
      },
      {
        id: "linkedin",
        label: "Optimize your LinkedIn headline & summary",
        description: "Align your public professional brand with target recruiter keywords.",
        isComplete: false,
        route: "/linkedin",
        actionText: "Open LinkedIn",
      },
      {
        id: "jobs",
        label: "Explore verified job matches",
        description: "Review opportunities matching your domain criteria.",
        isComplete: applicationCount > 0,
        route: "/jobs",
        actionText: "View Matches",
      },
      {
        id: "sprint",
        label: "Start a 30-Day Employability Sprint",
        description: "Close critical skill gaps with daily guided micro-tasks.",
        isComplete: false,
        route: "/sprints",
        actionText: "Start Sprint",
      },
    ];
  }, [user.profile, evidenceCount, resumeCount, applicationCount]);

  // Handle Document Upload
  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File exceeds 5MB limit. Please upload a smaller document.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "RESUME");

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to upload document");
      }

      const newDoc = await res.json();
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Handle Document Delete
  async function handleDeleteDoc(docId: string) {
    if (!confirm("Remove this document from your vault?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      // Ignore
    }
  }

  // Tool categories
  const availableFeatures = useMemo(() => getAvailableFeatures(), []);
  const comingSoonFeatures = useMemo(() => getComingSoonFeatures(), []);

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
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 min-w-0 w-full">
        {/* ============================================================
            1. GREETING & STATUS BAR
        ============================================================ */}
        <section
          aria-label="Student Overview"
          className="rounded-2xl sm:rounded-3xl border border-border bg-surface p-4 sm:p-6 md:p-8 shadow-card"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7A0F1F] px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-white shadow-xs">
                  <GraduationCap size={12} aria-hidden="true" />
                  <span>Tier 1 Verified Student</span>
                </span>
                <span className="rounded-full bg-surface-muted border border-border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-secondary-text">
                  {academicDomain}
                </span>
              </div>

              <h1 className="font-heading text-xl sm:text-2xl md:text-3.5xl font-extrabold tracking-tight text-foreground">
                Welcome back, {firstName} 👋
              </h1>

              <p className="text-xs sm:text-sm text-secondary-text leading-relaxed max-w-2xl">
                Target Role: <strong className="text-foreground font-semibold">{preferredJobRole}</strong> • Verified Passport:{" "}
                <strong className="text-primary font-bold">{score}% complete</strong>.
              </p>
            </div>

            {/* Quick Actions - Simplified and compact below md & sm */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
              <UploadResumeButton variant="outline" label="Upload Resume" />

              <Link
                href="/onboarding?from=dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 sm:px-3.5 py-2 text-xs font-semibold text-secondary-text hover:bg-surface-muted transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Pencil size={12} className="text-muted-text" aria-hidden="true" />
                <span>Edit Profile</span>
              </Link>

              <Link
                href="/passport"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-primary px-3.5 sm:px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>Career Passport</span>
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            1B. TOP-LEVEL FLAGSHIP TOOLS SLIDING SHOWCASE
        ============================================================ */}
        <ToolShowcaseCarousel />

        {/* ============================================================
            2. NEXT BEST ACTION (Single Most Important Action)
        ============================================================ */}
        <section aria-label="Next Best Action">
          <div className="relative overflow-hidden rounded-3xl border border-[#F0E1DE] bg-white p-6 sm:p-7 text-[#2B1B1B] shadow-card">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#F8E8EA] border border-[#F0E1DE] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7A0F1F] shadow-2xs">
                    {nextAction.badgeText || "Recommended Action"}
                  </span>
                  <span className="text-[11px] font-semibold text-[#907D79]">
                    Highest Priority Step
                  </span>
                </div>

                <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#2B1B1B]">
                  {nextAction.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#604B49] leading-relaxed">
                  {nextAction.description}
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href={nextAction.actionRoute}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#7A0F1F] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#650B19] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  <span>{nextAction.actionLabel}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            3. URGENT / ATTENTION ITEMS (Shown ONLY when real items exist)
        ============================================================ */}
        {urgentItems.length > 0 && (
          <section aria-label="Urgent Attention Items" className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle size={15} className="text-[#7A0F1F]" aria-hidden="true" />
              <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
                Items Requiring Your Attention ({urgentItems.length})
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {urgentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-rose-200 bg-[#FFF5F5] p-4 sm:p-5 transition hover:border-rose-300 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#7A0F1F] border border-rose-200 shadow-2xs">
                        <Icon size={16} aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-heading text-xs sm:text-sm font-bold text-[#4C0915]">
                          {item.title}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-rose-200/60 flex justify-end">
                      <Link
                        href={item.actionHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A0F1F] hover:text-[#4C0915] transition"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight size={12} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================
            4. PROGRESS / GETTING STARTED CHECKLIST
        ============================================================ */}
        <section aria-label="Getting Started Milestones">
          <GettingStartedChecklist items={checklistItems} />
        </section>

        {/* ============================================================
            5. QUICK ACTIONS (High-Contrast Action Cards)
        ============================================================ */}
        <section aria-label="Quick Actions" className="space-y-3">
          <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-[#765F5D] px-1">
            Core Quick Actions
          </h2>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Link
              href={user.resumes && user.resumes.length > 0 ? `/resume/builder?id=${user.resumes[0].id}` : "/resume"}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-card shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-primary border border-border group-hover:scale-105 transition-transform">
                <FileText size={17} aria-hidden="true" />
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {user.resumes && user.resumes.length > 0 ? "Edit Active Resume" : "Build New Resume"}
                </h3>
                <p className="mt-0.5 text-[11px] text-secondary-text">
                  ATS-calibrated templates
                </p>
              </div>
            </Link>

            <div className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-card shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white group-hover:scale-105 transition-transform">
                <Upload size={17} aria-hidden="true" />
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Upload Resume
                </h3>
                <p className="mt-0.5 text-[11px] text-secondary-text">
                  PDF or Word import
                </p>
              </div>
              <div className="mt-3">
                <UploadResumeButton variant="compact" label="Upload File" />
              </div>
            </div>

            <Link
              href="/resume/check"
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-card shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-primary border border-border group-hover:scale-105 transition-transform">
                <ShieldCheck size={17} aria-hidden="true" />
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  ATS Resume Check
                </h3>
                <p className="mt-0.5 text-[11px] text-secondary-text">
                  Job description match
                </p>
              </div>
            </Link>

            <Link
              href="/evidence-vault"
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-card shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-primary border border-border group-hover:scale-105 transition-transform">
                <Upload size={17} aria-hidden="true" />
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Deposit Evidence
                </h3>
                <p className="mt-0.5 text-[11px] text-secondary-text">
                  Certificates &amp; repos
                </p>
              </div>
            </Link>

            <Link
              href="/jobs"
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-card shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-primary border border-border group-hover:scale-105 transition-transform">
                <BriefcaseBusiness size={17} aria-hidden="true" />
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Explore Jobs
                </h3>
                <p className="mt-0.5 text-[11px] text-secondary-text">
                  Curated domain vacancies
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* ============================================================
            6. KEY METRICS (Real Database Records)
        ============================================================ */}
        <section aria-label="Key Metrics" className="space-y-3">
          <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-[#765F5D] px-1">
            Career Readiness Metrics
          </h2>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Passport Readiness"
              value={`${score}%`}
              subtext="Calibrated to VTU/Autonomous criteria"
              icon={TrendingUp}
              highlight={true}
              badge={
                <span className="rounded-full bg-[#7A0F1F] px-2 py-0.5 text-[10px] font-bold text-white">
                  Live
                </span>
              }
            />

            <StatCard
              label="Active Resumes"
              value={resumeCount}
              subtext={resumeCount > 0 ? "Targeted & printable" : "No resume created yet"}
              icon={FileText}
              href="/resume"
              emptyStateAction={{ label: "Create First Resume", href: "/resume" }}
            />

            <StatCard
              label="Evidence Items"
              value={evidenceCount}
              subtext={evidenceCount > 0 ? "Documented proof records" : "0 credentials uploaded"}
              icon={ShieldCheck}
              href="/evidence-vault"
              emptyStateAction={{ label: "Upload Credentials", href: "/evidence-vault" }}
            />

            <StatCard
              label="Applications Tracked"
              value={applicationCount}
              subtext={applicationCount > 0 ? "Active pipeline" : "No applications logged"}
              icon={BriefcaseBusiness}
              href="/applications"
              emptyStateAction={{ label: "Track Application", href: "/applications" }}
            />
          </div>
        </section>

        {/* ============================================================
            7. RECENT ACTIVITY & CAREER DOCUMENTS
        ============================================================ */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Recent Activity (7 cols) */}
          <section className="lg:col-span-7 space-y-4">
            <SectionCard
              title="Recent Career Activity"
              subtitle="Latest verified milestones and updates on your profile."
              action={
                <Link
                  href="/passport"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#7A0F1F] hover:text-[#4C0915] transition"
                >
                  <span>View Career Passport</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              }
            >
              {documents.length === 0 && (user.resumes?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No activity recorded yet"
                  description="Your recent resume drafts, document deposits, and milestone updates will appear here."
                  actionLabel="Complete Career Passport"
                  actionHref="/passport"
                />
              ) : (
                <div className="divide-y divide-[#EBDDD1]/60">
                  {user.resumes && user.resumes.length > 0 && (
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF9ED] text-[#7A0F1F] border border-[#EBDDD1]">
                          <FileText size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2B1B1B]">
                            {user.resumes[0].title}
                          </p>
                          <p className="text-[11px] text-[#765F5D]">
                            Target: {user.resumes[0].targetRole || "Standard"} • Updated {new Date(user.resumes[0].updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/resume/builder?id=${user.resumes[0].id}`}
                        className="text-xs font-bold text-[#7A0F1F] hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  )}

                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                          <Upload size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#2B1B1B] truncate max-w-[240px]">
                            {doc.originalFileName}
                          </p>
                          <p className="text-[11px] text-[#765F5D]">
                            Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="text-xs font-bold text-[#7A0F1F] hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </section>

          {/* Right Column: Private Document Storage (5 cols) */}
          <section className="lg:col-span-5 space-y-4">
            <SectionCard
              title="Private Document Vault"
              subtitle="Secure storage for transcripts & certificates (Max 5MB)."
            >
              <div className="space-y-4">
                {uploadError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    {uploadError}
                  </div>
                )}

                <label
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EBDDD1] bg-[#FFFBF9] p-6 text-center cursor-pointer hover:border-[#7A0F1F] hover:bg-[#FFF9ED] transition ${
                    uploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Upload size={22} className="text-[#7A0F1F] mb-2" />
                  <span className="text-xs font-bold text-[#2B1B1B]">
                    {uploading ? "Uploading document…" : "Upload Certificate or Marksheet"}
                  </span>
                  <span className="mt-1 text-[11px] text-[#765F5D]">
                    PDF, DOCX, or PNG up to 5 MB
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.docx,.doc,.png,.jpg"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>

                {documents.length > 0 && (
                  <div className="divide-y divide-[#EBDDD1]/50 pt-2">
                    {documents.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-2 text-xs">
                        <span className="truncate max-w-[180px] font-medium text-stone-800">
                          {doc.originalFileName}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            className="text-[#7A0F1F] hover:underline font-semibold"
                          >
                            <Download size={13} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="text-stone-400 hover:text-rose-600"
                            title="Delete document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </section>
        </div>

        {/* ============================================================
            8. ALL TOOLS OVERVIEW (Grouped by Purpose + Coming Soon items)
        ============================================================ */}
        <section aria-label="All Tools Overview" className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#EBDDD1] pb-3">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[#2B1B1B]">
                All CareerEdge Tools &amp; Workspaces
              </h2>
              <p className="mt-0.5 text-xs text-[#765F5D]">
                Complete suite of multi-domain tools for Karnataka students.
              </p>
            </div>
          </div>

          {/* Group 1: Available Tools */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableFeatures.map((feat) => {
              const Icon =
                feat.iconName === "Fingerprint"
                  ? Fingerprint
                  : feat.iconName === "FileText"
                    ? FileText
                    : feat.iconName === "ShieldCheck"
                      ? ShieldCheck
                      : feat.iconName === "CheckCheck"
                        ? CheckCheck
                        : feat.iconName === "Network"
                          ? Network
                          : feat.iconName === "BriefcaseBusiness"
                            ? BriefcaseBusiness
                            : feat.iconName === "ClipboardList"
                              ? ClipboardList
                              : feat.iconName === "Compass"
                                ? Compass
                                : feat.iconName === "Zap"
                                  ? Zap
                                  : feat.iconName === "HelpCircle"
                                    ? HelpCircle
                                    : feat.iconName === "Clock"
                                      ? Clock
                                      : feat.iconName === "TrendingUp"
                                        ? TrendingUp
                                        : Sparkles;

              return (
                <Link
                  key={feat.id}
                  href={feat.route}
                  className="group flex flex-col justify-between rounded-2xl border border-[#EBDDD1] bg-white p-5 transition-all hover:border-[#7A0F1F] hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9ED] text-[#7A0F1F] border border-[#EBDDD1] group-hover:scale-105 transition-transform">
                        <Icon size={19} aria-hidden="true" />
                      </div>
                      {feat.badgeLabel && (
                        <span className="rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          {feat.badgeLabel}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-heading text-sm font-bold text-[#2B1B1B] group-hover:text-[#7A0F1F] transition-colors">
                        {feat.name}
                      </h3>
                      <p className="mt-1 text-xs text-[#765F5D] leading-relaxed">
                        {feat.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EBDDD1]/60 mt-4 flex items-center justify-between text-xs font-bold text-[#7A0F1F]">
                    <span>Open Workspace</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Group 2: Coming Soon Items (Visually separated from available tools) */}
          <div className="pt-6 border-t border-dashed border-stone-300 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#7A0F1F]" aria-hidden="true" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#4C0915]">
                Upcoming Tools In Development
              </h3>
            </div>
            <p className="text-xs text-[#765F5D]">
              These features are currently in engineering and design. We never present fake or mock data.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              {comingSoonFeatures.map((feat) => (
                <ComingSoonCard key={feat.id} feature={feat} />
              ))}
            </div>
          </div>
        </section>

        {/* Guidance section */}
        <section aria-label="How CareerEdge Works">
          <HowItWorksPanel sectionId="career-passport" />
        </section>
      </div>
    </StudentLayout>
  );
}
