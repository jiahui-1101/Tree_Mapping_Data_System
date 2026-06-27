import http from "node:http";
import { handleMaintenanceRequest, sendJson } from "./routes/maintenanceRoutes.js";

const PORT = Number(process.env.PORT || 4001);

const server = http.createServer((request, response) => {
  handleMaintenanceRequest(request, response).catch((error) => {
    sendJson(response, error.statusCode || 500, { error: error.message || "Internal server error." });
  });
});

server.listen(PORT, () => {
  console.log(`M1-C backend running at http://localhost:${PORT}`);
  console.log("Try GET /api/predictive-alerts or POST /api/predictive-alerts/ALT-001/approve");
});
