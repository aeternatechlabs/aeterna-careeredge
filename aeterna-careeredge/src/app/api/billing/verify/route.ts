// src/app/api/billing/verify/route.ts
// Verify Payment Signature & Activate Subscription

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/session";
import { grantDevSubscription } from "@/lib/monetization/entitlements";
import { trackProgressEvent } from "@/lib/guidance/progress";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, isDevUpgrade } = body;

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env["RAZORPAY_KEY_SECRET "] || "").trim();

    const isProd = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";

    // In production, strictly reject dev upgrades and require verified Razorpay signatures
    if (isProd && (isDevUpgrade || !razorpay_signature)) {
      return NextResponse.json(
        { error: "Payment verification requires a valid payment signature in production." },
        { status: 400 }
      );
    }

    // In development/test mode, allow simulated upgrade for local verification
    if (isDevUpgrade || !razorpay_signature) {
      const sub = await grantDevSubscription(
        session.userId,
        planId || "PREMIUM",
        30 // 30-day validity
      );

      await trackProgressEvent({
        userId: session.userId,
        eventType: "READINESS_REPORT_GENERATED",
        title: "Upgraded to CareerEdge Pro",
        description: "Unlocked unlimited resume versions, 1-click application packs, and interview prep kits.",
      });

      return NextResponse.json({ success: true, subscription: sub, mode: "DEV_GRANT" });
    }

    // Verify HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const sub = await grantDevSubscription(session.userId, planId || "PREMIUM", 30);

    await trackProgressEvent({
      userId: session.userId,
      eventType: "READINESS_REPORT_GENERATED",
      title: "Upgraded to CareerEdge Pro",
      description: `Payment verified (${razorpay_payment_id}). Subscription active.`,
    });

    return NextResponse.json({ success: true, subscription: sub, mode: "RAZORPAY_VERIFIED" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
