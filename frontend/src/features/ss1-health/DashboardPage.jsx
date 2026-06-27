import { useMemo, useState } from "react";
import { ZONES } from "../../data/trees.js";
import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import Modal from "../../components/common/Modal.jsx";
import { MAINTENANCE_ALERTS } from "../../data/tasks.js";

const ALERTS = [
  { tone: "critical", title: "Zon Tanaman - Disease Outbreak", zone: "Tanaman", detail: "Fungal infection spreading. 14% disease rate. 23 trees affected.", confidence: 92 },
  { tone: "warning", title: "Zon Arboretum - Water Stress", zone: "Arboretum", detail: "Unusual leaf-drop rate. Drought stress likely. 8 trees at risk.", confidence: 78 },
  { tone: "healthy", title: "Zon Pemuliharaan - Optimal", zone: "Pemuliharaan", detail: "All health indicators normal. Scheduled maintenance on track.", confidence: 96 },
];

export default function DashboardPage({ trees, fieldReports = [], onNavigate, showToast }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [zone, setZone] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const visibleTrees = useMemo(() => zone === "all" ? trees : trees.filter((tree) => tree.zone === zone), [trees, zone]);
  const count = (status) => visibleTrees.filter((tree) => tree.status === status).length;
  const aiReports = fieldReports.filter((report) => report.reportMode === "ai").length;
  const manualReports = fieldReports.filter((report) => report.reportMode === "manual").length;
  const syncedReports = fieldReports.filter((report) => report.syncStatus === "synced").length;
  const criticalZones = ZONES.map((item) => ({
    zone: item,
    critical: trees.filter((tree) => tree.zone === item && tree.status === "critical").length,
    monitor: trees.filter((tree) => tree.zone === item && tree.status === "monitor").length,
  })).sort((a, b) => (b.critical + b.monitor) - (a.critical + a.monitor));

  return (
    <>
      <div className="page-toolbar">
        <div className="segmented">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
          <button className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}>Analytics</button>
          <button className={activeTab === "ai-insights" ? "active" : ""} onClick={() => setActiveTab("ai-insights")}>AI Insights</button>
        </div>
        <div className="toolbar-actions">
          <select value={zone} onChange={(event) => setZone(event.target.value)}>
            <option value="all">All zones</option>{ZONES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="button button-small" onClick={() => showToast("Dashboard summary export prepared as a demo CSV.")}>Export Summary</button>
        </div>
      </div>
      {activeTab === "overview" && (
        <>
          <div className="metric-grid">
            <Metric label="Visible trees" value={visibleTrees.length} trend={zone === "all" ? "All garden records" : `Filtered: ${zone}`} />
            <Metric label="Healthy" value={count("healthy")} trend="Stable condition" tone="healthy" />
            <Metric label="Under monitor" value={count("monitor")} trend="Review field reports" tone="warning" />
            <Metric label="Critical" value={count("critical")} trend="Immediate attention" tone="critical" />
          </div>
          <div className="two-column">
            <Card title="AI Anomaly Alerts" subtitle="Select an alert to drill into affected tree records">
              <div className="alert-stack">
                {ALERTS.map((alert) => (
                  <button key={alert.title} className={`alert-card alert-${alert.tone}`} onClick={() => setSelectedAlert(alert)}>
                    <span className="alert-dot" /><span><strong>{alert.title}</strong><small>{alert.detail}</small><b>Confidence: {alert.confidence}%</b></span>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="Zone Health Score" subtitle="Current week average health %">
              <div className="bar-chart">
                {ZONES.map((item) => {
                  const zoneTrees = trees.filter((tree) => tree.zone === item);
                  const average = Math.round(zoneTrees.reduce((sum, tree) => sum + tree.health, 0) / zoneTrees.length);
                  return <div key={item}><span style={{ height: `${average}%` }} /><strong>{average}%</strong><small>{item}</small></div>;
                })}
              </div>
            </Card>
          </div>
          <Card title="Recent Field Reports" subtitle="Latest ranger submissions synced to Admin" actions={<button className="button button-small" onClick={() => onNavigate("tasks")}>View all</button>}>
            <div className="admin-report-preview">
              {fieldReports.slice(0, 4).map((report) => (
                <article key={report.id}>
                  <span><b>{report.id}</b><StatusPill status={report.syncStatus} /></span>
                  <h3>{report.treeName}</h3>
                  <p>{report.treeId} · {report.ranger} · {report.timestamp}</p>
                  <div className="report-chip-row"><StatusPill status={report.reportMode} /><StatusPill status={report.observedStatus} /></div>
                  {report.reportMode === "ai" ? (
                    <small>AI photo uploaded: {report.photoName}. Primary diagnosis: {report.diagnosis} ({report.confidence}% confidence).</small>
                  ) : (
                    <small>Manual assessment: {report.manualCause} Recommended action: {report.manualTreatment}</small>
                  )}
                </article>
              ))}
              {fieldReports.length === 0 && <div className="it-empty-state"><h3>No field reports yet</h3><p>Ranger submissions will appear here after QR field reports are synced.</p></div>}
            </div>
          </Card>
        </>
      )}
      {activeTab === "analytics" && (
        <>
          <div className="metric-grid">
            <Metric label="Reports synced" value={syncedReports} trend="Ranger field report records" />
            <Metric label="AI reports" value={aiReports} trend="Photo-based diagnosis used" tone="warning" />
            <Metric label="Manual reports" value={manualReports} trend="Ranger knew the issue" tone="healthy" />
            <Metric label="At-risk zones" value={criticalZones.filter((item) => item.critical || item.monitor).length} trend="Critical or monitor trees" tone="critical" />
          </div>
          <div className="two-column">
            <Card title="Zone Risk Comparison" subtitle="Critical and monitor tree counts by zone">
              <div className="zone-record-list">{criticalZones.map((item) => <p key={item.zone}><span>{item.zone}</span><b>{item.critical} critical · {item.monitor} monitor</b></p>)}</div>
            </Card>
            <Card title="Report Mode Breakdown" subtitle="How ranger reports are being submitted">
              <div className="admin-report-preview">
                <article><span><b>Manual assessments</b><StatusPill status="manual" /></span><h3>{manualReports}</h3><small>Manual mode is used when ranger can identify the issue without AI.</small></article>
                <article><span><b>AI photo diagnosis</b><StatusPill status="ai" /></span><h3>{aiReports}</h3><small>AI mode requires a field photo and syncs the attachment to Admin.</small></article>
              </div>
            </Card>
          </div>
        </>
      )}
      {activeTab === "ai-insights" && (
        <div className="two-column">
          <Card title="AI Anomaly Insights" subtitle="Current AI risk signals from the dashboard">
            <div className="alert-stack">
              {ALERTS.map((alert) => (
                <button key={alert.title} className={`alert-card alert-${alert.tone}`} onClick={() => setSelectedAlert(alert)}>
                  <span className="alert-dot" /><span><strong>{alert.title}</strong><small>{alert.detail}</small><b>Confidence: {alert.confidence}%</b></span>
                </button>
              ))}
            </div>
          </Card>
          <Card title="Predictive Maintenance Queue" subtitle="Pending AI alerts ready for dispatch">
            <div className="alert-stack">
              {MAINTENANCE_ALERTS.map((alert) => (
                <article className={`alert-card alert-${alert.confidence >= 90 ? "critical" : "warning"}`} key={alert.id}>
                  <span className="alert-dot" /><span><strong>{alert.title}</strong><small>{alert.treeId} · {alert.zone} · {alert.window}</small><b>Confidence: {alert.confidence}%</b></span>
                </article>
              ))}
            </div>
            <div className="button-row schedule-approve"><button className="button" onClick={() => onNavigate("maintenance")}>Open Maintenance</button><button className="button button-outline" onClick={() => onNavigate("tasks")}>Open Task Tracker</button></div>
          </Card>
        </div>
      )}
      {selectedAlert && <Modal title={selectedAlert.title} onClose={() => setSelectedAlert(null)}>
        <p>{selectedAlert.detail}</p>
        <h3>Affected tree records</h3>
        {trees.filter((tree) => tree.zone === selectedAlert.zone && tree.status !== "healthy").map((tree) => <div className="list-row" key={tree.id}><span><strong>{tree.id}</strong><small>{tree.name}</small></span><StatusPill status={tree.status} /></div>)}
        <button className="button button-block" onClick={() => { setSelectedAlert(null); onNavigate("tasks"); }}>Review linked tasks</button>
      </Modal>}
    </>
  );
}

function Metric({ label, value, trend, tone = "" }) {
  return <article className={`metric-card metric-${tone}`}><span className="metric-icon">●</span><strong>{value}</strong><b>{label}</b><small>{trend}</small></article>;
}

