import { useState } from "react";
import { DEFAULT_IT_PAGE, IT_NAVIGATION } from "../../config/itNavigation.js";
import ITDashboardPage from "./ITDashboardPage.jsx";
import SystemMonitoringPage from "./SystemMonitoringPage.jsx";
import IncidentTicketsPage from "./IncidentTicketsPage.jsx";

export default function ITSupportShell({ showToast }) {
  const [activePage, setActivePage] = useState(DEFAULT_IT_PAGE);

  return (
    <main className="it-support-shell">
      <header className="it-support-header">
        <div>
          <span className="eyebrow">IT Support Operations</span>
          <h1>System Administration</h1>
        </div>
        <nav className="it-support-tabs" aria-label="IT support pages">
          {IT_NAVIGATION.map((item) => (
            <button
              key={item.id}
              className={activePage === item.id ? "active" : ""}
              onClick={() => setActivePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="it-support-content">
        {activePage === "it-dashboard" && (
          <ITDashboardPage onNavigate={setActivePage} showToast={showToast} />
        )}
        {activePage === "system-monitoring" && <SystemMonitoringPage showToast={showToast} />}
        {activePage === "incident-tickets" && <IncidentTicketsPage showToast={showToast} />}
      </section>
    </main>
  );
}
