# CareerEdge — Phase 4C.2 Refined Admin Resource Review Architecture & Schema Design

**Status:** Refined Architecture Design (Read-Only Deliverable — Not Implemented Yet)

---

## 1. Separate Status State Machines

Review lifecycle and verification lifecycle are strictly independent:

### 1.1 Review Lifecycle (`reviewStatus`)
- States: `DISCOVERED`, `PENDING_REVIEW`, `APPROVED`, `PUBLISHED`, `REJECTED`, `ARCHIVED`
- Allowed transitions:
  - `DISCOVERED` -> `PENDING_REVIEW`, `REJECTED`, `ARCHIVED`
  - `PENDING_REVIEW` -> `APPROVED`, `REJECTED`, `ARCHIVED`
  - `APPROVED` -> `PUBLISHED`, `PENDING_REVIEW`, `REJECTED`, `ARCHIVED`
  - `PUBLISHED` -> `APPROVED` (unpublish to staged), `ARCHIVED`
  - `REJECTED` -> `PENDING_REVIEW`, `ARCHIVED`
  - `ARCHIVED` -> `PENDING_REVIEW`
- **Student visibility rule**: Only resources with `reviewStatus === "PUBLISHED"` (and conservative verification handling below) may appear in the student-facing catalogue.
- **Student broken-link reports**: Increment/flag `StudentResourceProgress.reportedBroken` for admin triage (`brokenReportCount` in the admin queue), **never** automatically reversing `reviewStatus` from `PUBLISHED` or `APPROVED`.

### 1.2 Verification Lifecycle (`verificationStatus` from `src/lib/interview/resources/types.ts`)
- States: `PENDING_REVIEW`, `VERIFIED`, `NEEDS_RECHECK`, `UNAVAILABLE`, `INCONCLUSIVE`
- Driven exclusively by `verifyResourceUrl()` (`src/lib/interview/resources/verifier.ts`) + `ResourceVerificationLog`.
- **Conservative student handling**:
  - `VERIFIED`: eligible for student display when `reviewStatus === "PUBLISHED"`.
  - `PENDING_REVIEW` / `NEEDS_RECHECK` / `INCONCLUSIVE`: eligible only if `reviewStatus === "PUBLISHED"` AND explicitly curated/approved by an admin (displayed with `"Live link check pending"` or last checked date).
  - `UNAVAILABLE`: hidden from the student-facing curated catalogue (even if `reviewStatus === "PUBLISHED"`) and surfaced in the admin Broken/Unavailable triage queue.

---

## 2. Role-Permission Matrix & Admin Authorization

Uses a dedicated `AdminMember` table (`admin_members`) + server-side `requireAdmin(req, allowedRoles)` checking the database on every request (never trusting JWT claims alone, failing closed on DB errors, returning `401` unauthenticated and `403` for non-admin/inactive/revoked accounts):

| Action / Endpoint | `SUPER_ADMIN` | `CONTENT_REVIEWER` | `MODERATOR` |
| :--- | :---: | :---: | :---: |
| View admin queue, detail, logs (`GET`) | Yes | Yes | Yes |
| Create/import candidate (`POST /resources`) | Yes | Yes | No |
| Edit metadata & topic links (`PATCH /resources/[id]`) | Yes | Yes | Yes |
| Approve / Reject (`PATCH /resources/[id]`) | Yes | Yes | Yes |
| Trigger URL verification (`POST .../verify`) | Yes | Yes | Yes |
| Publish / Unpublish / Archive (`POST .../publish`, `PATCH`) | Yes | Yes | No |
| Manage `AdminMember` roles / revocations | Yes | No | No |

---

## 3. Admin Bootstrap Plan
- **No self-service admin registration** and **no public role-elevation APIs** (an admin cannot grant themselves higher roles via public routes).
- **First admin bootstrap**: Performed exclusively by a trusted operator via an offline SQL/CLI script (using `DIRECT_URL` / `postgres` role) inserting the initial `SUPER_ADMIN` row in `admin_members` for an existing verified `users.id`, recorded in `admin_audit_logs`.
- **Subsequent admins & revocation**: Managed only by an active `SUPER_ADMIN` (revocation sets `isActive = false` and `revokedAt = now()` + writes `AdminAuditLog`).

---

## 4. Atomic Audit Architecture
- **Finding in `src/lib/supabase/db-proxy.ts`**: The current Cloudflare/PostgREST proxy does **not** implement `$transaction`; two sequential REST calls (`update` + `insert`) are **not** atomic.
- **Required solution**:
  - On Node.js (`PrismaClient`): wrap resource mutation + `AdminAuditLog.create` in `prisma.$transaction(...)`.
  - On Cloudflare Workers (HTTPS PostgREST): execute resource mutation + `AdminAuditLog` insert inside a single `SECURITY DEFINER` PostgreSQL RPC function (e.g., `admin_mutate_learning_resource(...)`) called via `supabase.rpc(...)` (`REVOKE ALL ON FUNCTION ... FROM anon, authenticated, PUBLIC; GRANT EXECUTE ... TO service_role;`).
  - If the audit insert fails, the entire PostgreSQL transaction rolls back—never silently applying an unaudited admin mutation.
- **Data minimization**: Store only `actorUserId`, `action`, `targetType`, `targetId`, `reason`, and minimal changed-field diffs (`beforeJson`/`afterJson`); never store secrets or student PII.

---

## 5. CSRF & Request-Security Strategy
- `ace_session` uses `SameSite=Lax` (`src/lib/session.ts`).
- All state-changing admin routes (`POST`, `PATCH`, `DELETE`) enforce:
  1. **Origin / Referer validation**: Reject requests where `Origin` (or `Referer` origin) does not match the configured app origin (`NEXT_PUBLIC_APP_URL` / request `Host`) with `403`.
  2. **Content-Type check**: Require `application/json` on JSON mutations.
  3. **Strict schema validation** + explicit state-transition validation (`409` on invalid transition).
  4. **Allowlist & rate limits**: `POST .../verify` strictly uses `verifyResourceUrl()` with `getApprovedVerificationHostnames()` (no arbitrary URL fetching) and per-admin rate limiting.

---

## 6. Current Curated Registry Count & Publishing Criteria
- Verified live count of `CURATED_RESOURCE_REGISTRY` (`src/lib/interview/resources/registry.ts`): **37 entries** (reconciled; earlier Phase 4C.2 draft incorrectly stated 34).
- Current breakdown in code:
  - `reviewStatus`: `37` `PUBLISHED`
  - `verificationStatus`: `37` `PENDING_REVIEW`
  - `accessClassification`: `31` `COMPLETELY_FREE`, `3` `FREE_WITH_PAID_CERT`, `1` `FREEMIUM`, `1` `FREE_ACCOUNT_REQUIRED`, `1` `UNVERIFIED`
- **Safe publishing criteria**: Seeding `CURATED_RESOURCE_REGISTRY` into `learning_resources` must **not** blindly mark all 37 as `PUBLISHED` without preserving their `verificationStatus` (`PENDING_REVIEW` until live-verified). Only entries with `reviewStatus = "APPROVED"` and non-`UNAVAILABLE` verification may transition to `PUBLISHED` (and `"UNVERIFIED"` access classification blocks publishing until classified).

---

## 7. Exact Additive Schema Proposal (Not Yet Implemented)
- **`LearningResource` (`learning_resources`)**:
  - `canonicalUrl String? @unique` (confirmed 0 production rows / 0 duplicates; PostgreSQL allows multiple `NULL`s)
  - `reviewStatus String @default("PENDING_REVIEW")`
  - `discoverySource String @default("MANUAL_CURATED")`
  - `certificateAvailable String @default("UNKNOWN")`
  - `license String?`, `accessRequirements String?`, `sourceCategory String?`
  - `isCurated Boolean @default(false)`, `subtopicsJson String?`
  - `reviewedById String?`, `reviewedAt DateTime?`, `rejectionReason String?`
  - `@@index([domain, reviewStatus, verificationStatus])`
- **`AdminMember` (`admin_members`)**:
  - `id String @id @default(cuid())`, `userId String @unique` (FK -> `users.id` `onDelete: Cascade`), `role String`, `isActive Boolean @default(true)`, `grantedById String?`, `grantedAt DateTime @default(now())`, `revokedAt DateTime?`
- **`AdminAuditLog` (`admin_audit_logs`)**:
  - `id String @id @default(cuid())`, `actorUserId String` (FK -> `users.id` `onDelete: Restrict`), `action String`, `targetType String`, `targetId String`, `reason String?`, `metadataJson String?`, `createdAt DateTime @default(now())`
  - `@@index([targetType, targetId])`, `@@index([actorUserId, createdAt])`
- **Security**: All new tables and RPC functions must have RLS enabled (`ENABLE ROW LEVEL SECURITY` without `FORCE`), zero `anon`/`authenticated`/`PUBLIC` privileges, and preserved `service_role`/`postgres` access in a reviewed Prisma migration.

---

## 8. Admin API Contracts
- `GET /api/admin/interview-prep/resources` — Queue + `pendingCount`, filters (`reviewStatus`, `verificationStatus`, `domain`, `access`, `search`, pagination).
- `POST /api/admin/interview-prep/resources` — Create/import candidate (`409` on duplicate `url`/`canonicalUrl`, always `PENDING_REVIEW`).
- `GET /api/admin/interview-prep/resources/[id]` — Detail + `TopicResource` links + `ResourceVerificationLog`s + broken report count + `AdminAuditLog`s.
- `PATCH /api/admin/interview-prep/resources/[id]` — Edit metadata/topics or transition `reviewStatus` (atomic audit log, `rejectionReason` required for `REJECTED`).
- `POST /api/admin/interview-prep/resources/[id]/verify` — Allowlisted `verifyResourceUrl()` + `ResourceVerificationLog` + rate limit (`429`).
- `POST /api/admin/interview-prep/resources/[id]/publish` — `APPROVED` -> `PUBLISHED` (blocked if `UNAVAILABLE` or `UNVERIFIED` access).

---

## 9. Admin UI Implementation Stages
1. **Stage 1**: Server-gated `/admin/resources` shell (`requireAdmin()` SSR redirect) + KPI bar + Queue table/filters (`#7A0F1F`, `#F2B63D`, `#FFF8F0`).
2. **Stage 2**: Detail drawer (metadata editor, verification log viewer, live verify button, approve/reject/publish/archive actions, audit timeline).
3. **Stage 3**: Discovery candidate import & batch triage (Phase 4C.3).

---

## 10. Testing & Deployment Plan
1. **Recovery gate**: Address full native PostgreSQL restore verification before any production schema migration.
2. **Preserve reconciled migrations**: Do **not** modify `00000000000000_postgres_baseline` or `00000000000001_lockdown_public_rls_and_grants`.
3. **Isolated PG 17.12 validation**: Apply additive migration + RLS + RPC atomic audit function, test role matrix (`SUPER_ADMIN` / `CONTENT_REVIEWER` / `MODERATOR` / `STUDENT`), CSRF origin checks, state transitions, canonical URL uniqueness, and Playwright admin/student flows before requesting production approval.
