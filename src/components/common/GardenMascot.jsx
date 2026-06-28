export default function GardenMascot({ compact = false }) {
  return (
    <div className={`garden-mascot ${compact ? "garden-mascot-compact" : ""}`} aria-hidden="true">
      <span className="garden-mascot-shadow" />
      <span className="garden-mascot-foot garden-mascot-foot-left" />
      <span className="garden-mascot-foot garden-mascot-foot-right" />
      <span className="garden-mascot-body">
        <span className="garden-mascot-highlight" />
        <span className="garden-mascot-leaf garden-mascot-leaf-left" />
        <span className="garden-mascot-leaf garden-mascot-leaf-right" />
        <span className="garden-mascot-eye garden-mascot-eye-left" />
        <span className="garden-mascot-eye garden-mascot-eye-right" />
        <span className="garden-mascot-blush garden-mascot-blush-left" />
        <span className="garden-mascot-blush garden-mascot-blush-right" />
        <span className="garden-mascot-smile" />
      </span>
    </div>
  );
}
