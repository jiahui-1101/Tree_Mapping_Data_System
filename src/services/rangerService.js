import { INITIAL_FIELD_REPORTS } from "../data/fieldReports.js";
import { DIAGNOSES } from "../data/diagnoses.js";

export function filterRangerTasks(tasks = [], rangerName = "", { query = "", status = "all", priority = "all", source = "all" } = {}) {
  const needle = query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (rangerName && task.ranger !== rangerName) return false;
    if (status !== "all" && task.status !== status) return false;
    if (priority !== "all" && task.priority !== priority) return false;
    if (source !== "all" && task.source !== source) return false;
    if (!needle) return true;
    return `${task.id} ${task.title} ${task.treeId} ${task.ranger} ${task.source} ${task.priority} ${task.status} ${task.notes}`.toLowerCase().includes(needle);
  });
}

export function filterFieldReports(reports = INITIAL_FIELD_REPORTS, rangerName = "", { query = "", observedStatus = "all", reportMode = "all", syncStatus = "all" } = {}) {
  const needle = query.trim().toLowerCase();
  return reports.filter((report) => {
    if (rangerName && report.ranger !== rangerName) return false;
    if (observedStatus !== "all" && report.observedStatus !== observedStatus) return false;
    if (reportMode !== "all" && report.reportMode !== reportMode) return false;
    if (syncStatus !== "all" && report.syncStatus !== syncStatus) return false;
    if (!needle) return true;
    const aiText = (report.aiPossibilities || []).map((item) => `${item.name} ${item.reasons?.join(" ")} ${item.solutions?.join(" ")}`).join(" ");
    return `${report.id} ${report.taskId} ${report.treeId} ${report.treeName} ${report.ranger} ${report.reportMode} ${report.observedStatus} ${report.diagnosis} ${aiText} ${report.manualCause} ${report.manualTreatment} ${report.notes} ${report.syncStatus}`.toLowerCase().includes(needle);
  });
}

export function findLinkedTaskForTree(tasks = [], treeId = "", rangerName = "") {
  return tasks.find((task) => task.treeId === treeId && (!rangerName || task.ranger === rangerName) && task.status !== "completed") || null;
}

function clonePossibility(item, index, confidenceOffset = 0) {
  return {
    id: `ai-${index + 1}`,
    name: item.name,
    confidence: Math.max(35, Math.min(96, item.confidence + confidenceOffset)),
    reasons: item.reasons.slice(0, 3),
    solutions: item.solutions.slice(0, 3),
    treatment: item.treatment,
  };
}
