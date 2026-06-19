export default function AuditLogList({ logs }) {
  if (!logs.length) {
    return (
      <div className="it-empty-state">
        <h3>No audit events match</h3>
        <p>Adjust the event type, severity, or search keyword.</p>
      </div>
    );
  }

  return (
    <div className="audit-list">
      {logs.map((log, index) => (
        <article key={`${log.time}-${index}`}>
          <small>{log.time}</small>
          <b className={`audit-${log.type}`}>{log.type}</b>
          <span><strong>{log.actor}</strong><small>{log.role}</small>{log.event}</span>
          <em>{log.severity}</em>
        </article>
      ))}
    </div>
  );
}
