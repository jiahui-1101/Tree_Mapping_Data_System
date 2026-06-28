import Card from "../common/Card.jsx";
import GardenMascot from "../common/GardenMascot.jsx";
import { VisitorActionCard, VisitorHeroCard, VisitorPageShell } from "../common/VisitorUI.jsx";
import { ROLE } from "../../models.js";
import { visitorText } from "../../services/visitorI18n.js";

export default function QRPage({ role, language, onOpenScanner }) {
  const isRanger = role === ROLE.RANGER;
  const t = (path) => visitorText(language, path);
  if (!isRanger) {
    return (
      <VisitorPageShell className="qr-page qr-page-premium">
        <VisitorHeroCard
          className="qr-page-hero qr-hero-premium"
          eyebrow={t("qr.heroEyebrow")}
          title={t("qr.pageTitle")}
          subtitle={t("qr.pageDescription")}
          mascot={<GardenMascot />}
          actions={(
            <button className="button qr-camera-cta" onClick={onOpenScanner}>
              <span>▣</span>
              {t("qr.openScanner")}
            </button>
          )}
        />
        <Card className="qr-flow-premium visitor-card" title={t("qr.flowTitle")} subtitle={t("qr.flowSubtitle")}>
          <div className="flow-grid">
            <VisitorActionCard icon="1" title={t("qr.scan")} subtitle={t("qr.scanHelp")} />
            <VisitorActionCard icon="2" title={t("qr.unlock")} subtitle={t("qr.unlockHelp")} />
            <VisitorActionCard icon="3" title={t("qr.simulate")} subtitle={t("qr.simulateHelp")} />
          </div>
        </Card>
      </VisitorPageShell>
    );
  }
  return (
    <div className="qr-page">
      <section className="qr-page-hero">
        <span className="qr-page-icon">▦</span>
        <div>
          <h2>{isRanger ? "Field QR Tree Scanner" : t("qr.pageTitle")}</h2>
          <p>{isRanger ? "Scan a physical tree tag, choose manual assessment or AI photo diagnosis, and sync the report to Admin." : t("qr.pageDescription")}</p>
        </div>
        <button className="button" onClick={onOpenScanner}>{isRanger ? "Open QR Scanner" : t("qr.openScanner")}</button>
      </section>
      <Card title={isRanger ? "Role-Based QR Flow" : t("qr.flowTitle")} subtitle={isRanger ? "UI mock for M4-B QR Interaction & Role-Based Access" : t("qr.flowSubtitle")}>
        <div className="flow-grid">
          <span><b>1</b><strong>{isRanger ? "Scan" : t("qr.scan")}</strong><small>{isRanger ? "Resolve unique tree QR identifier" : t("qr.scanHelp")}</small></span>
          <span><b>2</b><strong>{isRanger ? "Detect Role" : t("qr.unlock")}</strong><small>{isRanger ? "Use visitor-safe or authenticated ranger flow" : t("qr.unlockHelp")}</small></span>
          <span><b>3</b><strong>{isRanger ? "Submit Report" : t("qr.simulate")}</strong><small>{isRanger ? "Record a role-appropriate result" : t("qr.simulateHelp")}</small></span>
        </div>
      </Card>
    </div>
  );
}
