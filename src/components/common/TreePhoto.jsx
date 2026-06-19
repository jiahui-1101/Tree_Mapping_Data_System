import { useState } from "react";

export default function TreePhoto({ src, alt, className = "", caption, overlay, children }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`tree-photo ${className} ${failed ? "tree-photo-failed" : ""}`}>
      {!failed && src ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="tree-photo-fallback" aria-label={alt} role="img">
          <span />
        </div>
      )}
      {overlay && <div className="tree-photo-overlay">{overlay}</div>}
      {caption && <small className="tree-photo-caption">{caption}</small>}
      {children}
    </div>
  );
}
