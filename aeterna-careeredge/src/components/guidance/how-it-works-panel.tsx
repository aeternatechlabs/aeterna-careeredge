"use client";

// src/components/guidance/how-it-works-panel.tsx
// Per-Section "How this works" Guidance Panel (Day 2 Section C4)
// Simple 3-point format: What this is / What to do / What you get.
// Persists dismiss state per user so it only displays automatically on first visit.

import { useState, useEffect } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Check, Sparkles } from "lucide-react";
import { GUIDE_SECTIONS } from "@/content/guide/en";

interface HowItWorksPanelProps {
  sectionId?: string;
  toolKey?: string;
  className?: string;
}

export function HowItWorksPanel({ sectionId, toolKey, className = "" }: HowItWorksPanelProps) {
  const activeId = sectionId || toolKey || "dashboard";
  const guide = GUIDE_SECTIONS[activeId];
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default closed until checked
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSeenStatus() {
      try {
        const res = await fetch(`/api/guide/seen-panel?panelId=${encodeURIComponent(activeId)}`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          // If never seen before, open by default
          if (!json.seen) {
            setIsOpen(true);
            setIsDismissed(false);
          } else {
            setIsDismissed(Boolean(json.dismissed));
            setIsOpen(!json.dismissed);
          }
        }
      } catch {
        // Fallback to closed
      } finally {
        setLoading(false);
      }
    }
    checkSeenStatus();
  }, [activeId]);

  async function handleDismiss() {
    setIsDismissed(true);
    setIsOpen(false);
    try {
      await fetch("/api/guide/seen-panel", {
          credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panelId: activeId, dismissed: true }),
      });
    } catch {
      // Ignore network failure
    }
  }

  if (!guide || loading) return null;

  return (
    <div className={`rounded-2xl border border-[#F0E1DE] bg-[#FFF9F7] shadow-xs transition-all ${className}`}>
      {/* Top Bar / Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-3 sm:py-3.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left text-sm font-semibold text-[#2B1B1B] hover:text-[#7A0F1F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] rounded-lg min-w-0"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F8E8EA] text-[#7A0F1F]">
            <HelpCircle size={15} />
          </div>
          <span className="truncate">How {guide.title} Works</span>
          <span className="rounded bg-[#F8E8EA] text-[#7A0F1F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 border border-[#E8D2CE]">
            Guide
          </span>
        </button>

        <div className="flex items-center gap-2">
          {isOpen && !isDismissed && (
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1 rounded-lg border border-[#F0E1DE] bg-white px-2.5 py-1 text-xs font-semibold text-[#604B49] hover:bg-[#F8E8EA] hover:text-[#7A0F1F] transition-colors"
            >
              <Check size={12} className="text-emerald-600" />
              <span className="hidden sm:inline">Got it, don&apos;t show again</span>
              <span className="sm:hidden">Dismiss</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Collapse panel" : "Expand panel"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#907D79] hover:bg-white transition-colors"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content: What this is / What to do / What you get */}
      {isOpen && (
        <div className="border-t border-[#F0E1DE] px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* 1. What this is */}
            <div className="rounded-xl bg-white p-4 border border-[#F0E1DE] shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A0F1F] mb-1.5">
                <Sparkles size={13} className="text-[#F2B63D]" />
                <span>What this is</span>
              </div>
              <p className="text-xs leading-relaxed text-[#604B49]">
                {guide.whatThisIs}
              </p>
            </div>

            {/* 2. What to do */}
            <div className="rounded-xl bg-white p-4 border border-[#F0E1DE] shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A0F1F] mb-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F8E8EA] text-[10px] font-bold text-[#7A0F1F] border border-[#E8D2CE]">
                  2
                </span>
                <span>What to do</span>
              </div>
              <p className="text-xs leading-relaxed text-[#604B49]">
                {guide.whatToDo}
              </p>
            </div>

            {/* 3. What you get */}
            <div className="rounded-xl bg-white p-4 border border-[#F0E1DE] shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                <Check size={13} className="text-emerald-600" />
                <span>What you get</span>
              </div>
              <p className="text-xs leading-relaxed text-[#604B49]">
                {guide.whatYouGet}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
