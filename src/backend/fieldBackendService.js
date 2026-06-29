import mysql from "mysql2/promise";
import { INITIAL_FIELD_REPORTS } from "../data/fieldReports.js";
import { RANGERS } from "../data/rangers.js";
import { INITIAL_TASKS } from "../data/tasks.js";
import { TREES } from "../data/trees.js";
import { nextTaskId } from "../services/adminService.js";
import { analyzeFieldPhoto, createFieldReport, filterFieldReports, filterRangerTasks } from "../services/rangerService.js";
import { getBackendConfig } from "./backendConfig.js";

const TASK_STATUSES = new Set(["pending", "in-progress", "completed", "escalated"]);
const TASK_PRIORITIES = new Set(["normal", "high", "urgent"]);
const RANGER_STATUSES = new Set(["active", "inactive"]);

function ok(data = {}) {
  return { ok: true, ...data };
}

function fail(status, error, message) {
  return { ok: false, status, error, message };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    title: row.title,
    treeId: row.tree_id,
    ranger: row.ranger,
    source: row.source,
    priority: row.priority,
    status: row.status,
    notes: row.notes || "",
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
    diagnosis: row.diagnosis || "",
    confidence: row.confidence,
    treatment: row.treatment || "",
    notes: row.notes || "",
    gpsLabel: row.gps_label || "",
    timestamp: row.timestamp_label || "",
    syncStatus: row.sync_status,
    analysis: parseJson(row.analysis, {}),
  };
}

function buildSchedule(rangers = RANGERS) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const zones = ["Arboretum", "Pemuliharaan", "Tanaman", "Riparian", "Tapak Semaian"];
  const active = rangers.filter((ranger) => ranger.status === "active");
  return {
    week: "1 - 5 June 2026",
    days,
    assignments: active.map((ranger, rangerIndex) => ({
      rangerId: ranger.id,
      ranger: ranger.name,
      cells: days.map((day, dayIndex) => ({
        day,
        zone: dayIndex === 0 ? ranger.zone : zones[(rangerIndex + dayIndex) % zones.length],
      })),
    })),
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
      id: draft.id || nextTaskId(tasks),
      title,
      treeId,
      ranger,
      source: draft.source || "Admin urgent dispatch",
      priority,
      status: draft.status || "pending",
      notes: draft.notes || `${title}${draft.zone ? ` Zone: ${draft.zone}.` : ""}`,
    },
  });
}

function createMemoryFieldBackend() {
  let rangers = clone(RANGERS);
  let tasks = clone(INITIAL_TASKS);
  let reports = clone(INITIAL_FIELD_REPORTS);

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
      return ok({ task: created.task, tasks });
    },
    async updateTaskStatus(id, status) {
      if (!TASK_STATUSES.has(status)) return fail(400, "INVALID_STATUS", "Task status must be pending, in-progress, completed, or escalated.");
      const task = await this.findTask(id);
      if (!task) return fail(404, "TASK_NOT_FOUND", "Field task not found.");
      tasks = tasks.map((item) => taskMatches(item, id) ? { ...item, status } : item);
      return ok({ task: await this.findTask(id), tasks });
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
      if (report.taskId) tasks = tasks.map((task) => task.id === report.taskId ? { ...task, status: "completed" } : task);
      return ok({ report, task: report.taskId ? tasks.find((task) => task.id === report.taskId) : null, tasks, reports });
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
    async reset() {
      rangers = clone(RANGERS);
      tasks = clone(INITIAL_TASKS);
      reports = clone(INITIAL_FIELD_REPORTS);
      return ok({ rangers, tasks, reports });
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
    `INSERT INTO ss2_field_tasks (id, title, tree_id, ranger, source, priority, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [task.id, task.title, task.treeId, task.ranger, task.source, task.priority, task.status, task.notes || ""]
  );
  const insertReport = (connection, report) => connection.execute(
    `INSERT INTO ss2_field_reports
      (id, task_id, tree_id, tree_name, ranger, report_mode, photo_name, photo_sync_status, photo_analysis_status,
       observed_status, manual_cause, manual_treatment, ai_possibilities, selected_ai_possibility_id,
       diagnosis, confidence, treatment, notes, gps_label, timestamp_label, sync_status, analysis)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      report.diagnosis || null,
      report.confidence,
      report.treatment || null,
      report.notes || null,
      report.gpsLabel || null,
      report.timestamp || null,
      report.syncStatus,
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
    async listTasks(filters = {}) {
      const [rows] = await pool.query("SELECT * FROM ss2_field_tasks ORDER BY created_at DESC, id DESC");
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
      await insertTask(pool, created.task);
      return ok({ task: created.task, tasks: await this.listTasks() });
    },
    async updateTaskStatus(id, status) {
      if (!TASK_STATUSES.has(status)) return fail(400, "INVALID_STATUS", "Task status must be pending, in-progress, completed, or escalated.");
      const [result] = await pool.execute("UPDATE ss2_field_tasks SET status = ? WHERE id = ?", [status, id]);
      if (!result.affectedRows) return fail(404, "TASK_NOT_FOUND", "Field task not found.");
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
        if (report.taskId) await connection.execute("UPDATE ss2_field_tasks SET status = 'completed' WHERE id = ?", [report.taskId]);
        await connection.commit();
        return ok({ report, task: report.taskId ? await this.findTask(report.taskId) : null, tasks: await this.listTasks(), reports: await this.listReports() });
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
      return ok({
        summary: {
          totalTasks: tasks.length,
          activeTasks: tasks.filter((task) => task.status === "pending" || task.status === "in-progress").length,
          completedTasks: tasks.filter((task) => task.status === "completed").length,
          urgentTasks: tasks.filter((task) => task.priority === "urgent" || task.priority === "high").length,
          totalReports: reportRows.length,
          activeRangers: rangers.filter((ranger) => ranger.status === "active").length,
        },
        schedule: buildSchedule(rangers),
      });
    },
    async reset() {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM ss2_field_reports");
        await connection.query("DELETE FROM ss2_field_tasks");
        await connection.query("DELETE FROM ss2_rangers");
        for (const ranger of RANGERS) await insertRanger(connection, ranger);
        for (const task of INITIAL_TASKS) await insertTask(connection, task);
        for (const report of INITIAL_FIELD_REPORTS) await insertReport(connection, report);
        await connection.commit();
        return ok({ rangers: await this.listRangers(), tasks: await this.listTasks(), reports: await this.listReports() });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}

export function createFieldBackend({ config = getBackendConfig() } = {}) {
  return config.fieldStore === "mysql"
    ? createMysqlFieldBackend(config)
    : createMemoryFieldBackend();
}
