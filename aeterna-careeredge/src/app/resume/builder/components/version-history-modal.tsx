// src/app/resume/builder/components/version-history-modal.tsx
// Saved Versions, Snapshot History & One-Click Rollback Modal (Part 2.4 & Part 6)

import React, { useEffect, useState } from "react";
import { History, RotateCcw, Clock, Loader2 } from "lucide-react";

interface VersionItem {
  id: string;
  versionName: string;
  changeNote?: string | null;
  contentHash: string;
  createdAt: string;
}

interface VersionHistoryModalProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (versionId: string) => Promise<void>;
}

export function VersionHistoryModal({
  resumeId,
  isOpen,
  onClose,
  onRestoreVersion,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    const timer = setTimeout(() => {
      if (!isCancelled) setLoading(true);
    }, 0);
    fetch(`/api/resumes/${resumeId}/versions`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.versions) setVersions(data.versions);
      })
      .catch((err) => console.error("Failed to load versions:", err))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, resumeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-[#EBDDD1] pb-3">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#7A0F1F]" />
            <h3 className="font-heading text-base font-bold text-[#2B1810]">
              Saved Versions & Rollback History
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#765F5D] leading-relaxed">
          Every time you accept an AI improvement or save a milestone, a permanent snapshot is recorded. You can safely restore any version at any time.
        </p>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 size={28} className="animate-spin text-[#7A0F1F] mx-auto" />
            <span className="text-xs text-stone-500 mt-2 block">Loading versions...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 border border-dashed rounded-xl p-4">
            No previous snapshots saved yet. Click &quot;Save&quot; or accept an AI optimization to record your first milestone snapshot.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="flex items-center justify-between rounded-xl border border-[#EBDDD1] bg-stone-50/50 p-3 hover:border-[#7A0F1F]/40 transition text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2B1810]">{ver.versionName}</span>
                    <span className="rounded bg-stone-200/80 px-1.5 py-0.2 text-[9px] font-mono text-stone-700">
                      {ver.contentHash.substring(0, 7)}
                    </span>
                  </div>
                  {ver.changeNote && (
                    <p className="text-[11px] text-[#765F5D] leading-snug">{ver.changeNote}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                    <Clock size={10} />
                    <span>{new Date(ver.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={restoringId === ver.id}
                  onClick={async () => {
                    setRestoringId(ver.id);
                    try {
                      await onRestoreVersion(ver.id);
                      onClose();
                    } finally {
                      setRestoringId(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#7A0F1F] bg-white px-3 py-1.5 text-xs font-bold text-[#7A0F1F] hover:bg-[#FFF9ED] transition disabled:opacity-50 shrink-0"
                >
                  {restoringId === ver.id ? (
                    <Loader2 size={12} className="animate-spin text-[#7A0F1F]" />
                  ) : (
                    <RotateCcw size={12} />
                  )}
                  <span>Restore</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#EBDDD1]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#EBDDD1] px-4 py-1.5 text-xs font-semibold text-[#765F5D] hover:bg-[#FDF7F5]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
