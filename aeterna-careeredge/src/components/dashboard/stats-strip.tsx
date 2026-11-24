"use client";

// src/components/dashboard/stats-strip.tsx
// Section 4: Slim, elegant Career Statistics Strip displaying 4 key metrics:
// Profile Ready (%), Resumes, Verified Skills, Applications.
// Clean desktop layout with vertical dividers; 2x2 grid on mobile.

import React from "react";
import Link from "next/link";

interface StatsStripProps {
  profileReady: number;
  resumesCount: number;
  skillsCount: number;
  applicationsCount: number;
}

export function StatsStrip({
  profileReady,
  resumesCount,
  skillsCount,
  applicationsCount,
}: StatsStripProps) {
  const stats = [
    {
      id: "profile",
      value: `${profileReady}%`,
      label: "Profile Ready",
      href: "/onboarding?from=dashboard",
    },
    {
      id: "resumes",
      value: resumesCount,
      label: "Resumes",
      href: "/resume/studio?tab=resumes",
    },
    {
      id: "skills",
      value: skillsCount,
      label: "Verified Skills",
      href: "/role-fit-explorer",
    },
    {
      id: "applications",
      value: applicationsCount,
      label: "Applications",
      href: "/applications",
    },
  ];

  return (
    <section aria-label="Career statistics" className="w-full">
      <div className="rounded-2xl border border-[#F0DFDC] bg-white p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 divide-y sm:divide-y-0 sm:grid-cols-4 sm:divide-x divide-[#F0DFDC]">
          {stats.map((stat, idx) => (
            <Link
              key={stat.id}
              href={stat.href}
              className={`group flex flex-col items-center justify-center p-2 text-center transition-colors hover:bg-[#FFF9F7] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B] ${
                idx === 1 ? "border-l border-[#F0DFDC] sm:border-l-0" : ""
              } ${idx >= 2 ? "pt-3 sm:pt-2" : ""}`}
            >
              <span className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#2A1417] group-hover:text-[#7A1A2B] transition-colors">
                {stat.value}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[#6F5A5D]">
                {stat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
