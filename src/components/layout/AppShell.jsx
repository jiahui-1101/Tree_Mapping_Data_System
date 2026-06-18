import { useState } from "react";
import Sidebar, { Brand } from "./Sidebar.jsx";

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
        {children}
      </main>
    </div>
  );
}