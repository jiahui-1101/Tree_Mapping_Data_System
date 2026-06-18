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
  const [selectedZone, setSelectedZone] = useState(null);
  const t = (path, values) => visitorText(language, path, values);

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
    </VisitorPageShell>
  );
}