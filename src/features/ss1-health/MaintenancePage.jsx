import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import { MAINTENANCE_ALERTS } from "../../data/tasks.js";

export default function MaintenancePage({ showToast }) {
  const [alerts, setAlerts] = useState(MAINTENANCE_ALERTS);
  const act = (id, status) => {
    setAlerts((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    showToast(`Predictive alert ${status}. Audit event queued.`);
  };

  return (
    <Card title="Predictive Maintenance Alerts" subtitle="AI-generated risk cards based on historical and environmental data">
      <p>{alerts.length} predictive alerts are ready for review.</p>
    </Card>
  );
}