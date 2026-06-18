import { useEffect, useState } from "react";
import GardenMascot from "../../components/common/GardenMascot.jsx";
import { VisitorHeroCard, VisitorPageShell } from "../../components/common/VisitorUI.jsx";
import { visitorText } from "../../services/visitorI18n.js";

export default function ChatPage({ language }) {
  const t = (path) => visitorText(language, path);

  return (
    <VisitorPageShell className="chat-premium">
      <VisitorHeroCard
        className="chat-mascot-panel garden-guide-hero"
        mascot={<GardenMascot />}
        eyebrow={t("chat.eyebrow")}
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
      />
    </VisitorPageShell>
  );
}

export function ChatFloatingButton({ onClick, language = "en" }) {
  const label = visitorText(language, "chat.floatingLabel");
  return <button className="chat-floating chat-floating-garden" onClick={onClick} aria-label={label}><GardenMascot compact /><span>{label}</span></button>;
}