// scripts/test-interview-prep-phase2.js
// Phase 2 integration test: verifies all normalized models through db (Supabase PostgREST db-proxy)
// and strict ownership isolation.

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createJiti } = require("jiti");

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
  const userAId = `test_p2_a_${ts}`;
  const userBId = `test_p2_b_${ts}`;
  const roadmapSlug = `test-fullstack-${ts}`;
  const resourceUrl = `https://developer.mozilla.org/test-p2-${ts}`;
  let createdRoadmapId = null;
  let createdResourceId = null;

  try {
    const { db } = await jiti.import("../src/lib/db.ts");
    const {
      requireOwnedKit,
      requireOwnedMockSession,
      requireOwnedStudyPlan,
    } = await jiti.import("../src/lib/interview/ownership.ts");

    await prisma.user.createMany({
      data: [
        { id: userAId, name: "Phase2 User A", email: `p2_a_${ts}@example.com`, onboardingCompleted: true },
        { id: userBId, name: "Phase2 User B", email: `p2_b_${ts}@example.com`, onboardingCompleted: true },
      ],
    });

    console.log("\nTest 1: Shared Roadmap, Version, Phase, Topic, Prerequisites & Resources via db-proxy");
    const roadmap = await db.careerRoadmap.create({
      data: {
        slug: roadmapSlug,
        domain: "Computer Science and IT",
        roleTitle: "Full-Stack Developer",
        description: "Test roadmap",
        isPublished: true,
      },
    });
    createdRoadmapId = roadmap.id;

    const version = await db.roadmapVersion.create({
      data: {
        roadmapId: roadmap.id,
        versionNumber: 1,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    const phase = await db.roadmapPhase.create({
      data: {
        versionId: version.id,
        orderIndex: 1,
        title: "Web Foundations",
        estimatedHours: 6,
      },
    });

    const topic1 = await db.roadmapTopic.create({
      data: {
        phaseId: phase.id,
        slug: "http-basics",
        orderIndex: 1,
        title: "HTTP & HTTPS",
        overview: "How requests and responses work",
        whyItMatters: "Core to all web apps",
      },
    });

    const topic2 = await db.roadmapTopic.create({
      data: {
        phaseId: phase.id,
        slug: "rest-apis",
        orderIndex: 2,
        title: "REST APIs",
        overview: "Designing HTTP APIs",
        whyItMatters: "Backend communication",
      },
    });

    await db.roadmapPrerequisite.create({
      data: { topicId: topic2.id, prerequisiteTopicId: topic1.id },
    });

    const resource = await db.learningResource.create({
      data: {
        url: resourceUrl,
        title: "MDN HTTP Overview",
        provider: "MDN Web Docs",
        resourceType: "OFFICIAL_DOCS",
        description: "Official MDN guide to HTTP",
        accessClassification: "COMPLETELY_FREE",
        verificationStatus: "VERIFIED",
        domain: "Computer Science and IT",
      },
    });
    createdResourceId = resource.id;

    await db.topicResource.create({
      data: {
        topicId: topic1.id,
        resourceId: resource.id,
        recommendedOrder: 1,
        whyRecommended: "Authoritative reference",
      },
    });

    await db.resourceVerificationLog.create({
      data: {
        resourceId: resource.id,
        httpStatus: 200,
        status: "VERIFIED",
        checkedBy: "phase2-test",
      },
    });

    const loadedTopic = await db.roadmapTopic.findUnique({
      where: { id: topic1.id },
      include: { resources: true },
    });
    assert(
      loadedTopic && Array.isArray(loadedTopic.resources) && loadedTopic.resources.length === 1,
      "db-proxy resolves RoadmapTopic + TopicResource relation"
    );

    console.log("\nTest 2: Student Progress, Exercises, Mock Interview, Study Plan & Ownership Isolation");
    const kit = await db.interviewPrepKit.create({
      data: {
        userId: userAId,
        jobId: `p2-kit-${ts}`,
        jobTitle: "Full-Stack Developer",
        domain: "Computer Science and IT",
        activeRoadmapVersionId: version.id,
        themesJson: "[]",
      },
    });

    const prog = await db.studentRoadmapProgress.upsert({
      where: {
        userId_kitId_topicId: { userId: userAId, kitId: kit.id, topicId: topic1.id },
      },
      create: { userId: userAId, kitId: kit.id, topicId: topic1.id, status: "IN_PROGRESS" },
      update: { status: "COMPLETED" },
    });
    assert(prog.status === "IN_PROGRESS", "StudentRoadmapProgress upsert works via db-proxy");

    const resProg = await db.studentResourceProgress.create({
      data: { userId: userAId, kitId: kit.id, resourceId: resource.id, saved: true },
    });
    assert(resProg.saved === true, "StudentResourceProgress create works via db-proxy");

    const exercise = await db.practiceExercise.create({
      data: {
        topicId: topic1.id,
        phaseId: phase.id,
        title: "Inspect HTTP Headers",
        objective: "Use curl or DevTools to inspect response headers",
        expectedOutput: "Documented header breakdown",
      },
    });

    const sub = await db.practiceSubmission.create({
      data: { userId: userAId, kitId: kit.id, exerciseId: exercise.id, status: "COMPLETED" },
    });
    assert(sub.status === "COMPLETED", "PracticeSubmission create works via db-proxy");

    const question = await db.interviewQuestionRecord.create({
      data: {
        domain: "Computer Science and IT",
        topicId: topic1.id,
        stage: "TECHNICAL",
        questionText: "What is the difference between HTTP and HTTPS?",
        evaluatorFocus: "TLS handshake and transport security",
        responseFramework: "Explain encryption, certificates, and integrity",
      },
    });
    assert(Boolean(question.id), "InterviewQuestionRecord create works via db-proxy");

    const mockSession = await db.mockInterviewSession.create({
      data: {
        userId: userAId,
        kitId: kit.id,
        roleTitle: "Full-Stack Developer",
        interviewMode: "TECHNICAL",
      },
    });
    await db.mockInterviewTurn.create({
      data: {
        sessionId: mockSession.id,
        turnOrder: 1,
        questionText: "Explain how DNS resolution works.",
        userAnswer: "Client queries resolver...",
      },
    });

    const studyPlan = await db.studyPlan.create({
      data: { userId: userAId, kitId: kit.id, title: "4-Week Prep Plan", weeklyHours: 6 },
    });
    await db.studyPlanTask.create({
      data: { studyPlanId: studyPlan.id, weekNumber: 1, topicId: topic1.id, title: "Study HTTP" },
    });

    // Ownership checks
    assert(Boolean(await requireOwnedKit(kit.id, userAId)), "Owner User A passes requireOwnedKit");
    assert((await requireOwnedKit(kit.id, userBId)) === null, "User B blocked by requireOwnedKit");
    assert(
      Boolean(await requireOwnedMockSession(mockSession.id, userAId)),
      "Owner User A passes requireOwnedMockSession"
    );
    assert(
      (await requireOwnedMockSession(mockSession.id, userBId)) === null,
      "User B blocked by requireOwnedMockSession"
    );
    assert(
      Boolean(await requireOwnedStudyPlan(studyPlan.id, userAId)),
      "Owner User A passes requireOwnedStudyPlan"
    );
    assert(
      (await requireOwnedStudyPlan(studyPlan.id, userBId)) === null,
      "User B blocked by requireOwnedStudyPlan"
    );
  } finally {
    console.log("\n🧹 Cleaning up Phase 2 test records...");
    if (createdRoadmapId) {
      await prisma.careerRoadmap.deleteMany({ where: { id: createdRoadmapId } });
    }
    if (createdResourceId) {
      await prisma.learningResource.deleteMany({ where: { id: createdResourceId } });
    }
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
