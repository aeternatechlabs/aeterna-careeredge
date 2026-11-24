// src/lib/analytics/tracker.ts
// Privacy-Friendly, Consent-Aware Pseudonymous Telemetry

export interface CookieConsentState {
  essential: boolean; // Always true
  analytics: boolean;
  preferences: boolean;
  timestamp: string | null;
}

const STORAGE_KEY = "careeredge_cookie_consent";

export function getStoredConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      essential: true, // Non-negotiable for authentication
      analytics: Boolean(parsed.analytics),
      preferences: Boolean(parsed.preferences),
      timestamp: parsed.timestamp || null,
    };
  } catch {
    return null;
  }
}

export function saveStoredConsent(consent: {
  analytics: boolean;
  preferences: boolean;
}): CookieConsentState {
  const state: CookieConsentState = {
    essential: true,
    analytics: consent.analytics,
    preferences: consent.preferences,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Notify components and listeners
      window.dispatchEvent(
        new CustomEvent("careeredge:consent-updated", { detail: state })
      );
    } catch {
      // Storage unavailable / private mode
    }
  }

  return state;
}

/**
 * Pseudonymous event tracking. Strictly respects user cookie consent.
 * Emits zero network calls if analytics consent has not been granted.
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  if (typeof window === "undefined") return;

  const consent = getStoredConsent();
  if (!consent || !consent.analytics) {
    // Strictly do not track without explicit user consent
    return;
  }

  const payload = {
    event: eventName,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    properties: sanitizeProperties(properties || {}),
  };

  // Dispatch custom client event for extensible analytics integrations
  window.dispatchEvent(
    new CustomEvent("careeredge:telemetry", { detail: payload })
  );

  // In production, integrate with lightweight privacy-first telemetry endpoint if configured
  if (process.env.NODE_ENV === "production" && window.location.hostname !== "localhost") {
    // Beacon or background dispatch could be plugged here without third-party tracking scripts
  }
}

/**
 * Ensure no PII (email, phone, student names) is ever accidentally tracked.
 */
function sanitizeProperties(
  props: Record<string, string | number | boolean | null | undefined>
) {
  const sanitized: Record<string, string | number | boolean> = {};
  const forbiddenKeys = ["email", "phone", "mobile", "name", "password", "token"];

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    if (forbiddenKeys.some((f) => key.toLowerCase().includes(f))) continue;
    sanitized[key] = value;
  }

  return sanitized;
}
