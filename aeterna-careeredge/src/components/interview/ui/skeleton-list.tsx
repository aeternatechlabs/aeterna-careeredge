"use client";

import React from "react";

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-2xl border border-[#EBDDD1] bg-white p-4 animate-pulse motion-reduce:animate-none space-y-2"
        >
          <div className="h-3.5 w-1/3 rounded bg-[#F8EFE7]" />
          <div className="h-3 w-2/3 rounded bg-[#F8EFE7]" />
        </div>
      ))}
    </div>
  );
}
