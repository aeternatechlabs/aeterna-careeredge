// src/app/resume/builder/components/section-editor.tsx
// Upgraded Accessible Accordion & Focus-View Section Editor
// 48-54px row targets, single-section focus mode, collapsible entry cards,
// drag-and-drop reordering with keyboard fallbacks, overflow actions (duplicate/rename/delete),
// and a unified + Add Section menu.

import React, { useState, useEffect, useRef } from "react";
import type {
  FullResumeData,
  ResumeSection,
  ResumeEntry,
  SectionType,
  SectionAnalysisResult,
  SectionSuggestion,
} from "@/lib/resume/types";
import { getFrameworkForDomain } from "@/lib/resume/frameworks";
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  AlignLeft,
  List,
  GripVertical,
  Check,
  X,
  Sparkles,
  BookOpen,
  Award,
  Globe,
  Briefcase,
  Lightbulb,
  Edit2,
  Copy,
  MoreVertical,
  GraduationCap,
  FolderGit2,
  Wrench,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

let idCounter = 0;
function createItemId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

interface SectionEditorProps {
  data: FullResumeData;
  onChangeData: (newData: FullResumeData) => void;
  onImproveBulletAction: (
    bulletText: string,
    action: "make_specific" | "shorten" | "strengthen" | "fix_grammar"
  ) => Promise<string>;
  onScrollToSection?: (sectionId: string) => void;
  activeSectionId?: string;
  onSelectSection?: (sectionId: string) => void;
  onAnalyzeSection?: (sectionId: string) => Promise<void>;
  analyzingSectionId?: string | null;
  sectionAnalyses?: SectionAnalysisResult[];
  onOpenAiReview?: (sectionId?: string) => void;
  onAcceptSuggestion?: (sectionId: string, suggestion: SectionSuggestion) => void;
}

interface BulletDiffState {
  entIdx: number;
  bIdx: number;
  originalText: string;
  improvedText: string;
  action: "make_specific" | "shorten" | "strengthen" | "fix_grammar";
  loading: boolean;
}

export function SectionEditor({
  data,
  onChangeData,
  onImproveBulletAction,
  onScrollToSection,
  activeSectionId: externalActiveSectionId,
  onSelectSection,
  onAnalyzeSection,
  analyzingSectionId,
  sectionAnalyses,
  onOpenAiReview,
  onAcceptSuggestion,
}: SectionEditorProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    externalActiveSectionId || data.sections[0]?.id || "sec_summary"
  );
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});
  const [openOverflowId, setOpenOverflowId] = useState<string | null>(null);
  const [addSectionMenuOpen, setAddSectionMenuOpen] = useState(false);

  // Drag and drop states
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [dragOverSectionIdx, setDragOverSectionIdx] = useState<number | null>(null);
  const [draggedEntryIdx, setDraggedEntryIdx] = useState<number | null>(null);
  const [dragOverEntryIdx, setDragOverEntryIdx] = useState<number | null>(null);
  const [draggedBulletKey, setDraggedBulletKey] = useState<string | null>(null);
  const [dragOverBulletKey, setDragOverBulletKey] = useState<string | null>(null);

  // Active Bullet Side-by-Side Diff Modal
  const [activeBulletDiff, setActiveBulletDiff] = useState<BulletDiffState | null>(null);

  const addMenuRef = useRef<HTMLDivElement>(null);

  // Sync external active section ID if updated from preview click
  useEffect(() => {
    if (externalActiveSectionId && externalActiveSectionId !== activeSectionId) {
      setActiveSectionId(externalActiveSectionId);
    }
  }, [externalActiveSectionId, activeSectionId]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (addMenuRef.current && !addMenuRef.current.contains(target as Node)) {
        setAddSectionMenuOpen(false);
      }
      if (target && target.closest("[data-section-overflow]")) {
        return;
      }
      setOpenOverflowId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOverflowId(null);
        setAddSectionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const framework = getFrameworkForDomain(data.domainKey);

  // Section Reordering
  function moveSection(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= data.sections.length) return;
    const updated = [...data.sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChangeData({ ...data, sections: updated });
  }

  function handleSectionDragStart(e: React.DragEvent, idx: number) {
    e.dataTransfer.setData("text/plain", String(idx));
    e.dataTransfer.effectAllowed = "move";
    setDraggedSectionIdx(idx);
  }

  function handleSectionDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSectionIdx(idx);
  }

  function handleSectionDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault();
    const fromIdx = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      const updated = [...data.sections];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      onChangeData({ ...data, sections: updated });
    }
    setDraggedSectionIdx(null);
    setDragOverSectionIdx(null);
  }

  function toggleVisibility(sectionId: string) {
    const updated = data.sections.map((s) =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    onChangeData({ ...data, sections: updated });
  }

  function addCustomSection(
    type: SectionType,
    customTitle: string,
    displayMode: "bullets" | "paragraph" | "tags" = "bullets"
  ) {
    const newSectionId = createItemId(`sec_${type}`);
    const newSection: ResumeSection = {
      id: newSectionId,
      type,
      customTitle,
      visible: true,
      layoutOptions: { displayMode },
      entries: [
        {
          id: createItemId(`ent_${type}`),
          title: "New Item",
          subtitle: "Organization / Institution",
          startDate: "",
          endDate: "",
          isCurrent: false,
          bullets: [
            {
              id: createItemId("b"),
              text: "Key achievement, leadership responsibility, or quantifiable outcome.",
              provenance: "STUDENT_INPUT",
              isApproved: true,
            },
          ],
        },
      ],
    };

    const updatedSections = [...data.sections, newSection];
    onChangeData({ ...data, sections: updatedSections });
    setActiveSectionId(newSectionId);
    setExpandedEntryId(newSection.entries[0]?.id || null);
    setAddSectionMenuOpen(false);
    if (onSelectSection) onSelectSection(newSectionId);
  }

  function duplicateSection(sectionId: string) {
    const sec = data.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const newSec: ResumeSection = {
      ...sec,
      id: createItemId(`sec_${sec.type}`),
      customTitle: `${sec.customTitle} (Copy)`,
      entries: sec.entries.map((e) => ({
        ...e,
        id: createItemId(`ent_${sec.type}`),
        bullets: e.bullets.map((b) => ({ ...b, id: createItemId("b") })),
      })),
    };
    const secIdx = data.sections.findIndex((s) => s.id === sectionId);
    const updated = [...data.sections];
    updated.splice(secIdx + 1, 0, newSec);
    onChangeData({ ...data, sections: updated });
    setActiveSectionId(newSec.id);
  }

  function deleteSection(sectionId: string) {
    if (!confirm("Are you sure you want to delete this section?")) return;
    const updated = data.sections.filter((s) => s.id !== sectionId);
    onChangeData({ ...data, sections: updated });
    if (activeSectionId === sectionId && updated.length > 0) {
      setActiveSectionId(updated[0].id);
    }
  }

  function renameSection(sectionId: string, newTitle: string) {
    const updated = data.sections.map((s) =>
      s.id === sectionId ? { ...s, customTitle: newTitle } : s
    );
    onChangeData({ ...data, sections: updated });
  }

  function setSectionDisplayMode(mode: "bullets" | "paragraph" | "tags") {
    const updated = data.sections.map((s) =>
      s.id === activeSectionId
        ? { ...s, layoutOptions: { ...(s.layoutOptions || {}), displayMode: mode } }
        : s
    );
    onChangeData({ ...data, sections: updated });
  }

  // Entry operations
  function moveEntry(entryIdx: number, direction: "up" | "down") {
    const currentSection = data.sections.find((s) => s.id === activeSectionId);
    if (!currentSection) return;
    const targetIdx = direction === "up" ? entryIdx - 1 : entryIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentSection.entries.length) return;

    const updatedEntries = [...currentSection.entries];
    const [moved] = updatedEntries.splice(entryIdx, 1);
    updatedEntries.splice(targetIdx, 0, moved);

    const updatedSections = data.sections.map((s) =>
      s.id === currentSection.id ? { ...s, entries: updatedEntries } : s
    );
    onChangeData({ ...data, sections: updatedSections });
  }

  function handleEntryDragStart(e: React.DragEvent, idx: number) {
    e.dataTransfer.setData("text/plain", String(idx));
    e.dataTransfer.effectAllowed = "move";
    setDraggedEntryIdx(idx);
  }

  function handleEntryDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverEntryIdx(idx);
  }

  function handleEntryDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault();
    const currentSection = data.sections.find((s) => s.id === activeSectionId);
    const fromIdx = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(fromIdx) && fromIdx !== toIdx && currentSection) {
      const updatedEntries = [...currentSection.entries];
      const [moved] = updatedEntries.splice(fromIdx, 1);
      updatedEntries.splice(toIdx, 0, moved);
      const updatedSections = data.sections.map((s) =>
        s.id === currentSection.id ? { ...s, entries: updatedEntries } : s
      );
      onChangeData({ ...data, sections: updatedSections });
    }
    setDraggedEntryIdx(null);
    setDragOverEntryIdx(null);
  }

  // Bullet operations
  function moveBullet(entIdx: number, bIdx: number, direction: "up" | "down") {
    const currentSection = data.sections.find((s) => s.id === activeSectionId);
    if (!currentSection) return;
    const targetIdx = direction === "up" ? bIdx - 1 : bIdx + 1;
    const updatedEntries = [...currentSection.entries];
    const targetBullets = [...updatedEntries[entIdx].bullets];
    if (targetIdx < 0 || targetIdx >= targetBullets.length) return;

    const [moved] = targetBullets.splice(bIdx, 1);
    targetBullets.splice(targetIdx, 0, moved);
    updatedEntries[entIdx] = { ...updatedEntries[entIdx], bullets: targetBullets };

    const updatedSections = data.sections.map((s) =>
      s.id === currentSection.id ? { ...s, entries: updatedEntries } : s
    );
    onChangeData({ ...data, sections: updatedSections });
  }

  function handleBulletDragStart(e: React.DragEvent, entIdx: number, bIdx: number) {
    e.dataTransfer.setData("text/plain", `${entIdx}:${bIdx}`);
    e.dataTransfer.effectAllowed = "move";
    setDraggedBulletKey(`${entIdx}:${bIdx}`);
  }

  function handleBulletDragOver(e: React.DragEvent, entIdx: number, bIdx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverBulletKey(`${entIdx}:${bIdx}`);
  }

  function handleBulletDrop(e: React.DragEvent, entIdx: number, toBIdx: number) {
    e.preventDefault();
    const currentSection = data.sections.find((s) => s.id === activeSectionId);
    const dataStr = e.dataTransfer.getData("text/plain");
    const [fromEntStr, fromBStr] = dataStr.split(":");
    const fromEntIdx = Number(fromEntStr);
    const fromBIdx = Number(fromBStr);

    if (
      !isNaN(fromEntIdx) &&
      !isNaN(fromBIdx) &&
      fromEntIdx === entIdx &&
      fromBIdx !== toBIdx &&
      currentSection
    ) {
      const updatedEntries = [...currentSection.entries];
      const targetBullets = [...updatedEntries[entIdx].bullets];
      const [moved] = targetBullets.splice(fromBIdx, 1);
      targetBullets.splice(toBIdx, 0, moved);
      updatedEntries[entIdx] = { ...updatedEntries[entIdx], bullets: targetBullets };

      const updatedSections = data.sections.map((s) =>
        s.id === currentSection.id ? { ...s, entries: updatedEntries } : s
      );
      onChangeData({ ...data, sections: updatedSections });
    }
    setDraggedBulletKey(null);
    setDragOverBulletKey(null);
  }

  function addEntryTag(entryIdx: number, tagText: string) {
    const currentSection = data.sections.find((s) => s.id === activeSectionId);
    if (!currentSection || !tagText.trim()) return;
    const updatedEntries = [...currentSection.entries];
    const tags = updatedEntries[entryIdx].tags || [];
    updatedEntries[entryIdx] = { ...updatedEntries[entryIdx], tags: [...tags, tagText.trim()] };

    const updatedSections = data.sections.map((s) =>
      s.id === currentSection.id ? { ...s, entries: updatedEntries } : s
    );
    onChangeData({ ...data, sections: updatedSections });
  }

  function removeEntryTag(entryIdx: number, tagIdx: number) {
    const currentSection = data.sections.find((s) => s.id === activeSectionId);
    if (!currentSection) return;
    const updatedEntries = [...currentSection.entries];
    const tags = (updatedEntries[entryIdx].tags || []).filter((_, i) => i !== tagIdx);
    updatedEntries[entryIdx] = { ...updatedEntries[entryIdx], tags };

    const updatedSections = data.sections.map((s) =>
      s.id === currentSection.id ? { ...s, entries: updatedEntries } : s
    );
    onChangeData({ ...data, sections: updatedSections });
  }

  async function triggerBulletImprovement(
    entIdx: number,
    bIdx: number,
    bulletText: string,
    action: "make_specific" | "shorten" | "strengthen" | "fix_grammar"
  ) {
    setActiveBulletDiff({
      entIdx,
      bIdx,
      originalText: bulletText,
      improvedText: "",
      action,
      loading: true,
    });
    try {
      const improved = await onImproveBulletAction(bulletText, action);
      setActiveBulletDiff((prev) => (prev ? { ...prev, improvedText: improved, loading: false } : null));
    } catch {
      setActiveBulletDiff(null);
      alert("AI improvement failed. Please check network or try again.");
    }
  }

  function acceptBulletDiff() {
    const currentSection = data.sections.find((s) => s.id === activeSectionId);
    if (!activeBulletDiff || !currentSection) return;
    const { entIdx, bIdx, improvedText } = activeBulletDiff;
    const updatedEntries = [...currentSection.entries];
    if (updatedEntries[entIdx]?.bullets[bIdx]) {
      updatedEntries[entIdx].bullets[bIdx] = {
        ...updatedEntries[entIdx].bullets[bIdx],
        text: improvedText,
        provenance: "AI_SUGGESTION",
        isApproved: true,
      };
      const updatedSections = data.sections.map((s) =>
        s.id === currentSection.id ? { ...s, entries: updatedEntries } : s
      );
      onChangeData({ ...data, sections: updatedSections });
    }
    setActiveBulletDiff(null);
  }

  const getSectionIcon = (type: SectionType) => {
    switch (type) {
      case "summary": return Sparkles;
      case "experience": return Briefcase;
      case "education": return GraduationCap;
      case "projects": return FolderGit2;
      case "skills": return Wrench;
      case "certifications": return Award;
      case "publications": return BookOpen;
      case "languages": return Globe;
      default: return Lightbulb;
    }
  };

  const currentSection = data.sections.find((s) => s.id === activeSectionId) || data.sections[0];

  return (
    <div className="space-y-4 text-xs">
      {/* ── Section Accordion & Focus List ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-secondary-text px-1 pb-1">
          <span>Sections ({data.sections.length})</span>
          <span className="text-[11px] font-normal text-muted-text">Click row to edit</span>
        </div>

        {data.sections.map((sec, idx) => {
          const isFocused = sec.id === activeSectionId;
          const isDragging = draggedSectionIdx === idx;
          const isOver = dragOverSectionIdx === idx;
          const SectionIcon = getSectionIcon(sec.type);
          const entryCount = sec.type === "summary" ? 1 : sec.type === "skills" ? (sec.entries[0]?.tags?.length || 0) : sec.entries.length;
          const sectionAnalysis = sectionAnalyses?.find((s) => s.sectionId === sec.id);

          return (
            <div
              key={sec.id}
              draggable
              onDragStart={(e) => handleSectionDragStart(e, idx)}
              onDragOver={(e) => handleSectionDragOver(e, idx)}
              onDrop={(e) => handleSectionDrop(e, idx)}
              className={`rounded-2xl border transition-all duration-200 ${
                openOverflowId === sec.id ? "overflow-visible z-40 relative" : "overflow-hidden"
              } ${
                isDragging
                  ? "opacity-40 border-primary bg-surface-muted"
                  : isOver
                    ? "border-2 border-primary bg-[#FFF8F0]"
                    : isFocused
                      ? "border-primary bg-surface shadow-md ring-1 ring-primary/20"
                      : "border-border bg-surface hover:border-primary/40 hover:shadow-xs"
              }`}
            >
              {/* Row Header (48-52px height) */}
              <div
                onClick={() => {
                  setActiveSectionId(sec.id);
                  if (onSelectSection) onSelectSection(sec.id);
                  if (onScrollToSection) onScrollToSection(sec.id);
                }}
                className={`flex items-center justify-between gap-3 px-4 py-4 cursor-pointer select-none transition-colors ${
                  isFocused ? "bg-[#FFF8F0]/80 border-b border-border/80" : ""
                }`}
              >
                {/* Left: Drag grip + Icon + Title + Count */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="p-1 text-muted-text hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
                    title="Drag to reorder section"
                  >
                    <GripVertical size={14} />
                  </div>

                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                    isFocused ? "bg-primary text-white" : "bg-surface-muted text-primary"
                  }`}>
                    <SectionIcon size={15} />
                  </div>

                  {editingTitleId === sec.id ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        defaultValue={sec.customTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            renameSection(sec.id, e.currentTarget.value);
                            setEditingTitleId(null);
                          } else if (e.key === "Escape") {
                            setEditingTitleId(null);
                          }
                        }}
                        onBlur={(e) => {
                          renameSection(sec.id, e.target.value);
                          setEditingTitleId(null);
                        }}
                        autoFocus
                        className="h-8 px-2.5 rounded-lg border-2 border-primary bg-surface text-xs font-bold text-foreground w-full max-w-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement);
                          renameSection(sec.id, input.value);
                          setEditingTitleId(null);
                        }}
                        className="px-2.5 py-1 rounded-md bg-primary text-[10px] font-bold text-white shrink-0 hover:bg-primary-dark transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className={`font-bold text-sm truncate ${isFocused ? "text-primary" : "text-foreground"}`}>
                        {sec.customTitle}
                      </span>
                      <span className="text-[11px] text-muted-text font-medium shrink-0">
                        ({entryCount} {sec.type === "skills" ? "skills" : entryCount === 1 ? "item" : "items"})
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Analyze Button, Visibility, Reorder alternatives, Overflow Menu */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Analyze Section Button */}
                  {onAnalyzeSection && (
                    <button
                      type="button"
                      disabled={analyzingSectionId === sec.id}
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        if (onSelectSection) onSelectSection(sec.id);
                        onAnalyzeSection(sec.id);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-2xs disabled:opacity-50 ${
                        analyzingSectionId === sec.id
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : sectionAnalysis
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-blue-50 text-[#7A0F1F] border border-blue-200 hover:bg-blue-100"
                      }`}
                      title={`Run AI analysis for ${sec.customTitle} section`}
                    >
                      {analyzingSectionId === sec.id ? (
                        <Loader2 size={12} className="animate-spin text-[#7A0F1F]" />
                      ) : (
                        <Sparkles size={12} className={sectionAnalysis ? "text-emerald-600" : "text-[#7A0F1F]"} />
                      )}
                      <span>
                        {analyzingSectionId === sec.id
                          ? "Analyzing…"
                          : sectionAnalysis
                          ? "Re-Analyze"
                          : "Analyze"}
                      </span>
                    </button>
                  )}

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => toggleVisibility(sec.id)}
                    className="p-1.5 rounded-lg text-secondary-text hover:bg-surface-muted transition-colors"
                    title={sec.visible ? "Hide from resume" : "Show on resume"}
                  >
                    {sec.visible ? <Eye size={14} /> : <EyeOff size={14} className="text-muted-text" />}
                  </button>

                  {/* Keyboard Move alternatives */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, "up")}
                    className="p-1.5 rounded-lg text-secondary-text hover:bg-surface-muted disabled:opacity-25 transition-colors"
                    title="Move section up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === data.sections.length - 1}
                    onClick={() => moveSection(idx, "down")}
                    className="p-1.5 rounded-lg text-secondary-text hover:bg-surface-muted disabled:opacity-25 transition-colors"
                    title="Move section down"
                  >
                    <ChevronDown size={14} />
                  </button>

                  {/* Overflow menu */}
                  <div className="relative" data-section-overflow>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenOverflowId((prev) => (prev === sec.id ? null : sec.id));
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        openOverflowId === sec.id
                          ? "bg-primary text-white"
                          : "text-secondary-text hover:bg-surface-muted"
                      }`}
                      title="More options (Rename, Duplicate, Move, Delete)"
                      aria-label="Section options menu"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {openOverflowId === sec.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-xl z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                      >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSectionId(sec.id);
                              setEditingTitleId(sec.id);
                              setOpenOverflowId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-surface-muted text-left transition-colors"
                          >
                            <Edit2 size={13} className="text-secondary-text" />
                            <span>Rename Section</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateSection(sec.id);
                              setOpenOverflowId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-surface-muted text-left transition-colors"
                          >
                            <Copy size={13} className="text-secondary-text" />
                            <span>Duplicate Section</span>
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSection(idx, "up");
                              setOpenOverflowId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-surface-muted text-left disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp size={13} className="text-secondary-text" />
                            <span>Move Up</span>
                          </button>
                          <button
                            type="button"
                            disabled={idx === data.sections.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSection(idx, "down");
                              setOpenOverflowId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-surface-muted text-left disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown size={13} className="text-secondary-text" />
                            <span>Move Down</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVisibility(sec.id);
                              setOpenOverflowId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-surface-muted text-left transition-colors"
                          >
                            {sec.visible ? <EyeOff size={13} className="text-secondary-text" /> : <Eye size={13} className="text-secondary-text" />}
                            <span>{sec.visible ? "Hide on Resume" : "Show on Resume"}</span>
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSection(sec.id);
                              setOpenOverflowId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 text-left transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Delete Section</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              {/* ── Focused Section Editing Body ── */}
              {isFocused && (
                <div className="px-5 py-5 sm:px-6 space-y-4 bg-surface border-t border-border/60 animate-in fade-in duration-150">
                  {/* Section AI Optimization Bar */}
                  <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/50 border border-blue-200/80 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7A0F1F] text-white shrink-0 shadow-2xs">
                          <Sparkles size={13} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          AI Section Optimizer
                        </span>
                      </div>
                      {sectionAnalysis && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          Audited
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      {sectionAnalysis
                        ? `${sectionAnalysis.suggestions.length} suggestions • ${sectionAnalysis.issues.length} potential issues found`
                        : `Audit action verbs, quantify metrics, and optimize ATS match for ${sec.customTitle}.`}
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-blue-100/80">
                      {sectionAnalysis && sectionAnalysis.suggestions.length > 0 && onOpenAiReview && (
                        <button
                          type="button"
                          onClick={() => onOpenAiReview(sec.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#7A0F1F] bg-white border border-blue-200 hover:bg-blue-50 transition shadow-2xs"
                          title="Open AI Review Drawer with full side-by-side comparisons"
                        >
                          <span>View Fixes ({sectionAnalysis.suggestions.length})</span>
                        </button>
                      )}
                      {onAnalyzeSection && (
                        <button
                          type="button"
                          disabled={analyzingSectionId === sec.id}
                          onClick={() => onAnalyzeSection(sec.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#7A0F1F] hover:bg-[#650B19] transition shadow-xs disabled:opacity-50"
                        >
                          {analyzingSectionId === sec.id ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Analyzing…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} />
                              <span>{sectionAnalysis ? "Re-Analyze Section" : "Analyze Section"}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Inline Suggestions if section analysis exists */}
                  {sectionAnalysis && sectionAnalysis.suggestions.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          Suggested Improvements ({sectionAnalysis.suggestions.length})
                        </span>
                        {onOpenAiReview && (
                          <button
                            type="button"
                            onClick={() => onOpenAiReview(sec.id)}
                            className="text-[11px] font-semibold text-[#7A0F1F] hover:underline flex items-center gap-1"
                          >
                            <span>Open in AI Drawer</span>
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {sectionAnalysis.suggestions.slice(0, 3).map((sug) => (
                          <div
                            key={sug.id}
                            className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                                <span className="font-bold text-emerald-800">Rewrite: </span>
                                {sug.improved}
                              </p>
                              {onAcceptSuggestion && (
                                <button
                                  type="button"
                                  onClick={() => onAcceptSuggestion(sec.id, sug)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shrink-0"
                                >
                                  <Check size={11} />
                                  <span>Accept</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 italic">
                              Why: {sug.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Display Mode (Bullets vs Paragraph) */}
                  {sec.type !== "skills" && sec.type !== "summary" && (
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-xs font-bold text-secondary-text">Formatting Style:</span>
                      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-muted p-0.5">
                        <button
                          type="button"
                          onClick={() => setSectionDisplayMode("bullets")}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            (sec.layoutOptions?.displayMode || "bullets") === "bullets"
                              ? "bg-primary text-white shadow-xs"
                              : "text-secondary-text hover:text-foreground"
                          }`}
                        >
                          <List size={12} />
                          <span>Bullets</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSectionDisplayMode("paragraph")}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            sec.layoutOptions?.displayMode === "paragraph"
                              ? "bg-primary text-white shadow-xs"
                              : "text-secondary-text hover:text-foreground"
                          }`}
                        >
                          <AlignLeft size={12} />
                          <span>Paragraph</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {sec.type === "summary" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-secondary-text">
                        Professional Summary / Career Pitch
                      </label>
                      <textarea
                        rows={6}
                        value={sec.entries[0]?.text || ""}
                        onChange={(e) => {
                          const updatedEntries = [
                            {
                              id: sec.entries[0]?.id || createItemId("ent_sum"),
                              title: "Summary",
                              text: e.target.value,
                              bullets: [],
                            },
                          ];
                          const updatedSections = data.sections.map((s) =>
                            s.id === sec.id ? { ...s, entries: updatedEntries } : s
                          );
                          onChangeData({ ...data, sections: updatedSections });
                        }}
                        placeholder="Highlight 2-3 key competencies, verified career focus, and demonstrable impact..."
                        className="w-full rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  )}

                  {/* 2. Skills Section Editor */}
                  {sec.type === "skills" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-secondary-text">
                        Skills &amp; Competencies:
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSkillInput}
                          onChange={(e) => setNewSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newSkillInput.trim()) {
                              e.preventDefault();
                              const currentTags = sec.entries[0]?.tags || [];
                              const updatedTags = [...currentTags, newSkillInput.trim()];
                              const updatedEntries = [
                                {
                                  id: sec.entries[0]?.id || createItemId("ent_skills"),
                                  title: "Competencies",
                                  tags: updatedTags,
                                  bullets: [],
                                },
                              ];
                              const updatedSections = data.sections.map((s) =>
                                s.id === sec.id ? { ...s, entries: updatedEntries } : s
                              );
                              onChangeData({ ...data, sections: updatedSections });
                              setNewSkillInput("");
                            }
                          }}
                          placeholder="Type skill name and press Enter (e.g. Next.js, Financial Modeling, ACLS)..."
                          className="flex-1 h-10 rounded-xl border border-border bg-surface px-3.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newSkillInput.trim()) return;
                            const currentTags = sec.entries[0]?.tags || [];
                            const updatedTags = [...currentTags, newSkillInput.trim()];
                            const updatedEntries = [
                              {
                                id: sec.entries[0]?.id || createItemId("ent_skills"),
                                title: "Competencies",
                                tags: updatedTags,
                                bullets: [],
                              },
                            ];
                            const updatedSections = data.sections.map((s) =>
                              s.id === sec.id ? { ...s, entries: updatedEntries } : s
                            );
                            onChangeData({ ...data, sections: updatedSections });
                            setNewSkillInput("");
                          }}
                          className="h-10 px-4 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-dark transition-colors shadow-xs"
                        >
                          Add Skill
                        </button>
                      </div>

                      {/* Tags Cloud */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(sec.entries[0]?.tags || []).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 py-1 text-xs text-foreground"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentTags = sec.entries[0]?.tags || [];
                                const updatedTags = currentTags.filter((_, i) => i !== sIdx);
                                const updatedEntries = [{ ...sec.entries[0], tags: updatedTags }];
                                const updatedSections = data.sections.map((s) =>
                                  s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                );
                                onChangeData({ ...data, sections: updatedSections });
                              }}
                              className="text-muted-text hover:text-red-700 font-bold ml-0.5"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Standard Entry List (Collapsible Entry Cards) */}
                  {sec.type !== "summary" && sec.type !== "skills" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                          Entries ({sec.entries.length})
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const newEntry: ResumeEntry = {
                              id: createItemId(`ent_${sec.type}`),
                              title: "New Item",
                              subtitle: "Organization / Institution",
                              startDate: "",
                              endDate: "",
                              isCurrent: false,
                              location: "",
                              url: "",
                              score: "",
                              tags: [],
                              bullets: [
                                {
                                  id: createItemId("b"),
                                  text: "Documented key deliverable, procedure, or measurable impact.",
                                  provenance: "STUDENT_INPUT",
                                  isApproved: true,
                                },
                              ],
                            };
                            const updatedEntries = [...sec.entries, newEntry];
                            const updatedSections = data.sections.map((s) =>
                              s.id === sec.id ? { ...s, entries: updatedEntries } : s
                            );
                            onChangeData({ ...data, sections: updatedSections });
                            setExpandedEntryId(newEntry.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-[#FFF8F0] px-3 py-1.5 text-xs font-bold text-primary hover:bg-[#FBE4E4]/40 transition"
                        >
                          <Plus size={13} />
                          <span>Add {sec.customTitle.replace(/s$/, "") || "Entry"}</span>
                        </button>
                      </div>

                      {/* Entries Accordion Cards */}
                      <div className="space-y-3">
                        {sec.entries.map((entry, entIdx) => {
                          const isExpanded =
                            expandedEntryId === entry.id ||
                            (expandedEntryId === null && entIdx === 0);
                          const tagInput = newTagInputs[entry.id] || "";
                          const isDragging = draggedEntryIdx === entIdx;
                          const isOver = dragOverEntryIdx === entIdx;

                          return (
                            <div
                              key={entry.id}
                              draggable
                              onDragStart={(e) => handleEntryDragStart(e, entIdx)}
                              onDragOver={(e) => handleEntryDragOver(e, entIdx)}
                              onDrop={(e) => handleEntryDrop(e, entIdx)}
                              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                                isDragging
                                  ? "opacity-40 border-primary bg-surface-muted"
                                  : isOver
                                    ? "border-2 border-primary bg-[#FFF8F0]"
                                    : isExpanded
                                      ? "border-border-strong bg-surface shadow-sm"
                                      : "border-border bg-surface-muted/50 hover:border-border-strong"
                              }`}
                            >
                              {/* Entry Collapsed Header Bar (44-48px) */}
                              <div
                                onClick={() => setExpandedEntryId(isExpanded ? "" : entry.id)}
                                className="flex items-center justify-between gap-2.5 px-4 py-3.5 cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <GripVertical size={13} className="text-muted-text hover:text-foreground shrink-0 cursor-grab" />
                                  <div className="flex items-baseline gap-2 min-w-0 truncate">
                                    <span className="font-semibold text-[13px] text-foreground truncate">
                                      {entry.title || "Untitled Entry"}
                                    </span>
                                    {entry.subtitle && (
                                      <span className="text-xs text-secondary-text truncate">
                                        &bull; {entry.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {(entry.startDate || entry.endDate || entry.isCurrent) && (
                                    <span className="text-[10px] text-muted-text font-semibold hidden sm:inline">
                                      {entry.startDate} {entry.endDate ? `- ${entry.endDate}` : entry.isCurrent ? "- Present" : ""}
                                    </span>
                                  )}
                                  <ChevronDown size={14} className={`text-muted-text transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </div>
                              </div>

                              {/* Entry Expanded Body */}
                              {isExpanded && (
                                <div className="px-5 py-5 border-t border-border space-y-5 bg-surface">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-secondary-text mb-2">
                                        Title / Role / Degree
                                      </label>
                                      <input
                                        type="text"
                                        value={entry.title || ""}
                                        onChange={(e) => {
                                          const updatedEntries = [...sec.entries];
                                          updatedEntries[entIdx] = { ...entry, title: e.target.value };
                                          const updatedSections = data.sections.map((s) =>
                                            s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                          );
                                          onChangeData({ ...data, sections: updatedSections });
                                        }}
                                        className="w-full h-10 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-secondary-text mb-2">
                                        Organization / Institution
                                      </label>
                                      <input
                                        type="text"
                                        value={entry.subtitle || ""}
                                        onChange={(e) => {
                                          const updatedEntries = [...sec.entries];
                                          updatedEntries[entIdx] = { ...entry, subtitle: e.target.value };
                                          const updatedSections = data.sections.map((s) =>
                                            s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                          );
                                          onChangeData({ ...data, sections: updatedSections });
                                        }}
                                        className="w-full h-10 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-secondary-text mb-2">
                                        Start Date
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 2022-06"
                                        value={entry.startDate || ""}
                                        onChange={(e) => {
                                          const updatedEntries = [...sec.entries];
                                          updatedEntries[entIdx] = { ...entry, startDate: e.target.value };
                                          const updatedSections = data.sections.map((s) =>
                                            s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                          );
                                          onChangeData({ ...data, sections: updatedSections });
                                        }}
                                        className="w-full h-10 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-secondary-text mb-2">
                                        End Date
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Present"
                                        value={entry.endDate || ""}
                                        disabled={entry.isCurrent}
                                        onChange={(e) => {
                                          const updatedEntries = [...sec.entries];
                                          updatedEntries[entIdx] = { ...entry, endDate: e.target.value };
                                          const updatedSections = data.sections.map((s) =>
                                            s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                          );
                                          onChangeData({ ...data, sections: updatedSections });
                                        }}
                                        className="w-full h-10 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground disabled:bg-surface-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2.5 pt-7">
                                      <input
                                        type="checkbox"
                                        id={`current_${entry.id}`}
                                        checked={entry.isCurrent || false}
                                        onChange={(e) => {
                                          const updatedEntries = [...sec.entries];
                                          updatedEntries[entIdx] = { ...entry, isCurrent: e.target.checked };
                                          const updatedSections = data.sections.map((s) =>
                                            s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                          );
                                          onChangeData({ ...data, sections: updatedSections });
                                        }}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                      />
                                      <label htmlFor={`current_${entry.id}`} className="text-sm font-medium text-secondary-text cursor-pointer">
                                        Currently active
                                      </label>
                                    </div>
                                  </div>

                                  {/* Bullets List */}
                                  <div className="space-y-3 pt-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-semibold text-secondary-text uppercase tracking-wider">
                                        Bullet Points &amp; Outcomes
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedEntries = [...sec.entries];
                                          const newBullet = {
                                            id: createItemId("b"),
                                            text: "Documented verifiable contribution or quantifiable metric.",
                                            provenance: "STUDENT_INPUT" as const,
                                            isApproved: true,
                                          };
                                          updatedEntries[entIdx].bullets.push(newBullet);
                                          const updatedSections = data.sections.map((s) =>
                                            s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                          );
                                          onChangeData({ ...data, sections: updatedSections });
                                        }}
                                        className="text-xs font-semibold text-primary hover:text-primary-dark"
                                      >
                                        + Add Bullet
                                      </button>
                                    </div>

                                    <div className="space-y-2.5">
                                      {entry.bullets.map((b, bIdx) => (
                                        <div
                                          key={b.id}
                                          draggable
                                          onDragStart={(e) => handleBulletDragStart(e, entIdx, bIdx)}
                                          onDragOver={(e) => handleBulletDragOver(e, entIdx, bIdx)}
                                          onDrop={(e) => handleBulletDrop(e, entIdx, bIdx)}
                                          className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-surface-muted/40"
                                        >
                                          <GripVertical size={13} className="text-muted-text mt-2.5 cursor-grab shrink-0" />
                                          <textarea
                                            rows={2}
                                            value={b.text}
                                            onChange={(e) => {
                                              const updatedEntries = [...sec.entries];
                                              updatedEntries[entIdx].bullets[bIdx] = { ...b, text: e.target.value };
                                              const updatedSections = data.sections.map((s) =>
                                                s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                              );
                                              onChangeData({ ...data, sections: updatedSections });
                                            }}
                                            className="flex-1 rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                          />

                                          <div className="flex flex-col gap-1 shrink-0">
                                            {/* AI Improve Dropdown / Button */}
                                            <button
                                              type="button"
                                              onClick={() => triggerBulletImprovement(entIdx, bIdx, b.text, "strengthen")}
                                              className="p-1 rounded-lg border border-blue-200 bg-blue-50 text-[#7A0F1F] hover:bg-blue-100"
                                              title="AI: Strengthen with metric verbs"
                                            >
                                              <Wand2 size={12} className="text-[#7A0F1F]" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updatedEntries = [...sec.entries];
                                                updatedEntries[entIdx].bullets.splice(bIdx, 1);
                                                const updatedSections = data.sections.map((s) =>
                                                  s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                                );
                                                onChangeData({ ...data, sections: updatedSections });
                                              }}
                                              className="p-1 rounded-lg text-muted-text hover:text-red-700"
                                              title="Delete bullet"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Entry Delete Button */}
                                  <div className="flex justify-end pt-2 border-t border-border">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!confirm("Delete this entry?")) return;
                                        const updatedEntries = sec.entries.filter((_, i) => i !== entIdx);
                                        const updatedSections = data.sections.map((s) =>
                                          s.id === sec.id ? { ...s, entries: updatedEntries } : s
                                        );
                                        onChangeData({ ...data, sections: updatedSections });
                                      }}
                                      className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1"
                                    >
                                      <Trash2 size={12} />
                                      <span>Delete Entry</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Single Clear "+ Add Section" Menu Button ── */}
      <div ref={addMenuRef} className="relative pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAddSectionMenuOpen(!addSectionMenuOpen);
          }}
          className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border-2 border-dashed border-primary/30 bg-[#FFF8F0] hover:bg-[#FBE4E4]/40 text-primary font-bold text-xs transition-colors shadow-xs"
        >
          <Plus size={16} />
          <span>Add Section</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${addSectionMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {addSectionMenuOpen && (
          <div className="absolute z-30 left-0 right-0 top-full mt-2 p-3 bg-surface rounded-2xl border border-border shadow-dropdown space-y-3">
            {/* 1. Recommended Sections from Domain */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-text mb-1.5 px-1">
                Recommended for {framework.name}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {framework.sections.map((rec) => {
                  const alreadyHas = data.sections.some((s) => s.customTitle === rec.label);
                  if (alreadyHas) return null;
                  return (
                    <button
                      key={rec.key}
                      type="button"
                      onClick={() => addCustomSection("custom", rec.label, "bullets")}
                      className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-surface-muted/50 hover:bg-[#FFF8F0] hover:border-primary/40 text-left text-xs font-medium text-foreground transition"
                    >
                      <Plus size={12} className="text-primary" />
                      <span className="truncate">{rec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Common Professional Sections */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-text mb-1.5 px-1">
                Standard Sections
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => addCustomSection("certifications", "Certifications & Licensures", "bullets")}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-surface-muted/50 hover:bg-[#FFF8F0] hover:border-primary/40 text-left text-xs font-medium text-foreground transition"
                >
                  <Award size={13} className="text-primary" />
                  <span className="truncate">Certifications</span>
                </button>
                <button
                  type="button"
                  onClick={() => addCustomSection("publications", "Publications & Research", "bullets")}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-surface-muted/50 hover:bg-[#FFF8F0] hover:border-primary/40 text-left text-xs font-medium text-foreground transition"
                >
                  <BookOpen size={13} className="text-primary" />
                  <span className="truncate">Publications</span>
                </button>
                <button
                  type="button"
                  onClick={() => addCustomSection("volunteer", "Leadership & Activities", "bullets")}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-surface-muted/50 hover:bg-[#FFF8F0] hover:border-primary/40 text-left text-xs font-medium text-foreground transition"
                >
                  <Briefcase size={13} className="text-primary" />
                  <span className="truncate">Leadership</span>
                </button>
                <button
                  type="button"
                  onClick={() => addCustomSection("languages", "Languages", "tags")}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-surface-muted/50 hover:bg-[#FFF8F0] hover:border-primary/40 text-left text-xs font-medium text-foreground transition"
                >
                  <Globe size={13} className="text-primary" />
                  <span className="truncate">Languages</span>
                </button>
                <button
                  type="button"
                  onClick={() => addCustomSection("achievements", "Honors & Awards", "bullets")}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-surface-muted/50 hover:bg-[#FFF8F0] hover:border-primary/40 text-left text-xs font-medium text-foreground transition"
                >
                  <Sparkles size={13} className="text-primary" />
                  <span className="truncate">Honors &amp; Awards</span>
                </button>
                <button
                  type="button"
                  onClick={() => addCustomSection("custom", "Custom Section", "bullets")}
                  className="flex items-center gap-1.5 p-2 rounded-xl border border-primary bg-primary text-white hover:bg-primary-dark text-left text-xs font-bold transition shadow-xs"
                >
                  <Plus size={13} />
                  <span className="truncate">Freeform Section</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Active Bullet Diff Modal (Inline AI Comparison) ── */}
      {activeBulletDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#7A0F1F]" />
                AI Bullet Improvement ({activeBulletDiff.action.replace("_", " ")})
              </h4>
              <button
                type="button"
                onClick={() => setActiveBulletDiff(null)}
                className="text-muted-text hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-secondary-text mb-1">Original Phrasing:</p>
                <div className="p-3 rounded-xl bg-surface-muted text-xs text-secondary-text border border-border leading-relaxed">
                  {activeBulletDiff.originalText}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-primary mb-1">Improved Version:</p>
                <div className="p-3 rounded-xl bg-blue-50 text-xs text-foreground font-medium border border-blue-200 leading-relaxed min-h-[60px] flex items-center">
                  {activeBulletDiff.loading ? (
                    <span className="text-muted-text italic flex items-center gap-2">
                      <Sparkles size={14} className="animate-spin text-primary" />
                      Analyzing with action verbs and impact metrics...
                    </span>
                  ) : (
                    activeBulletDiff.improvedText
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveBulletDiff(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-secondary-text hover:bg-surface-muted transition"
              >
                Keep Original
              </button>
              <button
                type="button"
                disabled={activeBulletDiff.loading || !activeBulletDiff.improvedText}
                onClick={acceptBulletDiff}
                className="px-4 py-2 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-50 transition shadow-xs"
              >
                Accept Improvement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
