import { PAGE_META } from "../../config/navigation.js";
import { ROLE } from "../../models.js";
import { visitorText } from "../../services/visitorI18n.js";

export default function Topbar({ page, user, role, language, onOpenMenu }) {
  const [title, subtitle] = role === ROLE.VISITOR ? visitorText(language, `page.${page}`) : PAGE_META[page] || PAGE_META.dashboard;
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <header className="topbar">
      <div className="mobile-topbar">
        <button type="button" className="menu-button" onClick={onOpenMenu} aria-label="Open navigation">
          ☰
        </button>
        <span className="mobile-brand">TBJ</span>
      </div>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <button type="button" className="notification-button" aria-label="Notifications">
          ●
        </button>
        <time dateTime={now.toISOString().slice(0, 10)}>{date}</time>
        <span className="mobile-avatar">{user.initials}</span>
      </div>
    </header>
  );
}
