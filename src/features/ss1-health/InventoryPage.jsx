import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { ZONES } from "../../data/trees.js";
import { filterTrees } from "../../services/mockTreeService.js";

export default function InventoryPage({ trees }) {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("all");
  const [status, setStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
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
          <tbody>{visibleTrees.map((tree) => <tr key={tree.id}><td>{tree.id}</td><td>{tree.name}</td><td><em>{tree.scientificName}</em></td><td>{tree.zone}</td><td>{tree.age} yrs</td><td>{tree.health}%</td><td><StatusPill status={tree.status} /></td><td><button className="table-action">View QR</button></td></tr>)}</tbody>
        </table></div>
      </Card>
    </>
  );
}