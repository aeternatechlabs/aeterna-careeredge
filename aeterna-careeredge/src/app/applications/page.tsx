// src/app/applications/page.tsx
// Job Application Tracker & Tailored Application Pack

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listUserApplications, type ApplicationStatus } from "@/lib/applications/service";
import { ApplicationsClient } from "./applications-client";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [rawApps, resolvedParams] = await Promise.all([
    listUserApplications(session.userId).catch(() => []),
    searchParams,
  ]);

  const initialApplications = rawApps.map((app) => ({
    ...app,
    applicationStatus: app.applicationStatus as ApplicationStatus,
    appliedDate: app.appliedDate ? app.appliedDate.toISOString() : null,
    followUpDate: app.followUpDate ? app.followUpDate.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }));

  const initialJobTitle = typeof resolvedParams.jobTitle === "string" ? resolvedParams.jobTitle : undefined;
  const initialCompany = typeof resolvedParams.company === "string" ? resolvedParams.company : undefined;
  const initialRefId = typeof resolvedParams.refId === "string" ? resolvedParams.refId : undefined;

  return (
    <ApplicationsClient
      studentName={session.name || "Student"}
      initialApplications={initialApplications}
      initialJobTitle={initialJobTitle}
      initialCompany={initialCompany}
      initialRefId={initialRefId}
    />
  );
}
