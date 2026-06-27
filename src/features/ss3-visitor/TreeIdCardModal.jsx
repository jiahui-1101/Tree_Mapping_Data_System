import { useEffect, useState } from "react";
import TreePhoto from "../../components/common/TreePhoto.jsx";
import Modal from "../../components/common/Modal.jsx";
import { getPublicTreeCard, projectGrowth } from "../../data/visitorTreeProfiles.js";
import { fetchVisitorTreeCard } from "../../services/visitorApiService.js";
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
  const [growth, setGrowth] = useState(10);
  const [backendCard, setBackendCard] = useState(null);
  const t = (path, values) => visitorText(language, path, values);
  const localProfile = getPublicTreeCard(tree, language);
  const profile = backendCard?.tree || localProfile;
  const projection = backendCard?.growthSimulation || projectGrowth(profile, growth);
  const confidence = Math.max(80, Math.round(96 - projection.years * 0.28));
  useEffect(() => {
    let active = true;
    fetchVisitorTreeCard({ tree, language, growthYears: growth }).then((card) => {
      if (active) setBackendCard(card);
    });
    return () => { active = false; };
  }, [tree, language, growth]);
  return (
    <Modal title={t("profiles.treeIdCard", { name: profile.name })} onClose={onClose} wide>
      <div className="tree-id-premium">
        <section className="tree-id-hero tree-id-photo-hero">
          <TreePhoto
