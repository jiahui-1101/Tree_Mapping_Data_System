import { MAINTENANCE_ALERTS, INITIAL_TASKS } from "../../src/data/tasks.js";
import { TREES } from "../../src/data/trees.js";
import { buildMaintenanceTask } from "../../src/services/adminService.js";

let alerts = MAINTENANCE_ALERTS.map((alert) => ({ ...alert }));
let tasks = INITIAL_TASKS.map((task) => ({ ...task }));

function nextAlertId(currentAlerts = alerts) {
  const max = currentAlerts.reduce((highest, alert) => {
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

function buildRuleBasedAlert(tree) {
  if (tree.health <= 40 || tree.status === "critical") {
    return {
      id: nextAlertId(),
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
      id: nextAlertId(),
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

export function listAlerts() {
  return alerts;
}

export function findAlert(id) {
  return alerts.find((alert) => alert.id === id);
}

export function listTasks() {
  return tasks;
}

export function updateAlertStatus(id, status) {
  const allowed = new Set(["pending", "approved", "deferred", "rejected"]);
  if (!allowed.has(status)) {
    const error = new Error("Invalid alert status.");
    error.statusCode = 400;
    throw error;
  }

  const alert = findAlert(id);
  if (!alert) {
    const error = new Error("Predictive alert not found.");
    error.statusCode = 404;
    throw error;
  }

  alerts = alerts.map((item) => item.id === id ? { ...item, status } : item);
  return findAlert(id);
}

export function approveAlert(id, ranger = "Ahmad Razif") {
  const alert = updateAlertStatus(id, "approved");
  const task = {
    ...buildMaintenanceTask(alert, ranger, tasks),
    priority: getPriority(alert.confidence),
  };
  tasks = [task, ...tasks];
  return { alert, task };
}

export function generateAlertsFromTrees() {
  const existingKeys = new Set(alerts.map((alert) => `${alert.treeId}:${alert.title}`));
  const generated = TREES
    .map(buildRuleBasedAlert)
    .filter(Boolean)
    .filter((alert) => !existingKeys.has(`${alert.treeId}:${alert.title}`));

  alerts = [...generated, ...alerts];
  return generated;
}

export function resetStore() {
  alerts = MAINTENANCE_ALERTS.map((alert) => ({ ...alert }));
  tasks = INITIAL_TASKS.map((task) => ({ ...task }));
  return { alerts, tasks };
}
