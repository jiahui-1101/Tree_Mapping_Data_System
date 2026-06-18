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
  const [routePlan, setRoutePlan] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(60);
  const t = (path, values) => visitorText(language, path, values);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const generate = () => {
    const result = buildVisitorRoute(selected, trees);
    if (!result.ok) return setError(t("explore.validation"));
    setRoutePlan({ ...result, estimatedDuration: duration }); setError("");
  };
  const route = routePlan?.route || [];
  const zone = selectedZone ? getVisitorZone(selectedZone.id, language) : null;
  const zoneTrees = zone?.representativeTrees
    .map((id) => trees.find((tree) => tree.id === id))
    .filter(Boolean) || [];

  return (
    <VisitorPageShell className="visitor-explore">
      <Card
        className="visitor-map-card visitor-map-card-primary"
        title={t("explore.mapTitle")}
        subtitle={route.length ? t("explore.mapReady", { count: route.length, duration }) : t("explore.mapZoneHint")}
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
          route={route}
          routePath={routePlan?.waypoints || []}
          selectedZoneId={selectedZone?.id}
          onTreeClick={onTreeClick}
          onZoneClick={setSelectedZone}
          language={language}
        />
        {route.length > 0 && (
          <div className="route-map-overlay-card">
            <span>{t("explore.routeReady")}</span>
            <strong>{route.length} {t("explore.stops")} · {routePlan.totalDistance} · {duration} {t("explore.minutes")}</strong>
            <button className="text-button" onClick={() => setRoutePlan(null)}>{t("explore.clearRoute")}</button>
          </div>
        )}
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

      <section className="route-builder-card">
        <VisitorSectionHeader
          className="route-builder-copy"
          eyebrow={t("explore.routeBuilder")}
          title={t("explore.planTitle")}
          subtitle={t("explore.planSubtitle")}
        />
        <div className="interest-grid premium-interest-grid">{VISITOR_INTEREST_IDS.map((id) => <button key={id} className={selected.includes(id) ? "selected" : ""} onClick={() => toggle(id)}><strong>{t(`interests.${id}`)[0]}</strong><small>{t(`interests.${id}`)[1]}</small></button>)}</div>
        <div className="duration-row premium-duration-row"><strong>{t("explore.duration")}</strong>{[45, 60, 90, 120].map((value) => <button className={duration === value ? "active" : ""} key={value} onClick={() => setDuration(value)}>{value} {t("explore.minutes")}</button>)}</div>
        {error && <p className="form-error visitor-error">{error}</p>}
        <div className="button-row">
          <button className="button" onClick={generate}>{t("explore.generate")} →</button>
          <button className="button button-outline" onClick={() => { setRoutePlan(null); setError(""); }}>{t("explore.exploreFreely")}</button>
        </div>
      </section>

      {route.length > 0 && <Card className="route-card-premium" title={t("explore.routeTitle")} subtitle={t("explore.routeSubtitle")}>
        <div className="route-list">{route.map((tree, index) => {
          const profile = getPublicTreeCard(tree, language);
          return <button className="route-step" key={tree.id} onClick={() => onTreeClick(tree)}><b>{index + 1}</b><span><strong>{profile.name}</strong><small>{tree.id} · {tree.zone} · {Math.round(duration / route.length)} {t("explore.minutes")}</small></span></button>;
        })}</div>
      </Card>}
    </VisitorPageShell>
  );
}
