// src/lib/interview/resources/url-safety.ts
// URL Normalization, Canonicalization & SSRF Protection Utilities (Phase 4B.2)
// Fail-closed for private/loopback/NAT64/internal hosts and restricted allowlists on Cloudflare Workers.

const TRACKING_PARAM_PREFIXES = ["utm_", "mc_", "fbclid", "gclid", "igshid", "ref_src"];
const EXACT_TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "yclid",
  "_hsenc",
  "_hsmi",
]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
  "metadata",
]);

const INTERNAL_HOST_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home", ".arpa"];

function parseIpv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    nums.push(n);
  }
  return nums;
}

export function isPrivateOrReservedIpv4(host: string): boolean {
  const octets = parseIpv4(host);
  if (!octets) return false;
  const [a, b] = octets;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a >= 224) return true; // Multicast & reserved
  return false;
}

/**
 * Expand compressed or uncompressed IPv6 (including embedded IPv4 tail) into 8 16-bit groups.
 * Returns null if not a valid IPv6 literal.
 */
export function expandIpv6Groups(host: string): number[] | null {
  const clean = host.replace(/^\[|\]$/g, "").split("%")[0].toLowerCase();
  if (!clean.includes(":")) return null;

  const doubleColonParts = clean.split("::");
  if (doubleColonParts.length > 2) return null;

  const parseSide = (side: string): number[] | null => {
    if (!side) return [];
    const tokens = side.split(":");
    const groups: number[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.includes(".")) {
        // Embedded IPv4 only valid at the end
        if (i !== tokens.length - 1) return null;
        const v4 = parseIpv4(tok);
        if (!v4) return null;
        groups.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]);
      } else {
        if (!/^[0-9a-f]{1,4}$/i.test(tok)) return null;
        groups.push(parseInt(tok, 16));
      }
    }
    return groups;
  };

  if (doubleColonParts.length === 1) {
    const groups = parseSide(doubleColonParts[0]);
    return groups && groups.length === 8 ? groups : null;
  }

  const left = parseSide(doubleColonParts[0]);
  const right = parseSide(doubleColonParts[1]);
  if (!left || !right) return null;
  const missing = 8 - (left.length + right.length);
  if (missing < 1) return null;
  return [...left, ...Array(missing).fill(0), ...right];
}

export function isPrivateOrReservedIpv6(host: string): boolean {
  const groups = expandIpv6Groups(host);
  if (!groups) return false;

  // :: (unspecified)
  if (groups.every((g) => g === 0)) return true;

  // ::1 or 0:0:0:0:0:0:0:1 (loopback)
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true;

  // fc00::/7 (Unique Local Addresses)
  if ((groups[0] & 0xfe00) === 0xfc00) return true;

  // fe80::/10 (Link-local)
  if ((groups[0] & 0xffc0) === 0xfe80) return true;

  // ::ffff:0:0/96 (IPv4-mapped IPv6) — check embedded IPv4 or block private/reserved
  if (
    groups.slice(0, 5).every((g) => g === 0) &&
    groups[5] === 0xffff
  ) {
    const v4Host = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;
    if (isPrivateOrReservedIpv4(v4Host)) return true;
  }

  // 64:ff9b::/96 (Well-known NAT64 prefix — prevent reaching private IPv4 via translation)
  if (
    groups[0] === 0x0064 &&
    groups[1] === 0xff9b &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0
  ) {
    return true;
  }

  return false;
}

export interface UrlValidationOptions {
  requireHttps?: boolean;
  /** When true, allowedHostnames MUST be non-empty and hostname must match exact or dot-boundary subdomain */
  requireAllowlist?: boolean;
  allowedHostnames?: ReadonlySet<string>;
}

export type UrlValidationResult =
  | { ok: true; canonicalUrl: string; hostname: string }
  | { ok: false; reason: string };

export function isHostnameAllowlisted(
  hostname: string,
  allowedHostnames: ReadonlySet<string>
): boolean {
  const normHost = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!normHost || allowedHostnames.size === 0) return false;

  for (const rawAllowed of allowedHostnames) {
    const normAllowed = rawAllowed.trim().toLowerCase().replace(/\.$/, "");
    if (!normAllowed) continue;
    if (normHost === normAllowed || normHost.endsWith(`.${normAllowed}`)) {
      return true;
    }
  }
  return false;
}

/**
 * Validate and normalize a URL:
 * - Requires HTTPS by default
 * - Rejects credentials, localhost, internal suffixes, IPv4/IPv6 private, loopback & NAT64 addresses
 * - Enforces allowlist when requireAllowlist is true or allowedHostnames is provided
 * - Strips tracking params (utm_*, fbclid, gclid, etc.) & normalizes trailing slashes
 */
export function validateAndNormalizeUrl(
  rawUrl: string,
  options: UrlValidationOptions = {}
): UrlValidationResult {
  const requireHttps = options.requireHttps ?? true;
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { ok: false, reason: "Empty URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "Malformed URL" };
  }

  const scheme = parsed.protocol.toLowerCase();
  if (scheme !== "https:" && scheme !== "http:") {
    return { ok: false, reason: `Unsupported protocol: ${scheme}` };
  }
  if (requireHttps && scheme !== "https:") {
    return { ok: false, reason: "HTTPS is required for catalogue URLs" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URL credentials are not allowed" };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname) {
    return { ok: false, reason: "Missing hostname" };
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, reason: `Blocked internal hostname: ${hostname}` };
  }
  if (INTERNAL_HOST_SUFFIXES.some((s) => hostname.endsWith(s))) {
    return { ok: false, reason: `Blocked internal domain suffix: ${hostname}` };
  }
  if (isPrivateOrReservedIpv4(hostname) || isPrivateOrReservedIpv6(hostname)) {
    return { ok: false, reason: `Blocked private, loopback, or reserved IP address: ${hostname}` };
  }

  if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname)) {
    return { ok: false, reason: "Numeric or hex IP hostnames are not allowed" };
  }

  if (options.requireAllowlist || options.allowedHostnames !== undefined) {
    if (!options.allowedHostnames || options.allowedHostnames.size === 0) {
      return {
        ok: false,
        reason: "Hostname allowlist is empty; failing closed.",
      };
    }
    if (!isHostnameAllowlisted(hostname, options.allowedHostnames)) {
      return {
        ok: false,
        reason: `Hostname ${hostname} is not in the approved verification allowlist`,
      };
    }
  }

  // Strip tracking query parameters while preserving meaningful ones in sorted order
  const keptParams: Array<[string, string]> = [];
  parsed.searchParams.forEach((val, key) => {
    const k = key.toLowerCase();
    const isTracking =
      EXACT_TRACKING_PARAMS.has(k) ||
      TRACKING_PARAM_PREFIXES.some((prefix) => k.startsWith(prefix));
    if (!isTracking) {
      keptParams.push([key, val]);
    }
  });
  keptParams.sort((a, b) => a[0].localeCompare(b[0]));

  const normalizedSearch =
    keptParams.length > 0 ? `?${new URLSearchParams(keptParams).toString()}` : "";

  let pathname = parsed.pathname || "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const portPart =
    parsed.port &&
    !((scheme === "https:" && parsed.port === "443") || (scheme === "http:" && parsed.port === "80"))
      ? `:${parsed.port}`
      : "";

  const canonicalUrl = `${scheme}//${hostname}${portPart}${pathname}${normalizedSearch}`;
  return { ok: true, canonicalUrl, hostname };
}

/**
 * Detect duplicate canonical URLs across a list of resource entries.
 */
export function findDuplicateCanonicalUrls(
  urls: string[]
): { unique: string[]; duplicates: string[] } {
  const seen = new Set<string>();
  const unique: string[] = [];
  const duplicates: string[] = [];

  for (const u of urls) {
    const res = validateAndNormalizeUrl(u, { requireHttps: false });
    const key = res.ok ? res.canonicalUrl : u.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
      unique.push(key);
    }
  }
  return { unique, duplicates };
}
