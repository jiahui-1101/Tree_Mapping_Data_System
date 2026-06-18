import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMap from "../../components/map/GardenMap.jsx";
import { TBJ_MAP_FACTS, getVisitorZone } from "../../data/gardenMap.js";
import { getPublicTreeCard } from "../../data/visitorTreeProfiles.js";
import { ROLE } from "../../models.js";
import { buildVisitorRoute } from "../../services/mockTreeService.js";
import { VISITOR_INTEREST_IDS, visitorText } from "../../services/visitorI18n.js";
import { VisitorLanguageSwitch, VisitorPageShell, VisitorSectionHeader } from "../../components/common/VisitorUI.jsx";

export default function ExplorePage({ trees, language, onLanguage, onTreeClick, onOpenScanner }) {
  const [selected, setSelected] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const t = (path, values) => visitorText(language, path, values);

  const zone = selectedZone ? getVisitorZone(selectedZone.id, language) : null;
  const zoneTrees = zone?.representativeTrees
    .map((id) => trees.find((tree) => tree.id === id))
    .filter(Boolean) || [];

  return (
    <VisitorPageShell className="visitor-explore">
      <Card
        className="visitor-map-card visitor-map-card-primary"
        title={t("explore.mapTitle")}
        subtitle={t("explore.mapZoneHint")}
        actions={<button className="button button-small" onClick={onOpenScanner}>{t("explore.scanQr")}</button>}
      >
        <div className="visitor-map-toolbelt">
          <VisitorLanguageSwitch language={language} onLanguage={onLanguage} label={t("nav.language")} />
          <div className="visitor-garden-facts visitor-garden-facts-compact">
            <span><strong>{TBJ_MAP_FACTS.areaAcres}</strong>{t("explore.acres")}</span>
            <span><strong>6</strong>{t("explore.officialZones")}</span>
            <span><strong>2</strong>{t("explore.lakes")}</span>
          </div>
        </div>
        <GardenMap
          role={ROLE.VISITOR}
          trees={trees}
          route={[]}
          routePath={[]}
          selectedZoneId={selectedZone?.id}
          onTreeClick={onTreeClick}
          onZoneClick={setSelectedZone}
          language={language}
        />
      </Card>

      {zone && (
        <section className="zone-detail-drawer">
          <button className="text-button zone-close" onClick={() => setSelectedZone(null)}>{t("explore.closeZone")}</button>
          <span className="premium-eyebrow">{t("explore.zoneSelected")}</span>
          <h3>{zone.localizedName}</h3>
          <p>{zone.summary}</p>
          <div className="zone-drawer-grid">
            <article>
              <span>{t("explore.representativeTrees")}</span>
              {zoneTrees.map((tree) => {
                const profile = getPublicTreeCard(tree, language);
                return <button key={tree.id} onClick={() => onTreeClick(tree)}>{profile.name}<small>{tree.scientificName}</small></button>;
              })}
            </article>
            <article>
              <span>{t("explore.facilities")}</span>
              <p>{zone.facilities.join(" · ")}</p>
            </article>
          </div>
          <button
            className="button"
            onClick={() => {
              setSelected(zone.routeTags);
              document.querySelector(".route-builder-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {t("explore.startRouteHere")}
          </button>
        </section>
      )}
    </VisitorPageShell>
  );
}