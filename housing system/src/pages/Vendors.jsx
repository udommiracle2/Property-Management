import { useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Pill, initials } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { Plus, Wrench, Mail, Phone, Pencil, Trash2 } from "lucide-react";

const TRADES = ["Plumbing", "Electrical", "HVAC", "Carpentry", "Painting", "Cleaning", "Landscaping", "Pest control", "Security", "General", "Other"];

function VendorForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", trade: "General", phone: "", email: "", notes: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="label">Vendor / contractor name</label><input className="input" value={form.name} onChange={set("name")} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Trade</label><select className="input" value={form.trade} onChange={set("trade")}>{TRADES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
      </div>
      <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set("email")} /></div>
      <div><label className="label">Notes</label><textarea className="input min-h-[80px]" value={form.notes} onChange={set("notes")} /></div>
      <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button><button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Add vendor"}</button></div>
    </form>
  );
}

export default function Vendors() {
  const { state, dispatchAudit, nextId } = useStore();
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState("All");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => state.vendors
    .filter(v => (!q || v.name.toLowerCase().includes(q.toLowerCase()) || (v.email || "").toLowerCase().includes(q.toLowerCase())) && (trade === "All" || v.trade === trade))
    .sort((a, b) => a.name.localeCompare(b.name)),
  [state.vendors, q, trade]);

  function save(payload) {
    if (edit?.id) dispatchAudit({ type: "UPDATE_VENDOR", payload: { ...edit, ...payload } }, { entityType: "vendor", detail: edit.name });
    else dispatchAudit({ type: "ADD_VENDOR", payload: { id: nextId("VND", state.vendors), ...payload } }, { entityType: "vendor", detail: payload.name });
    setOpen(false); setEdit(null);
  }

  function del(v) {
    dispatchAudit({ type: "DELETE_VENDOR", payload: v.id }, { entityType: "vendor", detail: v.name });
    setConfirm(null);
  }

  return (
    <>
      <Topbar
        title="Vendors"
        subtitle="Contractors available for maintenance work."
        action={<button className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add Vendor</button>}
      />
      <main className="p-4 md:p-6 space-y-6">
        <div className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search vendors..." />
          <select className="input md:w-44" value={trade} onChange={(e) => setTrade(e.target.value)}>
            {["All", ...TRADES].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Wrench} title="No vendors yet" hint="Add a contractor so maintenance tickets can be assigned." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Vendor</button>} />
        ) : (
          <div className="card overflow-hidden border-none shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-stone-50 dark:bg-stone-800/50">
                  <tr>
                    <th className="table-th">Vendor</th>
                    <th className="table-th">Trade</th>
                    <th className="table-th">Contact</th>
                    <th className="table-th">Tickets</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {rows.map(v => {
                    const tix = state.maintenance.filter(m => m.vendorId === v.id).length;
                    return (
                      <tr key={v.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                        <td className="table-td">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-stone-800 dark:bg-stone-700 grid place-items-center text-stone-100 text-sm font-bold border border-stone-700 dark:border-stone-600">{initials(v.name)}</div>
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 dark:text-stone-100 truncate">{v.name}</div>
                              <div className="text-xs text-stone-500 truncate font-light">{v.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-td"><Pill className="bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700">{v.trade}</Pill></td>
                        <td className="table-td text-xs">
                          <div className="flex items-center gap-1 text-stone-600 dark:text-stone-300"><Mail size={12} /> {v.email || "—"}</div>
                          <div className="flex items-center gap-1 text-stone-500"><Phone size={12} /> {v.phone || "—"}</div>
                        </td>
                        <td className="table-td font-bold text-stone-900 dark:text-stone-100">{tix}</td>
                        <td className="table-td text-right">
                          <div className="inline-flex gap-1">
                            <button onClick={() => { setEdit(v); setOpen(true); }} className="h-8 w-8 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => setConfirm(v)} className="h-8 w-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit vendor" : "Add vendor"} size="lg">
        <VendorForm initial={edit || undefined} onSubmit={save} onCancel={() => { setOpen(false); setEdit(null); }} />
      </Modal>

      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={() => del(confirm)} title={`Delete "${confirm?.name}"?`} message="Tickets linked to this vendor will keep the reference but show no vendor name." />
    </>
  );
}
