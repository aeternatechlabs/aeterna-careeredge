import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { ParsedResumePayload } from "@/lib/resume/parser";
import {
  generateStudioOptions,
  type StudioGenerationInput,
} from "@/lib/resume/studio-generator";
import {
  sanitizeResumePayload,
  cleanBulletText,
  cleanMojibake,
} from "@/lib/resume/sanitizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const supabase = getSupabaseAdmin();

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required to generate resume options. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      sourceType = "passport",
      targetRolePrompt = "Full Stack Developer",
      jobDescription = "",
      professionDomain = "it",
      parsedPayload: providedPayload,
    } = body;

    let parsedPayload: ParsedResumePayload = providedPayload;

    // If source is passport, assemble payload from verified database records
    if (sourceType === "passport" || !parsedPayload) {
      let user: { name: string; email: string; mobile: string | null } | null = null;
      let profile: any = null;
      let educations: any[] = [];
      let experiences: any[] = [];
      let projects: any[] = [];
      let skills: any[] = [];
      let certifications: any[] = [];

      if (supabase) {
        const [uRes, pRes, eRes, expRes, prjRes, sRes, cRes] = await Promise.all([
          supabase.from("users").select("name, email, mobile").eq("id", session.userId).maybeSingle(),
          supabase.from("student_profiles").select("*").eq("userId", session.userId).maybeSingle(),
          supabase.from("education_records").select("*").eq("userId", session.userId).order("startYear", { ascending: false }),
          supabase.from("student_experiences").select("*").eq("userId", session.userId),
          supabase.from("student_projects").select("*").eq("userId", session.userId),
          supabase.from("student_skills").select("*").eq("userId", session.userId),
          supabase.from("certifications").select("*").eq("userId", session.userId),
        ]);
        user = uRes.data;
        profile = pRes.data;
        educations = eRes.data || [];
        experiences = expRes.data || [];
        projects = prjRes.data || [];
        skills = sRes.data || [];
        certifications = cRes.data || [];
      } else {
        user = await db.user.findUnique({
          where: { id: session.userId },
          select: { name: true, email: true, mobile: true },
        });

        profile = await db.studentProfile.findUnique({
          where: { userId: session.userId },
        });

        educations = await db.educationRecord.findMany({
          where: { userId: session.userId },
          orderBy: { startYear: "desc" },
        });

        experiences = await db.studentExperience.findMany({
          where: { userId: session.userId },
        });

        projects = await db.studentProject.findMany({
          where: { userId: session.userId },
        });

        skills = await db.studentSkill.findMany({
          where: { userId: session.userId },
        });

        certifications = await db.certification.findMany({
          where: { userId: session.userId },
        });
      }

      parsedPayload = {
        contactInfo: {
          name: user?.name || "Student Candidate",
          email: user?.email || "candidate@example.com",
          phone: user?.mobile || "+91 9876543210",
          location: [profile?.city, profile?.state].filter(Boolean).join(", ") || "Bengaluru, India",
        },
        summary: profile?.bio || profile?.headline || `Motivated professional specializing in ${profile?.academicDomain || "Technology & Engineering"}.`,
        education: educations.map((e) => ({
          degree: e.degree || e.level,
          institution: e.institution,
          branch: e.fieldOfStudy || undefined,
          startYear: e.startYear ? String(e.startYear) : undefined,
          endYear: e.endYear ? String(e.endYear) : undefined,
          score: e.scoreOrGrade || undefined,
        })),
        experience: experiences.map((exp) => ({
          title: exp.jobTitle,
          company: exp.companyName,
          location: exp.location || undefined,
          startDate: exp.startDate ? String(exp.startDate).slice(0, 7) : undefined,
          endDate: exp.endDate ? String(exp.endDate).slice(0, 7) : undefined,
          isCurrent: exp.isCurrent,
          bullets: exp.description ? exp.description.split("\n").map(cleanBulletText).filter(Boolean) : [
            `Contributed to core deliverables and team initiatives at ${exp.companyName}.`,
            "Collaborated cross-functionally to achieve key delivery milestones on schedule.",
          ],
        })),
        projects: projects.map((p) => {
          const techList = p.toolsOrTechnologies
            ? (p.toolsOrTechnologies.startsWith("[") ? JSON.parse(p.toolsOrTechnologies) : p.toolsOrTechnologies.split(","))
            : [];
          return {
            title: cleanBulletText(p.title),
            subtitle: Array.isArray(techList) ? techList.map(cleanMojibake).join(", ") : undefined,
            url: p.projectUrl || undefined,
            bullets: p.description ? p.description.split("\n").map(cleanBulletText).filter(Boolean) : [
              `Engineered ${p.title} addressing key functional requirements.`,
              "Verified operational integrity through structured testing and documentation.",
            ],
            techStack: Array.isArray(techList) ? techList.map(cleanMojibake) : undefined,
          };
        }),
        skills: skills.map((s) => ({
          name: s.name,
          category: (s.category as "TECHNICAL" | "DOMAIN" | "TOOL" | "SOFT") || "TECHNICAL",
        })),
        certifications: certifications.map((c) => ({
          title: c.title,
          issuer: c.issuingOrganization,
          year: c.issueDate ? String(c.issueDate).slice(0, 4) : undefined,
        })),
        customSections: [],
        rawTextSnippet: "",
        contentHash: "",
      };
    }

    const input: StudioGenerationInput = {
      targetRolePrompt,
      jobDescription,
      professionDomain,
      parsedPayload,
    };

    const studioResult = await generateStudioOptions(input);

    return NextResponse.json({
      success: true,
      ...studioResult,
    });
  } catch (error: any) {
    console.error("[ResumeStudio API] Generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate strategic resume options." },
      { status: 500 }
    );
  }
}
