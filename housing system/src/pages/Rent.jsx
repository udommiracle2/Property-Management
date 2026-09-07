import { useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Select, Pill, statusClass, fmtDate } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Plus, Receipt, Send, CheckCircle2, Pencil, Trash2, AlertTriangle } from "lucide-react";

const STATUSES = ["Paid", "Pending", "Overdue"];
const LATE_FEE_PCT = 0.05; // 5% of invoice amount
const GRACE_DAYS  = 5;     // overdue if past due + 5 days

function InvoiceForm({ initial, tenants, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { tenantId: "", amount: 0, due: new Date().toISOString().slice(0,10), status: "Pending" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Auto-fill rent when tenant picked
  function pickTenant(e) {
    const tenantId = e.target.value;
    const t = tenants.find(x => x.id === tenantId);
    setForm((f) => ({ ...f, tenantId, amount: t ? t.rent : f.amount }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount)||0 }); }} className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Tenant</label>
        <select className="input" value={form.tenantId} onChange={pickTenant} required>
          <option value="">Choose tenant...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Amount</label>
        <input className="input" type="number" min="0" value={form.amount} onChange={set("amount")} required />
      </div>
      <div>
        <label className="label">Due date</label>
        <input className="input" type="date" value={form.due} onChange={set("due")} required />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={set("status")}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="col-span-2 flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Create invoice"}</button>
      </div>
    </form>
  );
}

export default function Rent() {
  const { state, dispatch, nextId } = useStore();
  const { fmt, fmtNum } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    return state.invoices
      .map(i => {
        const tenant = state.tenants.find(t => t.id === i.tenantId);
        const unit = state.units.find(u => u.id === tenant?.unitId);
        const property = state.properties.find(p => p.id === unit?.propertyId);
        return { ...i, tenant, unit, property };
      })
      .filter(i =>
        (!q || (i.tenant?.name || "").toLowerCase().includes(q.toLowerCase()) || (i.property?.name || "").toLowerCase().includes(q.toLowerCase()) || i.id.toLowerCase().includes(q.toLowerCase())) &&
        (status === "All" || i.status === status)
      );
  }, [state.invoices, state.tenants, state.units, state.properties, q, status]);

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const collected = rows.filter(r => r.status === "Paid").reduce((s, r) => s + (r.amount || 0), 0);
  const outstanding = total - collected;
  const overdueCount = rows.filter(r => r.status === "Overdue").length;

  // Late-fee automation: flag Pending invoices past due + grace as Overdue.
  function runAutomation() {
    const today = new Date();
    rows.forEach(r => {
      if (r.status === "Pending") {
        const due = new Date(r.due);
        const days = Math.floor((today - due) / (1000*60*60*24));
        if (days > GRACE_DAYS) dispatch({ type: "UPDATE_INVOICE", payload: { ...r, status: "Overdue" } });
      }
    });
    alert(`Sweep complete. ${overdueCount} invoice(s) were already overdue.`);
  }

  function applyLateFee(r) {
    const fee = Math.round((r.amount || 0) * LATE_FEE_PCT);
    dispatch({ type: "APPLY_LATE_FEE", payload: { id: r.id, fee } });
  }

  function save(payload) {
    if (edit?.id) dispatch({ type: "UPDATE_INVOICE", payload: { ...edit, ...payload } });
    else dispatch({ type: "ADD_INVOICE", payload: { id: nextId("INV", state.invoices), ...payload } });
    setOpen(false); setEdit(null);
  }

  return (
    <>
      <Topbar
        title="Rent & Invoicing"
        subtitle="Automated rent collection and payment tracking."
        action={
          <div className="hidden sm:flex gap-2">
            <button onClick={runAutomation} className="btn-ghost" title="Flag past-due invoices"><AlertTriangle size={14} /> Run sweep</button>
            <button onClick={() => { setEdit(null); setOpen(true); }} className="btn-primary"><Plus size={16} /> New Invoice</button>
          </div>
        }
      />
      <main className="p-4 md:p-6 space-y-8">
        {overdueCount > 0 && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-900 p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-600 text-white grid place-items-center shadow-lg"><AlertTriangle size={20} /></div>
            <div className="flex-1">
              <div className="font-bold text-rose-900 dark:text-rose-200 text-lg">{overdueCount} overdue invoice{overdueCount > 1 ? "s" : ""}</div>
              <p className="text-sm text-rose-800/80 dark:text-rose-200/80 leading-relaxed">Run the sweep to apply the {Math.round(LATE_FEE_PCT*100)}% late fee, or open each row to mark as paid.</p>
            </div>
            <button onClick={runAutomation} className="btn-danger shadow-lg">Run sweep</button>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Billed (filtered)</div>
            <div className="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-2">{fmt(total)}</div>
            <div className="mt-4 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden"><div className="h-full bg-stone-800 dark:bg-stone-200" style={{ width: "100%" }} /></div>
          </div>
          <div className="card p-6">
            <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Collected</div>
            <div className="text-3xl font-bold text-emerald-600 mt-2">{fmt(collected)}</div>
            <div className="mt-4 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${total ? (collected/total)*100 : 0}%` }} /></div>
          </div>
          <div className="card p-6">
            <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Outstanding</div>
            <div className="text-3xl font-bold text-rose-600 mt-2">{fmt(outstanding)}</div>
            <div className="mt-4 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden"><div className="h-full bg-rose-500" style={{ width: `${total ? (outstanding/total)*100 : 0}%` }} /></div>
          </div>
        </section>

        <div className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search invoice, tenant, property..." />
          <Select className="md:w-44" value={status} onChange={setStatus} options={["All", ...STATUSES]} />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices yet" hint="Create invoices for your tenants and mark them paid as money comes in." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Invoice</button>} />
        ) : (
          <div className="card overflow-hidden border-none shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-stone-50 dark:bg-stone-800/50">
                  <tr>
                    <th className="table-th">Invoice ID</th>
                    <th className="table-th">Tenant</th>
                    <th className="table-th">Property / Unit</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Due Date</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {rows.map(r => (
                    <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                      <td className="table-td font-mono text-xs text-stone-500">{r.id}</td>
                      <td className="table-td font-bold text-stone-900 dark:text-stone-100">{r.tenant?.name || "—"}</td>
                      <td className="table-td text-stone-600 dark:text-stone-400">{r.property?.name || "—"} · {r.unit?.label || "—"}</td>
                      <td className="table-td font-bold text-stone-900 dark:text-stone-100">
                        {fmt(r.amount)} {r.lateFee ? <span className="ml-1 text-xs text-rose-600 font-medium">+{fmt(r.lateFee)} fee</span> : null}
                      </td>
                      <td className="table-td text-stone-600 dark:text-stone-400 font-medium">{fmtDate(r.due)}</td>
                      <td className="table-td"><Pill className={statusClass(r.status)}>{r.status}</Pill></td>
                      <td className="table-td text-right">
                        {r.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold"><CheckCircle2 size={14} /> Paid {fmtDate(r.paid)}</span>
                        ) : (
                          <div className="inline-flex gap-1">
                            {r.status === "Overdue" && <button onClick={() => applyLateFee(r)} className="btn-ghost text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title={`Apply ${Math.round(LATE_FEE_PCT*100)}% late fee`}><AlertTriangle size={14} /> Late fee</button>}
                            <button onClick={() => dispatch({ type: "MARK_INVOICE_PAID", payload: { id: r.id, method: "Admin recorded" } })} className="btn-primary shadow-sm"><Receipt size={14} /> Mark Paid</button>
                            <button onClick={() => { setEdit(r); setOpen(true); }} className="h-9 w-9 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => setConfirm(r)} className="h-9 w-9 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit invoice" : "New invoice"} size="lg">
        <InvoiceForm initial={edit || undefined} tenants={state.tenants} onSubmit={save} onCancel={() => { setOpen(false); setEdit(null); }} />
      </Modal>

      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: "DELETE_INVOICE", payload: confirm.id }); setConfirm(null); }} title={`Delete ${confirm?.id}?`} />
    </>
  );
}
