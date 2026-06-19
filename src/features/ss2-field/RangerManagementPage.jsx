import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { RANGERS } from "../../data/rangers.js";

export default function RangerManagementPage({ showToast }) {
  const [rangers, setRangers] = useState(RANGERS);
  const [open, setOpen] = useState(false);
  const toggle = (id) => {
    setRangers((current) => current.map((ranger) => ranger.id === id ? { ...ranger, status: ranger.status === "active" ? "inactive" : "active" } : ranger));
    showToast("Ranger account status changed. Active sessions invalidated in mock audit.");
  };

  return (
    <>
      <Card title="Ranger Accounts" subtitle="Role-authorized field access" actions={<button className="button button-small" onClick={() => setOpen(true)}>+ Add / Assign Ranger</button>}>
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Assigned zone</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{rangers.map((ranger) => <tr key={ranger.id}><td>{ranger.id}</td><td>{ranger.name}</td><td>{ranger.zone}</td><td>{ranger.phone}</td><td><StatusPill status={ranger.status} /></td><td><button className="table-action" onClick={() => toggle(ranger.id)}>{ranger.status === "active" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody>
        </table></div>
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

