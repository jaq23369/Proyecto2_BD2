import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`ig-card w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between px-5 py-3 border-b ig-border">
            <h3 className="font-semibold">{title}</h3>
            <button className="p-1.5 rounded-lg hover:bg-ig-elevated" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t ig-border">{footer}</div>}
      </div>
    </div>
  );
}
