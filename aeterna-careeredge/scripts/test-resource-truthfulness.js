/**
 * Focused regression tests for Resource Access-Classification & Visibility Truthfulness.
 * Uses ONLY the isolated PostgreSQL database (127.0.0.1:54329) and cleans up its own test records.
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createJiti } = require("jiti");

const TEST_URL = "postgresql://postgres:careeredge-local-test-only@127.0.0.1:54329/careeredge_lockdown_test";
process.env.USE_LOCAL_PRISMA = "true";
process.env.DATABASE_URL = TEST_URL;
process.env.DIRECT_URL = TEST_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = "local";
process.env.SUPABASE_SECRET_KEY = "local";

const rootDir = path.resolve(__dirname, "..");
const jiti = createJiti(path.join(rootDir, "package.json"), {
  alias: { "@": path.join(rootDir, "src") },
  jsx: true,
});

const prisma = new PrismaClient({ datasources: { db: { url: TEST_URL } } });

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
  const ts = Date.now();
  const userId = `test_truth_${ts}`;
  const createdResourceIds = [];
  const createdKitIds = [];

  try {
    const { getKitResourcesView } = await jiti.import(
      path.join(rootDir, "src/lib/interview/resources/service.ts")
    );
    const { CURATED_RESOURCE_REGISTRY } = await jiti.import(
      path.join(rootDir, "src/lib/interview/resources/registry.ts")
    );
    const React = require("react");
    const ReactDOMServer = require("react-dom/server");
    const { ResourceCatalogue } = await jiti.import(
      path.join(rootDir, "src/components/interview/resource-catalogue.tsx")
    );

    await prisma.user.create({
      data: {
        id: userId,
        name: "Truthfulness Test Student",
        email: `${userId}@example.com`,
        onboardingCompleted: true,
      },
    });

    const vocKit = await prisma.interviewPrepKit.create({
      data: {
        userId,
        jobId: `job_voc_${ts}`,
        jobTitle: "Apprentice Technician",
        domain: "Vocational and Skill-Based Education",
        targetLevel: "ENTRY",
        preferredLanguage: "English",
        themesJson: "[]",
      },
    });
    createdKitIds.push(vocKit.id);

    // 1. UNVERIFIED curated resource (voc-skillindia) + PENDING_REVIEW link status
    const vocView = await getKitResourcesView(vocKit.id, userId);
    const skillIndia = vocView?.resources.find((r) => r.id === "voc-skillindia");
    assert(Boolean(skillIndia), "Curated UNVERIFIED resource (voc-skillindia) reaches Vocational student catalogue");
    assert(skillIndia?.accessClassification === "UNVERIFIED", "voc-skillindia preserves accessClassification=UNVERIFIED");
    assert(skillIndia?.verificationStatus === "PENDING_REVIEW", "voc-skillindia preserves verificationStatus=PENDING_REVIEW");

    const vocHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ResourceCatalogue, {
        kitId: vocKit.id,
        domain: vocKit.domain,
        roleTitle: vocKit.jobTitle,
        resourcesOverride: vocView.resources,
      })
    );
    assert(
      vocHtml.includes("Access Unverified") &&
        vocHtml.includes("Link Check Pending") &&
        !vocHtml.includes("Completely Free</span>") &&
        !vocHtml.includes("Free Content • Paid Certificate</span>"),
      "UI renders UNVERIFIED + PENDING_REVIEW with 'Access Unverified' and 'Link Check Pending', never confirmed free"
    );

    // 2. INCONCLUSIVE verification status badge
    const csKit = await prisma.interviewPrepKit.create({
      data: {
        userId,
        jobId: `job_cs_${ts}`,
        jobTitle: "Backend Engineer",
        domain: "Computer Science and IT",
        targetLevel: "ENTRY",
        preferredLanguage: "English",
        themesJson: "[]",
      },
    });
    createdKitIds.push(csKit.id);

    const incId = `res_inc_${ts}`;
    createdResourceIds.push(incId);
    await prisma.learningResource.create({
      data: {
        id: incId,
        url: `https://example.edu/inconclusive-${ts}`,
        canonicalUrl: `https://example.edu/inconclusive-${ts}`,
        title: "Inconclusive Link Resource",
        provider: "OpenCourseWare",
        resourceType: "COURSE",
        description: "Test inconclusive link check.",
        difficulty: "BEGINNER",
        language: "English",
        accessClassification: "UNVERIFIED",
        verificationStatus: "INCONCLUSIVE",
        reviewStatus: "PUBLISHED",
        domain: "Computer Science and IT",
      },
    });

    // 3. REJECTED DB resource must stay hidden from students; PENDING_REVIEW is shown with Link Check Pending
    const rejectedDbId = `res_rej_${ts}`;
    createdResourceIds.push(rejectedDbId);
    await prisma.learningResource.create({
      data: {
        id: rejectedDbId,
        url: `https://example.edu/rejected-${ts}`,
        canonicalUrl: `https://example.edu/rejected-${ts}`,
        title: "Hidden Rejected Candidate",
        provider: "Candidate Provider",
        resourceType: "ARTICLE",
        description: "Must not be visible to students.",
        difficulty: "BEGINNER",
        language: "English",
        accessClassification: "COMPLETELY_FREE",
        verificationStatus: "VERIFIED",
        reviewStatus: "REJECTED",
        domain: "Computer Science and IT",
      },
    });

    // 4. Legitimately APPROVED+PUBLISHED resource with verified access classification
    const pubId = `res_pub_${ts}`;
    createdResourceIds.push(pubId);
    await prisma.learningResource.create({
      data: {
        id: pubId,
        url: `https://example.edu/verified-free-${ts}`,
        canonicalUrl: `https://example.edu/verified-free-${ts}`,
        title: "Verified Free CS Resource",
        provider: "MIT OpenCourseWare",
        resourceType: "COURSE",
        description: "Verified free open course.",
        difficulty: "BEGINNER",
        language: "English",
        accessClassification: "COMPLETELY_FREE",
        verificationStatus: "VERIFIED",
        reviewStatus: "PUBLISHED",
        lastVerifiedAt: new Date(),
        domain: "Computer Science and IT",
      },
    });

    // 5. Admin-unpublished & admin-archived curated resources must NOT reappear via registry fallback
    const curatedCs = CURATED_RESOURCE_REGISTRY.filter((r) => r.domain === "Computer Science and IT");
    assert(curatedCs.length >= 2, "CS domain has at least 2 curated resources for unpublish/archive tests");
    const [unpubCurated, archCurated] = curatedCs;
    createdResourceIds.push(unpubCurated.id, archCurated.id);

    await prisma.learningResource.create({
      data: {
        id: unpubCurated.id,
        url: unpubCurated.url,
        canonicalUrl: unpubCurated.canonicalUrl,
        title: unpubCurated.title,
        provider: unpubCurated.provider,
        resourceType: unpubCurated.format,
        description: unpubCurated.description,
        difficulty: unpubCurated.difficulty,
        language: unpubCurated.language,
        accessClassification: unpubCurated.accessClassification,
        verificationStatus: unpubCurated.verificationStatus,
        reviewStatus: "REJECTED",
        domain: unpubCurated.domain,
      },
    });

    await prisma.learningResource.create({
      data: {
        id: archCurated.id,
        url: archCurated.url,
        canonicalUrl: archCurated.canonicalUrl,
        title: archCurated.title,
        provider: archCurated.provider,
        resourceType: archCurated.format,
        description: archCurated.description,
        difficulty: archCurated.difficulty,
        language: archCurated.language,
        accessClassification: archCurated.accessClassification,
        verificationStatus: archCurated.verificationStatus,
        reviewStatus: "ARCHIVED",
        domain: archCurated.domain,
      },
    });

    const csView = await getKitResourcesView(csKit.id, userId);
    const csIds = new Set((csView?.resources || []).map((r) => r.id));

    assert(!csIds.has(rejectedDbId), "REJECTED DB resource is hidden from student catalogue");
    assert(!csIds.has(unpubCurated.id), "Rejected curated resource does NOT reappear via registry fallback");
    assert(!csIds.has(archCurated.id), "Archived curated resource does NOT reappear via registry fallback");
    assert(csIds.has(pubId), "Verified & PUBLISHED resource appears in student catalogue");
    assert(csIds.has(incId), "PUBLISHED INCONCLUSIVE resource appears with truthful status");

    const csHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ResourceCatalogue, {
        kitId: csKit.id,
        domain: csKit.domain,
        roleTitle: csKit.jobTitle,
        resourcesOverride: csView.resources.filter((r) => r.id === pubId || r.id === incId),
      })
    );
    assert(csHtml.includes("Link Check Inconclusive"), "INCONCLUSIVE resource renders 'Link Check Inconclusive' badge");
    assert(csHtml.includes("Completely Free"), "Verified COMPLETELY_FREE resource renders 'Completely Free' badge");
  } finally {
    await prisma.studentResourceProgress.deleteMany({ where: { userId } });
    await prisma.interviewPrepKit.deleteMany({ where: { id: { in: createdKitIds } } });
    await prisma.learningResource.deleteMany({ where: { id: { in: createdResourceIds } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
