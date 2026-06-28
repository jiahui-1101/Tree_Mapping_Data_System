import { NAVIGATION } from "../../config/navigation.js";
import { ROLE } from "../../models.js";
import { visitorText } from "../../services/visitorI18n.js";
import Icon from "../common/Icon.jsx";

export default function Sidebar({ role, user, activePage, language, onNavigate, onLogout }) {
  const visitorLabel = (id, fallback) => role === ROLE.VISITOR ? visitorText(language, `nav.${id}`) : fallback;
  return (
    <aside className="sidebar">
      <Brand />
      <div className="sidebar-user">
        <span className="avatar">{user.initials}</span>
        <div>
          <strong>{user.name}</strong>
          <small>{user.title}</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAVIGATION[role].map((section) => (
          <section key={section.label}>
            <p className="nav-label">{role === ROLE.VISITOR ? visitorText(language, "nav.section") : section.label}</p>
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon name={item.icon} />
                <span>{visitorLabel(item.id, item.label)}</span>
              </button>
            ))}
          </section>
        ))}
      </nav>
      <button className="logout-button" onClick={onLogout}>
        ← {role === ROLE.VISITOR ? visitorText(language, "nav.signOut") : "Sign Out"}
      </button>
    </aside>
  );
}

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">♣</span>
      <div>
        <strong>TBJ System</strong>
        <small>Taman Botani Johor</small>
      </div>
    </div>
  );
}

