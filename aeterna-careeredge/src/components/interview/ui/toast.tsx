"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface ToastProps {
  type: "ok" | "err";
  message: string;
  onDismiss?: () => void;
}

export function Toast({ type, message, onDismiss }: ToastProps) {
  return (
    <div
      role={type === "err" ? "alert" : "status"}
      className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium flex items-center justify-between gap-2 ${
        type === "err"
          ? "bg-rose-50 text-rose-900 border-rose-200"
          : "bg-emerald-50 text-emerald-900 border-emerald-200"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {type === "err" ? (
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        )}
        <span>{message}</span>
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg hover:bg-black/5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
