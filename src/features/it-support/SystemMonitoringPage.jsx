import { useEffect, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { SERVICE_LOGS, SYSTEM_SERVICES } from "../../data/itSupport.js";
import { fetchItServiceLogsBackend, fetchItServicesBackend, runItServiceActionBackend } from "../../services/itSupportApiService.js";
import { filterServiceLogs, getServiceLogs } from "../../services/itSupportService.js";

export default function SystemMonitoringPage({ showToast }) {
  const [services, setServices] = useState(SYSTEM_SERVICES);
  const [logs, setLogs] = useState(SERVICE_LOGS);
  const [selectedService, setSelectedService] = useState(null);
  const [logLevel, setLogLevel] = useState("all");
  const [source, setSource] = useState("local fallback");

  useEffect(() => {
    let mounted = true;
    fetchItServicesBackend().then((payload) => {
      if (mounted && payload?.ok) {
        setServices(payload.data || []);
        setSource("backend API");
      }
    });
    return () => { mounted = false; };
  }, []);

  const runAction = async (id, action) => {
    const backendResult = await runItServiceActionBackend({ serviceId: id, action });
    if (backendResult?.ok) {
      setServices((current) => current.map((service) => service.id === id ? backendResult.service : service));
      setLogs((current) => [backendResult.log, ...current]);
      setSource("backend API");
      showToast(`${action} completed through IT Support backend.`);
      return;
    }
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
      <Card title="System Monitoring" subtitle={`Service status for IT Support operations · ${source}`}>
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
                <button className="button button-small button-outline" onClick={async () => {
                  const payload = await fetchItServiceLogsBackend(service.id);
                  if (payload?.ok) {
                    setLogs((current) => [...payload.data, ...current.filter((log) => log.serviceId !== service.id)]);
                    setSource("backend API");
                  }
                  setSelectedService(service);
                  setLogLevel("all");
                }}>View logs</button>
              </div>
            </article>
          ))}
        </div>
      </Card>
      {selectedService && (
        <Modal title={`${selectedService.name} Logs`} onClose={() => setSelectedService(null)} wide>
          <div className="page-toolbar">
            <p className="muted">{selectedService.dependency} · {getServiceLogs(selectedService.id, logs).length} demo log entries</p>
            <select value={logLevel} onChange={(event) => setLogLevel(event.target.value)}>
              <option value="all">All levels</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option>
            </select>
          </div>
          <div className="it-log-list">
            {filterServiceLogs(getServiceLogs(selectedService.id, logs), logLevel).map((log, index) => (
              <article className={`it-log-item it-log-${log.level}`} key={`${log.serviceId}-${log.time}-${index}`}>
                <span><strong>{log.time}</strong><StatusPill status={log.level} /></span>
                <p>{log.message}</p>
                <small>{log.source}</small>
              </article>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

