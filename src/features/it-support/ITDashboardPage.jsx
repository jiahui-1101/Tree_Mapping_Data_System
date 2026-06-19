import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { AUDIT_LOGS } from "../../data/auditLogs.js";
import { ACCESS_USERS, SUPPORT_TICKETS, SYSTEM_SERVICES } from "../../data/itSupport.js";
import ITMetricCard from "./ITMetricCard.jsx";
import ServiceHealthCard from "./ServiceHealthCard.jsx";
import { getITOperationsSummary } from "../../services/itSupportService.js";

export default function ITDashboardPage({ auditLogs = AUDIT_LOGS, onNavigate, showToast }) {
  const { degradedServices, failedLogins, lockedAccounts, highRiskEvents } = getITOperationsSummary({
    services: SYSTEM_SERVICES,
    users: ACCESS_USERS,
    auditLogs,
  });
  const activeTickets = SUPPORT_TICKETS.filter((ticket) => ticket.status !== "resolved");

  return (
    <>
      <div className="metric-grid">
        <ITMetricCard label="Service watch" value={degradedServices} detail="Degraded dependencies" tone="warning" />
        <ITMetricCard label="Security alerts" value={highRiskEvents} detail="High severity audit events" tone="critical" />
        <ITMetricCard label="Failed logins" value={failedLogins} detail="Detected in current audit sample" />
        <ITMetricCard label="Locked accounts" value={lockedAccounts} detail="Require IT review" />
      </div>

      <Card title="System Health Overview" subtitle="Operational services watched by IT Support">
        <div className="it-service-grid">
          {SYSTEM_SERVICES.map((service) => (
            <ServiceHealthCard key={service.id} service={service} />
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
            <button className="button" onClick={() => showToast("Audit review is available from Subsystem 4.")}>Review Audit</button>
            <button className="button button-outline" onClick={() => onNavigate("incident-tickets")}>Open Tickets</button>
            <button className="button button-outline" onClick={() => onNavigate("system-monitoring")}>Check Services</button>
            <button className="button button-outline" onClick={() => showToast("Demo diagnostic queued for IT Support review.")}>Run Diagnostic</button>
          </div>
        </Card>
      </div>
    </>
  );
}
