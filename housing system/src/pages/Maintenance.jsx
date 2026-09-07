import { useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Select, PriorityBadge } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { Plus, Wrench, AlertTriangle, Clock, CheckCircle2, Pencil, Trash2 } from "lucide-react";

const COLUMNS = [
  { key: "Open",        title: "Open",        accent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",    icon: AlertTriangle, color: "text-rose-500" },
  { key: "In Progress", title: "In Progress", accent: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Clock,        color: "text-amber-500" },
  { key: "Resolved",    title: "Resolved",    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle2, color: "text-emerald-500" }
];
const PRIORITIES = ["High", "Medium", "Low"];

function TicketForm({ initial, tenants, units, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { title: "", unitId: "", tenantId: "", priority: "Medium", status: "Open" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function pickUnit(e) {
    const unitId = e.target.value;
    const u = units.find(x => x.id === unitId);
    const t = u && !u.vacant ? tenants.find(t => t.unitId === unitId) : null;
    setForm((f) => ({ ...f, unitId, tenantId: t ? t.id : "" }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="grid grid-cols-2 gap-4">
      <div className="col-span-2"><label className="label">Title</label><input className="input" placeholder="e.g. AC unit not cooling" value={form.title} onChange={set("title")} required /></div>
      <div><label className="label">Unit</label><select className="input" value={form.unitId} onChange={pickUnit} required><option value="">Choose unit...</option>{units.map(u => <option key={u.id} value={u.id}>{(u.propertyName || "")} · {u.label}</option>)}</select></div>
      <div><label className="label">Tenant</label><select className="input" value={form.tenantId} onChange={set("tenantId")}><option value="">None</option>{tenants.filter(t => !form.unitId || t.unitId === form.unitId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      <div><label className="label">Priority</label><select className="input" value={form.priority} onChange={set("priority")}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
      <div><label className="label">Status</label><select className="input" value={form.status} onChange={set("status")}>{COLUMNS.map(c => <option key={c.key}>{c.key}</option>)}</select></div>
      <div className="col-span-2 flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Create ticket"}</button>
      </div>
    </form>
  );
}

export default function Maintenance() {
  const { state, dispatch, nextId } = useStore();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return state.maintenance.map(m => ({
      ...m,
      tenant: state.tenants.find(t => t.id === m.tenantId),
      unit: state.units.find(u => u.id === m.unitId)
    })).filter(m => !q || m.title.toLowerCase().includes(q.toLowerCase()));
  }, [state.maintenance, state.tenants, state.units, q]);

  function onDragStart(e, id) { setDragging(id); e.dataTransfer.effectAllowed = "move"; }
  function onDragOver(e)      { e.preventDefault(); }
  function onDrop(e, status)  {
    e.preventDefault();
    if (!dragging) return;
    dispatch({ type: "MOVE_MAINT", payload: { id: dragging, status } });
    setDragging(null);
  }

  function save(payload) {
    const today = new Date().toISOString().slice(0,10);
    if (edit?.id) dispatch({ type: "UPDATE_MAINT", payload: { ...edit, ...payload, updated: today } });
    else dispatch({ type: "ADD_MAINT", payload: { id: nextId("M", state.maintenance), ...payload, created: today, updated: today } });
    setOpen(false); setEdit(null);
  }

  return (
    <>
      <Topbar
        title="Maintenance"
        subtitle="Track and resolve tenant requests."
        action={<button className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> New Ticket</button>}
      />
      <main className="p-4 md:p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {COLUMNS.map(c => {
            const Icon = c.icon;
            const count = rows.filter(t => t.status === c.key).length;
            return (
              <div key={c.key} className="card p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl grid place-items-center ${c.accent}`}>
                    <Icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold">{c.title}</div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">{count}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card p-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search tickets..." />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Wrench} title="No tickets yet" hint="Create a maintenance request to start tracking work." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Ticket</button>} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {COLUMNS.map(c => (
              <div key={c.key} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    {c.title}
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {rows.filter(t => t.status === c.key).length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-4 min-h-[420px] p-2 rounded-3xl bg-stone-100/50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800" onDragOver={onDragOver} onDrop={(e) => onDrop(e, c.key)}>
                  {rows.filter(t => t.status === c.key).map(t => (
                    <div key={t.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, t.id)}
                      className={`card p-4 cursor-grab active:cursor-grabbing transition-all duration-200 ${dragging === t.id ? "opacity-50 scale-95" : "hover:shadow-md hover:-translate-y-1"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 grid place-items-center shrink-0">
                            <Wrench size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">{t.title}</div>
                            <div className="text-xs text-stone-500 mt-0.5">{t.unit?.label || "—"}</div>
                          </div>
                        </div>
                        <PriorityBadge p={t.priority} />
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                        <span className="truncate font-medium">{t.tenant?.name || "—"}</span>
                        <span className="font-light">Updated {t.updated}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-1">
                        <button onClick={() => { setEdit(t); setOpen(true); }} className="h-8 w-8 grid place-items-center rounded-full text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => setConfirm(t)} className="h-8 w-8 grid place-items-center rounded-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                  {rows.filter(t => t.status === c.key).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-stone-400 italic border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-3xl">
                      Drop tickets here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit ticket" : "New ticket"} size="lg">
        <TicketForm
          initial={edit || undefined}
          tenants={state.tenants}
          units={state.units.map(u => ({ ...u, propertyName: state.properties.find(p => p.id === u.propertyId)?.name || "—" }))}
          onSubmit={save}
          onCancel={() => { setOpen(false); setEdit(null); }}
        />
      </Modal>

      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: "DELETE_MAINT", payload: confirm.id }); setConfirm(null); }} title="Delete ticket?" message={confirm?.title} />
    </>
  );
}
