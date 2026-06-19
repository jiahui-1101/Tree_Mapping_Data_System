export function summarizeMapOperations({ qrCodes = [], qrScanEvents = [], visitorHeatmapAggregates = [] } = {}) {
  const topTrafficPoint = visitorHeatmapAggregates
    .slice()
    .sort((left, right) => right.scanCount - left.scanCount)[0] || null;

  return {
    activeQr: qrCodes.filter((qr) => qr.qrStatus === "active").length,
    invalidatedQr: qrCodes.filter((qr) => qr.qrStatus === "invalidated").length,
    successfulScans: qrScanEvents.filter((event) => event.scanResult === "success").length,
    totalVisitorScans: visitorHeatmapAggregates.reduce((total, aggregate) => total + aggregate.scanCount, 0),
    topTrafficPoint,
  };
}
