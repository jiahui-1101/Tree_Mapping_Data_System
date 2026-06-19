import test from "node:test";
import assert from "node:assert/strict";
import { summarizeMapOperations } from "../src/services/mapOperationsService.js";
import { searchAuditLogs, summarizeAuditOperations } from "../src/services/auditOperationsService.js";
import { evaluateSpatialPoint } from "../src/services/spatialPlanningService.js";

test("summarizes QR and visitor map operations", () => {
  const summary = summarizeMapOperations({
    qrCodes: [{ qrStatus: "active" }, { qrStatus: "invalidated" }],
    qrScanEvents: [{ scanResult: "success" }, { scanResult: "blocked" }],
    visitorHeatmapAggregates: [
      { treeId: "TBJ-001", scanCount: 4 },
      { treeId: "TBJ-002", scanCount: 9 },
    ],
  });

  assert.equal(summary.activeQr, 1);
  assert.equal(summary.invalidatedQr, 1);
  assert.equal(summary.successfulScans, 1);
  assert.equal(summary.totalVisitorScans, 13);
  assert.equal(summary.topTrafficPoint.treeId, "TBJ-002");
});

test("summarizes audit and invalid QR events", () => {
  const auditLogs = [
    { event: "Failed login", severity: "high", type: "security" },
    { event: "Service error", severity: "medium", type: "error" },
  ];
  const summary = summarizeAuditOperations(auditLogs, [{ scanResult: "archived_qr" }]);

  assert.equal(summary.highSeverity, 1);
  assert.equal(summary.failedLogins, 1);
  assert.equal(summary.systemErrors, 1);
  assert.equal(summary.invalidQrScans, 1);
});

test("searches audit records across actor and event fields", () => {
  const logs = [{ time: "Now", type: "edit", actor: "Admin", role: "Admin", event: "Tree updated", severity: "low" }];
  assert.equal(searchAuditLogs(logs, "tree updated").length, 1);
  assert.equal(searchAuditLogs(logs, "missing").length, 0);
});

test("scores constrained and suitable spatial points", () => {
  assert.equal(evaluateSpatialPoint({ x: 80, y: 10 }).tone, "Low");
  assert.equal(evaluateSpatialPoint({ x: 53, y: 43 }).tone, "High");
});
