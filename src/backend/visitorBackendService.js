import { TREES } from "../data/trees.js";
import { getPublicTreeCard, projectGrowth } from "../data/visitorTreeProfiles.js";
import { VISITOR_INTEREST_IDS, visitorText } from "../services/visitorI18n.js";
import { buildVisitorRoute, findTree, maskTreeForRole } from "../services/mockTreeService.js";
import { ROLE } from "../models.js";
import { askBotanicalAi } from "./botanicalAiAdapter.js";
import { getBackendConfig } from "./backendConfig.js";
import { createVisitorStore } from "./visitorStore.js";

const SUPPORTED_LANGUAGES = new Set(["en", "bm", "zh"]);
const DEFAULT_SESSION_ID = "guest";
const DEFAULT_GARDEN_CONTEXT = [
  "Johor Botanical Garden visitor portal",
  "public tree profiles",
  "digital Tree ID Card",
  "QR discovery collection",
  "preference-based visitor walking route",
  "rare species coordinates are protected",
].join(", ");

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
