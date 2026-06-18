export function VisitorPageShell({ eyebrow, title, subtitle, actions, children, className = "" }) {
  return (
    <div className={`visitor-page-shell ${className}`}>
      {(eyebrow || title || subtitle || actions) && (
        <header className="visitor-page-header">
          <div>
            {eyebrow && <span className="visitor-eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="visitor-page-actions">{actions}</div>}
        </header>
      )}
      {children}
    </div>
  );
}

export function VisitorHeroCard({ eyebrow, title, subtitle, actions, mascot, children, className = "" }) {
  return (
    <section className={`visitor-hero-card ${className}`}>
      <div className="visitor-hero-copy">
        {eyebrow && <span className="visitor-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        {actions && <div className="visitor-hero-actions">{actions}</div>}
      </div>
      {mascot && <div className="visitor-hero-visual">{mascot}</div>}
      {children}
    </section>
  );
}

export function VisitorSectionHeader({ eyebrow, title, subtitle, actions, className = "" }) {
  return (
    <section className={`visitor-section-header ${className}`}>
      <div>
        {eyebrow && <span className="visitor-eyebrow">{eyebrow}</span>}
        {title && <h3>{title}</h3>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="visitor-section-actions">{actions}</div>}
    </section>
  );
}

export function VisitorActionCard({ icon, title, subtitle, children, className = "", ...props }) {
  const Component = props.onClick ? "button" : "article";
  return (
    <Component className={`visitor-action-card ${className}`} {...props}>
      {icon && <span className="visitor-action-icon">{icon}</span>}
      <strong>{title}</strong>
      {subtitle && <small>{subtitle}</small>}
      {children}
    </Component>
  );
}

export function VisitorMetricCard({ value, label, detail }) {
  return (
    <article className="visitor-metric-card">
      <strong>{value}</strong>
      <b>{label}</b>
      {detail && <small>{detail}</small>}
    </article>
  );
}

export function VisitorEmptyState({ mascot, title, subtitle, action }) {
  return (
    <div className="visitor-empty-state">
      {mascot}
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {action}
    </div>
  );
}

export function VisitorPhotoCard({ photo, eyebrow, title, subtitle, meta, badges, onClick, className = "" }) {
  return (
    <button className={`visitor-photo-card ${className}`} onClick={onClick}>
      {photo}
      <div className="visitor-photo-card-copy">
        {eyebrow && <small>{eyebrow}</small>}
        <h3>{title}</h3>
        {subtitle && <em>{subtitle}</em>}
        {meta && <p>{meta}</p>}
        {badges?.length > 0 && <div className="visitor-chip-row">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div>}
      </div>
    </button>
  );
}

export function VisitorLanguageSwitch({ language, onLanguage, label = "Language" }) {
  return (
    <div className="visitor-language-switch" aria-label={label}>
      {[["bm", "BM"], ["en", "EN"], ["zh", "中文"]].map(([id, label]) => (
        <button key={id} className={language === id ? "active" : ""} onClick={() => onLanguage(id)} type="button">
          {label}
        </button>
      ))}
    </div>
  );
}
