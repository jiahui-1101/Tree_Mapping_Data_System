import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { AUDIT_LOGS } from "../../data/auditLogs.js";
import { ACCESS_USERS, SUPPORT_TICKETS, SYSTEM_SERVICES } from "../../data/itSupport.js";

export default function ITDashboardPage({ auditLogs = AUDIT_LOGS, onNavigate, showToast }) {
  const degradedServices = SYSTEM_SERVICES.filter((service) => service.status !== "online").length;
  const failedLogins = auditLogs.filter((log) => log.event.toLowerCase().includes("failed")).length;
  const lockedAccounts = ACCESS_USERS.filter((user) => user.status === "locked").length;
  const highRiskEvents = auditLogs.filter((log) => log.severity === "high").length;
  const activeTickets = SUPPORT_TICKETS.filter((ticket) => ticket.status !== "resolved");

  return (
    <>
      <div className="metric-grid">
        <div className="metric-card metric-warning"><b>Service watch</b><strong>{degradedServices}</strong><small>Degraded dependencies</small></div>
        <div className="metric-card metric-critical"><b>Security alerts</b><strong>{highRiskEvents}</strong><small>High severity audit events</small></div>
        <div className="metric-card"><b>Failed logins</b><strong>{failedLogins}</strong><small>Detected in current audit sample</small></div>
        <div className="metric-card"><b>Locked accounts</b><strong>{lockedAccounts}</strong><small>Require IT review</small></div>
      </div>

      <Card title="System Health Overview" subtitle="Operational services watched by IT Support">
        <div className="it-service-grid">
          {SYSTEM_SERVICES.map((service) => (
            <article className={`it-service-card it-service-${service.status}`} key={service.id}>
              <span><strong>{service.name}</strong><StatusPill status={service.status} /></span>
              <p>{service.dependency}</p>
              <small>{service.latency} latency · {service.lastChecked}</small>
            </article>
          ))}
        </div>
      </Card>

      <div className="two-column">
        <Card title="Recent Incidents" subtitle="Support tickets needing operational follow-up">
          <div className="it-list-stack">
            {activeTickets.slice(0, 3).map((ticket) => (
              <article className="it-list-item" key={ticket.id}>
                <span><strong>{ticket.id}</strong><small>{ticket.title}</small></span>
                <StatusPill status={ticket.status} />
              </article>
            ))}
          </div>
        </Card>
        <Card title="Quick Actions" subtitle="Demo shortcuts for the IT Support workflow">
          <div className="it-action-grid">
            <button className="button" onClick={() => onNavigate("audit")}>Review Audit</button>
            <button className="button button-outline" onClick={() => onNavigate("it-tickets")}>Open Tickets</button>
            <button className="button button-outline" onClick={() => onNavigate("it-monitoring")}>Check Services</button>
            <button className="button button-outline" onClick={() => showToast("Demo diagnostic queued for IT Support review.")}>Run Diagnostic</button>
          </div>
        </Card>
      </div>
    </>
  );
}
