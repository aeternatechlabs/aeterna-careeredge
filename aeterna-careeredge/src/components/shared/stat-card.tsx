"use client";

// src/components/shared/stat-card.tsx
// Consistent key metric card with icon, label, real numeric/status value, and empty guidance.

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  badge?: ReactNode;
  href?: string;
  emptyStateAction?: {
    label: string;
    href: string;
  };
  highlight?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  href,
  emptyStateAction,
  highlight = false,
  className = "",
}: StatCardProps) {
  const isZeroOrEmpty = value === 0 || value === "0" || value === "" || value === null || value === undefined;

  const content = (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
        highlight
          ? "border-amber-400 bg-gradient-to-br from-amber-50/50 to-white shadow-card hover:shadow-hover"
          : "border-border bg-surface hover:border-primary/40 shadow-card hover:shadow-hover"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-secondary-text tracking-wide truncate">{label}</span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
            highlight ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-600 border border-blue-200"
          }`}
        >
          <Icon size={18} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {value}
        </span>
        {badge}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-muted-text leading-tight truncate">
          {subtext}
        </p>
      )}

      {isZeroOrEmpty && emptyStateAction && (
        <div className="mt-3 pt-2.5 border-t border-border">
          {href ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary group-hover:text-primary-dark transition">
              <span>{emptyStateAction.label}</span>
              <ArrowUpRight size={12} />
            </span>
          ) : (
            <Link
              href={emptyStateAction.href}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark transition"
            >
              <span>{emptyStateAction.label}</span>
              <ArrowUpRight size={12} />
            </Link>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
}
