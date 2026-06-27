import path from "node:path";

export const DEFAULT_BACKEND_PORT = 4174;

export function getBackendConfig(env = process.env) {
  return {
    port: Number(env.PORT) || DEFAULT_BACKEND_PORT,
    visitorStorePath: env.SS3_VISITOR_STORE_PATH || path.join(process.cwd(), ".runtime", "ss3-visitor-store.json"),
    aiProvider: (env.SS3_AI_PROVIDER || "mock").toLowerCase(),
    aiTimeoutMs: Number(env.SS3_AI_TIMEOUT_MS) || 8000,
    geminiApiKey: env.GEMINI_API_KEY || "",
    geminiModel: env.GEMINI_MODEL || "gemini-1.5-flash",
    openaiApiKey: env.OPENAI_API_KEY || "",
    openaiModel: env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

