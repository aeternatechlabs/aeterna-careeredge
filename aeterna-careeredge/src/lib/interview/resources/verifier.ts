// src/lib/interview/resources/verifier.ts
// Resource Verification Engine (Phase 4B.2 — Code-Only, Zero DB Writes)
//
// CLOUDFLARE WORKERS SSRF LIMITATION:
// Cloudflare Workers' fetch() API does not expose pre-connect DNS resolution or socket IP
// inspection before issuing an outbound HTTP request. Therefore, hostname-string checks alone
// cannot prevent DNS-rebinding or public hostnames with private A/AAAA records.
// To mitigate this, verifyResourceUrl() FAILS CLOSED using a mandatory hostname allowlist
// (defaulting to getApprovedVerificationHostnames()) with no unrestricted-fetch override.

import { getApprovedVerificationHostnames } from "./registry";
import type {
  AccessClassification,
  NetworkStatus,
  ResourceVerificationResult,
  VerificationStatus,
} from "./types";
import { validateAndNormalizeUrl } from "./url-safety";

export interface VerificationFetchResponse {
  status: number;
  headers: { get: (name: string) => string | null };
  body?: ReadableStream<Uint8Array> | null;
  text?: () => Promise<string>;
}

export type VerificationFetcher = (
  url: string,
  init: { method: string; redirect: "manual"; signal: AbortSignal; headers: Record<string, string> }
) => Promise<VerificationFetchResponse>;

export interface VerifyResourceOptions {
  /** Approved hostnames for fail-closed verification; defaults to getApprovedVerificationHostnames() */
  allowedHostnames?: ReadonlySet<string>;
  maxRedirects?: number;
  timeoutMs?: number;
  maxBodyBytes?: number;
  fetcher?: VerificationFetcher;
  /** Explicit curated access classification evidence, if already human-verified */
  verifiedAccessEvidence?: AccessClassification;
}

const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 6000;
const DEFAULT_MAX_BODY_BYTES = 64 * 1024; // 64 KB cap

/**
 * Conservatively classify access from HTTP status and bounded page signals.
 * HTTP 200 alone NEVER implies COMPLETELY_FREE -> returns UNVERIFIED.
 */
export function classifyResourceAccess(params: {
  httpStatus: number | null;
  bodySnippet?: string;
  verifiedAccessEvidence?: AccessClassification;
}): AccessClassification {
  if (params.verifiedAccessEvidence) {
    return params.verifiedAccessEvidence;
  }
  if (params.httpStatus === 402) return "PAID";
  if (params.httpStatus === 401) return "FREE_ACCOUNT_REQUIRED";

  const text = (params.bodySnippet || "").toLowerCase();
  if (!text) return "UNVERIFIED";

  if (
    /\b(subscribe to read|paywall|buy this course|purchase required|start your paid trial)\b/.test(
      text
    )
  ) {
    return "PAID";
  }
  if (/\b(audit for free|paid certificate|upgrade for certificate|optional certificate)\b/.test(text)) {
    return "FREE_WITH_PAID_CERT";
  }
  if (/\b(freemium|free tier|pro plan|upgrade to pro)\b/.test(text)) {
    return "FREEMIUM";
  }
  if (/\b(sign in to continue|log in to view|create a free account to access)\b/.test(text)) {
    return "FREE_ACCOUNT_REQUIRED";
  }

  return "UNVERIFIED";
}

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

/**
 * Read at most `maxBodyBytes` from a streaming response without buffering the entire body.
 * Preserves multibyte UTF-8 characters split across chunk boundaries and cancels the reader at the cap.
 */
export async function readBoundedUtf8Snippet(
  res: VerificationFetchResponse,
  maxBodyBytes: number
): Promise<{ text: string; truncated: boolean; streamError?: string }> {
  if (maxBodyBytes <= 0) {
    return { text: "", truncated: false };
  }

  if (!res.body || typeof res.body.getReader !== "function") {
    if (typeof res.text === "function") {
      try {
        const raw = await res.text();
        const encoded = new TextEncoder().encode(raw);
        if (encoded.byteLength <= maxBodyBytes) {
          return { text: raw, truncated: false };
        }
        const decoder = new TextDecoder("utf-8", { fatal: false });
        return {
          text: decoder.decode(encoded.subarray(0, maxBodyBytes)),
          truncated: true,
        };
      } catch (err) {
        return {
          text: "",
          truncated: false,
          streamError: err instanceof Error ? err.message : "Failed to read response text",
        };
      }
    }
    return { text: "", truncated: false };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let totalBytes = 0;
  let output = "";
  let truncated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      const remaining = maxBodyBytes - totalBytes;
      if (value.byteLength >= remaining) {
        const slice = value.subarray(0, remaining);
        output += decoder.decode(slice, { stream: true });
        totalBytes += slice.byteLength;
        truncated = value.byteLength > remaining;
        await reader.cancel("Byte limit reached").catch(() => {});
        break;
      }

      output += decoder.decode(value, { stream: true });
      totalBytes += value.byteLength;
    }

    output += decoder.decode();
    return { text: output, truncated };
  } catch (err) {
    await reader.cancel("Stream read error").catch(() => {});
    return {
      text: output,
      truncated,
      streamError: err instanceof Error ? err.message : "Stream read error",
    };
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore if already released/cancelled
    }
  }
}

export async function verifyResourceUrl(
  rawUrl: string,
  options: VerifyResourceOptions = {}
): Promise<ResourceVerificationResult> {
  const checkedAt = new Date().toISOString();
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const fetcher: VerificationFetcher =
    options.fetcher ?? ((u, init) => fetch(u, init) as Promise<VerificationFetchResponse>);

  // Mandatory allowlist (fail closed if omitted or empty)
  const effectiveAllowlist =
    options.allowedHostnames !== undefined
      ? options.allowedHostnames
      : getApprovedVerificationHostnames();

  const initialCheck = validateAndNormalizeUrl(rawUrl, {
    requireHttps: true,
    requireAllowlist: true,
    allowedHostnames: effectiveAllowlist,
  });

  if (!initialCheck.ok) {
    return {
      inputUrl: rawUrl,
      canonicalUrl: null,
      finalUrl: null,
      httpStatus: null,
      networkStatus: "UNAVAILABLE",
      accessStatus: "UNVERIFIED",
      verificationStatus: "UNAVAILABLE",
      redirectCount: 0,
      checkedAt,
      notes: `URL rejected by safety policy: ${initialCheck.reason}`,
    };
  }

  let currentUrl = initialCheck.canonicalUrl;
  let redirectCount = 0;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetcher(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "AeternaCareerEdge-ResourceVerifier/1.0 (+https://careeredge.aeternatechlabs.com)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timer);

      if (isRedirectStatus(res.status)) {
        const location = res.headers.get("location");
        if (!location) {
          return {
            inputUrl: rawUrl,
            canonicalUrl: initialCheck.canonicalUrl,
            finalUrl: currentUrl,
            httpStatus: res.status,
            networkStatus: "INCONCLUSIVE",
            accessStatus: "UNVERIFIED",
            verificationStatus: "INCONCLUSIVE",
            redirectCount,
            checkedAt,
            notes: `Redirect (${res.status}) missing Location header.`,
          };
        }

        if (redirectCount >= maxRedirects) {
          return {
            inputUrl: rawUrl,
            canonicalUrl: initialCheck.canonicalUrl,
            finalUrl: currentUrl,
            httpStatus: res.status,
            networkStatus: "INCONCLUSIVE",
            accessStatus: "UNVERIFIED",
            verificationStatus: "INCONCLUSIVE",
            redirectCount,
            checkedAt,
            notes: `Exceeded maximum redirect limit (${maxRedirects}).`,
          };
        }

        let resolvedTarget: string;
        try {
          resolvedTarget = new URL(location, currentUrl).toString();
        } catch {
          return {
            inputUrl: rawUrl,
            canonicalUrl: initialCheck.canonicalUrl,
            finalUrl: currentUrl,
            httpStatus: res.status,
            networkStatus: "UNAVAILABLE",
            accessStatus: "UNVERIFIED",
            verificationStatus: "UNAVAILABLE",
            redirectCount,
            checkedAt,
            notes: "Malformed redirect destination.",
          };
        }

        const redirectCheck = validateAndNormalizeUrl(resolvedTarget, {
          requireHttps: true,
          requireAllowlist: true,
          allowedHostnames: effectiveAllowlist,
        });
        if (!redirectCheck.ok) {
          return {
            inputUrl: rawUrl,
            canonicalUrl: initialCheck.canonicalUrl,
            finalUrl: currentUrl,
            httpStatus: res.status,
            networkStatus: "UNAVAILABLE",
            accessStatus: "UNVERIFIED",
            verificationStatus: "UNAVAILABLE",
            redirectCount,
            checkedAt,
            notes: `Blocked unsafe redirect destination: ${redirectCheck.reason}`,
          };
        }

        redirectCount++;
        currentUrl = redirectCheck.canonicalUrl;
        continue;
      }

      if (res.status === 403 || res.status === 429) {
        return {
          inputUrl: rawUrl,
          canonicalUrl: initialCheck.canonicalUrl,
          finalUrl: currentUrl,
          httpStatus: res.status,
          networkStatus: "INCONCLUSIVE",
          accessStatus: "UNVERIFIED",
          verificationStatus: "INCONCLUSIVE",
          redirectCount,
          checkedAt,
          notes:
            res.status === 429
              ? "Rate limited (HTTP 429); verification inconclusive."
              : "Access blocked or bot-protected (HTTP 403); requires manual review.",
        };
      }

      if (res.status === 404 || res.status === 410 || res.status >= 500) {
        return {
          inputUrl: rawUrl,
          canonicalUrl: initialCheck.canonicalUrl,
          finalUrl: currentUrl,
          httpStatus: res.status,
          networkStatus: "UNAVAILABLE",
          accessStatus: "UNVERIFIED",
          verificationStatus: "UNAVAILABLE",
          redirectCount,
          checkedAt,
          notes: `Resource returned HTTP ${res.status}.`,
        };
      }

      const { text: bodySnippet, streamError } = await readBoundedUtf8Snippet(res, maxBodyBytes);
      if (streamError) {
        return {
          inputUrl: rawUrl,
          canonicalUrl: initialCheck.canonicalUrl,
          finalUrl: currentUrl,
          httpStatus: res.status,
          networkStatus: "INCONCLUSIVE",
          accessStatus: "UNVERIFIED",
          verificationStatus: "INCONCLUSIVE",
          redirectCount,
          checkedAt,
          notes: `Response stream failed: ${streamError}`,
        };
      }

      const accessStatus = classifyResourceAccess({
        httpStatus: res.status,
        bodySnippet,
        verifiedAccessEvidence: options.verifiedAccessEvidence,
      });

      const networkStatus: NetworkStatus = redirectCount > 0 ? "REDIRECTED" : "REACHABLE";
      const verificationStatus: VerificationStatus =
        accessStatus === "UNVERIFIED" ? "PENDING_REVIEW" : "VERIFIED";

      return {
        inputUrl: rawUrl,
        canonicalUrl: initialCheck.canonicalUrl,
        finalUrl: currentUrl,
        httpStatus: res.status,
        networkStatus,
        accessStatus,
        verificationStatus,
        redirectCount,
        checkedAt,
        notes:
          accessStatus === "UNVERIFIED"
            ? `HTTP ${res.status} reachable; access terms require human review before labeling free.`
            : `HTTP ${res.status} verified (${accessStatus}).`,
      };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return {
        inputUrl: rawUrl,
        canonicalUrl: initialCheck.canonicalUrl,
        finalUrl: currentUrl,
        httpStatus: null,
        networkStatus: isTimeout ? "INCONCLUSIVE" : "UNAVAILABLE",
        accessStatus: "UNVERIFIED",
        verificationStatus: isTimeout ? "INCONCLUSIVE" : "UNAVAILABLE",
        redirectCount,
        checkedAt,
        notes: isTimeout
          ? `Request timed out after ${timeoutMs}ms.`
          : `Network failure: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }
}
