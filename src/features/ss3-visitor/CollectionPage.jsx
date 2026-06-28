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
      <div className="metric-grid collection-metrics">
        <VisitorMetricCard value={collection.length} label={t("collection.badges")} detail={t("collection.saved")} />
        <VisitorMetricCard value={zonesDiscovered} label={t("collection.zones")} detail={t("collection.keepExploring")} />
        <VisitorMetricCard value={Math.max(1, collection.length)} label={t("collection.streak")} detail={t("collection.saved")} />
        <VisitorMetricCard value={t(collectedTrees.some((tree) => tree.rare) ? "collection.rare" : "collection.common")} label={t("collection.rarest")} detail={t("collection.safeNote")} />
      </div>
      <Card className="passport-card" actions={<button className="button button-small" onClick={onOpenScanner}>{t("collection.scanMore")}</button>}>
        {collectedTrees.length === 0 ? (
          <VisitorEmptyState
            mascot={<GardenMascot />}
            title={t("collection.emptyTitle")}
            subtitle={t("collection.empty")}
            action={<button className="button" onClick={onOpenScanner}>{t("collection.scanMore")}</button>}
          />
        ) : (
          <div className="passport-grid">{collectedTrees.map((tree) => {
            const profile = getPublicTreeCard(tree, language);
            return (
              <VisitorPhotoCard
                key={tree.id}
                className="passport-stamp"
                onClick={() => setSelected(tree)}
                photo={<><span className="passport-icon">✓</span><TreePhoto src={profile.photoUrl} alt={profile.photoAlt} className="passport-stamp-photo" /></>}
                eyebrow={`${tree.id} · ${tree.zone}`}
                title={profile.name}
                subtitle={tree.scientificName}
                meta={profile.badges.slice(0, 2).join(" · ")}
                badges={[t("collection.openCard")]}
              />
            );
          })}</div>
        )}
      </Card>
      {selected && <TreeIdCardModal tree={selected} language={language} onClose={() => setSelected(null)} onCollect={() => setSelected(null)} />}
    </VisitorPageShell>
  );
}

