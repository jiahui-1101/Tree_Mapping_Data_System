import express from "express";
import { fileURLToPath } from "node:url";
import { getBackendConfig } from "./backendConfig.js";
import { createItSupportBackend } from "./itSupportBackendService.js";
import { createMaintenanceBackend } from "./maintenanceBackendService.js";
import { createSs4Backend } from "./ss4BackendService.js";
import { createVisitorBackend } from "./visitorBackendService.js";

export function createApp({
  backend = createVisitorBackend(),
  maintenanceBackend = createMaintenanceBackend({ config: { ...getBackendConfig(), maintenanceStore: "memory" } }),
  ss4Backend = createSs4Backend({ config: getBackendConfig() }),
  itSupportBackend = createItSupportBackend({ config: getBackendConfig() }),
} = {}) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Visitor-Session");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    return next();
  });

  const sendResult = (response, result) => response.status(result.status || (result.ok === false ? 400 : 200)).json(result);
  const asyncRoute = (handler) => async (request, response, next) => {
    try {
      await handler(request, response);
    } catch (error) {
      next(error);
    }
  };
  const sessionId = (request) => request.headers["x-visitor-session"] || request.query.sessionId || request.body?.sessionId;
  const requireVisitorSession = async (request, response) => {
    const result = await backend.validateVisitorSession(sessionId(request));
    if (result.ok) return result.session;
    sendResult(response, result);
    return null;
  };
  const badRequest = (response, message, error = "VALIDATION_ERROR") => response.status(400).json({ ok: false, error, message });
  const requireBody = (request, response, requiredFields = []) => {
    if (!request.body || typeof request.body !== "object") {
      badRequest(response, "Request body must be a JSON object.");
      return false;
    }
    const missing = requiredFields.filter((field) => request.body[field] === undefined || request.body[field] === "");
    if (missing.length) {
      badRequest(response, `Missing required field: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  app.get("/", (_request, response) => {
    response.json({
      ok: true,
      service: "Tree Mapping Data System Backend",
      modules: {
        visitor: ["/api/visitor/profiles", "/api/visitor/chat", "/api/visitor/routes/recommend"],
        maintenance: ["/api/predictive-alerts", "/api/tasks", "POST /api/predictive-alerts/ALT-001/approve"],
        ss4: ["/api/ss4/map", "/api/ss4/qr-scans", "/api/ss4/spatial/simulate", "/api/ss4/audit-logs"],
        itSupport: ["/api/it-support/dashboard", "/api/it-support/services", "/api/it-support/users", "/api/it-support/tickets"],
      },
    });
  });

  app.get("/api/health", asyncRoute(async (_request, response) => {
    response.json({
      ok: true,
      service: "Tree Mapping Data System Backend",
      modules: [
        "M1-C Predictive Maintenance Scheduler",
        "M3-A Digital Tree ID Card",
        "M3-B AI Plant Chatbot",
        "M3-C Exploration Collection",
        "M3-D Preference Route Recommender",
        "M3-E Multilingual Interface",
      ],
      maintenance: await maintenanceBackend.health(),
      ss4: await ss4Backend.health(),
      itSupport: await itSupportBackend.health(),
    });
  }));

  app.get("/api/predictive-alerts", asyncRoute(async (_request, response) => {
    response.json({ ok: true, data: await maintenanceBackend.listAlerts() });
  }));

  app.get("/api/predictive-alerts/:alertId", asyncRoute(async (request, response) => {
    const alert = await maintenanceBackend.findAlert(request.params.alertId);
    if (!alert) return response.status(404).json({ ok: false, error: "ALERT_NOT_FOUND", message: "Predictive alert not found." });
    return response.json({ ok: true, data: alert });
  }));

  app.post("/api/predictive-alerts/generate", asyncRoute(async (_request, response) => {
    sendResult(response, await maintenanceBackend.generateAlertsFromTrees());
  }));

  app.patch("/api/predictive-alerts/:alertId/status", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["status"])) return;
    sendResult(response, await maintenanceBackend.updateAlertStatus(request.params.alertId, request.body.status));
  }));

  app.post("/api/predictive-alerts/:alertId/approve", asyncRoute(async (request, response) => {
    sendResult(response, await maintenanceBackend.approveAlert(request.params.alertId, request.body?.ranger || "Ahmad Razif"));
  }));

  app.get("/api/tasks", asyncRoute(async (_request, response) => {
    response.json({ ok: true, data: await maintenanceBackend.listTasks() });
  }));

  app.post("/api/dev/reset", asyncRoute(async (_request, response) => {
    sendResult(response, await maintenanceBackend.reset());
  }));

  app.post("/api/visitor/sessions", asyncRoute(async (request, response) => {
    sendResult(response, await backend.createGuestVisitorSession({
      language: request.body?.language,
      displayName: request.body?.displayName,
    }));
  }));

  app.get("/api/visitor/profiles", (request, response) => {
    response.json({
      ok: true,
      trees: backend.listVisitorTreeProfiles({
        language: request.query.language,
        query: request.query.query,
        zone: request.query.zone,
      }),
    });
  });

  app.get("/api/visitor/trees/:treeId", (request, response) => {
    if (!/^TBJ-\d{3}$/i.test(request.params.treeId)) {
      return badRequest(response, "Tree ID must use the format TBJ-001.");
    }
    sendResult(response, backend.getVisitorTreeIdCard(request.params.treeId, {
      language: request.query.language,
      growthYears: request.query.growthYears,
    }));
  });

  app.post("/api/visitor/routes/recommend", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["preferences"])) return;
    if (!Array.isArray(request.body.preferences)) {
      return badRequest(response, "preferences must be an array.");
    }
    const visitorSession = await requireVisitorSession(request, response);
    if (!visitorSession) return;
    sendResult(response, await backend.recommendVisitorRoute({
      ...request.body,
      sessionId: visitorSession.sessionId,
    }));
  }));

  app.post("/api/visitor/chat", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["question"])) return;
    const visitorSession = await requireVisitorSession(request, response);
    if (!visitorSession) return;
    sendResult(response, await backend.answerVisitorChat({
      ...request.body,
      sessionId: visitorSession.sessionId,
    }));
  }));

  app.get("/api/visitor/collection", asyncRoute(async (request, response) => {
    const visitorSession = await requireVisitorSession(request, response);
    if (!visitorSession) return;
    sendResult(response, await backend.getVisitorCollection({
      sessionId: visitorSession.sessionId,
      language: request.query.language,
    }));
  }));

  app.post("/api/visitor/collection", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["treeId"])) return;
    const visitorSession = await requireVisitorSession(request, response);
    if (!visitorSession) return;
    sendResult(response, await backend.addTreeToVisitorCollection({
      sessionId: visitorSession.sessionId,
      treeId: request.body.treeId,
      language: request.body.language,
    }));
  }));

  app.post("/api/visitor/scans", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["treeId"])) return;
    sendResult(response, await backend.recordVisitorScan({
      sessionId: sessionId(request),
      treeId: request.body.treeId,
      language: request.body.language,
      source: request.body.source,
    }));
  }));

  app.get("/api/visitor/analytics/scans", asyncRoute(async (_request, response) => {
    response.json(await backend.getVisitorAnalytics());
  }));

  app.get("/api/visitor/integrations/ss4/qr-scan-events", asyncRoute(async (_request, response) => {
    response.json(await backend.getSs4QrScanEvents());
  }));

  app.get("/api/ss4/map", asyncRoute(async (request, response) => {
    response.json(await ss4Backend.getMapPayload({ role: request.query.role }));
  }));

  app.get("/api/ss4/layers", (request, response) => {
    response.json(ss4Backend.getLayerConfig({ role: request.query.role }));
  });

  app.get("/api/ss4/qr-codes", asyncRoute(async (_request, response) => {
    response.json(await ss4Backend.listQrCodes());
  }));

  app.get("/api/ss4/qr-scans", asyncRoute(async (_request, response) => {
    response.json(await ss4Backend.listQrScanEvents());
  }));

  app.post("/api/ss4/qr-scans", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["role"])) return;
    sendResult(response, await ss4Backend.recordQrScan(request.body));
  }));

  app.post("/api/ss4/spatial/simulate", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["point", "species", "targetZone"])) return;
    sendResult(response, await ss4Backend.simulateSpatialPlan(request.body));
  }));

  app.post("/api/ss4/spatial/confirm", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["point", "species", "targetZone"])) return;
    sendResult(response, await ss4Backend.confirmSpatialPlan(request.body));
  }));

  app.get("/api/ss4/spatial/plans", asyncRoute(async (_request, response) => {
    response.json(await ss4Backend.listSpatialPlans());
  }));

  app.get("/api/ss4/analytics/heatmap", asyncRoute(async (_request, response) => {
    response.json(await ss4Backend.getVisitorHeatmap());
  }));

  app.get("/api/ss4/audit-logs", asyncRoute(async (_request, response) => {
    response.json(await ss4Backend.getAuditLogs());
  }));

  app.get("/api/ss4/security-alerts", asyncRoute(async (_request, response) => {
    response.json(await ss4Backend.getSecurityAlerts());
  }));

  app.get("/api/it-support/dashboard", asyncRoute(async (_request, response) => {
    response.json(await itSupportBackend.getDashboard());
  }));

  app.get("/api/it-support/services", asyncRoute(async (_request, response) => {
    response.json(await itSupportBackend.listServices());
  }));

  app.get("/api/it-support/services/:serviceId/logs", asyncRoute(async (request, response) => {
    response.json(await itSupportBackend.getServiceLogs(request.params.serviceId));
  }));

  app.post("/api/it-support/services/:serviceId/actions", asyncRoute(async (request, response) => {
    sendResult(response, await itSupportBackend.runServiceAction({
      serviceId: request.params.serviceId,
      action: request.body?.action,
      actor: request.body?.actor,
    }));
  }));

  app.get("/api/it-support/users", asyncRoute(async (_request, response) => {
    response.json(await itSupportBackend.listUsers());
  }));

  app.patch("/api/it-support/users/:userId/access", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["action"])) return;
    sendResult(response, await itSupportBackend.updateUserAccess({
      userId: request.params.userId,
      action: request.body.action,
      actor: request.body.actor,
    }));
  }));

  app.get("/api/it-support/tickets", asyncRoute(async (_request, response) => {
    response.json(await itSupportBackend.listTickets());
  }));

  app.post("/api/it-support/tickets", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["title"])) return;
    sendResult(response, await itSupportBackend.createTicket(request.body));
  }));

  app.patch("/api/it-support/tickets/:ticketId", asyncRoute(async (request, response) => {
    sendResult(response, await itSupportBackend.updateTicket({
      ticketId: request.params.ticketId,
      patch: request.body || {},
      actor: request.body?.actor,
    }));
  }));

  app.use((request, response) => {
    response.status(404).json({ ok: false, error: "NOT_FOUND", message: `No backend route for ${request.method} ${request.path}` });
  });

  app.use((error, _request, response, _next) => {
    response.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: error.message || "Unexpected backend error",
    });
  });

  return app;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const config = getBackendConfig();
  createApp({
    backend: createVisitorBackend({ config }),
    maintenanceBackend: createMaintenanceBackend({ config }),
    ss4Backend: createSs4Backend({ config }),
    itSupportBackend: createItSupportBackend({ config }),
  }).listen(config.port, () => {
    console.log(`TBJ shared backend listening on http://localhost:${config.port}`);
  });
}
