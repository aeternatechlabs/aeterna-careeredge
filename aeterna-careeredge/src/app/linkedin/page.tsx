// src/app/linkedin/page.tsx
// LinkedIn Profile Intelligence & Optimization Page (Day 2 Part 4)

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { LinkedInClient } from "./linkedin-client";
import { isLinkedInConfigured } from "@/lib/linkedin/oauth";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LinkedInPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const resolved = await searchParams;
  const errorParam = typeof resolved.error === "string" ? resolved.error : undefined;
  const connectedParam = typeof resolved.connected === "string" ? resolved.connected : undefined;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      profile: {
        select: {
          academicDomain: true,
          preferredJobRole: true,
          course: true,
          institution: true,
        },
      },
      skills: {
        select: { id: true, name: true, category: true },
      },
      experiences: {
        select: { id: true, jobTitle: true, companyName: true },
      },
      linkedInProfile: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <LinkedInClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        academicDomain: user.profile?.academicDomain || "Multi-Domain",
        preferredJobRole: user.profile?.preferredJobRole || undefined,
        course: user.profile?.course || undefined,
        institution: user.profile?.institution || undefined,
      }}
      initialProfile={user.linkedInProfile}
      skills={user.skills}
      experiencesCount={user.experiences.length}
      isOidcConfigured={isLinkedInConfigured()}
      errorParam={errorParam}
      connectedParam={connectedParam}
    />
  );
}
