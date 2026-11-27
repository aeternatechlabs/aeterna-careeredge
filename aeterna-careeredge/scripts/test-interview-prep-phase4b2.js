// scripts/test-interview-prep-phase4b2.js
// Phase 4B.2 tests: Mandatory allowlisting, no default CS/IT fallback,
// bounded UTF-8 streaming reads with reader cancellation, and expanded IPv6/NAT64 rejection.

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
  const { validateAndNormalizeUrl } = await jiti.import(
    "../src/lib/interview/resources/url-safety.ts"
  );
  const { verifyResourceUrl, readBoundedUtf8Snippet } = await jiti.import(
    "../src/lib/interview/resources/verifier.ts"
  );
  const { getCuratedResourcesForDomain } = await jiti.import(
    "../src/lib/interview/resources/registry.ts"
  );

  console.log("\nTest 1: Mandatory Hostname Allowlisting (Fix 1)");
  {
    // Approved host accepted
    let approvedFetched = false;
    const okRes = await verifyResourceUrl("https://react.dev/learn", {
      fetcher: async () => {
        approvedFetched = true;
        return { status: 200, headers: { get: () => "text/html" }, body: null };
      },
    });
    assert(approvedFetched && okRes.networkStatus === "REACHABLE", "Approved hostname is accepted and fetched");

    // Unapproved public hostname rejected BEFORE fetch
    let evilFetched = false;
    const unapprovedRes = await verifyResourceUrl("https://unapproved-public-site.org/page", {
      fetcher: async () => {
        evilFetched = true;
        return { status: 200, headers: { get: () => "text/html" }, body: null };
      },
    });
    assert(
      !evilFetched &&
        unapprovedRes.networkStatus === "UNAVAILABLE" &&
        unapprovedRes.notes.includes("allowlist"),
      "Unapproved public hostname rejected before network fetch"
    );

    // Empty allowlist fails closed BEFORE fetch
    let emptyListFetched = false;
    const emptyListRes = await verifyResourceUrl("https://react.dev/learn", {
      allowedHostnames: new Set(),
      fetcher: async () => {
        emptyListFetched = true;
        return { status: 200, headers: { get: () => "text/html" }, body: null };
      },
    });
    assert(
      !emptyListFetched && emptyListRes.networkStatus === "UNAVAILABLE",
      "Empty allowlist fails closed before network fetch"
    );

    // Deceptive hostname suffix rejected BEFORE fetch
    let suffixFetched = false;
    const suffixRes = await verifyResourceUrl("https://react.dev.attacker.com/learn", {
      fetcher: async () => {
        suffixFetched = true;
        return { status: 200, headers: { get: () => "text/html" }, body: null };
      },
    });
    assert(
      !suffixFetched && suffixRes.networkStatus === "UNAVAILABLE",
      "Deceptive hostname suffix (react.dev.attacker.com) rejected before network fetch"
    );

    // Redirect to unapproved host rejected BEFORE fetching destination
    const fetchedUrls = [];
    const redirectRes = await verifyResourceUrl("https://react.dev/learn", {
      fetcher: async (u) => {
        fetchedUrls.push(u);
        return {
          status: 302,
          headers: { get: (h) => (h.toLowerCase() === "location" ? "https://evil-redirect.org/steal" : null) },
          body: null,
        };
      },
    });
    assert(
      fetchedUrls.length === 1 &&
        redirectRes.networkStatus === "UNAVAILABLE" &&
        redirectRes.notes.includes("allowlist"),
      "Redirect to unapproved host rejected before fetching destination"
    );
  }

  console.log("\nTest 2: No Default CS/IT Recommendations (Fix 2)");
  {
    assert(getCuratedResourcesForDomain(null).length === 0, "null domain returns []");
    assert(getCuratedResourcesForDomain(undefined).length === 0, "undefined domain returns []");
    assert(getCuratedResourcesForDomain("").length === 0, "empty domain returns []");
    assert(getCuratedResourcesForDomain("Unknown Custom Domain XYZ").length === 0, "unknown domain returns []");
    assert(
      getCuratedResourcesForDomain("Computer Science and IT").length >= 10,
      "Valid Computer Science and IT returns CS resources"
    );
    assert(
      getCuratedResourcesForDomain("Pharmacy, Nursing and Allied Health").length >= 1,
      "Valid Nursing domain returns Nursing resources"
    );
    assert(
      getCuratedResourcesForDomain("Law and Legal Studies").length >= 1,
      "Valid Law domain returns Law resources"
    );
  }

  console.log("\nTest 3: Bounded Streaming Reads & UTF-8 Boundary Safety (Fix 3)");
  {
    // Smaller than limit
    const smallStream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode("Hello CareerEdge"));
        c.close();
      },
    });
    const smallOut = await readBoundedUtf8Snippet(
      { status: 200, headers: { get: () => null }, body: smallStream },
      1024
    );
    assert(smallOut.text === "Hello CareerEdge" && !smallOut.truncated, "Reads response smaller than limit");

    // Larger than limit + reader cancellation check
    let cancelCalled = false;
    let chunksEnqueued = 0;
    const largeStream = new ReadableStream({
      pull(c) {
        chunksEnqueued++;
        c.enqueue(new Uint8Array(50).fill(65)); // 50 'A' bytes per chunk
      },
      cancel() {
        cancelCalled = true;
      },
    });
    const largeOut = await readBoundedUtf8Snippet(
      { status: 200, headers: { get: () => null }, body: largeStream },
      80
    );
    assert(
      largeOut.text.length === 80 && largeOut.truncated && cancelCalled && chunksEnqueued <= 3,
      "Stops at maxBodyBytes, truncates cleanly, and cancels reader"
    );

    // Missing body
    const missingBodyOut = await readBoundedUtf8Snippet(
      { status: 200, headers: { get: () => null }, body: null },
      1024
    );
    assert(missingBodyOut.text === "" && !missingBodyOut.streamError, "Handles missing response body safely");

    // Stream read failure via verifier -> INCONCLUSIVE
    const failingStream = new ReadableStream({
      start(c) {
        c.error(new Error("Simulated stream reset"));
      },
    });
    const streamErrRes = await verifyResourceUrl("https://react.dev/learn", {
      fetcher: async () => ({ status: 200, headers: { get: () => "text/html" }, body: failingStream }),
    });
    assert(
      streamErrRes.verificationStatus === "INCONCLUSIVE" &&
        streamErrRes.notes.includes("Simulated stream reset"),
      "Stream read failure returns INCONCLUSIVE safely"
    );

    // Multibyte UTF-8 split across chunks ("🚀" is 4 bytes: F0 9F 9A 80)
    const emojiBytes = new TextEncoder().encode("Hi 🚀!");
    const part1 = emojiBytes.subarray(0, 5); // splits mid-emoji!
    const part2 = emojiBytes.subarray(5);
    const splitStream = new ReadableStream({
      start(c) {
        c.enqueue(part1);
        c.enqueue(part2);
        c.close();
      },
    });
    const splitOut = await readBoundedUtf8Snippet(
      { status: 200, headers: { get: () => null }, body: splitStream },
      1024
    );
    assert(splitOut.text === "Hi 🚀!", "Decodes multibyte UTF-8 split across chunks without corruption");
  }

  console.log("\nTest 4: Expanded IPv6 & NAT64 Rejection (Fix 4)");
  {
    assert(!validateAndNormalizeUrl("https://[0:0:0:0:0:0:0:1]/admin").ok, "Rejects expanded IPv6 loopback");
    assert(!validateAndNormalizeUrl("https://[::1]/admin").ok, "Rejects compressed IPv6 loopback");
    assert(!validateAndNormalizeUrl("https://[::]/admin").ok, "Rejects unspecified IPv6 [::]");
    assert(!validateAndNormalizeUrl("https://[::ffff:127.0.0.1]/").ok, "Rejects IPv4-mapped loopback");
    assert(!validateAndNormalizeUrl("https://[::ffff:10.0.0.1]/").ok, "Rejects IPv4-mapped private 10.0.0.1");
    assert(!validateAndNormalizeUrl("https://[64:ff9b::10.0.0.1]/").ok, "Rejects NAT64 64:ff9b::10.0.0.1");
    assert(!validateAndNormalizeUrl("https://[64:ff9b::1]/").ok, "Rejects NAT64 64:ff9b::1");
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`Results: ${passed}/${passed + failed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
