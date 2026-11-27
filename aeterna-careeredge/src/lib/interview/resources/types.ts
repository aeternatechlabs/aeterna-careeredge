// src/lib/interview/resources/types.ts
// Strongly typed Resource Catalogue Foundation for Interview Prep 2.0 (Phase 4B — Code-Only)

import type { AcademicDomain } from "@/lib/constants/domains";

export type ResourceFormat =
  | "OFFICIAL_DOCS"
  | "FREE_COURSE"
  | "VIDEO"
  | "ARTICLE"
  | "INTERACTIVE"
  | "PRACTICE"
  | "OPEN_SOURCE"
  | "STANDARDS"
  | "GOVERNMENT_PORTAL"
  | "UNIVERSITY_OER";

export type AccessClassification =
  | "COMPLETELY_FREE"
  | "FREE_WITH_PAID_CERT"
  | "FREEMIUM"
  | "FREE_ACCOUNT_REQUIRED"
  | "PAID"
  | "UNVERIFIED";

export type VerificationStatus =
  | "VERIFIED"
  | "PENDING_REVIEW"
  | "NEEDS_RECHECK"
  | "UNAVAILABLE"
  | "INCONCLUSIVE";

export type NetworkStatus =
  | "REACHABLE"
  | "REDIRECTED"
  | "UNAVAILABLE"
  | "INCONCLUSIVE";

export type CertificateAvailability =
  | "NONE"
  | "FREE_CERTIFICATE"
  | "PAID_CERTIFICATE"
  | "UNKNOWN";

export type DiscoverySource =
  | "MANUAL_CURATED"
  | "BRAVE_SEARCH"
  | "YOUTUBE_API"
  | "OPENALEX"
  | "DOAJ"
  | "AI_ASSISTED";

export type AdminReviewStatus =
  | "DISCOVERED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";

export type ResourceDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface LearningResourceEntry {
  id: string;
  title: string;
  provider: string;
  url: string;
  canonicalUrl: string;
  format: ResourceFormat;
  domain: AcademicDomain;
  /** Optional roadmap topic slugs (e.g., "js-functions-scope-closures") */
  topicSlugs: string[];
  subtopics: string[];
  description: string;
  whyRecommended: string;
  difficulty: ResourceDifficulty;
  language: string;
  estimatedMinutes: number | null;
  accessClassification: AccessClassification;
  accessRequirements: string | null;
  certificateAvailable: CertificateAvailability;
  license: string | null;
  attribution: string | null;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string | null;
  discoverySource: DiscoverySource;
  reviewStatus: AdminReviewStatus;
}

export interface DiscoveredResourceCandidate {
  title: string;
  provider: string;
  url: string;
  canonicalUrl: string;
  format: ResourceFormat;
  domain: AcademicDomain;
  topicSlug?: string;
  description: string;
  language: string;
  estimatedMinutes: number | null;
  accessClassification: AccessClassification;
  verificationStatus: "PENDING_REVIEW";
  discoverySource: DiscoverySource;
  reviewStatus: "PENDING_REVIEW";
  discoveredAt: string;
  rawMetadata?: Record<string, unknown>;
}

export interface ResourceVerificationResult {
  inputUrl: string;
  canonicalUrl: string | null;
  finalUrl: string | null;
  httpStatus: number | null;
  networkStatus: NetworkStatus;
  accessStatus: AccessClassification;
  verificationStatus: VerificationStatus;
  redirectCount: number;
  checkedAt: string;
  notes: string;
}
