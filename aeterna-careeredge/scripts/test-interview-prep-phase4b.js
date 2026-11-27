// scripts/test-interview-prep-phase4b.js
// Phase 4B automated tests: URL safety, SSRF/redirect guards, access classification,
// curated registry coverage across all 17 domains, deduplication, and discovery adapters.

const path = require("path");
const { createJiti } = require("jiti");

const rootDir = path.resolve(__dirname, "..");
const jiti = createJiti(__filename, { alias: { "@": path.join(rootDir, "src") } });

let passed = 0;
let failed = 0;
function assert(cond, label) {
  if (cond) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

async function main() {
  const { validateAndNormalizeUrl, findDuplicateCanonicalUrls } = await jiti.import(
    "../src/lib/interview/resources/url-safety.ts"
  );
  const { verifyResourceUrl, classifyResourceAccess } = await jiti.import(
    "../src/lib/interview/resources/verifier.ts"
  );
  const {
    CURATED_RESOURCE_REGISTRY,
    getCuratedResourcesForDomain,
  } = await jiti.import("../src/lib/interview/resources/registry.ts");
  const {
    BraveSearchDiscoveryAdapter,
    YouTubeDiscoveryAdapter,
  } = await jiti.import("../src/lib/interview/resources/discovery.ts");
  const { ACADEMIC_DOMAINS } = await jiti.import("../src/lib/constants/domains.ts");

  console.log("\nTest 1: URL Safety & Normalization");
  {
    const okHttps = validateAndNormalizeUrl(
      "https://Developer.Mozilla.org/en-US/docs/Web/HTTP/?utm_source=test&b=2&a=1"
    );
    assert(
      okHttps.ok &&
        okHttps.canonicalUrl === "https://developer.mozilla.org/en-US/docs/Web/HTTP?a=1&b=2",
      "Accepts HTTPS, normalizes host/slash, strips utm_* while keeping sorted params"
    );

    assert(!validateAndNormalizeUrl("http://example.com/docs").ok, "Rejects HTTP when HTTPS is required");
    assert(!validateAndNormalizeUrl("https://localhost/admin").ok, "Rejects localhost");
    assert(!validateAndNormalizeUrl("https://127.0.0.1/secret").ok, "Rejects IPv4 loopback 127.0.0.1");
    assert(!validateAndNormalizeUrl("https://10.0.0.5/internal").ok, "Rejects private IPv4 10.0.0.5");
    assert(!validateAndNormalizeUrl("https://172.16.0.1/internal").ok, "Rejects private IPv4 172.16.0.1");
    assert(!validateAndNormalizeUrl("https://192.168.1.10/router").ok, "Rejects private IPv4 192.168.1.10");
    assert(!validateAndNormalizeUrl("https://169.254.169.254/latest/meta-data").ok, "Rejects link-local metadata IP");
    assert(!validateAndNormalizeUrl("https://[::1]/admin").ok, "Rejects IPv6 loopback [::1]");
    assert(!validateAndNormalizeUrl("https://[fc00::1]/internal").ok, "Rejects IPv6 ULA [fc00::1]");
    assert(!validateAndNormalizeUrl("https://[fe80::1]/link").ok, "Rejects IPv6 link-local [fe80::1]");
    assert(!validateAndNormalizeUrl("https://[::ffff:127.0.0.1]/v4mapped").ok, "Rejects IPv4-mapped IPv6 loopback");
    assert(!validateAndNormalizeUrl("https://user:pass@example.com/docs").ok, "Rejects URL credentials");
    assert(!validateAndNormalizeUrl("javascript:alert(1)").ok, "Rejects javascript: scheme");
    assert(!validateAndNormalizeUrl("file:///etc/passwd").ok, "Rejects file: scheme");
    assert(!validateAndNormalizeUrl("data:text/html,<h1>hi</h1>").ok, "Rejects data: scheme");
  }

  console.log("\nTest 2: Verifier Redirect Safety & Access Classification");
  {
    const unsafeRedirectRes = await verifyResourceUrl("https://developer.mozilla.org/en-US/", {
      fetcher: async () => ({
        status: 302,
        headers: { get: (h) => (h.toLowerCase() === "location" ? "https://127.0.0.1/internal" : null) },
        text: async () => "",
      }),
    });
    assert(
      unsafeRedirectRes.networkStatus === "UNAVAILABLE" &&
        unsafeRedirectRes.notes.includes("unsafe redirect"),
      "Rejects redirect to private/loopback IP"
    );

    const tooManyRedirects = await verifyResourceUrl("https://developer.mozilla.org/en-US/", {
      maxRedirects: 2,
      fetcher: async () => ({
        status: 302,
        headers: { get: (h) => (h.toLowerCase() === "location" ? "https://developer.mozilla.org/next" : null) },
        text: async () => "",
      }),
    });
    assert(
      tooManyRedirects.verificationStatus === "INCONCLUSIVE" &&
        tooManyRedirects.notes.includes("maximum redirect limit"),
      "Enforces redirect hop limit"
    );

    const http200Plain = await verifyResourceUrl("https://developer.mozilla.org/en-US/", {
      fetcher: async () => ({
        status: 200,
        headers: { get: () => "text/html" },
        text: async () => "<html><body>Welcome to the page</body></html>",
      }),
    });
    assert(
      http200Plain.networkStatus === "REACHABLE" &&
        http200Plain.accessStatus === "UNVERIFIED" &&
        http200Plain.verificationStatus === "PENDING_REVIEW",
      "HTTP 200 alone never sets COMPLETELY_FREE (remains UNVERIFIED)"
    );

    assert(
      classifyResourceAccess({
        httpStatus: 200,
        bodySnippet: "You can audit for free; optional paid certificate available.",
      }) === "FREE_WITH_PAID_CERT",
      "Distinguishes FREE_WITH_PAID_CERT from PAID"
    );

    assert(
      classifyResourceAccess({
        httpStatus: 200,
        bodySnippet: "Please sign in to continue reading this module.",
      }) === "FREE_ACCOUNT_REQUIRED",
      "Login-required content is not labeled COMPLETELY_FREE"
    );

    const rateLimited = await verifyResourceUrl("https://developer.mozilla.org/en-US/", {
      fetcher: async () => ({
        status: 429,
        headers: { get: () => null },
        text: async () => "",
      }),
    });
    assert(
      rateLimited.networkStatus === "INCONCLUSIVE" &&
        rateLimited.verificationStatus === "INCONCLUSIVE",
      "Treats HTTP 429 rate limiting as INCONCLUSIVE"
    );
  }

  console.log("\nTest 3: Curated Registry, Multi-Domain Coverage & Discovery Adapters");
  {
    const dupCheck = findDuplicateCanonicalUrls(CURATED_RESOURCE_REGISTRY.map((r) => r.url));
    assert(dupCheck.duplicates.length === 0, "Curated registry has zero duplicate canonical URLs");

    const syntheticDups = findDuplicateCanonicalUrls([
      "https://react.dev/learn/?utm_source=x",
      "https://react.dev/learn",
    ]);
    assert(syntheticDups.duplicates.length === 1, "Duplicate canonical URL detector catches tracking-param duplicates");

    const allDomainsCovered = ACADEMIC_DOMAINS.every(
      (d) => getCuratedResourcesForDomain(d).length >= 1
    );
    assert(allDomainsCovered, `All ${ACADEMIC_DOMAINS.length} AcademicDomains have >= 1 curated resource`);

    const nursingRes = getCuratedResourcesForDomain("Pharmacy, Nursing and Allied Health");
    assert(
      nursingRes.length >= 1 &&
        !nursingRes.some((r) => r.url.includes("react.dev") || r.url.includes("mozilla")),
      "Domain filtering prevents programming resources from appearing on Nursing domain"
    );

    const prevBrave = process.env.BRAVE_SEARCH_API_KEY;
    const prevYt = process.env.YOUTUBE_API_KEY;
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.YOUTUBE_API_KEY;
    const braveRes = await new BraveSearchDiscoveryAdapter().discover({
      topicTitle: "HTTP",
      domain: "Computer Science and IT",
    });
    const ytRes = await new YouTubeDiscoveryAdapter().discover({
      topicTitle: "HTTP",
      domain: "Computer Science and IT",
    });
    if (prevBrave !== undefined) process.env.BRAVE_SEARCH_API_KEY = prevBrave;
    if (prevYt !== undefined) process.env.YOUTUBE_API_KEY = prevYt;

    assert(
      braveRes.configured === false &&
        braveRes.candidates.length === 0 &&
        ytRes.configured === false &&
        ytRes.candidates.length === 0,
      "Discovery adapters handle missing credentials cleanly with zero fabricated results"
    );
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`Results: ${passed}/${passed + failed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
