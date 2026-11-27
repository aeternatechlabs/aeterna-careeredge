"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bookmark, CheckCircle2, Lock, Play, RotateCcw } from "lucide-react";
import type { PhaseBandNodeData, TopicNodeData } from "@/lib/interview/roadmap-graph-utils";

const STATE_STYLES = {
  LOCKED: {
    card: "bg-[#F8EFE7]/90 border-dashed border-[#CBB9AE] text-[#6B5754]",
    badge: "bg-[#EFE2D5] text-[#59413F]",
    label: "Locked",
  },
  AVAILABLE: {
    card: "bg-white border-solid border-[#D8C5B8] text-[#2B1B1B] hover:border-[#7A0F1F]/60",
    badge: "bg-[#FFF8F0] text-[#59413F] border border-[#E6D6CE]",
    label: "Available",
  },
  IN_PROGRESS: {
    card: "bg-[#FFF9E8] border-solid border-[#7A0F1F] text-[#2B1B1B] shadow-sm",
    badge: "bg-[#7A0F1F] text-white",
    label: "In Progress",
  },
  NEEDS_REVISION: {
    card: "bg-amber-50/80 border-solid border-amber-400 text-[#2B1B1B]",
    badge: "bg-amber-100 text-amber-900 border border-amber-300",
    label: "Needs Review",
  },
  COMPLETED: {
    card: "bg-emerald-50/75 border-solid border-[#2E9E5B] text-[#2B1B1B]",
    badge: "bg-[#2E9E5B] text-white",
    label: "Completed",
  },
} as const;

export const RoadmapPhaseBandNode = memo(function RoadmapPhaseBandNode({
  data,
}: NodeProps) {
  const band = data as PhaseBandNodeData;
  return (
    <div
      className="rounded-2xl border border-[#E6D6CE] bg-white/95 px-4 py-2.5 shadow-xs pointer-events-none select-none"
      style={{ width: band.bandWidth }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#7A0F1F] text-[#F2B63D] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Phase {band.orderIndex}
            </span>
            <h4 className="font-heading text-xs sm:text-sm font-bold text-[#2B1B1B] truncate">
              {band.title}
            </h4>
          </div>
          {band.description && (
            <p className="text-[11px] text-[#765F5D] truncate mt-0.5">{band.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-bold text-[#7A0F1F]">
            {band.completedCount}/{band.totalCount} done
          </span>
          <span className="block text-[10px] text-[#907D79]">~{band.estimatedHours}h</span>
        </div>
      </div>
    </div>
  );
});

export const RoadmapTopicNode = memo(function RoadmapTopicNode({
  data,
}: NodeProps) {
  const node = data as TopicNodeData;
  const style = STATE_STYLES[node.derivedState];

  return (
    <div
      className={`relative rounded-2xl border-2 p-3 transition-all ${style.card} ${
        node.isSelected
          ? "ring-4 ring-[#7A0F1F]/25 border-[#7A0F1F] shadow-md scale-[1.01]"
          : ""
      } ${node.isDimmed ? "opacity-35" : "opacity-100"}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#7A0F1F] !border-2 !border-white"
        isConnectable={false}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          node.onSelectTopic(node.topic.id);
        }}
        data-topic-node-id={node.topic.id}
        data-topic-slug={node.topic.slug}
        aria-label={`${node.topic.title} — ${style.label}${node.topic.bookmarked ? ", Bookmarked" : ""}`}
        aria-pressed={node.isSelected}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0F1F] rounded-lg"
      >
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}
          >
            {node.derivedState === "COMPLETED" && <CheckCircle2 className="w-3 h-3 shrink-0" />}
            {node.derivedState === "LOCKED" && <Lock className="w-3 h-3 shrink-0" />}
            {node.derivedState === "IN_PROGRESS" && <Play className="w-3 h-3 shrink-0" />}
            {node.derivedState === "NEEDS_REVISION" && <RotateCcw className="w-3 h-3 shrink-0" />}
            <span>{style.label}</span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {node.topic.bookmarked && (
              <span
                title="Bookmarked topic"
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FFF0C7] text-[#7A0F1F] border border-[#F2B63D]"
              >
                <Bookmark className="w-3 h-3 fill-[#F2B63D] text-[#7A0F1F]" />
              </span>
            )}
            <span className="rounded-full bg-[#FFF0C7]/80 px-1.5 py-0.5 text-[9px] font-bold text-[#4C0915]">
              {node.topic.priority}
            </span>
          </div>
        </div>

        <p className="font-heading text-xs font-bold leading-snug line-clamp-2 text-[#2B1B1B]">
          {node.topic.title}
        </p>

        <p className="text-[10px] text-[#765F5D] line-clamp-2 mt-1 leading-relaxed">
          {node.topic.overview}
        </p>

        <div className="mt-2 pt-1.5 border-t border-[#E6D6CE]/70 flex items-center justify-between text-[10px] text-[#765F5D]">
          <span>~{node.topic.estimatedMinutes}m</span>
          <span>
            {node.unmetPrereqCount > 0
              ? `Requires ${node.unmetPrereqCount} prereq`
              : node.prereqCount > 0
              ? `${node.prereqCount} prereq met`
              : "Entry topic"}
          </span>
        </div>
      </button>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#F2B63D] !border-2 !border-[#7A0F1F]"
        isConnectable={false}
      />
    </div>
  );
});
