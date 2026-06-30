import { getPublicTreeCard } from "../data/visitorTreeProfiles.js";
import { TREES } from "../data/trees.js";
import { buildVisitorRoute } from "./mockTreeService.js";
import { visitorText } from "./visitorI18n.js";

const API_BASE = import.meta.env.VITE_SS3_API_BASE || "http://localhost:4174";
const SESSION_KEY = "tbj.visitor.session";
const SESSION_META_KEY = "tbj.visitor.session.meta";

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

function saveVisitorSession(session, storage) {
  const source = getStorage(storage);
  if (!session?.sessionId || !source) return session?.sessionId || "";
  source.setItem(SESSION_KEY, session.sessionId);
  source.setItem(SESSION_META_KEY, JSON.stringify(session));
  return session.sessionId;
}

export async function createVisitorGuestSession({ language = "en", displayName = "Guest Visitor", storage } = {}) {
  const response = await fetch(`${API_BASE}/api/visitor/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, displayName }),
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || payload.error || "Visitor session request failed");
  }
  return saveVisitorSession(payload.session, storage);
}

async function getVisitorBackendSessionId({ language, storage } = {}) {
  const source = getStorage(storage);
  const existing = source?.getItem(SESSION_KEY);
  if (existing?.startsWith("vst_")) return existing;
  try {
    return await createVisitorGuestSession({ language, storage });
  } catch {
    return getVisitorSessionId(storage);
  }
}

async function requestVisitorApi(path, { method = "GET", body, sessionId, language, requireSession = true } = {}) {
  const visitorSessionId = requireSession
    ? sessionId || await getVisitorBackendSessionId({ language: language || body?.language })
    : sessionId;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(visitorSessionId ? { "X-Visitor-Session": visitorSessionId } : {}),
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

export async function fetchVisitorProfiles({ language, query = "", zone = "all", trees = TREES }) {
  try {
    const params = new URLSearchParams({ language, query, zone });
    const payload = await requestVisitorApi(`/api/visitor/profiles?${params.toString()}`);
    return {
      ok: true,
      profiles: payload.trees || [],
      source: "backend",
    };
  } catch {
    return {
      ok: true,
      profiles: trees.map((tree) => getPublicTreeCard(tree, language)),
      source: "local",
    };
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
