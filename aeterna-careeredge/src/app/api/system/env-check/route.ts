import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Disabled diagnostic endpoint.
 * Returns a consistent 404 without initializing privileged clients,
 * querying the database, or exposing environment metadata.
 */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
