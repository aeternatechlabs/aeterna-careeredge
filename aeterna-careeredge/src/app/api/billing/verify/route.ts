// src/app/api/billing/verify/route.ts
// Verify Payment Signature & Activate Subscription

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ensurePlansSeeded } from "@/lib/monetization/entitlements";
import { trackProgressEvent } from "@/lib/guidance/progress";

export const dynamic = "force-dynamic";

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = body;

    await ensurePlansSeeded();

    // ── Self-Service Downgrade to FREE ──────────────────────────────────────────
    if (planId === "FREE") {
      const sub = await db.userSubscription.upsert({
        where: { userId: session.userId },
        update: {
          planId: "FREE",
          status: "ACTIVE",
          validFrom: new Date(),
          validUntil: null,
          source: "USER_DOWNGRADE",
        },
        create: {
          userId: session.userId,
          planId: "FREE",
          status: "ACTIVE",
          validFrom: new Date(),
          validUntil: null,
          source: "DEFAULT_FREE",
        },
      });

      return NextResponse.json({ success: true, subscription: sub, mode: "DOWNGRADED_FREE" });
    }

    // ── Paid Plan Verification (PREMIUM / PLACEMENT_PASS) ───────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification requires razorpay_order_id, razorpay_payment_id, and razorpay_signature." },
        { status: 400 }
      );
    }

    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env["RAZORPAY_KEY_SECRET "];
    const keySecret = cleanKey(rawKeySecret);

    if (!keySecret) {
      console.error("Payment verification failed: RAZORPAY_KEY_SECRET is missing.");
      return NextResponse.json(
        { error: "Payment gateway secret not configured on server." },
        { status: 500 }
      );
    }

    // Verify HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("Razorpay HMAC signature mismatch:", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        receivedSig: razorpay_signature,
        generatedSig: generatedSignature,
      });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const targetPlan = planId === "PLACEMENT_PASS" ? "PLACEMENT_PASS" : "PREMIUM";
    const durationDays = targetPlan === "PLACEMENT_PASS" ? 45 : 30;
    const validUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const sub = await db.userSubscription.upsert({
      where: { userId: session.userId },
      update: {
        planId: targetPlan,
        status: "ACTIVE",
        validFrom: new Date(),
        validUntil,
        source: "RAZORPAY_VERIFIED",
      },
      create: {
        userId: session.userId,
        planId: targetPlan,
        status: "ACTIVE",
        validFrom: new Date(),
        validUntil,
        source: "RAZORPAY_VERIFIED",
      },
    });

    await trackProgressEvent({
      userId: session.userId,
      eventType: "READINESS_REPORT_GENERATED",
      title: targetPlan === "PLACEMENT_PASS" ? "Activated Placement Season Pass" : "Upgraded to CareerEdge Pro",
      description: `Payment verified (${razorpay_payment_id}). All features unlocked.`,
    });

    return NextResponse.json({
      success: true,
      subscription: sub,
      mode: "RAZORPAY_VERIFIED",
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error?.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
