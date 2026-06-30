import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_STATE = Object.freeze({
  sessions: {},
  collections: {},
  scans: [],
  chatLogs: [],
  routePlans: [],
});

function cloneState(state = DEFAULT_STATE) {
  return {
    collections: Object.fromEntries(Object.entries(state.collections || {}).map(([sessionId, treeIds]) => [sessionId, [...new Set(treeIds || [])]])),
    scans: [...(state.scans || [])],
    chatLogs: [...(state.chatLogs || [])],
    routePlans: [...(state.routePlans || [])],
  };
}

function nextId(prefix, records, key) {
  const max = records.reduce((current, record) => {
    const value = Number(String(record[key] || "").match(/(\d+)$/)?.[1] || 0);
    return Math.max(current, value);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function createVisitorStore({ filePath, persist = true, initialState } = {}) {
  let loaded = false;
  let state = cloneState(initialState);

  async function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    if (!persist || !filePath) return;
    try {
      const raw = await fs.readFile(filePath, "utf8");
      state = cloneState(JSON.parse(raw));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async function save() {
    if (!persist || !filePath) return;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
  }

  return {
    async reset(nextState = DEFAULT_STATE) {
      loaded = true;
      state = cloneState(nextState);
      await save();
    },

    async getCollection(sessionId) {
      await ensureLoaded();
      return [...new Set(state.collections[sessionId] || [])];
    },

    async addCollectionTree(sessionId, treeId) {
      await ensureLoaded();
      const current = new Set(state.collections[sessionId] || []);
      const isNew = !current.has(treeId);
      current.add(treeId);
      state.collections[sessionId] = [...current];
      await save();
      return { treeIds: state.collections[sessionId], isNew };
    },

    async recordScan(event) {
      await ensureLoaded();
      const stored = {
        scanId: nextId("VSE", state.scans, "scanId"),
        ...event,
        scannedAt: event.scannedAt || new Date().toISOString(),
      };
      state.scans.unshift(stored);
      await save();
      return stored;
    },

    async recordChat(log) {
      await ensureLoaded();
      const stored = {
        chatId: nextId("VCL", state.chatLogs, "chatId"),
        ...log,
        askedAt: log.askedAt || new Date().toISOString(),
      };
      state.chatLogs.unshift(stored);
      await save();
      return stored;
    },

    async recordRoutePlan(plan) {
      await ensureLoaded();
      const stored = {
        routeId: nextId("VR", state.routePlans, "routeId"),
        ...plan,
        generatedAt: plan.generatedAt || new Date().toISOString(),
      };
      state.routePlans.unshift(stored);
      await save();
      return stored;
    },

    async getAnalytics() {
      await ensureLoaded();
      const byZone = state.scans.reduce((totals, event) => {
        totals[event.zone] = (totals[event.zone] || 0) + 1;
        return totals;
      }, {});
      const byTree = state.scans.reduce((totals, event) => {
        totals[event.treeId] = (totals[event.treeId] || 0) + 1;
        return totals;
      }, {});
      return {
        totalScans: state.scans.length,
        totalChatQuestions: state.chatLogs.length,
        totalRoutePlans: state.routePlans.length,
        byZone,
        byTree,
        events: [...state.scans],
        chatLogs: [...state.chatLogs],
        routePlans: [...state.routePlans],
      };
    },
  };
}

