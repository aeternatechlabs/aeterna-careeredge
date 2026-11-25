"use client";

// src/components/resume/uploaded-resumes-drawer.tsx
// Management drawer to view, download, or delete uploaded resume documents.

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";

interface UploadedDoc {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: string;
}

interface UploadedResumesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentDeleted?: () => void;
}

export function UploadedResumesDrawer({
  isOpen,
  onClose,
  onDocumentDeleted,
}: UploadedResumesDrawerProps) {
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    async function fetchDocs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/resumes/uploaded-documents", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        } else {
          setError("Failed to load uploaded resumes.");
        }
      } catch {
        setError("Network error loading uploaded resumes.");
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [isOpen]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this uploaded resume document?")) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/resumes/uploaded-documents/${docId}`, {
          credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (onDocumentDeleted) onDocumentDeleted();
      } else {
        alert("Failed to delete document.");
      }
    } catch {
      alert("Error deleting document.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-[#7A0F1F]" />
            <h3 className="font-heading text-base font-bold text-stone-900">
              My Uploaded Documents
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-stone-500 text-xs flex flex-col items-center gap-2">
              <Loader2 size={18} className="animate-spin text-[#7A0F1F]" />
              <span>Loading documents...</span>
            </div>
          ) : error ? (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 rounded-xl">{error}</div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs space-y-1">
              <FileText size={24} className="mx-auto text-stone-300" />
              <p className="font-bold text-stone-700">No Uploaded Resumes Found</p>
              <p className="text-[11px] text-stone-400">
                Uploaded PDF and DOCX files will appear here for secure download or deletion.
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs hover:bg-stone-100/60 transition"
              >
                <div className="space-y-0.5 max-w-[65%]">
                  <p className="font-bold text-stone-900 truncate" title={doc.originalFileName}>
                    {doc.originalFileName}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB •{" "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 transition"
                    title="Download Private Copy"
                  >
                    <Download size={12} />
                    <span className="hidden sm:inline">Download</span>
                  </a>

                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 transition disabled:opacity-30"
                    title="Delete Uploaded File"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 size={13} className="animate-spin text-rose-600" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
