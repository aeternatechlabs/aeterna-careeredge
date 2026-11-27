// src/lib/interview/resources/discovery.ts
// Extensible Multi-Provider Resource Discovery Adapters (Phase 4B — Code-Only)
// Candidates are ALWAYS marked PENDING_REVIEW and NEVER published automatically.

import type { AcademicDomain } from "@/lib/constants/domains";
import type { DiscoveredResourceCandidate, DiscoverySource } from "./types";
import { validateAndNormalizeUrl } from "./url-safety";

export interface DiscoveryQuery {
  topicTitle: string;
  domain: AcademicDomain;
  topicSlug?: string;
  language?: string;
  limit?: number;
}

export interface DiscoveryAdapterResult {
  provider: DiscoverySource;
  configured: boolean;
  candidates: DiscoveredResourceCandidate[];
  statusNote: string;
}

export interface ResourceDiscoveryAdapter {
  readonly provider: DiscoverySource;
  isConfigured(): boolean;
  discover(query: DiscoveryQuery): Promise<DiscoveryAdapterResult>;
}

function buildPendingCandidate(params: {
  title: string;
  provider: string;
  url: string;
  format: DiscoveredResourceCandidate["format"];
  domain: AcademicDomain;
  topicSlug?: string;
  description: string;
  language?: string;
  discoverySource: DiscoverySource;
  rawMetadata?: Record<string, unknown>;
}): DiscoveredResourceCandidate | null {
  const checked = validateAndNormalizeUrl(params.url, { requireHttps: true });
  if (!checked.ok) return null;

  return {
    title: params.title.trim().slice(0, 200),
    provider: params.provider.trim().slice(0, 120),
    url: checked.canonicalUrl,
    canonicalUrl: checked.canonicalUrl,
    format: params.format,
    domain: params.domain,
    topicSlug: params.topicSlug,
    description: params.description.trim().slice(0, 500),
    language: params.language || "English",
    estimatedMinutes: null,
    accessClassification: "UNVERIFIED",
    verificationStatus: "PENDING_REVIEW",
    discoverySource: params.discoverySource,
    reviewStatus: "PENDING_REVIEW",
    discoveredAt: new Date().toISOString(),
    rawMetadata: params.rawMetadata,
  };
}

/** Brave Search API Adapter (requires BRAVE_SEARCH_API_KEY in future DB-backed phase). */
export class BraveSearchDiscoveryAdapter implements ResourceDiscoveryAdapter {
  readonly provider: DiscoverySource = "BRAVE_SEARCH";

  isConfigured(): boolean {
    return Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim());
  }

  async discover(_query: DiscoveryQuery): Promise<DiscoveryAdapterResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.provider,
        configured: false,
        candidates: [],
        statusNote: "BRAVE_SEARCH_API_KEY not configured; discovery skipped safely.",
      };
    }
    return {
      provider: this.provider,
      configured: true,
      candidates: [],
      statusNote: "Brave Search adapter ready; live query execution deferred to DB-backed Phase 4.",
    };
  }
}

/** YouTube Data API v3 Adapter (requires YOUTUBE_API_KEY in future DB-backed phase). */
export class YouTubeDiscoveryAdapter implements ResourceDiscoveryAdapter {
  readonly provider: DiscoverySource = "YOUTUBE_API";

  isConfigured(): boolean {
    return Boolean(process.env.YOUTUBE_API_KEY?.trim());
  }

  async discover(_query: DiscoveryQuery): Promise<DiscoveryAdapterResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.provider,
        configured: false,
        candidates: [],
        statusNote: "YOUTUBE_API_KEY not configured; video discovery skipped safely.",
      };
    }
    return {
      provider: this.provider,
      configured: true,
      candidates: [],
      statusNote: "YouTube Data API v3 adapter ready; live query execution deferred to DB-backed Phase 4.",
    };
  }
}

/** OpenAlex Public Open-Scholarly API Adapter (no key required; live persistence deferred). */
export class OpenAlexDiscoveryAdapter implements ResourceDiscoveryAdapter {
  readonly provider: DiscoverySource = "OPENALEX";

  isConfigured(): boolean {
    return true;
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveryAdapterResult> {
    const limit = Math.min(5, Math.max(1, query.limit ?? 3));
    const apiUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
      `${query.topicTitle} ${query.domain}`
    )}&filter=is_oa:true&per-page=${limit}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "AeternaCareerEdge/1.0 (mailto:support@aeternatechlabs.com)",
        },
      });
      clearTimeout(timer);

      if (!res.ok) {
        return {
          provider: this.provider,
          configured: true,
          candidates: [],
          statusNote: `OpenAlex returned HTTP ${res.status}.`,
        };
      }

      const json = (await res.json()) as {
        results?: Array<{
          id?: string;
          title?: string;
          primary_location?: {
            landing_page_url?: string;
            source?: { display_name?: string };
          };
          open_access?: { oa_url?: string };
        }>;
      };

      const candidates: DiscoveredResourceCandidate[] = [];
      for (const work of json.results || []) {
        const targetUrl = work.open_access?.oa_url || work.primary_location?.landing_page_url;
        if (!targetUrl || !work.title) continue;
        const candidate = buildPendingCandidate({
          title: work.title,
          provider: work.primary_location?.source?.display_name || "OpenAlex Open Access",
          url: targetUrl,
          format: "UNIVERSITY_OER",
          domain: query.domain,
          topicSlug: query.topicSlug,
          description: `Open-access scholarly resource indexed by OpenAlex for ${query.topicTitle}.`,
          language: query.language || "English",
          discoverySource: "OPENALEX",
          rawMetadata: { openAlexId: work.id },
        });
        if (candidate) candidates.push(candidate);
      }

      return {
        provider: this.provider,
        configured: true,
        candidates,
        statusNote: `Retrieved ${candidates.length} PENDING_REVIEW open-access candidates from OpenAlex.`,
      };
    } catch (err) {
      return {
        provider: this.provider,
        configured: true,
        candidates: [],
        statusNote: `OpenAlex lookup skipped: ${err instanceof Error ? err.message : "Network error"}`,
      };
    }
  }
}

/** DOAJ (Directory of Open Access Journals) Public API Adapter. */
export class DoajDiscoveryAdapter implements ResourceDiscoveryAdapter {
  readonly provider: DiscoverySource = "DOAJ";

  isConfigured(): boolean {
    return true;
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveryAdapterResult> {
    const limit = Math.min(5, Math.max(1, query.limit ?? 3));
    const apiUrl = `https://doaj.org/api/search/articles/${encodeURIComponent(
      query.topicTitle
    )}?pageSize=${limit}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        return {
          provider: this.provider,
          configured: true,
          candidates: [],
          statusNote: `DOAJ returned HTTP ${res.status}.`,
        };
      }

      const json = (await res.json()) as {
        results?: Array<{
          id?: string;
          bibjson?: {
            title?: string;
            journal?: { title?: string };
            link?: Array<{ url?: string; type?: string }>;
          };
        }>;
      };

      const candidates: DiscoveredResourceCandidate[] = [];
      for (const item of json.results || []) {
        const title = item.bibjson?.title;
        const fulltextUrl = item.bibjson?.link?.find((l) => l.url)?.url;
        if (!title || !fulltextUrl) continue;
        const candidate = buildPendingCandidate({
          title,
          provider: item.bibjson?.journal?.title || "DOAJ Open Access Journal",
          url: fulltextUrl,
          format: "ARTICLE",
          domain: query.domain,
          topicSlug: query.topicSlug,
          description: `Open-access peer-reviewed article via DOAJ for ${query.topicTitle}.`,
          language: query.language || "English",
          discoverySource: "DOAJ",
          rawMetadata: { doajId: item.id },
        });
        if (candidate) candidates.push(candidate);
      }

      return {
        provider: this.provider,
        configured: true,
        candidates,
        statusNote: `Retrieved ${candidates.length} PENDING_REVIEW candidates from DOAJ.`,
      };
    } catch (err) {
      return {
        provider: this.provider,
        configured: true,
        candidates: [],
        statusNote: `DOAJ lookup skipped: ${err instanceof Error ? err.message : "Network error"}`,
      };
    }
  }
}

/**
 * Supplementary AI-Assisted Discovery Adapter (wraps existing ServerAiService).
 * Strictly formulates search queries / topic keywords — never invents URLs or publishes resources.
 */
export class AiAssistedDiscoveryAdapter implements ResourceDiscoveryAdapter {
  readonly provider: DiscoverySource = "AI_ASSISTED";

  isConfigured(): boolean {
    return Boolean(
      process.env.GROQ_API_KEY ||
        process.env.XAI_API_KEY ||
        process.env.GROK_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY
    );
  }

  async discover(_query: DiscoveryQuery): Promise<DiscoveryAdapterResult> {
    return {
      provider: this.provider,
      configured: this.isConfigured(),
      candidates: [],
      statusNote: this.isConfigured()
        ? "AI query-formulation adapter configured; never generates unverified URLs directly."
        : "No AI provider key configured; supplementary AI discovery skipped safely.",
    };
  }
}
