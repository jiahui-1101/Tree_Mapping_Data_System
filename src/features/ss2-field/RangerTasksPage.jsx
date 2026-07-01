import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { fetchFieldNotifications } from "../../services/fieldApiService.js";
import { filterRangerTasks } from "../../services/rangerService.js";

function isScheduleTask(task) {
  return task.source === "Schedule" || task.taskType === "Patrol" || Boolean(task.scheduleAssignmentId);
}

function taskZone(task) {
  const zoneMatch = String(task.notes || "").match(/(?:Patrol|Zone:)\s*([A-Za-z ]+)/i);
  return isScheduleTask(task) ? task.treeId : zoneMatch?.[1]?.trim() || task.treeId;
}

function compactNotes(notes = "") {
  return String(notes).split(". ").slice(0, 2).join(". ").slice(0, 140);
}

function elapsedLabel(startedAt, nowMs) {
  if (!startedAt) return "Not started";
  const elapsedMs = Math.max(0, nowMs - new Date(startedAt).getTime());
  const minutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${Math.max(1, rest)}m`;
}

const DONE_STATUSES = new Set(["completed", "skipped", "false-positive", "anomaly-found"]);

export default function RangerTasksPage({ user, trees = [], tasks, onUpdateTask, onSubmitTaskEvidence, onOpenScanner, showToast }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [source, setSource] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [nowMs, setNowMs] = useState(Date.now());
  const [completionTask, setCompletionTask] = useState(null);
  const [evidenceTreeId, setEvidenceTreeId] = useState("");
  const [observedStatus, setObservedStatus] = useState("healthy");
  const [manualCause, setManualCause] = useState("");
  const [manualTreatment, setManualTreatment] = useState("");
  const [heightMeasurement, setHeightMeasurement] = useState("");
  const [taskOutcome, setTaskOutcome] = useState("completed");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [notifications, setNotifications] = useState([]);
  const rangerName = user?.name || "";
  const rangerTasks = useMemo(() => filterRangerTasks(tasks, rangerName), [rangerName, tasks]);
  const baseFilteredTasks = useMemo(() => filterRangerTasks(tasks, rangerName, { query, status, priority, source }), [priority, query, rangerName, source, status, tasks]);
  const visibleTasks = useMemo(() => baseFilteredTasks.filter((task) => {
    if (activeTab === "schedule") return isScheduleTask(task);
    if (activeTab === "special") return !isScheduleTask(task);
    if (activeTab === "history") return DONE_STATUSES.has(task.status);
    return true;
  }), [activeTab, baseFilteredTasks]);
  const completed = rangerTasks.filter((task) => DONE_STATUSES.has(task.status)).length;
  const active = rangerTasks.filter((task) => task.status === "pending" || task.status === "in-progress").length;
  const urgentHigh = rangerTasks.filter((task) => task.priority === "urgent" || task.priority === "high").length;
  const viewAllCount = baseFilteredTasks.length;
  const scheduleCount = baseFilteredTasks.filter(isScheduleTask).length;
  const specialCount = baseFilteredTasks.filter((task) => !isScheduleTask(task)).length;
  const historyCount = baseFilteredTasks.filter((task) => DONE_STATUSES.has(task.status)).length;
  const activePatrol = rangerTasks.find((task) => task.status === "in-progress");
  const sources = [...new Set(rangerTasks.map((task) => task.source))];

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);
  useEffect(() => {
    if (!rangerName) return undefined;
    let active = true;
    const load = () => fetchFieldNotifications({ ranger: rangerName }).then((result) => {
      if (active && result?.data) setNotifications(result.data);
    });
    void load();
    const intervalId = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [rangerName]);

  const advanceTask = (task) => {
    if (task.status === "pending") {
      onUpdateTask(task.id, "in-progress");
      showToast(`${task.id} accepted. Patrol timer and field tracking started.`);
      return;
    }
    if (task.status === "in-progress") {
      setCompletionTask(task);
      setEvidenceTreeId(trees.find((tree) => tree.id === task.treeId)?.id || trees[0]?.id || "");
      setObservedStatus("healthy");
      setManualCause("");
      setManualTreatment("");
      setHeightMeasurement("");
      setTaskOutcome("completed");
      setEvidenceNotes("");
    }
  };

  const submitEvidence = async () => {
    if (!completionTask) return;
    if (!evidenceTreeId || !manualCause.trim() || !manualTreatment.trim()) {
      showToast("Complete the evidence fields before closing this task.");
      return;
    }
    const report = await onSubmitTaskEvidence?.(completionTask, {
      taskId: completionTask.id,
      treeId: evidenceTreeId,
      reportMode: "manual",
      observedStatus,
      manualCause,
      manualTreatment,
      heightMeasurement,
      taskStatus: taskOutcome,
      notes: evidenceNotes || `Completed ${completionTask.title}.`,
      timestamp: new Date().toLocaleString(),
    });
    if (report) setCompletionTask(null);
  };

  return (
    <>
      <button className="scan-hero" onClick={onOpenScanner}>
        <span>▣</span><div><h2>Scan Tree QR Code</h2><p>Choose manual assessment or AI photo diagnosis after scanning.</p></div><b>Open Scanner →</b>
      </button>
      <div className="ranger-summary"><span className="avatar">{user?.initials || "R"}</span><div><h3>{rangerName}</h3><p>{user?.id || "Ranger"} · {activePatrol ? `Tracking ${activePatrol.id} for ${elapsedLabel(activePatrol.startedAt, nowMs)}` : "Ready for dispatch"}</p></div><strong>{rangerTasks.length}<small>Assigned</small></strong><strong>{active}<small>Active</small></strong><strong>{completed}<small>Completed</small></strong><strong>{urgentHigh}<small>Urgent/High</small></strong></div>
      {notifications.length > 0 && (
        <Card title="Backend Notifications" subtitle="Latest task dispatches from SS2 push notification ledger">
          <div className="notification-feed">
            {notifications.slice(0, 4).map((item) => (
              <article key={item.id}>
                <span><b>{item.deliveryStatus}</b><small>{item.sentAt ? new Date(item.sentAt).toLocaleString() : "Just now"}</small></span>
                <p>{item.payloadSummary}</p>
              </article>
            ))}
          </div>
        </Card>
      )}
      <Card title="Today's Task Bar" subtitle="Scheduled patrols and special admin dispatches are separated for field use">
        <div className="segmented task-tabs">
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>View All <b>{viewAllCount}</b></button>
          <button className={activeTab === "schedule" ? "active" : ""} onClick={() => setActiveTab("schedule")}>Normal Schedule <b>{scheduleCount}</b></button>
          <button className={activeTab === "special" ? "active" : ""} onClick={() => setActiveTab("special")}>Special Tasks <b>{specialCount}</b></button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => { setActiveTab("history"); setStatus("completed"); }}>History <b>{historyCount}</b></button>
        </div>
        <div className="page-toolbar">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task ID, title, tree ID, source or notes..." />
          <div className="toolbar-actions">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All status</option><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="skipped">Skipped</option><option value="false-positive">False positive</option><option value="anomaly-found">Anomaly found</option><option value="escalated">Escalated</option>
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="all">All priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option>
            </select>
            <select value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="all">All source</option>{sources.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div className="ranger-task-grid">
          {visibleTasks.map((task) => <article key={task.id} className={`mobile-task priority-${task.priority}`}>
            <div className="split-heading"><small>{task.priority === "urgent" ? "EMERGENCY DISPATCH" : isScheduleTask(task) ? "NORMAL PATROL" : task.source}</small><StatusPill status={task.status} /></div>
            <h3>{task.title}</h3>
            <div className="task-chip-row">
              <span><b>{isScheduleTask(task) ? "Zone" : "Tree/Area"}</b>{taskZone(task)}</span>
              <span><b>Priority</b>{task.priority}</span>
              <span><b>Duration</b>{DONE_STATUSES.has(task.status) ? "Closed" : elapsedLabel(task.startedAt, nowMs)}</span>
            </div>
            <p>{compactNotes(task.notes)}</p>
            {task.status === "in-progress" && (
              <div className="tracking-panel">
                <strong>Field tracking active</strong>
                <span>Started at {new Date(task.startedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. GPS route and patrol duration are being recorded for admin review.</span>
              </div>
            )}
            <div className="button-row">
              <button className="button button-small" disabled={DONE_STATUSES.has(task.status)} onClick={() => advanceTask(task)}>{task.status === "pending" ? "Accept & Start Tracking" : DONE_STATUSES.has(task.status) ? "Closed" : "Complete Patrol"}</button>
              <button className="button button-small button-outline" onClick={onOpenScanner}>Scan QR</button>
            </div>
          </article>)}
          {visibleTasks.length === 0 && <div className="it-empty-state"><h3>No tasks match this view</h3><p>Try another tab or adjust the status, priority, source, and search filters.</p></div>}
        </div>
      </Card>
      {completionTask && (
        <Modal title={`Complete ${completionTask.id} with evidence`} onClose={() => setCompletionTask(null)}>
          <p className="muted">Submit a field report before this task can be marked completed.</p>
          <label className="field-label">Observed tree</label>
          <select value={evidenceTreeId} onChange={(event) => setEvidenceTreeId(event.target.value)}>
            {trees.map((tree) => <option key={tree.id} value={tree.id}>{tree.id} - {tree.name}</option>)}
          </select>
          <label className="field-label">Observed status</label>
          <select value={observedStatus} onChange={(event) => setObservedStatus(event.target.value)}>
            <option value="healthy">Healthy</option>
            <option value="monitor">Monitor</option>
            <option value="critical">Critical</option>
          </select>
          <label className="field-label">Final task outcome</label>
          <select value={taskOutcome} onChange={(event) => setTaskOutcome(event.target.value)}>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
            <option value="false-positive">False positive</option>
            <option value="anomaly-found">Anomaly found</option>
          </select>
          <label className="field-label">Height measurement (m)</label>
          <input type="number" min="0" step="0.1" value={heightMeasurement} onChange={(event) => setHeightMeasurement(event.target.value)} placeholder="e.g. 8.5" />
          <label className="field-label">Evidence / cause found</label>
          <input value={manualCause} onChange={(event) => setManualCause(event.target.value)} placeholder="e.g. No pest signs found during zone patrol" />
          <label className="field-label">Action taken</label>
          <input value={manualTreatment} onChange={(event) => setManualTreatment(event.target.value)} placeholder="e.g. Cleared debris and scheduled follow-up watering" />
          <label className="field-label">Extra notes</label>
          <textarea value={evidenceNotes} onChange={(event) => setEvidenceNotes(event.target.value)} placeholder="Optional patrol notes for admin review" />
          <button className="button button-block" onClick={submitEvidence}>Submit Report & Complete Task</button>
        </Modal>
      )}
    </>
  );
}
