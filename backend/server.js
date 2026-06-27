import http from "node:http";
import { URL } from "node:url";
import {
  approveAlert,
  findAlert,
  generateAlertsFromTrees,
  listAlerts,
  listTasks,
  resetStore,
  updateAlertStatus,
} from "./maintenanceStore.js";

const PORT = Number(process.env.PORT || 4001);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

async function handleRequest(request, response) {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});

  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, { ok: true, service: "M1-C Predictive Maintenance Backend" });
  }

  if (request.method === "GET" && url.pathname === "/api/predictive-alerts") {
    return sendJson(response, 200, { data: listAlerts() });
  }

  if (request.method === "GET" && pathParts[0] === "api" && pathParts[1] === "predictive-alerts" && pathParts[2]) {
    const alert = findAlert(pathParts[2]);
    if (!alert) return sendJson(response, 404, { error: "Predictive alert not found." });
    return sendJson(response, 200, { data: alert });
  }

  if (request.method === "POST" && url.pathname === "/api/predictive-alerts/generate") {
    const generated = generateAlertsFromTrees();
    return sendJson(response, 201, { data: generated, count: generated.length });
  }

  if (request.method === "PATCH" && pathParts[0] === "api" && pathParts[1] === "predictive-alerts" && pathParts[2] && pathParts[3] === "status") {
    const body = await readBody(request);
    const alert = updateAlertStatus(pathParts[2], body.status);
    return sendJson(response, 200, { data: alert });
  }

  if (request.method === "POST" && pathParts[0] === "api" && pathParts[1] === "predictive-alerts" && pathParts[2] && pathParts[3] === "approve") {
    const body = await readBody(request);
    const result = approveAlert(pathParts[2], body.ranger || "Ahmad Razif");
    return sendJson(response, 201, { data: result });
  }

  if (request.method === "GET" && url.pathname === "/api/tasks") {
    return sendJson(response, 200, { data: listTasks() });
  }

  if (request.method === "POST" && url.pathname === "/api/dev/reset") {
    return sendJson(response, 200, { data: resetStore() });
  }

  return sendJson(response, 404, { error: "Route not found." });
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, error.statusCode || 500, { error: error.message || "Internal server error." });
  });
});

server.listen(PORT, () => {
  console.log(`M1-C backend running at http://localhost:${PORT}`);
  console.log("Try GET /api/predictive-alerts or POST /api/predictive-alerts/ALT-001/approve");
});
