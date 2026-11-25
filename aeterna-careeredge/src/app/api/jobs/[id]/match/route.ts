// src/app/api/jobs/[id]/match/route.ts
// Evaluate factual requirement alignment between student Career Passport and job

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { jobProvider } from "@/lib/jobs/provider";
import { matchStudentToJob } from "@/lib/jobs/matching";
import { trackProgressEvent } from "@/lib/guidance/progress";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await jobProvider.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job listing not found" }, { status: 404 });
    }

    const matchResult = await matchStudentToJob(session.userId, job);

    // Track progress event
    await trackProgressEvent({
      userId: session.userId,
      eventType: "READINESS_REPORT_GENERATED",
      title: `Job Match evaluated for ${job.title}`,
      description: `Match Score: ${matchResult.matchScore}/100 at ${job.company}`,
      refId: job.id,
      metadata: { jobId: job.id, matchScore: matchResult.matchScore },
    });

    return NextResponse.json(matchResult);
  } catch (error) {
    console.error("Error matching job:", error);
    return NextResponse.json(
      { error: "Failed to evaluate job match" },
      { status: 500 }
    );
  }
}
