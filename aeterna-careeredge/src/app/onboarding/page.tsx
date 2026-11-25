"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Save, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/common/BrandLogo";
import { FieldError, fadeUp } from "@/features/form/form-controls";
import { StepProgress } from "@/features/onboarding/components/step-progress";
import {
  StepPersonalEducation,
  StepSkillsProjects,
  StepExperienceAchievements,
  StepGoals,
  StepReview,
  type StepErrors,
} from "@/features/onboarding/components/steps";
import {
  ONBOARDING_STEPS,
  INDIAN_STATES,
  EDUCATION_LEVELS,
  type OnboardingData,
  type OnboardingProject,
} from "@/types/onboarding";
import { UploadResumeButton } from "@/components/resume/upload-resume-button";
import type { ParsedResumePayload } from "@/lib/resume/parser";

/* --------------------------------- Animation -------------------------------- */

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
  exit: (dir: number) => ({
    x: dir < 0 ? 60 : -60,
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  }),
};

const arrowRight: Variants = { rest: { x: 0 }, hover: { x: 4 } };
const arrowLeft: Variants = { rest: { x: 0 }, hover: { x: -4 } };
const spring = { type: "spring", stiffness: 300, damping: 20 } as const;

/* ------------------------------- Initial state ------------------------------ */

const INITIAL_DATA: OnboardingData = {
  name: "",
  email: "",
  mobile: "",
  city: "",
  state: "",
  academicDomain: "",
  educationLevel: "",
  institution: "",
  course: "",
  specialization: "",
  graduationYear: "",
  gradingType: "",
  gradeValue: "",
  skills: [],
  projects: [],
  experience: "",
  certifications: "",
  achievements: "",
  careerInterests: [],
  preferredJobRole: "",
  targetIndustry: "",
  higherEducationGoal: "",
  shortTermGoal: "",
  longTermGoal: "",
  studyAbroadCountries: [],
};

/* ---------------------------------- Validation ------------------------------- */

/** Required fields per step for multi-domain students. */
function validateStep(step: number, d: OnboardingData): StepErrors {
  const e: StepErrors = {};

  if (step === 0) {
    if (!d.name.trim()) e.name = "Please enter your full name.";
    if (!d.city.trim()) e.city = "Please enter your city.";
    if (!d.state) e.state = "Please select your state or UT.";
    if (!d.academicDomain)
      e.academicDomain = "Please select your academic or professional domain.";
    if (!d.educationLevel)
      e.educationLevel = "Please select your education qualification level.";
    if (!d.institution.trim())
      e.institution = "Please enter your college or institution.";
    if (!d.course.trim())
      e.course = "Please enter your course or degree program.";
    if (!d.graduationYear)
      e.graduationYear = "Please select your graduation year.";
  }

  if (step === 3) {
    if (!d.preferredJobRole.trim())
      e.preferredJobRole = "Please enter the profession or role you are aiming for.";
    if (d.careerInterests.length === 0)
      e.careerInterests = "Choose at least one career interest area.";
  }

  return e;
}

/* ---------------------------------- Helpers ---------------------------------- */

function parseJsonArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseProjects(val: unknown): OnboardingProject[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item, idx) => {
      if (typeof item === "string") {
        return {
          id: `proj_${idx}`,
          title: item,
          description: "",
          technologies: "",
          url: "",
        };
      }
      return {
        id: item.id || `proj_${idx}`,
        title: item.title || "",
        role: item.role || "",
        description: item.description || "",
        technologies: item.technologies || item.techStack || "",
        url: item.url || item.projectUrl || "",
      };
    });
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parseProjects(parsed);
        }
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: "proj_0",
        title: "Academic / Practical Project",
        description: trimmed,
        technologies: "",
        url: "",
      },
    ];
  }
  return [];
}

function cleanMobile(raw?: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits.slice(-10);
}

function extractCity(location?: string): string {
  if (!location) return "";
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts[0] : "";
}

function extractState(location?: string): string {
  if (!location) return "";
  const lower = location.toLowerCase();
  for (const st of INDIAN_STATES) {
    if (lower.includes(st.toLowerCase())) {
      return st;
    }
  }
  if (lower.includes("bengaluru") || lower.includes("bangalore") || lower.includes("mysuru") || lower.includes("mangalore")) return "Karnataka";
  if (lower.includes("mumbai") || lower.includes("pune") || lower.includes("nagpur")) return "Maharashtra";
  if (lower.includes("noida")) return "Uttar Pradesh";
  if (lower.includes("gurgaon") || lower.includes("gurugram")) return "Haryana";
  if (lower.includes("delhi")) return "Delhi";
  if (lower.includes("hyderabad")) return "Telangana";
  if (lower.includes("chennai") || lower.includes("coimbatore")) return "Tamil Nadu";
  if (lower.includes("kolkata")) return "West Bengal";
  if (lower.includes("ahmedabad")) return "Gujarat";
  if (lower.includes("jaipur")) return "Rajasthan";
  if (lower.includes("kochi") || lower.includes("trivandrum")) return "Kerala";
  return "";
}

function inferEducationLevel(degree?: string): string {
  if (!degree) return "";
  const d = degree.toLowerCase();
  if (/\b(?:b\.?tech|b\.?e\.?|bachelor of technology|bachelor of engineering)\b/i.test(d)) return "BE / B.Tech";
  if (/\b(?:m\.?tech|m\.?e\.?|master of technology|master of engineering)\b/i.test(d)) return "ME / M.Tech";
  if (/\b(?:bca|bachelor of computer applications)\b/i.test(d)) return "BCA";
  if (/\b(?:mca|master of computer applications)\b/i.test(d)) return "MCA";
  if (/\b(?:b\.?sc|bsc|bachelor of science)\b/i.test(d)) return "B.Sc / B.Sc (Hons)";
  if (/\b(?:m\.?sc|msc|master of science)\b/i.test(d)) return "M.Sc";
  if (/\b(?:b\.?com|bcom|bachelor of commerce)\b/i.test(d)) return "B.Com / B.Com (Hons)";
  if (/\b(?:m\.?com|mcom|master of commerce)\b/i.test(d)) return "M.Com";
  if (/\b(?:bba|bbm)\b/i.test(d)) return "BBA / BBM";
  if (/\b(?:mba|pgdm|master of business)\b/i.test(d)) return "MBA / PGDM";
  if (/\b(?:b\.?des|b\.?arch|architecture)\b/i.test(d)) return "B.Des / B.Arch";
  if (/\b(?:mbbs|bds)\b/i.test(d)) return "MBBS / BDS";
  if (/\b(?:pharm|pharmacy)\b/i.test(d)) return "B.Pharm / D.Pharm";
  if (/\b(?:nursing)\b/i.test(d)) return "B.Sc Nursing";
  if (/\b(?:llb|law)\b/i.test(d)) return "BA LLB / BBA LLB / LLB";
  if (/\b(?:phd|doctorate|doctoral)\b/i.test(d)) return "PhD / Doctoral";
  if (/\b(?:diploma)\b/i.test(d)) return "Diploma";
  if (/\b(?:master|postgraduate|pg)\b/i.test(d)) return "Postgraduate (PG / Master's)";
  if (/\b(?:bachelor|undergraduate|ug)\b/i.test(d)) return "Undergraduate (UG / Bachelor's)";
  return "";
}

function inferAcademicDomain(parsed: ParsedResumePayload): string {
  const edu = parsed.education?.[0];
  const combined = [
    edu?.degree || "",
    edu?.branch || "",
    ...(parsed.skills || []).map((s) => s.name),
    ...(parsed.experience || []).map((e) => e.title),
  ].join(" ").toLowerCase();

  if (/\b(computer|software|developer|programming|web|frontend|backend|fullstack|react|python|java|javascript|data science|machine learning|ai|cloud|cyber|it|information technology|bca|mca)\b/i.test(combined)) {
    return "Computer Science and IT";
  }
  if (/\b(mechanical|civil|electrical|electronics|circuit|autocad|vlsi|robotics|aerospace|chemical)\b/i.test(combined)) {
    return "Engineering and Technology";
  }
  if (/\b(commerce|accounting|accountant|audit|tax|gst|tally|finance|banking|b\.?com|m\.?com|ca)\b/i.test(combined)) {
    return "Commerce, Accounting and Finance";
  }
  if (/\b(mba|bba|management|business administration|marketing|human resources|sales|strategy)\b/i.test(combined)) {
    return "Business and Management";
  }
  if (/\b(mbbs|doctor|medicine|clinical|hospital|patient|surgery)\b/i.test(combined)) {
    return "Healthcare and Medical Sciences";
  }
  if (/\b(nursing|pharmacy|b\.?pharm|allied health)\b/i.test(combined)) {
    return "Pharmacy, Nursing and Allied Health";
  }
  if (/\b(law|llb|advocate|legal|court|judiciary|attorney)\b/i.test(combined)) {
    return "Law and Legal Studies";
  }
  if (/\b(architecture|interior design|graphic design|ui\/ux|creative)\b/i.test(combined)) {
    return "Design, Architecture and Creative Industries";
  }
  return "Computer Science and IT";
}

function extractGraduationYear(endYear?: string): string {
  if (!endYear) return "";
  const match = endYear.match(/\b(20\d\d)\b/);
  return match ? match[1] : "";
}

function inferGradingType(score?: string): string {
  if (!score) return "";
  const s = score.toLowerCase();
  if (s.includes("cgpa") || /^\d+(\.\d+)?(\s*\/\s*10)?$/.test(s.trim())) {
    return "CGPA (10-point Scale)";
  }
  if (s.includes("%") || s.includes("percent")) {
    return "Percentage (%)";
  }
  if (s.includes("distinction") || s.includes("first class")) {
    return "First Class with Distinction";
  }
  return "CGPA (10-point Scale)";
}

/* ------------------------------------ Page ----------------------------------- */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingAndExiting, setSavingAndExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [fromDashboard, setFromDashboard] = useState(false);
  const [autofillSuccessMessage, setAutofillSuccessMessage] = useState<string | null>(null);

  const handleAutofillResume = (parsed: ParsedResumePayload) => {
    if (!parsed) return;

    const edu = parsed.education?.[0];
    const city = extractCity(parsed.contactInfo?.location);
    const state = extractState(parsed.contactInfo?.location);
    const domain = inferAcademicDomain(parsed);
    const level = inferEducationLevel(edu?.degree);
    const gradYear = extractGraduationYear(edu?.endYear);
    const gradingType = inferGradingType(edu?.score);

    let extractedSkills: string[] = [];
    if (Array.isArray(parsed.skills)) {
      extractedSkills = parsed.skills
        .map((s: any) => (typeof s === "string" ? s : s?.name || s?.skill || "")?.trim())
        .filter(Boolean);
    }
    // If skills are still empty, harvest from project subtitles
    if (extractedSkills.length === 0 && Array.isArray(parsed.projects)) {
      for (const p of parsed.projects) {
        if (p.subtitle) {
          p.subtitle
            .split(/[,|•/]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 1 && s.length < 35)
            .forEach((s) => extractedSkills.push(s));
        }
      }
      extractedSkills = Array.from(new Set(extractedSkills));
    }

    const extractedProjects: OnboardingProject[] = Array.isArray(parsed.projects)
      ? parsed.projects.map((p, idx) => ({
          id: `proj_${Date.now()}_${idx}`,
          title: p.title || `Project ${idx + 1}`,
          role: p.subtitle || "",
          description:
            Array.isArray(p.bullets) && p.bullets.length > 0
              ? p.bullets.join("\n")
              : p.subtitle || "",
          technologies:
            Array.isArray(p.techStack) && p.techStack.length > 0
              ? p.techStack.join(", ")
              : p.subtitle || "",
          url: p.url || "",
        }))
      : [];

    const experienceText = Array.isArray(parsed.experience)
      ? parsed.experience
          .map((exp) => {
            const dates = [
              exp.startDate,
              exp.endDate || (exp.isCurrent ? "Present" : ""),
            ]
              .filter(Boolean)
              .join(" - ");
            const header = [exp.title, exp.company].filter(Boolean).join(" at ");
            const meta = [header, dates, exp.location].filter(Boolean).join(" | ");
            const bullets = Array.isArray(exp.bullets)
              ? exp.bullets.map((b) => `• ${b}`).join("\n")
              : "";
            return [meta, bullets].filter(Boolean).join("\n");
          })
          .filter(Boolean)
          .join("\n\n")
      : "";

    const certificationsText = Array.isArray(parsed.certifications)
      ? parsed.certifications
          .map((cert) =>
            [cert.title, cert.issuer, cert.year].filter(Boolean).join(" - ")
          )
          .filter(Boolean)
          .join("\n")
      : "";

    const preferredRole =
      parsed.experience?.[0]?.title ||
      (parsed.projects?.[0]?.title ? `${parsed.projects[0].title} Specialist` : "");

    const inferredInterests: string[] = [];
    if (domain === "Computer Science and IT") {
      inferredInterests.push("Software & Information Technology");
      inferredInterests.push("Engineering & Technology");
    } else if (domain === "Engineering and Technology") {
      inferredInterests.push("Engineering & Technology");
    } else if (domain === "Commerce, Accounting and Finance") {
      inferredInterests.push("Finance, Banking & Accounting");
    } else if (domain === "Business and Management") {
      inferredInterests.push("Business & General Management");
      inferredInterests.push("Marketing, Brand & Sales");
    } else if (domain === "Healthcare and Medical Sciences") {
      inferredInterests.push("Healthcare, Medicine & Nursing");
    } else if (domain === "Law and Legal Studies") {
      inferredInterests.push("Legal Practice & Judiciary");
    } else if (domain === "Design, Architecture and Creative Industries") {
      inferredInterests.push("Design, Creative & Architecture");
    }

    setData((prev) => {
      const updatedSkills = Array.from(
        new Set([...prev.skills, ...extractedSkills])
      );
      const updatedProjects =
        extractedProjects.length > 0 ? extractedProjects : prev.projects;
      const updatedInterests = Array.from(
        new Set([...prev.careerInterests, ...inferredInterests])
      );

      return {
        ...prev,
        name: parsed.contactInfo?.name?.trim() || prev.name,
        email: parsed.contactInfo?.email?.trim() || prev.email,
        mobile: parsed.contactInfo?.phone
          ? cleanMobile(parsed.contactInfo.phone) || prev.mobile
          : prev.mobile,
        city: city || prev.city,
        state: state || prev.state,
        academicDomain: domain || prev.academicDomain,
        educationLevel: level || prev.educationLevel,
        institution: edu?.institution || prev.institution,
        course: edu?.degree || prev.course,
        specialization: edu?.branch || prev.specialization,
        graduationYear: gradYear || prev.graduationYear,
        gradingType: gradingType || prev.gradingType,
        gradeValue: edu?.score || prev.gradeValue,
        skills: updatedSkills,
        projects: updatedProjects,
        experience: experienceText || prev.experience,
        certifications: certificationsText || prev.certifications,
        preferredJobRole: preferredRole || prev.preferredJobRole,
        careerInterests:
          updatedInterests.length > 0 ? updatedInterests : prev.careerInterests,
      };
    });

    setErrors({});
    const counts: string[] = [];
    if (parsed.contactInfo?.name) counts.push("Name");
    if (edu?.institution || edu?.degree) counts.push("Education");
    if (extractedSkills.length > 0) counts.push(`${extractedSkills.length} Skills`);
    if (extractedProjects.length > 0) counts.push(`${extractedProjects.length} Projects`);
    if (parsed.experience && parsed.experience.length > 0) counts.push(`${parsed.experience.length} Roles`);

    setAutofillSuccessMessage(
      `Extracted and populated: ${counts.join(", ") || "Profile Details"}. You can review and adjust any field below.`
    );
  };

  useEffect(() => {
    async function loadCurrentStudent() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          window.location.href = "/login?next=/onboarding";
          return;
        }
        if (
          typeof window !== "undefined" &&
          window.location.search.includes("from=dashboard")
        ) {
          setFromDashboard(true);
        }
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            if (json.user.onboardingCompleted) {
              setIsOnboarded(true);
            }
            const p = json.user.profile;
            setData((prev) => ({
              ...prev,
              name: prev.name || json.user.name || "",
              email: prev.email || json.user.email || "",
              mobile:
                prev.mobile ||
                (json.user.mobile
                  ? json.user.mobile.replace(/^\+91/, "").replace(/\s/g, "")
                  : ""),
              city: prev.city || p?.city || "",
              state: prev.state || p?.state || "",
              academicDomain: prev.academicDomain || p?.academicDomain || "",
              specialization: prev.specialization || p?.specialization || "",
              educationLevel: prev.educationLevel || p?.educationLevel || "",
              institution: prev.institution || p?.institution || "",
              course: prev.course || p?.course || "",
              graduationYear:
                prev.graduationYear ||
                (p?.graduationYear != null ? String(p.graduationYear) : ""),
              gradingType: prev.gradingType || p?.gradingType || "",
              gradeValue: prev.gradeValue || p?.gradeValue || "",
              skills:
                prev.skills.length > 0
                  ? prev.skills
                  : p?.skills
                    ? parseJsonArray(p.skills)
                    : [],
              projects: prev.projects.length > 0 ? prev.projects : parseProjects(p?.projects),
              experience: prev.experience || p?.experience || "",
              certifications: prev.certifications || p?.certifications || "",
              achievements: prev.achievements || p?.achievements || "",
              careerInterests:
                prev.careerInterests.length > 0
                  ? prev.careerInterests
                  : p?.careerInterests
                    ? parseJsonArray(p.careerInterests)
                    : [],
              preferredJobRole:
                prev.preferredJobRole || p?.preferredJobRole || "",
              targetIndustry: prev.targetIndustry || p?.targetIndustry || "",
              higherEducationGoal:
                prev.higherEducationGoal || p?.higherEducationGoal || "",
              shortTermGoal: prev.shortTermGoal || p?.shortTermGoal || "",
              longTermGoal: prev.longTermGoal || p?.longTermGoal || "",
              studyAbroadCountries:
                prev.studyAbroadCountries.length > 0
                  ? prev.studyAbroadCountries
                  : p?.studyAbroadCountries
                    ? parseJsonArray(p.studyAbroadCountries)
                    : [],
            }));
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadCurrentStudent();
  }, []);

  const totalSteps = ONBOARDING_STEPS.length;
  const isLastStep = step === totalSteps - 1;
  const percent = Math.round(((step + 1) / totalSteps) * 100);

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
    // Clear the error of any field that was just edited
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => {
        delete next[key as keyof OnboardingData];
      });
      return next;
    });
  }

  function goTo(target: number) {
    setDirection(target > step ? 1 : -1);
    setStep(target);
    setErrors({});
    setError(null);
  }

  function next() {
    const stepErrors = validateStep(step, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    goTo(step + 1);
  }

  function prev() {
    if (step > 0) goTo(step - 1);
  }

  async function saveAndExit() {
    setSavingAndExiting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, partialSave: true }),
      });
      const resData = (await res.json().catch(() => ({}))) as {
        user?: { onboardingCompleted?: boolean };
      };

      // If user has already completed onboarding or came from the dashboard, return them to the dashboard
      if (isOnboarded || fromDashboard || resData?.user?.onboardingCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("Could not save progress. Please try again.");
    } finally {
      setSavingAndExiting(false);
    }
  }

  async function handleSubmit() {
    // Re-check every step, and jump to the first one with a problem
    for (let s = 0; s < totalSteps - 1; s++) {
      const stepErrors = validateStep(s, data);
      if (Object.keys(stepErrors).length > 0) {
        goTo(s);
        setErrors(stepErrors);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(
          json.error ?? "Could not save your profile. Please try again.",
        );
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------------- Render --------------------------------- */

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-screen bg-[#FFF8F6]">
        {/* Soft background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(246,181,28,0.10),transparent_50%)]"
        />

        {/* Header */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-[#5C0914] via-[#7A0F1F] to-[#9A1B2E] shadow-lg shadow-black/20">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#F6B51C] to-transparent"
          />
          <div className="mx-auto flex h-20 max-w-3xl items-center justify-between gap-1.5 sm:gap-4 px-2 sm:px-8 min-w-0 w-full">
            <BrandLogo
              tone="dark"
              href={isOnboarded || fromDashboard ? "/dashboard" : "/"}
            />

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {(isOnboarded || fromDashboard) && (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={saveAndExit}
                disabled={savingAndExiting || submitting}
                className="inline-flex items-center gap-1 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-[#F6B51C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B51C] disabled:opacity-50"
              >
                <Save size={13} aria-hidden="true" />
                <span>{savingAndExiting ? "Saving…" : "Save & Exit"}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-3 sm:px-8 pb-16 pt-6 sm:pt-10 min-w-0 w-full">
          {/* Edit Mode Notice Banner */}
          {(isOnboarded || fromDashboard) && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#FFF9ED] to-[#FFF3DC] border border-[#F2B63D]/60 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2B63D] text-[#4C0915] font-bold shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#4C0915]">
                    Profile Editing Mode
                  </p>
                  <p className="text-[11px] text-[#7A0F1F]">
                    Click any step above to update academic details, skills, or target roles, then save directly back to your dashboard.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={saveAndExit}
                disabled={savingAndExiting}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#4C0915] shadow-xs transition shrink-0"
              >
                <Save size={13} />
                <span>{savingAndExiting ? "Saving…" : "Save & Return"}</span>
              </button>
            </div>
          )}

          {/* Heading and progress */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-8"
          >
            <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-[#7A0F1F]">
              <span>
                Step {step + 1} of {totalSteps}
              </span>
              <span className="text-[#9A8580]">{percent}% complete</span>
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#2B1B1B] sm:text-4xl">
              Set Up Your Career Passport
            </h1>

            <div className="mt-8">
              <StepProgress
                steps={ONBOARDING_STEPS}
                current={step}
                onSelect={goTo}
                allowAllJumps={isOnboarded || fromDashboard}
              />
            </div>
          </motion.div>

          {/* Autofill Notification Banner */}
          {autofillSuccessMessage && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Profile Auto-Filled from Resume!
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    {autofillSuccessMessage}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutofillSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-100/80 transition"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Quick Resume Upload Option */}
          {step === 0 && (
            <div className="mb-6">
              <UploadResumeButton
                variant="banner"
                mode="onboarding"
                label="Already have a resume? Upload it to fill your Career Passport faster."
                sublabel="We automatically extract your degrees, experience, and skills into your profile."
                onAutofill={handleAutofillResume}
                onSuccess={({ parsedData }) => {
                  if (parsedData) handleAutofillResume(parsedData);
                }}
              />
            </div>
          )}

          {/* Step card */}
          <div className="relative min-h-[460px] overflow-hidden rounded-3xl border border-[#EBDDD1] bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#7A0F1F] via-[#F6B51C] to-[#7A0F1F]"
            />

            <AnimatePresence custom={direction} mode="wait" initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {step === 0 && (
                  <StepPersonalEducation
                    data={data}
                    update={update}
                    errors={errors}
                  />
                )}
                {step === 1 && (
                  <StepSkillsProjects
                    data={data}
                    update={update}
                    errors={errors}
                  />
                )}
                {step === 2 && (
                  <StepExperienceAchievements
                    data={data}
                    update={update}
                    errors={errors}
                  />
                )}
                {step === 3 && (
                  <StepGoals data={data} update={update} errors={errors} />
                )}
                {step === 4 && <StepReview data={data} onEdit={goTo} />}
              </motion.div>
            </AnimatePresence>

            <FieldError id="onboarding-error" message={error} />
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <motion.div
              initial="rest"
              whileHover={step === 0 ? undefined : "hover"}
              whileTap={step === 0 ? undefined : { scale: 0.98 }}
              transition={spring}
            >
              <Button
                type="button"
                variant="outline"
                onClick={prev}
                disabled={step === 0}
                className="h-12 gap-2 rounded-xl px-5"
              >
                <motion.span variants={arrowLeft} className="inline-flex">
                  <ArrowLeft size={16} aria-hidden="true" />
                </motion.span>
                Previous
              </Button>
            </motion.div>

            <motion.div
              initial="rest"
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              transition={spring}
            >
              {isLastStep ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={submitting}
                  className="h-12 gap-2 rounded-xl bg-[#7A0F1F] px-6 text-white shadow-md shadow-[#7A0F1F]/20 hover:bg-[#4C0915]"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {submitting ? "Saving…" : "Complete & Go to Dashboard"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={next}
                  className="h-12 gap-2 rounded-xl bg-[#7A0F1F] px-6 text-white shadow-md shadow-[#7A0F1F]/20 hover:bg-[#4C0915]"
                >
                  Next
                  <motion.span variants={arrowRight} className="inline-flex">
                    <ArrowRight size={16} aria-hidden="true" />
                  </motion.span>
                </Button>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
