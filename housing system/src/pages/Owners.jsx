import { useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Pill, initials } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Plus, User, Mail, Phone, Pencil, Trash2, Building2 } from "lucide-react";

function OwnerForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", email: "", phone: "", ownershipPct: 100, notes: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, ownershipPct: Number(form.ownershipPct) || 0 }); }} className="space-y-4">
      <div><label className="label">Full name</label><input className="input" value={form.name} onChange={set("name")} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set("email")} /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
      </div>
      <div><label className="label">Default ownership %</label><input className="input" type="number" min="0" max="100" value={form.ownershipPct} onChange={set("ownershipPct")} /><p className="text-xs text-stone-500 mt-1">Used as the default when this owner is assigned to a new property.</p></div>
      <div><label className="label">Notes</label><textarea className="input min-h-[90px]" value={form.notes} onChange={set("notes")} /></div>
      <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button><button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Add owner"}</button></div>
    </form>
  );
}

export default function Owners() {
  const { state, dispatchAudit, nextId } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => state.owners
    .filter(o => !q || o.name.toLowerCase().includes(q.toLowerCase()) || (o.email || "").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name)),
  [state.owners, q]);

  function save(payload) {
    if (edit?.id) dispatchAudit({ type: "UPDATE_OWNER", payload: { ...edit, ...payload } }, { entityType: "owner", detail: edit.name });
    else dispatchAudit({ type: "ADD_OWNER", payload: { id: nextId("OWN", state.owners), ...payload } }, { entityType: "owner", detail: payload.name });
    setOpen(false); setEdit(null);
  }

  function del(o) {
    dispatchAudit({ type: "DELETE_OWNER", payload: o.id }, { entityType: "owner", detail: o.name });
    setConfirm(null);
  }

  return (
    <>
      <Topbar
        title="Owners"
        subtitle="Landlords and stakeholders with ownership percentages."
        action={<button className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add Owner</button>}
      />
      <main className="p-4 md:p-6 space-y-6">
        <div className="card p-4"><SearchBar value={q} onChange={setQ} placeholder="Search owners..." /></div>
        {rows.length === 0 ? (
          <EmptyState icon={User} title="No owners yet" hint="Add an owner to assign ownership to your properties." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Owner</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rows.map(o => {
              const props = state.properties.filter(p => p.ownerId === o.id);
              return (
                <article key={o.id} className="card p-6 transition-all duration-300 hover:shadow-xl group">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-stone-800 dark:bg-stone-700 grid place-items-center text-stone-100 font-bold text-sm border border-stone-700 dark:border-stone-600 shadow-sm">{initials(o.name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 dark:text-stone-100 truncate text-lg">{o.name}</div>
                      <div className="text-xs text-stone-500 truncate flex items-center gap-1 mt-1"><Mail size={12} /> {o.email || "—"}</div>
                      <div className="text-xs text-stone-500 truncate flex items-center gap-1"><Phone size={12} /> {o.phone || "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-stone-400">Default</div>
                      <div className="font-bold text-stone-900 dark:text-stone-100">{o.ownershipPct}%</div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1 font-medium"><Building2 size={12} /> {props.length} propert{props.length === 1 ? "y" : "ies"}</span>
                    <div className="inline-flex gap-1">
                      <button onClick={() => { setEdit(o); setOpen(true); }} className="h-8 w-8 grid place-items-center rounded-full text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirm(o)} className="h-8 w-8 grid place-items-center rounded-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit owner" : "Add owner"} size="lg">
        <OwnerForm initial={edit || undefined} onSubmit={save} onCancel={() => { setOpen(false); setEdit(null); }} />
      </Modal>

      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={() => del(confirm)} title={`Delete "${confirm?.name}"?`} message="Properties linked to this owner will keep the assignment but show no owner name." />
    </>
  );
}
