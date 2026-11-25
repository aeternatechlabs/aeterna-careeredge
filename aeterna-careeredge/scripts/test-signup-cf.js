#!/usr/bin/env node
/**
 * test-signup-cf.js
 * Phase 2 integration tests for POST /api/auth/signup
 * Tests both the Prisma path (local dev) and simulates the Supabase REST fallback path.
 *
 * Usage:
 *   node scripts/test-signup-cf.js [--base-url http://localhost:3000]
 */

const bcrypt = require("bcryptjs");
require("dotenv").config();

const args = process.argv.slice(2);
const baseUrlIndex = args.indexOf("--base-url");
const BASE_URL =
  baseUrlIndex !== -1 && args[baseUrlIndex + 1]
    ? args[baseUrlIndex + 1]
    : "http://localhost:3000";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✅ PASS: ${label}`);
  passed++;
}

function fail(label, reason) {
  console.error(`  ❌ FAIL: ${label}`);
  console.error(`         ${reason}`);
  failed++;
}

function assert(condition, label, reason) {
  if (condition) pass(label);
  else fail(label, reason || "Assertion failed");
}

async function supabaseDelete(email) {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  const cleanUrl = SUPABASE_URL.replace(/\/+$/, "");
  await fetch(
    `${cleanUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  ).catch(() => {});
}

async function supabaseGetUser(email) {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const cleanUrl = SUPABASE_URL.replace(/\/+$/, "");
  const res = await fetch(
    `${cleanUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,name,email,passwordHash,onboardingCompleted&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// ── Test data ─────────────────────────────────────────────────────────────────

const ts = Date.now();
const TEST_EMAIL = `signup.test.${ts}@aeternatechlabs.com`;
const TEST_MOBILE = `7${String(ts).slice(-9)}`; // 10 digits, starts with 7

const VALID_PAYLOAD = {
  name: "Test User Phase2",
  email: TEST_EMAIL,
  mobile: TEST_MOBILE,
  password: "SecurePass123!",
  counsellorConsent: true,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`\n🚀 Signup CF Tests — ${BASE_URL}`);
  console.log(`   Test email : ${TEST_EMAIL}`);
  console.log(`   Test mobile: ${TEST_MOBILE}\n`);

  // ── Test 1: Valid new signup → 201 + ace_session cookie ──────────────────
  console.log("Test 1: Valid new signup");
  let sessionCookie = null;
  {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    const body = await res.json().catch(() => ({}));
    assert(res.status === 201, "HTTP 201 returned", `Got ${res.status}: ${JSON.stringify(body)}`);
    assert(
      body.user && body.user.email === TEST_EMAIL.toLowerCase(),
      "Response contains user object with email",
      `body.user = ${JSON.stringify(body.user)}`
    );
    const setCookie = res.headers.get("set-cookie") || "";
    assert(setCookie.includes("ace_session="), "ace_session cookie is set", `set-cookie: ${setCookie}`);
    sessionCookie = setCookie;
  }

  // ── Test 2: Duplicate email → 409 { field: "email" } ───────────────────
  console.log("\nTest 2: Duplicate email");
  {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...VALID_PAYLOAD, mobile: `8${String(ts + 1).slice(-9)}` }),
    });
    const body = await res.json().catch(() => ({}));
    assert(res.status === 409, "HTTP 409 returned", `Got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.field === "email", "field: email in response", `body = ${JSON.stringify(body)}`);
  }

  // ── Test 3: Duplicate mobile → 409 { field: "mobile" } ─────────────────
  console.log("\nTest 3: Duplicate mobile");
  {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...VALID_PAYLOAD,
        email: `dup.mobile.${ts}@aeternatechlabs.com`,
      }),
    });
    const body = await res.json().catch(() => ({}));
    assert(res.status === 409, "HTTP 409 returned", `Got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.field === "mobile", "field: mobile in response", `body = ${JSON.stringify(body)}`);
  }

  // ── Test 4: Invalid input (name < 2 chars) → 400 ────────────────────────
  console.log("\nTest 4: Name too short");
  {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...VALID_PAYLOAD, name: "A" }),
    });
    assert(res.status === 400, "HTTP 400 returned", `Got ${res.status}`);
    const body = await res.json().catch(() => ({}));
    assert(body.field === "name", "field: name in response", `body = ${JSON.stringify(body)}`);
  }

  // ── Test 5: Missing password → 400 ──────────────────────────────────────
  console.log("\nTest 5: Missing password");
  {
    const { password: _pw, ...noPass } = VALID_PAYLOAD;
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noPass),
    });
    assert(res.status === 400, "HTTP 400 returned", `Got ${res.status}`);
    const body = await res.json().catch(() => ({}));
    assert(body.field === "password", "field: password in response", `body = ${JSON.stringify(body)}`);
  }

  // ── Test 6: Password hashing — verify stored hash ───────────────────────
  console.log("\nTest 6: Password hash verification");
  {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.log("   ⚠️  SKIPPED (SUPABASE_URL/SERVICE_KEY not set in env)");
    } else {
      const dbUser = await supabaseGetUser(TEST_EMAIL.toLowerCase());
      if (!dbUser) {
        fail("User found in Supabase", "supabaseGetUser returned null");
      } else {
        assert(!!dbUser.passwordHash, "passwordHash stored in DB", `passwordHash = ${dbUser.passwordHash}`);
        const matches = await bcrypt.compare(VALID_PAYLOAD.password, dbUser.passwordHash).catch(() => false);
        assert(matches, "bcrypt.compare returns true for correct password", "Hash mismatch");
      }
    }
  }

  // ── Test 7: Session cookie shape ─────────────────────────────────────────
  console.log("\nTest 7: Session cookie format");
  {
    if (!sessionCookie) {
      fail("ace_session cookie present", "No cookie captured in Test 1");
    } else {
      assert(sessionCookie.includes("HttpOnly"), "Cookie is HttpOnly", sessionCookie);
      assert(sessionCookie.includes("Path=/"), "Cookie has Path=/", sessionCookie);
      assert(
      /SameSite=lax/i.test(sessionCookie),
      "Cookie has SameSite=Lax (case-insensitive)",
      sessionCookie
    );
    }
  }

  // ── Test 8: Request WITH Cookie header succeeds (not Error 1101) ─────────
  console.log("\nTest 8: Signup with Cookie header present (not Error 1101)");
  {
    const ts2 = Date.now();
    const email2 = `signup.cookie.${ts2}@aeternatechlabs.com`;
    const mobile2 = `6${String(ts2).slice(-9)}`;
    // Use a distinct X-Forwarded-For IP so the rate limiter sees a fresh bucket
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "some_other_cookie=existing_value; track=abc123",
        "X-Forwarded-For": "10.99.88.77",
      },
      body: JSON.stringify({
        name: "Cookie Test User",
        email: email2,
        mobile: mobile2,
        password: "SecurePass456!",
        counsellorConsent: false,
      }),
    });
    const body = await res.json().catch(() => ({}));
    assert(
      res.status === 201,
      "HTTP 201 (not 500/Error 1101) when Cookie header is present",
      `Got ${res.status}: ${JSON.stringify(body)}`
    );
    // Cleanup
    await supabaseDelete(email2);
  }

  // ── Test 9: Supabase persistence ─────────────────────────────────────────
  console.log("\nTest 9: Record persisted in Supabase");
  {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.log("   ⚠️  SKIPPED (SUPABASE_URL/SERVICE_KEY not set in env)");
    } else {
      const dbUser = await supabaseGetUser(TEST_EMAIL.toLowerCase());
      assert(!!dbUser, "User found in Supabase users table", "supabaseGetUser returned null");
      assert(
        dbUser?.email === TEST_EMAIL.toLowerCase(),
        "Email matches",
        `stored: ${dbUser?.email}`
      );
      assert(
        dbUser?.onboardingCompleted === false,
        "onboardingCompleted defaults to false",
        `stored: ${dbUser?.onboardingCompleted}`
      );
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  console.log("\n🧹 Cleaning up test records...");
  await supabaseDelete(TEST_EMAIL.toLowerCase());
  console.log("   Deleted test user:", TEST_EMAIL);

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("✅ All signup CF tests passed!\n");
    process.exit(0);
  } else {
    console.log("❌ Some tests failed.\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
