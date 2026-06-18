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
        </div>
      </div>

      {activeTab === "overview" && (
        <Card title="SS1 Dashboard" subtitle="Tree health monitoring workspace">
          <p>{visibleTrees.length} tree records are ready for health monitoring.</p>
        </Card>
      )}
    </>
  );
}