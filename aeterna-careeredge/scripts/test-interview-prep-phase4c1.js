const path = require("path");
const { createJiti } = require("jiti");
const { NextRequest } = require("next/server");

const rootDir = path.resolve(__dirname, "..");
const jiti = createJiti(__filename, { alias: { "@": path.join(rootDir, "src") } });

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function main() {
  const { GET: getResources } = await jiti.import(
    path.join(rootDir, "src/app/api/interview-prep/[id]/resources/route.ts")
  );
  const { PATCH: patchProgress } = await jiti.import(
    path.join(rootDir, "src/app/api/interview-prep/[id]/resources/progress/route.ts")
  );

  // 1. Unauthenticated GET -> 401
  {
    const req = new NextRequest("http://localhost:3000/api/interview-prep/kit_1/resources");
    const res = await getResources(req, { params: Promise.resolve({ id: "kit_1" }) });
    assert(res.status === 401, "Unauthenticated GET /resources returns 401");
  }

  // 2. Unauthenticated PATCH -> 401
  {
    const req = new NextRequest(
      "http://localhost:3000/api/interview-prep/kit_1/resources/progress",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: "res_1", saved: true }),
      }
    );
    const res = await patchProgress(req, { params: Promise.resolve({ id: "kit_1" }) });
    assert(res.status === 401, "Unauthenticated PATCH /resources/progress returns 401");
  }

  // 3. Authenticated invalid payload checks (using signed session cookie)
  const { createSession } = await jiti.import(path.join(rootDir, "src/lib/session.ts"));
  const token = await createSession({
    userId: "nonexistent_user_4c1_check",
    email: "4c1@example.com",
    name: "Tester",
    onboardingCompleted: true,
  });

  {
    const req = new NextRequest(
      "http://localhost:3000/api/interview-prep/kit_1/resources/progress",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `ace_session=${token}`,
        },
        body: JSON.stringify({ saved: true }), // missing resourceId
      }
    );
    const res = await patchProgress(req, { params: Promise.resolve({ id: "kit_1" }) });
    assert(res.status === 400, "PATCH /resources/progress rejects missing resourceId with 400");
  }

  {
    const req = new NextRequest(
      "http://localhost:3000/api/interview-prep/kit_1/resources/progress",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `ace_session=${token}`,
        },
        body: JSON.stringify({ resourceId: "res_1", saved: "yes" }), // invalid type
      }
    );
    const res = await patchProgress(req, { params: Promise.resolve({ id: "kit_1" }) });
    assert(res.status === 400, "PATCH /resources/progress rejects non-boolean saved with 400");
  }

  // 4. db.ts local vs production routing guards
  const { isLocalhostDatabaseUrl, shouldUseLocalPrisma } = await jiti.import(
    path.join(rootDir, "src/lib/db.ts")
  );
  assert(
    isLocalhostDatabaseUrl("postgresql://postgres:pw@127.0.0.1:54329/db") === true &&
      isLocalhostDatabaseUrl("postgresql://postgres:pw@localhost:5432/db") === true &&
      isLocalhostDatabaseUrl("postgresql://postgres:pw@db.lawehfiwbjxfnbtgeusi.supabase.co:5432/postgres") === false,
    "isLocalhostDatabaseUrl accepts only 127.0.0.1/localhost"
  );
  const origUseLocal = process.env.USE_LOCAL_PRISMA;
  const origDbUrl = process.env.DATABASE_URL;
  const origDirectUrl = process.env.DIRECT_URL;
  try {
    process.env.USE_LOCAL_PRISMA = "true";
    process.env.DIRECT_URL = "postgresql://postgres:pw@db.lawehfiwbjxfnbtgeusi.supabase.co:5432/postgres";
    process.env.DATABASE_URL = process.env.DIRECT_URL;
    assert(shouldUseLocalPrisma() === false, "shouldUseLocalPrisma rejects remote Supabase URL even if USE_LOCAL_PRISMA=true");

    process.env.DIRECT_URL = "postgresql://postgres:pw@127.0.0.1:54329/careeredge_lockdown_test";
    assert(shouldUseLocalPrisma() === true, "shouldUseLocalPrisma allows explicit 127.0.0.1 URL when USE_LOCAL_PRISMA=true");

    delete process.env.USE_LOCAL_PRISMA;
    assert(shouldUseLocalPrisma() === false, "shouldUseLocalPrisma defaults to false when USE_LOCAL_PRISMA is unset");
  } finally {
    if (origUseLocal === undefined) delete process.env.USE_LOCAL_PRISMA;
    else process.env.USE_LOCAL_PRISMA = origUseLocal;
    if (origDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = origDbUrl;
    if (origDirectUrl === undefined) delete process.env.DIRECT_URL;
    else process.env.DIRECT_URL = origDirectUrl;
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
