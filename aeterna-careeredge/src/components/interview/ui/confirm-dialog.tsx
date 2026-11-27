"use client";

import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-[#2B1B1B]/60 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-[#EBDDD1] max-w-md w-full p-6 shadow-xl space-y-4">
        <h3 className="font-heading text-lg font-bold text-[#2B1B1B]">{title}</h3>
        <p className="text-sm text-[#59413F] leading-relaxed">{description}</p>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D8C5B8] bg-white text-sm font-semibold text-[#2B1B1B] hover:bg-[#FFF8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#7A0F1F] hover:bg-[#4C0915] disabled:opacity-60 text-white text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B63D]"
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
