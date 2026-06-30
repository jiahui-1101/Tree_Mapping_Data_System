import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { ACCESS_USERS, SERVICE_LOGS, SUPPORT_TICKETS, SYSTEM_SERVICES } from "../data/itSupport.js";
import { AUDIT_LOGS } from "../data/auditLogs.js";
import { getBackendConfig } from "./backendConfig.js";

const DEFAULT_STATE = Object.freeze({
  services: SYSTEM_SERVICES,
  users: ACCESS_USERS,
  tickets: SUPPORT_TICKETS,
  serviceLogs: SERVICE_LOGS,
  auditLogs: AUDIT_LOGS,
});

function cloneState(state = DEFAULT_STATE) {
  return {
    services: (state.services || []).map((item) => ({ ...item })),
    users: (state.users || []).map((item) => ({ ...item })),
    tickets: (state.tickets || []).map((item) => ({ ...item })),
    serviceLogs: (state.serviceLogs || []).map((item) => ({ ...item })),
    auditLogs: (state.auditLogs || []).map((item) => ({ ...item })),
  };
}

function nowLabel() {
  return new Date().toISOString();
}

function nextTicketId(tickets) {
  const max = tickets.reduce((highest, ticket) => {
    const value = Number(String(ticket.id).match(/INC-(\d+)/)?.[1] || 0);
    return Math.max(highest, value);
  }, 1040);
  return `INC-${max + 1}`;
}

function createItSupportStore({ filePath, persist = true, initialState } = {}) {
  let loaded = false;
  let state = cloneState(initialState);
  let persistenceAvailable = persist;

  async function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    if (!persistenceAvailable || !filePath) return;
    try {
      state = cloneState(JSON.parse(await fs.readFile(filePath, "utf8")));
    } catch (error) {
      if (error.code === "ENOENT") return;
      state = cloneState(DEFAULT_STATE);
      persistenceAvailable = false;
    }
  }

  async function save() {
    if (!persistenceAvailable || !filePath) return;
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
    } catch {
      persistenceAvailable = false;
    }
  }

  return {
    async reset(nextState = DEFAULT_STATE) {
      loaded = true;
      state = cloneState(nextState);
      await save();
    },
    async read() {
      await ensureLoaded();
      return cloneState(state);
    },
    async write(mutator) {
      await ensureLoaded();
      const result = mutator(state);
      await save();
      return result;
    },
  };
}

function sqlTimestamp(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(String(value))) return null;
  return String(value).replace("T", " ").replace("Z", "").slice(0, 19);
}

function rowToService(row) {
  return {
    id: row.service_id,
    name: row.service_name,
    dependency: row.dependency,
    status: row.status,
    uptime: row.uptime,
    latency: row.latency,
    lastChecked: row.last_checked,
    note: row.note,
  };
}

function rowToUser(row) {
  return {
    id: row.user_id,
    name: row.display_name,
    role: row.role,
    status: row.status,
    session: row.session_state,
    lastLogin: row.last_login,
  };
}

function rowToTicket(row) {
  return {
    id: row.ticket_id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    status: row.status,
    owner: row.owner,
    source: row.source,
    detail: row.detail,
  };
}

function rowToLog(row) {
  return {
    serviceId: row.service_id,
    time: row.logged_at,
    level: row.level,
    source: row.source,
    message: row.message,
  };
}

function rowToAudit(row) {
  return {
    time: row.logged_at,
    type: row.event_type,
    actor: row.actor_name,
    role: row.role,
    event: row.event_detail,
    severity: row.severity,
  };
}

function createMysqlItSupportStore(config) {
  const pool = mysql.createPool(config.itSupportDatabase);

  async function saveState(connection, state) {
    await connection.query("DELETE FROM it_service_logs");
    await connection.query("DELETE FROM it_support_tickets");
    await connection.query("DELETE FROM it_access_users");
    await connection.query("DELETE FROM it_system_services");
    await connection.query("DELETE FROM it_audit_events");
    for (const service of state.services) {
      await connection.execute(
        `INSERT INTO it_system_services (service_id, service_name, dependency, status, uptime, latency, last_checked, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [service.id, service.name, service.dependency, service.status, service.uptime, service.latency, service.lastChecked, service.note],
      );
    }
    for (const user of state.users) {
      await connection.execute(
        `INSERT INTO it_access_users (user_id, display_name, role, status, session_state, last_login)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.role, user.status, user.session, user.lastLogin],
      );
    }
    for (const ticket of state.tickets) {
      await connection.execute(
        `INSERT INTO it_support_tickets (ticket_id, title, category, priority, status, owner, source, detail)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ticket.id, ticket.title, ticket.category, ticket.priority, ticket.status, ticket.owner, ticket.source, ticket.detail],
      );
    }
    for (const [index, log] of state.serviceLogs.entries()) {
      await connection.execute(
        `INSERT INTO it_service_logs (log_id, service_id, logged_at, level, source, message)
         VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)`,
        [`ITL-${String(index + 1).padStart(3, "0")}`, log.serviceId, sqlTimestamp(log.time), log.level, log.source, log.message],
      );
    }
    for (const [index, log] of state.auditLogs.entries()) {
      await connection.execute(
        `INSERT INTO it_audit_events (audit_id, logged_at, event_type, actor_name, role, event_detail, severity)
         VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?, ?)`,
        [`ITA-${String(index + 1).padStart(3, "0")}`, sqlTimestamp(log.time), log.type, log.actor, log.role, log.event, log.severity],
      );
    }
  }

  return {
    async reset(nextState = DEFAULT_STATE) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await saveState(connection, cloneState(nextState));
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async read() {
      const connection = await pool.getConnection();
      try {
        const [[serviceRows], [userRows], [ticketRows], [logRows], [auditRows]] = await Promise.all([
          connection.query("SELECT * FROM it_system_services ORDER BY service_id"),
          connection.query("SELECT * FROM it_access_users ORDER BY user_id"),
          connection.query("SELECT * FROM it_support_tickets ORDER BY ticket_id DESC"),
          connection.query("SELECT * FROM it_service_logs ORDER BY logged_at DESC, log_id DESC"),
          connection.query("SELECT * FROM it_audit_events ORDER BY logged_at DESC, audit_id DESC"),
        ]);
        const state = {
          services: serviceRows.map(rowToService),
          users: userRows.map(rowToUser),
          tickets: ticketRows.map(rowToTicket),
          serviceLogs: logRows.map(rowToLog),
          auditLogs: auditRows.map(rowToAudit),
        };
        if (!state.services.length) {
          await saveState(connection, cloneState(DEFAULT_STATE));
          return cloneState(DEFAULT_STATE);
        }
        return cloneState(state);
      } finally {
        connection.release();
      }
    },
    async write(mutator) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const current = await this.read();
        const result = mutator(current);
        await saveState(connection, current);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}

function createFallbackStore(primary, fallback) {
  return {
    async reset(nextState) {
      try { return await primary.reset(nextState); } catch { return fallback.reset(nextState); }
    },
    async read() {
      try { return await primary.read(); } catch { return fallback.read(); }
    },
    async write(mutator) {
      try { return await primary.write(mutator); } catch { return fallback.write(mutator); }
    },
  };
}

function createConfiguredItSupportStore(config) {
  const jsonStore = createItSupportStore({ filePath: config.itSupportStorePath });
  if (config.itSupportStore !== "mysql") return jsonStore;
  return createFallbackStore(createMysqlItSupportStore(config), jsonStore);
}

function dashboardFromState(state) {
  const degradedServices = state.services.filter((service) => service.status !== "online").length;
  const failedLogins = state.auditLogs.filter((log) => log.event.toLowerCase().includes("failed")).length;
  const lockedAccounts = state.users.filter((user) => user.status === "locked").length;
  const highRiskEvents = state.auditLogs.filter((log) => log.severity === "high").length;
  const activeTickets = state.tickets.filter((ticket) => ticket.status !== "resolved");
  return { degradedServices, failedLogins, lockedAccounts, highRiskEvents, activeTickets };
}

export function createItSupportBackend({ config = getBackendConfig(), store = createConfiguredItSupportStore(config) } = {}) {
  return {
    async health() {
      const state = await store.read();
      return {
        ok: true,
        store: config.itSupportStore === "mysql" ? "mysql-with-fallback" : "json",
        services: state.services.length,
        users: state.users.length,
        tickets: state.tickets.length,
        serviceLogs: state.serviceLogs.length,
      };
    },
    async resetItSupportState() {
      await store.reset();
      return { ok: true };
    },
    async getDashboard() {
      const state = await store.read();
      return { ok: true, data: { ...dashboardFromState(state), services: state.services, tickets: state.tickets, users: state.users } };
    },
    async listServices() {
      const state = await store.read();
      return { ok: true, data: state.services };
    },
    async getServiceLogs(serviceId) {
      const state = await store.read();
      return { ok: true, data: state.serviceLogs.filter((log) => !serviceId || log.serviceId === serviceId) };
    },
    async runServiceAction({ serviceId, action = "diagnostic", actor = "it001" } = {}) {
      return store.write((state) => {
        const service = state.services.find((item) => item.id === serviceId);
        if (!service) return { ok: false, status: 404, error: "SERVICE_NOT_FOUND", message: "Service not found." };
        const message = action === "restart"
          ? "Service restarted and status refreshed by IT Support."
          : "Diagnostic completed and service telemetry refreshed.";
        if (action === "restart") {
          service.status = "online";
          service.latency = "120 ms";
          service.lastChecked = "Just now";
          service.note = "Restart completed through IT Support backend.";
        }
        const log = { serviceId, time: nowLabel(), level: "info", source: service.name, message };
        state.serviceLogs.unshift(log);
        state.auditLogs.unshift({ time: log.time, type: "edit", actor, role: "IT Support", event: `${action} executed for ${service.name}`, severity: "low" });
        return { ok: true, service, log };
      });
    },
    async listUsers() {
      const state = await store.read();
      return { ok: true, data: state.users };
    },
    async updateUserAccess({ userId, action, actor = "it001" } = {}) {
      return store.write((state) => {
        const user = state.users.find((item) => item.id === userId);
        if (!user) return { ok: false, status: 404, error: "USER_NOT_FOUND", message: "User not found." };
        if (action === "lock") {
          user.status = "locked";
          user.session = "Locked by IT Support";
        } else if (action === "unlock") {
          user.status = "active";
          user.session = "Session restored by IT Support";
        } else if (action === "invalidate-session") {
          user.session = "Session invalidated by IT Support";
        } else if (action === "reset-password") {
          user.session = "Password reset prepared by IT Support";
        } else {
          return { ok: false, status: 400, error: "INVALID_ACTION", message: "Invalid access action." };
        }
        const severity = action === "lock" ? "medium" : "low";
        state.auditLogs.unshift({ time: nowLabel(), type: "security", actor, role: "IT Support", event: `${action} executed for ${user.id}`, severity });
        return { ok: true, user };
      });
    },
    async listTickets() {
      const state = await store.read();
      return { ok: true, data: state.tickets };
    },
    async updateTicket({ ticketId, patch = {}, actor = "it001" } = {}) {
      return store.write((state) => {
        const ticket = state.tickets.find((item) => item.id === ticketId);
        if (!ticket) return { ok: false, status: 404, error: "TICKET_NOT_FOUND", message: "Ticket not found." };
        Object.assign(ticket, {
          owner: patch.owner ?? ticket.owner,
          status: patch.status ?? ticket.status,
          priority: patch.priority ?? ticket.priority,
        });
        state.auditLogs.unshift({ time: nowLabel(), type: "edit", actor, role: "IT Support", event: `${ticket.id} updated to ${ticket.status}`, severity: ticket.priority === "urgent" ? "high" : "low" });
        return { ok: true, ticket };
      });
    },
    async createTicket({ title, category = "Security", priority = "normal", source = "IT Support", detail = "", actor = "it001" } = {}) {
      return store.write((state) => {
        const ticket = {
          id: nextTicketId(state.tickets),
          title,
          category,
          priority,
          status: "open",
          owner: "Unassigned",
          source,
          detail,
        };
        state.tickets.unshift(ticket);
        state.auditLogs.unshift({ time: nowLabel(), type: "alert", actor, role: "IT Support", event: `${ticket.id} created for ${ticket.title}`, severity: priority === "urgent" ? "high" : "medium" });
        return { ok: true, ticket };
      });
    },
  };
}

export { createItSupportStore };
