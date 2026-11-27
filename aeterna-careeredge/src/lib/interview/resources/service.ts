// src/lib/interview/resources/service.ts
// Server-side Resource Catalogue & Student Resource Progress service (Phase 4C.1)

import { db } from "@/lib/db";
import { requireOwnedKit } from "@/lib/interview/ownership";
import { sanitizeMultilineText } from "@/lib/interview/validation";
import {
  CURATED_RESOURCE_REGISTRY,
  getCuratedResourcesForDomain,
  resolveSupportedDomain,
} from "./registry";
import type {
  AccessClassification,
  LearningResourceEntry,
  ResourceDifficulty,
  ResourceFormat,
  VerificationStatus,
} from "./types";

export interface StudentResourceProgressState {
  studied: boolean;
  saved: boolean;
  reportedBroken: boolean;
  notes: string | null;
  studiedAt: string | null;
}

export interface StudentResourceItem extends LearningResourceEntry {
  progress: StudentResourceProgressState;
}

export interface KitResourcesView {
  kitId: string;
  domain: string | null;
  roleTitle: string;
  totalCount: number;
  resources: StudentResourceItem[];
}

export interface ResourceFilterOptions {
  search?: string | null;
  format?: string | null;
  access?: string | null;
  savedOnly?: boolean;
  studiedOnly?: boolean;
}

const DEFAULT_PROGRESS: StudentResourceProgressState = {
  studied: false,
  saved: false,
  reportedBroken: false,
  notes: null,
  studiedAt: null,
};

function mapDbResourceToEntry(row: {
  id: string;
  url: string;
  canonicalUrl: string | null;
  title: string;
  provider: string;
  resourceType: string;
  description: string;
  difficulty: string;
  language: string;
  estimatedMinutes: number | null;
  accessClassification: string;
  verificationStatus: string;
  lastVerifiedAt: Date | string | null;
  sourceAttribution: string | null;
  domain: string;
}): LearningResourceEntry | null {
  const domain = resolveSupportedDomain(row.domain);
  if (!domain) return null;

  const curatedMatch = CURATED_RESOURCE_REGISTRY.find(
    (c) => c.id === row.id || c.url === row.url || c.canonicalUrl === row.canonicalUrl
  );

  return {
    id: row.id,
    title: row.title,
    provider: row.provider,
    url: row.url,
    canonicalUrl: row.canonicalUrl || row.url,
    format: row.resourceType as ResourceFormat,
    domain,
    topicSlugs: curatedMatch?.topicSlugs ?? [],
    subtopics: curatedMatch?.subtopics ?? [],
    description: row.description,
    whyRecommended:
      curatedMatch?.whyRecommended ?? "Domain-aligned learning resource.",
    difficulty: (row.difficulty as ResourceDifficulty) || "BEGINNER",
    language: row.language || "English",
    estimatedMinutes: row.estimatedMinutes ?? null,
    accessClassification:
      (row.accessClassification as AccessClassification) || "UNVERIFIED",
    accessRequirements: curatedMatch?.accessRequirements ?? null,
    certificateAvailable: curatedMatch?.certificateAvailable ?? "UNKNOWN",
    license: curatedMatch?.license ?? null,
    attribution: row.sourceAttribution ?? curatedMatch?.attribution ?? null,
    verificationStatus:
      (row.verificationStatus as VerificationStatus) || "PENDING_REVIEW",
    lastVerifiedAt: row.lastVerifiedAt
      ? new Date(row.lastVerifiedAt).toISOString()
      : null,
    discoverySource: curatedMatch?.discoverySource ?? "MANUAL_CURATED",
    reviewStatus: curatedMatch?.reviewStatus ?? "PUBLISHED",
  };
}

function applyResourceFilters(
  items: StudentResourceItem[],
  filters?: ResourceFilterOptions
): StudentResourceItem[] {
  if (!filters) return items;

  const search = filters.search?.trim().toLowerCase() || "";
  const format = filters.format?.trim().toUpperCase() || "";
  const access = filters.access?.trim().toUpperCase() || "";

  return items.filter((item) => {
    if (format && format !== "ALL" && item.format !== format) return false;
    if (access && access !== "ALL" && item.accessClassification !== access) return false;
    if (filters.savedOnly && !item.progress.saved) return false;
    if (filters.studiedOnly && !item.progress.studied) return false;
    if (search) {
      const hay = [
        item.title,
        item.provider,
        item.description,
        item.whyRecommended,
        ...item.subtopics,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function isUniqueConstraintError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  return code === "P2002" || code === "23505";
}

/**
 * Ensures a curated resource exists in `learning_resources` before persisting
 * `StudentResourceProgress` (preserves foreign-key integrity prior to bulk seeding).
 * Race-safe under concurrent requests via unique-constraint recovery.
 */
async function ensurePersistedResource(resourceId: string): Promise<{ id: string } | null> {
  const existing = await db.learningResource.findUnique({
    where: { id: resourceId },
    select: { id: true },
  });
  if (existing) return existing;

  const curated = CURATED_RESOURCE_REGISTRY.find((r) => r.id === resourceId);
  if (!curated) return null;

  const byUrl = await db.learningResource.findUnique({
    where: { url: curated.url },
    select: { id: true },
  });
  if (byUrl) return byUrl;

  if (curated.canonicalUrl) {
    const byCanonical = await db.learningResource.findFirst({
      where: { canonicalUrl: curated.canonicalUrl },
      select: { id: true },
    });
    if (byCanonical) return byCanonical;
  }

  try {
    return await db.learningResource.create({
      data: {
        id: curated.id,
        url: curated.url,
        canonicalUrl: curated.canonicalUrl,
        title: curated.title,
        provider: curated.provider,
        resourceType: curated.format,
        description: curated.description,
        difficulty: curated.difficulty,
        language: curated.language,
        estimatedMinutes: curated.estimatedMinutes,
        accessClassification: curated.accessClassification,
        accessRequirements: curated.accessRequirements,
        certificateAvailable: curated.certificateAvailable,
        license: curated.license,
        isCurated: true,
        subtopicsJson: JSON.stringify(curated.subtopics),
        discoverySource: curated.discoverySource,
        reviewStatus: curated.reviewStatus,
        verificationStatus: curated.verificationStatus,
        lastVerifiedAt: curated.lastVerifiedAt ? new Date(curated.lastVerifiedAt) : null,
        sourceAttribution: curated.attribution,
        domain: curated.domain,
      },
      select: { id: true },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      const winner =
        (await db.learningResource.findUnique({
          where: { id: curated.id },
          select: { id: true },
        })) ??
        (await db.learningResource.findUnique({
          where: { url: curated.url },
          select: { id: true },
        }));
      if (winner) return winner;
    }
    throw err;
  }
}

export async function getKitResourcesView(
  kitId: string,
  userId: string,
  filters?: ResourceFilterOptions
): Promise<KitResourcesView | null> {
  const kit = await requireOwnedKit(kitId, userId);
  if (!kit) return null;

  const resolvedDomain = resolveSupportedDomain(kit.domain);
  if (!resolvedDomain) {
    return {
      kitId: kit.id,
      domain: null,
      roleTitle: kit.jobTitle,
      totalCount: 0,
      resources: [],
    };
  }

  const [dbRows, progressRows] = await Promise.all([
    db.learningResource.findMany({
      where: { domain: resolvedDomain },
      orderBy: { createdAt: "asc" },
    }),
    db.studentResourceProgress.findMany({
      where: { userId, kitId: kit.id },
    }),
  ]);

  const progressMap = new Map<string, StudentResourceProgressState>();
  for (const p of progressRows) {
    progressMap.set(p.resourceId, {
      studied: Boolean(p.studied),
      saved: Boolean(p.saved),
      reportedBroken: Boolean(p.reportedBroken),
      notes: p.notes ?? null,
      studiedAt: p.studiedAt ? new Date(p.studiedAt).toISOString() : null,
    });
  }

  const excludedReview = new Set(["REJECTED", "ARCHIVED", "DRAFT"]);
  const excludedVerification = new Set(["UNAVAILABLE", "BROKEN", "ARCHIVED", "DRAFT"]);
  const dbEntries = dbRows
    .filter(
      (r) =>
        !excludedReview.has(r.reviewStatus) &&
        !excludedVerification.has(r.verificationStatus)
    )
    .map(mapDbResourceToEntry)
    .filter((item): item is LearningResourceEntry => item !== null);

  // Merge DB-persisted resources with curated domain entries (deduped against ALL DB rows
  // so admin-rejected/unpublished/unavailable DB overrides are never re-added from static registry)
  const curatedEntries = getCuratedResourcesForDomain(resolvedDomain);
  const seenIds = new Set(dbRows.map((r) => r.id));
  const seenUrls = new Set(dbRows.map((r) => r.canonicalUrl || r.url));
  const merged = [...dbEntries];

  for (const c of curatedEntries) {
    if (!seenIds.has(c.id) && !seenUrls.has(c.canonicalUrl)) {
      merged.push(c);
    }
  }

  const enriched: StudentResourceItem[] = merged.map((entry) => ({
    ...entry,
    progress: progressMap.get(entry.id) ?? { ...DEFAULT_PROGRESS },
  }));

  const filtered = applyResourceFilters(enriched, filters);

  return {
    kitId: kit.id,
    domain: resolvedDomain,
    roleTitle: kit.jobTitle,
    totalCount: enriched.length,
    resources: filtered,
  };
}

export async function updateStudentResourceProgress(params: {
  userId: string;
  kitId: string;
  resourceId: string;
  studied?: boolean;
  saved?: boolean;
  reportedBroken?: boolean;
  notes?: string | null;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const hasValidUpdate =
    typeof params.studied === "boolean" ||
    typeof params.saved === "boolean" ||
    typeof params.reportedBroken === "boolean" ||
    params.notes !== undefined;

  if (!hasValidUpdate) {
    return { ok: false as const, status: 400, error: "No valid progress fields provided" };
  }

  const persistedResource = await ensurePersistedResource(params.resourceId);
  if (!persistedResource) {
    return { ok: false as const, status: 404, error: "Learning resource not found" };
  }

  const existing = await db.studentResourceProgress.findFirst({
    where: {
      userId: params.userId,
      kitId: kit.id,
      resourceId: persistedResource.id,
    },
  });

  const nextStudied =
    typeof params.studied === "boolean" ? params.studied : Boolean(existing?.studied);
  const nextSaved =
    typeof params.saved === "boolean" ? params.saved : Boolean(existing?.saved);
  const nextReportedBroken =
    typeof params.reportedBroken === "boolean"
      ? params.reportedBroken
      : Boolean(existing?.reportedBroken);
  const nextNotes =
    params.notes !== undefined
      ? params.notes === null
        ? null
        : sanitizeMultilineText(params.notes, 2000)
      : existing?.notes ?? null;
  const nextStudiedAt =
    typeof params.studied === "boolean"
      ? params.studied
        ? existing?.studiedAt ?? new Date()
        : null
      : existing?.studiedAt ?? null;

  let progress;
  if (existing) {
    progress = await db.studentResourceProgress.update({
      where: { id: existing.id },
      data: {
        studied: nextStudied,
        saved: nextSaved,
        reportedBroken: nextReportedBroken,
        notes: nextNotes,
        studiedAt: nextStudiedAt,
      },
    });
  } else {
    try {
      progress = await db.studentResourceProgress.create({
        data: {
          userId: params.userId,
          kitId: kit.id,
          resourceId: persistedResource.id,
          studied: nextStudied,
          saved: nextSaved,
          reportedBroken: nextReportedBroken,
          notes: nextNotes,
          studiedAt: nextStudiedAt,
        },
      });
    } catch (err) {
      if (!isUniqueConstraintError(err)) throw err;
      const concurrent = await db.studentResourceProgress.findFirst({
        where: {
          userId: params.userId,
          kitId: kit.id,
          resourceId: persistedResource.id,
        },
      });
      if (!concurrent) throw err;
      progress = await db.studentResourceProgress.update({
        where: { id: concurrent.id },
        data: {
          studied: nextStudied,
          saved: nextSaved,
          reportedBroken: nextReportedBroken,
          notes: nextNotes,
          studiedAt: nextStudiedAt,
        },
      });
    }
  }

  return { ok: true as const, progress };
}
