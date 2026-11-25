// src/app/api/applications/route.ts
// Job Applications list & create API

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  listUserApplications,
  createOrUpdateApplication,
  type ApplicationStatus,
} from "@/lib/applications/service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as ApplicationStatus) || undefined;

    const applications = await listUserApplications(session.userId, status);
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error listing applications:", error);
    return NextResponse.json(
      { error: "Failed to list job applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.jobTitle || !body.companyName) {
      return NextResponse.json(
        { error: "jobTitle and companyName are required" },
        { status: 400 }
      );
    }

    const application = await createOrUpdateApplication(session.userId, {
      id: body.id,
      jobTitle: body.jobTitle,
      companyName: body.companyName,
      jobListingRefId: body.jobListingRefId,
      jobUrl: body.jobUrl,
      location: body.location,
      salary: body.salary,
      employmentType: body.employmentType,
      applicationStatus: body.applicationStatus,
      appliedDate: body.appliedDate ? new Date(body.appliedDate) : undefined,
      notes: body.notes,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
