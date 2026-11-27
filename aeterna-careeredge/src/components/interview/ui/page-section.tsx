"use client";

import React from "react";

interface PageSectionProps {
  title: string;
  summary?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function PageSection({
  title,
  summary,
  action,
  children,
  className = "",
  id,
}: PageSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={`bg-white rounded-2xl border border-[#EBDDD1] p-4 sm:p-6 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h3
            id={id}
            className="font-heading text-base sm:text-lg font-bold text-[#2B1B1B]"
          >
            {title}
          </h3>
          {summary && (
            <p className="text-sm text-[#59413F] mt-0.5 leading-relaxed">{summary}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
