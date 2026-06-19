import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { ACCESS_USERS } from "../../data/itSupport.js";
import { filterAccessUsers } from "../../services/itSupportService.js";

export default function UserAccessPage({ showToast }) {
  const [users, setUsers] = useState(ACCESS_USERS);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [session, setSession] = useState("all");

  const filteredUsers = useMemo(() => filterAccessUsers(users, { query, role, status, session }), [query, role, session, status, users]);
  const activeUsers = users.filter((user) => user.status === "active").length;
  const lockedUsers = users.filter((user) => user.status === "locked").length;
  const invalidatedSessions = users.filter((user) => user.session.toLowerCase().includes("invalidated")).length;

  const toggleLock = (id) => {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, status: user.status === "locked" ? "active" : "locked", session: user.status === "locked" ? "Session restored by IT Support" : "Locked by IT Support" } : user));
    showToast("Account access status changed in frontend demo state.");
  };

  const invalidateSession = (id) => {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, session: "Session invalidated by IT Support" } : user));
    showToast("Active session invalidated in demo audit workflow.");
  };

  return (
    <Card title="User & Access Control" subtitle="Demo account support for system roles">
      <div className="it-user-summary">
        <article><strong>{users.length}</strong><span>Total users</span></article>
        <article><strong>{activeUsers}</strong><span>Active users</span></article>
        <article><strong>{lockedUsers}</strong><span>Locked users</span></article>
        <article><strong>{invalidatedSessions}</strong><span>Invalidated sessions</span></article>
      </div>
      <div className="page-toolbar">
        <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user ID, name, role, session or last login..." />
        <div className="toolbar-actions">
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">All roles</option><option value="Admin">Admin</option><option value="Ranger">Ranger</option><option value="Visitor">Visitor</option><option value="IT Support">IT Support</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="locked">Locked</option>
          </select>
          <select value={session} onChange={(event) => setSession(event.target.value)}>
            <option value="all">All sessions</option><option value="active">Active sessions</option><option value="none">No active session</option><option value="invalidated">Invalidated</option><option value="locked">Locked session</option>
          </select>
        </div>
      </div>
      {filteredUsers.length === 0 ? (
        <div className="it-empty-state">
          <h3>No users match these filters</h3>
          <p>Adjust the search keyword, role, status, or session filter to review another account set.</p>
        </div>
      ) : (
      <div className="table-wrap"><table>
        <thead><tr><th>User ID</th><th>Name</th><th>Role</th><th>Status</th><th>Session</th><th>Last login</th><th>Actions</th></tr></thead>
        <tbody>{filteredUsers.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.role}</td>
            <td><StatusPill status={user.status} /></td>
            <td>{user.session}</td>
            <td>{user.lastLogin}</td>
            <td>
              <div className="button-row">
                <button className="table-action" onClick={() => toggleLock(user.id)}>{user.status === "locked" ? "Unlock" : "Lock"}</button>
                <button className="table-action" onClick={() => showToast(`Password reset link prepared for ${user.id} in demo mode.`)}>Reset password</button>
                <button className="table-action" onClick={() => invalidateSession(user.id)}>Invalidate session</button>
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table></div>)}
    </Card>
  );
}

