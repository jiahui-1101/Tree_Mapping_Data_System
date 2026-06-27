import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const ENV_PATH = path.resolve(process.cwd(), ".env");

function loadLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...parts] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = parts.join("=").trim();
  }
}

loadLocalEnv();

export const databaseConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tree_mapping_m1c",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

export const pool = mysql.createPool(databaseConfig);

export async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return {
      ok: true,
      database: databaseConfig.database,
      host: databaseConfig.host,
      port: databaseConfig.port,
    };
  } finally {
    connection.release();
  }
}
