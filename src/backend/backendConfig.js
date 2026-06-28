import fs from "node:fs";
import path from "node:path";

export const DEFAULT_BACKEND_PORT = 4174;

function loadLocalEnv(env = process.env) {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...parts] = trimmed.split("=");
    if (!env[key]) env[key] = parts.join("=").trim();
  }
}

export function getBackendConfig(env = process.env) {
  loadLocalEnv(env);
  return {
    port: Number(env.PORT) || DEFAULT_BACKEND_PORT,
    visitorStorePath: env.SS3_VISITOR_STORE_PATH || path.join(process.cwd(), ".runtime", "ss3-visitor-store.json"),
    aiProvider: (env.SS3_AI_PROVIDER || "mock").toLowerCase(),
    aiTimeoutMs: Number(env.SS3_AI_TIMEOUT_MS) || 8000,
    geminiApiKey: env.GEMINI_API_KEY || "",
    geminiModel: env.GEMINI_MODEL || "gemini-1.5-flash",
    openaiApiKey: env.OPENAI_API_KEY || "",
    openaiModel: env.OPENAI_MODEL || "gpt-4o-mini",
    maintenanceStore: (env.M1C_MAINTENANCE_STORE || env.BACKEND_STORE || "memory").toLowerCase(),
    maintenanceDatabase: {
      host: env.DB_HOST || "127.0.0.1",
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER || "root",
      password: env.DB_PASSWORD || "",
      database: env.DB_NAME || "tree_mapping_data_system",
      waitForConnections: true,
      connectionLimit: Number(env.DB_CONNECTION_LIMIT || 10),
    },
  };
}

