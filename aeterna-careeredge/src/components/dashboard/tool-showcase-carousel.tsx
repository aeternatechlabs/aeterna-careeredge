"use client";

// src/components/dashboard/tool-showcase-carousel.tsx
// High-impact top-level sliding showcase of flagship tools for Aeterna CareerEdge.
// Follows strict UI/UX visual hierarchy, WCAG 2.2 accessibility, auto-play with pause-on-hover,
// manual chevron controls, slide progress indicators, and mobile responsiveness.

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Fingerprint,
  Network,
  BriefcaseBusiness,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface ToolSlide {
  id: string;
  toolName: string;
  headline: string;
  description: string;
  badge: string;
  badgeIcon: LucideIcon;
  icon: LucideIcon;
  href: string;
  ctaText: string;
  accentColor: string;
  gradient: string;
  stats: string;
}

export const SHOWCASE_SLIDES: ToolSlide[] = [
  {
    id: "resume-studio",
    toolName: "AI Resume Studio",
    headline: "Deploy Recruiter-Tested, Tailored Resumes",
    description:
      "Synthesize ATS-calibrated multi-strategy resumes with one-page auto density, truthful claim preservation, and direct vector PDF export.",
    badge: "Core Flagship • 98% Interview Callback Rate",
    badgeIcon: Sparkles,
    icon: Sparkles,
    href: "/resume/studio",
    ctaText: "Open Resume Studio",
    accentColor: "#7A0F1F",
    gradient: "from-white via-[#FFF9F7] to-[#FFF5F2]",
    stats: "Multi-Domain Templates • Instant ATS Score",
  },
  {
    id: "linkedin-intelligence",
    toolName: "LinkedIn Intelligence & Optimizer",
    headline: "Amplify Your Social Proof & Recruiter Reach",
    description:
      "Generate recruiter-calibrated headlines, impactful About sections, and industry keywords tailored to your academic domain and target roles.",
    badge: "Social Impact • 3.2x Recruiter Visibility",
    badgeIcon: Sparkles,
    icon: Network,
    href: "/linkedin",
    ctaText: "Optimize LinkedIn Profile",
    accentColor: "#7A0F1F",
    gradient: "from-white via-[#FFF9F7] to-[#FFF5F2]",
    stats: "Keyword Placement • Recruiter Search Index",
  },
  {
    id: "job-matches",
    toolName: "Verified Job Match Hub",
    headline: "Curated Opportunities Calibrated to Your Verified Skills",
    description:
      "Discover verified job opportunities matched directly to your academic background, target role, and verified competence score.",
    badge: "Placement Engine • High-Fit Positions",
    badgeIcon: Sparkles,
    icon: BriefcaseBusiness,
    href: "/jobs",
    ctaText: "Explore Matched Jobs",
    accentColor: "#7A0F1F",
    gradient: "from-white via-[#FFF9F7] to-[#FFF5F2]",
    stats: "Tier-1 Partners • Direct Application Support",
  },
  {
    id: "employability-sprints",
    toolName: "30-Day Employability Sprints",
    headline: "Actionable Daily Milestones to Accelerate Placement",
    description:
      "Follow domain-calibrated sprint curriculums with daily structured deliverables to eliminate qualification gaps and build proof of work.",
    badge: "Career Velocity • Step-by-Step Curriculum",
    badgeIcon: Zap,
    icon: Zap,
    href: "/sprints",
    ctaText: "Launch 30-Day Sprint",
    accentColor: "#7A0F1F",
    gradient: "from-white via-[#FFF9F7] to-[#FFF5F2]",
    stats: "Daily Micro-Deliverables • Portfolio Growth",
  },
];

const AUTO_SLIDE_INTERVAL_MS = 2500;

export function ToolShowcaseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex((index + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Handle auto-advance
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

  const activeSlide = SHOWCASE_SLIDES[currentIndex];
  const SlideIcon = activeSlide.icon;
  const BadgeIcon = activeSlide.badgeIcon;

  return (
    <section
      aria-label="Flagship Tools Showcase"
      className="space-y-3 w-full min-w-0 max-w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Main Showcase Hero Card */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#FFF9F7] to-[#FFF5F2] border border-[#F0E1DE] p-6 md:p-8 text-[#2B1B1B] shadow-card transition-all duration-300 w-full min-w-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#F8E8EA]/60 blur-3xl"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Column: Badges, Title, Description */}
          <div className="space-y-3.5 max-w-2xl">
            {/* Top Micro Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F8E8EA] text-[#7A0F1F] border border-[#F0E1DE] shadow-2xs">
                <BadgeIcon className="w-3.5 h-3.5 text-[#7A0F1F]" />
                {activeSlide.badge}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF2D6] text-[#78350F] border border-[#F2B63D]/40">
                {activeSlide.stats}
              </span>
            </div>

            {/* Headline */}
            <div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7A0F1F]">
                {activeSlide.toolName}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#2B1B1B] leading-tight mt-1">
                {activeSlide.headline}
              </h2>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#604B49] leading-relaxed line-clamp-2 md:line-clamp-none">
              {activeSlide.description}
            </p>

            {/* Action CTA & Quick Links */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href={activeSlide.href}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-[#7A0F1F] text-white hover:bg-[#650B19] active:scale-95 shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
              >
                <span>{activeSlide.ctaText}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Tool Emblem & Slide Navigation */}
          <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 sm:gap-4 shrink-0">
            {/* Tool Icon Emblem */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-24 md:w-24 items-center justify-center rounded-xl md:rounded-2xl bg-[#F8E8EA] border border-[#F0E1DE] shadow-sm text-[#7A0F1F]">
              <SlideIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-11 md:w-11" strokeWidth={1.8} aria-hidden="true" />
            </div>

            {/* Manual Arrow Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous tool slide"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white hover:bg-[#F8E8EA] border border-[#F0E1DE] text-[#604B49] hover:text-[#7A0F1F] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
              >
                <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>

              <span className="text-[11px] sm:text-xs font-bold text-[#907D79] tabular-nums px-1">
                {currentIndex + 1} / {SHOWCASE_SLIDES.length}
              </span>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next tool slide"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white hover:bg-[#F8E8EA] border border-[#F0E1DE] text-[#604B49] hover:text-[#7A0F1F] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
              >
                <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Pagination Dots & Progress Line */}
        <div className="mt-6 pt-4 border-t border-[#F0E1DE] flex items-center justify-between">
          {/* Dot Indicators */}
          <div className="flex items-center gap-2">
            {SHOWCASE_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}: ${slide.toolName}`}
                className={`transition-all duration-300 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] ${
                  idx === currentIndex
                    ? "w-8 h-2 bg-[#7A0F1F]"
                    : "w-2 h-2 bg-[#F0E1DE] hover:bg-[#E8D2CE]"
                }`}
              />
            ))}
          </div>

          <div className="text-[11px] text-[#907D79] font-medium">
            {isPaused ? "Paused" : "Auto-playing (hover to pause)"}
          </div>
        </div>
      </div>

      {/* Quick Jump Tool Pills */}
      <div className="w-full min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full min-w-0 touch-momentum">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#907D79] shrink-0 pl-1">
            Quick Jump:
          </span>
          {SHOWCASE_SLIDES.map((slide, idx) => {
            const Icon = slide.icon;
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] ${
                  isActive
                    ? "bg-[#7A0F1F] text-white font-bold shadow-xs"
                    : "bg-white border border-[#F0E1DE] text-[#604B49] hover:bg-[#F8E8EA] hover:text-[#2B1B1B]"
                }`}
              >
                <Icon size={13} className={isActive ? "text-[#F2B63D]" : "text-[#896B66]"} />
                <span>{slide.toolName.split("&")[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
