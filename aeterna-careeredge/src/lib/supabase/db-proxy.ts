// src/lib/supabase/db-proxy.ts
// Supabase PostgREST Adapter for Prisma-like ORM queries
// Translates db.<model>.<method> calls directly to Supabase client over HTTPS.
// Enables seamless execution on Cloudflare Workers edge runtime without TCP socket requirements.

import { SupabaseClient } from "@supabase/supabase-js";

const MODEL_TO_TABLE: Record<string, string> = {
  user: "users",
  studentProfile: "student_profiles",
  educationRecord: "education_records",
  studentSkill: "student_skills",
  studentProject: "student_projects",
  studentExperience: "student_experiences",
  certification: "certifications",
  resume: "resumes",
  resumeVersion: "resume_versions",
  resumeAnalysisRecord: "resume_analyses",
  resumeAnalysis: "resume_analyses",
  sopDocument: "sop_documents",
  linkedInProfile: "linkedin_profiles",
  careerAssessment: "career_assessments",
  careerRecommendation: "career_recommendations",
  jobApplication: "job_applications",
  counsellingRequest: "counselling_requests",
  crmLead: "crm_leads",
  crmSyncLog: "crm_sync_logs",
  consentRecord: "consent_records",
  storedDocument: "stored_documents",
  evidenceItem: "evidence_items",
  truthCheckResult: "truth_check_results",
  roleFitResult: "role_fit_results",
  sprintPlan: "sprint_plans",
  sprintTask: "sprint_tasks",
  applicationPack: "application_packs",
  interviewPrepKit: "interview_prep_kits",
  progressEvent: "progress_events",
  guideConversation: "guide_conversations",
  guideMessage: "guide_messages",
  plan: "plans",
  planFeatureLimit: "plan_feature_limits",
  userSubscription: "user_subscriptions",
  usageRecord: "usage_records",
  analyticsEvent: "analytics_events",
  passwordResetToken: "password_reset_tokens",
};

function resolveTableName(model: string): string {
  if (MODEL_TO_TABLE[model]) return MODEL_TO_TABLE[model];
  const snake = model.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  return snake.endsWith("s") ? snake : `${snake}s`;
}

function applyWhere(query: any, where?: Record<string, any>): any {
  if (!where || typeof where !== "object") return query;

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;

    if (key === "NOT" || key === "not") {
      if (typeof value === "object" && value !== null) {
        for (const [notKey, notVal] of Object.entries(value)) {
          if (notVal === null) {
            query = query.not(notKey, "is", null);
          } else if (typeof notVal === "object" && notVal !== null) {
            if ("equals" in notVal) query = query.neq(notKey, (notVal as any).equals);
            else if ("in" in notVal) query = query.not(notKey, "in", `(${(notVal as any).in.join(",")})`);
          } else {
            query = query.neq(notKey, notVal);
          }
        }
      }
      continue;
    }

    if (value === null) {
      query = query.is(key, null);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      if ("equals" in value) {
        query = query.eq(key, value.equals);
      } else if ("not" in value) {
        if (value.not === null) {
          query = query.not(key, "is", null);
        } else {
          query = query.neq(key, value.not);
        }
      } else if ("in" in value && Array.isArray(value.in)) {
        query = query.in(key, value.in);
      } else if ("gte" in value) {
        query = query.gte(key, value.gte);
      } else if ("lte" in value) {
        query = query.lte(key, value.lte);
      } else if ("gt" in value) {
        query = query.gt(key, value.gt);
      } else if ("lt" in value) {
        query = query.lt(key, value.lt);
      } else if ("contains" in value) {
        query = query.ilike(key, `%${value.contains}%`);
      } else if ("startsWith" in value) {
        query = query.ilike(key, `${value.startsWith}%`);
      } else if ("endsWith" in value) {
        query = query.ilike(key, `%${value.endsWith}`);
      } else {
        query = query.eq(key, value);
      }
    } else {
      query = query.eq(key, value);
    }
  }

  return query;
}

function applyOrderBy(query: any, orderBy?: any): any {
  if (!orderBy) return query;

  if (Array.isArray(orderBy)) {
    for (const item of orderBy) {
      if (item && typeof item === "object") {
        for (const [col, dir] of Object.entries(item)) {
          query = query.order(col, { ascending: String(dir).toLowerCase() === "asc" });
        }
      }
    }
  } else if (typeof orderBy === "object") {
    for (const [col, dir] of Object.entries(orderBy)) {
      query = query.order(col, { ascending: String(dir).toLowerCase() === "asc" });
    }
  }

  return query;
}

function resolveSelect(select?: Record<string, boolean>): string {
  if (!select || typeof select !== "object") return "*";
  const fields = Object.entries(select)
    .filter(([_, enabled]) => Boolean(enabled))
    .map(([key]) => key);
  return fields.length > 0 ? fields.join(", ") : "*";
}

export function createSupabasePrismaProxy(getSupabase: () => SupabaseClient | null): any {
  return new Proxy(
    {},
    {
      get(_target, modelKey: string) {
        if (typeof modelKey !== "string" || modelKey.startsWith("$") || modelKey.startsWith("_")) {
          return undefined;
        }

        const tableName = resolveTableName(modelKey);

        return {
          async findUnique(args: { where: Record<string, any>; select?: any; include?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.findUnique`);
            const selectStr = resolveSelect(args.select);
            let query = supabase.from(tableName).select(selectStr);
            query = applyWhere(query, args.where);
            const { data, error } = await query.limit(1).maybeSingle();
            if (error) throw new Error(error.message);
            return data;
          },

          async findFirst(args?: { where?: Record<string, any>; orderBy?: any; select?: any; include?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.findFirst`);
            const selectStr = resolveSelect(args?.select);
            let query = supabase.from(tableName).select(selectStr);
            query = applyWhere(query, args?.where);
            query = applyOrderBy(query, args?.orderBy);
            const { data, error } = await query.limit(1).maybeSingle();
            if (error) throw new Error(error.message);
            return data;
          },

          async findMany(args?: {
            where?: Record<string, any>;
            orderBy?: any;
            select?: any;
            take?: number;
            skip?: number;
            include?: any;
          }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.findMany`);
            const selectStr = resolveSelect(args?.select);
            let query = supabase.from(tableName).select(selectStr);
            query = applyWhere(query, args?.where);
            query = applyOrderBy(query, args?.orderBy);

            if (typeof args?.take === "number" && typeof args?.skip === "number") {
              query = query.range(args.skip, args.skip + args.take - 1);
            } else if (typeof args?.take === "number") {
              query = query.limit(args.take);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data || [];
          },

          async create(args: { data: Record<string, any>; select?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.create`);
            const selectStr = resolveSelect(args.select);
            const { data, error } = await supabase.from(tableName).insert(args.data).select(selectStr).single();
            if (error) throw new Error(error.message);
            return data;
          },

          async createMany(args: { data: Record<string, any>[] }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.createMany`);
            const { error } = await supabase.from(tableName).insert(args.data);
            if (error) throw new Error(error.message);
            return { count: Array.isArray(args.data) ? args.data.length : 1 };
          },

          async update(args: { where: Record<string, any>; data: Record<string, any>; select?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.update`);
            const selectStr = resolveSelect(args.select);
            let query = supabase.from(tableName).update(args.data);
            query = applyWhere(query, args.where);
            const { data, error } = await query.select(selectStr).single();
            if (error) throw new Error(error.message);
            return data;
          },

          async updateMany(args: { where?: Record<string, any>; data: Record<string, any> }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.updateMany`);
            let query = supabase.from(tableName).update(args.data);
            query = applyWhere(query, args?.where);
            const { data, error } = await query.select("id");
            if (error) throw new Error(error.message);
            return { count: data?.length || 0 };
          },

          async delete(args: { where: Record<string, any>; select?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.delete`);
            const selectStr = resolveSelect(args.select);
            let query = supabase.from(tableName).delete();
            query = applyWhere(query, args.where);
            const { data, error } = await query.select(selectStr).maybeSingle();
            if (error) throw new Error(error.message);
            return data;
          },

          async deleteMany(args?: { where?: Record<string, any> }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.deleteMany`);
            let query = supabase.from(tableName).delete();
            query = applyWhere(query, args?.where);
            const { data, error } = await query.select("id");
            if (error) throw new Error(error.message);
            return { count: data?.length || 0 };
          },

          async upsert(args: {
            where: Record<string, any>;
            create: Record<string, any>;
            update: Record<string, any>;
            select?: any;
          }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.upsert`);

            // Check if existing record exists
            let findQuery = supabase.from(tableName).select("id");
            findQuery = applyWhere(findQuery, args.where);
            const { data: existing } = await findQuery.limit(1).maybeSingle();

            const selectStr = resolveSelect(args.select);

            if (existing) {
              let updateQuery = supabase.from(tableName).update(args.update);
              updateQuery = applyWhere(updateQuery, args.where);
              const { data, error } = await updateQuery.select(selectStr).single();
              if (error) throw new Error(error.message);
              return data;
            } else {
              const insertData = { ...args.where, ...args.create };
              const { data, error } = await supabase.from(tableName).insert(insertData).select(selectStr).single();
              if (error) throw new Error(error.message);
              return data;
            }
          },

          async count(args?: { where?: Record<string, any> }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.count`);
            let query = supabase.from(tableName).select("*", { count: "exact", head: true });
            query = applyWhere(query, args?.where);
            const { count, error } = await query;
            if (error) throw new Error(error.message);
            return count || 0;
          },
        };
      },
    }
  );
}
