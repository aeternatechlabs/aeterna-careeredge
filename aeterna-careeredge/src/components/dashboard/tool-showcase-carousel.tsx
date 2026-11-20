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
    id: "resume-builder",
    toolName: "Resume Studio & ATS Builder",
    headline: "Craft Multi-Domain, ATS-Proof Resumes",
    description:
      "Choose domain-tailored templates, enhance bullets with AI guidance, and export print-perfect ATS-compliant PDFs with selectable text.",
    badge: "Core Flagship • 98% Interview Callback Rate",
    badgeIcon: Sparkles,
    icon: FileText,
    href: "/resume",
    ctaText: "Open Resume Studio",
    accentColor: "#2563EB",
    gradient: "from-[#0B132B] via-[#0F172A] to-[#1E293B]",
    stats: "Multi-Domain Templates • Instant ATS Score",
  },
  {
    id: "career-passport",
    toolName: "Universal Career Passport",
    headline: "Verified Academic & Professional Source of Truth",
    description:
      "Curate and manage your education records, competency matrices, practical projects, and certifications in one tamper-resistant profile.",
    badge: "Master Profile • Shareable Credentials",
    badgeIcon: Fingerprint,
    icon: Fingerprint,
    href: "/passport",
    ctaText: "Manage Career Passport",
    accentColor: "#2563EB",
    gradient: "from-[#0F172A] via-[#1E293B] to-[#0B132B]",
    stats: "Full CRUD Control • Real-Time Readiness Score",
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
    accentColor: "#0A66C2",
    gradient: "from-[#0B132B] via-[#0F172A] to-[#1E3A8A]",
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
    accentColor: "#2563EB",
    gradient: "from-[#0B132B] via-[#1E293B] to-[#0F172A]",
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
    accentColor: "#2563EB",
    gradient: "from-[#0F172A] via-[#0B132B] to-[#1E293B]",
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
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${activeSlide.gradient} border border-white/15 p-6 md:p-8 text-white shadow-lg transition-all duration-300 w-full min-w-0`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Column: Badges, Title, Description */}
          <div className="space-y-3.5 max-w-2xl">
            {/* Top Micro Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                <BadgeIcon className="w-3.5 h-3.5" />
                {activeSlide.badge}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/90 border border-white/15">
                {activeSlide.stats}
              </span>
            </div>

            {/* Headline */}
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-sky-400">
                {activeSlide.toolName}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight mt-1">
                {activeSlide.headline}
              </h2>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 md:line-clamp-none">
              {activeSlide.description}
            </p>

            {/* Action CTA & Quick Links */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href={activeSlide.href}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-900/30 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>{activeSlide.ctaText}</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                href="/passport"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                <span>View Career Passport</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Tool Emblem & Slide Navigation */}
          <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 sm:gap-4 shrink-0">
            {/* Tool Icon Emblem - Adjusted for below md screen */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-24 md:w-24 items-center justify-center rounded-xl md:rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-inner text-[#38BDF8]">
              <SlideIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-11 md:w-11" strokeWidth={1.8} aria-hidden="true" />
            </div>

            {/* Manual Arrow Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous tool slide"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                <ChevronLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>

              <span className="text-[11px] sm:text-xs font-bold text-white/80 tabular-nums px-1">
                {currentIndex + 1} / {SHOWCASE_SLIDES.length}
              </span>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next tool slide"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                <ChevronRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Pagination Dots & Progress Line */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          {/* Dot Indicators */}
          <div className="flex items-center gap-2">
            {SHOWCASE_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}: ${slide.toolName}`}
                className={`transition-all duration-300 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                  idx === currentIndex
                    ? "w-8 h-2 bg-[#38BDF8]"
                    : "w-2 h-2 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <div className="text-[11px] text-white/60 font-medium">
            {isPaused ? "Paused" : "Auto-playing (hover to pause)"}
          </div>
        </div>
      </div>

      {/* Quick Jump Tool Pills */}
      <div className="w-full min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full min-w-0 touch-momentum">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-text shrink-0 pl-1">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-[#4C0915] text-[#F2B63D] font-bold shadow-xs"
                    : "bg-surface-card border border-border text-secondary-text hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <Icon size={13} className={isActive ? "text-[#F2B63D]" : "text-muted-text"} />
                <span>{slide.toolName.split("&")[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
