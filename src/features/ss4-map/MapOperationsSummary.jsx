export default function MapOperationsSummary({ areaAcres, zoneCount, stakeholderPlotCount, summary }) {
  return (
    <>
      <div className="map-fact-grid">
        <article><strong>{areaAcres}</strong><span>total acres</span><small>Official JLN area including active nursery lots</small></article>
        <article><strong>{zoneCount}</strong><span>official main zones</span><small>Mapped as conceptual 3D operational areas</small></article>
        <article><strong>{stakeholderPlotCount}</strong><span>stakeholder plots</span><small>Added from plant inventory documents</small></article>
      </div>
      <div className="map-fact-grid">
        <article><strong>{summary.activeQr}</strong><span>active QR labels</span><small>QRCodes.qr_status = active</small></article>
        <article><strong>{summary.invalidatedQr}</strong><span>invalidated QR</span><small>Archived tree labels blocked at scan time</small></article>
        <article><strong>{summary.successfulScans}</strong><span>scan ledger events</span><small>QRScanEvents routed by detected role</small></article>
      </div>
    </>
  );
}
