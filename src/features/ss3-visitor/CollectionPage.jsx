import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMascot from "../../components/common/GardenMascot.jsx";
import TreePhoto from "../../components/common/TreePhoto.jsx";
import { VisitorEmptyState, VisitorMetricCard, VisitorPageShell, VisitorPhotoCard, VisitorSectionHeader } from "../../components/common/VisitorUI.jsx";
import { getPublicTreeCard } from "../../data/visitorTreeProfiles.js";
import { visitorText } from "../../services/visitorI18n.js";
import TreeIdCardModal from "./TreeIdCardModal.jsx";

export default function CollectionPage({ trees, collection, onOpenScanner, language }) {
  const [selected, setSelected] = useState(null);
  const collectedTrees = trees.filter((tree) => collection.includes(tree.id));
  const t = (path, values) => visitorText(language, path, values);
  const zonesDiscovered = new Set(collectedTrees.map((tree) => tree.zone)).size;

  return (
    <VisitorPageShell className="collection-passport-page">
      <VisitorSectionHeader
        className="visitor-section-heading collection-passport-heading"
        eyebrow={t("collection.passport")}
        title={t("collection.title")}
        subtitle={t("collection.subtitle")}
      />
      <Card className="passport-card" actions={<button className="button button-small" onClick={onOpenScanner}>{t("collection.scanMore")}</button>}>
        <VisitorEmptyState
          mascot={<GardenMascot />}
          title={t("collection.emptyTitle")}
          subtitle={t("collection.empty")}
          action={<button className="button" onClick={onOpenScanner}>{t("collection.scanMore")}</button>}
        />
      </Card>
    </VisitorPageShell>
  );
}