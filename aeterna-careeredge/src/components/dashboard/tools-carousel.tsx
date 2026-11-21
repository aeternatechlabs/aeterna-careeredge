"use client";

// src/components/dashboard/tools-carousel.tsx
// Section 5: "Tools for your career" Carousel with 3D-meets-editorial AI visual assets:
// 1. Resume Studio (/illustrations/resume-studio.png)
// 2. Interview Prep (/illustrations/interview-prep.png)
// 3. LinkedIn Optimizer (/illustrations/linkedin-optimizer.png)
// 4. Job Match (/illustrations/job-match.png)
// 5. 30-Day Sprint (/illustrations/sprint.png)

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export interface CarouselSlide {
  id: string;
  category: string;
  title: string;
  description: string;
  actionText: string;
  href: string;
  imageSrc: string;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: "resume-studio",
    category: "Build",
    title: "Resume Studio",
    description: "Create a standout resume.",
    actionText: "Open Tool",
    href: "/resume/studio",
    imageSrc: "/illustrations/resume-studio.png",
  },
  {
    id: "interview-prep",
    category: "Prepare",
    title: "Interview Prep",
    description: "Ace your technical & HR rounds.",
    actionText: "Prepare Now",
    href: "/interview-prep",
    imageSrc: "/illustrations/interview-prep.png",
  },
  {
    id: "linkedin-optimizer",
    category: "Improve",
    title: "LinkedIn Optimizer",
    description: "Boost your profile.",
    actionText: "Optimize",
    href: "/linkedin",
    imageSrc: "/illustrations/linkedin-optimizer.png",
  },
  {
    id: "job-match",
    category: "Jobs",
    title: "Job Match",
    description: "Find the right jobs.",
    actionText: "View Matches",
    href: "/jobs",
    imageSrc: "/illustrations/job-match.png",
  },
  {
    id: "sprint",
    category: "Get ready",
    title: "30-Day Sprint",
    description: "Build skills in 30 days.",
    actionText: "Start Sprint",
    href: "/sprints",
    imageSrc: "/illustrations/sprint.png",
  },
];

export function ToolsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const totalSlides = CAROUSEL_SLIDES.length;

  const scrollToSlide = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const boundedIndex = Math.max(0, Math.min(index, totalSlides - 1));
      const card = container.children[boundedIndex] as HTMLElement | undefined;
      if (card) {
        container.scrollTo({
          left: card.offsetLeft - container.offsetLeft,
          behavior: "smooth",
        });
        setActiveIndex(boundedIndex);
      }
    },
    [totalSlides]
  );

  const handlePrev = () => {
    const newIdx = (activeIndex - 1 + totalSlides) % totalSlides;
    scrollToSlide(newIdx);
  };

  const handleNext = useCallback(() => {
    const newIdx = (activeIndex + 1) % totalSlides;
    scrollToSlide(newIdx);
  }, [activeIndex, totalSlides, scrollToSlide]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const itemWidth = container.children[0]?.clientWidth || 300;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < totalSlides && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;
    }

    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Tools for your career"
      className="relative w-full space-y-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Header with Title & "< 1 / 5 >" Controls */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-base sm:text-lg font-bold text-[#2A1417] tracking-tight">
          Tools for your career
        </h2>

        {/* Counter and Arrows in Header */}
        <div className="flex items-center gap-1.5 text-xs text-[#6F5A5D]">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-[#F0DFDC] bg-white text-[#6F5A5D] hover:bg-[#FFF9F7] hover:text-[#2A1417] transition shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>

          <span className="font-semibold px-1 text-[11px] sm:text-xs min-w-[36px] text-center" aria-live="polite">
            {activeIndex + 1} / {totalSlides}
          </span>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-[#F0DFDC] bg-white text-[#6F5A5D] hover:bg-[#FFF9F7] hover:text-[#2A1417] transition shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Carousel Track Container */}
      <div className="relative group/track">
        {/* Subtle Side Floating Chevrons */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full border border-[#F0DFDC] bg-white text-[#6F5A5D] shadow-xs hover:bg-[#FFF9F7] hover:text-[#7A1A2B] transition-all opacity-80 hover:opacity-100"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full border border-[#F0DFDC] bg-white text-[#6F5A5D] shadow-xs hover:bg-[#FFF9F7] hover:text-[#7A1A2B] transition-all opacity-80 hover:opacity-100"
        >
          <ChevronRight size={16} />
        </button>

        {/* Scroll Track with CSS Scroll Snap */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory pt-0.5"
        >
          {CAROUSEL_SLIDES.map((slide, idx) => {
            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} of ${totalSlides}: ${slide.title}`}
                className="min-w-full sm:min-w-[calc(50%-6px)] lg:min-w-[calc(33.333%-8px)] snap-start shrink-0"
              >
                <div className="group relative flex h-full items-center justify-between rounded-2xl border border-[#F0DFDC] bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-[#7A1A2B]/40 hover:shadow-card min-h-[156px] sm:min-h-[164px]">
                  {/* Left: Text & Action Button */}
                  <div className="flex flex-col justify-between h-full space-y-3 min-w-0 pr-2">
                    <div className="space-y-1.5">
                      {/* Category Chip (soft blush pill) */}
                      <span className="inline-block rounded-full bg-[#F9E8E8] px-2.5 py-0.5 text-[10px] font-bold text-[#7A1A2B]">
                        {slide.category}
                      </span>

                      {/* Tool Title */}
                      <h3 className="font-heading text-sm sm:text-base font-bold text-[#2A1417] group-hover:text-[#7A1A2B] transition-colors truncate">
                        {slide.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-[#6F5A5D] line-clamp-2 leading-relaxed">
                        {slide.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div>
                      <Link
                        href={slide.href}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#7A1A2B] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#650B19] active:bg-[#4C0915] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
                      >
                        <span>{slide.actionText}</span>
                        <ArrowRight size={12} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  {/* Right: Transparent Cutout 3D Visual Asset (Increased Size) */}
                  <div className="shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center pl-1">
                    <Image
                      src={slide.imageSrc}
                      alt=""
                      width={112}
                      height={112}
                      className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dot Indicators */}
      <div className="flex justify-center items-center gap-1.5 pt-1">
        {CAROUSEL_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-200 h-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B] ${
              idx === activeIndex
                ? "w-6 bg-[#7A1A2B]"
                : "w-2 bg-[#E8D2CE] hover:bg-[#B8A9A5]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
