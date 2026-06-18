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
    </>
  );
}

function Metric({ label, value, trend, tone = "" }) {
  return <article className={`metric-card metric-${tone}`}><span className="metric-icon">●</span><strong>{value}</strong><b>{label}</b><small>{trend}</small></article>;
}