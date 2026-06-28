import { useEffect, useState } from "react";
import GardenMascot from "../../components/common/GardenMascot.jsx";
import { VisitorHeroCard, VisitorPageShell } from "../../components/common/VisitorUI.jsx";
import { askVisitorChatBackend } from "../../services/visitorApiService.js";
import { visitorText } from "../../services/visitorI18n.js";

function mockBotReply(language, question) {
  const text = question.toLowerCase();
  const replies = {
    route: {
      en: "For a 60 minute visit, start at the Arboretum, continue to the lakeside Riparian zone, then finish at the Nursery flowering zone. I can keep it visitor-safe and avoid exact protected-species locations.",
      bm: "Untuk lawatan 60 minit, mula di Arboretum, terus ke zon Riparian tepi tasik, kemudian tamat di zon Semaian berbunga. Laluan ini kekal selamat untuk pelawat dan tidak mendedahkan lokasi spesies dilindungi.",
      zh: "如果参观 60 分钟，建议从植物标本园开始，走到水岸湖区，再到苗圃花卉区结束。路线会保持访客安全，不公开受保护物种精确位置。",
    },
    rare: {
      en: "Rare species are shown at zone level only. This protects sensitive plants while still letting visitors learn the conservation story.",
      bm: "Spesies nadir hanya dipaparkan pada tahap zon. Ini melindungi tumbuhan sensitif sambil membolehkan pelawat mempelajari cerita pemuliharaan.",
      zh: "珍稀物种只显示到区域层级。这样既保护敏感植物，也能让游客了解保育故事。",
    },
    identify: {
      en: "Try observing leaf shape, flower scent, fruit position, bark texture, and the zone you are standing in. A QR scan gives the most reliable Tree ID Card.",
      bm: "Perhatikan bentuk daun, bau bunga, kedudukan buah, tekstur kulit dan zon anda berada. Imbasan QR memberi Kad ID Pokok yang paling tepat.",
      zh: "可以观察叶形、花香、果实位置、树皮纹理和所在区域。扫描 QR 会打开最可靠的树木身份卡。",
    },
    facilities: {
      en: "Main facilities are near the arrival area, garden cafe, herbarium, lakeside boardwalk, jetty, and nursery learning plots.",
      bm: "Kemudahan utama berada berhampiran kawasan ketibaan, kafe taman, herbarium, laluan papan tepi tasik, jeti dan plot pembelajaran semaian.",
      zh: "主要设施包括入口区、园区咖啡厅、标本馆、湖边木栈道、码头和苗圃学习区。",
    },
  };
  if (text.includes("route") || text.includes("laluan") || text.includes("路线")) return replies.route[language] || replies.route.en;
  if (text.includes("rare") || text.includes("nadir") || text.includes("珍稀") || text.includes("hide")) return replies.rare[language] || replies.rare.en;
  if (text.includes("identify") || text.includes("kenal") || text.includes("识别")) return replies.identify[language] || replies.identify.en;
  if (text.includes("lake") || text.includes("facility") || text.includes("tasik") || text.includes("设施") || text.includes("湖")) return replies.facilities[language] || replies.facilities.en;
  return visitorText(language, "chat.meranti");
}

export default function ChatPage({ language }) {
  const t = (path) => visitorText(language, path);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: t("chat.hello") }]);
  useEffect(() => setMessages([{ from: "bot", text: t("chat.hello") }]), [language]);
  const send = async (value = input) => {
    if (!value.trim()) return;
    const question = value.trim();
    setMessages((current) => [...current, { from: "user", text: question }]);
    setInput("");
    setIsSending(true);
    const backendReply = await askVisitorChatBackend({ question, language });
    const reply = backendReply?.answer || mockBotReply(language, question);
    const source = backendReply?.provider ? ` · ${backendReply.provider}${backendReply.fallback ? " fallback" : ""}` : "";
    setMessages((current) => [...current, { from: "bot", text: reply, meta: source }]);
    setIsSending(false);
  };
  return (
    <VisitorPageShell className="chat-premium">
      <VisitorHeroCard
        className="chat-mascot-panel garden-guide-hero"
        mascot={<GardenMascot />}
        eyebrow={t("chat.eyebrow")}
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
      />
      <section className="chat-card-premium chat-window-premium">
        <header className="assistant-header">
          <div><strong>{t("chat.assistantName")}</strong><small><span />{t("chat.status")}</small></div>
          <GardenMascot compact />
        </header>
        <div className="chat-window">{messages.map((message, index) => <p className={`chat-bubble chat-${message.from}`} key={index}>{message.text}{message.meta && <small>{message.meta}</small>}</p>)}{isSending && <p className="chat-bubble chat-bot">...</p>}</div>
        <div className="suggestion-row">{t("chat.suggestions").map((question) => <button key={question} onClick={() => send(question)}>{question}</button>)}</div>
        <div className="input-row chat-input-row"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder={t("chat.placeholder")} /><button className="button" disabled={isSending} onClick={() => send()}>{t("chat.send")}</button></div>
      </section>
    </VisitorPageShell>
  );
}

export function ChatFloatingButton({ onClick, language = "en" }) {
  const label = visitorText(language, "chat.floatingLabel");
  return <button className="chat-floating chat-floating-garden" onClick={onClick} aria-label={label}><GardenMascot compact /><span>{label}</span></button>;
}

