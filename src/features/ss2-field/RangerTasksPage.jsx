import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
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

export default function RangerTasksPage({ user, trees = [], tasks, onUpdateTask, onSubmitTaskEvidence, onOpenScanner, showToast }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [source, setSource] = useState("all");
  const [activeTab, setActiveTab] = useState("schedule");
  const [nowMs, setNowMs] = useState(Date.now());
  const [completionTask, setCompletionTask] = useState(null);
  const [evidenceTreeId, setEvidenceTreeId] = useState("");
  const [observedStatus, setObservedStatus] = useState("healthy");
  const [manualCause, setManualCause] = useState("");
  const [manualTreatment, setManualTreatment] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const rangerName = user?.name || "";
  const rangerTasks = useMemo(() => filterRangerTasks(tasks, rangerName), [rangerName, tasks]);
  const filteredTasks = useMemo(() => {
    const visible = filterRangerTasks(tasks, rangerName, { query, status, priority, source });
    if (activeTab === "history") return visible;
    return visible.filter((task) => activeTab === "schedule" ? isScheduleTask(task) : !isScheduleTask(task));
  }, [activeTab, priority, query, rangerName, source, status, tasks]);
  const completed = rangerTasks.filter((task) => task.status === "completed").length;
  const active = rangerTasks.filter((task) => task.status === "pending" || task.status === "in-progress").length;
  const urgentHigh = rangerTasks.filter((task) => task.priority === "urgent" || task.priority === "high").length;
  const scheduleCount = rangerTasks.filter(isScheduleTask).length;
  const specialCount = rangerTasks.length - scheduleCount;
  const activePatrol = rangerTasks.find((task) => task.status === "in-progress");
  const sources = [...new Set(rangerTasks.map((task) => task.source))];

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

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
      setEvidenceNotes("");
    }
  };

  const submitEvidence = () => {
    if (!completionTask) return;
    if (!evidenceTreeId || !manualCause.trim() || !manualTreatment.trim()) {
      showToast("Complete the evidence fields before closing this task.");
      return;
    }
    const report = onSubmitTaskEvidence?.(completionTask, {
      taskId: completionTask.id,
      treeId: evidenceTreeId,
      reportMode: "manual",
      observedStatus,
      manualCause,
      manualTreatment,
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
      <Card title="Today's Task Bar" subtitle="Scheduled patrols and special admin dispatches are separated for field use">
        <div className="segmented task-tabs">
          <button className={activeTab === "schedule" ? "active" : ""} onClick={() => setActiveTab("schedule")}>Normal Schedule <b>{scheduleCount}</b></button>
          <button className={activeTab === "special" ? "active" : ""} onClick={() => setActiveTab("special")}>Special Tasks <b>{specialCount}</b></button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>History <b>{completed}</b></button>
        </div>
        <div className="page-toolbar">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task ID, title, tree ID, source or notes..." />
          <div className="toolbar-actions">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All status</option><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="escalated">Escalated</option>
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="all">All priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option>
            </select>
            <select value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="all">All source</option>{sources.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div className="ranger-task-stack">
          {filteredTasks
            .filter((task) => activeTab === "history" ? task.status === "completed" : task.status !== "completed")
            .map((task) => <article key={task.id} className={`mobile-task priority-${task.priority}`}>
            <div className="split-heading"><small>{task.priority === "urgent" ? "EMERGENCY DISPATCH" : isScheduleTask(task) ? "NORMAL PATROL" : task.source}</small><StatusPill status={task.status} /></div>
            <h3>{task.title}</h3>
            <div className="task-chip-row">
              <span><b>{isScheduleTask(task) ? "Zone" : "Tree/Area"}</b>{taskZone(task)}</span>
              <span><b>Priority</b>{task.priority}</span>
              <span><b>Duration</b>{task.status === "completed" ? "Completed" : elapsedLabel(task.startedAt, nowMs)}</span>
            </div>
            <p>{compactNotes(task.notes)}</p>
            {task.status === "in-progress" && (
              <div className="tracking-panel">
                <strong>Field tracking active</strong>
                <span>Started at {new Date(task.startedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. GPS route and patrol duration are being recorded for admin review.</span>
              </div>
            )}
            <div className="button-row">
              <button className="button button-small" disabled={task.status === "completed"} onClick={() => advanceTask(task)}>{task.status === "pending" ? "Accept & Start Tracking" : task.status === "completed" ? "Completed" : "Complete Patrol"}</button>
              <button className="button button-small button-outline" onClick={onOpenScanner}>Scan QR</button>
            </div>
          </article>)}
          {filteredTasks.filter((task) => activeTab === "history" ? task.status === "completed" : task.status !== "completed").length === 0 && <div className="it-empty-state"><h3>No tasks in this tab</h3><p>Completed work moves into History after evidence is submitted.</p></div>}
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
