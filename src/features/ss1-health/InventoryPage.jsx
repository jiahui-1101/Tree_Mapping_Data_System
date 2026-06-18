import { useState } from "react";
import { ZONES } from "../../data/trees.js";

export default function InventoryPage() {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("all");
  const [status, setStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

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
    </>
  );
}