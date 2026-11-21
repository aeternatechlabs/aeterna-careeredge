"use client";

// src/components/dashboard/all-tools-grid.tsx
// Section 6: Reusable All Tools Grid with real-time client search.
// Includes 9 core tools: AI Resume Studio, Upload Resume, ATS Resume Check,
// LinkedIn Optimizer, Job Match, Role Fit Explorer, Applications, 30-Day Sprints, Interview Prep.
// Responsive: 3 columns on desktop (within 2/3 split), 2 columns on mobile.

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  ShieldCheck,
  Network,
  BriefcaseBusiness,
  Compass,
  ClipboardList,
  Calendar,
  GraduationCap,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  isAction?: boolean;
}

interface AllToolsGridProps {
  onOpenUploadModal?: () => void;
}

export function AllToolsGrid({ onOpenUploadModal }: AllToolsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const tools: ToolItem[] = useMemo(
    () => [
      {
        id: "resume-studio",
        name: "AI Resume Studio",
        description: "Build your resume",
        icon: Sparkles,
        href: "/resume/studio",
      },
      {
        id: "upload-resume",
        name: "Upload Resume",
        description: "Add your resume",
        icon: Upload,
        onClick: onOpenUploadModal,
        isAction: true,
      },
      {
        id: "ats-check",
        name: "ATS Resume Check",
        description: "Check ATS score",
        icon: ShieldCheck,
        href: "/resume/check",
      },
      {
        id: "linkedin",
        name: "LinkedIn Optimizer",
        description: "Improve your profile",
        icon: Network,
        href: "/linkedin",
      },
      {
        id: "job-match",
        name: "Job Match",
        description: "Find matching jobs",
        icon: BriefcaseBusiness,
        href: "/jobs",
      },
      {
        id: "role-fit",
        name: "Role Fit Explorer",
        description: "Browse opportunities",
        icon: Compass,
        href: "/role-fit-explorer",
      },
      {
        id: "applications",
        name: "Applications",
        description: "Track your progress",
        icon: ClipboardList,
        href: "/applications",
      },
      {
        id: "sprints",
        name: "30-Day Sprints",
        description: "Build skills fast",
        icon: Calendar,
        href: "/sprints",
      },
      {
        id: "interview-prep",
        name: "Interview Prep",
        description: "Practice mock Q&A",
        icon: GraduationCap,
        href: "/interview-prep",
      },
    ],
    [onOpenUploadModal]
  );

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [tools, searchQuery]);

  return (
    <section aria-label="All CareerEdge tools" className="space-y-3.5">
      {/* Section Header + Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h2 className="font-heading text-base sm:text-lg font-bold text-[#2A1417] tracking-tight">
          All tools
        </h2>

        {/* Real-time Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#907D79]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full rounded-full border border-[#F0DFDC] bg-white py-1.5 pl-8.5 pr-8 text-xs text-[#2A1417] placeholder-[#907D79] shadow-2xs transition focus:border-[#7A1A2B] focus:outline-none focus:ring-1 focus:ring-[#7A1A2B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#907D79] hover:text-[#2A1417] transition"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Tools */}
      {filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#F0DFDC] bg-white p-8 text-center">
          <Search size={22} className="text-[#907D79] mb-2" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-semibold text-[#2A1417]">
            No tools match your search.
          </p>
          <p className="text-xs text-[#6F5A5D] mt-0.5">
            Try searching with a different keyword or clear the search.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-3 text-xs font-bold text-[#7A1A2B] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;

            const cardContent = (
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F9E8E8] text-[#7A1A2B] border border-[#F0DFDC] group-hover:bg-[#7A1A2B] group-hover:text-white transition-colors duration-200">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-xs sm:text-[13px] font-bold text-[#2A1417] group-hover:text-[#7A1A2B] transition-colors truncate">
                    {tool.name}
                  </h3>
                  <p className="text-[11px] text-[#6F5A5D] truncate mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </div>
            );

            if (tool.isAction && tool.onClick) {
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={tool.onClick}
                  className="group flex flex-col justify-center rounded-2xl border border-[#F0DFDC] bg-white p-3 sm:p-3.5 text-left transition-all duration-200 hover:border-[#7A1A2B]/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B] min-h-[64px]"
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <Link
                key={tool.id}
                href={tool.href || "/dashboard"}
                className="group flex flex-col justify-center rounded-2xl border border-[#F0DFDC] bg-white p-3 sm:p-3.5 text-left transition-all duration-200 hover:border-[#7A1A2B]/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B] min-h-[64px]"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
