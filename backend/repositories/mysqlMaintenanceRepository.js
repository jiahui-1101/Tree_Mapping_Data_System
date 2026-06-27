import { MAINTENANCE_ALERTS, INITIAL_TASKS } from "../../src/data/tasks.js";
import { TREES } from "../../src/data/trees.js";
import { buildMaintenanceTask } from "../../src/services/adminService.js";
import { pingDatabase, pool } from "../config/db.js";

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

async function nextAlertId(connection) {
  const [rows] = await connection.query("SELECT id FROM predictive_alerts ORDER BY id DESC");
  const max = rows.reduce((highest, row) => {
    const value = Number(String(row.id).match(/ALT-(\d+)/)?.[1] || 0);
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

async function insertAlert(connection, alert) {
  await connection.execute(
    `INSERT INTO predictive_alerts
      (id, tree_id, title, zone, confidence, action_window, status, detail, generated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [alert.id, alert.treeId, alert.title, alert.zone, alert.confidence, alert.window, alert.status, alert.detail, alert.generatedBy || "seed data"]
  );
}

async function insertTask(connection, task) {
  await connection.execute(
    `INSERT INTO maintenance_tasks
      (id, alert_id, title, tree_id, ranger, source, priority, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [task.id, task.alertId || null, task.title, task.treeId, task.ranger, task.source, task.priority, task.status, task.notes]
  );
}

export async function health() {
  return pingDatabase();
}

export async function listAlerts() {
  const [rows] = await pool.query("SELECT * FROM predictive_alerts ORDER BY created_at DESC, id DESC");
  return rows.map(rowToAlert);
}

export async function findAlert(id) {
  const [rows] = await pool.execute("SELECT * FROM predictive_alerts WHERE id = ?", [id]);
  return rows[0] ? rowToAlert(rows[0]) : null;
}

export async function listTasks() {
  const [rows] = await pool.query("SELECT * FROM maintenance_tasks ORDER BY created_at DESC, id DESC");
  return rows.map(rowToTask);
}

export async function updateAlertStatus(id, status) {
  if (!ALLOWED_STATUS.has(status)) {
    const error = new Error("Invalid alert status.");
    error.statusCode = 400;
    throw error;
  }

  const [result] = await pool.execute(
    "UPDATE predictive_alerts SET status = ? WHERE id = ?",
    [status, id]
  );
  if (!result.affectedRows) {
    const error = new Error("Predictive alert not found.");
    error.statusCode = 404;
    throw error;
  }
  return findAlert(id);
}

export async function approveAlert(id, ranger = "Ahmad Razif") {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [alertRows] = await connection.execute("SELECT * FROM predictive_alerts WHERE id = ? FOR UPDATE", [id]);
    if (!alertRows[0]) {
      const error = new Error("Predictive alert not found.");
      error.statusCode = 404;
      throw error;
    }

    const alert = rowToAlert(alertRows[0]);
    await connection.execute("UPDATE predictive_alerts SET status = 'approved' WHERE id = ?", [id]);

    const [existingTasks] = await connection.execute("SELECT * FROM maintenance_tasks WHERE alert_id = ? LIMIT 1", [id]);
    if (existingTasks[0]) {
      await connection.commit();
      return { alert: { ...alert, status: "approved" }, task: rowToTask(existingTasks[0]) };
    }

    const [taskRows] = await connection.query("SELECT * FROM maintenance_tasks");
    const task = {
      ...buildMaintenanceTask(alert, ranger, taskRows.map(rowToTask)),
      alertId: id,
      priority: getPriority(alert.confidence),
    };
    await insertTask(connection, task);
    await connection.commit();
    return { alert: { ...alert, status: "approved" }, task };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function generateAlertsFromTrees() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existingRows] = await connection.query("SELECT tree_id, title FROM predictive_alerts");
    const existingKeys = new Set(existingRows.map((row) => `${row.tree_id}:${row.title}`));
    const generated = [];

    for (const tree of TREES) {
      const id = await nextAlertId(connection);
      const alert = buildRuleBasedAlert(tree, id);
      if (!alert || existingKeys.has(`${alert.treeId}:${alert.title}`)) continue;
      await insertAlert(connection, alert);
      generated.push(alert);
      existingKeys.add(`${alert.treeId}:${alert.title}`);
    }

    await connection.commit();
    return generated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function resetStore() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM maintenance_tasks");
    await connection.query("DELETE FROM predictive_alerts");
    for (const alert of MAINTENANCE_ALERTS) {
      await insertAlert(connection, { ...alert, generatedBy: "seed data" });
    }
    for (const task of INITIAL_TASKS) {
      await insertTask(connection, task);
    }
    await connection.commit();
    return { alerts: await listAlerts(), tasks: await listTasks() };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
