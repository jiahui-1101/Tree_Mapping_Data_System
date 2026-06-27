import { TREES } from "../data/trees.js";
import { getPublicTreeCard, projectGrowth } from "../data/visitorTreeProfiles.js";
import { VISITOR_INTEREST_IDS, visitorText } from "../services/visitorI18n.js";
import { buildVisitorRoute, findTree, maskTreeForRole } from "../services/mockTreeService.js";
import { ROLE } from "../models.js";

const SUPPORTED_LANGUAGES = new Set(["en", "bm", "zh"]);
const DEFAULT_SESSION_ID = "guest";

const collectionStore = new Map();
const visitorScanEvents = [];

const CHAT_INTENTS = [
  {
    id: "route",
    keywords: ["route", "walk", "laluan", "jalan", "路线", "路線", "推荐"],
    replies: {
      en: "For a 60 minute visit, start at the Arboretum, continue to the lakeside Riparian zone, then finish at the Nursery flowering zone. I will keep rare-species locations generalized.",
      bm: "Untuk lawatan 60 minit, mula di Arboretum, terus ke zon Riparian tepi tasik, kemudian tamat di zon Semaian berbunga. Lokasi spesies nadir kekal digeneralisasi.",
      zh: "如果参观 60 分钟，建议从植物标本园开始，走到水岸湖区，再到苗圃花卉区结束。珍稀物种位置会保持区域级显示。",
    },
  },
  {
    id: "rare_species_privacy",
    keywords: ["rare", "nadir", "protected", "hide", "珍稀", "隐藏", "保育", "dilindungi"],
    replies: {
      en: "Rare species are shown at zone level only. This protects sensitive plants while still letting visitors learn the conservation story.",
      bm: "Spesies nadir hanya dipaparkan pada tahap zon. Ini melindungi tumbuhan sensitif sambil membolehkan pelawat mempelajari cerita pemuliharaan.",
      zh: "珍稀物种只显示到区域层级。这样既保护敏感植物，也能让游客了解保育故事。",
    },
  },
  {
    id: "identification",
    keywords: ["identify", "id", "kenal", "识别", "辨认"],
    replies: {
      en: "Try observing leaf shape, flower scent, fruit position, bark texture, and the zone you are standing in. A QR scan gives the most reliable Tree ID Card.",
      bm: "Perhatikan bentuk daun, bau bunga, kedudukan buah, tekstur kulit dan zon anda berada. Imbasan QR memberi Kad ID Pokok yang paling tepat.",
      zh: "可以观察叶形、花香、果实位置、树皮纹理和所在区域。扫描 QR 会打开最可靠的树木身份卡。",
    },
  },
  {
    id: "facilities",
    keywords: ["lake", "facility", "cafe", "tasik", "kemudahan", "设施", "湖"],
    replies: {
      en: "Main facilities are near the arrival area, garden cafe, herbarium, lakeside boardwalk, jetty, and nursery learning plots.",
      bm: "Kemudahan utama berada berhampiran kawasan ketibaan, kafe taman, herbarium, laluan papan tepi tasik, jeti dan plot pembelajaran semaian.",
      zh: "主要设施包括入口区、园区咖啡厅、标本馆、湖边木栈道、码头和苗圃学习区。",
    },
  },
];

function normalizeLanguage(language = "en") {
  return SUPPORTED_LANGUAGES.has(language) ? language : "en";
}

function normalizeSessionId(sessionId) {
  const normalized = String(sessionId || DEFAULT_SESSION_ID).trim();
  return normalized || DEFAULT_SESSION_ID;
}

function publicTreePayload(tree, language) {
  const maskedTree = maskTreeForRole(tree, ROLE.VISITOR);
  return getPublicTreeCard(maskedTree, language);
}

function getCollectionSet(sessionId) {
  const id = normalizeSessionId(sessionId);
  if (!collectionStore.has(id)) collectionStore.set(id, new Set());
  return collectionStore.get(id);
}

function buildCollectionSummary(treeIds, language) {
  const collectedTrees = TREES.filter((tree) => treeIds.includes(tree.id));
  const zonesDiscovered = new Set(collectedTrees.map((tree) => tree.zone)).size;
  return {
    totalCollected: collectedTrees.length,
    totalAvailable: TREES.length,
    zonesDiscovered,
    containsRare: collectedTrees.some((tree) => tree.rare),
    badges: collectedTrees.map((tree) => publicTreePayload(tree, language)),
  };
}

function buildFallbackRoute(duration, language) {
  const preferences = ["ancient", "shaded"];
  const route = buildVisitorRoute(preferences, TREES);
  return {
    ...route,
    estimatedDuration: duration,
    fallback: true,
    notice: {
      en: "Showing a recommended popular route based on common preferences.",
      bm: "Memaparkan laluan popular berdasarkan minat umum.",
      zh: "正在显示基于常见兴趣的推荐路线。",
    }[language],
  };
}

export function resetVisitorBackendState() {
  collectionStore.clear();
  visitorScanEvents.length = 0;
}

export function listVisitorTreeProfiles({ language = "en", query = "", zone = "all" } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const needle = String(query || "").trim().toLowerCase();
  return TREES
    .filter((tree) => zone === "all" || tree.zone === zone)
    .filter((tree) => !needle || `${tree.id} ${tree.name} ${tree.scientificName}`.toLowerCase().includes(needle))
    .map((tree) => publicTreePayload(tree, selectedLanguage));
}

export function getVisitorTreeIdCard(treeId, { language = "en", growthYears = 10 } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const tree = findTree(String(treeId || ""), TREES);
  if (!tree) {
    return { ok: false, status: 404, error: "TREE_NOT_FOUND", message: visitorText(selectedLanguage, "qr.invalid") };
  }
  const profile = publicTreePayload(tree, selectedLanguage);
  return {
    ok: true,
    tree: profile,
    growthSimulation: projectGrowth(profile, growthYears),
    privacy: {
      operationalHealthHidden: true,
      protectedCoordinatesMasked: tree.rare,
      message: profile.conservationNote,
    },
  };
}

export function recommendVisitorRoute({ preferences = [], duration = 60, language = "en", aiAvailable = true } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const selectedPreferences = preferences.filter((preference) => VISITOR_INTEREST_IDS.includes(preference));
  const visitDuration = Number(duration) || 60;
  if (selectedPreferences.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "EMPTY_PREFERENCES",
      message: visitorText(selectedLanguage, "explore.validation"),
    };
  }
  const routeResult = aiAvailable ? buildVisitorRoute(selectedPreferences, TREES) : buildFallbackRoute(visitDuration, selectedLanguage);
  if (!routeResult.ok) return { ...routeResult, status: 400 };
  const safeStops = routeResult.route.map((tree) => publicTreePayload(tree, selectedLanguage));
  return {
    ok: true,
    routeId: `VR-${Date.now().toString(36).toUpperCase()}`,
    preferences: selectedPreferences,
    estimatedDuration: visitDuration,
    totalDistance: routeResult.totalDistance,
    fallback: Boolean(routeResult.fallback),
    notice: routeResult.notice || "",
    stops: safeStops,
    waypoints: routeResult.waypoints.map((point) => {
      const tree = point.type === "tree" ? TREES.find((item) => item.id === point.id) : null;
      if (tree?.rare) return { ...point, x: null, y: null, coordinateLabel: "Protected location - exact coordinates hidden" };
      return point;
    }),
    rationale: {
      en: "Stops are selected from visitor-safe public profiles that match the chosen plant interests.",
      bm: "Hentian dipilih daripada profil awam selamat untuk pelawat berdasarkan minat tumbuhan yang dipilih.",
      zh: "路线停靠点来自符合所选兴趣且适合访客查看的公开树木资料。",
    }[selectedLanguage],
  };
}

export function answerVisitorChat({ question = "", language = "en" } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const text = String(question || "").trim();
  if (!text) {
    return {
      ok: false,
      status: 400,
      error: "EMPTY_QUESTION",
      message: visitorText(selectedLanguage, "chat.placeholder"),
    };
  }
  const normalized = text.toLowerCase();
  const intent = CHAT_INTENTS.find((candidate) => candidate.keywords.some((keyword) => normalized.includes(keyword)));
  const reply = intent?.replies[selectedLanguage] || visitorText(selectedLanguage, "chat.meranti");
  return {
    ok: true,
    answer: reply,
    intent: intent?.id || "tree_learning",
    safety: {
      rareSpeciesCoordinatesHidden: true,
      operationalHealthHidden: true,
    },
    suggestions: visitorText(selectedLanguage, "chat.suggestions"),
  };
}

export function addTreeToVisitorCollection({ sessionId, treeId, language = "en" } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const tree = findTree(String(treeId || ""), TREES);
  if (!tree) {
    return { ok: false, status: 404, error: "TREE_NOT_FOUND", message: visitorText(selectedLanguage, "qr.invalid") };
  }
  const collection = getCollectionSet(sessionId);
  const isNew = !collection.has(tree.id);
  collection.add(tree.id);
  const summary = buildCollectionSummary([...collection], selectedLanguage);
  return {
    ok: true,
    isNew,
    message: visitorText(selectedLanguage, isNew ? "collection.unlocked" : "collection.alreadyCollected", { name: tree.name }),
    collection: summary,
  };
}

export function getVisitorCollection({ sessionId, language = "en" } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const collection = getCollectionSet(sessionId);
  return {
    ok: true,
    sessionId: normalizeSessionId(sessionId),
    collection: buildCollectionSummary([...collection], selectedLanguage),
  };
}

export function recordVisitorScan({ sessionId, treeId, language = "en", source = "qr" } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const tree = findTree(String(treeId || ""), TREES);
  if (!tree) {
    return { ok: false, status: 404, error: "TREE_NOT_FOUND", message: visitorText(selectedLanguage, "qr.invalid") };
  }
  const event = {
    scanId: `VSE-${String(visitorScanEvents.length + 1).padStart(3, "0")}`,
    sessionId: normalizeSessionId(sessionId),
    treeId: tree.id,
    zone: tree.zone,
    source,
    scannedAt: new Date().toISOString(),
  };
  visitorScanEvents.unshift(event);
  const collectionResult = addTreeToVisitorCollection({ sessionId, treeId: tree.id, language: selectedLanguage });
  return {
    ok: true,
    event,
    tree: publicTreePayload(tree, selectedLanguage),
    collection: collectionResult.collection,
  };
}

export function getVisitorAnalytics() {
  const byZone = visitorScanEvents.reduce((totals, event) => {
    totals[event.zone] = (totals[event.zone] || 0) + 1;
    return totals;
  }, {});
  return {
    ok: true,
    totalScans: visitorScanEvents.length,
    byZone,
    events: [...visitorScanEvents],
  };
}

