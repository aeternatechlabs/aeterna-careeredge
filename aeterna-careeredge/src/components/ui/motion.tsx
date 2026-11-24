"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type HTMLMotionProps,
} from "motion/react";
import { Loader2, CheckCircle2, Clock, X } from "lucide-react";

/**
 * 1. LoadingButton
 * A button that stays dimension-stable while transitioning to loading state.
 */
interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  disabled,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  ...props
}: LoadingButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  const variantStyles = {
    primary:
      "bg-[#7A0F1F] text-white hover:bg-[#650B19] active:scale-[0.99] shadow-sm disabled:bg-[#7A0F1F]/60 shadow-[#7A0F1F]/10",
    secondary:
      "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 active:scale-[0.99]",
    outline:
      "border border-slate-200 bg-white text-slate-800 hover:border-[#E8D2CE] hover:bg-slate-50",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    gold: "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:brightness-105 shadow-sm shadow-amber-900/10",
  };

  const sizeStyles = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-10 px-4 text-sm gap-2 rounded-xl",
    lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]/30 disabled:cursor-not-allowed disabled:opacity-65 select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="loading"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            <span>{loadingText || "Processing…"}</span>
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {icon}
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * 2. GenerationProgress
 * Multi-step animated progress tracker for AI generations with elapsed time and cancel.
 */
export interface GenerationStep {
  id: string;
  label: string;
  detail?: string;
}

interface GenerationProgressProps {
  steps: GenerationStep[];
  currentStepIndex: number;
  isGenerating: boolean;
  onCancel?: () => void;
  title?: string;
}

export function GenerationProgress({
  steps,
  currentStepIndex,
  isGenerating,
  onCancel,
  title = "AI Engine Active",
}: GenerationProgressProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setSecondsElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  if (!isGenerating) return null;

  const totalSteps = steps.length;
  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + 1) / totalSteps) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8E8EA] text-[#7A0F1F] border border-[#E8D2CE]">
            <Loader2 className="h-4 w-4 animate-spin text-[#7A0F1F]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500">
              Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}:{" "}
              {steps[currentStepIndex]?.label || "Processing"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
            <Clock className="h-3 w-3 text-[#7A0F1F]" />
            {secondsElapsed}s
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-[#7A0F1F] via-[#F2B63D] to-[#650B19]"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
      </div>

      {/* Step nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={step.id}
              className={`flex items-start gap-2 rounded-xl p-2.5 text-xs transition-colors ${
                isCurrent
                  ? "bg-[#F8E8EA] border border-[#E8D2CE] shadow-xs"
                  : isDone
                  ? "text-slate-700"
                  : "text-slate-400 opacity-60"
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#7A0F1F]" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                )}
              </div>
              <div>
                <p className={`font-semibold ${isCurrent ? "text-[#7A0F1F]" : "text-slate-800"}`}>
                  {step.label}
                </p>
                {step.detail && (
                  <p className="text-[11px] text-slate-500 line-clamp-1">{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * 3. FadeIn
 * Subtle enter animation honoring reduced motion.
 */
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export function FadeIn({ children, delay = 0, className = "", ...props }: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 4. PageTransition
 * Smooth, non-intrusive page-switch animation for signed-in application views.
 * Changes seamlessly whenever the route pathname updates.
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`${className} will-change-transform`}
    >
      {children}
    </motion.div>
  );
}

/**
 * 5. StaggerList
 * Stagger reveal container.
 */
interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerList({
  children,
  className = "",
  staggerDelay = 0.06,
}: StaggerListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * 6. AnimatedScore
 * Smooth count-up counter for readiness, ATS, and match scores.
 */
interface AnimatedScoreProps {
  value: number;
  durationMs?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedScore({
  value,
  durationMs = 900,
  suffix = "%",
  className = "",
}: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const start = 0;
    const end = Math.round(value);
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    const handle = requestAnimationFrame(update);
    return () => cancelAnimationFrame(handle);
  }, [value, durationMs, prefersReducedMotion]);

  return (
    <span className={`tabular-nums font-bold ${className}`}>
      {displayValue}
      {suffix}
    </span>
  );
}

/**
 * 7. CardEntrance
 * Smooth, subtle entrance for cards with micro-interaction hover.
 */
interface CardEntranceProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  hoverEffect?: boolean;
}

export function CardEntrance({
  children,
  delay = 0,
  hoverEffect = true,
  className = "",
  ...props
}: CardEntranceProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        hoverEffect
          ? {
              y: -2,
              transition: { duration: 0.18, ease: "easeOut" },
            }
          : undefined
      }
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 8. ScaleFade
 * Polished modal and dialog entrance animation.
 */
interface ScaleFadeProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function ScaleFade({ children, className = "", ...props }: ScaleFadeProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
