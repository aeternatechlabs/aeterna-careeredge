"use client";

// src/components/shared/page-header.tsx
// Standardized Page Header Pattern across all signed-in tabs.
// Enforces visual hierarchy: one H1, plain-English purpose, primary action on right.

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

interface PageHeaderProps {
  category?: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  badge?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  onOpenGuide?: () => void;
  className?: string;
}

export function PageHeader({
  category,
  title,
  description,
  backHref,
  backLabel = "Back",
  badge,
  primaryAction,
  secondaryActions,
  onOpenGuide,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`space-y-2 pb-5 border-b border-slate-200 ${className}`}>
      {/* Category / Breadcrumbs / Back Link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A0F1F]">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-[#7A0F1F] transition-colors mr-2"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          )}
          {category && <span>{category}</span>}
          {badge && <div className="ml-1">{badge}</div>}
        </div>

        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#7A0F1F] transition shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
            title="How this tool works"
            aria-label="Open tool guide"
          >
            <HelpCircle size={13} className="text-[#F2B63D]" />
            <span className="hidden sm:inline">How this works</span>
          </button>
        )}
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {/* Action Group */}
        {(primaryAction || secondaryActions) && (
          <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
    </header>
  );
}
