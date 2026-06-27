import { getPublicTreeCard } from "../data/visitorTreeProfiles.js";
import { TREES } from "../data/trees.js";
import { buildVisitorRoute } from "./mockTreeService.js";
import { visitorText } from "./visitorI18n.js";

const API_BASE = import.meta.env.VITE_SS3_API_BASE || "http://localhost:4174";
const SESSION_KEY = "tbj.visitor.session";

function getStorage(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined") return window.localStorage;
  return null;
}

export function getVisitorSessionId(storage) {
  const source = getStorage(storage);
  const existing = source?.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  source?.setItem(SESSION_KEY, id);
  return id;
}

async function requestVisitorApi(path, { method = "GET", body, sessionId = getVisitorSessionId() } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Visitor-Session": sessionId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || payload.error || "Visitor backend request failed");
  }
  return payload;
}

export async function recommendRouteFromBackend({ preferences, duration, language, trees = TREES }) {
  try {
    const payload = await requestVisitorApi("/api/visitor/routes/recommend", {
      method: "POST",
      body: { preferences, duration, language },
    });
    return {
      ok: true,
      ...payload,
      route: payload.stops || [],
      source: payload.fallback ? "backend-fallback" : "backend",
    };
  } catch {
    const fallback = buildVisitorRoute(preferences, trees);
    if (!fallback.ok) return { ...fallback, message: visitorText(language, "explore.validation"), source: "local" };
    return { ...fallback, estimatedDuration: duration, source: "local" };
  }
}

export async function askVisitorChatBackend({ question, language }) {
  try {
    return await requestVisitorApi("/api/visitor/chat", {
      method: "POST",
      body: { question, language },
    });
  } catch {
    return null;
  }
}

export async function collectVisitorTreeBackend({ tree, language }) {
  try {
    return await requestVisitorApi("/api/visitor/collection", {
      method: "POST",
      body: { treeId: tree.id, language },
    });
  } catch {
    return null;
  }
}

export async function recordVisitorScanBackend({ tree, language, source = "qr" }) {
  try {
    return await requestVisitorApi("/api/visitor/scans", {
      method: "POST",
      body: { treeId: tree.id, language, source },
    });
  } catch {
    return null;
  }
}

export async function fetchVisitorTreeCard({ tree, language, growthYears = 10 }) {
  try {
    return await requestVisitorApi(`/api/visitor/trees/${tree.id}?language=${encodeURIComponent(language)}&growthYears=${growthYears}`);
  } catch {
    return {
      ok: true,
      tree: getPublicTreeCard(tree, language),
      growthSimulation: null,
      source: "local",
    };
  }
}

