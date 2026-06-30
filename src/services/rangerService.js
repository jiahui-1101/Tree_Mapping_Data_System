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

export function filterFieldReports(reports = [], rangerName = "", { query = "", observedStatus = "all", reportMode = "all", syncStatus = "all" } = {}) {
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

export function findLinkedTaskForTree(tasks = [], treeId = "", rangerName = "", taskId = "") {
  if (taskId) {
    const direct = tasks.find((task) => task.id === taskId && (!rangerName || task.ranger === rangerName));
    if (direct) return direct;
  }
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

export function analyzeFieldPhoto({ tree, photoName = "" } = {}) {
  const treeStatus = tree?.status || "monitor";
  const disease = DIAGNOSES.find((item) => item.name === "Leaf spot disease") || DIAGNOSES[0];
  const rootRot = DIAGNOSES.find((item) => item.name === "Phytophthora root rot") || DIAGNOSES[0];
  const nutrient = DIAGNOSES.find((item) => item.name === "Nutrient stress") || DIAGNOSES[0];
  const priority = tree?.id === "TBJ-004" || treeStatus === "critical" || treeStatus === "monitor"
    ? [disease, rootRot, nutrient]
    : [nutrient, disease, rootRot];
  const offsets = tree?.id === "TBJ-004" || treeStatus === "critical" ? [18, -10, -6] : [7, -8, -12];
  const possibilities = priority.map((item, index) => clonePossibility(item, index, offsets[index])).sort((a, b) => b.confidence - a.confidence);
  const primary = possibilities[0];
  return {
    photoName,
    photoAnalysisStatus: "analyzed",
    possibilities,
    selectedAiPossibilityId: primary.id,
    diagnosis: primary.name,
    confidence: primary.confidence,
    treatment: primary.treatment,
  };
}

export function buildReportAnalysis({ reportMode = "manual", manualCause = "", manualTreatment = "", diagnosis = "", confidence = null, treatment = "", observedStatus = "monitor", linkedTask = null, photoName = "", photoSyncStatus = "none", photoAnalysisStatus = "not-requested", aiPossibilities = [] } = {}) {
  const severity = observedStatus === "critical" ? "Critical" : observedStatus === "healthy" ? "Healthy" : "Monitor";
  const source = reportMode === "ai" ? "ai" : "manual";
  const photoText = photoName && photoName !== "No photo attached"
    ? source === "ai"
      ? `AI analyzed uploaded photo: ${photoName}. Photo synced to admin dashboard.`
      : ""
    : "No field photo attached.";
  const possibilityText = source === "ai" && aiPossibilities.length
    ? ` ${aiPossibilities.length} possible diagnoses generated; primary result: ${diagnosis}.`
    : "";
  const summary = source === "ai"
    ? `${photoText} AI-assisted diagnosis: ${diagnosis || "Pending diagnosis"}${confidence ? ` with ${confidence}% confidence` : ""}.${possibilityText}`
    : `Manual ranger assessment: ${manualCause || "Ranger recorded field observations without AI support."}`;
  const recommendation = source === "ai"
    ? treatment || "Review AI result and confirm treatment with office staff."
    : manualTreatment || "Continue field observation and document follow-up action.";
  return {
    source,
    severity,
    summary,
    recommendation,
    taskSyncMessage: linkedTask ? `Linked task ${linkedTask.id} marked completed and synced to the office dashboard.` : "Standalone field report saved without a linked task.",
    treeUpdateMessage: `Tree status updated to ${observedStatus} in the prototype map.`,
    photoSyncMessage: photoSyncStatus === "uploaded" ? `Field photo ${photoName} uploaded to admin dashboard.` : "No field photo upload was attached.",
    photoAnalysisMessage: photoAnalysisStatus === "analyzed" ? `AI photo analysis completed for ${photoName}.` : "AI photo analysis was not requested.",
    nextAction: observedStatus === "critical" ? "Escalate for admin review within 24 hours." : observedStatus === "healthy" ? "Close routine inspection after office review." : "Schedule follow-up monitoring on the next patrol.",
  };
}

export function createFieldReport({ draft = {}, tree, rangerName = "", tasks = [], existingReports = [] } = {}) {
  const linkedTask = findLinkedTaskForTree(tasks, tree?.id || draft.treeId, rangerName, draft.taskId);
  const reportMode = draft.reportMode === "ai" ? "ai" : "manual";
  const observedStatus = draft.observedStatus || "monitor";
  const photoName = reportMode === "ai" ? draft.photoName || "No photo attached" : "";
  const photoSyncStatus = reportMode === "ai" && photoName !== "No photo attached" ? "uploaded" : "none";
  const photoAnalysisStatus = reportMode === "ai" ? draft.photoAnalysisStatus || "analyzed" : "not-requested";
  const aiPossibilities = reportMode === "ai" ? draft.aiPossibilities || draft.possibilities || [] : [];
  const selectedAiPossibilityId = reportMode === "ai" ? draft.selectedAiPossibilityId || aiPossibilities[0]?.id || "" : "";
  const selectedAiPossibility = aiPossibilities.find((item) => item.id === selectedAiPossibilityId) || aiPossibilities[0] || null;
  const diagnosis = reportMode === "ai" ? selectedAiPossibility?.name || draft.diagnosis || "" : "";
  const confidence = reportMode === "ai" ? selectedAiPossibility?.confidence ?? draft.confidence ?? null : null;
  const treatment = reportMode === "ai" ? selectedAiPossibility?.treatment || selectedAiPossibility?.solutions?.[0] || draft.treatment || "" : "";
  const analysis = buildReportAnalysis({ ...draft, reportMode, observedStatus, linkedTask, photoName, photoSyncStatus, photoAnalysisStatus, aiPossibilities, selectedAiPossibilityId, diagnosis, confidence, treatment });
  return {
    id: `FR-${String(1022 + existingReports.length).padStart(4, "0")}`,
    taskId: linkedTask?.id || "",
    treeId: tree?.id || draft.treeId || "",
    treeName: tree?.name || draft.treeName || "",
    ranger: rangerName,
    reportMode,
    photoName,
    photoSyncStatus,
    photoAnalysisStatus,
    observedStatus,
    manualCause: draft.manualCause || "",
    manualTreatment: draft.manualTreatment || "",
    aiPossibilities,
    selectedAiPossibilityId,
    diagnosis,
    confidence,
    treatment,
    notes: draft.notes || "",
    gpsLabel: draft.gpsLabel || "Mock GPS: Ranger patrol point captured",
    timestamp: draft.timestamp || "Just now",
    syncStatus: "synced",
    analysis,
  };
}
