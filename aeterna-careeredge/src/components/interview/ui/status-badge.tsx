"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export type StatusTone =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "needs_review"
  | "free"
  | "free_cert"
  | "freemium"
  | "account_required"
  | "paid"
  | "unverified"
  | "pending"
  | "inconclusive"
  | "info";

const TONE_MAP: Record<
  StatusTone,
  { classes: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  locked: {
    classes: "bg-[#F8EFE7] text-[#59413F] border-[#CBB9AE]",
    Icon: Lock,
  },
  available: {
    classes: "bg-[#FFF8F0] text-[#2B1B1B] border-[#D8C5B8]",
    Icon: Info,
  },
  in_progress: {
    classes: "bg-[#7A0F1F] text-white border-[#7A0F1F]",
    Icon: Play,
  },
  completed: {
    classes: "bg-emerald-50 text-emerald-900 border-emerald-300",
    Icon: CheckCircle2,
  },
  needs_review: {
    classes: "bg-amber-50 text-amber-950 border-amber-300",
    Icon: RotateCcw,
  },
  free: {
    classes: "bg-emerald-50 text-emerald-900 border-emerald-300",
    Icon: ShieldCheck,
  },
  free_cert: {
    classes: "bg-[#FFF0C7] text-[#4C0915] border-[#F2B63D]",
    Icon: ShieldCheck,
  },
  freemium: {
    classes: "bg-amber-50 text-amber-950 border-amber-300",
    Icon: ShieldAlert,
  },
  account_required: {
    classes: "bg-[#FFF8F0] text-[#4C0915] border-[#D8C5B8]",
    Icon: Info,
  },
  paid: {
    classes: "bg-rose-50 text-rose-900 border-rose-300",
    Icon: AlertTriangle,
  },
  unverified: {
    classes: "bg-[#F8EFE7] text-[#4C0915] border-[#CBB9AE]",
    Icon: ShieldAlert,
  },
  pending: {
    classes: "bg-amber-50 text-amber-950 border-amber-300",
    Icon: Clock,
  },
  inconclusive: {
    classes: "bg-amber-50 text-amber-950 border-amber-300",
    Icon: AlertTriangle,
  },
  info: {
    classes: "bg-[#F5DCDD]/70 text-[#4C0915] border-[#E6D6CE]",
    Icon: Info,
  },
};

export function StatusBadge({
  tone,
  label,
  className = "",
}: {
  tone: StatusTone;
  label: string;
  className?: string;
}) {
  const { classes, Icon } = TONE_MAP[tone] ?? TONE_MAP.info;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
