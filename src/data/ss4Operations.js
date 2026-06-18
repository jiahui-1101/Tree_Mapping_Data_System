export const QRCODES = [
  { qrId: "QR-TBJ-001", treeId: "TBJ-001", qrEndpoint: "/scan/QR-TBJ-001", qrStatus: "active", generatedAt: "2026-06-01 08:05", generatedBy: "admin001", exportedAt: "2026-06-01 08:08", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-002", treeId: "TBJ-002", qrEndpoint: "/scan/QR-TBJ-002", qrStatus: "active", generatedAt: "2026-06-01 08:06", generatedBy: "admin001", exportedAt: "2026-06-01 08:09", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-003", treeId: "TBJ-003", qrEndpoint: "/scan/QR-TBJ-003", qrStatus: "active", generatedAt: "2026-06-01 08:07", generatedBy: "admin001", exportedAt: "2026-06-01 08:10", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-004", treeId: "TBJ-004", qrEndpoint: "/scan/QR-TBJ-004", qrStatus: "active", generatedAt: "2026-06-01 08:08", generatedBy: "admin001", exportedAt: "2026-06-01 08:11", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-005", treeId: "TBJ-005", qrEndpoint: "/scan/QR-TBJ-005", qrStatus: "active", generatedAt: "2026-06-01 08:09", generatedBy: "admin001", exportedAt: "2026-06-01 08:12", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-006", treeId: "TBJ-006", qrEndpoint: "/scan/QR-TBJ-006", qrStatus: "active", generatedAt: "2026-06-01 08:10", generatedBy: "admin001", exportedAt: "2026-06-01 08:13", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-007", treeId: "TBJ-007", qrEndpoint: "/scan/QR-TBJ-007", qrStatus: "active", generatedAt: "2026-06-01 08:11", generatedBy: "admin001", exportedAt: "2026-06-01 08:14", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-008", treeId: "TBJ-008", qrEndpoint: "/scan/QR-TBJ-008", qrStatus: "active", generatedAt: "2026-06-01 08:12", generatedBy: "admin001", exportedAt: "2026-06-01 08:15", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-009", treeId: "TBJ-009", qrEndpoint: "/scan/QR-TBJ-009", qrStatus: "active", generatedAt: "2026-06-01 08:13", generatedBy: "admin001", exportedAt: "2026-06-01 08:16", invalidatedAt: "", replacedBy: "" },
  { qrId: "QR-TBJ-010", treeId: "TBJ-010", qrEndpoint: "/scan/QR-TBJ-010", qrStatus: "active", generatedAt: "2026-06-01 08:14", generatedBy: "admin001", exportedAt: "2026-06-01 08:17", invalidatedAt: "", replacedBy: "" },
];

export const QR_SCAN_EVENTS = [
  { scanId: "QSE-104", qrId: "QR-TBJ-004", treeId: "TBJ-004", actorId: "RGR001", roleDetected: "Ranger", routedTo: "SS2-M2-D Field Report", scanResult: "success", scannedAt: "Today 08:41" },
  { scanId: "QSE-103", qrId: "QR-TBJ-002", treeId: "TBJ-002", actorId: "visitor@gmail.com", roleDetected: "Visitor", routedTo: "SS3-M3-A Tree ID Card", scanResult: "success", scannedAt: "Today 08:16" },
  { scanId: "QSE-102", qrId: "QR-TBJ-005", treeId: "TBJ-005", actorId: "", roleDetected: "Visitor", routedTo: "SS3-M3-A Tree ID Card", scanResult: "success", scannedAt: "Yesterday 17:35" },
  { scanId: "QSE-101", qrId: "QR-ARCHIVED-001", treeId: "TBJ-011", actorId: "RGR001", roleDetected: "Ranger", routedTo: "Blocked", scanResult: "archived_qr", scannedAt: "Yesterday 15:22" },
];

export const SPATIAL_PLANNING_RECORDS = [
  { planId: "SPR-203", createdBy: "admin001", species: "Pterocarpus indicus", targetZone: "Arboretum", proposedX: 53, proposedY: 43, suitabilityScore: 78, suitabilityLabel: "High", aiReasoning: "No significant canopy conflict detected near the proposed Arboretum point.", decision: "confirmed", createdAt: "Today 07:40" },
  { planId: "SPR-202", createdBy: "admin001", species: "Samanea saman", targetZone: "Tanaman", proposedX: 82, proposedY: 11, suitabilityScore: 41, suitabilityLabel: "Low", aiReasoning: "Marker is too close to constrained edge space and expected canopy conflict.", decision: "discarded", createdAt: "Yesterday 16:05" },
];

export const VISITOR_HEATMAP_AGGREGATES = [
  { aggregateId: "VHA-001", zoneId: "arboretum", treeId: "TBJ-002", scanCount: 46, uniqueSessions: 32, periodStart: "2026-06-01", periodEnd: "2026-06-05", trafficLevel: "high", x: 45, y: 38 },
  { aggregateId: "VHA-002", zoneId: "tanaman-buah", treeId: "TBJ-004", scanCount: 31, uniqueSessions: 22, periodStart: "2026-06-01", periodEnd: "2026-06-05", trafficLevel: "medium", x: 64, y: 66 },
  { aggregateId: "VHA-003", zoneId: "riparian", treeId: "TBJ-007", scanCount: 18, uniqueSessions: 15, periodStart: "2026-06-01", periodEnd: "2026-06-05", trafficLevel: "medium", x: 75, y: 49 },
  { aggregateId: "VHA-004", zoneId: "tapak-semaian", treeId: "TBJ-010", scanCount: 12, uniqueSessions: 9, periodStart: "2026-06-01", periodEnd: "2026-06-05", trafficLevel: "low", x: 82, y: 41 },
];
