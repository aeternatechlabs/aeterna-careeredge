// src/app/passport/page.tsx
// Career Passport - Single Source of Truth Aggregate View

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { PassportClient } from "./passport-client";

export default async function PassportPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
      educations: { orderBy: { startYear: "desc" } },
      skills: true,
      projects: true,
      experiences: { orderBy: { startDate: "desc" } },
      certifications: true,
      storedDocuments: { orderBy: { createdAt: "desc" } },
      linkedInProfile: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  let stagedLinkedIn = null;
  if (user.linkedInProfile?.importedRawJson) {
    try {
      const parsed = JSON.parse(user.linkedInProfile.importedRawJson);
      if (
        (parsed.skills && parsed.skills.length > 0) ||
        (parsed.experiences && parsed.experiences.length > 0) ||
        (parsed.educations && parsed.educations.length > 0)
      ) {
        stagedLinkedIn = {
          skills: (parsed.skills || []) as string[],
          educations: (parsed.educations || []) as Array<{
            degree: string;
            institution: string;
            year?: string;
          }>,
          experiences: (parsed.experiences || []) as Array<{
            title: string;
            company: string;
            duration?: string;
            description?: string;
          }>,
          headline: (parsed.headline || null) as string | null,
          provenance: (parsed.provenance || "LINKEDIN_PDF") as string,
        };
      }
    } catch {
      // Ignored
    }
  }

  return (
    <PassportClient
      stagedLinkedIn={stagedLinkedIn}
      user={{
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profile: user.profile,
        educations: user.educations.map((e) => ({
          id: e.id,
          institution: e.institution,
          degree: e.degree || e.level,
          level: e.level,
          fieldOfStudy: e.fieldOfStudy,
          startYear: e.startYear,
          endYear: e.endYear,
          isCurrent: e.isCurrent,
          startDate: e.startYear ? String(e.startYear) : "N/A",
          endDate: e.endYear ? String(e.endYear) : e.isCurrent ? "Present" : null,
          score: e.scoreOrGrade,
        })),
        skills: user.skills.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          level: s.proficiencyLevel || "INTERMEDIATE",
        })),
        projects: user.projects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          role: p.role,
          technologies: p.toolsOrTechnologies,
          projectType: p.projectType,
          url: p.projectUrl,
          artifactUrl: p.artifactUrl,
        })),
        experiences: user.experiences.map((exp) => ({
          id: exp.id,
          jobTitle: exp.jobTitle,
          companyName: exp.companyName,
          employmentType: exp.employmentType,
          startDate: exp.startDate ? new Date(exp.startDate).toLocaleDateString() : "N/A",
          endDate: exp.endDate ? new Date(exp.endDate).toLocaleDateString() : exp.isCurrent ? "Present" : null,
          rawStartDate: exp.startDate ? exp.startDate.toISOString().split("T")[0] : "",
          rawEndDate: exp.endDate ? exp.endDate.toISOString().split("T")[0] : "",
          isCurrent: exp.isCurrent,
          description: exp.description,
        })),
        certifications: user.certifications.map((c) => ({
          id: c.id,
          name: c.title,
          issuingOrg: c.issuingOrganization,
          issueDate: c.issueDate ? new Date(c.issueDate).toLocaleDateString() : null,
          rawIssueDate: c.issueDate ? c.issueDate.toISOString().split("T")[0] : "",
          credentialUrl: c.credentialUrl,
        })),
        documentCount: user.storedDocuments.length,
      }}
    />
  );
}
