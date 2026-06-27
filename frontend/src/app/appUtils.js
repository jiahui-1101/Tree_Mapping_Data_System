import { ROLE } from "../models.js";

export const ROLE_LABEL = {
  [ROLE.ADMIN]: "Admin",
  [ROLE.RANGER]: "Ranger",
  [ROLE.VISITOR]: "Visitor",
  [ROLE.IT_SUPPORT]: "IT Support",
};

export function nowLabel() {
  return "Just now";
}

export function nextSequence(prefix, records, key, start = 1) {
  const max = records.reduce((current, record) => {
    const value = Number(String(record[key] || "").match(/(\d+)$/)?.[1] || 0);
    return Math.max(current, value);
  }, start - 1);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function getQrForInput(rawValue, qrCodes = []) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  return qrCodes.find((qr) => (
    qr.qrId.toLowerCase() === normalized ||
    qr.qrEndpoint.toLowerCase() === normalized ||
    qr.treeId.toLowerCase() === normalized
  )) || null;
}
