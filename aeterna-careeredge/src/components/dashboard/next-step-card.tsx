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
        {/* Background Hero Banner Student Photo (Real student on campus matching maroon brand)
            Desktop & Tablet (md, lg): Scaled cleanly to left so the student's face, smile and maroon jacket are prominently shown */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[220px] md:w-[250px] lg:w-[280px] pointer-events-none select-none overflow-hidden z-0">
          <Image
            src="/illustrations/hero-student-photo.png"
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

        {/* Mobile Background Illustration (< md): Atmospheric backdrop with gradient vignette for high text contrast */}
        <div className="md:hidden absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <Image
            src="/illustrations/hero-student-photo.png"
            alt=""
            fill
            priority
            className="object-cover object-center opacity-30"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#650B19] via-[#650B19]/75 to-[#650B19]/45"
            aria-hidden="true"
          />
        </div>

        {/* Decorative Background Shapes & Accents: Flowing curves, glowing orbs & gold stars */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          {/* Subtle Ambient Glowing Orbs */}
          <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-[#F2B33D]/12 blur-3xl" />
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-80 h-32 rounded-full bg-[#B91C1C]/20 blur-2xl" />

          {/* Flowing Curved Luminous Waves */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 hidden sm:block"
            viewBox="0 0 1000 160"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 180 160 C 360 30, 640 125, 1000 15"
              stroke="url(#goldCurveGrad)"
              strokeWidth="1.5"
            />
            <path
              d="M 240 160 C 440 60, 720 140, 1000 65"
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.35"
            />
            <defs>
              <linearGradient id="goldCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F2B33D" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Concentric Geometric Rings (Right side behind CTA) */}
          <svg
            className="absolute -right-8 top-1/2 -translate-y-1/2 w-64 h-64 opacity-15"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle cx="100" cy="100" r="45" stroke="#FFFFFF" strokeWidth="1" />
            <circle cx="100" cy="100" r="75" stroke="#F2B33D" strokeWidth="1" strokeDasharray="3 5" />
            <circle cx="100" cy="100" r="105" stroke="#FFFFFF" strokeWidth="0.75" />
          </svg>

          {/* Elegant 4-Point Gold Sparkles */}
          <svg
            className="absolute top-4 right-[28%] w-3 h-3 text-[#F2B33D] opacity-70 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
          <svg
            className="absolute bottom-4 right-16 w-2.5 h-2.5 text-[#F2B33D] opacity-50"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
          <svg
            className="absolute top-5 left-[40%] w-2 h-2 text-white opacity-40"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
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
