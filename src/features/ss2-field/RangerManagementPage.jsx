import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";

export default function RangerManagementPage({ rangers = [], showToast }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [zone, setZone] = useState("all");
  const zones = useMemo(() => [...new Set(rangers.map((ranger) => ranger.zone).filter(Boolean))], [rangers]);
  const filteredRangers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rangers.filter((ranger) => {
      if (status !== "all" && ranger.status !== status) return false;
      if (zone !== "all" && ranger.zone !== zone) return false;
      if (!needle) return true;
      return `${ranger.id} ${ranger.name} ${ranger.zone} ${ranger.phone} ${ranger.status}`.toLowerCase().includes(needle);
    });
  }, [query, rangers, status, zone]);
  const activeCount = rangers.filter((ranger) => ranger.status === "active").length;
  const toggle = (id) => {
    showToast(`Ranger ${id} status updates should be submitted through the backend account API.`);
  };

  return (
    <>
      <Card title="Ranger Accounts" subtitle="Role-authorized field access" actions={<button className="button button-small" onClick={() => setOpen(true)}>+ Add / Assign Ranger</button>}>
        <div className="ranger-management-summary">
          <span><b>{rangers.length}</b>Total rangers</span>
          <span><b>{activeCount}</b>Active</span>
          <span><b>{zones.length}</b>Assigned zones</span>
          <span><b>{filteredRangers.length}</b>Matching filters</span>
        </div>
        <div className="page-toolbar">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ranger ID, name, zone, phone, or status..." />
          <div className="toolbar-actions">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={zone} onChange={(event) => setZone(event.target.value)}>
              <option value="all">All zones</option>
              {zones.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Assigned zone</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{filteredRangers.map((ranger) => <tr key={ranger.id}><td>{ranger.id}</td><td>{ranger.name}</td><td>{ranger.zone}</td><td>{ranger.phone}</td><td><StatusPill status={ranger.status} /></td><td><button className="table-action" onClick={() => toggle(ranger.id)}>{ranger.status === "active" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody>
        </table></div>
        {filteredRangers.length === 0 && <div className="it-empty-state"><h3>No rangers match these filters</h3><p>Try another keyword, zone, or status filter.</p></div>}
      </Card>
      {open && <Modal title="Add / Assign Ranger" onClose={() => setOpen(false)}>
        <label className="field-label">Full name</label><input placeholder="e.g. Encik Ali bin Hamid" />
        <label className="field-label">Staff ID</label><input placeholder="e.g. R005" />
        <label className="field-label">Phone</label><input placeholder="+60 12-345 6789" />
        <button className="button button-block" onClick={() => { setOpen(false); showToast("Ranger account creation represented in UI mock."); }}>Create Account</button>
      </Modal>}
    </>
  );
}
