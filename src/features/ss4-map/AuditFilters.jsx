export default function AuditFilters({ query, type, severity, onQueryChange, onTypeChange, onSeverityChange }) {
  return (
    <div className="page-toolbar audit-toolbar">
      <input className="search-input" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search audit keyword, actor, role, event..." />
      <select value={type} onChange={(event) => onTypeChange(event.target.value)}>
        <option value="all">All event types</option><option value="login">Login</option><option value="edit">Edit</option><option value="qr_scan">QR Scan</option><option value="alert">Alert</option><option value="error">Error</option><option value="security">Security</option>
      </select>
      <select value={severity} onChange={(event) => onSeverityChange(event.target.value)}>
        <option value="all">All severity</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
      </select>
    </div>
  );
}
