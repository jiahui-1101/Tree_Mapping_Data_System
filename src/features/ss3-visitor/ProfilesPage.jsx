import { useState } from "react";
import TreePhoto from "../../components/common/TreePhoto.jsx";
import { VisitorPageShell, VisitorPhotoCard, VisitorSectionHeader } from "../../components/common/VisitorUI.jsx";
import { getPublicTreeCard } from "../../data/visitorTreeProfiles.js";
import { visitorText } from "../../services/visitorI18n.js";
import TreeIdCardModal from "./TreeIdCardModal.jsx";

export default function ProfilesPage({ trees, language, onCollect }) {
  const t = (path) => visitorText(language, path);
  return (
    <VisitorPageShell className="profiles-premium">
      <VisitorSectionHeader
        className="visitor-section-heading"
        eyebrow={t("profiles.herbarium")}
        title={t("page.profiles")[0]}
        subtitle={t("profiles.herbariumSubtitle")}
      />
    </VisitorPageShell>
  );
}