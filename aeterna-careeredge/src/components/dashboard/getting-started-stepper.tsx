"use client";

// src/components/dashboard/getting-started-stepper.tsx
// Section 3: Getting Started Stepper matching the reference design on all screens:
// - Header: "Getting started • 3 of 6 done" with light pink pill badge
// - Desktop & Tablet: 6 equal-width cards in a clean row (Done: green check, Active: gold border/tint with gold circular icon, Upcoming: neutral circle)
// - Mobile: Connected timeline progress track matching the screenshot, with interactive step cards

import React from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { StepperActiveGoldIcon } from "./dashboard-illustrations";

export interface StepperMilestone {
  id: string;
  stepNumber: number;
  title: string;
  isComplete: boolean;
  route: string;
}

interface GettingStartedStepperProps {
  milestones: StepperMilestone[];
}

export function GettingStartedStepper({ milestones }: GettingStartedStepperProps) {
  const completedCount = milestones.filter((m) => m.isComplete).length;
  const totalCount = milestones.length;

  // The first incomplete step is "Current"
  const currentStepIndex = milestones.findIndex((m) => !m.isComplete);
  const activeIndex = currentStepIndex === -1 ? totalCount - 1 : currentStepIndex;

  return (
    <section aria-label="Getting started milestones" className="w-full space-y-3">
      {/* Header with single progress badge: "Getting started" + "3 of 6 done ✓" */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-base sm:text-lg font-bold text-[#2A1417] tracking-tight">
          Getting started
        </h2>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF7F0] border border-[#1F8A5B]/20 px-3 py-1 text-xs font-bold text-[#1F8A5B]">
          <span>
            {completedCount} of {totalCount} done
          </span>
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1F8A5B] text-white">
            <Check size={10} className="stroke-[3]" aria-hidden="true" />
          </div>
        </span>
      </div>

      {/* ============================================================
          DESKTOP & TABLET VIEW (>= 640px): 6 Equal-Width Cards with Chevrons
      ============================================================ */}
      <div className="hidden sm:flex sm:items-center sm:gap-1.5 lg:gap-2.5 w-full">
        {milestones.map((milestone, idx) => {
          const isDone = milestone.isComplete;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={milestone.id}>
              <Link
                href={milestone.route}
                aria-current={isCurrent ? "step" : undefined}
                className={`group relative flex-1 flex flex-col items-center justify-center rounded-2xl p-2.5 sm:p-3 lg:p-4 text-center transition-all duration-200 min-h-[108px] sm:min-h-[116px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B] ${
                  isDone
                    ? "bg-white border border-[#F0DFDC] hover:border-[#1F8A5B]/40 hover:shadow-xs shadow-2xs"
                    : isCurrent
                      ? "bg-[#FFF9EC] border-2 border-[#F2B33D] shadow-xs"
                      : "bg-white border border-[#F0DFDC] hover:border-[#7A1A2B]/30 hover:shadow-xs shadow-2xs"
                }`}
              >
                {/* Step State Icon */}
                <div className="mb-2 flex items-center justify-center">
                  {isDone ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1F8A5B] text-white shadow-xs">
                      <Check size={14} className="stroke-[3]" aria-hidden="true" />
                    </div>
                  ) : isCurrent ? (
                    <StepperActiveGoldIcon className="w-7 h-7" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#D8C7C4] bg-white text-[#907D79]">
                      <span className="sr-only">Step {milestone.stepNumber}</span>
                    </div>
                  )}
                </div>

                {/* Step Title */}
                <span
                  className={`text-[11px] sm:text-xs lg:text-[13px] font-bold leading-tight line-clamp-2 transition-colors ${
                    isDone
                      ? "text-[#2A1417]"
                      : isCurrent
                        ? "text-[#2A1417]"
                        : "text-[#6F5A5D] group-hover:text-[#2A1417]"
                  }`}
                >
                  {milestone.title}
                </span>
              </Link>

              {/* Connecting Chevron '>' between cards on desktop */}
              {idx < milestones.length - 1 && (
                <div className="text-[#D8C7C4] shrink-0" aria-hidden="true">
                  <ChevronRight size={14} className="opacity-70" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ============================================================
          MOBILE VIEW (< 640px):
          1. Connected Progress Track Timeline (exact match to mobile mockup)
          2. Swipeable / Tap cards container
      ============================================================ */}
      <div className="sm:hidden space-y-2.5">
        {/* Connected Step Dots Progress Track Card */}
        <div className="rounded-2xl border border-[#F0DFDC] bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between px-1">
            {milestones.map((m, idx) => {
              const isDone = m.isComplete;
              const isCurrent = idx === activeIndex;

              return (
                <React.Fragment key={m.id}>
                  {/* Node Circle */}
                  <Link
                    href={m.route}
                    aria-label={`Step ${m.stepNumber}: ${m.title}`}
                    className="flex flex-col items-center shrink-0"
                  >
                    {isDone ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F8A5B] text-white shadow-2xs">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#F2B33D] bg-[#FFF9EC] text-[#F2B33D]">
                        <span className="h-2 w-2 rounded-full bg-[#F2B33D]" />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#D8C7C4] bg-white" />
                    )}
                  </Link>

                  {/* Connecting Line between nodes */}
                  {idx < milestones.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                        idx < activeIndex
                          ? "bg-[#1F8A5B]"
                          : idx === activeIndex - 1
                            ? "bg-[#F2B33D]"
                            : "bg-[#E8D2CE]"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Current Step Callout on Mobile */}
          <div className="mt-3 pt-2.5 border-t border-[#F0DFDC] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-[#F2B33D] tracking-wider block">
                Current Step ({activeIndex + 1} of {totalCount})
              </span>
              <p className="text-xs font-bold text-[#2A1417] truncate">
                {milestones[activeIndex]?.title}
              </p>
            </div>
            <Link
              href={milestones[activeIndex]?.route || "/resume/studio"}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1A2B] shrink-0 hover:underline"
            >
              <span>Continue</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Horizontal Swipeable Track of Full Cards on Mobile with visible horizontal scrollbar */}
        <div className="flex gap-2.5 overflow-x-auto pb-2.5 pt-0.5 snap-x snap-mandatory ce-horizontal-scrollbar">
          {milestones.map((milestone, idx) => {
            const isDone = milestone.isComplete;
            const isCurrent = idx === activeIndex;

            return (
              <Link
                key={milestone.id}
                href={milestone.route}
                className={`flex flex-col items-center justify-center rounded-2xl p-3 text-center min-w-[124px] snap-start shrink-0 min-h-[96px] transition-all ${
                  isDone
                    ? "bg-white border border-[#F0DFDC] shadow-2xs"
                    : isCurrent
                      ? "bg-[#FFF9EC] border-2 border-[#F2B33D] shadow-xs"
                      : "bg-white border border-[#F0DFDC] shadow-2xs"
                }`}
              >
                <div className="mb-2">
                  {isDone ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F8A5B] text-white">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <StepperActiveGoldIcon className="w-6 h-6" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#D8C7C4] bg-white" />
                  )}
                </div>
                <span className="text-xs font-bold text-[#2A1417] leading-tight line-clamp-2">
                  {milestone.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
