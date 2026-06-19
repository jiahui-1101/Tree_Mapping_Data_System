import { useState } from "react";
import TreePhoto from "../../components/common/TreePhoto.jsx";
import { VisitorPageShell, VisitorPhotoCard, VisitorSectionHeader } from "../../components/common/VisitorUI.jsx";
import { getPublicTreeCard } from "../../data/visitorTreeProfiles.js";
import { visitorText } from "../../services/visitorI18n.js";
import TreeIdCardModal from "./TreeIdCardModal.jsx";

export default function ProfilesPage({ trees, language, onCollect }) {
  const [selected, setSelected] = useState(null);
  const t = (path) => visitorText(language, path);
  return (
    <VisitorPageShell className="profiles-premium">
      <VisitorSectionHeader
        className="visitor-section-heading"
        eyebrow={t("profiles.herbarium")}
        title={t("page.profiles")[0]}
        subtitle={t("profiles.herbariumSubtitle")}
      />
      <div className="profile-grid premium-profile-grid">{trees.map((tree) => {
        const profile = getPublicTreeCard(tree, language);
        return (
          <VisitorPhotoCard
            key={tree.id}
            onClick={() => setSelected(tree)}
            photo={<TreePhoto src={profile.photoUrl} alt={profile.photoAlt} className="profile-card-photo" />}
            eyebrow={profile.zone}
            title={profile.name}
            subtitle={tree.scientificName}
            meta={profile.description}
            badges={profile.badges.slice(0, 2)}
          />
        );
      })}</div>
      {selected && <TreeIdCardModal tree={selected} language={language} onClose={() => setSelected(null)} onCollect={(tree) => { onCollect(tree); setSelected(null); }} />}
    </VisitorPageShell>
  );
}

