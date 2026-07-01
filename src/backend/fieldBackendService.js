import mysql from "mysql2/promise";
import { TREES } from "../data/trees.js";
import { analyzeFieldPhoto, createFieldReport, filterFieldReports, filterRangerTasks } from "../services/rangerService.js";
import { getBackendConfig } from "./backendConfig.js";

const TASK_STATUSES = new Set(["pending", "in-progress", "completed", "escalated", "skipped", "false-positive", "anomaly-found"]);
const TASK_PRIORITIES = new Set(["normal", "high", "urgent"]);
const RANGER_STATUSES = new Set(["active", "inactive"]);
const ZONES = ["Arboretum", "Pemuliharaan", "Tanaman", "Riparian", "Tapak Semaian"];
const WEEK_DAYS = [
  { label: "Mon", offset: 0 },
  { label: "Tue", offset: 1 },
  { label: "Wed", offset: 2 },
  { label: "Thu", offset: 3 },
  { label: "Fri", offset: 4 },
];

function ok(data = {}) {
  return { ok: true, ...data };
}

function fail(status, error, message) {
  return { ok: false, status, error, message };
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function taskMatches(task, id) {
  return task.id.toLowerCase() === String(id || "").toLowerCase();
}

function treeById(id) {
  return TREES.find((tree) => tree.id.toLowerCase() === String(id || "").toLowerCase()) || null;
}

function representativeTreeIdForZone(zone) {
  return TREES.find((tree) => tree.zone === zone)?.id || TREES[0]?.id || "TBJ-001";
}

function healthScoreForStatus(status) {
  if (status === "critical") return 38;
  if (status === "monitor") return 68;
  return 94;
}

function syncTreeRecordFromReport(tree, observedStatus) {
  if (!tree) return null;
  tree.status = observedStatus;
  tree.health = healthScoreForStatus(observedStatus);
  return tree;
}

function nextFieldTaskId(tasks = []) {
  const max = tasks.reduce((highest, task) => {
    const value = Number(String(task.id).match(/TSK-(\d+)/)?.[1] || 0);
    return Math.max(highest, value);
  }, 0);
  return `TSK-${String(max + 1).padStart(3, "0")}`;
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function getMonday(date = new Date()) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy;
}

function buildWeekLabel(start = getMonday()) {
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 4);
  return `${toDateString(start)} to ${toDateString(end)}`;
}

function rowToRanger(row) {
  return {
    id: row.id,
    name: row.name,
    zone: row.zone,
    phone: row.phone,
    status: row.status,
  };
}

function rowToTask(row) {
  return {
    id: row.id,
    scheduleAssignmentId: row.schedule_assignment_id,
    title: row.title,
    treeId: row.tree_id,
    ranger: row.ranger,
    taskType: row.task_type,
    source: row.source,
    priority: row.priority,
    status: row.status,
    notes: row.notes || "",
    dispatchedAt: row.dispatched_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function rowToScheduleWeek(row, assignments = []) {
  return {
    id: row.id,
    createdBy: row.created_by,
    weekLabel: row.week_label,
    status: row.status,
    generatedAt: row.generated_at,
    approvedAt: row.approved_at,
    aiReasoningSummary: row.ai_reasoning_summary || "",
    assignments,
  };
}

function rowToAssignment(row) {
  return {
    id: row.id,
    scheduleWeekId: row.schedule_week_id,
    rangerId: row.ranger_id,
    rangerName: row.ranger_name,
    zone: row.zone,
    shiftDate: row.shift_date,
    shiftDay: row.shift_day,
    shiftStart: row.shift_start,
    shiftEnd: row.shift_end,
    priorityFlag: row.priority_flag,
    aiReasoningNote: row.ai_reasoning_note || "",
    manualOverride: Boolean(row.manual_override),
    updatedBy: row.updated_by || "",
  };
}

function rowToNotification(row) {
  return {
    id: row.id,
    rangerId: row.ranger_id,
    rangerName: row.ranger_name,
    taskId: row.task_id,
    payloadSummary: row.payload_summary,
    deliveryStatus: row.delivery_status,
    sentAt: row.sent_at,
    readAt: row.read_at,
  };
}

function rowToReport(row) {
  return {
    id: row.id,
    taskId: row.task_id || "",
    treeId: row.tree_id,
    treeName: row.tree_name,
    ranger: row.ranger,
    reportMode: row.report_mode,
    photoName: row.photo_name || "",
    photoSyncStatus: row.photo_sync_status,
    photoAnalysisStatus: row.photo_analysis_status,
    observedStatus: row.observed_status,
    manualCause: row.manual_cause || "",
    manualTreatment: row.manual_treatment || "",
    aiPossibilities: parseJson(row.ai_possibilities, []),
    selectedAiPossibilityId: row.selected_ai_possibility_id || "",
    aiDiagnosisRef: row.ai_diagnosis_ref || "",
    diagnosis: row.diagnosis || "",
    confidence: row.confidence,
    treatment: row.treatment || "",
    notes: row.notes || "",
    heightMeasurement: row.height_measurement,
    gpsLabel: row.gps_label || "",
    timestamp: row.timestamp_label || "",
    syncStatus: row.sync_status,
    reviewStatus: row.review_status || "Pending Review",
    analysis: parseJson(row.analysis, {}),
  };
}

function buildSchedule(rangers = []) {
  const active = rangers.filter((ranger) => ranger.status === "active");
  return {
    week: "1 - 5 June 2026",
    days: WEEK_DAYS.map((day) => day.label),
    assignments: active.map((ranger, rangerIndex) => ({
      rangerId: ranger.id,
      ranger: ranger.name,
      cells: WEEK_DAYS.map((day, dayIndex) => ({
        day: day.label,
        zone: dayIndex === 0 ? ranger.zone : ZONES[(rangerIndex + dayIndex) % ZONES.length],
      })),
    })),
  };
}

function buildAiSchedule({ rangers = [], previousAssignments = [], weekStart = getMonday(), weekLabel = buildWeekLabel(weekStart), createdBy = "Admin" } = {}) {
  const activeRangers = rangers.filter((ranger) => ranger.status === "active");
  const lastZoneByRanger = new Map();
  for (const assignment of previousAssignments) {
    lastZoneByRanger.set(assignment.rangerId || assignment.ranger_id, assignment.zone);
  }
  const zoneLoad = new Map(ZONES.map((zone) => [zone, 0]));
  const assignments = [];
  for (const [rangerIndex, ranger] of activeRangers.entries()) {
    const lastZone = lastZoneByRanger.get(ranger.id);
    for (const day of WEEK_DAYS) {
      const shift = new Date(weekStart);
      shift.setUTCDate(weekStart.getUTCDate() + day.offset);
      const rankedZones = ZONES
        .map((zone, zoneIndex) => ({
          zone,
          score: (zoneLoad.get(zone) || 0) * 3 + (zone === lastZone ? 5 : 0) + ((zoneIndex + rangerIndex + day.offset) % ZONES.length),
        }))
        .sort((a, b) => a.score - b.score);
      const chosen = rankedZones[0].zone;
      zoneLoad.set(chosen, (zoneLoad.get(chosen) || 0) + 1);
      const reasoningNote = lastZone
        ? lastZone === chosen
          ? `${ranger.name} remains in ${chosen} because this zone still needs coverage balance.`
          : `${ranger.name} was rotated from ${lastZone} to ${chosen} to avoid repeated patrols and spread workload evenly.`
        : `${ranger.name} was assigned to ${chosen} based on default zone coverage because no previous patrol history was available.`;
      assignments.push({
        rangerId: ranger.id,
        rangerName: ranger.name,
        zone: chosen,
        shiftDate: toDateString(shift),
        shiftDay: day.label,
        shiftStart: "08:00:00",
        shiftEnd: "12:00:00",
        priorityFlag: zoneLoad.get(chosen) > 3 ? "High" : "Normal",
        aiReasoningNote: reasoningNote,
      });
    }
  }
  return {
    weekLabel,
    createdBy,
    aiReasoningSummary: `Generated ${assignments.length} patrol assignments for ${activeRangers.length} active ranger(s). The scheduler checks previous patrol zones, avoids repeating the latest zone where possible, and balances coverage across ${ZONES.join(", ")}.`,
    assignments,
  };
}

function createTaskDraft(draft = {}, tasks = []) {
  const ranger = String(draft.ranger || "").trim();
  const title = String(draft.title || draft.issue || "").trim();
  const treeId = String(draft.treeId || draft.zone || "Zone patrol").trim();
  const priority = draft.priority || "normal";
  if (!ranger) return fail(400, "VALIDATION_ERROR", "Ranger is required.");
  if (!title) return fail(400, "VALIDATION_ERROR", "Task title or issue is required.");
  if (!TASK_PRIORITIES.has(priority)) return fail(400, "INVALID_PRIORITY", "Task priority must be normal, high, or urgent.");
  return ok({
    task: {
      id: draft.id || nextFieldTaskId(tasks),
      scheduleAssignmentId: draft.scheduleAssignmentId || null,
      title,
      treeId,
      ranger,
      taskType: draft.taskType || (priority === "urgent" ? "Urgent" : "Inspection"),
      source: draft.source || "Admin urgent dispatch",
      priority,
      status: draft.status || "pending",
      notes: draft.notes || `${title}${draft.zone ? ` Zone: ${draft.zone}.` : ""}`,
      dispatchedAt: draft.dispatchedAt || null,
      startedAt: draft.startedAt || null,
      completedAt: draft.completedAt || null,
    },
  });
}

function createMemoryFieldBackend() {
  let rangers = [];
  let tasks = [];
  let reports = [];
  let currentSchedule = null;
  let notifications = [];

  return {
    async health() {
      return ok({ store: "memory", taskCount: tasks.length, reportCount: reports.length });
    },
    async listRangers({ status = "all" } = {}) {
      return status === "all" ? rangers : rangers.filter((ranger) => ranger.status === status);
    },
    async upsertRanger(draft = {}) {
      if (!draft.name?.trim()) return fail(400, "VALIDATION_ERROR", "Ranger name is required.");
      if (draft.status && !RANGER_STATUSES.has(draft.status)) return fail(400, "INVALID_STATUS", "Ranger status must be active or inactive.");
      const existing = draft.id ? rangers.find((ranger) => ranger.id === draft.id) : null;
      const ranger = {
        id: draft.id || `R${String(rangers.length + 1).padStart(2, "0")}`,
        name: draft.name.trim(),
        zone: draft.zone || existing?.zone || "Arboretum",
        phone: draft.phone || existing?.phone || "",
        status: draft.status || existing?.status || "active",
      };
      rangers = existing ? rangers.map((item) => item.id === ranger.id ? ranger : item) : [...rangers, ranger];
      return ok({ ranger });
    },
    async getCurrentSchedule() {
      return ok({ schedule: currentSchedule });
    },
    async generateSchedule({ createdBy = "Admin", weekLabel } = {}) {
      const generated = buildAiSchedule({ rangers, previousAssignments: currentSchedule?.assignments || [], weekLabel, createdBy });
      currentSchedule = {
        id: Date.now(),
        status: "Draft",
        generatedAt: new Date().toISOString(),
        approvedAt: null,
        ...generated,
        assignments: generated.assignments.map((assignment, index) => ({ id: index + 1, ...assignment })),
      };
      return ok({ schedule: currentSchedule });
    },
    async updateScheduleAssignment(id, patch = {}) {
      if (!currentSchedule) return fail(404, "SCHEDULE_NOT_FOUND", "No active schedule draft found.");
      currentSchedule = {
        ...currentSchedule,
        assignments: currentSchedule.assignments.map((assignment) => Number(assignment.id) === Number(id)
          ? { ...assignment, ...patch, manualOverride: true, updatedBy: patch.editedBy || "Admin" }
          : assignment),
      };
      return ok({ schedule: currentSchedule });
    },
    async publishSchedule(id, { approvedBy = "Admin" } = {}) {
      if (!currentSchedule || Number(currentSchedule.id) !== Number(id)) return fail(404, "SCHEDULE_NOT_FOUND", "Schedule week not found.");
      const createdTasks = [];
      for (const assignment of currentSchedule.assignments) {
        const draft = createTaskDraft({
          scheduleAssignmentId: assignment.id,
          title: `Patrol ${assignment.zone}`,
          treeId: representativeTreeIdForZone(assignment.zone),
          ranger: assignment.rangerName,
          taskType: "Patrol",
          source: "Schedule",
          priority: assignment.priorityFlag === "Critical" ? "urgent" : assignment.priorityFlag === "High" ? "high" : "normal",
          status: "pending",
          notes: `${assignment.shiftDay} ${assignment.shiftStart}-${assignment.shiftEnd}. ${assignment.aiReasoningNote}`,
          dispatchedAt: new Date().toISOString(),
        }, tasks);
        if (!draft.ok) continue;
        tasks = [draft.task, ...tasks];
        createdTasks.push(draft.task);
        notifications = [{
          id: notifications.length + 1,
          rangerId: assignment.rangerId,
          rangerName: assignment.rangerName,
          taskId: draft.task.id,
          payloadSummary: `New patrol task: ${assignment.zone} on ${assignment.shiftDay}.`,
          deliveryStatus: "Sent",
          sentAt: new Date().toISOString(),
          readAt: null,
        }, ...notifications];
      }
      currentSchedule = { ...currentSchedule, status: "Published", approvedAt: new Date().toISOString(), approvedBy };
      return ok({ schedule: currentSchedule, tasks, createdTasks, notifications });
    },
    async listNotifications({ ranger = "" } = {}) {
      return notifications.filter((item) => !ranger || item.rangerName === ranger || item.rangerId === ranger);
    },
    async listTasks(filters = {}) {
      return filterRangerTasks(tasks, filters.ranger || "", filters);
    },
    async findTask(id) {
      return tasks.find((task) => taskMatches(task, id)) || null;
    },
    async createTask(draft = {}) {
      const created = createTaskDraft(draft, tasks);
      if (!created.ok) return created;
      tasks = [created.task, ...tasks];
      const ranger = rangers.find((item) => item.name === created.task.ranger);
      notifications = [{
        id: notifications.length + 1,
        rangerId: ranger?.id || created.task.ranger,
        rangerName: created.task.ranger,
        taskId: created.task.id,
        payloadSummary: `${created.task.priority === "urgent" ? "Urgent" : "New"} task: ${created.task.title}`,
        deliveryStatus: "Sent",
        sentAt: new Date().toISOString(),
        readAt: null,
      }, ...notifications];
      return ok({ task: created.task, tasks });
    },
    async updateTaskStatus(id, status) {
      if (!TASK_STATUSES.has(status)) return fail(400, "INVALID_STATUS", "Task status must be pending, in-progress, completed, escalated, skipped, false-positive, or anomaly-found.");
      const task = await this.findTask(id);
      if (!task) return fail(404, "TASK_NOT_FOUND", "Field task not found.");
      if (status === "completed" && !reports.some((report) => report.taskId === task.id)) {
        return fail(400, "EVIDENCE_REQUIRED", "Submit a linked field report before completing this task.");
      }
      const now = new Date().toISOString();
      const doneStatuses = new Set(["completed", "skipped", "false-positive", "anomaly-found"]);
      tasks = tasks.map((item) => taskMatches(item, id) ? {
        ...item,
        status,
        startedAt: status === "in-progress" && !item.startedAt ? now : item.startedAt,
        completedAt: doneStatuses.has(status) ? now : item.completedAt,
      } : item);
      if (status === "completed") {
        reports = reports.map((report) => report.taskId === task.id ? { ...report, reviewStatus: "Approved" } : report);
      }
      return ok({ task: await this.findTask(id), tasks });
    },
    async reassignTask(id, { newRanger = "", reassignedBy = "Admin" } = {}) {
      const task = await this.findTask(id);
      if (!task) return fail(404, "TASK_NOT_FOUND", "Field task not found.");
      const rangerName = newRanger.trim();
      if (!rangerName) return fail(400, "VALIDATION_ERROR", "New ranger is required.");
      const ranger = rangers.find((item) => item.name === rangerName || item.id === rangerName);
      const targetName = ranger?.name || rangerName;
      const now = new Date().toISOString();
      tasks = tasks.map((item) => taskMatches(item, id) ? {
        ...item,
        ranger: targetName,
        status: "pending",
        startedAt: null,
        completedAt: null,
        dispatchedAt: now,
        notes: `${item.notes || ""} | Reassigned by ${reassignedBy} to ${targetName}.`.trim(),
      } : item);
      reports = reports.map((report) => report.taskId === task.id ? { ...report, reviewStatus: "Reassigned" } : report);
      notifications = [{
        id: notifications.length + 1,
        rangerId: ranger?.id || targetName,
        rangerName: targetName,
        taskId: task.id,
        payloadSummary: `Task reassigned to you: ${task.title}`,
        deliveryStatus: "Sent",
        sentAt: now,
        readAt: null,
      }, ...notifications];
      return ok({ task: await this.findTask(id), tasks, notifications });
    },
    async listReports(filters = {}) {
      return filterFieldReports(reports, filters.ranger || "", filters);
    },
    async analyzePhoto({ treeId, photoName = "" } = {}) {
      const tree = treeById(treeId);
      if (!tree) return fail(404, "TREE_NOT_FOUND", "Tree record not found for AI photo analysis.");
      return ok({ analysis: analyzeFieldPhoto({ tree, photoName }) });
    },
    async createReport({ rangerName = "", treeId = "", draft = {} } = {}) {
      const tree = treeById(treeId || draft.treeId);
      if (!tree) return fail(404, "TREE_NOT_FOUND", "Tree record not found for field report.");
      if (!rangerName.trim()) return fail(400, "VALIDATION_ERROR", "Ranger name is required.");
      const report = createFieldReport({ draft: { ...draft, treeId: tree.id }, tree, rangerName, tasks, existingReports: reports });
      reports = [report, ...reports];
      const completedAt = new Date().toISOString();
      const finalTaskStatus = draft.taskStatus && TASK_STATUSES.has(draft.taskStatus) ? draft.taskStatus : "completed";
      if (report.taskId) tasks = tasks.map((task) => task.id === report.taskId ? { ...task, status: finalTaskStatus, completedAt } : task);
      const updatedTree = syncTreeRecordFromReport(tree, report.observedStatus);
      return ok({ report, task: report.taskId ? tasks.find((task) => task.id === report.taskId) : null, tasks, reports, tree: updatedTree });
    },
    async getDashboard() {
      const activeTasks = tasks.filter((task) => task.status === "pending" || task.status === "in-progress").length;
      return ok({
        summary: {
          totalTasks: tasks.length,
          activeTasks,
          completedTasks: tasks.filter((task) => task.status === "completed").length,
          urgentTasks: tasks.filter((task) => task.priority === "urgent" || task.priority === "high").length,
          totalReports: reports.length,
          activeRangers: rangers.filter((ranger) => ranger.status === "active").length,
        },
        schedule: buildSchedule(rangers),
      });
    },
  };
}

function createMysqlFieldBackend(config) {
  const pool = mysql.createPool(config.maintenanceDatabase);

  const insertRanger = (connection, ranger) => connection.execute(
    `INSERT INTO ss2_rangers (id, name, zone, phone, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), zone = VALUES(zone), phone = VALUES(phone), status = VALUES(status)`,
    [ranger.id, ranger.name, ranger.zone, ranger.phone, ranger.status]
  );
  const insertTask = (connection, task) => connection.execute(
    `INSERT INTO ss2_field_tasks
      (id, schedule_assignment_id, title, tree_id, ranger, task_type, source, priority, status, notes, dispatched_at, started_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.scheduleAssignmentId || null,
      task.title,
      task.treeId,
      task.ranger,
      task.taskType || "Inspection",
      task.source,
      task.priority,
      task.status,
      task.notes || "",
      task.dispatchedAt || null,
      task.startedAt || null,
      task.completedAt || null,
    ]
  );
  const insertReport = (connection, report) => connection.execute(
    `INSERT INTO ss2_field_reports
      (id, task_id, tree_id, tree_name, ranger, report_mode, photo_name, photo_sync_status, photo_analysis_status,
       observed_status, manual_cause, manual_treatment, ai_possibilities, selected_ai_possibility_id,
       ai_diagnosis_ref, diagnosis, confidence, treatment, notes, height_measurement, gps_label, timestamp_label, sync_status, review_status, analysis)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      report.id,
      report.taskId || null,
      report.treeId,
      report.treeName,
      report.ranger,
      report.reportMode,
      report.photoName || null,
      report.photoSyncStatus,
      report.photoAnalysisStatus,
      report.observedStatus,
      report.manualCause || null,
      report.manualTreatment || null,
      JSON.stringify(report.aiPossibilities || []),
      report.selectedAiPossibilityId || null,
      report.aiDiagnosisRef || null,
      report.diagnosis || null,
      report.confidence,
      report.treatment || null,
      report.notes || null,
      report.heightMeasurement || null,
      report.gpsLabel || null,
      report.timestamp || null,
      report.syncStatus,
      report.reviewStatus || "Pending Review",
      JSON.stringify(report.analysis || {}),
    ]
  );

  return {
    async health() {
      const connection = await pool.getConnection();
      try {
        await connection.ping();
        return ok({ store: "mysql", database: config.maintenanceDatabase.database });
      } finally {
        connection.release();
      }
    },
    async listRangers({ status = "all" } = {}) {
      const [rows] = status === "all"
        ? await pool.query("SELECT * FROM ss2_rangers ORDER BY id")
        : await pool.execute("SELECT * FROM ss2_rangers WHERE status = ? ORDER BY id", [status]);
      return rows.map(rowToRanger);
    },
    async upsertRanger(draft = {}) {
      if (!draft.name?.trim()) return fail(400, "VALIDATION_ERROR", "Ranger name is required.");
      const current = draft.id ? (await this.listRangers()).find((ranger) => ranger.id === draft.id) : null;
      const ranger = {
        id: draft.id || `R${String((await this.listRangers()).length + 1).padStart(2, "0")}`,
        name: draft.name.trim(),
        zone: draft.zone || current?.zone || "Arboretum",
        phone: draft.phone || current?.phone || "",
        status: draft.status || current?.status || "active",
      };
      if (!RANGER_STATUSES.has(ranger.status)) return fail(400, "INVALID_STATUS", "Ranger status must be active or inactive.");
      await insertRanger(pool, ranger);
      return ok({ ranger });
    },
    async getCurrentSchedule() {
      const [weekRows] = await pool.query("SELECT * FROM ss2_schedule_weeks ORDER BY generated_at DESC, id DESC LIMIT 1");
      if (!weekRows[0]) return ok({ schedule: null });
      const [assignmentRows] = await pool.execute("SELECT * FROM ss2_schedule_assignments WHERE schedule_week_id = ? ORDER BY shift_date, ranger_name", [weekRows[0].id]);
      return ok({ schedule: rowToScheduleWeek(weekRows[0], assignmentRows.map(rowToAssignment)) });
    },
    async generateSchedule({ createdBy = "Admin", weekLabel } = {}) {
      const rangers = await this.listRangers({ status: "active" });
      if (!rangers.length) return fail(400, "NO_ACTIVE_RANGERS", "No active rangers available for scheduling.");
      const [historyRows] = await pool.query("SELECT * FROM ss2_schedule_assignments ORDER BY shift_date DESC, id DESC LIMIT 50");
      const baseWeekLabel = weekLabel || buildWeekLabel();
      const [duplicateRows] = await pool.execute("SELECT id FROM ss2_schedule_weeks WHERE week_label = ?", [baseWeekLabel]);
      const finalWeekLabel = duplicateRows.length ? `${baseWeekLabel} #${duplicateRows.length + 1}` : baseWeekLabel;
      const generated = buildAiSchedule({
        rangers,
        previousAssignments: historyRows.map(rowToAssignment),
        weekLabel: finalWeekLabel,
        createdBy,
      });
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [weekResult] = await connection.execute(
          "INSERT INTO ss2_schedule_weeks (created_by, week_label, status, ai_reasoning_summary) VALUES (?, ?, 'Draft', ?)",
          [generated.createdBy, generated.weekLabel, generated.aiReasoningSummary]
        );
        const scheduleWeekId = weekResult.insertId;
        for (const assignment of generated.assignments) {
          await connection.execute(
            `INSERT INTO ss2_schedule_assignments
              (schedule_week_id, ranger_id, ranger_name, zone, shift_date, shift_day, shift_start, shift_end, priority_flag, ai_reasoning_note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              scheduleWeekId,
              assignment.rangerId,
              assignment.rangerName,
              assignment.zone,
              assignment.shiftDate,
              assignment.shiftDay,
              assignment.shiftStart,
              assignment.shiftEnd,
              assignment.priorityFlag,
              assignment.aiReasoningNote,
            ]
          );
        }
        await connection.commit();
        return await this.getCurrentSchedule();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async updateScheduleAssignment(id, patch = {}) {
      const [rows] = await pool.execute("SELECT * FROM ss2_schedule_assignments WHERE id = ?", [id]);
      if (!rows[0]) return fail(404, "ASSIGNMENT_NOT_FOUND", "Schedule assignment not found.");
      const current = rowToAssignment(rows[0]);
      const rangers = await this.listRangers();
      const nextRanger = patch.rangerId ? rangers.find((ranger) => ranger.id === patch.rangerId) : null;
      const next = {
        rangerId: nextRanger?.id || current.rangerId,
        rangerName: nextRanger?.name || patch.rangerName || current.rangerName,
        zone: patch.zone || current.zone,
        editedBy: patch.editedBy || "Admin",
        editReason: patch.editReason || "Admin manually adjusted the AI-generated schedule.",
      };
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute(
          `UPDATE ss2_schedule_assignments
           SET ranger_id = ?, ranger_name = ?, zone = ?, manual_override = TRUE, updated_by = ?
           WHERE id = ?`,
          [next.rangerId, next.rangerName, next.zone, next.editedBy, id]
        );
        await connection.execute(
          `INSERT INTO ss2_schedule_change_logs
            (assignment_id, schedule_week_id, old_ranger_id, old_ranger_name, old_zone, new_ranger_id, new_ranger_name, new_zone, edited_by, edit_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, current.scheduleWeekId, current.rangerId, current.rangerName, current.zone, next.rangerId, next.rangerName, next.zone, next.editedBy, next.editReason]
        );
        await connection.commit();
        return await this.getCurrentSchedule();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async publishSchedule(id, { approvedBy = "Admin" } = {}) {
      const [weekRows] = await pool.execute("SELECT * FROM ss2_schedule_weeks WHERE id = ?", [id]);
      if (!weekRows[0]) return fail(404, "SCHEDULE_NOT_FOUND", "Schedule week not found.");
      const [assignmentRows] = await pool.execute("SELECT * FROM ss2_schedule_assignments WHERE schedule_week_id = ? ORDER BY shift_date, ranger_name", [id]);
      const assignments = assignmentRows.map(rowToAssignment);
      const existingTasks = await this.listTasks();
      const connection = await pool.getConnection();
      const createdTasks = [];
      try {
        await connection.beginTransaction();
        await connection.execute("UPDATE ss2_schedule_weeks SET status = 'Published', approved_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
        for (const assignment of assignments) {
          const [existingRows] = await connection.execute("SELECT * FROM ss2_field_tasks WHERE schedule_assignment_id = ? LIMIT 1", [assignment.id]);
          if (existingRows[0]) continue;
          const created = createTaskDraft({
            scheduleAssignmentId: assignment.id,
            title: `Patrol ${assignment.zone}`,
            treeId: representativeTreeIdForZone(assignment.zone),
            ranger: assignment.rangerName,
            taskType: "Patrol",
            source: "Schedule",
            priority: assignment.priorityFlag === "Critical" ? "urgent" : assignment.priorityFlag === "High" ? "high" : "normal",
            status: "pending",
            notes: `${assignment.shiftDay} ${assignment.shiftStart}-${assignment.shiftEnd}. ${assignment.aiReasoningNote}`,
            dispatchedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
          }, [...existingTasks, ...createdTasks]);
          if (!created.ok) continue;
          await insertTask(connection, created.task);
          await connection.execute(
            `INSERT INTO ss2_push_notifications (ranger_id, ranger_name, task_id, payload_summary, delivery_status)
             VALUES (?, ?, ?, ?, 'Sent')`,
            [assignment.rangerId, assignment.rangerName, created.task.id, `New patrol task: ${assignment.zone} on ${assignment.shiftDay}.`]
          );
          createdTasks.push(created.task);
        }
        await connection.commit();
        return ok({ schedule: (await this.getCurrentSchedule()).schedule, tasks: await this.listTasks(), createdTasks });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async listNotifications({ ranger = "" } = {}) {
      const [rows] = ranger
        ? await pool.execute("SELECT * FROM ss2_push_notifications WHERE ranger_id = ? OR ranger_name = ? ORDER BY sent_at DESC, id DESC", [ranger, ranger])
        : await pool.query("SELECT * FROM ss2_push_notifications ORDER BY sent_at DESC, id DESC");
      return rows.map(rowToNotification);
    },
    async listTasks(filters = {}) {
      const [rows] = await pool.query("SELECT * FROM ss2_field_tasks ORDER BY FIELD(priority, 'urgent', 'high', 'normal'), created_at DESC, id DESC");
      return filterRangerTasks(rows.map(rowToTask), filters.ranger || "", filters);
    },
    async findTask(id) {
      const [rows] = await pool.execute("SELECT * FROM ss2_field_tasks WHERE id = ?", [id]);
      return rows[0] ? rowToTask(rows[0]) : null;
    },
    async createTask(draft = {}) {
      const tasks = await this.listTasks();
      const created = createTaskDraft(draft, tasks);
      if (!created.ok) return created;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await insertTask(connection, created.task);
        const [rangerRows] = await connection.execute("SELECT * FROM ss2_rangers WHERE name = ? LIMIT 1", [created.task.ranger]);
        await connection.execute(
          `INSERT INTO ss2_push_notifications (ranger_id, ranger_name, task_id, payload_summary, delivery_status)
           VALUES (?, ?, ?, ?, 'Sent')`,
          [
            rangerRows[0]?.id || created.task.ranger,
            created.task.ranger,
            created.task.id,
            `${created.task.priority === "urgent" ? "Urgent" : "New"} task: ${created.task.title}`,
          ]
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return ok({ task: created.task, tasks: await this.listTasks() });
    },
    async updateTaskStatus(id, status) {
      if (!TASK_STATUSES.has(status)) return fail(400, "INVALID_STATUS", "Task status must be pending, in-progress, completed, escalated, skipped, false-positive, or anomaly-found.");
      if (status === "completed") {
        const [reportRows] = await pool.execute("SELECT id FROM ss2_field_reports WHERE task_id = ? LIMIT 1", [id]);
        if (!reportRows[0]) return fail(400, "EVIDENCE_REQUIRED", "Submit a linked field report before completing this task.");
      }
      const [result] = await pool.execute(
        `UPDATE ss2_field_tasks
         SET status = ?,
             started_at = CASE WHEN ? = 'in-progress' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
             completed_at = CASE WHEN ? IN ('completed', 'skipped', 'false-positive', 'anomaly-found') THEN CURRENT_TIMESTAMP ELSE completed_at END
         WHERE id = ?`,
        [status, status, status, id]
      );
      if (!result.affectedRows) return fail(404, "TASK_NOT_FOUND", "Field task not found.");
      if (status === "completed") {
        await pool.execute("UPDATE ss2_field_reports SET review_status = 'Approved' WHERE task_id = ?", [id]);
      }
      return ok({ task: await this.findTask(id), tasks: await this.listTasks() });
    },
    async reassignTask(id, { newRanger = "", reassignedBy = "Admin" } = {}) {
      const task = await this.findTask(id);
      if (!task) return fail(404, "TASK_NOT_FOUND", "Field task not found.");
      const rangerName = newRanger.trim();
      if (!rangerName) return fail(400, "VALIDATION_ERROR", "New ranger is required.");
      const [rangerRows] = await pool.execute("SELECT * FROM ss2_rangers WHERE id = ? OR name = ? LIMIT 1", [rangerName, rangerName]);
      const targetName = rangerRows[0]?.name || rangerName;
      const targetId = rangerRows[0]?.id || targetName;
      const reassignmentNote = `${task.notes || ""} | Reassigned by ${reassignedBy} to ${targetName}.`.trim();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute(
          `UPDATE ss2_field_tasks
           SET ranger = ?, status = 'pending', started_at = NULL, completed_at = NULL, dispatched_at = CURRENT_TIMESTAMP, notes = ?
           WHERE id = ?`,
          [targetName, reassignmentNote, id]
        );
        await connection.execute("UPDATE ss2_field_reports SET review_status = 'Reassigned' WHERE task_id = ?", [id]);
        await connection.execute(
          `INSERT INTO ss2_push_notifications (ranger_id, ranger_name, task_id, payload_summary, delivery_status)
           VALUES (?, ?, ?, ?, 'Sent')`,
          [targetId, targetName, task.id, `Task reassigned to you: ${task.title}`]
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return ok({ task: await this.findTask(id), tasks: await this.listTasks() });
    },
    async listReports(filters = {}) {
      const [rows] = await pool.query("SELECT * FROM ss2_field_reports ORDER BY created_at DESC, id DESC");
      return filterFieldReports(rows.map(rowToReport), filters.ranger || "", filters);
    },
    async analyzePhoto({ treeId, photoName = "" } = {}) {
      const tree = treeById(treeId);
      if (!tree) return fail(404, "TREE_NOT_FOUND", "Tree record not found for AI photo analysis.");
      return ok({ analysis: analyzeFieldPhoto({ tree, photoName }) });
    },
    async createReport({ rangerName = "", treeId = "", draft = {} } = {}) {
      const tree = treeById(treeId || draft.treeId);
      if (!tree) return fail(404, "TREE_NOT_FOUND", "Tree record not found for field report.");
      if (!rangerName.trim()) return fail(400, "VALIDATION_ERROR", "Ranger name is required.");
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [taskRows] = await connection.query("SELECT * FROM ss2_field_tasks ORDER BY created_at DESC, id DESC");
        const [reportRows] = await connection.query("SELECT * FROM ss2_field_reports ORDER BY created_at DESC, id DESC");
        const report = createFieldReport({
          draft: { ...draft, treeId: tree.id },
          tree,
          rangerName,
          tasks: taskRows.map(rowToTask),
          existingReports: reportRows.map(rowToReport),
        });
        await insertReport(connection, report);
        const finalTaskStatus = draft.taskStatus && TASK_STATUSES.has(draft.taskStatus) ? draft.taskStatus : "completed";
        if (report.taskId) await connection.execute("UPDATE ss2_field_tasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?", [finalTaskStatus, report.taskId]);
        const updatedTree = syncTreeRecordFromReport(tree, report.observedStatus);
        try {
          await connection.execute(
            "UPDATE trees SET health_status = ?, health_score = ? WHERE id = ?",
            [report.observedStatus, healthScoreForStatus(report.observedStatus), tree.id]
          );
        } catch (error) {
          if (!["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"].includes(error.code)) throw error;
        }
        await connection.commit();
        return ok({ report, task: report.taskId ? await this.findTask(report.taskId) : null, tasks: await this.listTasks(), reports: await this.listReports(), tree: updatedTree });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async getDashboard() {
      const [taskRows] = await pool.query("SELECT * FROM ss2_field_tasks");
      const [reportRows] = await pool.query("SELECT * FROM ss2_field_reports");
      const rangers = await this.listRangers();
      const tasks = taskRows.map(rowToTask);
      const currentSchedule = await this.getCurrentSchedule();
      return ok({
        summary: {
          totalTasks: tasks.length,
          activeTasks: tasks.filter((task) => task.status === "pending" || task.status === "in-progress").length,
          completedTasks: tasks.filter((task) => task.status === "completed").length,
          urgentTasks: tasks.filter((task) => task.priority === "urgent" || task.priority === "high").length,
          totalReports: reportRows.length,
          activeRangers: rangers.filter((ranger) => ranger.status === "active").length,
        },
        schedule: currentSchedule.schedule || buildSchedule(rangers),
      });
    },
  };
}

export function createFieldBackend({ config = getBackendConfig() } = {}) {
  return config.fieldStore === "mysql"
    ? createMysqlFieldBackend(config)
    : createMemoryFieldBackend();
}
