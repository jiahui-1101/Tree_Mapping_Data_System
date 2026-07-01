import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicTreeCard } from "../../data/visitorTreeProfiles.js";
import { ROLE } from "../../models.js";
import { findTree, maskTreeForRole } from "../../services/mockTreeService.js";
import { visitorText } from "../../services/visitorI18n.js";
import Modal from "../common/Modal.jsx";
import StatusPill from "../common/StatusPill.jsx";
import TreePhoto from "../common/TreePhoto.jsx";

export default function QRScanner({ role, trees, qrCodes = [], language, onClose, onComplete, onAnalyzePhoto, onScanEvent }) {
  const [treeId, setTreeId] = useState("TBJ-004");
  const [tree, setTree] = useState(null);
  const [error, setError] = useState("");
  const [cameraState, setCameraState] = useState("idle");
  const [detectorAvailable, setDetectorAvailable] = useState(true);
  const [photo, setPhoto] = useState("");
  const [reportMode, setReportMode] = useState("manual");
  const [observedStatus, setObservedStatus] = useState("monitor");
  const [manualCause, setManualCause] = useState("");
  const [manualTreatment, setManualTreatment] = useState("");
  const [heightMeasurement, setHeightMeasurement] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [selectedAiPossibilityId, setSelectedAiPossibilityId] = useState("");
  const [aiState, setAiState] = useState("idle");
  const [notes, setNotes] = useState("");
  const [submittedReport, setSubmittedReport] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recentScanRef = useRef({ key: "", time: 0 });
  const isVisitor = role === ROLE.VISITOR;
  const t = useCallback((path) => visitorText(language, path), [language]);
  const visibleTree = maskTreeForRole(tree, role);
  const publicProfile = visibleTree && isVisitor ? getPublicTreeCard(visibleTree, language) : null;
  const aiPossibilities = aiResult?.possibilities || [];
  const selectedAiPossibility = aiPossibilities.find((item) => item.id === selectedAiPossibilityId) || aiPossibilities[0] || null;

  const scan = useCallback((rawId = treeId) => {
    const rawText = String(rawId).trim();
    const normalized = rawText.toLowerCase();
    const qrCode = qrCodes.find((qr) => (
      qr.qrId.toLowerCase() === normalized ||
      qr.qrEndpoint.toLowerCase() === normalized ||
      qr.treeId.toLowerCase() === normalized
    ));
    const parsedId = qrCode?.treeId || String(rawId).toUpperCase().match(/TBJ-\d{3}/)?.[0] || rawText;
    const found = findTree(parsedId, trees);
    const recordOnce = (scanResult, resolvedTree = found) => {
      const key = `${rawText}-${scanResult}`;
      const now = Date.now();
      if (recentScanRef.current.key === key && now - recentScanRef.current.time < 1500) return;
      recentScanRef.current = { key, time: now };
      onScanEvent?.({ rawId: rawText, qrCode, tree: resolvedTree, scanResult });
    };
    setTreeId(qrCode?.qrId || parsedId);
    if (qrCode?.qrStatus === "invalidated") {
      setError(isVisitor ? t("qr.invalid") : "This QR code was invalidated after the tree was archived.");
      setTree(null);
      recordOnce("archived_qr", null);
      return;
    }
    if (!found) {
      setError(isVisitor ? t("qr.invalid") : "This QR code is invalid or no longer active.");
      setTree(null);
      recordOnce("invalid_qr", null);
      return;
    }
    setTree(found);
    setError("");
    recordOnce("success", found);
  }, [isVisitor, onScanEvent, qrCodes, t, treeId, trees]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      return;
    }
    stopCamera();
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setDetectorAvailable("BarcodeDetector" in window);
      setCameraState("active");
    } catch {
      setCameraState("denied");
    }
  };

  useEffect(() => stopCamera, [stopCamera]);
  useEffect(() => {
    if (cameraState !== "active" || !("BarcodeDetector" in window)) return undefined;
    let detector;
    try {
      detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    } catch {
      setDetectorAvailable(false);
      return undefined;
    }
    const interval = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) scan(codes[0].rawValue);
      } catch {
        setDetectorAvailable(false);
      }
    }, 800);
    return () => window.clearInterval(interval);
  }, [cameraState, scan]);

  const finish = async () => {
    if (isVisitor) {
      onComplete(tree, t("qr.found"));
      onClose();
      return;
    }
    if (!tree) {
      setError("Scan a valid tree QR code before submitting a field report.");
      return;
    }
    if (reportMode === "ai" && (!photo || !aiResult || !selectedAiPossibility)) {
      setError("Attach a field photo and run AI photo analysis before submitting this AI-assisted report.");
      return;
    }
    if (reportMode === "manual" && (!manualCause.trim() || !manualTreatment.trim())) {
      setError("Add the issue cause and treatment action for a manual ranger assessment.");
      return;
    }
    const report = await onComplete(tree, "Field report submitted successfully.", {
      reportMode,
      photoName: reportMode === "ai" ? photo : "",
      observedStatus,
      manualCause,
      manualTreatment,
      heightMeasurement,
      aiPossibilities: reportMode === "ai" ? aiPossibilities : [],
      selectedAiPossibilityId: reportMode === "ai" ? selectedAiPossibility.id : "",
      aiDiagnosisRef: aiResult?.aiDiagnosisRef || "",
      diagnosis: selectedAiPossibility?.name || "",
      confidence: selectedAiPossibility?.confidence ?? null,
      treatment: selectedAiPossibility?.treatment || selectedAiPossibility?.solutions?.[0] || "",
      photoAnalysisStatus: aiResult?.photoAnalysisStatus || (reportMode === "ai" ? "pending" : "not-requested"),
      notes,
      gpsLabel: `Mock GPS: ${tree.zone} patrol point`,
      timestamp: "Just now",
    });
    if (report) setSubmittedReport(report);
  };

  const runPhotoAnalysis = async () => {
    if (!photo) {
      setError("Attach a field photo before running AI diagnosis.");
      return;
    }
    setError("");
    setAiState("analyzing");
    const payload = await onAnalyzePhoto?.({ treeId: tree?.id, photoName: photo });
    const result = payload?.analysis;
    if (!result) {
      setAiState("idle");
      setError("AI photo diagnosis backend is unavailable. Check the SS2 backend terminal.");
      return;
    }
    setAiResult(result);
    setSelectedAiPossibilityId(result.selectedAiPossibilityId || result.possibilities?.[0]?.id || "");
    setAiState("complete");
  };

  return (
    <Modal title={role === ROLE.RANGER ? "QR Field Report" : t("qr.scannerTitle")} onClose={onClose} wide>
      <div className="scanner-grid">
        <div className={`scanner-camera scanner-camera-${cameraState}`}>
          <video ref={videoRef} className="scanner-video" playsInline muted />
          <div className="scanner-overlay">
            <div className="scan-frame"><span /></div>
            <p>{isVisitor ? t(`qr.camera${cameraState[0].toUpperCase()}${cameraState.slice(1)}`) : cameraState === "active" ? "Camera is active. Point it at a tree QR tag." : "Enable your camera to scan a physical tree tag."}</p>
            {cameraState === "active" && !detectorAvailable && <small>{isVisitor ? t("qr.detectorUnavailable") : "Live QR detection is unavailable. Use the Tree ID field to continue."}</small>}
            <button className="button button-camera" onClick={startCamera}>{isVisitor ? t("qr.enableCamera") : "Enable Camera"}</button>
          </div>
        </div>
        <div>
          <label className="field-label">{isVisitor ? t("qr.manualLabel") : "Tree QR ID"}</label>
          <div className="input-row">
            <input aria-label={isVisitor ? t("qr.treeQrId") : "Tree QR ID"} value={treeId} onChange={(event) => setTreeId(event.target.value)} />
            <button className="button" onClick={() => scan()}>{isVisitor ? t("qr.scanButton") : "Scan"}</button>
          </div>
          {isVisitor && <button className="text-button scanner-demo" onClick={() => scan("TBJ-004")}>{t("qr.demoScan")}</button>}
          {error && <p className="form-error">{error}</p>}
          {visibleTree && !submittedReport && (
            <div className="scanner-result">
              <div className="split-heading">
                <div>
                  <h3>{visibleTree.name}</h3>
                  <em>{visibleTree.scientificName}</em>
                </div>
                {!isVisitor && <StatusPill status={visibleTree.status} />}
              </div>
              <p>{visibleTree.id} · {visibleTree.zone}{!isVisitor && ` · Health ${visibleTree.health}%`}</p>
              {role === ROLE.RANGER ? (
                <>
                  <label className="field-label">Report mode</label>
                  <div className="segmented report-mode-toggle">
                    <button className={reportMode === "manual" ? "active" : ""} onClick={() => setReportMode("manual")}>I know the issue</button>
                    <button className={reportMode === "ai" ? "active" : ""} onClick={() => setReportMode("ai")}>Use AI diagnosis</button>
                  </div>
                  <label className="field-label">Observed health status</label>
                  <select value={observedStatus} onChange={(event) => setObservedStatus(event.target.value)}>
                    <option value="healthy">Healthy</option>
                    <option value="monitor">Monitor</option>
                    <option value="critical">Critical</option>
                  </select>
                  <div className="report-meta-strip">
                    <span><b>Time</b><small>Just now</small></span>
                    <span><b>GPS</b><small>Mock GPS: {visibleTree.zone} patrol point</small></span>
                  </div>
                  <label className="field-label">Height measurement (m)</label>
                  <input type="number" min="0" step="0.1" value={heightMeasurement} onChange={(event) => setHeightMeasurement(event.target.value)} placeholder={`Current record: ${visibleTree.height || "-"}m`} />
                  {reportMode === "manual" ? (
                    <>
                      <label className="field-label">Issue cause</label>
                      <input value={manualCause} onChange={(event) => setManualCause(event.target.value)} placeholder="e.g. Water stress after hot weather" />
                      <label className="field-label">Treatment action</label>
                      <textarea value={manualTreatment} onChange={(event) => setManualTreatment(event.target.value)} placeholder="Describe the treatment or follow-up action..." />
                    </>
                  ) : (
                    <>
                      <label className="field-label">Field photo for AI recognition</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          setPhoto(event.target.files?.[0]?.name || "");
                          setAiResult(null);
                          setSelectedAiPossibilityId("");
                          setAiState("idle");
                        }}
                      />
                      <div className="photo-upload-strip">
                        <span><b>AI recognition photo</b><small>{photo || "Waiting for uploaded photo"}</small></span>
                        <span><b>Admin upload</b><small>{photo ? "Will sync with AI report" : "Only AI mode uploads photo"}</small></span>
                      </div>
                      <label className="field-label">AI photo diagnosis</label>
                      <div className={`ai-analysis-card ai-analysis-${aiState}`}>
                        {!photo && <p>Attach or capture a field photo to unlock AI diagnosis.</p>}
                        {photo && aiState === "idle" && (
                          <>
                            <p>Ready to analyze uploaded photo: <strong>{photo}</strong></p>
                            <button className="button button-small" onClick={runPhotoAnalysis}>Analyze Photo</button>
                          </>
                        )}
                        {aiState === "analyzing" && <p>Analyzing uploaded photo...</p>}
                        {aiResult && aiState === "complete" && (
                          <>
                            <span className="premium-eyebrow">Photo analyzed: {aiResult.photoName}</span>
                            <strong>3 possible AI diagnoses generated</strong>
                            <div className="ai-possibility-list">
                              {aiPossibilities.map((possibility) => (
                                <button
                                  type="button"
                                  className={`ai-possibility-card ${selectedAiPossibility?.id === possibility.id ? "selected" : ""}`}
                                  key={possibility.id}
                                  onClick={() => setSelectedAiPossibilityId(possibility.id)}
                                >
                                  <span><b>{possibility.name}</b><small>{possibility.confidence}% confidence</small></span>
                                  <div>
                                    <strong>3 possible reasons</strong>
                                    <ol>{possibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ol>
                                  </div>
                                  <div>
                                    <strong>3 suggested solutions</strong>
                                    <ol>{possibility.solutions.map((solution) => <li key={solution}>{solution}</li>)}</ol>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <button className="button button-small button-outline" onClick={runPhotoAnalysis}>Re-analyze Photo</button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                  <label className="field-label">Field notes</label>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add observed symptoms..." />
                  <button className="button button-block" onClick={finish}>Submit Field Report</button>
                </>
              ) : (
                <>
                  <div className="qr-tree-preview-card">
                    <TreePhoto src={publicProfile.photoUrl} alt={publicProfile.photoAlt} className="qr-preview-photo" />
                    <span className="premium-eyebrow">{t("qr.publicPreview")}</span>
                    <h3>{publicProfile.name}</h3>
                    <em>{publicProfile.scientificName}</em>
                    <p className="scanner-description">{publicProfile.description}</p>
                    <div className="tree-id-meta-grid qr-preview-meta">
                      <article><span>{t("profiles.zone")}</span><strong>{publicProfile.zone}</strong></article>
                      <article><span>{t("profiles.localName")}</span><strong>{publicProfile.localName}</strong></article>
                    </div>
                    <div className="profile-badge-row">{publicProfile.badges.slice(0, 3).map((badge) => <span key={badge}>{badge}</span>)}</div>
                  </div>
                  <p className="scanner-success">{t("qr.found")}</p>
                  <button className="button button-block" onClick={finish}>{t("qr.openCard")}</button>
                </>
              )}
            </div>
          )}
          {submittedReport && role === ROLE.RANGER && (
            <div className="report-analysis-panel">
              <span className="premium-eyebrow">Submit report analysis</span>
              <h3>{submittedReport.analysis.source === "manual" ? "Manual ranger assessment" : "AI-assisted field diagnosis"}</h3>
              <div className="report-analysis-grid">
                <article><span>Severity</span><strong>{submittedReport.analysis.severity}</strong></article>
                <article><span>Sync</span><strong>{submittedReport.syncStatus}</strong></article>
                <article><span>Report</span><strong>{submittedReport.id}</strong></article>
              </div>
              <p>{submittedReport.analysis.summary}</p>
              <p><strong>Recommendation:</strong> {submittedReport.analysis.recommendation}</p>
              <p><strong>Task sync:</strong> {submittedReport.analysis.taskSyncMessage}</p>
              <p><strong>Tree update:</strong> {submittedReport.analysis.treeUpdateMessage}</p>
              <p><strong>Photo:</strong> {submittedReport.analysis.photoSyncMessage}</p>
              {submittedReport.reportMode === "ai" && <p><strong>AI photo analysis:</strong> {submittedReport.analysis.photoAnalysisMessage}</p>}
              <p><strong>Next action:</strong> {submittedReport.analysis.nextAction}</p>
              <button className="button button-block" onClick={onClose}>Close Report</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
