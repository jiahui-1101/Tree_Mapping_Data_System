import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { SERVICE_LOGS, SYSTEM_SERVICES } from "../../data/itSupport.js";
import ServiceLogViewer from "./ServiceLogViewer.jsx";

export default function SystemMonitoringPage({ showToast }) {
  const [services, setServices] = useState(SYSTEM_SERVICES);
  const [logs, setLogs] = useState(SERVICE_LOGS);
  const [selectedService, setSelectedService] = useState(null);
  const [logLevel, setLogLevel] = useState("all");

  const runAction = (id, action) => {
    if (action === "restart") {
      setServices((current) => current.map((service) => service.id === id ? { ...service, status: "online", latency: "120 ms", lastChecked: "Just now" } : service));
      const service = services.find((item) => item.id === id);
      setLogs((current) => [{ serviceId: id, time: "Just now", level: "info", source: service?.name || "System Monitoring", message: "Demo service restarted and status refreshed by IT Support." }, ...current]);
      showToast("Demo service restart completed. Status refreshed in frontend state.");
      return;
    }
    showToast(`${action} prepared for selected service in demo mode.`);
  };

  return (
    <>
      <Card title="System Monitoring" subtitle="Mock service status for IT Support operations">
        <div className="it-monitoring-grid">
          {services.map((service) => (
            <article className={`it-monitor-card it-service-${service.status}`} key={service.id}>
              <header>
                <span>
                  <strong>{service.name}</strong>
                  <small>{service.dependency}</small>
                </span>
                <StatusPill status={service.status} />
              </header>
              <div className="it-service-metrics">
                <span><b>{service.uptime}</b><small>uptime</small></span>
                <span><b>{service.latency}</b><small>latency</small></span>
                <span><b>{service.lastChecked}</b><small>last checked</small></span>
              </div>
              <p>{service.note}</p>
              <div className="button-row">
                <button className="button button-small" onClick={() => runAction(service.id, "restart")}>Restart demo service</button>
                <button className="button button-small button-outline" onClick={() => runAction(service.id, "diagnostic")}>Run diagnostic</button>
                <button className="button button-small button-outline" onClick={() => { setSelectedService(service); setLogLevel("all"); }}>View logs</button>
              </div>
            </article>
          ))}
        </div>
      </Card>
      {selectedService && (
        <ServiceLogViewer
          service={selectedService}
          logs={logs}
          level={logLevel}
          onLevelChange={setLogLevel}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}
