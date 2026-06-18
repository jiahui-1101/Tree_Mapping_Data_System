import Sidebar from "./Sidebar.jsx";

export default function AppShell({ role, user, activePage, language, onNavigate, onLogout, children }) {
  return (
    <div className="app-shell">
      <Sidebar role={role} user={user} activePage={activePage} language={language} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}