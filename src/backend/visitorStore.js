import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_STATE = Object.freeze({
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
