"use client";

// src/components/ui/coming-soon-page.tsx
// Standardized, honest, accessible Coming Soon view for unfinished features.
// Never renders fake data or dead ends; always provides context and links to related available tools.

import Link from "next/link";
import { StudentLayout } from "@/components/layouts/student-layout";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, BookOpen, CalendarDays } from "lucide-react";
import type { FeatureDefinition } from "@/config/features";

interface ComingSoonPageProps {
  studentName?: string;
  feature: FeatureDefinition;
}

export function ComingSoonPage({ studentName = "Student", feature }: ComingSoonPageProps) {
  const getIcon = () => {
    switch (feature.iconName) {
      case "BookOpen":
        return <BookOpen size={32} className="text-[#7A0F1F]" />;
      case "CalendarDays":
        return <CalendarDays size={32} className="text-[#7A0F1F]" />;
      default:
        return <Sparkles size={32} className="text-[#7A0F1F]" />;
    }
  };

  return (
    <StudentLayout userName={studentName}>
      <div className="min-h-[calc(100vh-72px)] bg-[#FFF8F0]/40 p-6 md:p-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Breadcrumb / Back link */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#765F5D]">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 hover:text-[#7A0F1F] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-[#2B1B1B] font-bold">{feature.name}</span>
          </div>

          {/* Central Coming Soon Card */}
          <div className="rounded-3xl border border-[#EBDDD1] bg-white p-8 md:p-12 shadow-sm text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF9ED] border border-[#F2B63D]/40 shadow-xs">
              {getIcon()}
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <div className="flex justify-center pb-1">
                <ComingSoonBadge label="Planned Feature • Coming soon" variant="brand" />
              </div>

              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-[#2B1B1B]">
                {feature.name}
              </h1>

              <p className="text-sm text-[#765F5D] leading-relaxed">
                {feature.shortDescription}
              </p>
            </div>

            {/* Honest Expectation Note */}
            <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-[#FFF8F0]/80 p-4 text-left text-xs text-stone-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#4C0915]">
                <ShieldCheck size={16} className="text-[#7A0F1F] shrink-0" />
                <span>CareerEdge Honesty Guarantee</span>
              </div>
              <p className="text-[12px] leading-snug text-stone-600">
                {feature.expectedNote || "This tool is actively in engineering development. We strictly avoid showing fake or ungrounded mock results."}
              </p>
            </div>

            {/* Action buttons to related working tools */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[#EBDDD1] bg-white px-5 py-2.5 text-xs font-bold text-[#2B1B1B] hover:bg-[#FDF7F5] hover:text-[#7A0F1F] transition shadow-2xs"
              >
                <ArrowLeft size={14} />
                <span>Return to Dashboard</span>
              </Link>

              {feature.relatedFeatureRoute && (
                <Link
                  href={feature.relatedFeatureRoute}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7A0F1F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#4C0915] transition shadow-xs"
                >
                  <span>Explore {feature.relatedFeatureName || "Available Tool"}</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
