"use client";

// src/components/dashboard/next-step-card.tsx
// Section 2: "Do this next" Hero Banner matching the exact reference mockup:
// - Left/Center: Confident graduate character + Bengaluru Vidhana Soudha bathed in golden hour light
// - Smooth blend into rich deep maroon canvas with floating 4-point gold sparkle stars
// - Tag: "⚡ Do this next" in a translucent dark pill
// - High-contrast white rounded pill primary action button: "Review Now →"

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap } from "lucide-react";

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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[22px] bg-[#650B19] text-white shadow-md border border-[#520914] min-h-[140px] sm:min-h-[156px] flex items-center">
        {/* Background Hero Banner Illustration (Student + Vidhana Soudha)
            Displayed ONLY on md and lg screens, scaled cleanly to left so the boy's face and head are fully shown */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[240px] md:w-[270px] lg:w-[310px] pointer-events-none select-none overflow-hidden z-0">
          <Image
            src="/illustrations/hero-banner-student.png"
            alt=""
            fill
            priority
            className="object-contain object-left"
          />
          {/* Smooth gradient blend on the right edge into solid maroon #650B19 */}
          <div
            className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-[#650B19]"
            aria-hidden="true"
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 w-full p-5 sm:p-6 md:p-6 lg:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          {/* Left spacer on md/lg screens so text sits in the clear maroon area */}
          <div className="hidden md:block md:w-[200px] lg:w-[240px] shrink-0" aria-hidden="true" />

          {/* Action Text */}
          <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/10 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
              <Zap size={11} className="text-[#F2B33D] fill-[#F2B33D]" aria-hidden="true" />
              <span>Do this next</span>
            </div>

            <h2 className="font-heading text-xl sm:text-2xl md:text-2.5xl font-extrabold tracking-tight text-white drop-shadow-xs">
              {action.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#FBEFEC] leading-relaxed max-w-xl drop-shadow-xs line-clamp-2 md:line-clamp-1">
              {action.description}
            </p>
          </div>

          {/* Right: High-contrast White Pill Action Button */}
          <div className="shrink-0 w-full md:w-auto z-10">
            <Link
              href={action.actionRoute}
              className="group inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-xs sm:text-sm font-extrabold text-[#7A1A2B] shadow-md hover:bg-[#FFF5F2] active:bg-[#F9E8E8] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0 hover:shadow-lg"
            >
              <span>{action.actionLabel}</span>
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-1 text-[#7A1A2B]"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
