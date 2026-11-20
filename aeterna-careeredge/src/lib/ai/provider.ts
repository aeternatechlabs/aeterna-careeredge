// src/lib/ai/provider.ts
// Server-Side AI Provider Abstraction (Day 2 Part 9)
// Strict separation of student truth vs AI advice, cost control, token tracking, and environment-driven model selection.

import crypto from "crypto";
import type {
  AiModelTier,
  AiTaskRequest,
  AiTaskResponse,
  AiTokenUsage,
} from "./types";
import { recordUsage } from "@/lib/monetization/entitlements";
import { sanitizeContextForAi } from "./guardrails";

// ── In-Memory Cache for Deduplication ──────────────────────────────────────────
const RESPONSE_CACHE = new Map<string, { response: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ── Cost Benchmarking Defaults (per 1,000,000 tokens in USD) ───────────────────
// FAST (e.g. Gemini 2.0 Flash / Haiku): $0.10 input, $0.40 output
// QUALITY (e.g. Gemini 2.0 Pro / Claude Sonnet): $1.25 input, $5.00 output
const USD_TO_INR = 86.5;

function calculateCost(tier: AiModelTier, inputTokens: number, outputTokens: number): { usd: number; inr: number } {
  const isFast = tier === "FAST";
  const inputRate = isFast ? 0.10 / 1_000_000 : 1.25 / 1_000_000;
  const outputRate = isFast ? 0.40 / 1_000_000 : 5.00 / 1_000_000;

  const costUsd = inputTokens * inputRate + outputTokens * outputRate;
  const costInr = costUsd * USD_TO_INR;

  return {
    usd: Number(costUsd.toFixed(6)),
    inr: Number(costInr.toFixed(4)),
  };
}

export class ServerAiService {
  private timeoutMs: number;

  constructor(timeoutMs = 15000) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Determine which provider to use based on environment.
   */
  getProviderName(): string {
    const explicit = (process.env.AI_PROVIDER || "").toLowerCase().replace(/['"]/g, "").trim();
    if (explicit) return explicit;
    const key =
      process.env.GROQ_API_KEY ||
      process.env.XAI_API_KEY ||
      process.env.GROK_API_KEY ||
      "";
    if (key.startsWith("gsk_")) return "groq";
    if (key.startsWith("xai-")) return "grok";
    if (process.env.GEMINI_API_KEY) return "gemini";
    return "mock";
  }

  /**
   * Determine the configured model name for a given tier.
   * No hardcoded model names in business logic.
   */
  getModelName(tier: AiModelTier): string {
    const provider = this.getProviderName();
    if (provider === "groq") {
      if (tier === "QUALITY") {
        return process.env.AI_MODEL_QUALITY || "openai/gpt-oss-120b";
      }
      return process.env.AI_MODEL_FAST || "qwen/qwen3.8-27b";
    }
    if (provider === "grok" || provider === "xai") {
      if (tier === "QUALITY") {
        return process.env.AI_MODEL_QUALITY || "grok-2";
      }
      return process.env.AI_MODEL_FAST || "grok-2-mini";
    }
    if (tier === "QUALITY") {
      return process.env.AI_MODEL_QUALITY || "gemini-3.5-flash-lite";
    }
    return process.env.AI_MODEL_FAST || "gemini-3.5-flash-lite";
  }

  /**
   * Main entrypoint: generates structured advice with token tracking, caching, and guardrails.
   */
  async generateStructuredAdvice<T>(
    request: AiTaskRequest
  ): Promise<AiTaskResponse<T>> {
    const startTime = Date.now();
    const tier: AiModelTier = request.modelTier ?? "FAST";
    const provider = this.getProviderName();
    const model = this.getModelName(tier);

    // 1. Sanitize student context (never leak direct PII)
    const sanitizedStudentContext = sanitizeContextForAi(
      request.studentContext as unknown as Record<string, unknown>
    );

    // 2. Hash request payload for caching & deduplication
    const cacheKey = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          operation: request.operation,
          tier,
          student: sanitizedStudentContext,
          reference: request.verifiedReferenceContext,
          prompt: request.customPrompt,
        })
      )
      .digest("hex");

    const cachedEntry = RESPONSE_CACHE.get(cacheKey);
    if (!request.bypassCache && cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return {
        ...(cachedEntry.response as AiTaskResponse<T>),
        cached: true,
      };
    }

    if (request.bypassCache) {
      RESPONSE_CACHE.delete(cacheKey);
    }

    // 3. Check for API keys
    const apiKey =
      (provider === "groq"
        ? process.env.GROQ_API_KEY || process.env.XAI_API_KEY || process.env.GROK_API_KEY
        : provider === "grok" || provider === "xai"
        ? process.env.XAI_API_KEY || process.env.GROK_API_KEY || process.env.GROQ_API_KEY
        : process.env.GEMINI_API_KEY) ||
      process.env.GROQ_API_KEY ||
      process.env.XAI_API_KEY ||
      process.env.GROK_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY;

    let response: AiTaskResponse<T>;

    // 4. Execute AI call or development mock
    if (!apiKey || provider === "mock") {
      response = this.executeMockOperation<T>({
        request,
        sanitizedContext: sanitizedStudentContext,
        tier,
        provider: "DEV_MOCK",
        model: `mock-${tier.toLowerCase()}`,
        startTime,
      });
    } else {
      // Real API integration adapter
      response = await this.executeRealProvider<T>({
        request,
        sanitizedContext: sanitizedStudentContext,
        tier,
        provider,
        model,
        apiKey,
        startTime,
      });
    }

    // 5. Cache successful responses
    if (response.success && response.data) {
      RESPONSE_CACHE.set(cacheKey, {
        response,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }

    // 6. Record usage metrics in database if user ID provided
    if (request.userId) {
      try {
        await recordUsage({
          userId: request.userId,
          featureKey: request.operation,
          operationType: tier === "QUALITY" ? "REVIEW" : "EXTRACTION",
          inputTokens: response.metadata.usage.inputTokens,
          outputTokens: response.metadata.usage.outputTokens,
          estimatedCost: response.metadata.usage.estimatedCostInr,
          provider: response.metadata.provider,
          model: response.metadata.model,
          latencyMs: response.metadata.latencyMs,
        });
      } catch (err) {
        console.error("[AiService] Failed to record usage metric:", err);
      }
    }

    return response;
  }

  /**
   * Real provider caller with AbortController timeout.
   */
  private async executeRealProvider<T>(params: {
    request: AiTaskRequest;
    sanitizedContext: Record<string, unknown>;
    tier: AiModelTier;
    provider: string;
    model: string;
    apiKey: string;
    startTime: number;
  }): Promise<AiTaskResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      if (params.provider === "gemini") {
        const model = params.model || "gemini-3.5-flash-lite";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`;

        const promptText = `You are the Aeterna CareerEdge AI Engine.
You must return ONLY a raw JSON object (no markdown, no backticks, no code blocks) conforming strictly to this schema:
${params.request.schemaDescription}

Operation: ${params.request.operation}
Student Context:
${JSON.stringify(params.sanitizedContext, null, 2)}
${params.request.verifiedReferenceContext ? `Verified References:\n${JSON.stringify(params.request.verifiedReferenceContext, null, 2)}\n` : ""}
Task Instructions:
${params.request.customPrompt || "Perform this career advisory operation truthfully according to the student context."}

IMPORTANT PRODUCT INVARIANTS:
1. Never invent credentials, college names, grades, companies, dates, or metrics.
2. If evidence is lacking, state that evidence is needed.
3. No hiring probability percentages.
4. Keep advice domain-specific and actionable.`;

        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
          { text: promptText },
        ];

        if (params.request.documentAttachment) {
          parts.push({
            inlineData: {
              mimeType: params.request.documentAttachment.mimeType,
              data: params.request.documentAttachment.base64Data,
            },
          });
        }

        let geminiRes: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            geminiRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  temperature:
                    params.request.temperature ??
                    (params.request.operation === "LINKEDIN_OPTIMIZATION" ||
                    params.request.operation === "RESUME_CREATION"
                      ? 0.7
                      : 0.2),
                  responseMimeType: "application/json",
                },
              }),
            });
            if (geminiRes.ok) break;
            if ((geminiRes.status === 503 || geminiRes.status === 429) && attempt === 0) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            break;
          } catch (fetchErr) {
            if (attempt === 0) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            throw fetchErr;
          }
        }

        clearTimeout(timer);

        if (geminiRes && geminiRes.ok) {
          const raw = await geminiRes.json();
          const candidateText = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsedData = JSON.parse(candidateText.trim()) as T;
            const inputTokens = raw?.usageMetadata?.promptTokenCount || 250;
            const outputTokens = raw?.usageMetadata?.candidatesTokenCount || 150;
            const cost = calculateCost(params.tier, inputTokens, outputTokens);
            const latencyMs = Date.now() - params.startTime;

            return {
              success: true,
              data: parsedData,
              metadata: {
                provider: "google-gemini",
                model,
                tier: params.tier,
                latencyMs,
                usage: {
                  inputTokens,
                  outputTokens,
                  totalTokens: inputTokens + outputTokens,
                  estimatedCostUsd: cost.usd,
                  estimatedCostInr: cost.inr,
                },
                isAiGenerated: true,
                isStudentVerified: false,
                generatedAt: new Date(),
              },
            };
          }
        } else {
          clearTimeout(timer);
          const status = geminiRes?.status || 500;
          const statusText = geminiRes?.statusText || "Service Unavailable";
          const errText = geminiRes ? await geminiRes.text().catch(() => "") : "";
          console.error(`[AiService] Gemini API returned status ${status}: ${errText}`);
          return {
            success: false,
            error: `Gemini API returned HTTP ${status}: ${errText || statusText}`,
            metadata: {
              provider: "google-gemini",
              model,
              tier: params.tier,
              latencyMs: Date.now() - params.startTime,
              usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                estimatedCostUsd: 0,
                estimatedCostInr: 0,
              },
              isAiGenerated: true,
              isStudentVerified: false,
              generatedAt: new Date(),
            },
          };
        }
      }

      if (
        params.provider === "groq" ||
        params.provider === "grok" ||
        params.provider === "xai" ||
        params.apiKey.startsWith("gsk_") ||
        params.apiKey.startsWith("xai-")
      ) {
        const isGroq = params.provider === "groq" || params.apiKey.startsWith("gsk_");
        const endpoint = isGroq
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://api.x.ai/v1/chat/completions";
        const providerLabel = isGroq ? "groq" : "xai-grok";

        let model = params.model;
        if (isGroq) {
          if (!model || model.includes("grok") || model.includes("gemini") || model.includes("flash")) {
            model = params.tier === "QUALITY" ? "openai/gpt-oss-120b" : "qwen/qwen3.8-27b";
          }
        } else {
          if (!model || model.includes("gemini") || model.includes("flash") || model.includes("gpt-oss")) {
            model = params.tier === "QUALITY" ? "grok-2" : "grok-2-mini";
          }
        }

        const promptText = `Operation: ${params.request.operation}
Student Context:
${JSON.stringify(params.sanitizedContext, null, 2)}
${params.request.verifiedReferenceContext ? `Verified References:\n${JSON.stringify(params.request.verifiedReferenceContext, null, 2)}\n` : ""}
Task Instructions:
${params.request.customPrompt || "Perform this career advisory operation truthfully according to the student context."}`;

        const systemPrompt = `You are the Aeterna CareerEdge AI Engine.
You must return ONLY a raw JSON object (no markdown, no backticks, no code blocks) conforming strictly to this schema:
${params.request.schemaDescription}

IMPORTANT PRODUCT INVARIANTS:
1. Never invent credentials, college names, grades, companies, dates, or metrics.
2. If evidence is lacking, state that evidence is needed.
3. No hiring probability percentages.
4. Keep advice domain-specific and actionable.`;

        let openAiRes: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            openAiRes = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${params.apiKey}`,
              },
              signal: controller.signal,
              body: JSON.stringify({
                model,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: promptText },
                ],
                temperature:
                  params.request.temperature ??
                  (params.request.operation === "LINKEDIN_OPTIMIZATION" ||
                  params.request.operation === "RESUME_CREATION"
                    ? 0.7
                    : 0.2),
                response_format: { type: "json_object" },
              }),
            });
            if (openAiRes.ok) break;
            if ((openAiRes.status === 503 || openAiRes.status === 429) && attempt === 0) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            break;
          } catch (fetchErr) {
            if (attempt === 0) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            throw fetchErr;
          }
        }

        clearTimeout(timer);

        if (openAiRes && openAiRes.ok) {
          const raw = await openAiRes.json();
          const rawText = raw?.choices?.[0]?.message?.content || "";
          let cleanJson = rawText.trim();
          if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
          }
          const parsedData = JSON.parse(cleanJson) as T;
          const inputTokens = raw?.usage?.prompt_tokens || 200;
          const outputTokens = raw?.usage?.completion_tokens || 100;
          const cost = calculateCost(params.tier, inputTokens, outputTokens);
          const latencyMs = Date.now() - params.startTime;

          return {
            success: true,
            data: parsedData,
            metadata: {
              provider: providerLabel,
              model,
              tier: params.tier,
              latencyMs,
              usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                estimatedCostUsd: cost.usd,
                estimatedCostInr: cost.inr,
              },
              isAiGenerated: true,
              isStudentVerified: false,
              generatedAt: new Date(),
            },
          };
        } else {
          clearTimeout(timer);
          const status = openAiRes?.status || 500;
          const statusText = openAiRes?.statusText || "Service Unavailable";
          const errText = openAiRes ? await openAiRes.text().catch(() => "") : "";
          console.error(`[AiService] ${providerLabel} API returned status ${status}: ${errText}`);
          return {
            success: false,
            error: `${providerLabel} API returned HTTP ${status}: ${errText || statusText}`,
            metadata: {
              provider: providerLabel,
              model,
              tier: params.tier,
              latencyMs: Date.now() - params.startTime,
              usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                estimatedCostUsd: 0,
                estimatedCostInr: 0,
              },
              isAiGenerated: true,
              isStudentVerified: false,
              generatedAt: new Date(),
            },
          };
        }
      }

      clearTimeout(timer);
      return this.executeMockOperation<T>(params);
    } catch (err: unknown) {
      clearTimeout(timer);
      const isTimeout = (err as Error)?.name === "AbortError";
      const latencyMs = Date.now() - params.startTime;

      return {
        success: false,
        error: isTimeout
          ? `AI request timed out after ${this.timeoutMs}ms.`
          : `AI service error: ${(err as Error)?.message || "Unknown error"}`,
        metadata: {
          provider: params.provider,
          model: params.model,
          tier: params.tier,
          latencyMs,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCostUsd: 0,
            estimatedCostInr: 0,
          },
          isAiGenerated: true,
          isStudentVerified: false,
          generatedAt: new Date(),
        },
      };
    }
  }

  /**
   * Deterministic, domain-aware mock generator matching real schemas.
   * Produces realistic benchmarks across Nursing, Teaching, Commerce, IT, Law, Design, etc.
   */
  private executeMockOperation<T>(params: {
    request: AiTaskRequest;
    sanitizedContext: Record<string, unknown>;
    tier: AiModelTier;
    provider: string;
    model: string;
    startTime: number;
  }): AiTaskResponse<T> {
    const { request, sanitizedContext, tier, provider, model, startTime } = params;
    const domain = (request.studentContext.academicDomain as string) || "General Field";
    const role = (request.studentContext.targetRole as string) || "Professional Specialist";
    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 80 + 40);

    // Realistic token counts for benchmark calculation
    const inputTokens = 420 + Math.floor(Math.random() * 120);
    const outputTokens = 260 + Math.floor(Math.random() * 90);
    const cost = calculateCost(tier, inputTokens, outputTokens);

    const usage: AiTokenUsage = {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: cost.usd,
      estimatedCostInr: cost.inr,
    };

    let mockData: unknown = {};

    switch (request.operation) {
      case "EXTRACTION":
        mockData = {
          contactInfo: {
            name: (request.studentContext.name as string) || "Candidate Name",
            email: "candidate@careeredge.internal",
            phone: "+91 98765 43210",
            location: "Bengaluru, India",
          },
          summary: `Motivated ${role} with strong foundational skills in ${domain}.`,
          education: [
            {
              degree: "Bachelor of Engineering / B.Tech",
              institution: (request.studentContext.institution as string) || "Accredited University",
              startYear: "2020",
              endYear: "2024",
              score: "8.5 CGPA",
              bullets: [],
            },
          ],
          experience: [
            {
              title: role,
              company: "Technology Solutions Pvt Ltd",
              startDate: "06/2023",
              endDate: "12/2023",
              isCurrent: false,
              bullets: [
                "Engineered responsive components and optimized client-facing workflows.",
                "Collaborated with cross-functional teams to deliver production features.",
              ],
            },
          ],
          projects: [
            {
              title: "Portfolio & Application Platform",
              bullets: [
                "Developed scalable full-stack web application with modern frameworks.",
                "Implemented unit testing and continuous integration pipelines.",
              ],
            },
          ],
          skills: (request.studentContext.skills?.length ? request.studentContext.skills : ["JavaScript", "React", "Node.js", "SQL"]).map(
            (name) => ({ name, category: "TECHNICAL" })
          ),
          certifications: [
            {
              title: "Certified Professional Associate",
              issuer: "Industry Standards Organization",
              year: "2023",
            },
          ],
          customSections: [],
        };
        break;

      case "RESUME_REVIEW":
        mockData = {
          domain,
          targetRole: role,
          overallScore: 84,
          strengths: [
            `Verified academic foundation from accredited institution in ${domain}.`,
            "Practical coursework and relevant skills are clearly stated.",
          ],
          criticalGaps: [
            `Needs quantifiable outcome metrics for project entries relevant to ${role}.`,
            "Include official certifications or clinical/practical exposure documentation.",
          ],
          unsupportedClaims: [],
          recommendedKeywords: [
            "Domain Competencies",
            "Quality Assurance",
            "Standard Operating Procedures",
            "Cross-functional Collaboration",
          ],
        };
        break;

      case "TRUTH_CHECK":
        mockData = {
          verifiedClaimsCount: request.studentContext.skills.length,
          flaggedItems: [],
          integrityScore: 100,
          status: "PASSED",
          summary: "All resume statements trace directly to Career Passport records.",
        };
        break;

      case "ROLE_FIT":
        mockData = {
          domain,
          matchedRoles: [
            {
              roleTitle: role,
              fitType: "closer fit",
              whatYouHave: request.studentContext.skills.slice(0, 3),
              whatIsMissing: ["Advanced domain accreditation", "1 capstone project"],
              entryLevelPath: "Graduate Trainee / Associate Specialist",
            },
            {
              roleTitle: `Senior ${role}`,
              fitType: "stretch role",
              whatYouHave: request.studentContext.skills.slice(0, 2),
              whatIsMissing: ["2+ years specialized domain experience", "Independent case handling"],
              entryLevelPath: "Requires intermediate specialization first",
            },
          ],
        };
        break;

      case "CAREER_GUIDE":
        mockData = {
          answer: `For your background in ${domain}, your strongest next milestone is to generate tailored resumes in Resume Studio and verify your competencies with real-world applications.`,
          nextBestStep: "Open Resume Studio to generate ATS-optimized resumes.",
          actionRoute: "/resume/studio",
          citedSources: ["Student Profile", `${domain} Professional Reference Standards`],
        };
        break;

      default:
        mockData = {
          operation: request.operation,
          domain,
          targetRole: role,
          recommendation: `Verified guidance tailored for ${domain} - ${role}.`,
          sanitizedContext,
        };
    }

    return {
      success: true,
      data: mockData as T,
      metadata: {
        provider,
        model,
        tier,
        latencyMs,
        usage,
        isAiGenerated: true,
        isStudentVerified: false,
        generatedAt: new Date(),
      },
    };
  }
}

// Singleton export
export const aiService = new ServerAiService();
