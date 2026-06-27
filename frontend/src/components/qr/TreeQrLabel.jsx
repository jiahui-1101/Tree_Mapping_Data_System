import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import StatusPill from "../common/StatusPill.jsx";

function fallbackQrForTree(tree) {
  const qrId = `QR-${tree.id}`;
  return {
    qrId,
    qrEndpoint: `/scan/${qrId}`,
    qrStatus: "active",
    generatedAt: "Preview",
  };
}

export default function TreeQrLabel({ tree, qrCode }) {
  const resolvedQr = qrCode || fallbackQrForTree(tree);
  const payload = resolvedQr.qrEndpoint || resolvedQr.qrId || tree.id;
  const [qrImage, setQrImage] = useState("");

  const verificationCode = useMemo(() => {
    const source = `${resolvedQr.qrId}-${tree.id}`;
    let total = 0;
    for (const char of source) total += char.charCodeAt(0);
    return `TBJ-${String(total % 997).padStart(3, "0")}`;
  }, [resolvedQr.qrId, tree.id]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
      color: {
        dark: "#101820",
        light: "#ffffff",
      },
    }).then((url) => {
      if (active) setQrImage(url);
    });
    return () => {
      active = false;
    };
  }, [payload]);

  return (
    <div className="qr-label qr-label-real">
      <div className="qr-label-header">
        <span>
          <b>Taman Botani Johor</b>
          <small>Verified Tree Scan Label</small>
        </span>
        <StatusPill status={resolvedQr.qrStatus || "active"} />
      </div>

      <div className="qr-label-body">
        <div className="qr-code-plate" aria-label={`Scannable QR code for ${tree.id}`}>
          {qrImage ? <img src={qrImage} alt={`QR code for ${tree.id}`} /> : <div className="qr-code-loading" />}
        </div>
        <div className="qr-label-copy">
          <span>Tree ID</span>
          <strong>{tree.id}</strong>
          <em>{tree.name}</em>
          <small>{tree.scientificName}</small>
        </div>
      </div>

      <div className="qr-label-meta">
        <span><small>QR ID</small><b>{resolvedQr.qrId}</b></span>
        <span><small>Scan path</small><b>{payload}</b></span>
        <span><small>Issued</small><b>{resolvedQr.generatedAt || "Preview"}</b></span>
        <span><small>Check</small><b>{verificationCode}</b></span>
      </div>
    </div>
  );
}
