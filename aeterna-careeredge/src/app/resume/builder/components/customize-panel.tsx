// src/app/resume/builder/components/customize-panel.tsx
// Comprehensive Resume Style & Layout Customization Panel (Part 2.2)
// Collapsible Accordion Sections: Saved Studio Formats, Templates, Colors, Typography, Spacing & Layout.

import React, { useState } from "react";
import Link from "next/link";
import type { ResumeStyleConfig, ResumeTemplateId } from "@/lib/resume/types";
import {
  RESUME_TEMPLATES,
  COLOR_PRESETS,
  SAFE_FONTS,
  DEFAULT_STYLE_CONFIG,
  getTemplatePreset,
  evaluateColorContrast,
} from "@/lib/resume/templates";
import {
  Palette,
  Type,
  Layout,
  Maximize2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Bookmark,
} from "lucide-react";

export interface SavedResumeFormat {
  id: string;
  title: string;
  targetRole?: string | null;
  templateId: string;
  atsScore?: number | null;
  styleData?: string | null;
  updatedAt: Date | string;
  createdAt?: Date | string;
}

interface CustomizePanelProps {
  style: ResumeStyleConfig;
  onChangeStyle: (newStyle: ResumeStyleConfig) => void;
  onFitToOnePage?: () => void;
  savedResumes?: SavedResumeFormat[];
  activeResumeId?: string;
  onSelectResume?: (resumeId: string) => void;
  onApplySavedFormat?: (styleConfig: ResumeStyleConfig) => void;
}

export function CustomizePanel({
  style,
  onChangeStyle,
  onFitToOnePage,
  savedResumes = [],
  activeResumeId,
  onSelectResume,
  onApplySavedFormat,
}: CustomizePanelProps) {
  const contrastCheck = evaluateColorContrast(style.colors);

  // Collapsible Accordion State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    studioFormats: true,
    templates: true,
    colors: false,
    typography: false,
    spacing: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      studioFormats: true,
      templates: true,
      colors: true,
      typography: true,
      spacing: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      studioFormats: false,
      templates: false,
      colors: false,
      typography: false,
      spacing: false,
    });
  };

  function handleColorChange(key: keyof ResumeStyleConfig["colors"], value: string) {
    onChangeStyle({
      ...style,
      colors: {
        ...style.colors,
        [key]: value,
      },
    });
  }

  function handleTemplateSelect(tplId: ResumeTemplateId) {
    const preset = getTemplatePreset(tplId);
    onChangeStyle({
      ...style,
      ...preset,
      templateId: tplId,
      colors: {
        ...style.colors,
        ...(preset.colors || {}),
      },
      fonts: {
        ...style.fonts,
        ...(preset.fonts || {}),
      },
      fontSizes: {
        ...style.fontSizes,
        ...(preset.fontSizes || {}),
      },
      spacing: {
        ...style.spacing,
        ...(preset.spacing || {}),
      },
      layout: {
        ...style.layout,
        ...(preset.layout || {}),
        columnLayout: tplId === "two-column-sidebar" ? "two-column-left" : "single",
        headerAlignment: tplId === "executive-classic" ? "center" : "left",
      },
    });
  }

  // Active template label
  const activeTemplateName =
    RESUME_TEMPLATES[style.templateId]?.name || "Modern Clean";

  return (
    <div className="space-y-4 p-4 text-xs select-none">
      {/* Top Header Controls: Title & Expand/Collapse All */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
          <SlidersHorizontal size={14} className="text-[#7A0F1F]" />
          <span>Design & Formatting</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <button
            type="button"
            onClick={expandAll}
            className="hover:text-[#7A0F1F] transition-colors"
          >
            Expand All
          </button>
          <span>&bull;</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:text-[#7A0F1F] transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ── 1. Saved Studio Formats & Resumes (Collapsible) ─────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all">
        <button
          type="button"
          onClick={() => toggleSection("studioFormats")}
          className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-50/80 hover:bg-slate-100/80 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F8E8EA] text-[#7A0F1F]">
              <Bookmark size={14} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Saved Studio Formats & Resumes
              </span>
              <span className="text-[10px] text-slate-500">
                {savedResumes.length} saved version{savedResumes.length === 1 ? "" : "s"} available
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 text-[#7A0F1F] border border-blue-200/60 px-2 py-0.5 text-[10px] font-bold">
              Studio
            </span>
            <ChevronDown
              size={15}
              className={`text-slate-400 transition-transform duration-200 ${
                openSections.studioFormats ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {openSections.studioFormats && (
          <div className="p-3.5 space-y-3 border-t border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-600">
                Select or apply formats generated from Resume Studio:
              </p>
              <Link
                href="/resume/studio"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A0F1F] hover:text-[#650B19]"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Open Studio</span>
                <ExternalLink size={10} />
              </Link>
            </div>

            {savedResumes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-slate-500">
                <p className="text-xs">No saved formats yet.</p>
                <Link
                  href="/resume/studio"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-[#7A0F1F] px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#650B19]"
                >
                  <Sparkles size={12} />
                  <span>Generate 3 Options in Studio</span>
                </Link>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto ce-scrollbar space-y-2 pr-1">
                {savedResumes.map((resItem) => {
                  const isActive = resItem.id === activeResumeId;
                  const tpl = RESUME_TEMPLATES[resItem.templateId as ResumeTemplateId];
                  return (
                    <div
                      key={resItem.id}
                      className={`rounded-xl border p-2.5 transition-all flex flex-col gap-1.5 ${
                        isActive
                          ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-xs truncate block">
                            {resItem.title}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-medium text-[#7A0F1F]">
                              {tpl?.name || resItem.templateId}
                            </span>
                            {resItem.targetRole && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate">{resItem.targetRole}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {resItem.atsScore ? (
                          <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold">
                            {resItem.atsScore}% ATS
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-200/60">
                        {/* Apply style format to current document */}
                        {resItem.styleData && onApplySavedFormat && (
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                const parsedStyle = JSON.parse(resItem.styleData!);
                                onApplySavedFormat(parsedStyle);
                              } catch {}
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#7A0F1F] bg-blue-100/70 hover:bg-blue-200/70 transition-colors"
                            title="Apply this template and styling to current resume"
                          >
                            Apply Style
                          </button>
                        )}

                        {/* Switch to this resume */}
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectResume) {
                                onSelectResume(resItem.id);
                              } else {
                                window.location.href = `/resume/builder?id=${resItem.id}`;
                              }
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                          >
                            Switch Resume
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#7A0F1F]">
                            <Check size={11} />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Templates Selection (Collapsible) ───────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all">
        <button
          type="button"
          onClick={() => toggleSection("templates")}
          className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-50/80 hover:bg-slate-100/80 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-600">
              <Layout size={14} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Resume Template & Layout
              </span>
              <span className="text-[10px] text-slate-500">
                Active: {activeTemplateName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-200/70 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
              {Object.keys(RESUME_TEMPLATES).length} Templates
            </span>
            <ChevronDown
              size={15}
              className={`text-slate-400 transition-transform duration-200 ${
                openSections.templates ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {openSections.templates && (
          <div className="p-3.5 space-y-3 border-t border-slate-100 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(RESUME_TEMPLATES).map((tpl) => {
                const isSelected = style.templateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition space-y-1.5 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/30 shadow-xs"
                        : "border-slate-200 bg-white hover:border-blue-400/60 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{tpl.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          tpl.isAtsSafe
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {tpl.atsRating}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      {tpl.description}
                    </p>
                    <div className="text-[9px] text-slate-500">
                      <strong>Best for:</strong> {tpl.recommendedFor}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Color Palette & WCAG Contrast (Collapsible) ─────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all">
        <button
          type="button"
          onClick={() => toggleSection("colors")}
          className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-50/80 hover:bg-slate-100/80 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100/70 text-pink-600">
              <Palette size={14} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Color Palette & Theme
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: style.colors.accent }}
                />
                <span>Accent: {style.colors.accent}</span>
              </span>
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-400 transition-transform duration-200 ${
              openSections.colors ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.colors && (
          <div className="p-3.5 space-y-3.5 border-t border-slate-100 bg-white">
            {/* Brand Presets */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Executive & Modern Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChangeStyle({ ...style, colors: preset.colors })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.colors.accent }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={style.colors.accent}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    className="h-7 w-7 rounded-md cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={style.colors.accent}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    className="w-20 rounded border border-slate-200 px-1.5 py-1 text-[11px] font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Heading Color
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={style.colors.heading}
                    onChange={(e) => handleColorChange("heading", e.target.value)}
                    className="h-7 w-7 rounded-md cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={style.colors.heading}
                    onChange={(e) => handleColorChange("heading", e.target.value)}
                    className="w-20 rounded border border-slate-200 px-1.5 py-1 text-[11px] font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Body Text
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={style.colors.body}
                    onChange={(e) => handleColorChange("body", e.target.value)}
                    className="h-7 w-7 rounded-md cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={style.colors.body}
                    onChange={(e) => handleColorChange("body", e.target.value)}
                    className="w-20 rounded border border-slate-200 px-1.5 py-1 text-[11px] font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Contrast Warning Display */}
            {contrastCheck.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                  <AlertTriangle size={13} />
                  <span>WCAG 2.1 Contrast Advisory</span>
                </div>
                {contrastCheck.warnings.map((w, idx) => (
                  <p key={idx} className="text-[10px] text-amber-800 leading-snug">
                    • {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Typography & Font Sizes (Collapsible) ───────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all">
        <button
          type="button"
          onClick={() => toggleSection("typography")}
          className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-50/80 hover:bg-slate-100/80 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-600">
              <Type size={14} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Typography & Safe Fonts
              </span>
              <span className="text-[10px] text-slate-500">
                {style.fonts.heading} / {style.fonts.body} &bull; {style.fontSizes.body}px
              </span>
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-400 transition-transform duration-200 ${
              openSections.typography ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.typography && (
          <div className="p-3.5 space-y-3.5 border-t border-slate-100 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Heading Font
                </label>
                <select
                  value={style.fonts.heading}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      fonts: { ...style.fonts, heading: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600"
                >
                  {SAFE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Body Font
                </label>
                <select
                  value={style.fonts.body}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      fonts: { ...style.fonts, body: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600"
                >
                  {SAFE_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sliders for Sizes */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] text-slate-600 mb-1">
                  Name: {style.fontSizes.name}px
                </label>
                <input
                  type="range"
                  min={18}
                  max={32}
                  value={style.fontSizes.name}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      fontSizes: { ...style.fontSizes, name: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 mb-1">
                  Headings: {style.fontSizes.headings}px
                </label>
                <input
                  type="range"
                  min={11}
                  max={18}
                  value={style.fontSizes.headings}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      fontSizes: { ...style.fontSizes, headings: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-600 mb-1">
                  Body: {style.fontSizes.body}px
                </label>
                <input
                  type="range"
                  min={10}
                  max={14}
                  value={style.fontSizes.body}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      fontSizes: { ...style.fontSizes, body: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Spacing & Layout Dimensions (Collapsible) ───────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all">
        <button
          type="button"
          onClick={() => toggleSection("spacing")}
          className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-50/80 hover:bg-slate-100/80 text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/70 text-amber-600">
              <Maximize2 size={14} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Spacing & Dimensions
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                Margins: {style.spacing.margins} &bull; Divider: {style.layout.dividerStyle}
              </span>
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-400 transition-transform duration-200 ${
              openSections.spacing ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.spacing && (
          <div className="p-3.5 space-y-3.5 border-t border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Margins & Dividers</span>
              {onFitToOnePage && (
                <button
                  type="button"
                  onClick={onFitToOnePage}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                >
                  <Sparkles size={11} className="text-amber-500" />
                  <span>Fit to 1 Page</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Page Margins
                </label>
                <select
                  value={style.spacing.margins}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      spacing: {
                        ...style.spacing,
                        margins: e.target.value as "compact" | "standard" | "relaxed",
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
                >
                  <option value="compact">Compact (8mm - Max Density)</option>
                  <option value="standard">Standard (12mm - Clean Balance)</option>
                  <option value="relaxed">Relaxed (16mm - Spacious)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Section Dividers
                </label>
                <select
                  value={style.layout.dividerStyle}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      layout: {
                        ...style.layout,
                        dividerStyle: e.target.value as ResumeStyleConfig["layout"]["dividerStyle"],
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
                >
                  <option value="solid">Solid Accent Rule</option>
                  <option value="dashed">Dashed Rule</option>
                  <option value="subtle">Subtle Light Rule</option>
                  <option value="none">No Dividers (Clean Whitespace)</option>
                </select>
              </div>
            </div>

            {/* Layout Options: Photo, Alignment, Icons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={style.layout.showContactIcons}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      layout: { ...style.layout, showContactIcons: e.target.checked },
                    })
                  }
                  className="rounded text-[#7A0F1F] focus:ring-[#7A0F1F]"
                />
                <span>Show Contact Icons</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={style.layout.showPhoto}
                  onChange={(e) =>
                    onChangeStyle({
                      ...style,
                      layout: { ...style.layout, showPhoto: e.target.checked },
                    })
                  }
                  className="rounded text-[#7A0F1F] focus:ring-[#7A0F1F]"
                />
                <span>Include Photo</span>
              </label>
            </div>

            {style.layout.showPhoto && (
              <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60 leading-relaxed">
                Note: Standard ATS employers recommend omitting photos to eliminate unconscious hiring bias. Use primarily for client-facing or hospitality roles.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 6. Reset to Defaults ───────────────────────────────────────── */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => onChangeStyle(DEFAULT_STYLE_CONFIG)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
        >
          <RotateCcw size={12} />
          <span>Reset Style to Defaults</span>
        </button>
      </div>
    </div>
  );
}