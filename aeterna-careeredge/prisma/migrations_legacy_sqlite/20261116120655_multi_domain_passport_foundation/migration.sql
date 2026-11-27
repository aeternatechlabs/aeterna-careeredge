-- AlterTable
ALTER TABLE "student_experiences" ADD COLUMN "experienceType" TEXT DEFAULT 'INTERNSHIP';

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN "academicDomain" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "achievements" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "certifications" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "gradeValue" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "gradingType" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "higherEducationGoal" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "longTermGoal" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "shortTermGoal" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "specialization" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "targetIndustry" TEXT;

-- AlterTable
ALTER TABLE "student_projects" ADD COLUMN "artifactUrl" TEXT;
ALTER TABLE "student_projects" ADD COLUMN "projectType" TEXT DEFAULT 'ACADEMIC';
ALTER TABLE "student_projects" ADD COLUMN "toolsOrTechnologies" TEXT;

-- CreateTable
CREATE TABLE "student_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "issuer" TEXT,
    "dateAwarded" DATETIME,
    "awardUrl" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "career_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT,
    "targetIndustry" TEXT,
    "preferredWorkType" TEXT,
    "higherEducationGoal" TEXT,
    "studyAbroadCountries" TEXT,
    "shortTermGoal" TEXT,
    "longTermGoal" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "career_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isTechnical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reference_specializations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_specializations_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "reference_domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "student_achievements_userId_idx" ON "student_achievements"("userId");

-- CreateIndex
CREATE INDEX "career_goals_userId_idx" ON "career_goals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reference_domains_name_key" ON "reference_domains"("name");

-- CreateIndex
CREATE UNIQUE INDEX "reference_domains_code_key" ON "reference_domains"("code");

-- CreateIndex
CREATE INDEX "reference_specializations_domainId_idx" ON "reference_specializations"("domainId");
