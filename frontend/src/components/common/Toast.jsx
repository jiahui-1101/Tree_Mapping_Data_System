import { useEffect } from "react";

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 3200);
    return () => clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <button className="toast" onClick={onClose}>
      <strong>Done</strong>
      <span>{message}</span>
    </button>
  );
}

