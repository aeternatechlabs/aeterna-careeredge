# CareerEdge Interview Prep 2.0 — Phase 1 Audit & Architecture Proposal

**Date:** 2026-11-26  
**Repository:** `aeterna-careeredge`  
**Git Branch:** `main` (`git status --short` clean at audit start)  
**Scope:** Phase 1 Read-Only Audit (no production code modified)

---

## 1. Executive Summary

The existing `/interview-prep` module is a lightweight, MVP question-bank viewer backed by a single Prisma table (`InterviewPrepKit`) and static domain templates in `src/lib/interview/service.ts`. While it demonstrates the core CareerEdge differentiator—linking interview questions to **STAR frameworks** and **Evidence Vault (Proof Bank)** citations—it lacks:

- Guided multi-step intake (currently only 3 fields: Role, Company, Domain).
- Career Passport prefill, job description analysis, skill-gap detection, and study preferences.
- Interactive multi-domain career roadmaps, phases, topics, subtopics, and progress tracking.
- Curated / discovered free learning resources with access classification and link verification.
- Practical exercises & projects, AI mock interviews with feedback, and personalized study plans.

Additionally, the code audit uncovered **runtime compatibility bugs** on Cloudflare Workers (calling `.toISOString()` on Supabase PostgREST string timestamps) and missing entitlement/quota wiring.

---

## 2. What Currently Exists (Verified in Codebase)

### 2.1 Pages & UI Components
| File | Role | Notes |
|---|---|---|
| `src/app/interview-prep/page.tsx` | Server Component entry | Reads `getSession()`, loads `listUserInterviewKits()` and first kit's `themesJson`, renders `InterviewPrepClient`. Missing `export const dynamic = "force-dynamic"`. |
| `src/app/interview-prep/interview-prep-client.tsx` | Client workspace (487 lines) | Left column: Kit selector list. Right column: Active kit themes & expandable question cards (Evaluator Context, STAR Framework with copy button, Proof Bank citation advice, Key Talking Points). Includes a 3-field "Create Interview Prep Kit" modal. Uses `StudentLayout` and `HowItWorksPanel`. |

### 2.2 API Routes
| Endpoint | Methods | Notes |
|---|---|---|
| `src/app/api/interview-prep/route.ts` | `GET`, `POST` | `GET` lists user's kits via `listUserInterviewKits(session.userId)`. `POST` calls `getOrCreateInterviewKit(session.userId, { jobId, jobTitle, companyName, domain })`. Both enforce `getSession(req)`. |
| `src/app/api/interview-prep/[id]/route.ts` | `GET` | Fetches single kit with `where: { id, userId: session.userId }`. Parses `themesJson`. |

### 2.3 Business Logic & Data
| File | Role | Notes |
|---|---|---|
| `src/lib/interview/service.ts` | Kit service (284 lines) | Defines `InterviewQuestion`, `InterviewPrepTheme`, `PreparedInterviewKit`. Contains hardcoded `DOMAIN_QUESTION_TEMPLATES` for 6 keys: `HEALTHCARE`, `TEACHING`, `COMMERCE`, `TECH`, `LAW`, `DESIGN` (1–2 questions each). `getOrCreateInterviewKit` dedupes by `(userId, jobId)`, creates `InterviewPrepKit`, and logs `READINESS_REPORT_GENERATED` via `trackProgressEvent`. |
| `prisma/schema.prisma` (`InterviewPrepKit`, lines 1082–1099) | DB model | Fields: `id`, `userId`, `jobId`, `jobTitle`, `companyName?`, `themesJson`, `aiOperationId?`, `createdAt`, `updatedAt`. Indexed on `userId` and `jobId`. Mapped to `interview_prep_kits`. |

### 2.4 Related Platform Modules (Available for Integration)
- **Career Passport:** `src/lib/passport/service.ts` (`getStudentPassport(userId)` returns `StudentPassportSnapshot` with profile, normalized educations, skills, projects, experiences, achievements), `src/lib/passport/deduplication.ts`, `src/types/passport.ts`, `src/app/api/passport/**`.
- **Evidence Vault / Proof Bank:** `src/lib/evidence/service.ts` (`getEvidenceItems(userId)`, `createEvidenceItem`), `EvidenceItem` model in `prisma/schema.prisma` (types: `CERTIFICATE`, `PROJECT_LINK`, `INTERNSHIP_LETTER`, `MARK_SHEET`, `CLINICAL_LOG`, `LESSON_PLAN`, `MOOT_COURT`, `PORTFOLIO`, `GITHUB_REPO`, `AWARD`, `OTHER`).
- **Multi-Domain Taxonomy:** `src/lib/constants/domains.ts` (`ACADEMIC_DOMAINS` — 17 domains, `DOMAIN_DETAILS`, `UNIVERSAL_SKILLS`, `GRADING_SYSTEMS`).
- **AI Provider & Guardrails:** `src/lib/ai/provider.ts` (`ServerAiService` with `FAST`/`QUALITY` tiers, 15-min in-memory cache, token/cost tracking, `recordUsage`), `src/lib/ai/types.ts` (already includes `AiOperationCategory = "INTERVIEW_PREP"`), `src/lib/ai/guardrails.ts` (`STRICT_ACCURACY_SYSTEM_INSTRUCTION`, `sanitizeContextForAi`).
- **Monetization & Entitlements:** `src/lib/monetization/plans.ts` & `entitlements.ts` (`checkEntitlement`, `recordUsage`). Note: `INTERVIEW_PREP` quota is currently defined on `PREMIUM` (20/mo) and `PLACEMENT_PASS` (50/mo), and omitted on `FREE`.
- **Sprints & Progress:** `src/lib/sprints/service.ts` (`SprintPlan`, `SprintTask` with `linkedGapType`), `src/lib/guidance/progress.ts` (`ProgressEvent` tracking).
- **Database Edge Layer:** `src/lib/db.ts` + `src/lib/supabase/db-proxy.ts` (routes `db.<model>.<method>` over HTTPS to Supabase PostgREST on Cloudflare Workers).
- **Theme & Layout:** `src/app/globals.css` (Warm Ivory `#FFF8F0`, Deep Crimson `#7A0F1F`, Royal Gold `#F2B63D`, Plus Jakarta Sans / Inter / Noto Sans Kannada), `src/components/layouts/student-layout.tsx`, `src/components/navigation/student-sidebar.tsx`.

---

## 3. What Works vs. What Is Incomplete or Broken

### 3.1 What Works
- Session authentication (`getSession(req)` on API routes, `getSession()` in `page.tsx`) and user-scoped ownership checks (`where: { id, userId }`).
- Listing and viewing existing kits, expanding question cards, copying STAR frameworks.
- `HowItWorksPanel` integration (`toolKey="interview-prep-kit"`).
- URL query-param pre-opening of the Create Kit modal (`?jobTitle=...&company=...&domain=...`) used by other modules (e.g., Role-Fit / Jobs).

### 3.2 Bugs Found in Existing Code
1. **Cloudflare Workers `Date.toISOString()` Runtime Crash:**  
   `src/app/interview-prep/page.tsx:42`, `src/app/api/interview-prep/[id]/route.ts:39`, and `src/lib/interview/service.ts:215, 249, 271` call `.toISOString()` on `kit.createdAt`. When `db` routes through `db-proxy.ts` (Supabase PostgREST), timestamps are returned as ISO `string`s, not `Date` objects—causing a `TypeError: createdAt.toISOString is not a function` at runtime on Cloudflare Workers.
2. **Missing `export const dynamic = "force-dynamic"`:**  
   `src/app/interview-prep/page.tsx` does not export `dynamic = "force-dynamic"`.

### 3.3 What Is Incomplete
- **Intake:** Only 3 fields (`jobTitle`, `companyName`, `domain`). No Career Passport import toggle, no job description/URL analysis, no goals, skill level, study timeline, or learning/language/free-resource preferences.
- **Domain Coverage:** Hardcoded 6-domain template dictionary with only 1–2 static questions per domain; non-matching domains silently fall back to `TECH` (violating multi-domain accuracy).
- **No Roadmap / Topics / Resources / Exercises:** No phases, roadmap nodes, prerequisite graph, subtopics, free external resources, verification status, or topic-level progress.
- **No Interactive Practice / Mock Interviews / Feedback:** No answer submission, no one-at-a-time mock interview session, no AI evaluation, no skill-gap breakdown, no personalized weekly study plan.
- **No Actual Evidence Vault Matching:** `proofBankCitationAdvice` is generic static text, not matched against the student's actual `EvidenceItem` records.
- **No AI or Entitlement Integration:** `ServerAiService` and `checkEntitlement` are not wired into Interview Prep yet.

---

## 4. Reusability & Extension Plan

### 4.1 Reusable Components & Services
- **Keep & Wrap:** `StudentLayout`, `HowItWorksPanel`, `ACADEMIC_DOMAINS` / `DOMAIN_DETAILS` (`src/lib/constants/domains.ts`).
- **Reuse Directly:** `getStudentPassport(userId)`, `getEvidenceItems(userId)`, `ServerAiService`, `STRICT_ACCURACY_SYSTEM_INSTRUCTION`, `sanitizeContextForAi`, `checkEntitlement`, `recordUsage`, `trackProgressEvent`, `generate30DaySprint` / `SprintPlan`.

### 4.2 APIs to Extend (Backward-Compatible)
- `GET /api/interview-prep` — keep returning `{ kits }` with summary counts, extended with kit domain/level/progress summary.
- `POST /api/interview-prep` — continue supporting `{ jobId, jobTitle, companyName, domain }` for callers like `/jobs`, while accepting the full multi-step intake payload (`preferences`, `usePassport`, `jobDescription`, `goals`, `skillLevel`, `timeline`, `learningPreferences`).
- `GET /api/interview-prep/[id]` — preserve `{ id, jobId, jobTitle, companyName, themes, createdAt }` and add `preferences`, `roadmap`, `skillGap`, `studyPlan`, `progress`.

### 4.3 New API Endpoints Needed (Phased)
- `/api/interview-prep/[id]/roadmap` (nodes, topic details, progress updates, notes)
- `/api/interview-prep/[id]/resources` (curated/discovered resources, bookmark/studied, broken-link report)
- `/api/interview-prep/[id]/exercises` (practical exercises, completion, optional Passport/Evidence link)
- `/api/interview-prep/[id]/practice` & `/api/interview-prep/[id]/mock-interview` (sessions, turns, AI feedback)
- `/api/interview-prep/[id]/study-plan` & `/api/interview-prep/[id]/skill-gap`
- `/api/admin/interview-prep/resources` (admin review & link verification workflow)

---

## 5. Proposed Normalized Data Architecture

All new models will be added to `prisma/schema.prisma`, migrated safely to Supabase Postgres without modifying or deleting existing `interview_prep_kits` rows, **and registered in `src/lib/supabase/db-proxy.ts`** (`MODEL_TO_TABLE`, `TABLES_WITH_UPDATED_AT`, `RELATION_MAP`) so Cloudflare Workers works seamlessly.

### 5.1 Core Extensions & New Models
1. **Extend `InterviewPrepKit`** (additive nullable/defaulted columns only):
   - `domain`, `targetRole`, `experienceLevel`, `status`, `activeRoadmapVersionId?`, `metadataJson?`
2. **`InterviewPrepPreference`** (1:1 with `InterviewPrepKit`):
   - `useCareerPassport`, `jobDescriptionText`, `jobPostingUrl`, `goalsJson`, `selfAssessedLevel`, `expectedInterviewDate`, `dailyMinutes`, `weeklyDays`, `preferredLanguage`, `preferredFormatsJson`, `resourceCostMode` (`FREE_ONLY` default), `interviewFocusJson`, `intakeSnapshotJson`.
3. **Reusable Roadmap Content (Shared Templates + Versioning)**:
   - `CareerRoadmap` (`slug`, `domain`, `roleTitle`, `isPublished`)
   - `RoadmapVersion` (`roadmapId`, `versionNumber`, `status`: `DRAFT | PUBLISHED | ARCHIVED`, `publishedAt`)
   - `RoadmapPhase` (`versionId`, `orderIndex`, `title`, `description`, `estimatedHours`)
   - `RoadmapTopic` (`phaseId`, `slug`, `title`, `overview`, `whyItMatters`, `difficulty`, `priority`: `ESSENTIAL | RECOMMENDED | OPTIONAL`, `estimatedMinutes`, `subtopicsJson`, `learningOutcomesJson`, `completionCriteriaJson`, `practicePromptsJson`)
   - `RoadmapPrerequisite` (`topicId`, `prerequisiteTopicId`)
4. **Free Learning Resources & Governance**:
   - `LearningResource` (`url` unique, `canonicalUrl`, `title`, `provider`, `resourceType`, `description`, `difficulty`, `language`, `estimatedMinutes?`, `accessClassification`: `COMPLETELY_FREE | FREE_WITH_PAID_CERT | FREEMIUM | FREE_ACCOUNT_REQUIRED | PAID | UNVERIFIED`, `verificationStatus`: `DRAFT | PENDING_REVIEW | VERIFIED | NEEDS_RECHECK | BROKEN | ARCHIVED`, `lastVerifiedAt?`, `sourceAttribution`, `domain`)
   - `TopicResource` (`topicId`, `resourceId`, `recommendedOrder`, `whyRecommended`)
   - `ResourceVerificationLog` (`resourceId`, `httpStatus?`, `checkedAt`, `notes`, `checkedBy`)
5. **Student-Specific Progress, Notes, Exercises & Practice** (all strictly `userId`-scoped):
   - `StudentRoadmapProgress` (`userId`, `kitId`, `topicId`, `status`: `NOT_STARTED | AVAILABLE | IN_PROGRESS | COMPLETED | NEEDS_REVISION`, `bookmarked`, `notes`, `completedAt?`)
   - `StudentResourceProgress` (`userId`, `kitId`, `resourceId`, `studied`, `saved`, `notes`, `reportedBroken`)
   - `PracticeExercise` & `PracticeSubmission` (linked to `topicId` / `phaseId`, user completion checklist, optional user-approved link to `EvidenceItem`)
   - `InterviewQuestion` (reusable + kit-linked, `domain`, `role`, `topicId?`, `stage`, `questionType`, `difficulty`, `evaluatorFocus`, `responseFramework`, `commonMistakesJson`, `followUpsJson`)
   - `MockInterviewSession` & `MockInterviewTurn` (configuration, one-question-at-a-time history, AI rubric feedback clearly labeled as CareerEdge practice assessment)
   - `StudyPlan` & `StudyPlanTask` (per kit, weekly/daily schedule, reschedulable/deferrable)

---

## 6. Potential Conflicts & Technical Limitations

1. **Cloudflare Workers + Supabase PostgREST (`db-proxy.ts`):**  
   - `db-proxy.ts` only supports models listed in `MODEL_TO_TABLE`, `TABLES_WITH_UPDATED_AT`, and `RELATION_MAP`. Every new model MUST be registered there and every timestamp read must safely handle ISO strings (`typeof v === "string" ? v : v.toISOString()`).
   - Avoid deep nested multi-hop includes (`include` inside `include` more than 1–2 levels) where possible; prefer explicit indexed queries for pagination and low latency on CF Workers.
2. **Cloudflare Workers Request Timeouts & AI Quotas:**  
   - Do NOT generate an entire 10-phase roadmap + 50 resources + 30 questions in a single synchronous AI call. Use published/curated roadmap templates (`CareerRoadmap`) personalized quickly against Passport + JD, and generate/cache topic explanations or mock turns incrementally.
3. **External Resource Discovery & SSRF Safety:**  
   - Brave Search API, YouTube Data API, and Firecrawl/Tavily require server-side API keys (not currently configured in `.env`). Discovery must be cached, rate-limited, SSRF-safe (block private IPs/localhost, allow `https:` only), and unreviewed AI/search results must remain `PENDING_REVIEW` until verified.
4. **Entitlements & Existing Tests:**  
   - `PLANS.FREE.quotas` currently has no `INTERVIEW_PREP` entry. We should define clear free starter limits (e.g., starter roadmap + practice) vs. Pro mock-interview/AI quotas without breaking existing `/pricing` or `scripts/test-day2-phase6-7.js` (`InterviewPrepKit` CRUD tests).
5. **Existing Decommissioned Pages:**  
   - `/progress`, `/passport`, `/evidence-vault` redirect to `/dashboard` (where Passport & Evidence Vault live as tabs). All Interview Prep links to Evidence Vault / Passport should route cleanly to `/dashboard` tabs or inline drawers.

---

## 7. Phased Implementation Roadmap (Awaiting Approval)

- **Phase 1 (Complete):** Audit & Architecture Proposal (`docs/interview-prep-audit.md`) — **STOP FOR APPROVAL**.
- **Phase 2:** Database schema extensions, Supabase migration, `db-proxy.ts` registration, ownership helpers, and backward-compatible timestamp fix.
- **Phase 3:** Guided 7-step Create Interview Prep Kit wizard with Career Passport prefill, optional JD parsing, goals, skill level, timeline, preferences, and review screen.
- **Phase 4:** Multi-domain Roadmap Engine + complete published **Full Stack Developer** roadmap template (phases, topics, subtopics, prerequisites, outcomes, exercises, node progress).
- **Phase 5:** Free Learning Resource Catalogue, access classifications, verification pipeline, and Admin Review workflow (plus provider-ready discovery adapters for Brave/YouTube/extractor when keys are configured).
- **Phase 6:** Interactive Roadmap UI (roadmap.sh-inspired connected phase/node canvas, topic detail drawer, search/filters, desktop/tablet/mobile responsive design in Warm Ivory/Crimson/Gold).
- **Phase 7:** Extended Question Bank, Proof Bank evidence-aware answer builder, and STAR practice mode.
- **Phase 8:** AI Mock Interviewer (one-question-at-a-time, follow-ups, structured practice feedback, session history).
- **Phase 9:** Personalized Study Plan, Skill Gap Analysis, and Progress/Sprint integration.
- **Phase 10:** Multi-domain expansion (representative templates for Healthcare/Nursing, Commerce/Accounting, Law, Design/UX, Teaching) + Content Admin UI.
- **Phase 11:** Full E2E, ownership, truthfulness, responsiveness, TypeScript, lint, and build verification.
