import { INITIAL_TASKS } from "../data/tasks.js";

export function nextTaskId(tasks = INITIAL_TASKS) {
  const max = tasks.reduce((highest, task) => {
    const value = Number(String(task.id).match(/TSK-(\d+)/)?.[1] || 0);
    return Math.max(highest, value);
  }, 0);
  return `TSK-${String(max + 1).padStart(3, "0")}`;
}

export function buildMaintenanceTask(alert, rangerName = "Ahmad Razif", tasks = INITIAL_TASKS) {
  const priority = alert.confidence >= 90 ? "urgent" : alert.confidence >= 75 ? "high" : "normal";
  return {
    id: nextTaskId(tasks),
    title: `Treat ${alert.title.toLowerCase()}`,
    treeId: alert.treeId,
    ranger: rangerName,
    source: "AI Predictive Maintenance",
    priority,
    status: "pending",
    notes: `${alert.detail} Zone: ${alert.zone}. AI confidence ${alert.confidence}%.`,
  };
}

export function buildUrgentTask({ ranger = "Ahmad Razif", issue = "", treeId = "", zone = "", priority = "urgent" } = {}, tasks = INITIAL_TASKS) {
  return {
    id: nextTaskId(tasks),
    title: issue.trim() || "Urgent field task",
    treeId: treeId.trim() || zone.trim() || "Zone patrol",
    ranger,
    source: "Admin urgent dispatch",
    priority,
    status: "pending",
    notes: `${issue.trim() || "Urgent admin dispatch"}${zone ? ` Zone: ${zone}.` : ""}`,
  };
}

export function updateTreeRecord(trees = [], id = "", patch = {}) {
  return trees.map((tree) => tree.id === id ? { ...tree, ...patch, id: tree.id } : tree);
}
