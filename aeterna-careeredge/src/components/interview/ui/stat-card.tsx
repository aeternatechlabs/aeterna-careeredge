"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "success" | "gold";
}

const TONE_CLASSES = {
  neutral: "bg-[#FFF8F0] border-[#EBDDD1] text-[#2B1B1B]",
  success: "bg-emerald-50/70 border-emerald-200 text-emerald-950",
  gold: "bg-[#FFF0C7]/55 border-[#F2B63D]/50 text-[#4C0915]",
} as const;

export function StatCard({ label, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-4 space-y-1 ${TONE_CLASSES[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="font-heading text-xl font-black">{value}</p>
      {hint && <p className="text-sm opacity-90 leading-snug">{hint}</p>}
    </div>
  );
}
