import express from "express";
import { fileURLToPath } from "node:url";
import { getBackendConfig } from "./backendConfig.js";
import { createFieldBackend } from "./fieldBackendService.js";
import { createMaintenanceBackend } from "./maintenanceBackendService.js";
import { createVisitorBackend } from "./visitorBackendService.js";

export function createApp({
  backend = createVisitorBackend(),
  fieldBackend = createFieldBackend(),
  maintenanceBackend = createMaintenanceBackend({ config: { ...getBackendConfig(), maintenanceStore: "memory" } }),
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
        field: ["/api/ss2/tasks", "/api/ss2/reports", "/api/ss2/rangers"],
        visitor: ["/api/visitor/profiles", "/api/visitor/chat", "/api/visitor/routes/recommend"],
        maintenance: ["/api/predictive-alerts", "/api/tasks", "POST /api/predictive-alerts/ALT-001/approve"],
      },
    });
  });

  app.get("/api/health", asyncRoute(async (_request, response) => {
    response.json({
      ok: true,
      service: "Tree Mapping Data System Backend",
      modules: [
        "M1-C Predictive Maintenance Scheduler",
        "SS2 Scheduling & Field Task Management",
        "M3-A Digital Tree ID Card",
        "M3-B AI Plant Chatbot",
        "M3-C Exploration Collection",
        "M3-D Preference Route Recommender",
        "M3-E Multilingual Interface",
      ],
      field: await fieldBackend.health(),
      maintenance: await maintenanceBackend.health(),
    });
  }));

  app.get("/api/ss2/dashboard", asyncRoute(async (_request, response) => {
    response.json(await fieldBackend.getDashboard());
  }));

  app.get("/api/ss2/rangers", asyncRoute(async (request, response) => {
    response.json({ ok: true, data: await fieldBackend.listRangers({ status: request.query.status || "all" }) });
  }));

  app.post("/api/ss2/rangers", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["name"])) return;
    sendResult(response, await fieldBackend.upsertRanger(request.body));
  }));

  app.get("/api/ss2/tasks", asyncRoute(async (request, response) => {
    response.json({ ok: true, data: await fieldBackend.listTasks(request.query) });
  }));

  app.get("/api/ss2/tasks/:taskId", asyncRoute(async (request, response) => {
    const task = await fieldBackend.findTask(request.params.taskId);
    if (!task) return response.status(404).json({ ok: false, error: "TASK_NOT_FOUND", message: "Field task not found." });
    return response.json({ ok: true, data: task });
  }));

  app.post("/api/ss2/tasks", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["title", "ranger"])) return;
    sendResult(response, await fieldBackend.createTask(request.body));
  }));

  app.patch("/api/ss2/tasks/:taskId/status", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["status"])) return;
    sendResult(response, await fieldBackend.updateTaskStatus(request.params.taskId, request.body.status));
  }));

  app.get("/api/ss2/reports", asyncRoute(async (request, response) => {
    response.json({ ok: true, data: await fieldBackend.listReports(request.query) });
  }));

  app.post("/api/ss2/reports", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["treeId", "rangerName", "draft"])) return;
    sendResult(response, await fieldBackend.createReport(request.body));
  }));

  app.post("/api/ss2/photo-analysis", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["treeId", "photoName"])) return;
    sendResult(response, await fieldBackend.analyzePhoto(request.body));
  }));

  app.post("/api/ss2/dev/reset", asyncRoute(async (_request, response) => {
    sendResult(response, await fieldBackend.reset());
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
    sendResult(response, await backend.recommendVisitorRoute({
      ...request.body,
      sessionId: sessionId(request),
    }));
  }));

  app.post("/api/visitor/chat", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["question"])) return;
    sendResult(response, await backend.answerVisitorChat({
      ...request.body,
      sessionId: sessionId(request),
    }));
  }));

  app.get("/api/visitor/collection", asyncRoute(async (request, response) => {
    sendResult(response, await backend.getVisitorCollection({
      sessionId: sessionId(request),
      language: request.query.language,
    }));
  }));

  app.post("/api/visitor/collection", asyncRoute(async (request, response) => {
    if (!requireBody(request, response, ["treeId"])) return;
    sendResult(response, await backend.addTreeToVisitorCollection({
      sessionId: sessionId(request),
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
    fieldBackend: createFieldBackend({ config }),
    maintenanceBackend: createMaintenanceBackend({ config }),
  }).listen(config.port, () => {
    console.log(`TBJ shared backend listening on http://localhost:${config.port}`);
  });
}
