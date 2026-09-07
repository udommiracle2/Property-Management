import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  const ref = useRef(null);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm grid place-items-center p-4 animate-fade-in" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={ref} className={`bg-white dark:bg-stone-900 w-full ${sizes[size]} rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 animate-slide-up`} role="dialog" aria-modal="true">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 grid place-items-center text-stone-500" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onCancel, onConfirm, title = "Are you sure?", message = "This action cannot be undone.", confirmLabel = "Delete", danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button onClick={onCancel}  className="btn-ghost">Cancel</button>
          <button onClick={onConfirm} className={danger ? "btn-danger" : "btn-primary"}>{confirmLabel}</button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="card p-10 text-center animate-fade-in">
      {Icon && (
        <div className="h-14 w-14 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 grid place-items-center mb-3">
          <Icon size={22} />
        </div>
      )}
      <div className="font-semibold text-stone-900 dark:text-stone-100">{title}</div>
      {hint && <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, j) => <Skeleton key={j} className="h-4" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
