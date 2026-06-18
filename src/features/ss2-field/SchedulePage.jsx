import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import { RANGERS } from "../../data/rangers.js";
import { ZONES } from "../../data/trees.js";
import { buildUrgentTask } from "../../services/adminService.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const ASSIGNMENTS = [
  ["Ahmad", "Arboretum", "Arboretum", "Tapak Semaian", "Arboretum", "Riparian"],
  ["Siti", "Pemuliharaan", "Pemuliharaan", "Arboretum", "Pemuliharaan", "Tanaman"],
  ["Faizal", "Tanaman", "Tanaman", "Tanaman", "Riparian", "Tapak Semaian"],
  ["Mei", "Riparian", "Riparian", "Pemuliharaan", "Tapak Semaian", "Arboretum"],
];

export default function SchedulePage({ tasks = [], onAddTask, showToast }) {
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [urgentRanger, setUrgentRanger] = useState("Ahmad Razif");
  const [urgentIssue, setUrgentIssue] = useState("");
  const [urgentTreeId, setUrgentTreeId] = useState("TBJ-004");
  const [urgentZone, setUrgentZone] = useState("Tanaman");
  const [urgentPriority, setUrgentPriority] = useState("urgent");
  const dispatchUrgentTask = () => {
    const task = onAddTask(buildUrgentTask({ ranger: urgentRanger, issue: urgentIssue, treeId: urgentTreeId, zone: urgentZone, priority: urgentPriority }, tasks));
    setUrgentOpen(false);
    setUrgentIssue("");
    showToast(`${task.id} created and synced to ${task.ranger}'s task bar.`);
  };

  return (
    <>
      <Card title="AI-Assisted Weekly Schedule" subtitle="Week of 1 - 5 June 2026 · non-overlapping patrol assignments" actions={<div className="button-row"><button className="button button-small button-outline" onClick={() => setUrgentOpen(true)}>+ Urgent Task</button><button className="button button-small" onClick={() => showToast("AI schedule refreshed with balanced coverage.")}>AI Generate</button></div>}>
        <div className="schedule-grid">
          <span />
          {DAYS.map((day) => <strong key={day}>{day}</strong>)}
          {ASSIGNMENTS.flatMap(([ranger, ...zones]) => [
            <b key={`${ranger}-name`}>{ranger}</b>,
            ...zones.map((zone, index) => <button key={`${ranger}-${index}`} className={`schedule-cell zone-${zone.replaceAll(" ", "-").toLowerCase()}`} onClick={() => setConflict(ranger === "Ahmad" && index === 0)}>{zone}</button>),
          ])}
        </div>
        {conflict && <p className="inline-warning">Conflict detected: Ranger assigned to multiple zones at the same time. Please adjust before approval.</p>}
        <button className="button schedule-approve" onClick={() => showToast("Schedule approved. Ranger notification mock dispatched.")}>Approve & Dispatch Schedule</button>
      </Card>
      {urgentOpen && <Modal title="Create Urgent Field Task" onClose={() => setUrgentOpen(false)}>
        <label className="field-label">Ranger</label><select value={urgentRanger} onChange={(event) => setUrgentRanger(event.target.value)}>{RANGERS.filter((ranger) => ranger.status === "active").map((ranger) => <option key={ranger.id}>{ranger.name}</option>)}</select>
        <label className="field-label">Issue</label><input value={urgentIssue} onChange={(event) => setUrgentIssue(event.target.value)} placeholder="e.g. Fallen branch near lake" />
        <label className="field-label">Tree ID / area</label><input value={urgentTreeId} onChange={(event) => setUrgentTreeId(event.target.value)} placeholder="e.g. TBJ-004 or lake path" />
        <label className="field-label">Zone</label><select value={urgentZone} onChange={(event) => setUrgentZone(event.target.value)}>{ZONES.map((zone) => <option key={zone}>{zone}</option>)}</select>
        <label className="field-label">Priority</label><select value={urgentPriority} onChange={(event) => setUrgentPriority(event.target.value)}><option value="urgent">Emergency</option><option value="high">High</option></select>
        <button className="button button-block" disabled={!urgentRanger || !urgentIssue.trim()} onClick={dispatchUrgentTask}>Dispatch Urgent Task</button>
      </Modal>}
    </>
  );
}
