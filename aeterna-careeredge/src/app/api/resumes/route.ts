// src/app/api/resumes/route.ts
// Multi-Domain Resume Management API (Day 2 Part 3)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkForDomain } from "@/lib/resume/frameworks";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: resumes, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("userId", session.userId)
        .order("updatedAt", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return NextResponse.json({ resumes: resumes || [] });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ resumes });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to load resumes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      targetRole,
      templateId = "standard-modern",
      importFromPassport = true,
      domain: inputDomain,
    } = body;

    const supabase = getSupabaseAdmin();

    // Load Student Passport data if importing
    let user: any = null;
    if (supabase) {
      const [uRes, pRes, eRes, sRes, expRes, prjRes, cRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", session.userId).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("userId", session.userId).maybeSingle(),
        supabase.from("education_records").select("*").eq("userId", session.userId),
        supabase.from("student_skills").select("*").eq("userId", session.userId),
        supabase.from("student_experiences").select("*").eq("userId", session.userId),
        supabase.from("student_projects").select("*").eq("userId", session.userId),
        supabase.from("certifications").select("*").eq("userId", session.userId),
      ]);
      if (uRes.data) {
        user = {
          ...uRes.data,
          profile: pRes.data || null,
          educations: eRes.data || [],
          skills: sRes.data || [],
          experiences: expRes.data || [],
          projects: prjRes.data || [],
          certifications: cRes.data || [],
        };
      }
    } else {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
          profile: true,
          educations: true,
          skills: true,
          experiences: true,
          projects: true,
          certifications: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const academicDomain = inputDomain || user.profile?.academicDomain || "General";
    const framework = getFrameworkForDomain(academicDomain);
    const resolvedRole = targetRole || user.profile?.preferredJobRole || framework.suggestedRoles[0] || "Graduate Trainee";
    const resumeTitle = title || `${resolvedRole} Resume`;

    let structuredDataObj: Record<string, unknown> = {};

    if (importFromPassport) {
      structuredDataObj = {
        domainKey: framework.domainKey,
        domainName: framework.name,
        targetRole: resolvedRole,
        templateId,
        contactInfo: {
          name: user.name,
          email: user.email,
          phone: user.mobile || "",
          location: user.profile?.city || user.profile?.state || "India",
        },
        summary: `Motivated ${framework.name} candidate with practical background in ${user.profile?.course || "higher education"}. Dedicated to high standards and continuous learning as a ${resolvedRole}.`,
        skills:
          user.skills.length > 0
            ? user.skills.map((s: any) => s.name)
            : user.profile?.skills
              ? (() => {
                  try {
                    const parsed = JSON.parse(user.profile.skills);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch {
                    return [];
                  }
                })()
              : [],
        education:
          user.educations.length > 0
            ? user.educations.map((e: any) => ({
                degree: e.degree || e.level || "Degree",
                institution: e.institution,
                startYear: e.startYear,
                endYear: e.endYear,
                score: e.scoreOrGrade || undefined,
              }))
            : user.profile?.institution
              ? [
                  {
                    degree: user.profile.course || user.profile.educationLevel || "Degree",
                    institution: user.profile.institution,
                    startYear: user.profile.graduationYear ? user.profile.graduationYear - 4 : undefined,
                    endYear: user.profile.graduationYear || undefined,
                    score: user.profile.gradeValue || undefined,
                  },
                ]
              : [],
        experience:
          user.experiences.length > 0
            ? user.experiences.map((exp: any) => ({
                title: exp.jobTitle,
                organization: exp.companyName,
                type: exp.experienceType || exp.employmentType || "Internship",
                startDate: exp.startDate ? (typeof exp.startDate === "string" ? exp.startDate.slice(0, 7) : exp.startDate.toISOString().slice(0, 7)) : undefined,
                endDate: exp.endDate ? (typeof exp.endDate === "string" ? exp.endDate.slice(0, 7) : exp.endDate.toISOString().slice(0, 7)) : undefined,
                isCurrent: exp.isCurrent,
                description: exp.description || "",
              }))
            : user.profile?.experience
              ? [
                  {
                    title: user.profile.preferredJobRole || "Intern",
                    organization: "Professional Practical Training",
                    type: "Internship",
                    description: user.profile.experience,
                  },
                ]
              : [],
        projects:
          user.projects.length > 0
            ? user.projects.map((p: any) => {
                let techList: string[] = [];
                if (p.techStack) {
                  try {
                    const parsed = JSON.parse(p.techStack);
                    if (Array.isArray(parsed)) techList = parsed;
                  } catch {
                    techList = [p.techStack];
                  }
                } else if (p.toolsOrTechnologies) {
                  techList = p.toolsOrTechnologies.split(/[,+]/).map((t: any) => t.trim()).filter(Boolean);
                }
                return {
                  title: p.title,
                  role: p.role || undefined,
                  techStack: techList,
                  url: p.projectUrl || p.artifactUrl || undefined,
                  description: p.description || "",
                };
              })
            : user.profile?.projects
              ? (() => {
                  const trimmed = user.profile.projects.trim();
                  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    try {
                      const parsed = JSON.parse(trimmed);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed.map((p: Record<string, unknown>) => ({
                          title: String(p.title || "Applied Practical Project"),
                          role: p.role ? String(p.role) : undefined,
                          techStack: p.technologies
                            ? (typeof p.technologies === "string"
                                ? p.technologies.split(/[,+]/).map((t) => t.trim()).filter(Boolean)
                                : Array.isArray(p.technologies)
                                  ? (p.technologies as string[])
                                  : [])
                            : [],
                          url: p.url ? String(p.url) : undefined,
                          description: String(p.description || ""),
                        }));
                      }
                    } catch {
                      // Fallback below
                    }
                  }
                  return [
                    {
                      title: "Applied Practical Project",
                      techStack: [],
                      description: trimmed,
                    },
                  ];
                })()
              : [],
        certifications:
          user.certifications.length > 0
            ? user.certifications.map((c: any) => c.title)
            : user.profile?.certifications
              ? user.profile.certifications
                  .split(/[,;\n]/)
                  .map((c: any) => c.trim())
                  .filter(Boolean)
              : [],
        frameworkSections: framework.sections.map((sec) => ({
          key: sec.key,
          label: sec.label,
          content: "",
        })),
      };
    } else {
      structuredDataObj = {
        domainKey: framework.domainKey,
        domainName: framework.name,
        targetRole: resolvedRole,
        templateId,
        contactInfo: {
          name: user.name,
          email: user.email,
          phone: user.mobile || "",
          location: "India",
        },
        summary: "",
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        frameworkSections: framework.sections.map((sec) => ({
          key: sec.key,
          label: sec.label,
          content: "",
        })),
      };
    }

    let newResume: any = null;
    if (supabase) {
      const { data: created, error: createError } = await supabase
        .from("resumes")
        .insert({
          userId: session.userId,
          title: resumeTitle,
          targetRole: resolvedRole,
          templateId,
          structuredData: JSON.stringify(structuredDataObj),
          atsScore: 78,
        })
        .select()
        .single();
      if (createError || !created) {
        throw new Error(createError?.message || "Failed to create resume.");
      }
      newResume = created;
    } else {
      newResume = await prisma.resume.create({
        data: {
          userId: session.userId,
          title: resumeTitle,
          targetRole: resolvedRole,
          templateId,
          structuredData: JSON.stringify(structuredDataObj),
          atsScore: 78,
        },
      });
    }

    return NextResponse.json({ resume: newResume }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to create resume." },
      { status: 500 }
    );
  }
}
