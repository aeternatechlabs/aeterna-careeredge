-- CreateTable
CREATE TABLE "education_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "boardOrUniversity" TEXT,
    "degree" TEXT,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "scoreOrGrade" TEXT,
    "scoreType" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "education_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "proficiencyLevel" TEXT,
    "yearsOfExperience" REAL,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "role" TEXT,
    "techStack" TEXT,
    "projectUrl" TEXT,
    "repositoryUrl" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_experiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employmentType" TEXT,
    "location" TEXT,
    "locationType" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "skillsUsed" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_experiences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My Resume',
    "targetRole" TEXT,
    "templateId" TEXT NOT NULL DEFAULT 'standard-modern',
    "structuredData" TEXT,
    "atsScore" INTEGER,
    "feedback" TEXT,
    "documentId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sop_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Statement of Purpose',
    "targetUniversity" TEXT,
    "targetProgram" TEXT,
    "guidelinesPrompt" TEXT,
    "draftContent" TEXT,
    "wordCount" INTEGER DEFAULT 0,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sop_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "linkedin_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileUrl" TEXT,
    "headlineSuggestion" TEXT,
    "summarySuggestion" TEXT,
    "actionItems" TEXT,
    "optimizationScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "linkedin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "career_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "responsesJson" TEXT NOT NULL,
    "scoresJson" TEXT NOT NULL,
    "dominantTraits" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "career_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "career_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "careerTitle" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "matchPercentage" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "requiredSkillsJson" TEXT,
    "recommendedCourses" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "isStudentReviewed" BOOLEAN NOT NULL DEFAULT false,
    "studentDecision" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "career_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "career_recommendations_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "career_assessments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobListingRefId" TEXT,
    "applicationStatus" TEXT NOT NULL DEFAULT 'SAVED',
    "appliedDate" DATETIME,
    "notes" TEXT,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "counselling_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "preferredMode" TEXT NOT NULL DEFAULT 'VIDEO',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'English',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" DATETIME,
    "crmSyncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "crmLeadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "counselling_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leadType" TEXT NOT NULL DEFAULT 'STUDENT_COUNSELLING',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "city" TEXT,
    "state" TEXT,
    "educationLevel" TEXT,
    "institution" TEXT,
    "course" TEXT,
    "careerInterest" TEXT,
    "counsellorConsent" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "syncAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAttempt" DATETIME,
    "externalCrmId" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "crm_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpointUrl" TEXT NOT NULL,
    "requestData" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseData" TEXT,
    "errorMessage" TEXT,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "crm_sync_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stored_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "storageEngine" TEXT NOT NULL DEFAULT 'LOCAL_PRIVATE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stored_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reliabilityScore" REAL NOT NULL DEFAULT 1.0,
    "verificationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reference_institutions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionCode" TEXT,
    "institutionType" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "websiteUrl" TEXT NOT NULL,
    "accreditationGrade" TEXT,
    "affiliatingUniv" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_institutions_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "institutionId" TEXT,
    "title" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "durationYears" REAL NOT NULL,
    "eligibilitySummary" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_courses_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reference_courses_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "reference_institutions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_occupations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ncsCode" TEXT,
    "sector" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coreCompetencies" TEXT,
    "educationPath" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_occupations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "standardCode" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_skills_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_job_listings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "officialPostingUrl" TEXT NOT NULL,
    "salaryDisclosed" BOOLEAN NOT NULL DEFAULT false,
    "salaryCurrency" TEXT DEFAULT 'INR',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "postedDate" DATETIME,
    "deadlineDate" DATETIME,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_job_listings_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_study_destinations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "officialImmigrationUrl" TEXT NOT NULL,
    "visaCategoryName" TEXT,
    "postStudyWorkSummary" TEXT NOT NULL,
    "intakeSeasonsJson" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_study_destinations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_admission_requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "institutionId" TEXT,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "acceptedEntranceExams" TEXT,
    "minimumCutoffScore" TEXT,
    "prospectusUrl" TEXT NOT NULL,
    "academicYear" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_admission_requirements_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reference_admission_requirements_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "reference_institutions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reference_admission_requirements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "reference_courses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reference_scholarships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "eligibilitySummary" TEXT NOT NULL,
    "benefitSummary" TEXT NOT NULL,
    "officialPortalUrl" TEXT NOT NULL,
    "deadline" DATETIME,
    "academicYear" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reference_scholarships_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_student_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "headline" TEXT,
    "bio" TEXT,
    "educationLevel" TEXT,
    "institution" TEXT,
    "course" TEXT,
    "graduationYear" INTEGER,
    "skills" TEXT,
    "projects" TEXT,
    "experience" TEXT,
    "careerInterests" TEXT,
    "preferredJobRole" TEXT,
    "studyAbroadCountries" TEXT,
    "passportScore" INTEGER NOT NULL DEFAULT 15,
    "isProfileLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_student_profiles" ("careerInterests", "city", "course", "createdAt", "educationLevel", "experience", "graduationYear", "id", "institution", "preferredJobRole", "projects", "skills", "state", "studyAbroadCountries", "updatedAt", "userId") SELECT "careerInterests", "city", "course", "createdAt", "educationLevel", "experience", "graduationYear", "id", "institution", "preferredJobRole", "projects", "skills", "state", "studyAbroadCountries", "updatedAt", "userId" FROM "student_profiles";
DROP TABLE "student_profiles";
ALTER TABLE "new_student_profiles" RENAME TO "student_profiles";
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "education_records_userId_idx" ON "education_records"("userId");

-- CreateIndex
CREATE INDEX "student_skills_userId_idx" ON "student_skills"("userId");

-- CreateIndex
CREATE INDEX "student_projects_userId_idx" ON "student_projects"("userId");

-- CreateIndex
CREATE INDEX "student_experiences_userId_idx" ON "student_experiences"("userId");

-- CreateIndex
CREATE INDEX "certifications_userId_idx" ON "certifications"("userId");

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "resumes"("userId");

-- CreateIndex
CREATE INDEX "sop_documents_userId_idx" ON "sop_documents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_profiles_userId_key" ON "linkedin_profiles"("userId");

-- CreateIndex
CREATE INDEX "career_assessments_userId_idx" ON "career_assessments"("userId");

-- CreateIndex
CREATE INDEX "career_recommendations_userId_idx" ON "career_recommendations"("userId");

-- CreateIndex
CREATE INDEX "career_recommendations_assessmentId_idx" ON "career_recommendations"("assessmentId");

-- CreateIndex
CREATE INDEX "job_applications_userId_idx" ON "job_applications"("userId");

-- CreateIndex
CREATE INDEX "counselling_requests_userId_idx" ON "counselling_requests"("userId");

-- CreateIndex
CREATE INDEX "crm_leads_userId_idx" ON "crm_leads"("userId");

-- CreateIndex
CREATE INDEX "crm_leads_syncStatus_idx" ON "crm_leads"("syncStatus");

-- CreateIndex
CREATE INDEX "crm_sync_logs_leadId_idx" ON "crm_sync_logs"("leadId");

-- CreateIndex
CREATE INDEX "consent_records_userId_idx" ON "consent_records"("userId");

-- CreateIndex
CREATE INDEX "consent_records_consentType_idx" ON "consent_records"("consentType");

-- CreateIndex
CREATE UNIQUE INDEX "stored_documents_storageKey_key" ON "stored_documents"("storageKey");

-- CreateIndex
CREATE INDEX "stored_documents_userId_idx" ON "stored_documents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_name_key" ON "data_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "reference_institutions_institutionCode_key" ON "reference_institutions"("institutionCode");

-- CreateIndex
CREATE INDEX "reference_institutions_sourceId_idx" ON "reference_institutions"("sourceId");

-- CreateIndex
CREATE INDEX "reference_institutions_name_idx" ON "reference_institutions"("name");

-- CreateIndex
CREATE INDEX "reference_institutions_state_idx" ON "reference_institutions"("state");

-- CreateIndex
CREATE INDEX "reference_courses_sourceId_idx" ON "reference_courses"("sourceId");

-- CreateIndex
CREATE INDEX "reference_courses_institutionId_idx" ON "reference_courses"("institutionId");

-- CreateIndex
CREATE INDEX "reference_courses_discipline_idx" ON "reference_courses"("discipline");

-- CreateIndex
CREATE INDEX "reference_occupations_sourceId_idx" ON "reference_occupations"("sourceId");

-- CreateIndex
CREATE INDEX "reference_occupations_title_idx" ON "reference_occupations"("title");

-- CreateIndex
CREATE UNIQUE INDEX "reference_skills_name_key" ON "reference_skills"("name");

-- CreateIndex
CREATE INDEX "reference_skills_sourceId_idx" ON "reference_skills"("sourceId");

-- CreateIndex
CREATE INDEX "reference_job_listings_sourceId_idx" ON "reference_job_listings"("sourceId");

-- CreateIndex
CREATE INDEX "reference_job_listings_jobTitle_idx" ON "reference_job_listings"("jobTitle");

-- CreateIndex
CREATE UNIQUE INDEX "reference_study_destinations_countryCode_key" ON "reference_study_destinations"("countryCode");

-- CreateIndex
CREATE INDEX "reference_study_destinations_sourceId_idx" ON "reference_study_destinations"("sourceId");

-- CreateIndex
CREATE INDEX "reference_admission_requirements_sourceId_idx" ON "reference_admission_requirements"("sourceId");

-- CreateIndex
CREATE INDEX "reference_admission_requirements_institutionId_idx" ON "reference_admission_requirements"("institutionId");

-- CreateIndex
CREATE INDEX "reference_admission_requirements_courseId_idx" ON "reference_admission_requirements"("courseId");

-- CreateIndex
CREATE INDEX "reference_scholarships_sourceId_idx" ON "reference_scholarships"("sourceId");

-- CreateIndex
CREATE INDEX "reference_scholarships_title_idx" ON "reference_scholarships"("title");
