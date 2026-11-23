// src/lib/monetization/entitlements.ts
// Entitlement Service & Usage Metering for Aeterna CareerEdge (Day 2 Section E)
// Enforces free vs premium boundaries without fake paywalls or dark patterns.

import { db } from "@/lib/db";
import { PLANS, type PlanConfig } from "./plans";

export interface UsageMeter {
  featureKey: string;
  planName: string;
  isUnlimited: boolean;
  used: number;
  limit: number;
  remaining: number;
  isExhausted: boolean;
  resetsAt: Date;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  meter: UsageMeter;
  plan: PlanConfig;
  bypassedForTesting?: boolean;
}

/**
 * Determine entitlement enforcement mode.
 * Defaults to 'off' in development/staging/testing, 'on' in production.
 */
export function getEntitlementEnforcementMode(): "off" | "soft" | "on" {
  const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
  const raw = (process.env.ENTITLEMENT_ENFORCEMENT || "").toLowerCase();
  if (raw === "off" || raw === "soft" || raw === "on") {
    return raw;
  }
  return appEnv === "production" ? "on" : "off";
}

let plansSeededInMemory = false;

/**
 * Ensure default plans are seeded in the database.
 */
export async function ensurePlansSeeded(force = false) {
  if (plansSeededInMemory && !force) return;

  try {
    const existingCount = await db.plan.count();
    if (existingCount >= 3 && !force) {
      plansSeededInMemory = true;
      return;
    }

    for (const plan of Object.values(PLANS)) {
      await db.plan.upsert({
        where: { id: plan.id },
        update: {
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          priceInr: plan.priceInr,
          interval: plan.interval,
          isDefault: plan.isDefault,
        },
        create: {
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          priceInr: plan.priceInr,
          interval: plan.interval,
          isDefault: plan.isDefault,
        },
      });

      for (const [featureKey, quota] of Object.entries(plan.quotas)) {
        await db.planFeatureLimit.upsert({
          where: {
            planId_featureKey: {
              planId: plan.id,
              featureKey,
            },
          },
          update: { monthlyQuota: quota },
          create: {
            planId: plan.id,
            featureKey,
            monthlyQuota: quota,
          },
        });
      }
    }
    plansSeededInMemory = true;
  } catch (err) {
    console.warn("ensurePlansSeeded non-critical warning:", err);
  }
}

/**
 * Get the current active plan for a student.
 * If none exists, creates an active FREE subscription.
 */
export async function getUserPlan(userId: string): Promise<{
  planConfig: PlanConfig;
  status: string;
  validUntil: Date | null;
  source: string;
}> {
  const sub = await db.userSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  const now = new Date();

  // If sub exists and is still valid
  if (sub && sub.status === "ACTIVE") {
    if (!sub.validUntil || sub.validUntil > now) {
      const config = PLANS[sub.planId] || PLANS.FREE;
      return {
        planConfig: config,
        status: sub.status,
        validUntil: sub.validUntil,
        source: sub.source,
      };
    } else {
      // Expired short-term pass or subscription: update status
      await db.userSubscription.update({
        where: { userId },
        data: { status: "EXPIRED" },
      });
    }
  }

  // Default to FREE
  const freeConfig = PLANS.FREE;
  return {
    planConfig: freeConfig,
    status: "ACTIVE",
    validUntil: null,
    source: "DEFAULT_FREE",
  };
}

/**
 * Calculate the next monthly reset date (1st of next calendar month).
 */
export function getNextMonthlyResetDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/**
 * Get start of current calendar month in UTC.
 */
export function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Check whether a student has remaining quota for an operation.
 */
export async function checkEntitlement(
  userId: string,
  featureKey: string
): Promise<EntitlementCheckResult> {
  const { planConfig } = await getUserPlan(userId);
  const normalizedKey =
    featureKey === "RESUME_REVIEW"
      ? "RESUME_CHECK"
      : featureKey === "RESUME_CHECK"
        ? "RESUME_REVIEW"
        : featureKey;
  const monthlyLimit =
    planConfig.quotas[featureKey] ??
    planConfig.quotas[normalizedKey] ??
    (process.env.NODE_ENV !== "production" ? 10 : 0);
  const isUnlimited = monthlyLimit === -1;

  const monthStart = getCurrentMonthStart();
  const resetsAt = getNextMonthlyResetDate();

  // Count usage in the current billing cycle
  const usedCount = await db.usageRecord.count({
    where: {
      userId,
      featureKey,
      createdAt: { gte: monthStart },
    },
  });

  const remaining = isUnlimited ? 9999 : Math.max(0, monthlyLimit - usedCount);
  const isExhausted = !isUnlimited && remaining <= 0;

  const meter: UsageMeter = {
    featureKey,
    planName: planConfig.displayName,
    isUnlimited,
    used: usedCount,
    limit: monthlyLimit,
    remaining,
    isExhausted,
    resetsAt,
  };

  const enforcement = getEntitlementEnforcementMode();

  if (isExhausted) {
    if (enforcement === "off") {
      return {
        allowed: true,
        bypassedForTesting: true,
        reason: `[Testing Mode] Limit of ${monthlyLimit} ${featureKey} reached, but enforcement is OFF.`,
        meter,
        plan: planConfig,
      };
    }

    if (enforcement === "soft") {
      return {
        allowed: true,
        bypassedForTesting: true,
        reason: `[Soft Enforcement] You have used your ${monthlyLimit} monthly ${featureKey}. Operation allowed for testing.`,
        meter,
        plan: planConfig,
      };
    }

    return {
      allowed: false,
      reason: `You have reached your monthly limit of ${monthlyLimit} ${featureKey.toLowerCase().replace(/_/g, " ")} on the ${planConfig.displayName} plan. Quota resets on ${resetsAt.toLocaleDateString("en-IN")}.`,
      meter,
      plan: planConfig,
    };
  }

  return {
    allowed: true,
    meter,
    plan: planConfig,
  };
}

/**
 * Record a usage event in the database (tracks tokens, estimated cost, and provider).
 */
export async function recordUsage(params: {
  userId: string;
  featureKey: string;
  operationType: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  provider: string;
  model: string;
  latencyMs?: number;
}) {
  return db.usageRecord.create({
    data: {
      userId: params.userId,
      featureKey: params.featureKey,
      operationType: params.operationType,
      inputTokens: params.inputTokens ?? 0,
      outputTokens: params.outputTokens ?? 0,
      estimatedCost: params.estimatedCost ?? 0,
      provider: params.provider,
      model: params.model,
      latencyMs: params.latencyMs ?? 0,
    },
  });
}

/**
 * Manual development / admin grant for testing premium features without a payment gateway.
 */
export async function grantDevSubscription(
  userId: string,
  planId: "FREE" | "PREMIUM" | "PLACEMENT_PASS" | "INSTITUTION",
  durationDays = 30
) {
  await ensurePlansSeeded();

  const validUntil =
    planId === "FREE"
      ? null
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  return db.userSubscription.upsert({
    where: { userId },
    update: {
      planId,
      status: "ACTIVE",
      validFrom: new Date(),
      validUntil,
      source: "MANUAL_DEV_GRANT",
    },
    create: {
      userId,
      planId,
      status: "ACTIVE",
      validFrom: new Date(),
      validUntil,
      source: "MANUAL_DEV_GRANT",
    },
  });
}
