import http from "node:http";
import { handleRequest, sendJson } from "./routes/index.js";

const PORT = Number(process.env.PORT || 4001);

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, error.statusCode || 500, { error: error.message || "Internal server error." });
  });
});

server.listen(PORT, () => {
  console.log(`Tree Mapping backend running at http://localhost:${PORT}`);
  console.log("Try GET /api/predictive-alerts or POST /api/predictive-alerts/ALT-001/approve");
});
