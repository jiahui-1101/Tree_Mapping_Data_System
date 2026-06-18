import { useState } from "react";
import TreePhoto from "../../components/common/TreePhoto.jsx";
import Modal from "../../components/common/Modal.jsx";
import { getPublicTreeCard, projectGrowth } from "../../data/visitorTreeProfiles.js";
import { visitorText } from "../../services/visitorI18n.js";

const GROWTH_YEARS = [5, 10, 25, 50];

export default function TreeIdCardModal({ tree, language, onClose, onCollect }) {
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
        <button className="button button-block" onClick={() => onCollect?.(tree)}>{t("profiles.collect")}</button>
        <p className="public-data-note">{t("profiles.demoNotice")}</p>
      </div>
    </Modal>
  );
}