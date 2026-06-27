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
