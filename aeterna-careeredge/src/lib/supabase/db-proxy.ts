// src/lib/supabase/db-proxy.ts
// Supabase PostgREST Adapter for Prisma-like ORM queries
// Translates db.<model>.<method> calls directly to Supabase client over HTTPS.
// Generates client-side IDs & updatedAt timestamps (matching Prisma's @default(cuid()) / @updatedAt)
// and resolves nested `include` / `select` relations so Cloudflare Workers never need Prisma TCP sockets.

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
  studentAchievement: "student_achievements",
  careerGoal: "career_goals",
  onboardingState: "onboarding_states",
  guideSeenPanel: "guide_seen_panels",
};

const TABLES_WITH_UPDATED_AT = new Set([
  "users",
  "student_profiles",
  "education_records",
  "student_skills",
  "student_projects",
  "student_experiences",
  "certifications",
  "resumes",
  "sop_documents",
  "linkedin_profiles",
  "career_assessments",
  "career_recommendations",
  "job_applications",
  "counselling_requests",
  "crm_leads",
  "stored_documents",
  "student_achievements",
  "career_goals",
  "onboarding_states",
  "evidence_items",
  "truth_check_results",
  "sprint_plans",
  "sprint_tasks",
  "application_packs",
  "interview_prep_kits",
  "guide_conversations",
  "plans",
  "user_subscriptions",
]);

interface RelationDef {
  table: string;
  foreignKey: string;
  localKey: string;
  isMany: boolean;
}

const RELATION_MAP: Record<string, Record<string, RelationDef>> = {
  users: {
    profile: { table: "student_profiles", foreignKey: "userId", localKey: "id", isMany: false },
    educations: { table: "education_records", foreignKey: "userId", localKey: "id", isMany: true },
    skills: { table: "student_skills", foreignKey: "userId", localKey: "id", isMany: true },
    projects: { table: "student_projects", foreignKey: "userId", localKey: "id", isMany: true },
    experiences: { table: "student_experiences", foreignKey: "userId", localKey: "id", isMany: true },
    certifications: { table: "certifications", foreignKey: "userId", localKey: "id", isMany: true },
    resumes: { table: "resumes", foreignKey: "userId", localKey: "id", isMany: true },
    sopDocuments: { table: "sop_documents", foreignKey: "userId", localKey: "id", isMany: true },
    linkedInProfile: { table: "linkedin_profiles", foreignKey: "userId", localKey: "id", isMany: false },
    assessments: { table: "career_assessments", foreignKey: "userId", localKey: "id", isMany: true },
    recommendations: { table: "career_recommendations", foreignKey: "userId", localKey: "id", isMany: true },
    applications: { table: "job_applications", foreignKey: "userId", localKey: "id", isMany: true },
    counsellingRequests: { table: "counselling_requests", foreignKey: "userId", localKey: "id", isMany: true },
    consentRecords: { table: "consent_records", foreignKey: "userId", localKey: "id", isMany: true },
    storedDocuments: { table: "stored_documents", foreignKey: "userId", localKey: "id", isMany: true },
    evidenceItems: { table: "evidence_items", foreignKey: "userId", localKey: "id", isMany: true },
    achievements: { table: "student_achievements", foreignKey: "userId", localKey: "id", isMany: true },
    careerGoals: { table: "career_goals", foreignKey: "userId", localKey: "id", isMany: true },
  },
  resumes: {
    user: { table: "users", foreignKey: "id", localKey: "userId", isMany: false },
  },
  linkedin_profiles: {
    user: { table: "users", foreignKey: "id", localKey: "userId", isMany: false },
  },
  user_subscriptions: {
    plan: { table: "plans", foreignKey: "id", localKey: "planId", isMany: false },
  },
  plans: {
    limits: { table: "plan_feature_limits", foreignKey: "planId", localKey: "id", isMany: true },
  },
  sprint_plans: {
    tasks: { table: "sprint_tasks", foreignKey: "sprintPlanId", localKey: "id", isMany: true },
  },
  job_applications: {
    pack: { table: "application_packs", foreignKey: "applicationId", localKey: "id", isMany: false },
  },
  guide_conversations: {
    messages: { table: "guide_messages", foreignKey: "conversationId", localKey: "id", isMany: true },
  },
};

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function serializeDates(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Date) {
      out[k] = v.toISOString();
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

function withInsertDefaults(tableName: string, row: Record<string, any>): Record<string, any> {
  const enriched: Record<string, any> = serializeDates(row);
  if (enriched.id === undefined || enriched.id === null) {
    enriched.id = generateId();
  }
  if (TABLES_WITH_UPDATED_AT.has(tableName) && enriched.updatedAt === undefined) {
    enriched.updatedAt = new Date().toISOString();
  }
  return enriched;
}

function withUpdateDefaults(tableName: string, data: Record<string, any>): Record<string, any> {
  const enriched: Record<string, any> = serializeDates(data);
  if (TABLES_WITH_UPDATED_AT.has(tableName) && enriched.updatedAt === undefined) {
    enriched.updatedAt = new Date().toISOString();
  }
  return enriched;
}

function resolveTableName(model: string): string {
  if (MODEL_TO_TABLE[model]) return MODEL_TO_TABLE[model];
  const snake = model.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  return snake.endsWith("s") ? snake : `${snake}s`;
}

const PRISMA_OPERATORS = new Set([
  "equals",
  "not",
  "in",
  "gte",
  "lte",
  "gt",
  "lt",
  "contains",
  "startsWith",
  "endsWith",
]);

function flattenWhere(where?: Record<string, any>): Record<string, any> {
  if (!where || typeof where !== "object") return {};
  const flat: Record<string, any> = {};
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (
      key !== "NOT" &&
      key !== "not" &&
      key.includes("_") &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !Object.keys(value).some((k) => PRISMA_OPERATORS.has(k))
    ) {
      for (const [subKey, subVal] of Object.entries(value)) {
        if (subVal !== undefined) flat[subKey] = subVal;
      }
    } else {
      flat[key] = value;
    }
  }
  return flat;
}

function applyWhere(query: any, where?: Record<string, any>): any {
  const normalizedWhere = flattenWhere(where);
  if (!normalizedWhere || Object.keys(normalizedWhere).length === 0) return query;

  for (const [key, value] of Object.entries(normalizedWhere)) {
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
        query = query.gte(key, value.gte instanceof Date ? value.gte.toISOString() : value.gte);
      } else if ("lte" in value) {
        query = query.lte(key, value.lte instanceof Date ? value.lte.toISOString() : value.lte);
      } else if ("gt" in value) {
        query = query.gt(key, value.gt instanceof Date ? value.gt.toISOString() : value.gt);
      } else if ("lt" in value) {
        query = query.lt(key, value.lt instanceof Date ? value.lt.toISOString() : value.lt);
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
      query = query.eq(key, value instanceof Date ? value.toISOString() : value);
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

function splitSelectAndRelations(
  tableName: string,
  select?: Record<string, any>,
  include?: Record<string, any>
): { selectStr: string; relations: Record<string, any> } {
  const tableRelations = RELATION_MAP[tableName] || {};
  const relations: Record<string, any> = {};

  if (include && typeof include === "object") {
    for (const [key, val] of Object.entries(include)) {
      if (val) relations[key] = val;
    }
  }

  if (!select || typeof select !== "object") {
    return { selectStr: "*", relations };
  }

  const scalarFields: string[] = [];
  for (const [key, val] of Object.entries(select)) {
    if (!val) continue;
    if (key in tableRelations || typeof val === "object") {
      relations[key] = val;
    } else {
      scalarFields.push(key);
    }
  }

  // Always include id and any localKey needed for resolving relations
  for (const relKey of Object.keys(relations)) {
    const def = tableRelations[relKey];
    if (def && !scalarFields.includes(def.localKey) && scalarFields.length > 0) {
      scalarFields.push(def.localKey);
    }
  }

  return {
    selectStr: scalarFields.length > 0 ? scalarFields.join(", ") : "*",
    relations,
  };
}

async function resolveRelationsForRow(
  supabase: SupabaseClient,
  tableName: string,
  row: Record<string, any> | null,
  relations: Record<string, any>
): Promise<any> {
  if (!row) return null;
  const relKeys = Object.keys(relations);
  if (relKeys.length === 0) return row;

  const tableRelations = RELATION_MAP[tableName] || {};

  await Promise.all(
    relKeys.map(async (relKey) => {
      const def = tableRelations[relKey];
      const relArgs = relations[relKey];
      if (!def || !relArgs) return;

      const parentVal = row[def.localKey];
      if (parentVal === undefined || parentVal === null) {
        row[relKey] = def.isMany ? [] : null;
        return;
      }

      const subArgs = typeof relArgs === "object" ? relArgs : {};
      const { selectStr: subSelectStr, relations: subRelations } = splitSelectAndRelations(
        def.table,
        subArgs.select,
        subArgs.include
      );

      let subQuery = supabase.from(def.table).select(subSelectStr).eq(def.foreignKey, parentVal);
      if (subArgs.where) subQuery = applyWhere(subQuery, subArgs.where);
      if (subArgs.orderBy) subQuery = applyOrderBy(subQuery, subArgs.orderBy);
      if (typeof subArgs.take === "number") subQuery = subQuery.limit(subArgs.take);

      if (def.isMany) {
        const { data } = await subQuery;
        const items = data || [];
        if (Object.keys(subRelations).length > 0) {
          row[relKey] = await Promise.all(
            items.map((item: any) => resolveRelationsForRow(supabase, def.table, item, subRelations))
          );
        } else {
          row[relKey] = items;
        }
      } else {
        const { data } = await subQuery.limit(1).maybeSingle();
        if (data && Object.keys(subRelations).length > 0) {
          row[relKey] = await resolveRelationsForRow(supabase, def.table, data, subRelations);
        } else {
          row[relKey] = data || null;
        }
      }
    })
  );

  return row;
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
            const { selectStr, relations } = splitSelectAndRelations(tableName, args.select, args.include);
            let query = supabase.from(tableName).select(selectStr);
            query = applyWhere(query, args.where);
            const { data, error } = await query.limit(1).maybeSingle();
            if (error) throw new Error(error.message);
            return resolveRelationsForRow(supabase, tableName, data, relations);
          },

          async findFirst(args?: { where?: Record<string, any>; orderBy?: any; select?: any; include?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.findFirst`);
            const { selectStr, relations } = splitSelectAndRelations(tableName, args?.select, args?.include);
            let query = supabase.from(tableName).select(selectStr);
            query = applyWhere(query, args?.where);
            query = applyOrderBy(query, args?.orderBy);
            const { data, error } = await query.limit(1).maybeSingle();
            if (error) throw new Error(error.message);
            return resolveRelationsForRow(supabase, tableName, data, relations);
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
            const { selectStr, relations } = splitSelectAndRelations(tableName, args?.select, args?.include);
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
            const rows = data || [];
            if (Object.keys(relations).length > 0) {
              return Promise.all(rows.map((r: any) => resolveRelationsForRow(supabase, tableName, r, relations)));
            }
            return rows;
          },

          async create(args: { data: Record<string, any>; select?: any; include?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.create`);
            const { selectStr, relations } = splitSelectAndRelations(tableName, args.select, args.include);
            const payload = withInsertDefaults(tableName, args.data);
            const { data, error } = await supabase.from(tableName).insert(payload).select(selectStr).single();
            if (error) throw new Error(error.message);
            return resolveRelationsForRow(supabase, tableName, data, relations);
          },

          async createMany(args: { data: Record<string, any>[] }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.createMany`);
            const rows = Array.isArray(args.data)
              ? args.data.map((row) => withInsertDefaults(tableName, row))
              : [withInsertDefaults(tableName, args.data)];
            const { error } = await supabase.from(tableName).insert(rows);
            if (error) throw new Error(error.message);
            return { count: rows.length };
          },

          async update(args: { where: Record<string, any>; data: Record<string, any>; select?: any; include?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.update`);
            const { selectStr, relations } = splitSelectAndRelations(tableName, args.select, args.include);
            const payload = withUpdateDefaults(tableName, args.data);
            let query = supabase.from(tableName).update(payload);
            query = applyWhere(query, args.where);
            const { data, error } = await query.select(selectStr).single();
            if (error) throw new Error(error.message);
            return resolveRelationsForRow(supabase, tableName, data, relations);
          },

          async updateMany(args: { where?: Record<string, any>; data: Record<string, any> }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.updateMany`);
            const payload = withUpdateDefaults(tableName, args.data);
            let query = supabase.from(tableName).update(payload);
            query = applyWhere(query, args?.where);
            const { data, error } = await query.select("id");
            if (error) throw new Error(error.message);
            return { count: data?.length || 0 };
          },

          async delete(args: { where: Record<string, any>; select?: any }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.delete`);
            const { selectStr } = splitSelectAndRelations(tableName, args.select);
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
            include?: any;
          }) {
            const supabase = getSupabase();
            if (!supabase) throw new Error(`Supabase client unavailable for ${modelKey}.upsert`);

            let findQuery = supabase.from(tableName).select("id");
            findQuery = applyWhere(findQuery, args.where);
            const { data: existing } = await findQuery.limit(1).maybeSingle();

            const { selectStr, relations } = splitSelectAndRelations(tableName, args.select, args.include);

            if (existing) {
              const payload = withUpdateDefaults(tableName, args.update);
              let updateQuery = supabase.from(tableName).update(payload);
              updateQuery = applyWhere(updateQuery, args.where);
              const { data, error } = await updateQuery.select(selectStr).single();
              if (error) throw new Error(error.message);
              return resolveRelationsForRow(supabase, tableName, data, relations);
            } else {
              const flatWhere = flattenWhere(args.where);
              const insertData = withInsertDefaults(tableName, { ...flatWhere, ...args.create });
              const { data, error } = await supabase.from(tableName).insert(insertData).select(selectStr).single();
              if (error) throw new Error(error.message);
              return resolveRelationsForRow(supabase, tableName, data, relations);
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
