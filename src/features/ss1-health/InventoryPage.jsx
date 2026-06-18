import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import TreeQrLabel from "../../components/qr/TreeQrLabel.jsx";
import { ZONES } from "../../data/trees.js";
import { filterTrees } from "../../services/mockTreeService.js";

export default function InventoryPage({ trees, qrCodes = [], onAddTree, onArchiveTree, onUpdateTree, showToast }) {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [name, setName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const visibleTrees = useMemo(() => filterTrees({ trees, query, zone, status }), [trees, query, zone, status]);

  return (
    <>
      <div className="page-toolbar">
        <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tree ID, name or scientific name..." />
        <div className="toolbar-actions">
          <select value={zone} onChange={(event) => setZone(event.target.value)}><option value="all">All zones</option>{ZONES.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All status</option><option value="healthy">Healthy</option><option value="monitor">Monitor</option><option value="critical">Critical</option></select>
          <button className="button button-small" onClick={() => setAddOpen(true)}>+ Add Tree</button>
        </div>
      </div>
      <Card>
        <div className="table-wrap"><table><thead><tr><th>Tree ID</th><th>Species</th><th>Scientific name</th><th>Zone</th><th>Age</th><th>Health</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{visibleTrees.map((tree) => <tr key={tree.id}><td>{tree.id}</td><td>{tree.name}</td><td><em>{tree.scientificName}</em></td><td>{tree.zone}</td><td>{tree.age} yrs</td><td>{tree.health}%</td><td><StatusPill status={tree.status} /></td><td><button className="table-action" onClick={() => setSelected(tree)}>View QR</button></td></tr>)}</tbody>
        </table></div>
      </Card>
      {selected && <Modal title={`${selected.name} - ${selected.id}`} onClose={() => setSelected(null)}>
        <TreeQrLabel tree={selected} qrCode={qrCodes.find((qr) => qr.treeId === selected.id && qr.qrStatus === "active") || qrCodes.find((qr) => qr.treeId === selected.id)} />
        <p>{selected.description}</p>
        <div className="modal-footer-grid">
          <button className="button" onClick={() => showToast(`QR label preview exported for ${selected.id}.`)}>Export QR Label</button>
          <button className="button button-outline" onClick={() => { setEditDraft(selected); setEditOpen(true); }}>Edit Record</button>
          <button className="button button-danger" onClick={() => { onArchiveTree(selected.id); setSelected(null); }}>Archive</button>
        </div>
      </Modal>}
      {editOpen && editDraft && <Modal title={`Edit Tree Record - ${editDraft.id}`} onClose={() => setEditOpen(false)}>
        <label className="field-label">Common name</label><input value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} />
        <label className="field-label">Scientific name</label><input value={editDraft.scientificName} onChange={(event) => setEditDraft({ ...editDraft, scientificName: event.target.value })} />
        <label className="field-label">Zone</label><select value={editDraft.zone} onChange={(event) => setEditDraft({ ...editDraft, zone: event.target.value })}>{ZONES.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="field-label">Health %</label><input type="number" min="0" max="100" value={editDraft.health} onChange={(event) => setEditDraft({ ...editDraft, health: Number(event.target.value) })} />
        <label className="field-label">Status</label><select value={editDraft.status} onChange={(event) => setEditDraft({ ...editDraft, status: event.target.value })}><option value="healthy">Healthy</option><option value="monitor">Monitor</option><option value="critical">Critical</option></select>
        <label className="field-label">Description</label><textarea value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} />
        <button className="button button-block" disabled={!editDraft.name || !editDraft.scientificName} onClick={() => { onUpdateTree(editDraft.id, editDraft); setSelected(editDraft); setEditOpen(false); showToast("Tree record updated in admin prototype."); }}>Save Tree Record</button>
      </Modal>}
      {addOpen && <Modal title="Add New Tree & Generate QR" onClose={() => setAddOpen(false)}>
        <p className="muted">Submitting creates a mock tree ID and QR label for the UI prototype.</p>
        <label className="field-label">Common name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Angsana" />
        <label className="field-label">Scientific name</label><input value={scientificName} onChange={(event) => setScientificName(event.target.value)} placeholder="e.g. Pterocarpus indicus" />
        <button className="button button-block" disabled={!name || !scientificName} onClick={() => { onAddTree({ name, scientificName }); setAddOpen(false); }}>Add Tree & Generate QR</button>
      </Modal>}
    </>
  );
}
