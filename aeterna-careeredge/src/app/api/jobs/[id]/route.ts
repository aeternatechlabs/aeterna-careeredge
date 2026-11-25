// src/app/api/jobs/[id]/route.ts
// Retrieve specific job listing details

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { jobProvider } from "@/lib/jobs/provider";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await jobProvider.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job listing not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error retrieving job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}
