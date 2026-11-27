"use client";

import React from "react";
import { Check } from "lucide-react";

export interface WizardStepItem {
  id: number;
  title: string;
  shortTitle: string;
}

interface StepIndicatorProps {
  steps: readonly WizardStepItem[];
  currentStep: number;
  onStepClick?: (idx: number) => void;
  canJumpTo?: (idx: number) => boolean;
}

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  canJumpTo,
}: StepIndicatorProps) {
  const pct = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-[#59413F]">
        <span className="inline-flex items-center rounded-full bg-[#FFF0C7] px-2.5 py-0.5 font-bold text-[#4C0915]">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span>{pct}% complete</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full rounded-full bg-[#F8EFE7] overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-[#7A0F1F] transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {steps.map((s, idx) => {
          const active = idx === currentStep;
          const completed = idx < currentStep;
          const allowed = canJumpTo ? canJumpTo(idx) : idx <= currentStep;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!allowed}
              onClick={() => onStepClick?.(idx)}
              className={`min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] ${
                active
                  ? "bg-[#7A0F1F] text-white"
                  : completed
                  ? "bg-[#F5DCDD] text-[#4C0915] hover:bg-[#ebcacd]"
                  : allowed
                  ? "bg-[#F8EFE7] text-[#2B1B1B] hover:bg-[#EFE2D5]"
                  : "bg-[#F8EFE7]/60 text-[#765F5D] cursor-not-allowed"
              }`}
            >
              {completed ? (
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <span>{idx + 1}.</span>
              )}
              <span>{s.shortTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
