import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";

const PRIORITY_WEIGHT = { urgent: 0, high: 1, normal: 2 };

function formatDateTime(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function durationLabel(task) {
  if (!task.startedAt) return "Not started";
  const end = task.completedAt ? new Date(task.completedAt).getTime() : Date.now();
  const minutes = Math.max(1, Math.floor((end - new Date(task.startedAt).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${minutes}m`;
}

function taskReport(fieldReports, task) {
  return fieldReports.find((report) => report.taskId === task.id) || null;
}

export default function TaskTrackerPage({ tasks, fieldReports = [], rangers: rangerAccounts = [], onUpdateTask, onReassignTask, showToast }) {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [ranger, setRanger] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [source, setSource] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [reassignTarget, setReassignTarget] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const taskRangers = useMemo(() => [...new Set(tasks.map((task) => task.ranger))], [tasks]);
  const assignableRangers = useMemo(() => {
    const activeAccounts = rangerAccounts.filter((item) => item.status !== "inactive").map((item) => item.name);
    return [...new Set([...activeAccounts, ...taskRangers])].filter(Boolean);
  }, [rangerAccounts, taskRangers]);
  const sources = useMemo(() => [...new Set(tasks.map((task) => task.source))], [tasks]);
  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks
      .filter((task) => ranger === "all" || task.ranger === ranger)
      .filter((task) => status === "all" || task.status === status)
      .filter((task) => priority === "all" || task.priority === priority)
      .filter((task) => source === "all" || task.source === source)
      .filter((task) => !needle || `${task.id} ${task.title} ${task.treeId} ${task.ranger} ${task.source} ${task.notes}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sortBy === "priority") return (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
        if (sortBy === "ranger") return a.ranger.localeCompare(b.ranger);
        if (sortBy === "status") return a.status.localeCompare(b.status);
        return String(b.startedAt || b.dispatchedAt || "").localeCompare(String(a.startedAt || a.dispatchedAt || ""));
      });
  }, [priority, query, ranger, sortBy, source, status, tasks]);
  const latestReport = selected ? taskReport(fieldReports, selected) : null;

  const update = (nextStatus) => {
    onUpdateTask(selected.id, nextStatus);
    showToast(`Task ${selected.id} updated to ${nextStatus}. Ranger lifecycle state synced.`);
    setSelected(null);
  };
  const reassign = async () => {
    if (!selected || !reassignTarget) {
      showToast("Choose a ranger before reassigning this task.");
      return;
    }
    setReassigning(true);
    const task = await onReassignTask?.(selected.id, reassignTarget);
    setReassigning(false);
    if (task) setSelected(task);
  };

  return (
    <>
      <Card title="Tree Status Progress Tracker" subtitle="Monitor dispatched tasks, ranger progress, patrol duration, and submitted evidence">
        <div className="page-toolbar task-tracker-toolbar">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task, tree, ranger, source or notes..." />
          <div className="toolbar-actions">
            <select value={ranger} onChange={(event) => setRanger(event.target.value)}><option value="all">All rangers</option>{taskRangers.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All status</option><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="skipped">Skipped</option><option value="false-positive">False positive</option><option value="anomaly-found">Anomaly found</option><option value="escalated">Escalated</option></select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option></select>
            <select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">All source</option>{sources.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="priority">Sort priority</option><option value="recent">Sort recent activity</option><option value="ranger">Sort ranger</option><option value="status">Sort status</option></select>
          </div>
        </div>
        <div className="task-progress-grid">
          {filteredTasks.map((task) => {
            const report = taskReport(fieldReports, task);
            return (
              <button key={task.id} className={`task-card task-progress-card priority-${task.priority}`} onClick={() => setSelected(task)}>
                <span><b>{task.id}</b><StatusPill status={task.status} /></span>
                <h3>{task.title}</h3>
                <div className="task-chip-row">
                  <span><b>Ranger</b>{task.ranger}</span>
                  <span><b>Priority</b>{task.priority}</span>
                  <span><b>Duration</b>{durationLabel(task)}</span>
                </div>
                <p>{task.treeId} · {task.source}</p>
                <small>{report ? `Evidence linked: ${report.id} · ${report.reviewStatus || "Pending Review"}` : task.status === "completed" ? "Completed without linked report" : "Waiting for ranger evidence"}</small>
              </button>
            );
          })}
          {filteredTasks.length === 0 && <div className="it-empty-state"><h3>No tasks match these filters</h3><p>Adjust ranger, status, priority, source, or sorting to review another task set.</p></div>}
        </div>
      </Card>
      {selected && (
        <Modal title={`${selected.id} - ${selected.title}`} onClose={() => setSelected(null)} wide>
          <div className="report-detail-grid">
            <article><span>Status</span><strong>{selected.status}</strong></article>
            <article><span>Started</span><strong>{formatDateTime(selected.startedAt)}</strong></article>
            <article><span>Completed</span><strong>{formatDateTime(selected.completedAt)}</strong></article>
            <article><span>Duration</span><strong>{durationLabel(selected)}</strong></article>
          </div>
          <div className="field-photo">Task evidence preview</div>
          <p><strong>Ranger:</strong> {selected.ranger}</p>
          <p><strong>Source:</strong> {selected.source}</p>
          <p><strong>Task notes:</strong> {selected.notes}</p>
          {!latestReport && selected.status === "completed" && <p className="inline-warning">This task is completed but no linked field report was found. Ask the ranger to submit evidence.</p>}
          {!latestReport && selected.status !== "completed" && <p className="inline-warning">Waiting for ranger to submit completion evidence.</p>}
          {latestReport && (
            <div className="report-analysis-panel report-analysis-compact">
              <span className="premium-eyebrow">Linked ranger evidence</span>
              <h3>{latestReport.reportMode === "ai" ? "AI-assisted field diagnosis" : "Manual ranger assessment"}</h3>
              <p><strong>{latestReport.id}</strong> · {latestReport.treeId} · {latestReport.timestamp}</p>
              <p><strong>Review status:</strong> {latestReport.reviewStatus || "Pending Review"}</p>
              {latestReport.heightMeasurement && <p><strong>Height measurement:</strong> {latestReport.heightMeasurement}m</p>}
              {latestReport.reportMode === "ai" && <p><strong>Photo attachment:</strong> {latestReport.photoName} · {latestReport.photoSyncStatus}</p>}
              <p>{latestReport.analysis.summary}</p>
              <p><strong>Recommendation:</strong> {latestReport.analysis.recommendation}</p>
              <p><strong>Sync:</strong> {latestReport.analysis.taskSyncMessage}</p>
              {latestReport.reportMode === "ai" && (
                <>
                  <p><strong>AI photo analysis:</strong> {latestReport.analysis.photoAnalysisMessage || `AI photo analysis completed for ${latestReport.photoName}.`}</p>
                  <p><strong>Selected result:</strong> {latestReport.diagnosis} ({latestReport.confidence}% confidence)</p>
                  <div className="ai-possibility-list">
                    {(latestReport.aiPossibilities || []).map((possibility) => (
                      <article className={`ai-possibility-card ${latestReport.selectedAiPossibilityId === possibility.id ? "selected" : ""}`} key={possibility.id}>
                        <span><b>{possibility.name}</b><small>{possibility.confidence}% confidence</small></span>
                        <div><strong>3 possible reasons</strong><ol>{possibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ol></div>
                        <div><strong>3 suggested solutions</strong><ol>{possibility.solutions.map((solution) => <li key={solution}>{solution}</li>)}</ol></div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="report-analysis-panel report-analysis-compact">
            <span className="premium-eyebrow">Admin reassignment</span>
            <p>If the evidence is not convincing, keep the ranger report as history and dispatch the task again to another ranger.</p>
            <div className="page-toolbar reassign-toolbar">
              <select value={reassignTarget} onChange={(event) => setReassignTarget(event.target.value)}>
                <option value="">Choose ranger</option>
                {assignableRangers.filter((item) => item !== selected.ranger).map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
              <button className="button button-outline" disabled={!reassignTarget || reassigning} onClick={reassign}>{reassigning ? "Reassigning..." : "Reassign Task"}</button>
            </div>
          </div>
          <div className="button-row">
            <button className="button" disabled={!latestReport} onClick={() => update("completed")}>Confirm Evidence Reviewed</button>
            <button className="button button-outline" onClick={() => update("in-progress")}>Send Back To Treatment</button>
            <button className="button button-danger" onClick={() => update("escalated")}>Escalate</button>
          </div>
        </Modal>
      )}
    </>
  );
}
