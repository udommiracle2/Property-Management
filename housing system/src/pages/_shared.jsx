import { Search } from "lucide-react";

// Small shared primitives imported by multiple pages.
// Kept tiny to avoid over-abstracting.

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative flex-1">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Pill({ children, className = "" }) {
  return <span className={`pill ${className}`}>{children}</span>;
}

export function statusClass(s) {
  if (s === "Active" || s === "Paid" || s === "Resolved") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (s === "Pending" || s === "Renewal" || s === "Expiring" || s === "In Progress") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  if (s === "Overdue" || s === "Open") return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
  if (s === "Past") return "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

export function PriorityBadge({ p }) {
  const cls = p === "High" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
            : p === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return <span className={`pill ${cls}`}>{p}</span>;
}

export function initials(name = "") {
  return name.split(" ").filter(Boolean).map(s => s[0]).slice(0, 2).join("").toUpperCase();
}

export function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function Select({ value, onChange, options, className = "" }) {
  return (
    <select className={`input ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

// Re-export shared UI from components/ui.jsx for convenience
export { Modal, ConfirmDialog, EmptyState, Skeleton, TableSkeleton } from "../components/ui.jsx";
