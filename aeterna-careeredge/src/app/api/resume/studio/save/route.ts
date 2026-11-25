import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateId } from "@/lib/supabase/db-proxy";
import { db } from "@/lib/db";
import { DEFAULT_STYLE_CONFIG } from "@/lib/resume/templates";
import { computeResumeContentHash } from "@/lib/resume/adapter";
import type { ResumeStudioStrategyOption } from "@/lib/resume/studio-generator";
import type { FullResumeData } from "@/lib/resume/types";
import { sanitizeResumeData, cleanMojibake } from "@/lib/resume/sanitizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = (await getSession(req)) || (await getSession());
    const supabase = getSupabaseAdmin();

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to save resume. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      option,
      contactInfo,
      resumeTitle,
      targetRole,
      fitToOnePage,
    }: {
      option: ResumeStudioStrategyOption;
      contactInfo: any;
      resumeTitle?: string;
      targetRole?: string;
      fitToOnePage?: boolean;
    } = body;

    if (!option || !option.sections) {
      return NextResponse.json(
        { error: "Invalid resume option data." },
        { status: 400 }
      );
    }

    // Prepare sections including summary
    const sectionsWithSummary = [...option.sections];
    if (option.summary) {
      const existingSummaryIdx = sectionsWithSummary.findIndex((s) => s.type === "summary");
      const summarySec = {
        id: `sec_sum_${Date.now()}`,
        type: "summary" as const,
        customTitle: "Professional Summary",
        visible: true,
        entries: [
          {
            id: `ent_sum_${Date.now()}`,
            text: option.summary,
            bullets: [],
            provenance: "DOCUMENT_EXTRACTED" as const,
          },
        ],
      };
      if (existingSummaryIdx >= 0) {
        sectionsWithSummary[existingSummaryIdx] = summarySec;
      } else {
        sectionsWithSummary.unshift(summarySec);
      }
    }

    // Configure style with fitToOnePage if requested
    const effectiveStyle = {
      ...DEFAULT_STYLE_CONFIG,
      fontSizes: Boolean(fitToOnePage)
        ? {
            ...DEFAULT_STYLE_CONFIG.fontSizes,
            name: 20,
            headings: 12,
            body: 9.5,
          }
        : DEFAULT_STYLE_CONFIG.fontSizes,
      spacing: {
        ...DEFAULT_STYLE_CONFIG.spacing,
        margins: Boolean(fitToOnePage) ? ("compact" as const) : DEFAULT_STYLE_CONFIG.spacing.margins,
        sectionSpacing: Boolean(fitToOnePage) ? 6 : DEFAULT_STYLE_CONFIG.spacing.sectionSpacing,
        lineHeight: Boolean(fitToOnePage) ? 1.25 : DEFAULT_STYLE_CONFIG.spacing.lineHeight,
        bulletIndent: Boolean(fitToOnePage) ? 12 : DEFAULT_STYLE_CONFIG.spacing.bulletIndent,
      },
      page: {
        ...DEFAULT_STYLE_CONFIG.page,
        fitToOnePage: Boolean(fitToOnePage),
      },
    };

    // If Fit to 1 Page is active, prune excessive bullets to guarantee 1-page fit
    const finalSections = Boolean(fitToOnePage)
      ? sectionsWithSummary.map((sec) => {
          if (sec.type === "experience" || sec.type === "projects") {
            return {
              ...sec,
              entries: sec.entries.map((entry) => ({
                ...entry,
                bullets: (entry.bullets || []).slice(0, 2),
              })),
            };
          }
          return sec;
        })
      : sectionsWithSummary;

    // Prepare full structured data
    const structuredDataObj: FullResumeData = sanitizeResumeData({
      domainKey: "engineering",
      domainName: targetRole || "Professional",
      targetRole: targetRole || "Target Professional",
      contactInfo: contactInfo || {
        name: "Student Candidate",
        email: "candidate@example.com",
        phone: "+91 9876543210",
        location: "Bengaluru, India",
      },
      sections: finalSections,
      style: effectiveStyle,
    });

    const contentHash = computeResumeContentHash(structuredDataObj);
    const serializedData = JSON.stringify(structuredDataObj);

    const title = cleanMojibake(resumeTitle || `${targetRole || "Role"} - ${option.strategyName}`);

    const resumePayload = {
      userId: session.userId,
      title,
      targetRole: targetRole || null,
      templateId: option.templateId || "standard-modern",
      structuredData: serializedData,
      styleData: JSON.stringify(effectiveStyle),
      atsScore: option.matchScore || 85,
      contentHash,
      isDefault: false,
    };

    let newResume: { id: string; title: string };

    if (supabase) {
      const { data: created, error: insertError } = await supabase
        .from("resumes")
        .insert({ id: generateId(), ...resumePayload, updatedAt: new Date().toISOString() })
        .select("id, title")
        .single();
      if (insertError || !created) {
        throw new Error(insertError?.message || "Failed to save active resume.");
      }
      newResume = created;
    } else {
      newResume = await db.resume.create({
        data: resumePayload,
      });
    }

    return NextResponse.json({
      success: true,
      resumeId: newResume.id,
      title: newResume.title,
    });
  } catch (error: any) {
    console.error("[ResumeStudio Save API] Error saving resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save active resume." },
      { status: 500 }
    );
  }
}
