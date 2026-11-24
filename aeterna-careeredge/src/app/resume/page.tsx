// src/app/resume/page.tsx
// Redirect /resume to Resume Studio All Resumes tab

import { redirect } from "next/navigation";

export default function ResumeOverviewPage() {
  redirect("/resume/studio?tab=resumes");
}
