import fs from "node:fs/promises";
import path from "node:path";
import { TREES } from "../data/trees.js";
import { AUDIT_LOGS } from "../data/auditLogs.js";
import {
  MAP_LANDMARKS,
  MAP_ZONES,
  TBJ_GOOGLE_MAPS_URL,
  TBJ_MAP_FACTS,
  TBJ_OFFICIAL_CONTEXT,
  TBJ_OFFICIAL_SOURCE_URL,
  TBJ_STAKEHOLDER_PLOTS,
  percentToWorldPosition,
} from "../data/gardenMap.js";
import {
  QRCODES,
  QR_SCAN_EVENTS,
  SPATIAL_PLANNING_RECORDS,
  VISITOR_HEATMAP_AGGREGATES,
} from "../data/ss4Operations.js";
import { ROLE } from "../models.js";
import { maskTreeForRole } from "../services/mockTreeService.js";
import { getBackendConfig } from "./backendConfig.js";

const DEFAULT_STATE = Object.freeze({
  qrCodes: QRCODES,
  qrScanEvents: QR_SCAN_EVENTS,
  spatialPlanningRecords: SPATIAL_PLANNING_RECORDS,
  visitorHeatmapAggregates: VISITOR_HEATMAP_AGGREGATES,
  auditLogs: AUDIT_LOGS,
  securityAlerts: [
    {
      alertId: "SEC-001",
      alertType: "Repeated_Failed_Login",
      severity: "high",
      status: "open",
      detail: "3 failed PIN attempts - account temporarily locked",
      createdAt: "Yesterday 18:22",
    },
  ],
});

const ROLE_RANK = {
  [ROLE.VISITOR]: 1,
  [ROLE.RANGER]: 2,
  [ROLE.ADMIN]: 3,
  [ROLE.IT_SUPPORT]: 3,
};

const MAP_LAYER_CONFIG = [
  { layerId: "health", layerLabel: "Health Status", dataSource: "SS1 Tree.health_status", minRole: ROLE.VISITOR, isDefault: true, sortOrder: 1 },
  { layerId: "tasks", layerLabel: "Field Tasks", dataSource: "SS2 Tasks and FieldReports", minRole: ROLE.RANGER, isDefault: false, sortOrder: 2 },
  { layerId: "stakeholder", layerLabel: "Stakeholder Plots", dataSource: "SS4 MapZones and StakeholderPlots", minRole: ROLE.ADMIN, isDefault: false, sortOrder: 3 },
  { layerId: "collections", layerLabel: "Plant Collections", dataSource: "Stakeholder inventory documents", minRole: ROLE.ADMIN, isDefault: false, sortOrder: 4 },
  { layerId: "visitors", layerLabel: "Visitor Activity", dataSource: "SS3 VisitorScanEvents", minRole: ROLE.ADMIN, isDefault: false, sortOrder: 5 },
];

function cloneState(state = DEFAULT_STATE) {
  return {
    qrCodes: state.qrCodes.map((item) => ({ ...item })),
    qrScanEvents: state.qrScanEvents.map((item) => ({ ...item })),
    spatialPlanningRecords: state.spatialPlanningRecords.map((item) => ({ ...item })),
    visitorHeatmapAggregates: state.visitorHeatmapAggregates.map((item) => ({ ...item })),
    auditLogs: state.auditLogs.map((item) => ({ ...item })),
    securityAlerts: state.securityAlerts.map((item) => ({ ...item })),
  };
}

function nextId(prefix, records, key) {
  const max = records.reduce((highest, record) => {
    const value = Number(String(record[key] || "").match(/(\d+)$/)?.[1] || 0);
    return Math.max(highest, value);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeRole(role = ROLE.VISITOR) {
  const normalized = String(role || ROLE.VISITOR).trim().toLowerCase();
  const aliases = {
    admin: ROLE.ADMIN,
    administrator: ROLE.ADMIN,
    ranger: ROLE.RANGER,
    visitor: ROLE.VISITOR,
    guest: ROLE.VISITOR,
    "it support": ROLE.IT_SUPPORT,
    "it-support": ROLE.IT_SUPPORT,
    it: ROLE.IT_SUPPORT,
  };
  return aliases[normalized] || ROLE.VISITOR;
}

function canAccessLayer(role, minRole) {
  return (ROLE_RANK[normalizeRole(role)] || 0) >= (ROLE_RANK[minRole] || 0);
}

function routeForRole(role, scanResult) {
  if (scanResult !== "success") return "Blocked";
  if (role === ROLE.RANGER) return "SS2-M2-D Field Report";
  if (role === ROLE.ADMIN || role === ROLE.IT_SUPPORT) return "SS4-M4-A Operational Map";
  return "SS3-M3-A Tree ID Card";
}

function findTree(treeId) {
  return TREES.find((tree) => tree.id === treeId) || null;
}

function deriveTrafficLevel(scanCount) {
  if (scanCount >= 35) return "high";
  if (scanCount >= 15) return "medium";
  return "low";
}

function analyzeSpatialSuitability({ point = {}, species = "", targetZone = "" }) {
  const x = Number(point.x);
  const y = Number(point.y);
  const proposed = percentToWorldPosition({ x, y });
  const distances = TREES.map((tree) => {
    const existing = percentToWorldPosition({ x: tree.x, y: tree.y });
    return Math.hypot(existing.x - proposed.x, existing.z - proposed.z);
  });
  const nearestDistance = Math.min(...distances);
  const edgePenalty = x < 12 || x > 88 || y < 10 || y > 90 ? 30 : 0;
  const lakePenalty = x > 45 && x < 66 && y > 22 && y < 58 ? 24 : 0;
  const spacingPenalty = nearestDistance < 5 ? 28 : nearestDistance < 8 ? 14 : 0;
  const rareSpeciesBonus = /shorea|meranti/i.test(species) && /pemuliharaan/i.test(targetZone) ? 8 : 0;
  const score = Math.max(18, Math.min(96, Math.round(82 - edgePenalty - lakePenalty - spacingPenalty + rareSpeciesBonus)));
  const label = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
  const reasoning = label === "Low"
    ? "Move the marker farther from lake edges, constrained boundaries, or existing tree canopy."
    : label === "Medium"
      ? "Placement is usable, but canopy spacing should be reviewed before planting approval."
      : "No major canopy, root, or protected-zone conflict detected for the proposed point.";
  return {
    suitabilityScore: score,
    suitabilityLabel: label,
    aiReasoning: reasoning,
    canopyRadiusM: /samanea|rain/i.test(species) ? 12 : 7,
    rootRadiusM: /samanea|rain/i.test(species) ? 9 : 5,
    estCostRm: /shorea|meranti/i.test(species) ? 680 : 450,
  };
}

function createSs4Store({ filePath, persist = true, initialState } = {}) {
  let loaded = false;
  let state = cloneState(initialState);
  let persistenceAvailable = persist;

  async function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    if (!persistenceAvailable || !filePath) return;
    try {
      state = cloneState(JSON.parse(await fs.readFile(filePath, "utf8")));
    } catch (error) {
      if (error.code === "ENOENT") return;
      state = cloneState(DEFAULT_STATE);
      persistenceAvailable = false;
    }
  }

  async function save() {
    if (!persistenceAvailable || !filePath) return;
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
    } catch {
      persistenceAvailable = false;
    }
  }

  return {
    async reset(nextState = DEFAULT_STATE) {
      loaded = true;
      state = cloneState(nextState);
      await save();
    },
    async read() {
      await ensureLoaded();
      return cloneState(state);
    },
    async write(mutator) {
      await ensureLoaded();
      const result = mutator(state);
      await save();
      return result;
    },
  };
}

export function createSs4Backend({ config = getBackendConfig(), store = createSs4Store({ filePath: config.ss4StorePath }) } = {}) {
  return {
    async health() {
      const state = await store.read();
      return {
        ok: true,
        store: "json",
        qrCodes: state.qrCodes.length,
        qrScanEvents: state.qrScanEvents.length,
        spatialPlans: state.spatialPlanningRecords.length,
        auditLogs: state.auditLogs.length,
      };
    },

    async resetSs4BackendState() {
      await store.reset();
      return { ok: true };
    },

    async getMapPayload({ role = ROLE.ADMIN } = {}) {
      const state = await store.read();
      const selectedRole = normalizeRole(role);
      return {
        ok: true,
        facts: TBJ_MAP_FACTS,
        officialContext: TBJ_OFFICIAL_CONTEXT,
        sourceLinks: {
          jln: TBJ_OFFICIAL_SOURCE_URL,
          googleMaps: TBJ_GOOGLE_MAPS_URL,
        },
        zones: MAP_ZONES,
        landmarks: MAP_LANDMARKS,
        stakeholderPlots: TBJ_STAKEHOLDER_PLOTS,
        layerConfig: MAP_LAYER_CONFIG.filter((layer) => canAccessLayer(selectedRole, layer.minRole)),
        trees: TREES.map((tree) => maskTreeForRole(tree, selectedRole)),
        qrCodes: state.qrCodes,
        qrScanEvents: state.qrScanEvents,
        visitorHeatmapAggregates: state.visitorHeatmapAggregates,
      };
    },

    getLayerConfig({ role = ROLE.ADMIN } = {}) {
      const selectedRole = normalizeRole(role);
      return {
        ok: true,
        layers: MAP_LAYER_CONFIG.filter((layer) => canAccessLayer(selectedRole, layer.minRole)),
      };
    },

    async listQrCodes() {
      const state = await store.read();
      return { ok: true, data: state.qrCodes };
    },

    async listQrScanEvents() {
      const state = await store.read();
      return { ok: true, data: state.qrScanEvents };
    },

    async recordQrScan({ rawId = "", qrId = "", treeId = "", actorId = "anonymous", role = ROLE.VISITOR } = {}) {
      const selectedRole = normalizeRole(role);
      return store.write((state) => {
        const normalized = String(qrId || rawId || treeId).trim();
        const qr = state.qrCodes.find((item) => [item.qrId, item.qrEndpoint, item.treeId].includes(normalized));
        const resolvedTree = findTree(qr?.treeId || treeId);
        const scanResult = qr && qr.qrStatus === "active" && resolvedTree ? "success" : qr ? "archived_qr" : "invalid_qr";
        const event = {
          scanId: nextId("QSE", state.qrScanEvents, "scanId"),
          qrId: qr?.qrId || normalized || "UNKNOWN",
          treeId: resolvedTree?.id || treeId || "UNKNOWN",
          actorId,
          roleDetected: selectedRole,
          routedTo: routeForRole(selectedRole, scanResult),
          scanResult,
          scannedAt: nowIso(),
        };
        state.qrScanEvents.unshift(event);
        state.auditLogs.unshift({
          time: event.scannedAt,
          type: scanResult === "success" ? "qr_scan" : "security",
          actor: actorId || "anonymous",
          role: selectedRole,
          event: `${event.qrId} scan ${scanResult}; routed to ${event.routedTo}`,
          severity: scanResult === "success" ? "low" : "high",
        });
        if (scanResult !== "success") {
          state.securityAlerts.unshift({
            alertId: nextId("SEC", state.securityAlerts, "alertId"),
            alertType: scanResult === "archived_qr" ? "Archived_QR_Attempt" : "Unauthorized_Access",
            severity: "high",
            status: "open",
            detail: `${event.qrId} could not be routed to a valid active tree record.`,
            createdAt: event.scannedAt,
          });
        }
        if (scanResult === "success" && selectedRole === ROLE.VISITOR) {
          const tree = resolvedTree;
          const existing = state.visitorHeatmapAggregates.find((item) => item.treeId === tree.id);
          if (existing) {
            existing.scanCount += 1;
            existing.uniqueSessions += actorId ? 1 : 0;
            existing.trafficLevel = deriveTrafficLevel(existing.scanCount);
          } else {
            state.visitorHeatmapAggregates.unshift({
              aggregateId: nextId("VHA", state.visitorHeatmapAggregates, "aggregateId"),
              zoneId: tree.zone.toLowerCase(),
              treeId: tree.id,
              scanCount: 1,
              uniqueSessions: actorId ? 1 : 0,
              periodStart: event.scannedAt.slice(0, 10),
              periodEnd: event.scannedAt.slice(0, 10),
              trafficLevel: "low",
              x: tree.x,
              y: tree.y,
            });
          }
        }
        return { ok: scanResult === "success", status: scanResult === "success" ? 200 : 404, event };
      });
    },

    async simulateSpatialPlan({ point, species = "Pterocarpus indicus", targetZone = "Arboretum", createdBy = "admin001" } = {}) {
      if (!point || point.x === undefined || point.y === undefined) {
        return { ok: false, status: 400, error: "VALIDATION_ERROR", message: "point.x and point.y are required." };
      }
      const analysis = analyzeSpatialSuitability({ point, species, targetZone });
      return {
        ok: true,
        simulationId: `SIM-${Date.now()}`,
        createdBy,
        species,
        targetZone,
        proposedX: Number(point.x),
        proposedY: Number(point.y),
        ...analysis,
      };
    },

    async confirmSpatialPlan({ point, species, targetZone, createdBy = "admin001", decision = "confirmed" } = {}) {
      const simulated = await this.simulateSpatialPlan({ point, species, targetZone, createdBy });
      if (!simulated.ok) return simulated;
      return store.write((state) => {
        const record = {
          planId: nextId("SPR", state.spatialPlanningRecords, "planId"),
          createdBy,
          species: simulated.species,
          targetZone: simulated.targetZone,
          proposedX: simulated.proposedX,
          proposedY: simulated.proposedY,
          suitabilityScore: simulated.suitabilityScore,
          suitabilityLabel: simulated.suitabilityLabel,
          aiReasoning: simulated.aiReasoning,
          canopyRadiusM: simulated.canopyRadiusM,
          rootRadiusM: simulated.rootRadiusM,
          estCostRm: simulated.estCostRm,
          decision,
          createdAt: nowIso(),
        };
        state.spatialPlanningRecords.unshift(record);
        state.auditLogs.unshift({
          time: record.createdAt,
          type: "edit",
          actor: createdBy,
          role: ROLE.ADMIN,
          event: `${record.planId} ${decision} for ${record.species} in ${record.targetZone}`,
          severity: record.suitabilityLabel === "Low" ? "medium" : "low",
        });
        return { ok: true, record };
      });
    },

    async listSpatialPlans() {
      const state = await store.read();
      return { ok: true, data: state.spatialPlanningRecords };
    },

    async getVisitorHeatmap() {
      const state = await store.read();
      return { ok: true, data: state.visitorHeatmapAggregates };
    },

    async getAuditLogs() {
      const state = await store.read();
      return { ok: true, data: state.auditLogs };
    },

    async getSecurityAlerts() {
      const state = await store.read();
      return { ok: true, data: state.securityAlerts };
    },
  };
}

export { createSs4Store };
