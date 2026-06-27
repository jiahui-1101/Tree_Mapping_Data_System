import { useEffect, useState } from "react";
import TreePhoto from "../../components/common/TreePhoto.jsx";
import { VisitorPageShell, VisitorPhotoCard, VisitorSectionHeader } from "../../components/common/VisitorUI.jsx";
import { getPublicTreeCard } from "../../data/visitorTreeProfiles.js";
import { fetchVisitorProfiles } from "../../services/visitorApiService.js";
import { visitorText } from "../../services/visitorI18n.js";
import TreeIdCardModal from "./TreeIdCardModal.jsx";

export default function ProfilesPage({ trees, language, onCollect }) {
  const [selected, setSelected] = useState(null);
  const [profiles, setProfiles] = useState(() => trees.map((tree) => getPublicTreeCard(tree, language)));
  const t = (path) => visitorText(language, path);
  useEffect(() => {
    let active = true;
    fetchVisitorProfiles({ language, trees }).then((result) => {
      if (active) setProfiles(result.profiles);
    });
    return () => { active = false; };
  }, [language, trees]);
  return (
    <VisitorPageShell className="profiles-premium">
      <VisitorSectionHeader
