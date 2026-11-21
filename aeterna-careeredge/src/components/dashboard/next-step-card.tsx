"use client";

// src/components/dashboard/next-step-card.tsx
// Section 2: "Do this next" - The single most prominent element on the dashboard.
// Full-width maroon card with decorative illustration, priority action title,
// explanatory text, and high-contrast white primary action button.

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { NextActionIllustration } from "./dashboard-illustrations";

export interface NextActionData {
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
  badgeText?: string;
}

interface NextStepCardProps {
  action: NextActionData;
}

export function NextStepCard({ action }: NextStepCardProps) {
  return (
    <section aria-label="Do this next" className="w-full">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[22px] bg-gradient-to-r from-[#7A1A2B] via-[#821D2F] to-[#6E1423] p-5 sm:p-6 md:p-7 text-white shadow-sm border border-[#650B19]/40">
        {/* Subtle decorative curved ambient light */}
        <div
          className="pointer-events-none absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-white/5 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          {/* Left: Illustration + Text in one row on desktop */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Visual Icon / Illustration container */}
            <div className="shrink-0 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xs p-1 border border-white/15 shadow-inner">
              <NextActionIllustration className="w-12 h-12 sm:w-14 sm:h-14" />
            </div>

            {/* Action Text */}
            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                <Sparkles size={11} className="text-[#F2B33D]" aria-hidden="true" />
                <span>Do this next</span>
              </div>

              <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white truncate">
                {action.title}
              </h2>

              <p className="text-xs sm:text-sm text-[#FBEFEC]/90 leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-1">
                {action.description}
              </p>
            </div>
          </div>

          {/* Right / Bottom: White primary action button */}
          <div className="shrink-0 w-full sm:w-auto">
            <Link
              href={action.actionRoute}
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#7A1A2B] shadow-sm hover:bg-[#FFF5F2] active:bg-[#F9E8E8] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>{action.actionLabel}</span>
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5 text-[#7A1A2B]"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
