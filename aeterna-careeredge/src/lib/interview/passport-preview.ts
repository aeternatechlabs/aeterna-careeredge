// src/lib/interview/passport-preview.ts
// Dedicated Interview Prep Career Passport Preview Adapter (Phase 1.1)
// Safely loads partial or complete Career Passport data without requiring student_profiles,
// preserves provenance, never invents data, and never converts DB errors into EMPTY.

import { db } from "@/lib/db";
import type {
  InterviewPassportPreviewResult,
  PassportContextPreview,
  PassportPreviewCounts,
} from "./types";

function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

const ZERO_COUNTS: PassportPreviewCounts = {
  educations: 0,
  skills: 0,
  projects: 0,
  experiences: 0,
  achievements: 0,
  certifications: 0,
};

export interface PassportPreviewDbClient {
  user: {
    findUnique: (args: {
      where: { id: string };
      include: Record<string, boolean>;
    }) => Promise<Record<string, unknown> | null>;
  };
}

/**
 * Load an authenticated student's Career Passport preview for Interview Prep.
 * Works even when `student_profiles` is missing by reading related Passport tables directly.
 */
export async function getInterviewPassportPreview(
  userId: string,
  dbClient: PassportPreviewDbClient = db as unknown as PassportPreviewDbClient
): Promise<InterviewPassportPreviewResult> {
  if (!userId || typeof userId !== "string") {
    return {
      status: "ERROR",
      data: null,
      counts: { ...ZERO_COUNTS },
      availableSections: [],
      missingSections: [],
      errorMessage: "Invalid user session for Career Passport preview.",
    };
  }

  try {
    const user = await dbClient.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        educations: true,
        skills: true,
        projects: true,
        experiences: true,
        achievements: true,
        certifications: true,
      },
    });

    if (!user) {
      return {
        status: "ERROR",
        data: null,
        counts: { ...ZERO_COUNTS },
        availableSections: [],
        missingSections: [],
        errorMessage: "Could not locate your account record to load Career Passport.",
      };
    }

    const asRows = (val: unknown): Array<Record<string, unknown>> =>
      Array.isArray(val) ? (val.filter((r) => r && typeof r === "object") as Array<Record<string, unknown>>) : [];

    const profile =
      user.profile && typeof user.profile === "object"
        ? (user.profile as Record<string, unknown>)
        : null;
    const rawEducations = asRows(user.educations);
    const rawSkills = asRows(user.skills);
    const rawProjects = asRows(user.projects);
    const rawExperiences = asRows(user.experiences);
    const rawAchievements = asRows(user.achievements);
    const rawCertifications = asRows(user.certifications);

    // Collect skills from normalized table, falling back to profile.skills JSON if normalized is empty
    const skillSet = new Set<string>();
    for (const s of rawSkills) {
      if (typeof s.name === "string" && s.name.trim()) {
        skillSet.add(s.name.trim());
      }
    }
    if (skillSet.size === 0 && typeof profile?.skills === "string") {
      for (const s of parseStringArray(profile.skills)) {
        skillSet.add(s.trim());
      }
    }
    const skills = Array.from(skillSet);

    const educations = rawEducations.map((e) => ({
      level: typeof e.level === "string" ? e.level : null,
      degree: typeof e.degree === "string" ? e.degree : null,
      institution: typeof e.institution === "string" ? e.institution : null,
      fieldOfStudy: typeof e.fieldOfStudy === "string" ? e.fieldOfStudy : null,
      origin: typeof e.dataOrigin === "string" ? e.dataOrigin : "STUDENT_INPUT",
      isVerified: Boolean(e.isVerified),
    }));

    const projects = rawProjects
      .filter((p) => typeof p.title === "string" && p.title.trim().length > 0)
      .map((p) => ({
        title: String(p.title).trim(),
        role: typeof p.role === "string" ? p.role : null,
        technologies: parseStringArray(
          typeof p.toolsOrTechnologies === "string"
            ? p.toolsOrTechnologies
            : typeof p.techStack === "string"
            ? p.techStack
            : null
        ),
        origin: typeof p.dataOrigin === "string" ? p.dataOrigin : "STUDENT_INPUT",
        isVerified: Boolean(p.isVerified),
      }));

    const experiences = rawExperiences
      .filter(
        (exp) =>
          (typeof exp.companyName === "string" && exp.companyName.trim().length > 0) ||
          (typeof exp.jobTitle === "string" && exp.jobTitle.trim().length > 0)
      )
      .map((exp) => ({
        companyName: typeof exp.companyName === "string" ? exp.companyName.trim() : "",
        jobTitle: typeof exp.jobTitle === "string" ? exp.jobTitle.trim() : "",
        experienceType: typeof exp.experienceType === "string" ? exp.experienceType : null,
        origin: typeof exp.dataOrigin === "string" ? exp.dataOrigin : "STUDENT_INPUT",
        isVerified: Boolean(exp.isVerified),
      }));

    const achievements: string[] = rawAchievements
      .map((a) => (typeof a.title === "string" ? a.title.trim() : ""))
      .filter(Boolean);

    const certTitles: string[] = rawCertifications
      .map((c) =>
        [
          typeof c.title === "string" ? c.title : null,
          typeof c.issuingOrganization === "string" ? c.issuingOrganization : null,
        ]
          .filter(Boolean)
          .join(" — ")
      )
      .filter(Boolean);
    const certificationsText =
      certTitles.length > 0
        ? certTitles.join("\n")
        : typeof profile?.certifications === "string" && profile.certifications.trim()
        ? profile.certifications.trim()
        : null;

    const hasProfileEducation = Boolean(
      profile?.educationLevel || profile?.course || profile?.institution
    );
    const hasEducation = educations.length > 0 || hasProfileEducation;

    const counts: PassportPreviewCounts = {
      educations: educations.length > 0 ? educations.length : hasProfileEducation ? 1 : 0,
      skills: skills.length,
      projects: projects.length,
      experiences: experiences.length,
      achievements: achievements.length,
      certifications: certTitles.length > 0 ? certTitles.length : certificationsText ? 1 : 0,
    };

    const availableSections: string[] = [];
    const missingSections: string[] = [];

    if (hasEducation) availableSections.push("Education");
    else missingSections.push("Education");

    if (counts.skills > 0) availableSections.push("Skills");
    else missingSections.push("Skills");

    if (counts.projects > 0) availableSections.push("Projects");
    else missingSections.push("Projects");

    if (counts.experiences > 0) availableSections.push("Experience");
    else missingSections.push("Experience");

    if (counts.achievements > 0) availableSections.push("Achievements");
    else missingSections.push("Achievements");

    if (counts.certifications > 0) availableSections.push("Certifications");
    else missingSections.push("Certifications");

    const totalItems =
      counts.educations +
      counts.skills +
      counts.projects +
      counts.experiences +
      counts.achievements +
      counts.certifications;

    if (totalItems === 0 && !profile?.academicDomain && !profile?.preferredJobRole) {
      return {
        status: "EMPTY",
        data: null,
        counts,
        availableSections,
        missingSections,
      };
    }

    const previewData: PassportContextPreview = {
      academicDomain: typeof profile?.academicDomain === "string" ? profile.academicDomain : null,
      specialization: typeof profile?.specialization === "string" ? profile.specialization : null,
      educationLevel:
        typeof profile?.educationLevel === "string"
          ? profile.educationLevel
          : educations[0]?.level ?? null,
      institution:
        typeof profile?.institution === "string"
          ? profile.institution
          : educations[0]?.institution ?? null,
      course:
        typeof profile?.course === "string"
          ? profile.course
          : educations[0]?.degree ?? null,
      graduationYear: typeof profile?.graduationYear === "number" ? profile.graduationYear : null,
      preferredJobRole: typeof profile?.preferredJobRole === "string" ? profile.preferredJobRole : null,
      skills,
      educations,
      projects,
      experiences,
      achievements,
      certifications: certificationsText,
    };

    const isComplete =
      Boolean(profile) &&
      hasEducation &&
      counts.skills > 0 &&
      (counts.projects > 0 || counts.experiences > 0);

    return {
      status: isComplete ? "COMPLETE" : "PARTIAL",
      data: previewData,
      counts,
      availableSections,
      missingSections,
    };
  } catch (error) {
    console.error("[getInterviewPassportPreview] Database error:", error);
    return {
      status: "ERROR",
      data: null,
      counts: { ...ZERO_COUNTS },
      availableSections: [],
      missingSections: [],
      errorMessage:
        "Unable to load your Career Passport right now. You can still continue without it.",
    };
  }
}
