// src/app/api/billing/plans/route.ts
// Retrieve available plans and current user subscription details

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PLANS } from "@/lib/monetization/plans";
import { getUserPlan } from "@/lib/monetization/entitlements";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlanInfo = await getUserPlan(session.userId);

    const rawKeyId = process.env.RAZORPAY_KEY_ID || process.env["RAZORPAY_KEY_ID "];
    const razorpayKeyId = cleanKey(rawKeyId) || null;

    return NextResponse.json(
      {
        plans: Object.values(PLANS),
        currentPlan: userPlanInfo.planConfig,
        subscription: {
          status: userPlanInfo.status,
          validUntil: userPlanInfo.validUntil,
          source: userPlanInfo.source,
        },
        razorpayKeyId,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error retrieving billing plans:", error);
    return NextResponse.json(
      { error: "Failed to load billing plans" },
      { status: 500 }
    );
  }
}
