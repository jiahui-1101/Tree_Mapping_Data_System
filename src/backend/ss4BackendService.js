import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
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

function sqlDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value).slice(0, 10);
  return null;
}

function sqlTimestamp(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value).replace("T", " ").replace("Z", "").slice(0, 19);
  return null;
}

function hexColor(value) {
  return `#${Number(value).toString(16).padStart(6, "0")}`;
}

function rowToQrCode(row) {
  return {
    qrId: row.qr_id,
    treeId: row.tree_id,
    qrEndpoint: row.qr_endpoint,
    qrStatus: row.qr_status,
    generatedAt: row.generated_at,
    generatedBy: row.generated_by,
    exportedAt: row.exported_at || "",
    invalidatedAt: row.invalidated_at || "",
    replacedBy: row.replaced_by || "",
  };
}

function rowToQrScanEvent(row) {
  return {
    scanId: row.scan_id,
    qrId: row.qr_id,
    treeId: row.tree_id,
    actorId: row.actor_id || "",
    roleDetected: row.role_detected,
    routedTo: row.routed_to,
    scanResult: row.scan_result,
    scannedAt: row.scanned_at,
  };
}

function rowToSpatialPlan(row) {
  return {
    planId: row.plan_id,
    createdBy: row.created_by,
    species: row.species,
    targetZone: row.target_zone,
    proposedX: Number(row.proposed_x),
    proposedY: Number(row.proposed_y),
    suitabilityScore: Number(row.suitability_score),
    suitabilityLabel: row.suitability_label,
    aiReasoning: row.ai_reasoning,
    canopyRadiusM: Number(row.canopy_radius_m || 0),
    rootRadiusM: Number(row.root_radius_m || 0),
    estCostRm: Number(row.est_cost_rm || 0),
    decision: row.decision,
    createdAt: row.created_at,
  };
}

function rowToHeatmap(row) {
  return {
    aggregateId: row.aggregate_id,
    zoneId: row.zone_id,
    treeId: row.tree_id,
    scanCount: Number(row.scan_count),
    uniqueSessions: Number(row.unique_sessions),
    periodStart: row.period_start,
    periodEnd: row.period_end,
    trafficLevel: row.traffic_level,
    x: Number(row.coord_x),
    y: Number(row.coord_y),
  };
}

function rowToAuditLog(row) {
  return {
    time: row.logged_at,
    type: row.event_type,
    actor: row.actor_name,
    role: row.role,
    event: row.event_detail,
    severity: row.severity,
  };
}

function rowToSecurityAlert(row) {
  return {
    alertId: row.alert_id,
    alertType: row.alert_type,
    severity: row.severity,
    status: row.status,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

function createMysqlSs4Store(config) {
  const pool = mysql.createPool(config.ss4Database);

  async function seedCoreTables(connection) {
    for (const zone of MAP_ZONES) {
      await connection.execute(
        `INSERT INTO map_zones (zone_id, zone_name, short_name, inventory_zone, color_hex, polygon_json, source_url)
         VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?)
         ON DUPLICATE KEY UPDATE zone_name = VALUES(zone_name), short_name = VALUES(short_name), color_hex = VALUES(color_hex)`,
        [zone.id, zone.name, zone.shortName, zone.inventoryZone, hexColor(zone.color), JSON.stringify(zone.polygon), TBJ_OFFICIAL_SOURCE_URL],
      );
    }
    for (const landmark of MAP_LANDMARKS) {
      await connection.execute(
        `INSERT INTO map_landmarks (landmark_id, landmark_name, landmark_type, coord_x, coord_y, source_note)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE landmark_name = VALUES(landmark_name), landmark_type = VALUES(landmark_type)`,
        [landmark.id, landmark.name, landmark.type, landmark.x, landmark.z, "Official JLN, Google Maps, and supplied TBJ zoning image reference"],
      );
    }
    for (const tree of TREES) {
      await connection.execute(
        `INSERT INTO trees (id, species, common_name, scientific_name, zone, age_years, height_m, health_score, health_status, is_rare, coord_x, coord_y, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE health_score = VALUES(health_score), health_status = VALUES(health_status), coord_x = VALUES(coord_x), coord_y = VALUES(coord_y)`,
        [tree.id, tree.scientificName, tree.name, tree.scientificName, tree.zone, tree.age, tree.height, tree.health, tree.status, tree.rare, tree.x, tree.y, tree.description],
      );
    }
    for (const plot of TBJ_STAKEHOLDER_PLOTS) {
      await connection.execute(
        `INSERT INTO stakeholder_plots (plot_id, plot_name, zone_id, source_document, record_count, species_rows, coord_x, coord_y, representative_species_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))
         ON DUPLICATE KEY UPDATE record_count = VALUES(record_count), species_rows = VALUES(species_rows)`,
        [plot.id, plot.name, plot.zoneId, plot.source, plot.total, plot.inventory?.speciesRows || 0, plot.x, plot.z, JSON.stringify(plot.examples || [])],
      );
    }
    for (const layer of MAP_LAYER_CONFIG) {
      await connection.execute(
        `INSERT INTO map_layer_config (layer_id, layer_label, data_source, min_role, is_default, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE layer_label = VALUES(layer_label), min_role = VALUES(min_role), sort_order = VALUES(sort_order)`,
        [layer.layerId, layer.layerLabel, layer.dataSource, layer.minRole, layer.isDefault, layer.sortOrder],
      );
    }
  }

  async function saveState(connection, state) {
    await seedCoreTables(connection);
    await connection.query("DELETE FROM visitor_heatmap_aggregate");
    await connection.query("DELETE FROM ai_simulation_logs");
    await connection.query("DELETE FROM spatial_planning_records");
    await connection.query("DELETE FROM qr_scan_events");
    await connection.query("DELETE FROM qr_codes");
    await connection.query("DELETE FROM audit_logs");
    await connection.query("DELETE FROM security_alerts");

    for (const qr of state.qrCodes) {
      if (!findTree(qr.treeId)) continue;
      await connection.execute(
        `INSERT INTO qr_codes (qr_id, tree_id, qr_endpoint, qr_status, generated_at, generated_by, exported_at, invalidated_at, replaced_by)
         VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?)`,
        [qr.qrId, qr.treeId, qr.qrEndpoint, qr.qrStatus, sqlTimestamp(qr.generatedAt), qr.generatedBy, sqlTimestamp(qr.exportedAt), sqlTimestamp(qr.invalidatedAt), qr.replacedBy || null],
      );
    }
    const qrIds = new Set(state.qrCodes.map((qr) => qr.qrId));
    for (const event of state.qrScanEvents) {
      if (!qrIds.has(event.qrId) || !findTree(event.treeId)) continue;
      await connection.execute(
        `INSERT INTO qr_scan_events (scan_id, qr_id, tree_id, actor_id, role_detected, routed_to, scan_result, scanned_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [event.scanId, event.qrId, event.treeId, event.actorId || null, event.roleDetected, event.routedTo, event.scanResult, sqlTimestamp(event.scannedAt)],
      );
    }
    for (const record of state.spatialPlanningRecords) {
      await connection.execute(
        `INSERT INTO spatial_planning_records
          (plan_id, created_by, proposed_x, proposed_y, species, target_zone, suitability_label, suitability_score, ai_reasoning, canopy_radius_m, root_radius_m, est_cost_rm, decision, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [record.planId, record.createdBy, record.proposedX, record.proposedY, record.species, record.targetZone, record.suitabilityLabel, record.suitabilityScore, record.aiReasoning, record.canopyRadiusM || 7, record.rootRadiusM || 5, record.estCostRm || 450, record.decision, sqlTimestamp(record.createdAt)],
      );
    }
    for (const aggregate of state.visitorHeatmapAggregates) {
      await connection.execute(
        `INSERT INTO visitor_heatmap_aggregate
          (aggregate_id, zone_id, tree_id, scan_count, unique_sessions, period_start, period_end, traffic_level, coord_x, coord_y)
         VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_DATE), COALESCE(?, CURRENT_DATE), ?, ?, ?)`,
        [aggregate.aggregateId, aggregate.zoneId, aggregate.treeId, aggregate.scanCount, aggregate.uniqueSessions, sqlDate(aggregate.periodStart), sqlDate(aggregate.periodEnd), aggregate.trafficLevel, aggregate.x, aggregate.y],
      );
    }
    for (const [index, log] of state.auditLogs.entries()) {
      await connection.execute(
        `INSERT INTO audit_logs (log_id, actor_id, actor_name, role, event_type, event_detail, affected_record, severity, ip_metadata, logged_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [`AUD-${String(index + 1).padStart(3, "0")}`, null, log.actor, log.role, log.type, log.event, null, log.severity, null, sqlTimestamp(log.time)],
      );
    }
    for (const alert of state.securityAlerts) {
      await connection.execute(
        `INSERT INTO security_alerts (alert_id, alert_type, severity, status, detail, created_at)
         VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [alert.alertId, alert.alertType, alert.severity, alert.status, alert.detail, sqlTimestamp(alert.createdAt)],
      );
    }
  }

  return {
    async reset(nextState = DEFAULT_STATE) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await saveState(connection, cloneState(nextState));
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async read() {
      const connection = await pool.getConnection();
      try {
        await seedCoreTables(connection);
        const [[qrRows], [scanRows], [planRows], [heatRows], [auditRows], [securityRows]] = await Promise.all([
          connection.query("SELECT * FROM qr_codes ORDER BY generated_at, qr_id"),
          connection.query("SELECT * FROM qr_scan_events ORDER BY scanned_at DESC, scan_id DESC"),
          connection.query("SELECT * FROM spatial_planning_records ORDER BY created_at DESC, plan_id DESC"),
          connection.query("SELECT * FROM visitor_heatmap_aggregate ORDER BY scan_count DESC, aggregate_id"),
          connection.query("SELECT * FROM audit_logs ORDER BY logged_at DESC, log_id DESC"),
          connection.query("SELECT * FROM security_alerts ORDER BY created_at DESC, alert_id DESC"),
        ]);
        const state = {
          qrCodes: qrRows.map(rowToQrCode),
          qrScanEvents: scanRows.map(rowToQrScanEvent),
          spatialPlanningRecords: planRows.map(rowToSpatialPlan),
          visitorHeatmapAggregates: heatRows.map(rowToHeatmap),
          auditLogs: auditRows.map(rowToAuditLog),
          securityAlerts: securityRows.map(rowToSecurityAlert),
        };
        if (!state.qrCodes.length) {
          await saveState(connection, cloneState(DEFAULT_STATE));
          return cloneState(DEFAULT_STATE);
        }
        return cloneState(state);
      } finally {
        connection.release();
      }
    },
    async write(mutator) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const current = await this.read();
        const result = mutator(current);
        await saveState(connection, current);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}

function createFallbackStore(primary, fallback) {
  return {
    async reset(nextState) {
      try {
        return await primary.reset(nextState);
      } catch {
        return fallback.reset(nextState);
      }
    },
    async read() {
      try {
        return await primary.read();
      } catch {
        return fallback.read();
      }
    },
    async write(mutator) {
      try {
        return await primary.write(mutator);
      } catch {
        return fallback.write(mutator);
      }
    },
  };
}

function createConfiguredSs4Store(config) {
  const jsonStore = createSs4Store({ filePath: config.ss4StorePath });
  if (config.ss4Store !== "mysql") return jsonStore;
  return createFallbackStore(createMysqlSs4Store(config), jsonStore);
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timeout) };
}

function parseAiJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]);
    if (!Number.isFinite(Number(data.suitabilityScore))) return null;
    return {
      suitabilityScore: Math.max(0, Math.min(100, Math.round(Number(data.suitabilityScore)))),
      suitabilityLabel: ["High", "Medium", "Low"].includes(data.suitabilityLabel) ? data.suitabilityLabel : Number(data.suitabilityScore) >= 70 ? "High" : Number(data.suitabilityScore) >= 45 ? "Medium" : "Low",
      aiReasoning: String(data.aiReasoning || "AI provider returned a suitability decision."),
      canopyRadiusM: Number(data.canopyRadiusM || 7),
      rootRadiusM: Number(data.rootRadiusM || 5),
      estCostRm: Number(data.estCostRm || 450),
    };
  } catch {
    return null;
  }
}

async function askSpatialAi({ point, species, targetZone, fallback, config }) {
  const provider = config.ss4AiProvider;
  if (!["gemini", "openai"].includes(provider)) return null;
  const prompt = [
    "You are the SS4 spatial planning assistant for Johor Botanical Garden.",
    "Return JSON only with suitabilityScore, suitabilityLabel, aiReasoning, canopyRadiusM, rootRadiusM, estCostRm.",
    "Use visitor-safe and staff-safe planning reasoning. Do not expose rare species exact coordinates.",
    `Point percent coordinates: x=${point.x}, y=${point.y}.`,
    `Species: ${species}. Target zone: ${targetZone}.`,
    `Rule baseline: ${JSON.stringify(fallback)}.`,
  ].join("\n");
  const timer = withTimeout(config.aiTimeoutMs || 8000);
  try {
    if (provider === "gemini" && config.geminiApiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: timer.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 260 },
        }),
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return parseAiJson(payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join(""));
    }
    if (provider === "openai" && config.openaiApiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openaiApiKey}` },
        signal: timer.signal,
        body: JSON.stringify({
          model: config.openaiModel,
          temperature: 0.25,
          max_tokens: 260,
          messages: [
            { role: "system", content: "Return valid JSON only for SS4 spatial planning." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return parseAiJson(payload.choices?.[0]?.message?.content);
    }
  } catch {
    return null;
  } finally {
    timer.done();
  }
  return null;
}

export function createSs4Backend({ config = getBackendConfig(), store = createConfiguredSs4Store(config) } = {}) {
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
      const fallback = analyzeSpatialSuitability({ point, species, targetZone });
      const aiAnalysis = await askSpatialAi({ point, species, targetZone, fallback, config });
      const analysis = aiAnalysis || fallback;
      return {
        ok: true,
        simulationId: `SIM-${Date.now()}`,
        createdBy,
        species,
        targetZone,
        proposedX: Number(point.x),
        proposedY: Number(point.y),
        provider: aiAnalysis ? config.ss4AiProvider : "Local rule engine",
        fallbackUsed: !aiAnalysis,
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
