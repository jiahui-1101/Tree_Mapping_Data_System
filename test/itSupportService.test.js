import test from "node:test";
import assert from "node:assert/strict";
import { ACCESS_USERS, SERVICE_LOGS } from "../src/data/itSupport.js";
import {
  filterAccessUsers,
  filterServiceLogs,
  getServiceLogs,
} from "../src/services/itSupportService.js";

test("filters IT access users by role and status", () => {
  const users = filterAccessUsers(ACCESS_USERS, { role: "IT Support", status: "active" });
  assert.ok(users.length > 0);
  assert.ok(users.every((user) => user.role === "IT Support" && user.status === "active"));
});

test("finds access users by searchable identity fields", () => {
  const expected = ACCESS_USERS[0];
  const users = filterAccessUsers(ACCESS_USERS, { query: expected.id });
  assert.equal(users[0]?.id, expected.id);
});

test("gets logs for one monitored service", () => {
  const serviceId = SERVICE_LOGS[0].serviceId;
  const logs = getServiceLogs(serviceId, SERVICE_LOGS);
  assert.ok(logs.length > 0);
  assert.ok(logs.every((log) => log.serviceId === serviceId));
});

test("filters service logs by severity level", () => {
  const warnings = filterServiceLogs(SERVICE_LOGS, "warning");
  assert.ok(warnings.length > 0);
  assert.ok(warnings.every((log) => log.level === "warning"));
});
