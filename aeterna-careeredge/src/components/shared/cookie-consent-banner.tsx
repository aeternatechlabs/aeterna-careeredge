"use client";

import { useEffect, useState, useId } from "react";
import Link from "next/link";
import { Shield, Cookie, Check, X, Settings2 } from "lucide-react";
import {
  getStoredConsent,
  saveStoredConsent,
  type CookieConsentState,
} from "@/lib/analytics/tracker";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Preference state inside customize modal
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [preferencesEnabled, setPreferencesEnabled] = useState(true);

  const modalTitleId = useId();
  const modalDescId = useId();

  useEffect(() => {
    setMounted(true);
    const existing = getStoredConsent();
    if (!existing) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setAnalyticsEnabled(existing.analytics);
      setPreferencesEnabled(existing.preferences);
    }
  }, []);

  // Listen for custom trigger to reopen cookie settings from footer
  useEffect(() => {
    function handleOpenPreferences() {
      const existing = getStoredConsent();
      if (existing) {
        setAnalyticsEnabled(existing.analytics);
        setPreferencesEnabled(existing.preferences);
      }
      setShowModal(true);
      setVisible(false);
    }

    window.addEventListener("careeredge:open-cookie-preferences", handleOpenPreferences);
    return () => {
      window.removeEventListener("careeredge:open-cookie-preferences", handleOpenPreferences);
    };
  }, []);

  // Handle ESC key to close customize modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  if (!mounted) return null;
  if (!visible && !showModal) return null;

  function handleAcceptAll() {
    saveStoredConsent({ analytics: true, preferences: true });
    setVisible(false);
    setShowModal(false);
  }

  function handleRejectOptional() {
    saveStoredConsent({ analytics: false, preferences: false });
    setVisible(false);
    setShowModal(false);
  }

  function handleSaveCustom() {
    saveStoredConsent({
      analytics: analyticsEnabled,
      preferences: preferencesEnabled,
    });
    setVisible(false);
    setShowModal(false);
  }

  return (
    <>
      {/* ── Banner View ──────────────────────────────────────────────────────── */}
      {visible && !showModal && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:left-6 md:right-6"
        >
          <div className="rounded-2xl border border-[#EBDDD1] bg-white/95 p-5 shadow-2xl backdrop-blur-md dark:bg-slate-900/95 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCE9E8] text-[#7A0F1F]">
                  <Cookie size={20} aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-sm font-bold text-[#2B1B1B] dark:text-white">
                    We value your privacy & transparency
                  </h3>
                  <p className="text-xs leading-relaxed text-[#765F5D] dark:text-slate-300">
                    We use essential cookies to maintain secure sessions and platform operations.
                    With your permission, we also use privacy-friendly analytics cookies to improve our career tools.
                    Review our{" "}
                    <Link
                      href="/privacy-policy"
                      className="font-medium text-[#7A0F1F] underline hover:text-[#520914] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[#EBDDD1] bg-white px-3.5 text-xs font-semibold text-[#352020] transition-colors hover:bg-[#FDF7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  <Settings2 size={14} className="mr-1.5 text-[#765F5D]" aria-hidden="true" />
                  Customize
                </button>

                <button
                  type="button"
                  onClick={handleRejectOptional}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[#EBDDD1] bg-white px-3.5 text-xs font-semibold text-[#765F5D] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  Reject Optional
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-[#7A0F1F] px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#520914] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ── Customize Preferences Modal ───────────────────────────────────────── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          aria-describedby={modalDescId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-[#EBDDD1] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-[#EBDDD1]/60 pb-4">
              <div className="flex items-center gap-2.5">
                <Shield size={20} className="text-[#7A0F1F]" aria-hidden="true" />
                <h2
                  id={modalTitleId}
                  className="font-heading text-base font-bold text-[#2B1B1B] dark:text-white"
                >
                  Cookie & Privacy Preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-[#765F5D] hover:bg-slate-100 hover:text-[#2B1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
                aria-label="Close preferences modal"
              >
                <X size={18} />
              </button>
            </div>

            <p id={modalDescId} className="mt-3 text-xs text-[#765F5D] dark:text-slate-300">
              Manage how cookies and pseudonymized data are handled on your device. Essential cookies
              are strictly necessary for account security and cannot be disabled.
            </p>

            <div className="mt-5 space-y-3.5">
              {/* Essential */}
              <div className="rounded-xl border border-slate-100 bg-[#FDFBF7] p-3.5 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2B1B1B] dark:text-white">
                      Strictly Necessary Cookies
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Always Active
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#765F5D] dark:text-slate-400">
                  Required for user authentication (<code className="font-mono">ace_session</code>),
                  CSRF security protection, and encrypted session continuity.
                </p>
              </div>

              {/* Analytics */}
              <div className="rounded-xl border border-[#EBDDD1] bg-white p-3.5 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2B1B1B] dark:text-white">
                    Analytics & Performance Cookies
                  </span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-[#7A0F1F] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#765F5D] dark:text-slate-400">
                  Enables anonymous telemetry regarding feature usage, helping us identify broken paths
                  and optimize AI resume workflows. No personal student data is transmitted.
                </p>
              </div>

              {/* Preferences */}
              <div className="rounded-xl border border-[#EBDDD1] bg-white p-3.5 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2B1B1B] dark:text-white">
                    Preferences & Functional Cookies
                  </span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={preferencesEnabled}
                      onChange={(e) => setPreferencesEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-[#7A0F1F] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#765F5D] dark:text-slate-400">
                  Stores interface choices, such as theme, collapsed sidebar state, and language
                  preferences locally on your browser.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRejectOptional}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[#EBDDD1] px-4 text-xs font-semibold text-[#765F5D] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-[#7A0F1F] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#520914] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
              >
                <Check size={14} className="mr-1.5" />
                Save My Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
