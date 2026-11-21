"use client";

// src/components/dashboard/your-files-section.tsx
// Section 7: "Your Files" matching reference mockup:
// - Header: "Your Files" + "View all →"
// - Left Sub-Card: Recent Resumes list (PDF icon, filename, time ago, three-dots menu)
// - Right Sub-Card: Document Upload Box (Dashed card, cloud upload illustration, "Upload File" button)

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, ArrowRight, Upload, MoreVertical } from "lucide-react";

export interface ResumeItem {
  id: string;
  title: string;
  targetRole?: string | null;
  updatedAt: string | Date;
}

export interface StoredDocumentItem {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  createdAt: string | Date;
}

interface YourFilesSectionProps {
  resumes?: ResumeItem[];
  storedDocuments?: StoredDocumentItem[];
  onOpenUploadModal?: () => void;
}

function formatFileDate(dateValue: string | Date): string {
  try {
    const d = new Date(dateValue);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function YourFilesSection({
  resumes = [],
  storedDocuments = [],
  onOpenUploadModal,
}: YourFilesSectionProps) {
  const combinedFiles = [
    ...resumes.map((r) => ({
      id: r.id,
      name: r.title.endsWith(".pdf") ? r.title : `${r.title}.pdf`,
      date: formatFileDate(r.updatedAt),
      href: `/resume/builder?id=${r.id}`,
      isResume: true,
    })),
    ...storedDocuments.map((d) => ({
      id: d.id,
      name: d.originalFileName,
      date: formatFileDate(d.createdAt),
      href: `/api/documents/${d.id}/download`,
      isResume: false,
    })),
  ].slice(0, 2);

  return (
    <section aria-label="Your Files" className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base sm:text-lg font-bold text-[#2A1417] tracking-tight">
          Your Files
        </h2>

        <Link
          href="/resume/studio?tab=resumes"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1A2B] hover:underline"
        >
          <span>View all</span>
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>

      {/* Two Sub-Cards Side by Side on Desktop / Stacked on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Sub-Card 1: Recent Resumes */}
        <div className="rounded-2xl border border-[#F0DFDC] bg-white p-4 shadow-xs flex flex-col justify-between min-h-[148px]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#907D79] block mb-2.5">
              Recent Resumes
            </span>

            {combinedFiles.length === 0 ? (
              <div className="py-4 text-xs text-[#6F5A5D]">
                No resumes yet. Create or upload your first resume.
              </div>
            ) : (
              <div className="space-y-2">
                {combinedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-[#FFF9F7] transition-colors"
                  >
                    <Link
                      href={file.href}
                      className="flex items-center gap-2.5 min-w-0 flex-1 mr-2"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F9E8E8] text-[#7A1A2B]">
                        <FileText size={14} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#2A1417] truncate hover:text-[#7A1A2B] transition-colors">
                          {file.name}
                        </p>
                        <p
                          suppressHydrationWarning
                          className="text-[11px] text-[#907D79] font-medium"
                        >
                          {file.date}
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      aria-label="More options"
                      className="text-[#907D79] hover:text-[#2A1417] p-1 rounded-md transition"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sub-Card 2: Document Upload Box */}
        <div className="rounded-2xl border-2 border-dashed border-[#F0DFDC] bg-[#FFFBF9] p-4 text-center flex flex-col items-center justify-center space-y-2 min-h-[148px]">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            <Image
              src="/illustrations/document-upload.png"
              alt=""
              width={70}
              height={70}
              className="w-full h-full object-contain drop-shadow-xs"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-[#2A1417]">
              Upload your resume for better matches.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#7A1A2B] px-5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#650B19] active:bg-[#4C0915] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1A2B]"
          >
            <Upload size={12} aria-hidden="true" />
            <span>Upload File</span>
          </button>
        </div>
      </div>
    </section>
  );
}
