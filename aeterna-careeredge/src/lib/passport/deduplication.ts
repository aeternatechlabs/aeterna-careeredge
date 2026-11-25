// src/lib/passport/deduplication.ts
// Robust Career Passport Deduplication & Upsert Engine
// Prevents duplicate entries across resume imports, LinkedIn merges, and manual additions.

import { db } from "@/lib/db";
import { recalculateAndSavePassportScore } from "@/lib/passport/score";

// ── Text Normalization Helpers ────────────────────────────────────────────────

export function normalizeText(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    // normalize weird dashes and encoding artifacts
    .replace(/[–—â€“]/g, "-")
    // replace non-alphanumeric (keep &, +, #) with space
    .replace(/[^a-z0-9&+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if two strings are equivalent or one is a significant substring of the other
 */
export function isJunkProjectTitle(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length < 3) return true;
  if (/^[•\-\*–—â€¢▪◦✓]/.test(trimmed)) return true;
  if (/^[a-zA-Z]+\.$/.test(trimmed)) return true;
  if (/^(?:github\s*[:-]|https?:\/\/|www\.)/i.test(trimmed)) return true;
  if (/^[a-z]/.test(trimmed)) return true;
  return false;
}

export function isJunkExperience(title: string, company: string): boolean {
  const t = title.trim();
  const c = company.trim();
  if (/^[•\-\*–—â€¢▪◦✓]/.test(t) || /^[•\-\*–—â€¢▪◦✓]/.test(c)) return true;
  if (/^(?:reducing|building|engineering|developing|leading|collaborating|managing)\b/i.test(c)) return true;
  return false;
}

export function isGenericOrg(org?: string | null): boolean {
  const norm = normalizeText(org);
  return (
    !norm ||
    norm === "issuing organization" ||
    norm === "issuer" ||
    norm === "organization" ||
    norm === "n a"
  );
}

export function isFuzzyMatch(a?: string | null, b?: string | null): boolean {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Substring match with minimum length threshold
  const shorter = normA.length <= normB.length ? normA : normB;
  const longer = normA.length > normB.length ? normA : normB;

  if (shorter.length >= 4 && longer.includes(shorter)) {
    return true;
  }
  return false;
}

// ── Skill Normalization ───────────────────────────────────────────────────────

const SKILL_ALIASES: Record<string, string> = {
  "react js": "react",
  "react.js": "react",
  "reactjs": "react",
  "node js": "node",
  "node.js": "node",
  "nodejs": "node",
  "vue js": "vue",
  "vue.js": "vue",
  "vuejs": "vue",
  "next js": "next js",
  "next.js": "next js",
  "nextjs": "next js",
  "express js": "express",
  "express.js": "express",
  "expressjs": "express",
  "js": "javascript",
  "javascript es6+": "javascript",
  "javascript es6": "javascript",
  "ts": "typescript",
  "postgres": "postgresql",
  "mongo": "mongodb",
  "aws cloud": "aws",
  "amazon web services": "aws",
};

export function normalizeSkillName(name: string): string {
  const norm = normalizeText(name);
  return SKILL_ALIASES[norm] || norm;
}

// ── 1. Education Upsert & Deduplication ───────────────────────────────────────

export interface EducationInput {
  institution: string;
  degree?: string | null;
  level?: string | null;
  fieldOfStudy?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  scoreOrGrade?: string | null;
  isCurrent?: boolean;
  dataOrigin?: string;
  isVerified?: boolean;
}

export async function upsertEducationRecord(userId: string, input: EducationInput) {
  const normInst = normalizeText(input.institution);
  const normDeg = normalizeText(input.degree || input.level);

  // Find all user's education records
  const existingRecords = await db.educationRecord.findMany({
    where: { userId },
  });

  const match = existingRecords.find((rec) => {
    const existingInst = normalizeText(rec.institution);
    const existingDeg = normalizeText(rec.degree || rec.level);

    const instMatches = isFuzzyMatch(existingInst, normInst);
    const degMatches = !normDeg || !existingDeg || isFuzzyMatch(existingDeg, normDeg);
    const yearMatches =
      (!input.startYear || !rec.startYear || rec.startYear === input.startYear) &&
      (!input.endYear || !rec.endYear || rec.endYear === input.endYear);

    return instMatches && (degMatches || yearMatches);
  });

  if (match) {
    // Update existing record with any missing richer info
    return await db.educationRecord.update({
      where: { id: match.id },
      data: {
        institution: match.institution || input.institution,
        degree: match.degree || input.degree || input.level || "Degree",
        fieldOfStudy: match.fieldOfStudy || input.fieldOfStudy || undefined,
        startYear: match.startYear || input.startYear || undefined,
        endYear: match.endYear || input.endYear || undefined,
        scoreOrGrade: match.scoreOrGrade || input.scoreOrGrade || undefined,
        isVerified: match.isVerified || Boolean(input.isVerified),
        dataOrigin: match.dataOrigin === "VERIFIED_REFERENCE" ? match.dataOrigin : input.dataOrigin || match.dataOrigin,
      },
    });
  }

  // Create new
  return await db.educationRecord.create({
    data: {
      userId,
      institution: input.institution,
      degree: input.degree || input.level || "Degree",
      level: input.level || "UG",
      fieldOfStudy: input.fieldOfStudy || null,
      startYear: input.startYear || null,
      endYear: input.endYear || null,
      scoreOrGrade: input.scoreOrGrade || null,
      isCurrent: Boolean(input.isCurrent),
      dataOrigin: input.dataOrigin || "DOCUMENT_EXTRACTED",
      isVerified: Boolean(input.isVerified),
    },
  });
}

// ── 2. Experience Upsert & Deduplication ──────────────────────────────────────

export interface ExperienceInput {
  companyName: string;
  jobTitle: string;
  employmentType?: string | null;
  experienceType?: string | null;
  location?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isCurrent?: boolean;
  description?: string | null;
  dataOrigin?: string;
  isVerified?: boolean;
}

export async function upsertExperienceRecord(userId: string, input: ExperienceInput) {
  const normComp = normalizeText(input.companyName);
  const normTitle = normalizeText(input.jobTitle);

  const existingRecords = await db.studentExperience.findMany({
    where: { userId },
  });

  const match = existingRecords.find((rec) => {
    const existingComp = normalizeText(rec.companyName);
    const existingTitle = normalizeText(rec.jobTitle);

    const compMatches = isFuzzyMatch(existingComp, normComp);
    const titleMatches = isFuzzyMatch(existingTitle, normTitle);

    return compMatches && titleMatches;
  });

  if (match) {
    // Keep whichever description is longer/richer
    const bestDesc =
      (input.description && input.description.length > (match.description?.length || 0))
        ? input.description
        : match.description;

    return await db.studentExperience.update({
      where: { id: match.id },
      data: {
        description: bestDesc,
        location: match.location || input.location || undefined,
        startDate: match.startDate || input.startDate || undefined,
        endDate: match.endDate || input.endDate || undefined,
        isCurrent: match.isCurrent || Boolean(input.isCurrent),
        isVerified: match.isVerified || Boolean(input.isVerified),
        dataOrigin: match.dataOrigin === "VERIFIED_REFERENCE" ? match.dataOrigin : input.dataOrigin || match.dataOrigin,
      },
    });
  }

  return await db.studentExperience.create({
    data: {
      userId,
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      employmentType: input.employmentType || "INTERNSHIP",
      experienceType: input.experienceType || "INTERNSHIP",
      location: input.location || null,
      startDate: input.startDate || new Date(),
      endDate: input.endDate || null,
      isCurrent: Boolean(input.isCurrent),
      description: input.description || null,
      dataOrigin: input.dataOrigin || "DOCUMENT_EXTRACTED",
      isVerified: Boolean(input.isVerified),
    },
  });
}

// ── 3. Project Upsert & Deduplication ─────────────────────────────────────────

export interface ProjectInput {
  title: string;
  description?: string | null;
  role?: string | null;
  projectType?: string | null;
  toolsOrTechnologies?: string | null;
  projectUrl?: string | null;
  artifactUrl?: string | null;
  repositoryUrl?: string | null;
  dataOrigin?: string;
  isVerified?: boolean;
}

export async function upsertProjectRecord(userId: string, input: ProjectInput) {
  const normTitle = normalizeText(input.title);

  const existingRecords = await db.studentProject.findMany({
    where: { userId },
  });

  const match = existingRecords.find((rec) => {
    const existingTitle = normalizeText(rec.title);
    return isFuzzyMatch(existingTitle, normTitle);
  });

  if (match) {
    const bestDesc =
      (input.description && input.description.length > (match.description?.length || 0))
        ? input.description
        : match.description;

    const bestUrl = match.projectUrl || input.projectUrl || input.repositoryUrl || input.artifactUrl;

    return await db.studentProject.update({
      where: { id: match.id },
      data: {
        description: bestDesc || match.description,
        projectUrl: bestUrl || undefined,
        repositoryUrl: match.repositoryUrl || input.repositoryUrl || bestUrl || undefined,
        artifactUrl: match.artifactUrl || input.artifactUrl || bestUrl || undefined,
        toolsOrTechnologies: match.toolsOrTechnologies || input.toolsOrTechnologies || undefined,
        role: match.role || input.role || undefined,
        isVerified: match.isVerified || Boolean(input.isVerified),
        dataOrigin: match.dataOrigin === "VERIFIED_REFERENCE" ? match.dataOrigin : input.dataOrigin || match.dataOrigin,
      },
    });
  }

  const techString = input.toolsOrTechnologies || "";
  return await db.studentProject.create({
    data: {
      userId,
      title: input.title,
      description: input.description || "Project deliverable.",
      role: input.role || null,
      projectType: input.projectType || "PRACTICAL",
      toolsOrTechnologies: techString.trim() || null,
      techStack: techString
        ? JSON.stringify(techString.split(/[,+]/).map((t) => t.trim()).filter(Boolean))
        : null,
      projectUrl: input.projectUrl || input.repositoryUrl || null,
      repositoryUrl: input.repositoryUrl || input.projectUrl || null,
      artifactUrl: input.artifactUrl || null,
      dataOrigin: input.dataOrigin || "DOCUMENT_EXTRACTED",
      isVerified: Boolean(input.isVerified),
    },
  });
}

// ── 4. Skill Upsert & Deduplication ───────────────────────────────────────────

export interface SkillInput {
  name: string;
  category?: string | null;
  proficiencyLevel?: string | null;
  dataOrigin?: string;
  isVerified?: boolean;
}

export async function upsertSkillRecord(userId: string, input: SkillInput) {
  const norm = normalizeSkillName(input.name);
  if (!norm) return null;

  const existingRecords = await db.studentSkill.findMany({
    where: { userId },
  });

  const match = existingRecords.find((rec) => {
    return normalizeSkillName(rec.name) === norm;
  });

  if (match) {
    return match;
  }

  return await db.studentSkill.create({
    data: {
      userId,
      name: input.name.trim(),
      category: input.category || "TECHNICAL",
      proficiencyLevel: input.proficiencyLevel || "INTERMEDIATE",
      dataOrigin: input.dataOrigin || "DOCUMENT_EXTRACTED",
      isVerified: Boolean(input.isVerified),
    },
  });
}

// ── 5. Certification Upsert & Deduplication ───────────────────────────────────

export interface CertificationInput {
  title: string;
  issuingOrganization?: string | null;
  issueDate?: Date | null;
  credentialUrl?: string | null;
  dataOrigin?: string;
  isVerified?: boolean;
}

export async function upsertCertificationRecord(userId: string, input: CertificationInput) {
  const normTitle = normalizeText(input.title);
  const normOrg = normalizeText(input.issuingOrganization);

  const existingRecords = await db.certification.findMany({
    where: { userId },
  });

  const match = existingRecords.find((rec) => {
    const existingTitle = normalizeText(rec.title);
    const existingOrg = normalizeText(rec.issuingOrganization);

    const titleMatches = isFuzzyMatch(existingTitle, normTitle);
    const orgMatches =
      isGenericOrg(existingOrg) ||
      isGenericOrg(normOrg) ||
      isFuzzyMatch(existingOrg, normOrg);

    return titleMatches && orgMatches;
  });

  if (match) {
    const cleanOrg = !isGenericOrg(input.issuingOrganization)
      ? input.issuingOrganization
      : match.issuingOrganization;

    return await db.certification.update({
      where: { id: match.id },
      data: {
        issuingOrganization: cleanOrg || "Issuing Organization",
        issueDate: match.issueDate || input.issueDate || undefined,
        credentialUrl: match.credentialUrl || input.credentialUrl || undefined,
        isVerified: match.isVerified || Boolean(input.isVerified),
      },
    });
  }

  return await db.certification.create({
    data: {
      userId,
      title: input.title.trim(),
      issuingOrganization: input.issuingOrganization?.trim() || "Issuing Organization",
      issueDate: input.issueDate || new Date(),
      credentialUrl: input.credentialUrl || null,
      dataOrigin: input.dataOrigin || "DOCUMENT_EXTRACTED",
      isVerified: Boolean(input.isVerified),
    },
  });
}

// ── 6. Full User Passport Deduplication & Cleanup ─────────────────────────────

export interface DeduplicationSummary {
  educationsRemoved: number;
  experiencesRemoved: number;
  projectsRemoved: number;
  skillsRemoved: number;
  certificationsRemoved: number;
  totalRemoved: number;
  newPassportScore: number;
}

export async function deduplicateUserPassport(userId: string): Promise<DeduplicationSummary> {
  let educationsRemoved = 0;
  let experiencesRemoved = 0;
  let projectsRemoved = 0;
  let skillsRemoved = 0;
  let certificationsRemoved = 0;

  // 1. Educations Deduplication
  const educations = await db.educationRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const eduSeen: Array<{ id: string; normInst: string; normDeg: string; startYear?: number | null }> = [];
  const eduIdsToDelete: string[] = [];

  for (const edu of educations) {
    const normInst = normalizeText(edu.institution);
    const normDeg = normalizeText(edu.degree || edu.level);

    const duplicate = eduSeen.find((seen) => {
      const instMatches = isFuzzyMatch(seen.normInst, normInst);
      const degMatches = isFuzzyMatch(seen.normDeg, normDeg);
      const yearMatches = seen.startYear && edu.startYear && seen.startYear === edu.startYear;
      return instMatches && (degMatches || yearMatches);
    });

    if (duplicate) {
      eduIdsToDelete.push(edu.id);
    } else {
      eduSeen.push({ id: edu.id, normInst, normDeg, startYear: edu.startYear });
    }
  }

  if (eduIdsToDelete.length > 0) {
    await db.educationRecord.deleteMany({
      where: { id: { in: eduIdsToDelete } },
    });
    educationsRemoved = eduIdsToDelete.length;
  }

  // 2. Experiences Deduplication
  const experiences = await db.studentExperience.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const expSeen: Array<{ id: string; normComp: string; normTitle: string }> = [];
  const expIdsToDelete: string[] = [];

  for (const exp of experiences) {
    if (isJunkExperience(exp.jobTitle, exp.companyName)) {
      expIdsToDelete.push(exp.id);
      continue;
    }

    const normComp = normalizeText(exp.companyName);
    const normTitle = normalizeText(exp.jobTitle);

    const duplicate = expSeen.find((seen) => {
      const compMatches = isFuzzyMatch(seen.normComp, normComp);
      const titleMatches = isFuzzyMatch(seen.normTitle, normTitle);
      return compMatches && titleMatches;
    });

    if (duplicate) {
      expIdsToDelete.push(exp.id);
    } else {
      expSeen.push({ id: exp.id, normComp, normTitle });
    }
  }

  if (expIdsToDelete.length > 0) {
    await db.studentExperience.deleteMany({
      where: { id: { in: expIdsToDelete } },
    });
    experiencesRemoved = expIdsToDelete.length;
  }

  // 3. Projects Deduplication
  const projects = await db.studentProject.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const projSeen: Array<{ id: string; normTitle: string }> = [];
  const projIdsToDelete: string[] = [];

  for (const proj of projects) {
    if (isJunkProjectTitle(proj.title)) {
      projIdsToDelete.push(proj.id);
      continue;
    }

    const normTitle = normalizeText(proj.title);

    const duplicate = projSeen.find((seen) => {
      return isFuzzyMatch(seen.normTitle, normTitle);
    });

    if (duplicate) {
      projIdsToDelete.push(proj.id);
    } else {
      projSeen.push({ id: proj.id, normTitle });
    }
  }

  if (projIdsToDelete.length > 0) {
    await db.studentProject.deleteMany({
      where: { id: { in: projIdsToDelete } },
    });
    projectsRemoved = projIdsToDelete.length;
  }

  // 4. Skills Deduplication
  const skills = await db.studentSkill.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const skillSeen: Array<{ id: string; normName: string }> = [];
  const skillIdsToDelete: string[] = [];

  for (const skill of skills) {
    const normName = normalizeSkillName(skill.name);

    const duplicate = skillSeen.find((seen) => seen.normName === normName);

    if (duplicate) {
      skillIdsToDelete.push(skill.id);
    } else {
      skillSeen.push({ id: skill.id, normName });
    }
  }

  if (skillIdsToDelete.length > 0) {
    await db.studentSkill.deleteMany({
      where: { id: { in: skillIdsToDelete } },
    });
    skillsRemoved = skillIdsToDelete.length;
  }

  // 5. Certifications Deduplication
  const certs = await db.certification.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const certSeen: Array<{ id: string; normTitle: string; normOrg: string }> = [];
  const certIdsToDelete: string[] = [];

  for (const cert of certs) {
    const normTitle = normalizeText(cert.title);
    const normOrg = normalizeText(cert.issuingOrganization);

    const duplicate = certSeen.find((seen) => {
      const titleMatches = isFuzzyMatch(seen.normTitle, normTitle);
      const orgMatches =
        isGenericOrg(seen.normOrg) ||
        isGenericOrg(normOrg) ||
        isFuzzyMatch(seen.normOrg, normOrg);
      return titleMatches && orgMatches;
    });

    if (duplicate) {
      certIdsToDelete.push(cert.id);
    } else {
      certSeen.push({ id: cert.id, normTitle, normOrg });
    }
  }

  if (certIdsToDelete.length > 0) {
    await db.certification.deleteMany({
      where: { id: { in: certIdsToDelete } },
    });
    certificationsRemoved = certIdsToDelete.length;
  }

  const totalRemoved =
    educationsRemoved +
    experiencesRemoved +
    projectsRemoved +
    skillsRemoved +
    certificationsRemoved;

  // Recalculate score
  const newPassportScore = await recalculateAndSavePassportScore(userId);

  return {
    educationsRemoved,
    experiencesRemoved,
    projectsRemoved,
    skillsRemoved,
    certificationsRemoved,
    totalRemoved,
    newPassportScore,
  };
}
