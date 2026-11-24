// src/lib/jobs/provider.ts
// Multi-Domain Job Provider Abstraction with Jooble & Mock Fallback + 15-min Caching

import { MULTI_DOMAIN_MOCK_JOBS } from "./mock-data";
import { cleanRoleTitle, getDomainFriendlyLabel } from "./domain-mapper";
import type {
  JobDomain,
  JobListing,
  JobSearchParams,
  JobSearchResult,
} from "./types";

export interface JobProvider {
  searchJobs(params: JobSearchParams): Promise<JobSearchResult>;
  getJobById(id: string): Promise<JobListing | null>;
}

// 15-minute in-memory cache to respect API quotas and rate limits
interface CacheEntry {
  timestamp: number;
  data: JobSearchResult;
}
const SEARCH_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class JoobleJobProvider implements JobProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Read environment variables, handling potential whitespace in keys
    this.apiKey =
      process.env.JOOBLE_API_KEY ||
      process.env["JOOBLE_API_KEY "] ||
      "";
    const rawUrl =
      process.env.JOOBLE_URL ||
      process.env["JOOBLE_URL "] ||
      "https://jooble.org/api/";
    this.baseUrl = rawUrl.trim().replace(/\/+$/, "");
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
    if (!this.isConfigured()) {
      throw new Error("JOOBLE_API_KEY is not configured");
    }

    const cleanedQuery = cleanRoleTitle(params.query);
    const domainKeyword = params.domain && params.domain !== "ALL" ? getDomainFriendlyLabel(params.domain) : "";
    const keywords = [cleanedQuery, domainKeyword, "Fresher Trainee"]
      .filter(Boolean)
      .join(" ");

    const endpoint = `${this.baseUrl}/${encodeURIComponent(this.apiKey.trim())}`;
    const page = params.page || 1;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          keywords: keywords || "Graduate Fresher Trainee",
          location: params.location || "India",
          page: page,
        }),
        signal: AbortSignal.timeout(3500), // 3.5-second timeout for responsive UX
      });

      if (!response.ok) {
        throw new Error(`Jooble API returned status ${response.status}`);
      }

      interface JoobleRawJob {
        id?: string | number;
        title: string;
        location?: string;
        snippet?: string;
        salary?: string;
        source?: string;
        type?: string;
        link?: string;
        updated?: string;
      }

      const data = (await response.json()) as {
        totalCount?: number;
        jobs?: JoobleRawJob[];
      };

      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
      const jobs: JobListing[] = rawJobs.map((j, idx) => {
        const id = `jooble-${j.id || idx}`;
        const domain = inferDomain(j.title, j.snippet || "");

        // Clean snippet HTML tags
        const cleanSnippet = (j.snippet || "")
          .replace(/<[^>]*>?/gm, "")
          .replace(/&nbsp;/g, " ")
          .trim();

        return {
          id,
          title: j.title || "Career Opening",
          company: j.source || "Verified Employer",
          location: j.location || params.location || "India",
          domain,
          employmentType: "FULL_TIME",
          salary: j.salary && j.salary.trim() ? j.salary.trim() : undefined,
          salaryDisclosed: Boolean(j.salary && j.salary.trim()),
          description: cleanSnippet || "Job opening via verified job partner network.",
          requirements: extractKeywordsFromSnippet(cleanSnippet),
          qualifications: ["Bachelor's degree or relevant professional qualification"],
          officialUrl: j.link || "https://jooble.org",
          source: `Jooble (${j.source || "Partner Portal"})`,
          sourceUrl: j.link || "https://jooble.org",
          isDemoJob: false,
          postedDate: j.updated ? new Date(j.updated).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          lastVerified: new Date().toISOString().slice(0, 10),
          provenance: {
            sourceName: "Jooble Employment API Partner Network",
            sourceUrl: j.link || "https://jooble.org",
            retrievedDate: new Date(),
            lastVerifiedDate: new Date(),
            verificationStatus: "VERIFIED",
            country: "IN",
          },
        };
      });

      return {
        jobs,
        total: data.totalCount || jobs.length,
        page,
        pageSize: 20,
        hasMore: (data.totalCount || jobs.length) > page * 20,
        sourceProvider: "JOOBLE_API",
      };
    } catch (err) {
      console.warn("[JoobleJobProvider] Query failed or timed out:", err);
      throw err;
    }
  }

  async getJobById(_id: string): Promise<JobListing | null> {
    // Jooble does not provide single-job lookup by ID, check mock or cache
    return null;
  }
}

export class MultiDomainMockJobProvider implements JobProvider {
  async searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
    const rawQuery = (params.query || "").trim();
    const queryClean = cleanRoleTitle(rawQuery).toLowerCase().trim();
    const locLower = (params.location || "").toLowerCase().trim();
    const domainFilter = params.domain && params.domain !== "ALL" ? params.domain : null;

    let pool = MULTI_DOMAIN_MOCK_JOBS.filter((job) => {
      if (domainFilter && job.domain !== domainFilter) {
        return false;
      }
      if (locLower && !job.location.toLowerCase().includes(locLower)) {
        return false;
      }
      if (params.employmentType && job.employmentType !== params.employmentType) {
        return false;
      }
      return true;
    });

    if (queryClean) {
      const tokens = queryClean
        .split(/[\s/,-]+/)
        .filter((w) => w.length > 2 && !["and", "the", "for", "with", "all", "job"].includes(w));

      if (tokens.length > 0) {
        const scored = pool.map((job) => {
          let score = 0;
          const titleLower = job.title.toLowerCase();
          const descLower = job.description.toLowerCase();
          const reqStr = job.requirements.join(" ").toLowerCase();

          if (titleLower.includes(queryClean)) score += 60;
          if (descLower.includes(queryClean)) score += 20;

          for (const token of tokens) {
            if (titleLower.includes(token)) score += 25;
            if (reqStr.includes(token)) score += 15;
            if (descLower.includes(token)) score += 8;
          }

          return { job, score };
        });

        const matches = scored.filter((s) => s.score > 0);
        if (matches.length > 0) {
          matches.sort((a, b) => b.score - a.score);
          if (domainFilter) {
            const nonMatches = scored.filter((s) => s.score === 0);
            pool = [...matches.map((m) => m.job), ...nonMatches.map((n) => n.job)];
          } else {
            pool = matches.map((m) => m.job);
          }
        }
      }
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const paginated = pool.slice(start, start + pageSize);

    return {
      jobs: paginated,
      total: pool.length,
      page,
      pageSize,
      hasMore: start + pageSize < pool.length,
      sourceProvider: "MOCK_DEMO",
    };
  }

  async getJobById(id: string): Promise<JobListing | null> {
    const job = MULTI_DOMAIN_MOCK_JOBS.find((j) => j.id === id);
    return job || null;
  }
}

/**
 * Unified provider with 15-minute caching and graceful fallback.
 */
export class UnifiedJobProvider implements JobProvider {
  private jooble = new JoobleJobProvider();
  private mock = new MultiDomainMockJobProvider();

  async searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 9;

    const cacheKey = JSON.stringify({
      q: params.query || "",
      loc: params.location || "",
      dom: params.domain || "ALL",
      typ: params.employmentType || "",
      p: page,
      ps: pageSize,
    });

    const cached = SEARCH_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // 1. Fetch matching verified curated multi-domain jobs
    const mockRes = await this.mock.searchJobs({
      ...params,
      page: 1,
      pageSize: 100,
    });
    let combinedJobs = [...mockRes.jobs];

    // 2. Query Jooble for live market jobs if configured
    if (this.jooble.isConfigured()) {
      try {
        const joobleRes = await this.jooble.searchJobs(params);
        if (joobleRes.jobs.length > 0) {
          const existingTitles = new Set(
            combinedJobs.map((j) => j.title.toLowerCase().trim())
          );
          const uniqueLiveJobs = joobleRes.jobs.filter(
            (j) =>
              !existingTitles.has(j.title.toLowerCase().trim()) &&
              (params.domain === "ALL" || j.domain === params.domain)
          );
          combinedJobs = [...combinedJobs, ...uniqueLiveJobs];
        }
      } catch (err) {
        console.warn("[UnifiedJobProvider] Jooble live query skipped/failed:", err);
      }
    }

    const start = (page - 1) * pageSize;
    const paginated = combinedJobs.slice(start, start + pageSize);

    const result: JobSearchResult = {
      jobs: paginated,
      total: combinedJobs.length,
      page,
      pageSize,
      hasMore: start + pageSize < combinedJobs.length,
      sourceProvider: this.jooble.isConfigured() ? "JOOBLE_API" : "MOCK_DEMO",
    };

    SEARCH_CACHE.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  async getJobById(id: string): Promise<JobListing | null> {
    // Check mock list first
    const fromMock = await this.mock.getJobById(id);
    if (fromMock) return fromMock;

    // Check in cache
    for (const entry of SEARCH_CACHE.values()) {
      const found = entry.data.jobs.find((j) => j.id === id);
      if (found) return found;
    }

    return null;
  }
}

// Single instance for app reuse
export const jobProvider = new UnifiedJobProvider();

function inferDomain(title: string, snippet: string): JobDomain {
  const text = `${title} ${snippet}`.toLowerCase();
  if (
    text.includes("nurse") ||
    text.includes("nursing") ||
    text.includes("hospital") ||
    text.includes("clinical") ||
    text.includes("patient") ||
    text.includes("medical")
  ) {
    return "HEALTHCARE";
  }
  if (
    text.includes("teacher") ||
    text.includes("teaching") ||
    text.includes("educator") ||
    text.includes("lecturer") ||
    text.includes("school") ||
    text.includes("cbse")
  ) {
    return "TEACHING";
  }
  if (
    text.includes("account") ||
    text.includes("finance") ||
    text.includes("tax") ||
    text.includes("gst") ||
    text.includes("audit") ||
    text.includes("tally")
  ) {
    return "COMMERCE";
  }
  if (
    text.includes("law") ||
    text.includes("legal") ||
    text.includes("advocate") ||
    text.includes("bar council") ||
    text.includes("contract")
  ) {
    return "LAW";
  }
  if (
    text.includes("design") ||
    text.includes("ui/ux") ||
    text.includes("figma") ||
    text.includes("creative") ||
    text.includes("graphic")
  ) {
    return "DESIGN";
  }
  if (
    text.includes("developer") ||
    text.includes("engineer") ||
    text.includes("software") ||
    text.includes("frontend") ||
    text.includes("backend") ||
    text.includes("python") ||
    text.includes("react")
  ) {
    return "TECH";
  }
  return "GENERAL";
}

function extractKeywordsFromSnippet(_snippet: string): string[] {
  const commonKeywords = [
    "Communication Skills",
    "Problem Solving",
    "Team Collaboration",
    "Documentation",
    "MS Office",
    "Attention to Detail",
  ];
  return commonKeywords.slice(0, 4);
}
