-- AlterTable
ALTER TABLE "learning_resources" ADD COLUMN     "accessRequirements" TEXT,
ADD COLUMN     "certificateAvailable" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "discoverySource" TEXT NOT NULL DEFAULT 'MANUAL_CURATED',
ADD COLUMN     "isCurated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "sourceCategory" TEXT,
ADD COLUMN     "subtopicsJson" TEXT;

-- CreateTable
CREATE TABLE "admin_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_members_userId_key" ON "admin_members"("userId");

-- CreateIndex
CREATE INDEX "admin_members_role_isActive_idx" ON "admin_members"("role", "isActive");

-- CreateIndex
CREATE INDEX "admin_audit_logs_targetType_targetId_idx" ON "admin_audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actorUserId_createdAt_idx" ON "admin_audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "learning_resources_canonicalUrl_key" ON "learning_resources"("canonicalUrl");

-- CreateIndex
CREATE INDEX "learning_resources_domain_reviewStatus_verificationStatus_idx" ON "learning_resources"("domain", "reviewStatus", "verificationStatus");

-- AddForeignKey
ALTER TABLE "admin_members" ADD CONSTRAINT "admin_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Security lockdown for new administrative tables (matches 00000000000001_lockdown_public_rls_and_grants)
REVOKE ALL PRIVILEGES ON TABLE "public"."admin_members", "public"."admin_audit_logs" FROM anon, authenticated, PUBLIC;
GRANT ALL PRIVILEGES ON TABLE "public"."admin_members", "public"."admin_audit_logs" TO service_role;
ALTER TABLE "public"."admin_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;

-- Atomic SECURITY DEFINER RPC for Cloudflare Workers / PostgREST
-- Updates learning_resources and inserts admin_audit_logs in a single PostgreSQL transaction.
CREATE OR REPLACE FUNCTION "public"."admin_mutate_learning_resource"(
  p_actor_user_id text,
  p_action text,
  p_resource_id text,
  p_reason text,
  p_metadata_json text,
  p_audit_id text,
  p_patch jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated public.learning_resources%ROWTYPE;
BEGIN
  IF p_actor_user_id IS NULL OR length(trim(p_actor_user_id)) = 0 THEN
    RAISE EXCEPTION 'Actor user ID is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_members
    WHERE "userId" = p_actor_user_id
      AND "isActive" = true
      AND "revokedAt" IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden: inactive or missing admin member';
  END IF;

  UPDATE public.learning_resources
  SET
    "title" = COALESCE(p_patch->>'title', "title"),
    "provider" = COALESCE(p_patch->>'provider', "provider"),
    "domain" = COALESCE(p_patch->>'domain', "domain"),
    "resourceType" = COALESCE(p_patch->>'resourceType', "resourceType"),
    "description" = COALESCE(p_patch->>'description', "description"),
    "difficulty" = COALESCE(p_patch->>'difficulty', "difficulty"),
    "language" = COALESCE(p_patch->>'language', "language"),
    "estimatedMinutes" = CASE
      WHEN p_patch ? 'estimatedMinutes' THEN NULLIF(p_patch->>'estimatedMinutes', '')::integer
      ELSE "estimatedMinutes"
    END,
    "accessClassification" = COALESCE(p_patch->>'accessClassification', "accessClassification"),
    "accessRequirements" = CASE
      WHEN p_patch ? 'accessRequirements' THEN p_patch->>'accessRequirements'
      ELSE "accessRequirements"
    END,
    "certificateAvailable" = COALESCE(p_patch->>'certificateAvailable', "certificateAvailable"),
    "license" = CASE
      WHEN p_patch ? 'license' THEN p_patch->>'license'
      ELSE "license"
    END,
    "sourceCategory" = CASE
      WHEN p_patch ? 'sourceCategory' THEN p_patch->>'sourceCategory'
      ELSE "sourceCategory"
    END,
    "sourceAttribution" = CASE
      WHEN p_patch ? 'sourceAttribution' THEN p_patch->>'sourceAttribution'
      ELSE "sourceAttribution"
    END,
    "subtopicsJson" = CASE
      WHEN p_patch ? 'subtopicsJson' THEN p_patch->>'subtopicsJson'
      ELSE "subtopicsJson"
    END,
    "reviewStatus" = COALESCE(p_patch->>'reviewStatus', "reviewStatus"),
    "reviewedById" = CASE
      WHEN p_patch ? 'reviewedById' THEN p_patch->>'reviewedById'
      ELSE "reviewedById"
    END,
    "reviewedAt" = CASE
      WHEN p_patch ? 'reviewedAt' THEN (p_patch->>'reviewedAt')::timestamp(3)
      ELSE "reviewedAt"
    END,
    "rejectionReason" = CASE
      WHEN p_patch ? 'rejectionReason' THEN p_patch->>'rejectionReason'
      ELSE "rejectionReason"
    END,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = p_resource_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LearningResource % not found', p_resource_id;
  END IF;

  INSERT INTO public.admin_audit_logs (
    "id", "actorUserId", "action", "targetType", "targetId", "reason", "metadataJson", "createdAt"
  ) VALUES (
    p_audit_id, p_actor_user_id, p_action, 'LEARNING_RESOURCE', p_resource_id, p_reason, p_metadata_json, CURRENT_TIMESTAMP
  );

  RETURN to_jsonb(v_updated);
END;
$$;

REVOKE ALL ON FUNCTION "public"."admin_mutate_learning_resource"(text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "public"."admin_mutate_learning_resource"(text, text, text, text, text, text, jsonb) TO service_role;
