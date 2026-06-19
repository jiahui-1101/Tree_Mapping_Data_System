export default function TicketFilters({ status, priority, category, onStatusChange, onPriorityChange, onCategoryChange }) {
  return (
    <div className="page-toolbar">
      <div className="toolbar-actions">
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">All status</option><option value="open">Open</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option>
        </select>
        <select value={priority} onChange={(event) => onPriorityChange(event.target.value)}>
          <option value="all">All priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option>
        </select>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="all">All category</option><option value="QR">QR</option><option value="Security">Security</option><option value="Map">Map</option><option value="AI">AI</option>
        </select>
      </div>
    </div>
  );
}
