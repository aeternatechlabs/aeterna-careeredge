// scripts/test-interview-prep-phase3.js
// Phase 3 tests: DAG cycle guard, Full-Stack Developer seeding, multi-domain isolation,
// roadmap progress API, and PracticeSubmission evidenceItemId ownership guard.

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createJiti } = require("jiti");
const { NextRequest } = require("next/server");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

const jiti = createJiti(__filename, { alias: { "@": path.join(rootDir, "src") } });
const prisma = new PrismaClient();

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
  const ts = Date.now();
  const userAId = `test_p3_a_${ts}`;
  const userBId = `test_p3_b_${ts}`;

  try {
    const {
      wouldCreatePrerequisiteCycle,
      ensureFullStackDeveloperRoadmapSeeded,
      getKitRoadmapView,
    } = await jiti.import("../src/lib/interview/roadmap-engine.ts");
    const { getOrCreateInterviewKit } = await jiti.import("../src/lib/interview/service.ts");
    const { createSession } = await jiti.import("../src/lib/session.ts");
    const roadmapRoute = await jiti.import("../src/app/api/interview-prep/[id]/roadmap/route.ts");
    const progressRoute = await jiti.import("../src/app/api/interview-prep/[id]/roadmap/progress/route.ts");
    const exerciseRoute = await jiti.import("../src/app/api/interview-prep/[id]/exercises/[exerciseId]/route.ts");

    console.log("\nTest 1: DAG Cycle Guard");
    {
      const edges = [
        { topicId: "B", prerequisiteTopicId: "A" },
        { topicId: "C", prerequisiteTopicId: "B" },
      ];
      assert(wouldCreatePrerequisiteCycle(edges, "A", "A") === true, "Rejects self-loop (A -> A)");
      assert(wouldCreatePrerequisiteCycle(edges, "A", "C") === true, "Rejects transitive cycle (A -> C -> B -> A)");
      assert(wouldCreatePrerequisiteCycle(edges, "D", "C") === false, "Allows valid acyclic edge (D -> C)");
    }

    console.log("\nTest 2: Full-Stack Developer Template Seeding");
    const seeded = await ensureFullStackDeveloperRoadmapSeeded();
    assert(
      seeded.phasesCount === 10 && seeded.topicsCount >= 23 && seeded.exercisesCount === 10,
      `Seeded 10 phases, ${seeded.topicsCount} topics, ${seeded.exercisesCount} exercises`
    );

    await prisma.user.createMany({
      data: [
        { id: userAId, name: "P3 User A", email: `p3_a_${ts}@example.com`, onboardingCompleted: true },
        { id: userBId, name: "P3 User B", email: `p3_b_${ts}@example.com`, onboardingCompleted: true },
      ],
    });

    const evA = await prisma.evidenceItem.create({
      data: { id: `ev_a_${ts}`, userId: userAId, type: "GITHUB_REPO", title: "My Fullstack Repo" },
    });
    const evB = await prisma.evidenceItem.create({
      data: { id: `ev_b_${ts}`, userId: userBId, type: "GITHUB_REPO", title: "Other User Repo" },
    });

    console.log("\nTest 3: Multi-Domain Kit Attachment & Isolation");
    const techKit = await getOrCreateInterviewKit(userAId, {
      createNew: true,
      jobTitle: "Full-Stack Developer",
      domain: "Computer Science and IT",
    });
    const nurseKit = await getOrCreateInterviewKit(userAId, {
      createNew: true,
      jobTitle: "Registered Nurse",
      domain: "Pharmacy, Nursing and Allied Health",
    });

    const techView = await getKitRoadmapView(techKit.id, userAId);
    assert(
      techView?.available === true &&
        techView.phases.length === 10 &&
        techView.phases.every((p) => p.topics.length > 0 && p.topics.every((t) => t.subtopics.length > 0 && t.learningOutcomes.length > 0)),
      "Tech kit attaches 10-phase Full-Stack roadmap with non-empty topics/subtopics/outcomes"
    );

    const nurseView = await getKitRoadmapView(nurseKit.id, userAId);
    assert(
      nurseView?.available === false && nurseView.phases.length === 0,
      "Non-IT Nursing kit does not receive a programming roadmap"
    );

    console.log("\nTest 4: Roadmap Progress & Exercise Evidence Ownership APIs");
    const tokenA = await createSession({
      userId: userAId,
      email: `p3_a_${ts}@example.com`,
      name: "P3 User A",
      onboardingCompleted: true,
    });
    const tokenB = await createSession({
      userId: userBId,
      email: `p3_b_${ts}@example.com`,
      name: "P3 User B",
      onboardingCompleted: true,
    });

    const firstTopic = techView.phases[0].topics[0];
    const firstExercise = techView.phases[0].exercises[0];

    const patchRes = await progressRoute.PATCH(
      new NextRequest(`http://localhost:3000/api/interview-prep/${techKit.id}/roadmap/progress`, {
        method: "PATCH",
        headers: { cookie: `ace_session=${tokenA}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: firstTopic.id, status: "COMPLETED", notes: "Reviewed HTTP headers" }),
      }),
      { params: Promise.resolve({ id: techKit.id }) }
    );
    assert(patchRes.status === 200, "Owner A updates topic progress to COMPLETED (200)");

    const refreshedGet = await roadmapRoute.GET(
      new NextRequest(`http://localhost:3000/api/interview-prep/${techKit.id}/roadmap`, {
        headers: { cookie: `ace_session=${tokenA}` },
      }),
      { params: Promise.resolve({ id: techKit.id }) }
    );
    const refreshedBody = await refreshedGet.json();
    assert(
      refreshedBody.stats.completedTopics === 1 && refreshedBody.stats.percentComplete > 0,
      "Roadmap stats reflect completed topic"
    );

    const crossPatch = await progressRoute.PATCH(
      new NextRequest(`http://localhost:3000/api/interview-prep/${techKit.id}/roadmap/progress`, {
        method: "PATCH",
        headers: { cookie: `ace_session=${tokenB}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: firstTopic.id, status: "COMPLETED" }),
      }),
      { params: Promise.resolve({ id: techKit.id }) }
    );
    assert(crossPatch.status === 404, "User B blocked from updating User A's roadmap progress (404)");

    // Exercise submission with User B's evidenceItemId -> 403!
    const badEvidenceRes = await exerciseRoute.POST(
      new NextRequest(`http://localhost:3000/api/interview-prep/${techKit.id}/exercises/${firstExercise.id}`, {
        method: "POST",
        headers: { cookie: `ace_session=${tokenA}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", evidenceItemId: evB.id }),
      }),
      { params: Promise.resolve({ id: techKit.id, exerciseId: firstExercise.id }) }
    );
    assert(badEvidenceRes.status === 403, "Blocks linking another user's EvidenceItem (403)");

    // Exercise submission with javascript: URL -> 400!
    const badUrlRes = await exerciseRoute.POST(
      new NextRequest(`http://localhost:3000/api/interview-prep/${techKit.id}/exercises/${firstExercise.id}`, {
        method: "POST",
        headers: { cookie: `ace_session=${tokenA}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", artifactUrl: "javascript:alert(1)" }),
      }),
      { params: Promise.resolve({ id: techKit.id, exerciseId: firstExercise.id }) }
    );
    assert(badUrlRes.status === 400, "Blocks unsafe javascript: artifactUrl (400)");

    // Exercise submission with User A's own evidenceItemId -> 200!
    const goodExRes = await exerciseRoute.POST(
      new NextRequest(`http://localhost:3000/api/interview-prep/${techKit.id}/exercises/${firstExercise.id}`, {
        method: "POST",
        headers: { cookie: `ace_session=${tokenA}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          evidenceItemId: evA.id,
          artifactUrl: "https://github.com/example/http-notes",
          notes: "Completed DevTools inspection",
        }),
      }),
      { params: Promise.resolve({ id: techKit.id, exerciseId: firstExercise.id }) }
    );
    assert(goodExRes.status === 200, "Owner A submits exercise with own EvidenceItem (200)");
  } finally {
    console.log("\n🧹 Cleaning up Phase 3 test records...");
    await prisma.practiceSubmission.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.studentRoadmapProgress.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.interviewPrepKit.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.progressEvent.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.evidenceItem.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await prisma.$disconnect();
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`Results: ${passed}/${passed + failed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
