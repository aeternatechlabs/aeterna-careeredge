// src/lib/interview/resources/student-discovery.ts
// Safe, rate-limited student resource discovery across configured internet adapters.

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { requireOwnedKit } from "@/lib/interview/ownership";
import { sanitizeMultilineText, sanitizeText } from "@/lib/interview/validation";
import { resolveSupportedDomain } from "./registry";
import { validateAndNormalizeUrl } from "./url-safety";
import {
  AiAssistedDiscoveryAdapter,
  BraveSearchDiscoveryAdapter,
  DoajDiscoveryAdapter,
  OpenAlexDiscoveryAdapter,
  YouTubeDiscoveryAdapter,
  type ResourceDiscoveryAdapter,
} from "./discovery";
import { generateId } from "@/lib/supabase/db-proxy";

function isRelevantCandidate(
  title: string,
  description: string,
  queryTokens: string[],
  domainTokens: string[]
): boolean {
  const hay = `${title} ${description}`.toLowerCase();
  // Require at least 1 meaningful query token or domain token match so off-topic academic papers are filtered out
  if (queryTokens.some((tok) => hay.includes(tok))) return true;
  if (domainTokens.some((tok) => hay.includes(tok))) return true;
  return false;
}

export async function discoverResourcesForKit(params: {
  kitId: string;
  userId: string;
  query?: string;
  limit?: number;
}) {
  const kit = await requireOwnedKit(params.kitId, params.userId);
  if (!kit) {
    return { ok: false as const, status: 404, error: "Interview kit not found" };
  }

  const resolvedDomain = resolveSupportedDomain(kit.domain);
  if (!resolvedDomain) {
    return { ok: false as const, status: 400, error: "Kit domain is required for discovery" };
  }

  const rate = checkRateLimit(`student_resource_discover:${params.userId}`, 8, 60 * 1000);
  if (!rate.success) {
    return { ok: false as const, status: 429, error: "Too many discovery requests. Please wait a minute." };
  }

  const topicTitle = sanitizeText(params.query || kit.jobTitle, 120);
  if (topicTitle.length < 2) {
    return { ok: false as const, status: 400, error: "Enter at least 2 characters to search online." };
  }

  const adapters: ResourceDiscoveryAdapter[] = [
    new BraveSearchDiscoveryAdapter(),
    new YouTubeDiscoveryAdapter(),
    new OpenAlexDiscoveryAdapter(),
    new DoajDiscoveryAdapter(),
    new AiAssistedDiscoveryAdapter(),
  ];

  const perAdapterLimit = Math.min(4, Math.max(1, params.limit ?? 3));
  const results = await Promise.all(
    adapters.map((adapter) =>
      adapter.discover({
        topicTitle,
        domain: resolvedDomain,
        limit: perAdapterLimit,
      })
    )
  );

  const queryTokens = topicTitle
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  const domainTokens = resolvedDomain
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);

  let addedCount = 0;
  let filteredOutCount = 0;
  let duplicateCount = 0;
  const providerSummaries = [];

  for (const res of results) {
    let addedForProvider = 0;
    for (const candidate of res.candidates) {
      if (!isRelevantCandidate(candidate.title, candidate.description, queryTokens, domainTokens)) {
        filteredOutCount++;
        continue;
      }

      const urlCheck = validateAndNormalizeUrl(candidate.url, { requireHttps: true });
      if (!urlCheck.ok) continue;

      const existingByCanonical = await db.learningResource.findFirst({
        where: { canonicalUrl: urlCheck.canonicalUrl },
        select: { id: true },
      });
      const existing =
        existingByCanonical ??
        (await db.learningResource.findFirst({
          where: { url: urlCheck.canonicalUrl },
          select: { id: true },
        }));
      if (existing) {
        duplicateCount++;
        continue;
      }

      try {
        await db.learningResource.create({
          data: {
            id: generateId(),
            url: urlCheck.canonicalUrl,
            canonicalUrl: urlCheck.canonicalUrl,
            title: sanitizeText(candidate.title, 200),
            provider: sanitizeText(candidate.provider, 120) || "External Source",
            resourceType: candidate.format,
            description: sanitizeMultilineText(candidate.description, 1000) || candidate.title,
            difficulty: "INTERMEDIATE",
            language: sanitizeText(candidate.language, 40) || "English",
            estimatedMinutes: candidate.estimatedMinutes ?? null,
            accessClassification: "UNVERIFIED",
            certificateAvailable: "UNKNOWN",
            isCurated: false,
            discoverySource: candidate.discoverySource,
            reviewStatus: "PUBLISHED",
            verificationStatus: "PENDING_REVIEW",
            domain: resolvedDomain,
          },
        });
        addedCount++;
        addedForProvider++;
      } catch {
        duplicateCount++;
      }
    }

    providerSummaries.push({
      provider: res.provider,
      configured: res.configured,
      returned: res.candidates.length,
      added: addedForProvider,
    });
  }

  return {
    ok: true as const,
    topicTitle,
    domain: resolvedDomain,
    addedCount,
    duplicateCount,
    filteredOutCount,
    providerSummaries,
  };
}
