# Interview Prep Phase 4C.1 — Database Model Design & Student Resource APIs

## 1. Existing Reconciled Database Models (Used Without Schema Changes)

Phase 4C.1 builds directly on the four normalized resource tables already present in `prisma/schema.prisma` and reconciled in PostgreSQL (`00000000000000_postgres_baseline` + `00000000000001_lockdown_public_rls_and_grants`):

- **`LearningResource` (`learning_resources`)**
  - Stores verified/curated learning resources (`id`, `url` unique, `canonicalUrl`, `title`, `provider`, `resourceType`, `description`, `difficulty`, `language`, `estimatedMinutes`, `accessClassification`, `verificationStatus`, `lastVerifiedAt`, `sourceAttribution`, `domain`).
  - Indexed by `(domain, verificationStatus)` and `(accessClassification)`.
- **`TopicResource` (`topic_resources`)**
  - Maps `RoadmapTopic` <-> `LearningResource` (`topicId`, `resourceId`, `recommendedOrder`, `whyRecommended`), unique on `(topicId, resourceId)`.
- **`ResourceVerificationLog` (`resource_verification_logs`)**
  - Audit trail of HTTP/allowlist verification checks (`resourceId`, `httpStatus`, `status`, `notes`, `checkedBy`, `checkedAt`).
- **`StudentResourceProgress` (`student_resource_progress`)**
  - Per-student, per-kit resource progress (`userId`, `kitId`, `resourceId`, `studied`, `saved`, `reportedBroken`, `notes`, `studiedAt`), unique on `(userId, kitId, resourceId)`.

## 2. Security & Ownership Architecture

- **Database posture**: All four tables have PostgreSQL RLS enabled (`relrowsecurity = true`) with zero `anon`/`authenticated`/`PUBLIC` privileges; all queries run server-side via `service_role` (`getSupabaseAdmin` / `db-proxy`) or `postgres` (`PrismaClient`).
- **API authorization**:
  - Every request requires an authenticated `ace_session` (`getSession(req)`).
  - Kit ownership is enforced via `requireOwnedKit(kitId, session.userId)` before reading or mutating `StudentResourceProgress`.
  - Domain isolation is enforced via `resolveSupportedDomain(kit.domain)` — legacy kits without a valid domain return an empty catalogue rather than falling back to CS/IT.

## 3. Student-Facing Resource APIs (Phase 4C.1)

- **`GET /api/interview-prep/[id]/resources`**
  - Query params: `search`, `format`, `access`, `savedOnly`, `studiedOnly`.
  - Returns domain-matched resources (DB-backed rows when present, merged cleanly with curated fallback entries) enriched with the student's `StudentResourceProgress` for that kit.
- **`PATCH /api/interview-prep/[id]/resources/progress`**
  - Body: `{ resourceId, studied?, saved?, reportedBroken?, notes? }`.
  - Validates ownership, validates `resourceId` against DB/curated registry (ensuring `LearningResource` persistence for FK integrity), and upserts `StudentResourceProgress`.

## 4. Planned Phase 4C.2 Extensions (Deferred Until Migration/Recovery Review)

Phase 4C.2 (admin review queue + discovery persistence) will add dedicated admin-workflow columns (`reviewStatus`, `discoverySource`, `certificateAvailable`, `license`, `subtopicsJson`) in a reviewed PostgreSQL migration.

## 5. Canonical URL Uniqueness Audit & Migration Proposal (Phase 4C.2+)

- **Live Production Audit (`learning_resources`)**: `0` rows, `0` non-null `canonicalUrl` values, `0` empty strings, `0` duplicates.
- **Prisma 6.19.3 vs PostgreSQL**:
  - `canonicalUrl String? @unique` in `prisma/schema.prisma` generates `CREATE UNIQUE INDEX "learning_resources_canonicalUrl_key" ON "public"."learning_resources"("canonicalUrl");`.
  - PostgreSQL treats `NULL`s as distinct by default, so multiple `NULL` rows remain allowed while duplicate non-null canonical URLs are rejected at the DB level, with zero `prisma migrate diff` drift.
  - Proposed migration SQL (not yet applied to production):
    ```sql
    CREATE UNIQUE INDEX "learning_resources_canonicalUrl_key"
    ON "public"."learning_resources"("canonicalUrl");
    ```
