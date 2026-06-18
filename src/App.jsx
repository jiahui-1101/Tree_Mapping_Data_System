import { useState } from "react";
import MapPage from "./features/ss4-map/MapPage.jsx";
import AuditPage from "./features/ss4-map/AuditPage.jsx";
import SpatialPage from "./features/ss4-map/SpatialPage.jsx";
import { TREES } from "./data/trees.js";
import {
  QRCODES,
  QR_SCAN_EVENTS,
  SPATIAL_PLANNING_RECORDS,
  VISITOR_HEATMAP_AGGREGATES,
} from "./data/ss4Operations.js";
import { ROLE } from "./models.js";

const PAGES = [
  { id: "map", label: "Garden Map" },
  { id: "audit", label: "Audit Log" },
  { id: "spatial", label: "Spatial Planning" },
];

export default function App() {
  const [page, setPage] = useState("map");
  const [toast, setToast] = useState("");
  const [spatialRecords, setSpatialRecords] = useState(SPATIAL_PLANNING_RECORDS);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <main className="ss4-app">
      <header className="ss4-header">
        <div>
          <span className="eyebrow">Subsystem 4</span>
          <h1>Mapping Operations</h1>
        </div>
        <nav className="ss4-tabs" aria-label="Subsystem 4 pages">
          {PAGES.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="ss4-content">
        {page === "map" && (
          <MapPage
            role={ROLE.ADMIN}
            trees={TREES}
            qrCodes={QRCODES}
            qrScanEvents={QR_SCAN_EVENTS}
            visitorHeatmapAggregates={VISITOR_HEATMAP_AGGREGATES}
            onOpenScanner={() => showToast("QR scanner integration will be connected by its owning module.")}
          />
        )}
        {page === "audit" && <AuditPage qrScanEvents={QR_SCAN_EVENTS} showToast={showToast} />}
        {page === "spatial" && (
          <SpatialPage
            trees={TREES}
            spatialPlanningRecords={spatialRecords}
            showToast={showToast}
            onConfirmSpatialPlan={(plan) => {
              setSpatialRecords((records) => [
                {
                  planId: `SPR-${Date.now()}`,
                  species: plan.species,
                  targetZone: plan.targetZone,
                  proposedX: plan.point.x,
                  proposedY: plan.point.y,
                  suitabilityScore: plan.score,
                  suitabilityLabel: plan.tone,
                  decision: "confirmed",
                },
                ...records,
              ]);
              showToast("Spatial plan confirmed.");
            }}
          />
        )}
      </section>

      {toast && <div className="ss4-toast">{toast}</div>}
    </main>
  );
}
