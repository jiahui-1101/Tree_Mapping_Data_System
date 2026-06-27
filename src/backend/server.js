import express from "express";
import { fileURLToPath } from "node:url";
import { getBackendConfig } from "./backendConfig.js";
import { createVisitorBackend } from "./visitorBackendService.js";

export function createApp({ backend = createVisitorBackend() } = {}) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Visitor-Session");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
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

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      service: "TBJ Visitor Engagement Backend",
      subsystem: "SS3",
      modules: ["M3-A Digital Tree ID Card", "M3-B AI Plant Chatbot", "M3-C Exploration Collection", "M3-D Preference Route Recommender", "M3-E Multilingual Interface"],
    });
  });

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
    sendResult(response, backend.getVisitorTreeIdCard(request.params.treeId, {
      language: request.query.language,
      growthYears: request.query.growthYears,
    }));
  });

  app.post("/api/visitor/routes/recommend", asyncRoute(async (request, response) => {
    sendResult(response, await backend.recommendVisitorRoute({
      ...request.body,
      sessionId: sessionId(request),
    }));
  }));

  app.post("/api/visitor/chat", asyncRoute(async (request, response) => {
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
    sendResult(response, await backend.addTreeToVisitorCollection({
      sessionId: sessionId(request),
      treeId: request.body.treeId,
      language: request.body.language,
    }));
  }));

  app.post("/api/visitor/scans", asyncRoute(async (request, response) => {
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
  createApp({ backend: createVisitorBackend({ config }) }).listen(config.port, () => {
    console.log(`TBJ SS3 backend listening on http://localhost:${config.port}`);
  });
}
