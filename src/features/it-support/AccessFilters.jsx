export default function AccessFilters({ query, role, status, session, onQueryChange, onRoleChange, onStatusChange, onSessionChange }) {
  return (
    <div className="page-toolbar">
      <input className="search-input" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search user ID, name, role, session or last login..." />
      <div className="toolbar-actions">
        <select value={role} onChange={(event) => onRoleChange(event.target.value)}>
          <option value="all">All roles</option><option value="Admin">Admin</option><option value="Ranger">Ranger</option><option value="Visitor">Visitor</option><option value="IT Support">IT Support</option>
        </select>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="locked">Locked</option>
        </select>
        <select value={session} onChange={(event) => onSessionChange(event.target.value)}>
          <option value="all">All sessions</option><option value="active">Active sessions</option><option value="none">No active session</option><option value="invalidated">Invalidated</option><option value="locked">Locked session</option>
        </select>
      </div>
    </div>
  );
}
