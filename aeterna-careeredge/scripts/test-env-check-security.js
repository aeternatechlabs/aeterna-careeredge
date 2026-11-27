const fs = require("fs");
const path = require("path");
const { createJiti } = require("jiti");

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
  const routePath = path.join(rootDir, "src/app/api/system/env-check/route.ts");
  const source = fs.readFileSync(routePath, "utf8");

  assert(!source.includes("getSupabaseAdmin"), "env-check route does not import or call getSupabaseAdmin");
  assert(!source.includes("supabase"), "env-check route contains no Supabase references");
  assert(!source.includes("process.env"), "env-check route does not read process.env");

  const { GET: envCheckGet } = await jiti.import(routePath);
  const { GET: enforcementGet } = await jiti.import(
    path.join(rootDir, "src/app/api/system/enforcement/route.ts")
  );

  const origNodeEnv = process.env.NODE_ENV;
  const origAppEnv = process.env.APP_ENV;

  try {
    for (const [nodeEnv, appEnv] of [
      ["production", "production"],
      ["production", "preview"],
      ["development", "development"],
    ]) {
      process.env.NODE_ENV = nodeEnv;
      process.env.APP_ENV = appEnv;

      const res = await envCheckGet();
      const body = await res.json();
      const bodyStr = JSON.stringify(body);

      assert(res.status === 404, `GET /api/system/env-check returns 404 (${nodeEnv}/${appEnv})`);
      assert(
        bodyStr === JSON.stringify({ error: "Not found" }),
        `Response body is strictly sanitized (${nodeEnv}/${appEnv})`
      );
      assert(
        !bodyStr.includes("DATABASE_URL") &&
          !bodyStr.includes("AUTH_SECRET") &&
          !bodyStr.includes("SUPABASE_SERVICE_ROLE_KEY") &&
          !bodyStr.includes("supabaseProbe") &&
          !bodyStr.includes("checks"),
        `No env keys, prefixes, lengths, or DB probes exposed (${nodeEnv}/${appEnv})`
      );
    }

    const enfRes = await enforcementGet();
    assert(enfRes.status === 200, "GET /api/system/enforcement remains functional (200)");
  } finally {
    if (origNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = origNodeEnv;
    if (origAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = origAppEnv;
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
