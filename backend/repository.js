import * as memoryStore from "./maintenanceStore.js";
import * as mysqlStore from "./mysqlMaintenanceRepository.js";

const repository = process.env.BACKEND_STORE === "mysql" ? mysqlStore : memoryStore;

export const storeMode = process.env.BACKEND_STORE === "mysql" ? "mysql" : "memory";

export async function health() {
  if (repository.health) return repository.health();
  return { ok: true, store: storeMode };
}

export const listAlerts = (...args) => repository.listAlerts(...args);
export const findAlert = (...args) => repository.findAlert(...args);
export const listTasks = (...args) => repository.listTasks(...args);
export const updateAlertStatus = (...args) => repository.updateAlertStatus(...args);
export const approveAlert = (...args) => repository.approveAlert(...args);
export const generateAlertsFromTrees = (...args) => repository.generateAlertsFromTrees(...args);
export const resetStore = (...args) => repository.resetStore(...args);
