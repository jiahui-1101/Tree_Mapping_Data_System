import { URL } from "node:url";
import { readJsonBody, sendJson } from "../utils/http.js";
import {
  approveAlert,
  findAlert,
  generateAlertsFromTrees,
  health,
  listAlerts,
  listTasks,
  resetStore,
  storeMode,
  updateAlertStatus,
} from "../repositories/index.js";

export const maintenanceEndpoints = {
  health: "/api/health",
  predictiveAlerts: "/api/predictive-alerts",
  tasks: "/api/tasks",
  generateAlerts: "POST /api/predictive-alerts/generate",
  approveAlert: "POST /api/predictive-alerts/ALT-001/approve",
};

export async function handleMaintenanceRoutes(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "M1-C Predictive Maintenance Backend",
      store: storeMode,
      database: await health(),
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/predictive-alerts") {
    sendJson(response, 200, { data: await listAlerts() });
    return true;
  }

  if (request.method === "GET" && pathParts[0] === "api" && pathParts[1] === "predictive-alerts" && pathParts[2]) {
    const alert = await findAlert(pathParts[2]);
    if (!alert) {
      sendJson(response, 404, { error: "Predictive alert not found." });
      return true;
    }
    sendJson(response, 200, { data: alert });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/predictive-alerts/generate") {
    const generated = await generateAlertsFromTrees();
    sendJson(response, 201, { data: generated, count: generated.length });
    return true;
  }

  if (request.method === "PATCH" && pathParts[0] === "api" && pathParts[1] === "predictive-alerts" && pathParts[2] && pathParts[3] === "status") {
    const body = await readJsonBody(request);
    const alert = await updateAlertStatus(pathParts[2], body.status);
    sendJson(response, 200, { data: alert });
    return true;
  }

  if (request.method === "POST" && pathParts[0] === "api" && pathParts[1] === "predictive-alerts" && pathParts[2] && pathParts[3] === "approve") {
    const body = await readJsonBody(request);
    const result = await approveAlert(pathParts[2], body.ranger || "Ahmad Razif");
    sendJson(response, 201, { data: result });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/tasks") {
    sendJson(response, 200, { data: await listTasks() });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/dev/reset") {
    sendJson(response, 200, { data: await resetStore() });
    return true;
  }

  return false;
}
