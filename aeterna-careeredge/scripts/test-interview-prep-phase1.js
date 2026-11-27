// scripts/test-interview-prep-phase1.js
// Comprehensive Phase 1 verification: validation, persistence, Passport consent, security, and backward compatibility.

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createJiti } = require("jiti");
const { NextRequest } = require("next/server");

const rootDir = path.resolve(__dirname, "..");
const jiti = createJiti(__filename, {
  alias: {
    "@": path.join(rootDir, "src"),
  },
});

// Load .env manually for standalone Node execution
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

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
  const userAId = `test_ip_a_${ts}`;
  const userBId = `test_ip_b_${ts}`;

  try {
    const { validateInterviewPrepIntake } = await jiti.import("../src/lib/interview/validation.ts");
    const {
      getTargetLevelsForDomain,
      getInterviewFocusOptionsForDomain,
    } = await jiti.import("../src/lib/interview/types.ts");
    const {
      getOrCreateInterviewKit,
      listUserInterviewKits,
      serializeInterviewKit,
    } = await jiti.import("../src/lib/interview/service.ts");
    const { getInterviewPassportPreview } = await jiti.import(
      "../src/lib/interview/passport-preview.ts"
    );
    const { createSession } = await jiti.import("../src/lib/session.ts");
    const routeModule = await jiti.import("../src/app/api/interview-prep/route.ts");
    const idRouteModule = await jiti.import("../src/app/api/interview-prep/[id]/route.ts");

    console.log("\nTest 1: Validation & Domain Adaptation");
    {
      const missingTitle = validateInterviewPrepIntake({ domain: "Computer Science and IT" });
      assert(!missingTitle.ok && missingTitle.field === "jobTitle", "Rejects missing jobTitle");

      const shortTitle = validateInterviewPrepIntake({ jobTitle: "A", domain: "Computer Science and IT" });
      assert(!shortTitle.ok && shortTitle.field === "jobTitle", "Rejects 1-char jobTitle");

      const badDomain = validateInterviewPrepIntake({ jobTitle: "Nurse", domain: "Unknown_Fake_Domain" });
      assert(!badDomain.ok && badDomain.field === "domain", "Rejects invalid domain");

      const badDate = validateInterviewPrepIntake({
        jobTitle: "Full-Stack Developer",
        domain: "Computer Science and IT",
        expectedInterviewDate: "not-a-date",
      });
      assert(!badDate.ok && badDate.field === "expectedInterviewDate", "Rejects invalid interview date");

      const minimalValid = validateInterviewPrepIntake({
        jobTitle: "Full-Stack Developer",
        domain: "Computer Science and IT",
      });
      assert(
        minimalValid.ok &&
          minimalValid.data.preferredLanguage === "English" &&
          minimalValid.data.useCareerPassport === false,
        "Accepts minimal required fields with English default and consent=false"
      );

      // Consent enforcement in validation: even if passportContext is sent, useCareerPassport=false strips it
      const strippedPassport = validateInterviewPrepIntake({
        jobTitle: "Registered Nurse",
        domain: "Pharmacy, Nursing and Allied Health",
        useCareerPassport: false,
        passportContext: { skills: ["ICU Triage"], projects: [], experiences: [], achievements: [], certifications: null },
      });
      assert(
        strippedPassport.ok && strippedPassport.data.passportContext === null,
        "Strips passportContext when useCareerPassport is false"
      );

      const nurseLevels = getTargetLevelsForDomain("Pharmacy, Nursing and Allied Health");
      assert(
        nurseLevels.some((l) => l.label.includes("Clinical Trainee")),
        "Adapts target levels for Nursing/Healthcare"
      );
      const techFocus = getInterviewFocusOptionsForDomain("Computer Science and IT");
      const teachFocus = getInterviewFocusOptionsForDomain("Education and Teaching");
      assert(
        techFocus.domainTopics.includes("System Design") &&
          teachFocus.domainTopics.includes("Pedagogy & Learning Theories"),
        "Adapts interview focus topics per domain"
      );
    }

    console.log("\nTest 2: Database Persistence, Backward Compatibility & Malformed JSON");
    await prisma.user.createMany({
      data: [
        {
          id: userAId,
          name: "Ananya Student",
          email: `ananya_${ts}@example.com`,
          onboardingCompleted: true,
        },
        {
          id: userBId,
          name: "Rohan Other",
          email: `rohan_${ts}@example.com`,
          onboardingCompleted: true,
        },
      ],
    });

    await prisma.studentProfile.create({
      data: {
        id: `prof_${ts}`,
        userId: userAId,
        academicDomain: "Computer Science and IT",
        educationLevel: "BE / B.Tech",
        institution: "RV College of Engineering",
        course: "Computer Science",
        preferredJobRole: "Full-Stack Developer",
      },
    });
    await prisma.studentSkill.create({
      data: { id: `sk_${ts}`, userId: userAId, name: "TypeScript", category: "TECHNICAL" },
    });

    // 2a. Minimal kit
    const minimalKit = await getOrCreateInterviewKit(userAId, {
      createNew: true,
      jobTitle: "Registered Nurse",
      domain: "Pharmacy, Nursing and Allied Health",
    });
    assert(
      Boolean(minimalKit.id) &&
        minimalKit.themes.length > 0 &&
        minimalKit.themes[0].questions[0].proofBankCitationAdvice.length > 0,
      "Creates minimal kit with preserved domain themes & Proof Bank citations"
    );

    // 2b. Full kit with Career Passport consent=true
    const fullKit = await getOrCreateInterviewKit(userAId, {
      createNew: true,
      jobTitle: "Full-Stack Developer",
      companyName: "Razorpay",
      domain: "Computer Science and IT",
      targetIndustry: "FinTech",
      location: "Bengaluru",
      opportunityType: "FULL_TIME",
      experienceLevel: "FRESHER",
      targetLevel: "ENTRY_LEVEL",
      interviewTypes: ["Technical / Subject Knowledge", "System Design"],
      expectedInterviewDate: "2026-12-15T00:00:00.000Z",
      preparationDuration: "1_MONTH",
      weeklyAvailability: "5_10_HOURS",
      learningFormats: ["DOCUMENTATION_ARTICLES", "PRACTICAL_EXERCISES"],
      preferredLanguage: "English",
      useCareerPassport: true,
      focusAreas: {
        strengthenSkills: ["TypeScript"],
        difficultTopics: ["System Design"],
        targetRoleSkills: ["React", "PostgreSQL"],
        priorityAreas: ["TypeScript", "Databases & SQL"],
      },
      jobDescriptionText: "Looking for a Full-Stack Developer skilled in TypeScript, React, and PostgreSQL.",
    });
    assert(
      fullKit.useCareerPassport === true &&
        fullKit.passportContext?.skills.includes("TypeScript") &&
        fullKit.focusAreas.difficultTopics.includes("System Design") &&
        fullKit.jobDescriptionText?.includes("PostgreSQL"),
      "Persists all expanded intake fields & server-loaded Career Passport context"
    );

    // 2c. Legacy kit (null new fields) + malformed JSON safety
    const legacyRow = await prisma.interviewPrepKit.create({
      data: {
        userId: userAId,
        jobId: `legacy-${ts}`,
        jobTitle: "Junior Legal Associate",
        themesJson: "{broken-json",
        interviewTypesJson: "{also-broken",
      },
    });
    const serializedLegacy = serializeInterviewKit(legacyRow);
    assert(
      serializedLegacy.jobTitle === "Junior Legal Associate" &&
        Array.isArray(serializedLegacy.themes) &&
        serializedLegacy.themes.length === 0 &&
        Array.isArray(serializedLegacy.interviewTypes) &&
        serializedLegacy.preferredLanguage === "English",
      "Handles legacy kits with null fields and malformed JSON safely"
    );

    const listed = await listUserInterviewKits(userAId);
    assert(listed.length === 3, `Lists all 3 kits for User A (got ${listed.length})`);

    console.log("\nTest 3: API Security, Auth & Cross-User Isolation");
    {
      const unauthGet = await routeModule.GET(new NextRequest("http://localhost:3000/api/interview-prep"));
      assert(unauthGet.status === 401, "Unauthenticated GET /api/interview-prep returns 401");

      const unauthPost = await routeModule.POST(
        new NextRequest("http://localhost:3000/api/interview-prep", {
          method: "POST",
          body: JSON.stringify({ jobTitle: "Test", domain: "Computer Science and IT" }),
        })
      );
      assert(unauthPost.status === 401, "Unauthenticated POST /api/interview-prep returns 401");

      const tokenB = await createSession({
        userId: userBId,
        email: `rohan_${ts}@example.com`,
        name: "Rohan Other",
        onboardingCompleted: true,
      });

      const crossUserReq = new NextRequest(`http://localhost:3000/api/interview-prep/${fullKit.id}`, {
        headers: { cookie: `ace_session=${tokenB}` },
      });
      const crossUserRes = await idRouteModule.GET(crossUserReq, {
        params: Promise.resolve({ id: fullKit.id }),
      });
      assert(crossUserRes.status === 404, "User B cannot retrieve User A's kit (returns 404)");

      const tokenA = await createSession({
        userId: userAId,
        email: `ananya_${ts}@example.com`,
        name: "Ananya Student",
        onboardingCompleted: true,
      });
      const ownerReq = new NextRequest(`http://localhost:3000/api/interview-prep/${fullKit.id}`, {
        headers: { cookie: `ace_session=${tokenA}` },
      });
      const ownerRes = await idRouteModule.GET(ownerReq, {
        params: Promise.resolve({ id: fullKit.id }),
      });
      const ownerBody = await ownerRes.json();
      assert(
        ownerRes.status === 200 &&
          ownerBody.id === fullKit.id &&
          ownerBody.companyName === "Razorpay" &&
          ownerBody.useCareerPassport === true,
        "Owner User A retrieves full expanded kit via GET /api/interview-prep/[id]"
      );
    }
    console.log("\nTest 4: Partial & Complete Career Passport Preview States (EMPTY / PARTIAL / COMPLETE / ERROR)");
    {
      // 1. No student_profile and no related records -> EMPTY
      const emptyPreview = await getInterviewPassportPreview(userBId);
      assert(
        emptyPreview.status === "EMPTY" &&
          emptyPreview.data === null &&
          emptyPreview.counts.skills === 0,
        "No profile + no related records returns EMPTY state"
      );

      // 2. No student_profile, but existing skills -> PARTIAL
      await prisma.studentSkill.create({
        data: { id: `sk_partial_${ts}`, userId: userBId, name: "SQL", category: "TECHNICAL" },
      });
      const skillsOnlyPreview = await getInterviewPassportPreview(userBId);
      assert(
        skillsOnlyPreview.status === "PARTIAL" &&
          skillsOnlyPreview.counts.skills === 1 &&
          skillsOnlyPreview.data?.skills.includes("SQL"),
        "No profile + existing skills returns PARTIAL state with skills"
      );

      // 3. No student_profile, existing education + projects -> PARTIAL
      await prisma.educationRecord.create({
        data: {
          id: `edu_partial_${ts}`,
          userId: userBId,
          level: "Undergraduate",
          institution: "NIT Surathkal",
          degree: "B.Tech",
        },
      });
      await prisma.studentProject.create({
        data: {
          id: `proj_partial_${ts}`,
          userId: userBId,
          title: "Clinic Queue App",
          description: "Patient scheduling system",
        },
      });
      const eduProjPreview = await getInterviewPassportPreview(userBId);
      assert(
        eduProjPreview.status === "PARTIAL" &&
          eduProjPreview.counts.educations === 1 &&
          eduProjPreview.counts.projects === 1 &&
          eduProjPreview.data?.projects[0]?.origin === "STUDENT_INPUT",
        "No profile + education & projects returns PARTIAL state with provenance"
      );

      // 4. Experiences & achievements (still no student_profile) -> PARTIAL
      await prisma.studentExperience.create({
        data: {
          id: `exp_partial_${ts}`,
          userId: userBId,
          companyName: "Apollo Clinic",
          jobTitle: "Intern",
        },
      });
      await prisma.studentAchievement.create({
        data: {
          id: `ach_partial_${ts}`,
          userId: userBId,
          title: "Dean's List 2025",
        },
      });
      const expAchPreview = await getInterviewPassportPreview(userBId);
      assert(
        expAchPreview.status === "PARTIAL" &&
          expAchPreview.counts.experiences === 1 &&
          expAchPreview.counts.achievements === 1 &&
          expAchPreview.data?.achievements.includes("Dean's List 2025"),
        "Experiences & achievements without profile returns PARTIAL state"
      );

      // 5. Complete Passport (profile + education + skills + project/experience) -> COMPLETE
      await prisma.studentProject.create({
        data: {
          id: `proj_comp_${ts}`,
          userId: userAId,
          title: "CareerEdge Tracker",
          description: "Full-stack app",
        },
      });
      const completePreview = await getInterviewPassportPreview(userAId);
      assert(
        completePreview.status === "COMPLETE" &&
          completePreview.counts.skills >= 1 &&
          completePreview.counts.projects >= 1,
        "User with complete Passport returns COMPLETE state"
      );

      // 6. Database read failure -> ERROR (never silently EMPTY)
      const failingDb = {
        user: {
          findUnique: async () => {
            throw new Error("Simulated Supabase connection timeout");
          },
        },
      };
      const errorPreview = await getInterviewPassportPreview(userAId, failingDb);
      assert(
        errorPreview.status === "ERROR" &&
          errorPreview.data === null &&
          Boolean(errorPreview.errorMessage),
        "Database read failure returns ERROR state (never silently EMPTY)"
      );
    }
  } finally {
    console.log("\n🧹 Cleaning up test records...");
    await prisma.interviewPrepKit.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.progressEvent.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.studentAchievement.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.studentExperience.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.studentProject.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.educationRecord.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.studentSkill.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.studentProfile.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
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
