# CareerEdge Interview Prep 2.0 — Phase 2 Data Architecture & Rollback Guide

**Date:** 2026-11-26  
**Phase:** 2 — Product Architecture & Data Foundation

---

## 1. Normalized Database Models Added

All models are defined in `prisma/schema.prisma`, synced to Supabase PostgreSQL, and registered in `src/lib/supabase/db-proxy.ts` (`MODEL_TO_TABLE`, `TABLES_WITH_UPDATED_AT`, `RELATION_MAP`) for Cloudflare Workers HTTPS PostgREST compatibility.

### 1.1 Shared Roadmap & Content Models (Reusable Across Students)
- **`CareerRoadmap`** (`career_roadmaps`): Role/domain roadmap container (`slug` unique, `domain`, `roleTitle`, `isPublished`).
- **`RoadmapVersion`** (`roadmap_versions`): Versioned snapshots (`DRAFT`, `PUBLISHED`, `ARCHIVED`) with unique `(roadmapId, versionNumber)`.
- **`RoadmapPhase`** (`roadmap_phases`): Ordered learning phases per version.
- **`RoadmapTopic`** (`roadmap_topics`): Ordered topics with `overview`, `whyItMatters`, `difficulty`, `priority`, `estimatedMinutes`, and structured JSON arrays (`subtopicsJson`, `learningOutcomesJson`, `completionCriteriaJson`, `practicePromptsJson`).
- **`RoadmapPrerequisite`** (`roadmap_prerequisites`): Directed prerequisite edges (`topicId` → `prerequisiteTopicId`).
- **`LearningResource`** (`learning_resources`): Curated/discovered resources with `accessClassification` (`COMPLETELY_FREE`, `FREE_WITH_PAID_CERT`, `FREEMIUM`, `FREE_ACCOUNT_REQUIRED`, `PAID`, `UNVERIFIED`), `verificationStatus` (`DRAFT`, `PENDING_REVIEW`, `VERIFIED`, `NEEDS_RECHECK`, `BROKEN`, `ARCHIVED`), `lastVerifiedAt`, and `sourceAttribution`.
- **`TopicResource`** (`topic_resources`): Ordered many-to-many link between topics and resources with `whyRecommended`.
- **`ResourceVerificationLog`** (`resource_verification_logs`): Audit trail of HTTP/link checks.
- **`PracticeExercise`** (`practice_exercises`): Practical projects/exercises linked to `topicId` / `phaseId`.
- **`InterviewQuestionRecord`** (`interview_question_records`): Normalized, topic-linked question bank records.

### 1.2 Student-Specific Models (Strictly Scoped by `userId` & `kitId`)
- **`InterviewPrepKit`** (`interview_prep_kits`): Extended with `activeRoadmapVersionId` (all existing rows preserved).
- **`StudentRoadmapProgress`** (`student_roadmap_progress`): Per-student, per-kit, per-topic status (`NOT_STARTED`, `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`, `NEEDS_REVISION`), `bookmarked`, `notes`, `completedAt`.
- **`StudentResourceProgress`** (`student_resource_progress`): Per-student, per-kit, per-resource `studied`, `saved`, `reportedBroken`, `notes`.
- **`PracticeSubmission`** (`practice_submissions`): Student exercise completion + optional student-approved `evidenceItemId` link.
- **`MockInterviewSession`** (`mock_interview_sessions`) & **`MockInterviewTurn`** (`mock_interview_turns`): One-question-at-a-time practice sessions & structured feedback (explicitly labeled as CareerEdge practice assessment).
- **`StudyPlan`** (`study_plans`) & **`StudyPlanTask`** (`study_plan_tasks`): Weekly/daily reschedulable study plans.

---

## 2. Ownership & Authorization Enforcement

Implemented in `src/lib/interview/ownership.ts`:
- `requireOwnedKit(kitId, userId)`
- `requireOwnedMockSession(sessionId, userId)`
- `requireOwnedStudyPlan(planId, userId)`

All student-specific records cascade on user/kit deletion (`onDelete: Cascade`) and enforce `userId` scoping on every read/write.

---

## 3. Rollback Guidance (If Needed)

Because Phase 2 only added new tables and a single nullable column (`activeRoadmapVersionId`) on `interview_prep_kits`, rolling back Phase 2 without affecting Phase 1 or existing kits requires only:

```sql
ALTER TABLE "interview_prep_kits" DROP COLUMN IF EXISTS "activeRoadmapVersionId";
DROP TABLE IF EXISTS "study_plan_tasks", "study_plans", "mock_interview_turns", "mock_interview_sessions",
  "interview_question_records", "practice_submissions", "practice_exercises",
  "student_resource_progress", "student_roadmap_progress", "resource_verification_logs",
  "topic_resources", "learning_resources", "roadmap_prerequisites", "roadmap_topics",
  "roadmap_phases", "roadmap_versions", "career_roadmaps";
```
