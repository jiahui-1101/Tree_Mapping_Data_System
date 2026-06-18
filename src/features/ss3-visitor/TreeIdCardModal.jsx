import { useState } from "react";
import TreePhoto from "../../components/common/TreePhoto.jsx";
import Modal from "../../components/common/Modal.jsx";
import { getPublicTreeCard, projectGrowth } from "../../data/visitorTreeProfiles.js";
import { visitorText } from "../../services/visitorI18n.js";

const GROWTH_YEARS = [5, 10, 25, 50];

function GrowthVisual({ profile, projection, confidence, t }) {
  return (
    <div className="growth-photo-model" aria-label={`${t("profiles.aiSimulator")} ${projection.years}${t("profiles.yearSuffix")}`}>
      <TreePhoto src={profile.photoUrl} alt={profile.photoAlt} className="growth-photo">
        <span className="growth-current-year">+{projection.years}{t("profiles.yearSuffix")} {t("profiles.ecologyForecast")}</span>
      </TreePhoto>
      <div className="growth-model-legend">
        <span>{t("profiles.representativePhoto")}: <b>{profile.name}</b></span>
        <span>{t("profiles.modelConfidence")}: <b>{confidence}%</b></span>
      </div>
    </div>
  );
}

export default function TreeIdCardModal({ tree, language, onClose, onCollect }) {
  const [mode, setMode] = useState("explorer");
  const t = (path, values) => visitorText(language, path, values);
  const profile = getPublicTreeCard(tree, language);
  
  return (
    <Modal title={t("profiles.treeIdCard", { name: profile.name })} onClose={onClose} wide>
      <div className="tree-id-premium">
        <section className="tree-id-hero tree-id-photo-hero">
          <TreePhoto
            src={profile.photoUrl}
            alt={profile.photoAlt}
            className="tree-id-photo"
            caption={`${t("profiles.representativePhoto")} · ${profile.photoCredit}`}
            overlay={(
              <div className="tree-id-photo-title">
                <span>{profile.zone}</span>
                <strong>{profile.name}</strong>
                <em>{profile.scientificName}</em>
              </div>
            )}
          />
          <div className="tree-id-hero-copy">
            <div className="tree-id-code-row">
              <span className="premium-eyebrow">{t("profiles.publicProfile")}</span>
              <b>{profile.id}</b>
            </div>
            <h2>{profile.name}</h2>
            <em>{profile.scientificName}</em>
            <p>{profile.description}</p>
            <div className="profile-badge-row">
              {profile.badges.map((badge) => <span key={badge}>{badge}</span>)}
            </div>
          </div>
        </section>

        <div className="tree-id-meta-grid">
          <article><span>{t("profiles.localName")}</span><strong>{profile.localName}</strong></article>
          <article><span>{t("profiles.zone")}</span><strong>{profile.zone}</strong></article>
          <article><span>{t("profiles.height")}</span><strong>{profile.height} m</strong></article>
          <article><span>{t("profiles.age")}</span><strong>{profile.age} {t("profiles.years")}</strong></article>
        </div>

        <div className="segmented segmented-premium">
          <button className={mode === "explorer" ? "active" : ""} onClick={() => setMode("explorer")}>{t("profiles.explorer")}</button>
          <button className={mode === "expert" ? "active" : ""} onClick={() => setMode("expert")}>{t("profiles.expert")}</button>
        </div>

        {mode === "explorer" ? (
          <div className="profile-story-grid">
            <article>
              <span>{t("profiles.whereToSee")}</span>
              <p>{profile.zoneContext}</p>
            </article>
            <article>
              <span>{t("profiles.lookFor")}</span>
              <p>{profile.seasonalInterest}</p>
            </article>
            <article>
              <span>{t("profiles.gardenStory")}</span>
              <p>{profile.culturalUse}</p>
            </article>
            <article>
              <span>{t("profiles.funFact")}</span>
              <p>{profile.visitorFact}</p>
            </article>
          </div>
        ) : (
          <div className="expert-data premium-expert">
            <p><strong>{t("profiles.taxonomy")}:</strong> Plantae · Angiosperms · {profile.family}</p>
            <p><strong>{t("profiles.origin")}:</strong> {profile.origin}</p>
            <p><strong>{t("profiles.morphology")}:</strong> {profile.morphology}</p>
            <p><strong>{t("profiles.ecologyRole")}:</strong> {profile.ecologyRole}</p>
            <p><strong>{t("profiles.conservation")}:</strong> {profile.conservationNote}</p>
          </div>
        )}

        <button className="button button-block" onClick={() => onCollect?.(tree)}>{t("profiles.collect")}</button>
        <p className="public-data-note">{t("profiles.demoNotice")}</p>
      </div>
    </Modal>
  );
}