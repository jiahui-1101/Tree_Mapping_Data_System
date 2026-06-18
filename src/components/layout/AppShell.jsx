import { useState } from "react";
import Sidebar, { Brand } from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import MobileNav from "./MobileNav.jsx";

export default function AppShell({ role, user, activePage, language, onNavigate, onLogout, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = (page) => {
    onNavigate(page);
    setDrawerOpen(false);
  };

  return (
    <div className="app-shell">
      <Sidebar role={role} user={user} activePage={activePage} language={language} onNavigate={navigate} onLogout={onLogout} />
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(event) => event.stopPropagation()}>
            <Brand />
            <Sidebar role={role} user={user} activePage={activePage} language={language} onNavigate={navigate} onLogout={onLogout} />
          </div>
        </div>
      )}
      <main className="main-content">
        <Topbar page={activePage} user={user} role={role} language={language} onOpenMenu={() => setDrawerOpen(true)} />
        {children}
      </main>
      <MobileNav role={role} activePage={activePage} language={language} onNavigate={navigate} />
    </div>
  );
}
