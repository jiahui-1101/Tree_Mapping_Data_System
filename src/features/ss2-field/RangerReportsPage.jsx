import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { filterFieldReports } from "../../services/rangerService.js";

export default function RangerReportsPage({ user, fieldReports }) {
  const [query, setQuery] = useState("");
  const [observedStatus, setObservedStatus] = useState("all");
  const [reportMode, setReportMode] = useState("all");
  const [syncStatus, setSyncStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const rangerName = user?.name || "";
  const reports = useMemo(() => filterFieldReports(fieldReports, rangerName, { query, observedStatus, reportMode, syncStatus }), [fieldReports, observedStatus, query, rangerName, reportMode, syncStatus]);
  const allReports = useMemo(() => filterFieldReports(fieldReports, rangerName), [fieldReports, rangerName]);
  const manualCount = allReports.filter((report) => report.reportMode === "manual").length;
  const aiCount = allReports.filter((report) => report.reportMode === "ai").length;
  const criticalCount = allReports.filter((report) => report.observedStatus === "critical").length;

  return (
    <>
      <div className="metric-grid">
        <div className="metric-card"><b>Total reports</b><strong>{allReports.length}</strong><small>Submitted by {rangerName}</small></div>
        <div className="metric-card"><b>Manual</b><strong>{manualCount}</strong><small>Ranger knows the issue</small></div>
        <div className="metric-card"><b>AI assisted</b><strong>{aiCount}</strong><small>AI used when unsure</small></div>
        <div className="metric-card metric-critical"><b>Critical</b><strong>{criticalCount}</strong><small>Require admin attention</small></div>
      </div>
      <Card title="My Field Reports" subtitle="Manual and AI-assisted report history">
        <div className="page-toolbar">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search report, tree, diagnosis, cause or notes..." />
          <div className="toolbar-actions">
            <select value={observedStatus} onChange={(event) => setObservedStatus(event.target.value)}>
              <option value="all">All tree status</option><option value="healthy">Healthy</option><option value="monitor">Monitor</option><option value="critical">Critical</option>
            </select>
            <select value={reportMode} onChange={(event) => setReportMode(event.target.value)}>
              <option value="all">All mode</option><option value="manual">Manual</option><option value="ai">AI diagnosis</option>
            </select>
            <select value={syncStatus} onChange={(event) => setSyncStatus(event.target.value)}>
              <option value="all">All sync</option><option value="synced">Synced</option><option value="pending">Pending</option><option value="failed">Failed</option>
            </select>
          </div>
        </div>
        {reports.length === 0 ? (
          <div className="it-empty-state"><h3>No reports match these filters</h3><p>Adjust the report filters to review another submitted field report set.</p></div>
        ) : (
          <div className="ranger-report-grid">
            {reports.map((report) => (
              <button className={`ranger-report-card priority-${report.observedStatus === "critical" ? "urgent" : "normal"}`} key={report.id} onClick={() => setSelected(report)}>
                <span><b>{report.id}</b><StatusPill status={report.syncStatus} /></span>
                <h3>{report.treeName}</h3>
                <p>{report.treeId} · {report.timestamp}</p>
                <div className="report-chip-row"><StatusPill status={report.reportMode} /><StatusPill status={report.observedStatus} /></div>
                <small>{report.analysis.summary}</small>
              </button>
            ))}
          </div>
        )}
      </Card>
      {selected && (
        <Modal title={`${selected.id} - ${selected.treeName}`} onClose={() => setSelected(null)} wide>
          <div className="report-detail-grid">
            <article><span>Mode</span><strong>{selected.reportMode === "ai" ? "AI diagnosis" : "Manual assessment"}</strong></article>
            <article><span>Observed status</span><strong>{selected.observedStatus}</strong></article>
            <article><span>Sync</span><strong>{selected.syncStatus}</strong></article>
            <article><span>GPS / time</span><strong>{selected.gpsLabel} · {selected.timestamp}</strong></article>
          </div>
          {selected.reportMode === "ai" ? (
            <>
              <p><strong>Photo used for AI recognition:</strong> {selected.photoName} · {selected.photoSyncStatus}</p>
              <p><strong>AI photo analysis:</strong> {selected.photoAnalysisStatus}</p>
              <p><strong>Selected AI diagnosis:</strong> {selected.diagnosis} ({selected.confidence}% confidence) · {selected.treatment}</p>
              <div className="ai-possibility-list">
                {(selected.aiPossibilities || []).map((possibility) => (
                  <article className={`ai-possibility-card ${selected.selectedAiPossibilityId === possibility.id ? "selected" : ""}`} key={possibility.id}>
                    <span><b>{possibility.name}</b><small>{possibility.confidence}% confidence</small></span>
                    <div><strong>3 possible reasons</strong><ol>{possibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ol></div>
                    <div><strong>3 suggested solutions</strong><ol>{possibility.solutions.map((solution) => <li key={solution}>{solution}</li>)}</ol></div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p><strong>Manual assessment:</strong> {selected.manualCause} · {selected.manualTreatment}</p>
          )}
          <p><strong>Notes:</strong> {selected.notes}</p>
          <div className="report-analysis-panel report-analysis-compact">
            <span className="premium-eyebrow">Analysis summary</span>
            <p>{selected.analysis.summary}</p>
            <p><strong>Recommendation:</strong> {selected.analysis.recommendation}</p>
            <p><strong>Task sync:</strong> {selected.analysis.taskSyncMessage}</p>
            <p><strong>Tree update:</strong> {selected.analysis.treeUpdateMessage}</p>
            <p><strong>Photo:</strong> {selected.analysis.photoSyncMessage || "No field photo upload was attached."}</p>
            {selected.reportMode === "ai" && <p><strong>AI photo analysis:</strong> {selected.analysis.photoAnalysisMessage || `AI photo analysis completed for ${selected.photoName}.`}</p>}
            <p><strong>Next action:</strong> {selected.analysis.nextAction}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
