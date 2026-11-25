#!/usr/bin/env node
/**
 * test-oauth-leads-cf.js
 * Verifies Phase B fixes:
 *  1. GET /api/auth/oauth/google 503 diagnostic & 302 redirect when configured
 *  2. handleGoogleIdentity() Prisma-failure -> Supabase REST fallback (create & match)
 *  3. POST /api/leads Prisma-failure -> Supabase REST fallback:
 *     - Persists lead in crm_leads AND consent audit in consent_records
 *     - Fails with HTTP 500 (never silent success: true) if REST fallback also fails
 */

require("dotenv").config();
const path = require("path");
const { createJiti } = require("jiti");
const { NextRequest } = require("next/server");

const rootDir = path.resolve(__dirname, "..");
const jiti = createJiti(__filename, {
  alias: {
    "@": path.join(rootDir, "src"),
  },
});

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

let passed = 0;
let failed = 0;

function assert(cond, label, detail) {
  if (cond) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function supabaseQuery(pathWithQuery) {
  const res = await fetch(`${SUPABASE_URL}${pathWithQuery}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  return res.json().catch(() => []);
}

async function supabaseDelete(pathWithQuery) {
  await fetch(`${SUPABASE_URL}${pathWithQuery}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  }).catch(() => {});
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const dbMod = await jiti.import("@/lib/db");
  const oauthMod = await jiti.import("@/lib/auth/oauth");
  const oauthRouteMod = await jiti.import("@/app/api/auth/oauth/google/route");
  const leadsRouteMod = await jiti.import("@/app/api/leads/route");

  const origFindUnique = dbMod.db.user.findUnique.bind(dbMod.db.user);
  const origFindFirst = dbMod.db.user.findFirst.bind(dbMod.db.user);

  const ts = Date.now();
  const oauthEmail = `oauth.cf.test.${ts}@aeternatechlabs.com`;
  const leadEmail = `lead.cf.test.${ts}@aeternatechlabs.com`;
  const leadMobile = `8${String(ts).slice(-9)}`;

  try {
    // ── 1. OAuth initiation route checks ────────────────────────────────────
    console.log("\nTest 1: GET /api/auth/oauth/google missing env -> 503; present env -> 307");
    const prevId = process.env.GOOGLE_CLIENT_ID;
    const prevSecret = process.env.GOOGLE_CLIENT_SECRET;
    const prevNodeEnv = process.env.NODE_ENV;

    try {
      delete process.env.GOOGLE_CLIENT_ID;
      process.env.NODE_ENV = "production";
      const req503 = new NextRequest("https://aeterna-careeredge.cloud-cd3.workers.dev/api/auth/oauth/google");
      const res503 = await oauthRouteMod.GET(req503);
      assert(res503.status === 503, "Returns HTTP 503 when GOOGLE_CLIENT_ID is missing", `Got ${res503.status}`);

      process.env.GOOGLE_CLIENT_ID = "test-client-id-123";
      process.env.GOOGLE_CLIENT_SECRET = "test-client-secret-123";
      const reqRedirect = new NextRequest("https://aeterna-careeredge.cloud-cd3.workers.dev/api/auth/oauth/google");
      const resRedirect = await oauthRouteMod.GET(reqRedirect);
      const location = resRedirect.headers.get("location") || "";
      assert(
        resRedirect.status >= 300 && resRedirect.status < 400 && location.startsWith("https://accounts.google.com/"),
        "Redirects to accounts.google.com when configured",
        `status=${resRedirect.status}, location=${location}`
      );
      const setCookie = resRedirect.headers.get("set-cookie") || "";
      assert(setCookie.includes("ace_oauth_state="), "Sets ace_oauth_state CSRF cookie", setCookie);
    } finally {
      if (prevId !== undefined) process.env.GOOGLE_CLIENT_ID = prevId;
      else delete process.env.GOOGLE_CLIENT_ID;
      if (prevSecret !== undefined) process.env.GOOGLE_CLIENT_SECRET = prevSecret;
      else delete process.env.GOOGLE_CLIENT_SECRET;
      process.env.NODE_ENV = prevNodeEnv;
    }

    // ── 2. handleGoogleIdentity() REST fallback ──────────────────────────────
    console.log("\nTest 2: handleGoogleIdentity() falls back to Supabase REST when Prisma throws");
    dbMod.db.user.findUnique = async () => {
      throw new Error("In order to run Prisma Client on edge runtime, either: Use Prisma Accelerate or Driver Adapters");
    };

    const first = await oauthMod.handleGoogleIdentity({
      email: oauthEmail,
      name: "CF OAuth Test User",
      sub: `google_sub_${ts}`,
    });
    assert(first.isNew === true, "Creates new OAuth user via REST (isNew=true)");
    assert(first.user.email === oauthEmail, "Returned user email matches");
    assert(first.user.passwordHash === null, "New OAuth user has passwordHash: null");

    const dbOAuthUsers = await supabaseQuery(`/rest/v1/users?email=eq.${encodeURIComponent(oauthEmail)}&select=id,email,passwordHash,onboardingCompleted`);
    assert(Array.isArray(dbOAuthUsers) && dbOAuthUsers.length === 1, "User row persisted in Supabase users table");

    const second = await oauthMod.handleGoogleIdentity({
      email: oauthEmail,
      name: "CF OAuth Test User",
      sub: `google_sub_${ts}`,
    });
    assert(second.isNew === false, "Matches existing OAuth user on repeat sign-in (isNew=false)");
    assert(second.user.id === first.user.id, "Matches exact existing user ID without duplicate");

    // ── 3. POST /api/leads REST fallback: crm_leads + consent_records ───────
    console.log("\nTest 3: POST /api/leads falls back to Supabase REST and records consent_records");
    dbMod.db.user.findFirst = async () => {
      throw new Error("In order to run Prisma Client on edge runtime, either: Use Prisma Accelerate or Driver Adapters");
    };

    const leadReq = new NextRequest("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `10.77.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`,
        "user-agent": "CF-Fallback-Test/1.0",
      },
      body: JSON.stringify({
        name: "CF Lead Tester",
        email: leadEmail,
        mobile: leadMobile,
        city: "Pune",
        status: "Undergraduate",
        interest: "Tech Careers",
        counsellorConsent: true,
      }),
    });

    const leadRes = await leadsRouteMod.POST(leadReq);
    const leadBody = await leadRes.json();
    assert(leadRes.status === 200 && leadBody.success === true, "POST /api/leads returns HTTP 200 on REST fallback success", JSON.stringify(leadBody));
    assert(typeof leadBody.leadId === "string" && leadBody.leadId.startsWith("lead_"), "Returns REST-generated leadId", JSON.stringify(leadBody));

    const persistedLeads = await supabaseQuery(`/rest/v1/crm_leads?email=eq.${encodeURIComponent(leadEmail)}&select=id,userId,counsellorConsent,syncStatus`);
    assert(Array.isArray(persistedLeads) && persistedLeads.length === 1, "Lead row persisted in crm_leads");

    const leadUserId = persistedLeads[0]?.userId;
    const persistedConsents = leadUserId
      ? await supabaseQuery(`/rest/v1/consent_records?userId=eq.${encodeURIComponent(leadUserId)}&select=id,consentType,isGranted`)
      : [];
    assert(
      Array.isArray(persistedConsents) &&
        persistedConsents.some((c) => c.consentType === "COUNSELLOR_CONTACT" && c.isGranted === true),
      "Consent audit record (COUNSELLOR_CONTACT) persisted in consent_records",
      JSON.stringify(persistedConsents)
    );

    // ── 4. POST /api/leads fails loudly (500) when both Prisma and REST fail ──
    console.log("\nTest 4: POST /api/leads returns HTTP 500 when both Prisma and REST fail");
    const prevServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const prevSecretKey = process.env.SUPABASE_SECRET_KEY;
    try {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SECRET_KEY;

      const failReq = new NextRequest("http://localhost:3000/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `10.88.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`,
        },
        body: JSON.stringify({
          name: "CF Lead Failure Check",
          email: `fail.${ts}@aeternatechlabs.com`,
          mobile: `9${String(ts + 1).slice(-9)}`,
          city: "Mumbai",
          status: "Graduate",
          interest: "MBA",
          counsellorConsent: false,
        }),
      });

      const failRes = await leadsRouteMod.POST(failReq);
      const failBody = await failRes.json();
      assert(failRes.status === 500, "Returns HTTP 500 instead of silent 200 when persistence fails", `Got ${failRes.status}: ${JSON.stringify(failBody)}`);
      assert(!failBody.success, "Does not claim success: true on DB failure", JSON.stringify(failBody));
    } finally {
      if (prevServiceKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = prevServiceKey;
      if (prevSecretKey !== undefined) process.env.SUPABASE_SECRET_KEY = prevSecretKey;
    }
  } finally {
    dbMod.db.user.findUnique = origFindUnique;
    dbMod.db.user.findFirst = origFindFirst;

    console.log("\n🧹 Cleaning up test records...");
    await supabaseDelete(`/rest/v1/crm_leads?email=eq.${encodeURIComponent(leadEmail)}`);
    await supabaseDelete(`/rest/v1/users?email=eq.${encodeURIComponent(oauthEmail)}`);
    await supabaseDelete(`/rest/v1/users?email=eq.${encodeURIComponent(leadEmail)}`);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed}/${passed + failed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
