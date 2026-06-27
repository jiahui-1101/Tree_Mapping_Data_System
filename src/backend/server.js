import express from "express";
import { fileURLToPath } from "node:url";
import {
  addTreeToVisitorCollection,
  answerVisitorChat,
  getVisitorAnalytics,
  getVisitorCollection,
  getVisitorTreeIdCard,
  listVisitorTreeProfiles,
  recommendVisitorRoute,
  recordVisitorScan,
} from "./visitorBackendService.js";

export function createApp() {
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
      trees: listVisitorTreeProfiles({
        language: request.query.language,
        query: request.query.query,
        zone: request.query.zone,
      }),
    });
  });

  app.get("/api/visitor/trees/:treeId", (request, response) => {
    sendResult(response, getVisitorTreeIdCard(request.params.treeId, {
      language: request.query.language,
      growthYears: request.query.growthYears,
    }));
  });

  app.post("/api/visitor/routes/recommend", (request, response) => {
    sendResult(response, recommendVisitorRoute(request.body));
  });

  app.post("/api/visitor/chat", (request, response) => {
    sendResult(response, answerVisitorChat(request.body));
  });

  app.get("/api/visitor/collection", (request, response) => {
    sendResult(response, getVisitorCollection({
      sessionId: sessionId(request),
      language: request.query.language,
    }));
  });

  app.post("/api/visitor/collection", (request, response) => {
    sendResult(response, addTreeToVisitorCollection({
      sessionId: sessionId(request),
      treeId: request.body.treeId,
      language: request.body.language,
    }));
  });

  app.post("/api/visitor/scans", (request, response) => {
    sendResult(response, recordVisitorScan({
      sessionId: sessionId(request),
      treeId: request.body.treeId,
      language: request.body.language,
      source: request.body.source,
    }));
  });

  app.get("/api/visitor/analytics/scans", (_request, response) => {
    response.json(getVisitorAnalytics());
  });

  app.use((request, response) => {
    response.status(404).json({ ok: false, error: "NOT_FOUND", message: `No backend route for ${request.method} ${request.path}` });
  });

  return app;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT) || 4174;
  createApp().listen(port, () => {
    console.log(`TBJ SS3 backend listening on http://localhost:${port}`);
  });
}
