import mysql from "mysql2/promise";
import { TREES } from "../data/trees.js";
import { MAINTENANCE_ALERTS, INITIAL_TASKS } from "../data/tasks.js";
import { buildMaintenanceTask } from "../services/adminService.js";
import { getBackendConfig } from "./backendConfig.js";

const ALLOWED_STATUS = new Set(["pending", "approved", "deferred", "rejected"]);

function rowToAlert(row) {
  return {
    id: row.id,
    treeId: row.tree_id,
    title: row.title,
    zone: row.zone,
    confidence: row.confidence,
    window: row.action_window,
    status: row.status,
    detail: row.detail,
    generatedBy: row.generated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToTask(row) {
  return {
    id: row.id,
    alertId: row.alert_id,
    title: row.title,
    treeId: row.tree_id,
    ranger: row.ranger,
    source: row.source,
    priority: row.priority,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function nextAlertId(alerts) {
  const max = alerts.reduce((highest, alert) => {
    const value = Number(String(alert.id).match(/ALT-(\d+)/)?.[1] || 0);
    return Math.max(highest, value);
  }, 0);
  return `ALT-${String(max + 1).padStart(3, "0")}`;
}

function getPriority(confidence) {
  if (confidence >= 90) return "urgent";
  if (confidence >= 75) return "high";
  return "normal";
}

function buildRuleBasedAlert(tree, id) {
  if (tree.health <= 40 || tree.status === "critical") {
    return {
      id,
      treeId: tree.id,
      title: "Fungal infection outbreak",
      zone: tree.zone,
      confidence: 92,
      window: "Within 24 hours",
      status: "pending",
      detail: `${tree.name} has a critical health score of ${tree.health}%. High humidity and recent symptoms may indicate spreading infection.`,
      generatedBy: "rule-based prediction engine",
    };
  }

  if (tree.health <= 75 || tree.status === "monitor") {
    return {
      id,
      treeId: tree.id,
      title: tree.zone === "Tanaman" ? "Nutrient deficiency" : "Water stress risk",
      zone: tree.zone,
      confidence: tree.health <= 70 ? 78 : 69,
      window: tree.health <= 70 ? "Within 3 days" : "Within 7 days",
      status: "pending",
      detail: `${tree.name} is under monitoring with a health score of ${tree.health}%. Follow-up maintenance is recommended.`,
      generatedBy: "rule-based prediction engine",
    };
  }

  return null;
}

function createMemoryMaintenanceBackend() {
  let alerts = MAINTENANCE_ALERTS.map((alert) => ({ ...alert }));
  let tasks = INITIAL_TASKS.map((task) => ({ ...task }));

  return {
    async health() {
      return { ok: true, store: "memory" };
    },
    async listAlerts() {
      return alerts;
    },
    async findAlert(id) {
      return alerts.find((alert) => alert.id === id) || null;
    },
    async listTasks() {
      return tasks;
    },
    async updateAlertStatus(id, status) {
      if (!ALLOWED_STATUS.has(status)) return { ok: false, status: 400, error: "INVALID_STATUS", message: "Invalid alert status." };
      const alert = alerts.find((item) => item.id === id);
      if (!alert) return { ok: false, status: 404, error: "ALERT_NOT_FOUND", message: "Predictive alert not found." };
      alerts = alerts.map((item) => item.id === id ? { ...item, status } : item);
      return { ok: true, alert: alerts.find((item) => item.id === id) };
    },
    async approveAlert(id, ranger = "Ahmad Razif") {
      const updated = await this.updateAlertStatus(id, "approved");
      if (!updated.ok) return updated;
      const task = {
        ...buildMaintenanceTask(updated.alert, ranger, tasks),
        priority: getPriority(updated.alert.confidence),
      };
      tasks = [task, ...tasks];
      return { ok: true, alert: updated.alert, task };
    },
    async generateAlertsFromTrees() {
      const existingKeys = new Set(alerts.map((alert) => `${alert.treeId}:${alert.title}`));
      const generated = [];
      for (const tree of TREES) {
        const alert = buildRuleBasedAlert(tree, nextAlertId([...alerts, ...generated]));
        if (!alert || existingKeys.has(`${alert.treeId}:${alert.title}`)) continue;
        generated.push(alert);
        existingKeys.add(`${alert.treeId}:${alert.title}`);
      }
      alerts = [...generated, ...alerts];
      return { ok: true, count: generated.length, alerts: generated };
    },
    async reset() {
      alerts = MAINTENANCE_ALERTS.map((alert) => ({ ...alert }));
      tasks = INITIAL_TASKS.map((task) => ({ ...task }));
      return { ok: true, alerts, tasks };
    },
  };
}

function createMysqlMaintenanceBackend(config) {
  const pool = mysql.createPool(config.maintenanceDatabase);

  const insertAlert = (connection, alert) => connection.execute(
    `INSERT INTO predictive_alerts
      (id, tree_id, title, zone, confidence, action_window, status, detail, generated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [alert.id, alert.treeId, alert.title, alert.zone, alert.confidence, alert.window, alert.status, alert.detail, alert.generatedBy || "seed data"]
  );

  const insertTask = (connection, task) => connection.execute(
    `INSERT INTO maintenance_tasks
      (id, alert_id, title, tree_id, ranger, source, priority, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [task.id, task.alertId || null, task.title, task.treeId, task.ranger, task.source, task.priority, task.status, task.notes]
  );

  return {
    async health() {
      const connection = await pool.getConnection();
      try {
        await connection.ping();
        return { ok: true, store: "mysql", database: config.maintenanceDatabase.database };
      } finally {
        connection.release();
      }
    },
    async listAlerts() {
      const [rows] = await pool.query("SELECT * FROM predictive_alerts ORDER BY created_at DESC, id DESC");
      return rows.map(rowToAlert);
    },
    async findAlert(id) {
      const [rows] = await pool.execute("SELECT * FROM predictive_alerts WHERE id = ?", [id]);
      return rows[0] ? rowToAlert(rows[0]) : null;
    },
    async listTasks() {
      const [rows] = await pool.query("SELECT * FROM maintenance_tasks ORDER BY created_at DESC, id DESC");
      return rows.map(rowToTask);
    },
    async updateAlertStatus(id, status) {
      if (!ALLOWED_STATUS.has(status)) return { ok: false, status: 400, error: "INVALID_STATUS", message: "Invalid alert status." };
      const [result] = await pool.execute("UPDATE predictive_alerts SET status = ? WHERE id = ?", [status, id]);
      if (!result.affectedRows) return { ok: false, status: 404, error: "ALERT_NOT_FOUND", message: "Predictive alert not found." };
      return { ok: true, alert: await this.findAlert(id) };
    },
    async approveAlert(id, ranger = "Ahmad Razif") {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [alertRows] = await connection.execute("SELECT * FROM predictive_alerts WHERE id = ? FOR UPDATE", [id]);
        if (!alertRows[0]) {
          await connection.rollback();
          return { ok: false, status: 404, error: "ALERT_NOT_FOUND", message: "Predictive alert not found." };
        }
        const alert = rowToAlert(alertRows[0]);
        await connection.execute("UPDATE predictive_alerts SET status = 'approved' WHERE id = ?", [id]);
        const [existingTasks] = await connection.execute("SELECT * FROM maintenance_tasks WHERE alert_id = ? LIMIT 1", [id]);
        if (existingTasks[0]) {
          await connection.commit();
          return { ok: true, alert: { ...alert, status: "approved" }, task: rowToTask(existingTasks[0]) };
        }
        const [taskRows] = await connection.query("SELECT * FROM maintenance_tasks");
        const task = {
          ...buildMaintenanceTask(alert, ranger, taskRows.map(rowToTask)),
          alertId: id,
          priority: getPriority(alert.confidence),
        };
        await insertTask(connection, task);
        await connection.commit();
        return { ok: true, alert: { ...alert, status: "approved" }, task };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async generateAlertsFromTrees() {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [existingRows] = await connection.query("SELECT id, tree_id, title FROM predictive_alerts");
        const existingKeys = new Set(existingRows.map((row) => `${row.tree_id}:${row.title}`));
        const generated = [];
        for (const tree of TREES) {
          const alert = buildRuleBasedAlert(tree, nextAlertId([...existingRows.map((row) => ({ id: row.id })), ...generated]));
          if (!alert || existingKeys.has(`${alert.treeId}:${alert.title}`)) continue;
          await insertAlert(connection, alert);
          generated.push(alert);
          existingKeys.add(`${alert.treeId}:${alert.title}`);
        }
        await connection.commit();
        return { ok: true, count: generated.length, alerts: generated };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async reset() {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM maintenance_tasks");
        await connection.query("DELETE FROM predictive_alerts");
        for (const alert of MAINTENANCE_ALERTS) await insertAlert(connection, { ...alert, generatedBy: "seed data" });
        for (const task of INITIAL_TASKS) await insertTask(connection, task);
        await connection.commit();
        return { ok: true, alerts: await this.listAlerts(), tasks: await this.listTasks() };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}

export function createMaintenanceBackend({ config = getBackendConfig() } = {}) {
  return config.maintenanceStore === "mysql"
    ? createMysqlMaintenanceBackend(config)
    : createMemoryMaintenanceBackend();
}
