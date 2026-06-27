import { handleMaintenanceRoutes, maintenanceEndpoints } from "./maintenanceRoutes.js";
import { sendJson } from "../utils/http.js";

const moduleEndpoints = {
  ss1Maintenance: maintenanceEndpoints,
};

export async function handleRequest(request, response) {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});

  if (request.method === "GET" && request.url === "/") {
    return sendJson(response, 200, {
      service: "Tree Mapping Data System Backend",
      message: "Shared backend server is running. Use the module endpoints below for demo.",
      modules: moduleEndpoints,
    });
  }

  if (await handleMaintenanceRoutes(request, response)) return;

  return sendJson(response, 404, { error: "Route not found." });
}

export { sendJson };
