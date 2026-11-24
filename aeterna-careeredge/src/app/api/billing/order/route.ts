// src/app/api/billing/order/route.ts
// Create Razorpay Order for Plan Upgrade

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PLANS } from "@/lib/monetization/plans";

export const dynamic = "force-dynamic";

function cleanKey(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = body.planId || "PREMIUM";
    const selectedPlan = PLANS[planId] || PLANS.PREMIUM;

    const rawKeyId = process.env.RAZORPAY_KEY_ID || process.env["RAZORPAY_KEY_ID "];
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env["RAZORPAY_KEY_SECRET "];

    const keyId = cleanKey(rawKeyId);
    const keySecret = cleanKey(rawKeySecret);

    const amountInPaise = selectedPlan.priceInr * 100;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment gateway credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured." },
        { status: 500 }
      );
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${session.userId.slice(-6)}_${Date.now()}`,
        notes: {
          userId: session.userId,
          planId: selectedPlan.id,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Razorpay order creation failed:", res.status, errText);
      return NextResponse.json(
        { error: `Razorpay API Error (${res.status}): Unable to initialize order.` },
        { status: res.status }
      );
    }

    const order = await res.json();
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      isLive: true,
    });
  } catch (error: any) {
    console.error("Error creating billing order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
