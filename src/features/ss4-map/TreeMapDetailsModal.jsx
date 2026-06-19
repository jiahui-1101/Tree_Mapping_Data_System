import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";

export default function TreeMapDetailsModal({ tree, onClose, onOpenScanner }) {
  if (!tree) return null;

  return (
    <Modal title={`${tree.name} - ${tree.id}`} onClose={onClose}>
      <StatusPill status={tree.status} />
      <p>{tree.description}</p>
      <p>Zon {tree.zone} · Health {tree.health}%</p>
      {tree.coordinateLabel && <p className="inline-warning">{tree.coordinateLabel}</p>}
      <button className="button button-block" onClick={onOpenScanner}>Open QR Interaction</button>
    </Modal>
  );
}
