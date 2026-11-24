// src/lib/jobs/types.ts
// Multi-Domain Job Listing & Matching Engine Types

import type { SourceProvenance } from "@/lib/research/provenance";

export type JobDomain =
  | "ALL"
  | "HEALTHCARE"
  | "TEACHING"
  | "COMMERCE"
  | "TECH"
  | "LAW"
  | "DESIGN"
  | "GENERAL";

export type EmploymentType =
  | "FULL_TIME"
  | "INTERNSHIP"
  | "PART_TIME"
  | "CONTRACT"
  | "REMOTE"
  | "HYBRID";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  domain: JobDomain;
  employmentType: EmploymentType;
  salary?: string;
  salaryDisclosed: boolean;
  description: string;
  requirements: string[];
  qualifications: string[];
  officialUrl: string;
  source: string;
  sourceUrl: string;
  isDemoJob: boolean;
  postedDate: string;
  lastVerified: string;
  provenance: SourceProvenance;
  matchScore?: number;
  matchedSkillsCount?: number;
  totalSkillsCount?: number;
  isRecommended?: boolean;
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  domain?: JobDomain;
  employmentType?: EmploymentType;
  page?: number;
  pageSize?: number;
}

export interface JobSearchResult {
  jobs: JobListing[];
  total: number;
  page: number;
  pageSize: number;
  hasMore?: boolean;
  sourceProvider: "JOOBLE_API" | "VERIFIED_DIRECTORY" | "MOCK_DEMO";
}

export interface MatchingSkill {
  name: string;
  verified: boolean;
  evidenceId?: string;
  evidenceTitle?: string;
}

export interface MissingSkill {
  name: string;
  importance: "CRITICAL" | "PREFERRED" | "BENEFICIAL";
  bridgeRecommendation: string;
}

export interface JobMatchResult {
  jobId: string;
  jobTitle: string;
  companyName: string;
  matchScore: number; // 0-100 rating based strictly on factual qualification & skill alignment. NEVER a hiring probability percentage!
  matchingSkills: MatchingSkill[];
  missingSkills: MissingSkill[];
  evidenceNeeded: string[];
  disqualifyingFactors: string[];
  suitabilityExplanation: string;
  academicAlignment: {
    eligible: boolean;
    studentQualification: string;
    requiredQualification: string;
    details: string;
  };
  disclaimer: string;
}
