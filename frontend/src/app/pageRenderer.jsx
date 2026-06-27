import QRPage from "../components/qr/QRPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import DashboardPage from "../features/ss1-health/DashboardPage.jsx";
import InventoryPage from "../features/ss1-health/InventoryPage.jsx";
import MaintenancePage from "../features/ss1-health/MaintenancePage.jsx";
import RangerManagementPage from "../features/ss2-field/RangerManagementPage.jsx";
import RangerTasksPage from "../features/ss2-field/RangerTasksPage.jsx";
import SchedulePage from "../features/ss2-field/SchedulePage.jsx";
import TaskTrackerPage from "../features/ss2-field/TaskTrackerPage.jsx";
import CollectionPage from "../features/ss3-visitor/CollectionPage.jsx";
import ExplorePage from "../features/ss3-visitor/ExplorePage.jsx";
import ProfilesPage from "../features/ss3-visitor/ProfilesPage.jsx";
import ITDashboardPage from "../features/it-support/ITDashboardPage.jsx";
import IncidentTicketsPage from "../features/it-support/IncidentTicketsPage.jsx";
import SystemMonitoringPage from "../features/it-support/SystemMonitoringPage.jsx";
import UserAccessPage from "../features/it-support/UserAccessPage.jsx";
import RangerReportsPage from "../features/ss2-field/RangerReportsPage.jsx";
import AuditPage from "../features/ss4-map/AuditPage.jsx";
import MapPage from "../features/ss4-map/MapPage.jsx";
import SpatialPage from "../features/ss4-map/SpatialPage.jsx";

export { LoginPage };

export function renderAppPage({ activePage, pageProps, handlers }) {
  switch (activePage) {
    case "dashboard":
      return <DashboardPage {...pageProps} onNavigate={handlers.navigate} />;
    case "inventory":
      return <InventoryPage {...pageProps} onAddTree={handlers.addTree} onArchiveTree={handlers.archiveTree} onUpdateTree={handlers.updateTree} />;
    case "maintenance":
      return <MaintenancePage {...pageProps} onAddTask={handlers.addTask} />;
    case "schedule":
      return <SchedulePage {...pageProps} onAddTask={handlers.addTask} />;
    case "rangers":
      return <RangerManagementPage {...pageProps} />;
    case "tasks":
      return <TaskTrackerPage {...pageProps} onUpdateTask={handlers.updateTask} />;
    case "ranger-tasks":
      return <RangerTasksPage {...pageProps} onUpdateTask={handlers.updateTask} onOpenScanner={handlers.openScanner} />;
    case "ranger-reports":
      return <RangerReportsPage {...pageProps} />;
    case "qr":
      return <QRPage role={pageProps.user.role} language={pageProps.language} onOpenScanner={handlers.openScanner} />;
    case "map":
      return <MapPage {...pageProps} onOpenScanner={handlers.openScanner} />;
    case "spatial":
      return <SpatialPage {...pageProps} onConfirmSpatialPlan={handlers.confirmSpatialPlan} />;
    case "audit":
      return <AuditPage {...pageProps} />;
    case "explore":
      return <ExplorePage {...pageProps} onLanguage={handlers.changeLanguage} onTreeClick={handlers.setScannedTree} onOpenScanner={handlers.openScanner} />;
    case "profiles":
      return <ProfilesPage {...pageProps} onCollect={handlers.collect} />;
    case "chat":
      return handlers.renderChatPage();
    case "collection":
      return <CollectionPage {...pageProps} collection={handlers.collection} onOpenScanner={handlers.openScanner} />;
    case "it-dashboard":
      return <ITDashboardPage {...pageProps} onNavigate={handlers.navigate} />;
    case "it-monitoring":
      return <SystemMonitoringPage {...pageProps} />;
    case "it-users":
      return <UserAccessPage {...pageProps} />;
    case "it-tickets":
      return <IncidentTicketsPage {...pageProps} />;
    default:
      return <DashboardPage {...pageProps} onNavigate={handlers.navigate} />;
  }
}
