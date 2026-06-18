import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { filterRangerTasks } from "../../services/rangerService.js";

export default function RangerTasksPage({ user, tasks, onUpdateTask, onOpenScanner, showToast }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [source, setSource] = useState("all");
  const rangerName = user?.name || "";
  const rangerTasks = useMemo(() => filterRangerTasks(tasks, rangerName), [rangerName, tasks]);
  const filteredTasks = useMemo(() => filterRangerTasks(tasks, rangerName, { query, status, priority, source }), [priority, query, rangerName, source, status, tasks]);
  const completed = rangerTasks.filter((task) => task.status === "completed").length;
  const active = rangerTasks.filter((task) => task.status === "pending" || task.status === "in-progress").length;
  const urgentHigh = rangerTasks.filter((task) => task.priority === "urgent" || task.priority === "high").length;
  const sources = [...new Set(rangerTasks.map((task) => task.source))];
  return (
    <>
      <button className="scan-hero" onClick={onOpenScanner}>
        <span>▣</span><div><h2>Scan Tree QR Code</h2><p>Choose manual assessment or AI photo diagnosis after scanning.</p></div><b>Open Scanner →</b>
      </button>
      <div className="ranger-summary"><span className="avatar">{user?.initials || "R"}</span><div><h3>{rangerName}</h3><p>{user?.id || "Ranger"} · Zon Arboretum today</p></div><strong>{rangerTasks.length}<small>Assigned</small></strong><strong>{active}<small>Active</small></strong><strong>{completed}<small>Completed</small></strong><strong>{urgentHigh}<small>Urgent/High</small></strong></div>
      <Card title="Today's Task Bar" subtitle="Urgent tasks stay pinned to the top">
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
          {filteredTasks.length === 0 && <div className="it-empty-state"><h3>No tasks match these filters</h3><p>Adjust search, status, priority, or source to review another field task set.</p></div>}
          {filteredTasks.map((task) => <article key={task.id} className={`mobile-task priority-${task.priority}`}>
            <div className="split-heading"><small>{task.priority === "urgent" ? "EMERGENCY" : task.source}</small><StatusPill status={task.status} /></div>
            <h3>{task.title}</h3><p>{task.treeId}</p><small>{task.notes}</small>
            <div className="button-row">
              <button className="button button-small" disabled={task.status === "completed"} onClick={() => { onUpdateTask(task.id, task.status === "pending" ? "in-progress" : "completed"); showToast("Task status synced to the office dashboard."); }}>{task.status === "pending" ? "Start Task" : task.status === "completed" ? "Completed" : "Mark Completed"}</button>
              <button className="button button-small button-outline" onClick={onOpenScanner}>Scan QR</button>
            </div>
          </article>)}
        </div>
      </Card>
    </>
  );
}
