import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { ZONES } from "../../data/trees.js";
import { buildUrgentTask } from "../../services/adminService.js";
import { generateScheduleBackend, publishScheduleBackend, updateScheduleAssignmentBackend } from "../../services/fieldApiService.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function groupSchedule(schedule) {
  const rows = new Map();
  for (const assignment of schedule?.assignments || []) {
    if (!rows.has(assignment.rangerName)) rows.set(assignment.rangerName, { rangerName: assignment.rangerName, cells: new Map() });
    rows.get(assignment.rangerName).cells.set(assignment.shiftDay, assignment);
  }
  return [...rows.values()];
}

export default function SchedulePage({ user, tasks = [], rangers = [], fieldSchedule, onAddTask, onSyncFieldState, showToast }) {
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [dragged, setDragged] = useState(null);
  const [urgentRanger, setUrgentRanger] = useState("Ahmad Razif");
  const [urgentIssue, setUrgentIssue] = useState("");
  const [urgentTreeId, setUrgentTreeId] = useState("TBJ-004");
  const [urgentZone, setUrgentZone] = useState("Tanaman");
  const [urgentPriority, setUrgentPriority] = useState("urgent");
  const activeRangers = rangers.filter((ranger) => ranger.status === "active");
  const scheduleRows = useMemo(() => groupSchedule(fieldSchedule), [fieldSchedule]);

  const refreshSchedule = (result) => {
    if (!result) {
      showToast("SS2 backend is unavailable. Check Laragon/backend terminal.");
      return;
    }
    onSyncFieldState?.({ schedule: result.schedule, tasks: result.tasks });
  };

  const generateSchedule = async () => {
    const result = await generateScheduleBackend({ createdBy: user?.name || "Admin" });
    refreshSchedule(result);
    if (result?.schedule) showToast(`${result.schedule.weekLabel} AI schedule generated with reasoning notes.`);
  };

  const publishSchedule = async () => {
    if (!fieldSchedule?.id) {
      showToast("Generate a schedule before publishing.");
      return;
    }
    const result = await publishScheduleBackend({ scheduleId: fieldSchedule.id, approvedBy: user?.name || "Admin" });
    refreshSchedule(result);
    if (result?.schedule) showToast(`${result.createdTasks?.length || 0} patrol tasks dispatched to ranger task bars.`);
  };

  const updateAssignment = async (assignmentId, patch) => {
    const result = await updateScheduleAssignmentBackend({
      assignmentId,
      editedBy: user?.name || "Admin",
      editReason: "Admin adjusted the AI-generated roster after review.",
      ...patch,
    });
    refreshSchedule(result);
    return result;
  };

  const swapAssignments = async (target) => {
    if (!dragged || !target || dragged.id === target.id || fieldSchedule?.status === "Published") return;
    setDragged(null);
    const first = await updateAssignment(dragged.id, { zone: target.zone });
    if (!first) return;
    const second = await updateAssignment(target.id, { zone: dragged.zone });
    if (second) showToast("Schedule adjustment saved to backend change log.");
  };

  const dispatchUrgentTask = () => {
    const task = onAddTask(buildUrgentTask({ ranger: urgentRanger, issue: urgentIssue, treeId: urgentTreeId, zone: urgentZone, priority: urgentPriority }, tasks));
    setUrgentOpen(false);
    setUrgentIssue("");
    showToast(`${task.id} created and synced to ${task.ranger}'s task bar.`);
  };

  return (
    <>
      <Card
        title="AI-Assisted Weekly Schedule"
        subtitle={fieldSchedule ? `${fieldSchedule.weekLabel} · ${fieldSchedule.status}` : "Generate a backend schedule from ranger history and zone coverage"}
        actions={<div className="button-row"><button className="button button-small button-outline" onClick={() => setUrgentOpen(true)}>+ Urgent Task</button><button className="button button-small" onClick={generateSchedule}>AI Generate</button></div>}
      >
        {fieldSchedule?.aiReasoningSummary && <p className="inline-warning">{fieldSchedule.aiReasoningSummary}</p>}
        <div className="schedule-grid">
          <span />
          {DAYS.map((day) => <strong key={day}>{day}</strong>)}
          {scheduleRows.length === 0 && <p className="muted">No backend schedule yet. Click AI Generate to create a draft schedule.</p>}
          {scheduleRows.flatMap((row) => [
            <b key={`${row.rangerName}-name`}>{row.rangerName}</b>,
            ...DAYS.map((day) => {
              const assignment = row.cells.get(day);
              if (!assignment) return <span key={`${row.rangerName}-${day}`} className="schedule-cell">Unassigned</span>;
              return (
                <button
                  key={assignment.id}
                  className={`schedule-cell zone-${assignment.zone.replaceAll(" ", "-").toLowerCase()}`}
                  draggable={fieldSchedule.status !== "Published"}
                  onDragStart={() => setDragged(assignment)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => swapAssignments(assignment)}
                  title={assignment.aiReasoningNote}
                >
                  <strong>{assignment.zone}</strong>
                  {assignment.manualOverride && <small>Edited</small>}
                </button>
              );
            }),
          ])}
        </div>
        {fieldSchedule?.assignments?.length > 0 && (
          <div className="report-analysis-panel report-analysis-compact">
            <span className="premium-eyebrow">AI scheduling reasons</span>
            <div className="admin-report-preview">
              {fieldSchedule.assignments.slice(0, 6).map((assignment) => (
                <article key={assignment.id}>
                  <span><b>{assignment.rangerName}</b><StatusPill status={assignment.priorityFlag} /></span>
                  <h3>{assignment.shiftDay} · {assignment.zone}</h3>
                  <p>{assignment.aiReasoningNote}</p>
                </article>
              ))}
            </div>
          </div>
        )}
        <button className="button schedule-approve" disabled={!fieldSchedule || fieldSchedule.status === "Published"} onClick={publishSchedule}>Approve & Dispatch Schedule</button>
      </Card>
      {urgentOpen && <Modal title="Create Urgent Field Task" onClose={() => setUrgentOpen(false)}>
        <label className="field-label">Ranger</label><select value={urgentRanger} onChange={(event) => setUrgentRanger(event.target.value)}>{activeRangers.map((ranger) => <option key={ranger.id}>{ranger.name}</option>)}</select>
        <label className="field-label">Issue</label><input value={urgentIssue} onChange={(event) => setUrgentIssue(event.target.value)} placeholder="e.g. Fallen branch near lake" />
        <label className="field-label">Tree ID / area</label><input value={urgentTreeId} onChange={(event) => setUrgentTreeId(event.target.value)} placeholder="e.g. TBJ-004 or lake path" />
        <label className="field-label">Zone</label><select value={urgentZone} onChange={(event) => setUrgentZone(event.target.value)}>{ZONES.map((zone) => <option key={zone}>{zone}</option>)}</select>
        <label className="field-label">Priority</label><select value={urgentPriority} onChange={(event) => setUrgentPriority(event.target.value)}><option value="urgent">Emergency</option><option value="high">High</option></select>
        <button className="button button-block" disabled={!urgentRanger || !urgentIssue.trim()} onClick={dispatchUrgentTask}>Dispatch Urgent Task</button>
      </Modal>}
    </>
  );
}
