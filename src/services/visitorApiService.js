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
