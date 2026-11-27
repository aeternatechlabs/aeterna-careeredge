-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "passwordHash" TEXT,
    "counsellorConsent" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "headline" TEXT,
    "bio" TEXT,
    "academicDomain" TEXT,
    "specialization" TEXT,
    "educationLevel" TEXT,
    "institution" TEXT,
    "course" TEXT,
    "graduationYear" INTEGER,
    "gradingType" TEXT,
    "gradeValue" TEXT,
    "skills" TEXT,
    "projects" TEXT,
    "experience" TEXT,
    "achievements" TEXT,
    "certifications" TEXT,
    "careerInterests" TEXT,
    "preferredJobRole" TEXT,
    "targetIndustry" TEXT,
    "higherEducationGoal" TEXT,
    "shortTermGoal" TEXT,
    "longTermGoal" TEXT,
    "studyAbroadCountries" TEXT,
    "passportScore" INTEGER NOT NULL DEFAULT 15,
    "isProfileLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_records" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "proficiencyLevel" TEXT,
    "yearsOfExperience" DOUBLE PRECISION,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "role" TEXT,
    "projectType" TEXT DEFAULT 'ACADEMIC',
    "toolsOrTechnologies" TEXT,
    "techStack" TEXT,
    "projectUrl" TEXT,
    "artifactUrl" TEXT,
    "repositoryUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_experiences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employmentType" TEXT,
    "experienceType" TEXT DEFAULT 'INTERNSHIP',
    "location" TEXT,
    "locationType" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "skillsUsed" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My Resume',
    "targetRole" TEXT,
    "templateId" TEXT NOT NULL DEFAULT 'standard-modern',
    "structuredData" TEXT,
    "styleData" TEXT,
    "atsScore" INTEGER,
    "feedback" TEXT,
    "documentId" TEXT,
    "contentHash" TEXT,
    "lastAnalyzedAt" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL DEFAULT 'Saved Version',
    "snapshot" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_analyses" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "userId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "overallSummary" TEXT NOT NULL,
    "priorityFixes" TEXT NOT NULL,
    "sectionAnalyses" TEXT NOT NULL,
    "crossSectionIssues" TEXT NOT NULL,
    "atsReadability" TEXT NOT NULL,
    "jdComparison" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Statement of Purpose',
    "targetUniversity" TEXT,
    "targetProgram" TEXT,
    "guidelinesPrompt" TEXT,
    "draftContent" TEXT,
    "wordCount" INTEGER DEFAULT 0,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sop_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileUrl" TEXT,
    "linkedInSubId" TEXT,
    "linkedInName" TEXT,
    "linkedInEmail" TEXT,
    "linkedInPictureUrl" TEXT,
    "connectedAt" TIMESTAMP(3),
    "headlineSuggestion" TEXT,
    "summarySuggestion" TEXT,
    "actionItems" TEXT,
    "optimizationScore" INTEGER,
    "importedRawJson" TEXT,
    "sectionsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "responsesJson" TEXT NOT NULL,
    "scoresJson" TEXT NOT NULL,
    "dominantTraits" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_recommendations" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobListingRefId" TEXT,
    "jobUrl" TEXT,
    "location" TEXT,
    "salary" TEXT,
    "employmentType" TEXT,
    "applicationStatus" TEXT NOT NULL DEFAULT 'SAVED',
    "appliedDate" TIMESTAMP(3),
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "statusHistoryJson" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselling_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "preferredMode" TEXT NOT NULL DEFAULT 'VIDEO',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'English',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "crmSyncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "crmLeadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselling_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
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
    "lastSyncAttempt" TIMESTAMP(3),
    "externalCrmId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_sync_logs" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpointUrl" TEXT NOT NULL,
    "requestData" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseData" TEXT,
    "errorMessage" TEXT,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "crm_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "storageEngine" TEXT NOT NULL DEFAULT 'LOCAL_PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stored_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_institutions" (
    "id" TEXT NOT NULL,
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
    "retrievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_courses" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "institutionId" TEXT,
    "title" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "durationYears" DOUBLE PRECISION NOT NULL,
    "eligibilitySummary" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_occupations" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ncsCode" TEXT,
    "sector" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coreCompetencies" TEXT,
    "educationPath" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_skills" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "standardCode" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_job_listings" (
    "id" TEXT NOT NULL,
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
    "postedDate" TIMESTAMP(3),
    "deadlineDate" TIMESTAMP(3),
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_job_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_study_destinations" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "officialImmigrationUrl" TEXT NOT NULL,
    "visaCategoryName" TEXT,
    "postStudyWorkSummary" TEXT NOT NULL,
    "intakeSeasonsJson" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_study_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_admission_requirements" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "institutionId" TEXT,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "acceptedEntranceExams" TEXT,
    "minimumCutoffScore" TEXT,
    "prospectusUrl" TEXT NOT NULL,
    "academicYear" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_admission_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_scholarships" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "eligibilitySummary" TEXT NOT NULL,
    "benefitSummary" TEXT NOT NULL,
    "officialPortalUrl" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "academicYear" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "retrievedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "issuer" TEXT,
    "dateAwarded" TIMESTAMP(3),
    "awardUrl" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT,
    "targetIndustry" TEXT,
    "preferredWorkType" TEXT,
    "higherEducationGoal" TEXT,
    "studyAbroadCountries" TEXT,
    "shortTermGoal" TEXT,
    "longTermGoal" TEXT,
    "dataOrigin" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_domains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isTechnical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_specializations" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" TEXT NOT NULL DEFAULT '[]',
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_seen_panels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "guide_seen_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "relatedSkill" TEXT,
    "issuer" TEXT,
    "url" TEXT,
    "date" TIMESTAMP(3),
    "provenance" TEXT NOT NULL DEFAULT 'STUDENT_INPUT',
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "truth_check_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "flaggedItems" TEXT NOT NULL,
    "supportedCount" INTEGER NOT NULL DEFAULT 0,
    "unsupportedCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "truth_check_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_fit_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "resultsJson" TEXT NOT NULL,
    "referenceSourceIds" TEXT NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_fit_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT,
    "targetProfession" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprint_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_tasks" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "dayNumber" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "linkedGapType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprint_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_packs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "resumeVersionId" TEXT,
    "matchSnapshot" TEXT NOT NULL,
    "coverNoteDraft" TEXT,
    "introMessageDraft" TEXT,
    "talkingPointsJson" TEXT,
    "checklist" TEXT NOT NULL DEFAULT '[]',
    "externalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_prep_kits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT,
    "domain" TEXT,
    "targetIndustry" TEXT,
    "location" TEXT,
    "opportunityType" TEXT,
    "experienceLevel" TEXT,
    "targetLevel" TEXT,
    "interviewTypesJson" TEXT,
    "expectedInterviewDate" TIMESTAMP(3),
    "preparationDuration" TEXT,
    "weeklyAvailability" TEXT,
    "learningFormatsJson" TEXT,
    "preferredLanguage" TEXT DEFAULT 'English',
    "useCareerPassport" BOOLEAN NOT NULL DEFAULT false,
    "passportContextJson" TEXT,
    "focusAreasJson" TEXT,
    "jobDescriptionText" TEXT,
    "activeRoadmapVersionId" TEXT,
    "themesJson" TEXT NOT NULL,
    "aiOperationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_prep_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_roadmaps" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_versions" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_phases" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedHours" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_topics" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "priority" TEXT NOT NULL DEFAULT 'ESSENTIAL',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
    "subtopicsJson" TEXT NOT NULL DEFAULT '[]',
    "learningOutcomesJson" TEXT NOT NULL DEFAULT '[]',
    "completionCriteriaJson" TEXT NOT NULL DEFAULT '[]',
    "practicePromptsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_prerequisites" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "prerequisiteTopicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "language" TEXT NOT NULL DEFAULT 'English',
    "estimatedMinutes" INTEGER,
    "accessClassification" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "lastVerifiedAt" TIMESTAMP(3),
    "sourceAttribution" TEXT,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_resources" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "recommendedOrder" INTEGER NOT NULL DEFAULT 1,
    "whyRecommended" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_verification_logs" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_roadmap_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_roadmap_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_resource_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "studied" BOOLEAN NOT NULL DEFAULT false,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "reportedBroken" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "studiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_resource_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_exercises" (
    "id" TEXT NOT NULL,
    "topicId" TEXT,
    "phaseId" TEXT,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "skillsPracticedJson" TEXT NOT NULL DEFAULT '[]',
    "requirementsJson" TEXT NOT NULL DEFAULT '[]',
    "expectedOutput" TEXT NOT NULL,
    "checklistJson" TEXT NOT NULL DEFAULT '[]',
    "rubricJson" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "artifactUrl" TEXT,
    "evidenceItemId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_question_records" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "roleTitle" TEXT,
    "topicId" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "questionType" TEXT NOT NULL DEFAULT 'CONCEPTUAL',
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "questionText" TEXT NOT NULL,
    "evaluatorFocus" TEXT NOT NULL,
    "responseFramework" TEXT NOT NULL,
    "commonMistakesJson" TEXT NOT NULL DEFAULT '[]',
    "followUpsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_question_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_interview_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "interviewMode" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "totalQuestions" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "overallScore" INTEGER,
    "feedbackSummaryJson" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_interview_turns" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnOrder" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "userAnswer" TEXT,
    "aiFeedbackJson" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_interview_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weeklyHours" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_tasks" (
    "id" TEXT NOT NULL,
    "studyPlanId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "dayNumber" INTEGER,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "taskType" TEXT NOT NULL DEFAULT 'TOPIC',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "refId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Career Guide Chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "actionLinks" TEXT,
    "dataCitations" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceInr" INTEGER NOT NULL DEFAULT 0,
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_feature_limits" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "monthlyQuota" INTEGER NOT NULL,
    "maxBurst" INTEGER,

    CONSTRAINT "plan_feature_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'SELF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventName" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_tokenHash_idx" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

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
CREATE INDEX "resume_versions_resumeId_idx" ON "resume_versions"("resumeId");

-- CreateIndex
CREATE INDEX "resume_versions_userId_idx" ON "resume_versions"("userId");

-- CreateIndex
CREATE INDEX "resume_analyses_resumeId_idx" ON "resume_analyses"("resumeId");

-- CreateIndex
CREATE INDEX "resume_analyses_userId_idx" ON "resume_analyses"("userId");

-- CreateIndex
CREATE INDEX "resume_analyses_contentHash_idx" ON "resume_analyses"("contentHash");

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

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_states_userId_key" ON "onboarding_states"("userId");

-- CreateIndex
CREATE INDEX "guide_seen_panels_userId_idx" ON "guide_seen_panels"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_seen_panels_userId_panelId_key" ON "guide_seen_panels"("userId", "panelId");

-- CreateIndex
CREATE INDEX "evidence_items_userId_idx" ON "evidence_items"("userId");

-- CreateIndex
CREATE INDEX "evidence_items_relatedSkill_idx" ON "evidence_items"("relatedSkill");

-- CreateIndex
CREATE INDEX "truth_check_results_userId_idx" ON "truth_check_results"("userId");

-- CreateIndex
CREATE INDEX "truth_check_results_targetType_targetId_idx" ON "truth_check_results"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "role_fit_results_userId_idx" ON "role_fit_results"("userId");

-- CreateIndex
CREATE INDEX "sprint_plans_userId_idx" ON "sprint_plans"("userId");

-- CreateIndex
CREATE INDEX "sprint_tasks_planId_idx" ON "sprint_tasks"("planId");

-- CreateIndex
CREATE INDEX "sprint_tasks_status_idx" ON "sprint_tasks"("status");

-- CreateIndex
CREATE INDEX "application_packs_userId_idx" ON "application_packs"("userId");

-- CreateIndex
CREATE INDEX "application_packs_jobId_idx" ON "application_packs"("jobId");

-- CreateIndex
CREATE INDEX "interview_prep_kits_userId_idx" ON "interview_prep_kits"("userId");

-- CreateIndex
CREATE INDEX "interview_prep_kits_jobId_idx" ON "interview_prep_kits"("jobId");

-- CreateIndex
CREATE INDEX "interview_prep_kits_activeRoadmapVersionId_idx" ON "interview_prep_kits"("activeRoadmapVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "career_roadmaps_slug_key" ON "career_roadmaps"("slug");

-- CreateIndex
CREATE INDEX "career_roadmaps_domain_idx" ON "career_roadmaps"("domain");

-- CreateIndex
CREATE INDEX "career_roadmaps_isPublished_idx" ON "career_roadmaps"("isPublished");

-- CreateIndex
CREATE INDEX "roadmap_versions_roadmapId_status_idx" ON "roadmap_versions"("roadmapId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_versions_roadmapId_versionNumber_key" ON "roadmap_versions"("roadmapId", "versionNumber");

-- CreateIndex
CREATE INDEX "roadmap_phases_versionId_orderIndex_idx" ON "roadmap_phases"("versionId", "orderIndex");

-- CreateIndex
CREATE INDEX "roadmap_topics_phaseId_orderIndex_idx" ON "roadmap_topics"("phaseId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_topics_phaseId_slug_key" ON "roadmap_topics"("phaseId", "slug");

-- CreateIndex
CREATE INDEX "roadmap_prerequisites_prerequisiteTopicId_idx" ON "roadmap_prerequisites"("prerequisiteTopicId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_prerequisites_topicId_prerequisiteTopicId_key" ON "roadmap_prerequisites"("topicId", "prerequisiteTopicId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_resources_url_key" ON "learning_resources"("url");

-- CreateIndex
CREATE INDEX "learning_resources_domain_verificationStatus_idx" ON "learning_resources"("domain", "verificationStatus");

-- CreateIndex
CREATE INDEX "learning_resources_accessClassification_idx" ON "learning_resources"("accessClassification");

-- CreateIndex
CREATE INDEX "topic_resources_topicId_recommendedOrder_idx" ON "topic_resources"("topicId", "recommendedOrder");

-- CreateIndex
CREATE UNIQUE INDEX "topic_resources_topicId_resourceId_key" ON "topic_resources"("topicId", "resourceId");

-- CreateIndex
CREATE INDEX "resource_verification_logs_resourceId_checkedAt_idx" ON "resource_verification_logs"("resourceId", "checkedAt");

-- CreateIndex
CREATE INDEX "student_roadmap_progress_userId_kitId_idx" ON "student_roadmap_progress"("userId", "kitId");

-- CreateIndex
CREATE UNIQUE INDEX "student_roadmap_progress_userId_kitId_topicId_key" ON "student_roadmap_progress"("userId", "kitId", "topicId");

-- CreateIndex
CREATE INDEX "student_resource_progress_userId_kitId_idx" ON "student_resource_progress"("userId", "kitId");

-- CreateIndex
CREATE UNIQUE INDEX "student_resource_progress_userId_kitId_resourceId_key" ON "student_resource_progress"("userId", "kitId", "resourceId");

-- CreateIndex
CREATE INDEX "practice_exercises_topicId_idx" ON "practice_exercises"("topicId");

-- CreateIndex
CREATE INDEX "practice_exercises_phaseId_idx" ON "practice_exercises"("phaseId");

-- CreateIndex
CREATE INDEX "practice_submissions_userId_kitId_idx" ON "practice_submissions"("userId", "kitId");

-- CreateIndex
CREATE UNIQUE INDEX "practice_submissions_userId_kitId_exerciseId_key" ON "practice_submissions"("userId", "kitId", "exerciseId");

-- CreateIndex
CREATE INDEX "interview_question_records_domain_stage_idx" ON "interview_question_records"("domain", "stage");

-- CreateIndex
CREATE INDEX "interview_question_records_topicId_idx" ON "interview_question_records"("topicId");

-- CreateIndex
CREATE INDEX "mock_interview_sessions_userId_kitId_idx" ON "mock_interview_sessions"("userId", "kitId");

-- CreateIndex
CREATE INDEX "mock_interview_turns_sessionId_turnOrder_idx" ON "mock_interview_turns"("sessionId", "turnOrder");

-- CreateIndex
CREATE INDEX "study_plans_userId_kitId_idx" ON "study_plans"("userId", "kitId");

-- CreateIndex
CREATE INDEX "study_plan_tasks_studyPlanId_weekNumber_idx" ON "study_plan_tasks"("studyPlanId", "weekNumber");

-- CreateIndex
CREATE INDEX "study_plan_tasks_status_idx" ON "study_plan_tasks"("status");

-- CreateIndex
CREATE INDEX "progress_events_userId_idx" ON "progress_events"("userId");

-- CreateIndex
CREATE INDEX "progress_events_eventType_idx" ON "progress_events"("eventType");

-- CreateIndex
CREATE INDEX "progress_events_createdAt_idx" ON "progress_events"("createdAt");

-- CreateIndex
CREATE INDEX "guide_conversations_userId_idx" ON "guide_conversations"("userId");

-- CreateIndex
CREATE INDEX "guide_messages_conversationId_idx" ON "guide_messages"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plan_feature_limits_planId_featureKey_key" ON "plan_feature_limits"("planId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_planId_idx" ON "user_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "usage_records_userId_idx" ON "usage_records"("userId");

-- CreateIndex
CREATE INDEX "usage_records_featureKey_idx" ON "usage_records"("featureKey");

-- CreateIndex
CREATE INDEX "usage_records_createdAt_idx" ON "usage_records"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_eventName_idx" ON "analytics_events"("eventName");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_records" ADD CONSTRAINT "education_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_projects" ADD CONSTRAINT "student_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_experiences" ADD CONSTRAINT "student_experiences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "resume_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_documents" ADD CONSTRAINT "sop_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_profiles" ADD CONSTRAINT "linkedin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_assessments" ADD CONSTRAINT "career_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "career_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselling_requests" ADD CONSTRAINT "counselling_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_institutions" ADD CONSTRAINT "reference_institutions_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_courses" ADD CONSTRAINT "reference_courses_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_courses" ADD CONSTRAINT "reference_courses_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "reference_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_occupations" ADD CONSTRAINT "reference_occupations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_skills" ADD CONSTRAINT "reference_skills_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_job_listings" ADD CONSTRAINT "reference_job_listings_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_study_destinations" ADD CONSTRAINT "reference_study_destinations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_admission_requirements" ADD CONSTRAINT "reference_admission_requirements_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_admission_requirements" ADD CONSTRAINT "reference_admission_requirements_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "reference_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_admission_requirements" ADD CONSTRAINT "reference_admission_requirements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "reference_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_scholarships" ADD CONSTRAINT "reference_scholarships_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_goals" ADD CONSTRAINT "career_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_specializations" ADD CONSTRAINT "reference_specializations_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "reference_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_seen_panels" ADD CONSTRAINT "guide_seen_panels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "stored_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truth_check_results" ADD CONSTRAINT "truth_check_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_fit_results" ADD CONSTRAINT "role_fit_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_plans" ADD CONSTRAINT "sprint_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_tasks" ADD CONSTRAINT "sprint_tasks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "sprint_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_packs" ADD CONSTRAINT "application_packs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_prep_kits" ADD CONSTRAINT "interview_prep_kits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_versions" ADD CONSTRAINT "roadmap_versions_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "career_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_phases" ADD CONSTRAINT "roadmap_phases_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "roadmap_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_topics" ADD CONSTRAINT "roadmap_topics_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "roadmap_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_prerequisites" ADD CONSTRAINT "roadmap_prerequisites_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "roadmap_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_prerequisites" ADD CONSTRAINT "roadmap_prerequisites_prerequisiteTopicId_fkey" FOREIGN KEY ("prerequisiteTopicId") REFERENCES "roadmap_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_resources" ADD CONSTRAINT "topic_resources_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "roadmap_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_resources" ADD CONSTRAINT "topic_resources_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_verification_logs" ADD CONSTRAINT "resource_verification_logs_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_roadmap_progress" ADD CONSTRAINT "student_roadmap_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_roadmap_progress" ADD CONSTRAINT "student_roadmap_progress_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "interview_prep_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_roadmap_progress" ADD CONSTRAINT "student_roadmap_progress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "roadmap_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resource_progress" ADD CONSTRAINT "student_resource_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resource_progress" ADD CONSTRAINT "student_resource_progress_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "interview_prep_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resource_progress" ADD CONSTRAINT "student_resource_progress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_exercises" ADD CONSTRAINT "practice_exercises_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "roadmap_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_exercises" ADD CONSTRAINT "practice_exercises_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "roadmap_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_submissions" ADD CONSTRAINT "practice_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_submissions" ADD CONSTRAINT "practice_submissions_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "interview_prep_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_submissions" ADD CONSTRAINT "practice_submissions_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "practice_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_question_records" ADD CONSTRAINT "interview_question_records_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "roadmap_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interview_sessions" ADD CONSTRAINT "mock_interview_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interview_sessions" ADD CONSTRAINT "mock_interview_sessions_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "interview_prep_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interview_turns" ADD CONSTRAINT "mock_interview_turns_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "mock_interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "interview_prep_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_tasks" ADD CONSTRAINT "study_plan_tasks_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_conversations" ADD CONSTRAINT "guide_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_messages" ADD CONSTRAINT "guide_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "guide_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_feature_limits" ADD CONSTRAINT "plan_feature_limits_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
