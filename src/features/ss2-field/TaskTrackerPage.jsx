import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";

export default function TaskTrackerPage({ tasks, fieldReports = [], onUpdateTask, showToast }) {
  const [selected, setSelected] = useState(null);
  const latestReport = selected ? fieldReports.find((report) => report.taskId === selected.id || report.treeId === selected.treeId) : null;
  const update = (status) => {
    onUpdateTask(selected.id, status);
    showToast(`Task ${selected.id} updated to ${status}. Tree map sync mock completed.`);
    setSelected(null);
  };
  return (
    <>
      <Card title="Tree Status Progress Tracker" subtitle="Consolidated ranger reports and AI-generated tasks">
        <div className="task-board">
          {tasks.map((task) => <button key={task.id} className={`task-card priority-${task.priority}`} onClick={() => setSelected(task)}>
            <span><b>{task.id}</b><StatusPill status={task.status} /></span><h3>{task.title}</h3><p>{task.treeId} · {task.ranger}</p><small>{task.source}</small>
          </button>)}
        </div>
      </Card>
      {selected && <Modal title={`${selected.id} - ${selected.title}`} onClose={() => setSelected(null)} wide={Boolean(latestReport)}>
        <div className="field-photo">Task evidence preview</div>
        <p><strong>Source:</strong> {selected.source}</p><p><strong>Ranger notes:</strong> {selected.notes}</p>
        <p><strong>AI recommendation:</strong> Inspect affected tree, confirm treatment, and synchronize the resulting health status to the garden map.</p>
        {latestReport && (
          <div className="report-analysis-panel report-analysis-compact">
            <span className="premium-eyebrow">Latest ranger report</span>
            <h3>{latestReport.reportMode === "ai" ? "AI-assisted field diagnosis" : "Manual ranger assessment"}</h3>
            <p><strong>{latestReport.id}</strong> · {latestReport.treeId} · {latestReport.timestamp}</p>
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
        <div className="button-row">
          <button className="button" onClick={() => update("completed")}>Confirm Resolved</button>
          <button className="button button-outline" onClick={() => update("in-progress")}>Under Treatment</button>
          <button className="button button-danger" onClick={() => update("escalated")}>Escalate</button>
        </div>
      </Modal>}
    </>
  );
}
