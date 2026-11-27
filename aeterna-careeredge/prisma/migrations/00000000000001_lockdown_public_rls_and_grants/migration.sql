-- CareerEdge — Production Security Lockdown Migration
-- Migration: 00000000000001_lockdown_public_rls_and_grants
--
-- IMPORTANT STATUS NOTE:
--   This security lockdown has ALREADY been executed on the live Supabase
--   PostgreSQL 17.12 database (`lawehfiwbjxfnbtgeusi`) and verified.
--   During baseline reconciliation, this migration is recorded via:
--     npx prisma migrate resolve --applied 00000000000001_lockdown_public_rls_and_grants
--   after `00000000000000_postgres_baseline` is marked applied.
--
-- Scope:
--   - `public` schema ONLY (does NOT modify `auth`, `storage`, or `documents` bucket).
--   - Revokes `anon`, `authenticated`, and `PUBLIC` privileges on existing tables,
--     sequences, and functions, plus `postgres` default privileges (including global
--     `PUBLIC` function `EXECUTE`).
--   - Preserves `service_role` and `postgres` backend access.
--   - Enables RLS on all 68 `public` tables without `FORCE ROW LEVEL SECURITY`
--     and without `auth.uid()` policies (CareerEdge uses custom `ace_session`).
--   - Outer `BEGIN;` / `COMMIT;` omitted because Prisma Migrate wraps each
--     migration file in its own transaction.

-- 1. Revoke all existing table, sequence, and function privileges in `public`
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;

-- 2. Preserve full backend privileges for `service_role` on all existing `public` objects
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. Prevent future objects created by `postgres` from being auto-exposed
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated, PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;

-- 4. Enable Row Level Security on all 68 existing `public` application tables
ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."application_packs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."career_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."career_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."career_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."career_roadmaps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."certifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."counselling_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."crm_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."crm_sync_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."data_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."education_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."evidence_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."guide_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."guide_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."guide_seen_panels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."interview_prep_kits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."interview_question_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."job_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."learning_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."linkedin_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mock_interview_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mock_interview_turns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."onboarding_states" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plan_feature_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."practice_exercises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."practice_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."progress_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_admission_requirements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_institutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_job_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_occupations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_scholarships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_specializations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reference_study_destinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resource_verification_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resume_analyses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resume_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resumes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roadmap_phases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roadmap_prerequisites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roadmap_topics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roadmap_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."role_fit_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sop_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sprint_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sprint_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stored_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_experiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_resource_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_roadmap_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."study_plan_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."study_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."topic_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."truth_check_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."usage_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema & privilege cache (safe no-op outside Supabase PostgREST)
NOTIFY pgrst, 'reload schema';
