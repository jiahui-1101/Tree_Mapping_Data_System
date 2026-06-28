import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ROLE } from "../src/models.js";
import { canAccessPage } from "../src/services/mockAuthService.js";
import { buildVisitorRoute, maskTreeForRole } from "../src/services/mockTreeService.js";
import { filterAccessUsers, filterServiceLogs, getServiceLogs } from "../src/services/itSupportService.js";
import { buildMaintenanceTask, buildUrgentTask, updateTreeRecord } from "../src/services/adminService.js";
import { analyzeFieldPhoto, buildReportAnalysis, createFieldReport, filterFieldReports, filterRangerTasks, findLinkedTaskForTree } from "../src/services/rangerService.js";
import { addCollectedTree, addCollectedTreeWithStatus, loadCollection, loadLanguage, saveLanguage } from "../src/services/storageService.js";
import { TREES } from "../src/data/trees.js";
import { INITIAL_FIELD_REPORTS } from "../src/data/fieldReports.js";
import { SERVICE_LOGS, SYSTEM_SERVICES } from "../src/data/itSupport.js";
import { INITIAL_TASKS } from "../src/data/tasks.js";
import { visitorText, visitorTreeDescription } from "../src/services/visitorI18n.js";
import { MAP_ZONES, TBJ_COLLECTION_SUMMARIES, TBJ_MAP_FACTS, TBJ_STAKEHOLDER_PLOTS, countStakeholderRecords, countZoneRecords, formatPlotQuantity, getMapSourceSummary, getStakeholderPlotInventory, getStakeholderPlotsByZone, getStakeholderSourceGroup, getVisitorZone, percentToWorldPosition, worldToPercentPosition } from "../src/data/gardenMap.js";
import { getPublicTreeCard, projectGrowth } from "../src/data/visitorTreeProfiles.js";
import { createApp } from "../src/backend/server.js";
import { createVisitorBackend, addTreeToVisitorCollection, answerVisitorChat, getSs4QrScanEvents, getVisitorAnalytics, getVisitorCollection, getVisitorTreeIdCard, recommendVisitorRoute, recordVisitorScan, resetVisitorBackendState } from "../src/backend/visitorBackendService.js";
import { createVisitorStore } from "../src/backend/visitorStore.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("RBAC exposes the correct role navigation", () => {
  assert.equal(canAccessPage(ROLE.ADMIN, "spatial"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "dashboard"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "inventory"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "maintenance"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "schedule"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "rangers"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "tasks"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "map"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "audit"), true);
  assert.equal(canAccessPage(ROLE.ADMIN, "it-dashboard"), false);
  assert.equal(canAccessPage(ROLE.IT_SUPPORT, "audit"), true);
  assert.equal(canAccessPage(ROLE.IT_SUPPORT, "map"), true);
  assert.equal(canAccessPage(ROLE.IT_SUPPORT, "it-dashboard"), true);
  assert.equal(canAccessPage(ROLE.IT_SUPPORT, "it-monitoring"), true);
  assert.equal(canAccessPage(ROLE.IT_SUPPORT, "it-users"), true);
  assert.equal(canAccessPage(ROLE.IT_SUPPORT, "it-tickets"), true);
  assert.equal(canAccessPage(ROLE.VISITOR, "audit"), false);
  assert.equal(canAccessPage(ROLE.VISITOR, "it-users"), false);
  assert.equal(canAccessPage(ROLE.RANGER, "ranger-tasks"), true);
  assert.equal(canAccessPage(ROLE.RANGER, "qr"), true);
  assert.equal(canAccessPage(ROLE.RANGER, "map"), true);
  assert.equal(canAccessPage(ROLE.RANGER, "ranger-reports"), true);
  assert.equal(canAccessPage(ROLE.RANGER, "it-tickets"), false);
  assert.equal(canAccessPage(ROLE.VISITOR, "ranger-reports"), false);
  assert.equal(canAccessPage(ROLE.IT_SUPPORT, "ranger-reports"), false);
});

test("admin helpers create task drafts and update tree records", () => {
  const maintenanceTask = buildMaintenanceTask({
    id: "ALT-X",
    treeId: "TBJ-004",
    title: "Fungal infection outbreak",
    zone: "Tanaman",
    confidence: 92,
    detail: "High humidity indicates spreading infection.",
  }, "Ahmad Razif", INITIAL_TASKS);
  assert.equal(maintenanceTask.id, "TSK-090");
  assert.equal(maintenanceTask.source, "AI Predictive Maintenance");
  assert.equal(maintenanceTask.priority, "urgent");
  assert.equal(maintenanceTask.status, "pending");
  assert.equal(maintenanceTask.ranger, "Ahmad Razif");
  assert.deepEqual(filterRangerTasks([...INITIAL_TASKS, maintenanceTask], "Ahmad Razif", { source: "AI Predictive Maintenance" }).map((task) => task.id), ["TSK-090"]);

  const urgentTask = buildUrgentTask({ ranger: "Siti Nurul", issue: "Broken branch over visitor path", treeId: "TBJ-003", zone: "Pemuliharaan", priority: "high" }, [...INITIAL_TASKS, maintenanceTask]);
  assert.equal(urgentTask.id, "TSK-091");
  assert.equal(urgentTask.source, "Admin urgent dispatch");
  assert.equal(urgentTask.priority, "high");
  assert.equal(urgentTask.ranger, "Siti Nurul");
  assert.ok(urgentTask.notes.includes("Pemuliharaan"));

  const updated = updateTreeRecord(TREES, "TBJ-004", { name: "Updated Nangka", health: 55, status: "monitor" });
  const tree = updated.find((item) => item.id === "TBJ-004");
  assert.equal(tree.id, "TBJ-004");
  assert.equal(tree.name, "Updated Nangka");
  assert.equal(tree.health, 55);
  assert.equal(tree.status, "monitor");
});

test("visitor collection uses localStorage without duplicate entries", () => {
  const storage = createStorage();
  addCollectedTree("TBJ-001", storage);
  addCollectedTree("TBJ-001", storage);
  addCollectedTree("TBJ-002", storage);
  assert.deepEqual(loadCollection(storage), ["TBJ-001", "TBJ-002"]);
  assert.equal(addCollectedTreeWithStatus("TBJ-003", storage).isNew, true);
  assert.equal(addCollectedTreeWithStatus("TBJ-003", storage).isNew, false);
});

test("IT support user filters narrow access control data", () => {
  assert.deepEqual(filterAccessUsers(undefined, { role: "IT Support" }).map((user) => user.id), ["it001"]);
  assert.deepEqual(filterAccessUsers(undefined, { status: "locked" }).map((user) => user.id), ["RGR004"]);
  assert.deepEqual(filterAccessUsers(undefined, { session: "none" }).map((user) => user.id), ["visitor@gmail.com"]);
  assert.deepEqual(filterAccessUsers(undefined, { query: "faizal" }).map((user) => user.id), ["RGR004"]);
});

test("IT support service logs are available and filterable by level", () => {
  for (const service of SYSTEM_SERVICES) {
    assert.ok(getServiceLogs(service.id).length > 0);
  }
  const qrLogs = getServiceLogs("qr-service", SERVICE_LOGS);
  assert.ok(filterServiceLogs(qrLogs, "error").every((log) => log.level === "error"));
  assert.equal(filterServiceLogs(qrLogs, "all").length, qrLogs.length);
});

test("ranger task and report filters support field workflows", () => {
  assert.deepEqual(filterRangerTasks(INITIAL_TASKS, "Ahmad Razif", { priority: "urgent" }).map((task) => task.id), ["TSK-087"]);
  assert.deepEqual(filterRangerTasks(INITIAL_TASKS, "Ahmad Razif", { query: "water stress" }).map((task) => task.id), ["TSK-089"]);
  assert.equal(filterRangerTasks(INITIAL_TASKS, "Siti Nurul").length, 1);
  assert.deepEqual(filterFieldReports(INITIAL_FIELD_REPORTS, "Ahmad Razif", { reportMode: "manual" }).map((report) => report.id), ["FR-1021"]);
  assert.deepEqual(filterFieldReports(INITIAL_FIELD_REPORTS, "Ahmad Razif", { observedStatus: "critical" }).map((report) => report.id), ["FR-1020"]);
});

test("ranger field reports support manual assessment without AI diagnosis", () => {
  const tree = TREES.find((item) => item.id === "TBJ-004");
  const report = createFieldReport({
    tree,
    rangerName: "Ahmad Razif",
    tasks: INITIAL_TASKS,
    existingReports: [],
    draft: {
      reportMode: "manual",
      observedStatus: "critical",
      manualCause: "Visible fungal spread on leaves.",
      manualTreatment: "Remove infected leaves and isolate nearby samples.",
      notes: "Manual check completed.",
    },
  });
  assert.equal(report.reportMode, "manual");
  assert.equal(report.diagnosis, "");
  assert.equal(report.confidence, null);
  assert.equal(report.photoName, "");
  assert.equal(report.photoSyncStatus, "none");
  assert.equal(report.photoAnalysisStatus, "not-requested");
  assert.deepEqual(report.aiPossibilities, []);
  assert.equal(report.taskId, "TSK-087");
  assert.ok(report.analysis.summary.includes("Manual ranger assessment"));
  assert.ok(!report.analysis.summary.includes("Photo uploaded to admin dashboard"));
  assert.ok(report.analysis.recommendation.includes("Remove infected leaves"));
});

test("ranger field reports support optional AI diagnosis analysis", () => {
  const tree = TREES.find((item) => item.id === "TBJ-004");
  const aiResult = analyzeFieldPhoto({ tree, photoName: "ai-leaf-photo.jpg" });
  assert.equal(aiResult.possibilities.length, 3);
  for (const possibility of aiResult.possibilities) {
    assert.equal(possibility.reasons.length, 3);
    assert.equal(possibility.solutions.length, 3);
  }
  const report = createFieldReport({
    tree,
    rangerName: "Ahmad Razif",
    tasks: INITIAL_TASKS,
    existingReports: [],
    draft: {
      reportMode: "ai",
      observedStatus: "monitor",
      photoName: aiResult.photoName,
      aiPossibilities: aiResult.possibilities,
      selectedAiPossibilityId: aiResult.selectedAiPossibilityId,
      photoAnalysisStatus: aiResult.photoAnalysisStatus,
      notes: "Ranger requested AI support.",
    },
  });
  assert.equal(report.reportMode, "ai");
  assert.equal(report.diagnosis, "Leaf spot disease");
  assert.equal(report.aiPossibilities.length, 3);
  assert.equal(report.selectedAiPossibilityId, "ai-1");
  assert.equal(report.photoName, "ai-leaf-photo.jpg");
  assert.equal(report.photoSyncStatus, "uploaded");
  assert.equal(report.photoAnalysisStatus, "analyzed");
  assert.ok(report.analysis.summary.includes("AI-assisted diagnosis"));
  assert.ok(report.analysis.summary.includes("AI analyzed uploaded photo"));
  assert.ok(report.analysis.photoSyncMessage.includes("uploaded to admin"));
  assert.ok(report.analysis.recommendation.includes("copper-based"));
});

test("ranger report helpers link matching tree tasks and build analysis", () => {
  const linked = findLinkedTaskForTree(INITIAL_TASKS, "TBJ-004", "Ahmad Razif");
  assert.equal(linked.id, "TSK-087");
  const photoResult = analyzeFieldPhoto({ tree: TREES[0], photoName: "healthy-tree.jpg" });
  assert.equal(photoResult.possibilities.length, 3);
  assert.ok(photoResult.diagnosis.length > 0);
  assert.equal(photoResult.photoAnalysisStatus, "analyzed");
  const analysis = buildReportAnalysis({ reportMode: "manual", manualCause: "Known pest issue.", manualTreatment: "Apply treatment.", observedStatus: "healthy", linkedTask: linked });
  assert.equal(analysis.source, "manual");
  assert.equal(analysis.severity, "Healthy");
  assert.ok(analysis.taskSyncMessage.includes("TSK-087"));
  assert.ok(analysis.photoSyncMessage.includes("No field photo"));
});

test("visitor language choice persists", () => {
  const storage = createStorage();
  saveLanguage("zh", storage);
  assert.equal(loadLanguage(storage), "zh");
});

test("visitor route generator validates missing interests", () => {
  assert.deepEqual(buildVisitorRoute([]), {
    ok: false,
    message: "Please select at least one plant interest.",
  });
  const route = buildVisitorRoute(["Ancient Trees"]);
  assert.equal(route.ok, true);
  assert.ok(route.route.length > 0);
  assert.ok(route.waypoints.length > route.route.length);
  assert.match(route.totalDistance, /km$/);
  assert.ok(buildVisitorRoute(["ancient"]).route.length > 0);
});

test("visitor tree data excludes health fields and rare coordinates", () => {
  const rareTree = TREES.find((tree) => tree.rare);
  const publicTree = maskTreeForRole(rareTree, ROLE.VISITOR);
  assert.equal(publicTree.x, null);
  assert.equal(publicTree.health, undefined);
  assert.equal(publicTree.status, undefined);
  assert.equal(maskTreeForRole(TREES[0], ROLE.VISITOR).health, undefined);
  assert.equal(maskTreeForRole(rareTree, ROLE.RANGER).coordinateLabel, "Protected location - exact coordinates hidden");
  assert.equal(maskTreeForRole(rareTree, ROLE.ADMIN).x, rareTree.x);
  assert.equal(maskTreeForRole(rareTree, ROLE.IT_SUPPORT).x, rareTree.x);
});

test("visitor translations cover navigation and QR actions", () => {
  assert.equal(visitorText("zh", "nav.collection"), "收藏");
  assert.equal(visitorText("bm", "qr.enableCamera"), "Aktifkan Kamera");
  assert.equal(visitorText("zh", "collection.added", { name: "Angsana" }), "Angsana 已加入您的访客收藏。");
  assert.equal(visitorText("en", "explore.planTitle"), "Plan Your Garden Walk");
  assert.equal(visitorText("zh", "chat.eyebrow"), "园区学习伙伴");
  assert.equal(visitorText("bm", "chat.floatingLabel"), "Tanya AI");
  assert.equal(visitorText("zh", "profiles.yearSuffix"), "年");
});

test("3D garden map models the official TBJ zones with demo record counts", () => {
  assert.equal(TBJ_MAP_FACTS.areaAcres, 245.04);
  assert.equal(TBJ_MAP_FACTS.originalGardenAcres, 194.09);
  assert.equal(TBJ_MAP_FACTS.nurseryAcres, 50.95);
  assert.deepEqual(MAP_ZONES.map((zone) => zone.name), [
    "Pentadbiran",
    "Arboretum",
    "Pemuliharaan / Hutan Sekunder",
    "Tapak Semaian",
    "Riparian / Habitat",
    "Tanaman Buah-buahan",
  ]);
  assert.equal(countZoneRecords(TREES, MAP_ZONES.find((zone) => zone.id === "arboretum")), 4);
  assert.deepEqual(worldToPercentPosition(percentToWorldPosition({ x: 65, y: 34 })), { x: 65, y: 34 });
  assert.equal(getVisitorZone("arboretum", "zh").localizedName, "植物标本园收藏区");
});

test("TBJ stakeholder plot layer combines official map with inventory documents", () => {
  const plotNames = TBJ_STAKEHOLDER_PLOTS.map((plot) => plot.name);
  assert.ok(plotNames.includes("Jalan Tasik Utama"));
  assert.ok(plotNames.includes("Plot Buah-buahan"));
  assert.ok(plotNames.includes("Ethnobotani"));
  assert.ok(plotNames.includes("Tanaman Nadir"));
  assert.ok(plotNames.includes("Nama Tempat"));
  assert.ok(plotNames.includes("Riparian"));
  assert.equal(countStakeholderRecords("plot-buah-buahan"), 154);
  assert.equal(countStakeholderRecords("arid"), 168);
  assert.equal(countStakeholderRecords("riparian"), 97);
  assert.equal(countStakeholderRecords("ethnobotani"), 185);
  assert.equal(countStakeholderRecords("tanaman-nadir"), 154);
  assert.equal(countStakeholderRecords("nama-tempat"), 181);
  assert.equal(countStakeholderRecords("jalan-tasik-utama"), 249);
  assert.equal(countStakeholderRecords("rumah-tamu"), 24);
  assert.equal(countStakeholderRecords("tasik-bukit-belah"), 19);
  assert.equal(getStakeholderSourceGroup("jalan-rumah-tasik").total, 339);
  assert.equal(getStakeholderPlotInventory("jalan-tasik-utama").speciesRows, 36);
  assert.ok(formatPlotQuantity("rumah-tamu").includes("source group 339"));
  assert.ok(TBJ_COLLECTION_SUMMARIES.find((summary) => summary.plotId === "jalan-tasik-utama").label.includes("source group total 339"));
  assert.ok(getStakeholderPlotsByZone("arboretum").some((plot) => plot.name === "Ethnobotani"));
  assert.ok(getMapSourceSummary().includes("DOCX inventory quantities"));
});

test("public visitor tree profiles are educational and do not expose operations", () => {
  const tree = TREES.find((item) => item.id === "TBJ-005");
  const profile = getPublicTreeCard(tree, "en");
  const zhProfile = getPublicTreeCard(tree, "zh");
  assert.equal(profile.health, undefined);
  assert.equal(profile.status, undefined);
  assert.equal(profile.family, "Dipterocarpaceae");
  assert.ok(profile.zoneContext.toLowerCase().includes("conservation"));
  assert.ok(profile.badges.includes("Protected"));
  assert.ok(zhProfile.badges.includes("受保护"));
  assert.ok(zhProfile.description.includes("受保护"));
  assert.ok(profile.photoUrl.includes("visitor-trees"));
  assert.ok(profile.photoUrl.endsWith(".jpg"));
  assert.equal(existsSync(fileURLToPath(profile.photoUrl)), true);
  assert.equal(profile.photoCredit, "Wikimedia Commons representative species photo");
  assert.match(profile.photoSourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(zhProfile.photoAlt, /代表性演示照片/);
  assert.ok(!visitorTreeDescription("en", TREES.find((tree) => tree.id === "TBJ-004")).includes("urgent"));
});

test("all visitor profiles use stable local photos with localized alt text", () => {
  for (const tree of TREES) {
    const enProfile = getPublicTreeCard(tree, "en");
    const bmProfile = getPublicTreeCard(tree, "bm");
    const zhProfile = getPublicTreeCard(tree, "zh");
    assert.ok(enProfile.photoUrl.includes("visitor-trees"));
    assert.ok(enProfile.photoUrl.endsWith(".jpg"));
    assert.equal(existsSync(fileURLToPath(enProfile.photoUrl)), true);
    assert.ok(enProfile.photoSourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:"));
    assert.ok(enProfile.photoCredit.length > 0);
    assert.notEqual(enProfile.photoAlt, bmProfile.photoAlt);
    assert.notEqual(enProfile.photoAlt, zhProfile.photoAlt);
  }
});

test("growth simulation produces distinct visual model values", () => {
  const profile = getPublicTreeCard(TREES.find((tree) => tree.id === "TBJ-001"), "en");
  const year5 = projectGrowth(profile, 5);
  const year50 = projectGrowth(profile, 50);
  assert.ok(year50.height > year5.height);
  assert.ok(year50.canopy > year5.canopy);
  assert.ok(year50.root > year5.root);
  assert.notEqual(year5.milestone, year50.milestone);
});

test("SS3 backend returns visitor-safe digital tree ID cards", async () => {
  await resetVisitorBackendState();
  const result = getVisitorTreeIdCard("TBJ-005", { language: "zh", growthYears: 25 });
  assert.equal(result.ok, true);
  assert.equal(result.tree.health, undefined);
  assert.equal(result.tree.status, undefined);
  assert.equal(result.tree.x, undefined);
  assert.equal(result.tree.y, undefined);
  assert.equal(result.privacy.operationalHealthHidden, true);
  assert.equal(result.privacy.protectedCoordinatesMasked, true);
  assert.equal(result.growthSimulation.years, 25);
  assert.ok(result.growthSimulation.height > 0);
});

test("SS3 backend validates route preferences and provides AI fallback route", async () => {
  const missing = await recommendVisitorRoute({ preferences: [], language: "bm" });
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 400);
  assert.match(missing.message, /sekurang-kurangnya/i);

  const route = await recommendVisitorRoute({ preferences: ["rare", "ancient"], duration: 90, language: "en", aiAvailable: false });
  assert.equal(route.ok, true);
  assert.equal(route.fallback, true);
  assert.equal(route.estimatedDuration, 90);
  assert.ok(route.stops.length > 0);
  assert.ok(route.stops.every((stop) => stop.health === undefined && stop.status === undefined));
});

test("SS3 backend chatbot is multilingual and hides sensitive operations", async () => {
  const reply = await answerVisitorChat({ question: "为什么隐藏珍稀物种位置？", language: "zh" });
  assert.equal(reply.ok, true);
  assert.equal(reply.intent, "rare_species_privacy");
  assert.equal(reply.provider, "Local rule engine");
  assert.equal(reply.safety.rareSpeciesCoordinatesHidden, true);
  assert.match(reply.answer, /珍稀物种/);
});

test("SS3 backend collection and scan analytics support visitor discovery tracking", async () => {
  await resetVisitorBackendState();
  const first = await addTreeToVisitorCollection({ sessionId: "visitor-a", treeId: "TBJ-001", language: "en" });
  const duplicate = await addTreeToVisitorCollection({ sessionId: "visitor-a", treeId: "TBJ-001", language: "en" });
  assert.equal(first.isNew, true);
  assert.equal(duplicate.isNew, false);
  assert.equal((await getVisitorCollection({ sessionId: "visitor-a" })).collection.totalCollected, 1);

  const scan = await recordVisitorScan({ sessionId: "visitor-a", treeId: "TBJ-004", language: "en" });
  assert.equal(scan.ok, true);
  assert.equal(scan.collection.totalCollected, 2);
  const analytics = await getVisitorAnalytics();
  assert.equal(analytics.totalScans, 1);
  assert.equal(analytics.byZone.Tanaman, 1);
});

test("SS3 backend exposes scan events in SS4 QRScanEvents shape", async () => {
  await resetVisitorBackendState();
  await recordVisitorScan({ sessionId: "ss4-link", treeId: "TBJ-002", language: "en" });
  const payload = await getSs4QrScanEvents();
  assert.equal(payload.ok, true);
  assert.equal(payload.targetModel, "SS4.QRScanEvents");
  assert.deepEqual(Object.keys(payload.events[0]), [
    "scanId",
    "qrId",
    "treeId",
    "actorId",
    "roleDetected",
    "routedTo",
    "scanResult",
    "scannedAt",
  ]);
  assert.equal(payload.events[0].qrId, "QR-TBJ-002");
  assert.equal(payload.events[0].routedTo, "SS3-M3-A Tree ID Card");
});

test("SS3 Express API exposes visitor backend endpoints", async () => {
  const backend = createVisitorBackend({ store: createVisitorStore({ persist: false }) });
  await backend.resetVisitorBackendState();
  const server = createApp({ backend }).listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
    assert.equal(health.ok, true);
    assert.ok(health.modules.some((moduleName) => moduleName.includes("M3-A")));

    const tree = await fetch(`${baseUrl}/api/visitor/trees/TBJ-005?language=en&growthYears=10`).then((response) => response.json());
    assert.equal(tree.ok, true);
    assert.equal(tree.tree.status, undefined);
    assert.equal(tree.privacy.protectedCoordinatesMasked, true);

    const collection = await fetch(`${baseUrl}/api/visitor/collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Visitor-Session": "api-test" },
      body: JSON.stringify({ treeId: "TBJ-002", language: "en" }),
    }).then((response) => response.json());
    assert.equal(collection.ok, true);
    assert.equal(collection.collection.totalCollected, 1);

    const ss4Events = await fetch(`${baseUrl}/api/visitor/integrations/ss4/qr-scan-events`).then((response) => response.json());
    assert.equal(ss4Events.ok, true);
    assert.equal(ss4Events.targetModel, "SS4.QRScanEvents");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("SS3 Express API validates visitor request payloads", async () => {
  const backend = createVisitorBackend({ store: createVisitorStore({ persist: false }) });
  const server = createApp({ backend }).listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const invalidTree = await fetch(`${baseUrl}/api/visitor/trees/not-a-tree`).then((response) => response.json());
    assert.equal(invalidTree.ok, false);
    assert.equal(invalidTree.error, "VALIDATION_ERROR");

    const invalidRoute = await fetch(`${baseUrl}/api/visitor/routes/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: "rare" }),
    }).then((response) => response.json());
    assert.equal(invalidRoute.ok, false);
    assert.match(invalidRoute.message, /preferences must be an array/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("SS3 backend persists visitor collection and analytics through injected store", async () => {
  const store = createVisitorStore({ persist: false });
  const backend = createVisitorBackend({ store, config: { aiProvider: "mock", aiTimeoutMs: 100 } });
  await backend.resetVisitorBackendState();
  await backend.addTreeToVisitorCollection({ sessionId: "persisted", treeId: "TBJ-003", language: "en" });
  await backend.recordVisitorScan({ sessionId: "persisted", treeId: "TBJ-003", language: "en", source: "qr" });
  await backend.answerVisitorChat({ sessionId: "persisted", question: "Where are the lakes?", language: "en" });
  await backend.recommendVisitorRoute({ sessionId: "persisted", preferences: ["shaded"], duration: 45, language: "en" });

  const collection = await backend.getVisitorCollection({ sessionId: "persisted", language: "en" });
  const analytics = await backend.getVisitorAnalytics();
  assert.equal(collection.collection.totalCollected, 1);
  assert.equal(analytics.totalScans, 1);
  assert.equal(analytics.totalChatQuestions, 1);
  assert.equal(analytics.totalRoutePlans, 1);
});

test("SS3 database schema documents visitor integration tables", () => {
  const schema = readFileSync(new URL("../docs/database/ss3_schema.sql", import.meta.url), "utf8");
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_sessions/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_collections/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_scan_events/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_chat_logs/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_route_plans/);
});

