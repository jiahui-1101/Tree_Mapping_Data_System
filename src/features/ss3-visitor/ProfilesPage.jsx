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
        className="visitor-section-heading"
        eyebrow={t("profiles.herbarium")}
        title={t("page.profiles")[0]}
        subtitle={t("profiles.herbariumSubtitle")}
      />
      <div className="profile-grid premium-profile-grid">{profiles.map((profile) => {
        const tree = trees.find((item) => item.id === profile.id) || profile;
        return (
          <VisitorPhotoCard
            key={profile.id}
            onClick={() => setSelected(tree)}
            photo={<TreePhoto src={profile.photoUrl} alt={profile.photoAlt} className="profile-card-photo" />}
            eyebrow={profile.zone}
            title={profile.name}
            subtitle={profile.scientificName}
            meta={profile.description}
            badges={profile.badges.slice(0, 2)}
          />
        );
      })}</div>
      {selected && <TreeIdCardModal tree={selected} language={language} onClose={() => setSelected(null)} onCollect={(tree) => { onCollect(tree); setSelected(null); }} />}
    </VisitorPageShell>
  );
}

