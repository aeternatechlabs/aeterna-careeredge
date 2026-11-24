// src/lib/jobs/domain-mapper.ts
// Maps student academic domain strings from database/profile to JobDomain enum tokens

import type { JobDomain } from "./types";

export function mapAcademicDomainToJobDomain(academicDomain?: string | null): JobDomain {
  if (!academicDomain) return "ALL";
  const lower = academicDomain.toLowerCase().trim();

  if (
    lower.includes("tech") ||
    lower.includes("comput") ||
    lower.includes("engin") ||
    lower.includes("software") ||
    lower.includes("it") ||
    lower.includes("developer") ||
    lower.includes("code") ||
    lower.includes("data") ||
    lower.includes("ai") ||
    lower.includes("cyber")
  ) {
    return "TECH";
  }

  if (
    lower.includes("health") ||
    lower.includes("nurs") ||
    lower.includes("medic") ||
    lower.includes("pharma") ||
    lower.includes("clinic") ||
    lower.includes("hospital") ||
    lower.includes("patient")
  ) {
    return "HEALTHCARE";
  }

  if (
    lower.includes("comm") ||
    lower.includes("finan") ||
    lower.includes("bank") ||
    lower.includes("tax") ||
    lower.includes("acc") ||
    lower.includes("econom") ||
    lower.includes("audit") ||
    lower.includes("business")
  ) {
    return "COMMERCE";
  }

  if (
    lower.includes("law") ||
    lower.includes("legal") ||
    lower.includes("juris") ||
    lower.includes("advocat") ||
    lower.includes("court") ||
    lower.includes("litigat")
  ) {
    return "LAW";
  }

  if (
    lower.includes("teach") ||
    lower.includes("educ") ||
    lower.includes("school") ||
    lower.includes("profess") ||
    lower.includes("lectur") ||
    lower.includes("tutor") ||
    lower.includes("faculty")
  ) {
    return "TEACHING";
  }

  if (
    lower.includes("design") ||
    lower.includes("art") ||
    lower.includes("ux") ||
    lower.includes("ui") ||
    lower.includes("visual") ||
    lower.includes("media") ||
    lower.includes("graphic")
  ) {
    return "DESIGN";
  }

  return "ALL";
}

export function cleanRoleTitle(rawRole?: string | null): string {
  if (!rawRole) return "";
  let cleaned = rawRole.trim();
  // Strip bullets, pipes, em-dashes and company suffixes like "• Nexanova Pro Tech 06/2025 – 12/2025"
  cleaned = cleaned.replace(/[•|\-–—].*$/, "");
  // Strip dates (e.g. 06/2025, 2022-2026, Jan 2025)
  cleaned = cleaned.replace(/\b\d{1,2}[/-]\d{2,4}\b/g, "");
  cleaned = cleaned.replace(/\b(19|20)\d{2}\b/g, "");
  cleaned = cleaned.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi, "");
  // Strip prompt artifacts
  cleaned = cleaned.replace(/give me ats friendly resume/gi, "");
  cleaned = cleaned.replace(/give me.*$/gi, "");
  cleaned = cleaned.replace(/ats friendly/gi, "");
  cleaned = cleaned.replace(/[()]/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

export function getDomainFriendlyLabel(domain: JobDomain): string {
  switch (domain) {
    case "TECH":
      return "Tech & Software";
    case "HEALTHCARE":
      return "Healthcare & Nursing";
    case "COMMERCE":
      return "Commerce & Finance";
    case "LAW":
      return "Law & Legal";
    case "TEACHING":
      return "Teaching & Education";
    case "DESIGN":
      return "Design & UX";
    default:
      return "All Opportunities";
  }
}
