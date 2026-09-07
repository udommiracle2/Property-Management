import { useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Select, Pill, statusClass, fmtDate } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Plus, FileText, Pencil, Trash2, Download } from "lucide-react";
import jsPDF from "jspdf";

const STATUSES = ["Active", "Expiring", "Renewal", "Ended"];

function LeaseForm({ initial, tenants, units, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { tenantId: "", unitId: "", start: new Date().toISOString().slice(0,10), end: "", rent: 0, deposit: 0, status: "Active" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function pickUnit(e) {
    const unitId = e.target.value;
    const u = units.find(x => x.id === unitId);
    setForm((f) => ({ ...f, unitId, rent: u ? u.rent : f.rent }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, rent: Number(form.rent)||0, deposit: Number(form.deposit)||0 }); }} className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Tenant</label>
        <select className="input" value={form.tenantId} onChange={set("tenantId")} required>
          <option value="">Choose tenant...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Unit</label>
        <select className="input" value={form.unitId} onChange={pickUnit} required>
          <option value="">Choose unit...</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.propertyName} · {u.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Start date</label>
        <input className="input" type="date" value={form.start} onChange={set("start")} required />
      </div>
      <div>
        <label className="label">End date</label>
        <input className="input" type="date" value={form.end} onChange={set("end")} required />
      </div>
      <div>
        <label className="label">Monthly rent</label>
        <input className="input" type="number" min="0" value={form.rent} onChange={set("rent")} required />
      </div>
      <div>
        <label className="label">Deposit</label>
        <input className="input" type="number" min="0" value={form.deposit} onChange={set("deposit")} required />
      </div>
      <div className="col-span-2">
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={set("status")}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="col-span-2 flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Create lease"}</button>
      </div>
    </form>
  );
}

function buildLeasePdf(lease, tenant, unit, property, brandName = "EstateHub") {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const left = 56;
  let y = 64;

  // Header
  doc.setFillColor(68, 64, 60); // stone-700
  doc.rect(0, 0, 612, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text("RESIDENTIAL LEASE AGREEMENT", left, 38);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(`Lease ID: ${lease.id}  ·  Issued: ${new Date().toLocaleDateString()}`, left, 60);

  doc.setTextColor(15, 23, 42);
  y = 110;
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("Landlord:", left, y);      doc.setFont("helvetica", "normal"); doc.text(`${brandName} Property Management`, left + 80, y);
  y += 18;
  doc.setFont("helvetica", "bold"); doc.text("Tenant:",  left, y); doc.setFont("helvetica", "normal"); doc.text(tenant?.name || "—", left + 80, y);
  y += 18;
  doc.setFont("helvetica", "bold"); doc.text("Email:",   left, y); doc.setFont("helvetica", "normal"); doc.text(tenant?.email || "—", left + 80, y);
  y += 18;
  doc.setFont("helvetica", "bold"); doc.text("Phone:",   left, y); doc.setFont("helvetica", "normal"); doc.text(tenant?.phone || "—", left + 80, y);

  y += 30;
  doc.setDrawColor(226, 232, 240); doc.line(left, y, 612 - left, y);

  y += 24;
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text("Premises", left, y);
  y += 16;
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(`Property:  ${property?.name || "—"}`, left, y); y += 16;
  doc.text(`Address:   ${property?.address || "—"}`, left, y); y += 16;
  doc.text(`Unit:      ${unit?.label || "—"}  ·  ${unit?.bedrooms || 0} bed  ·  ${unit?.sqft || 0} sqft`, left, y);

  y += 24;
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text("Term & Financials", left, y);
  y += 16;
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(`Term:        ${lease.start}  →  ${lease.end}`, left, y); y += 16;
  doc.text(`Rent:        $${(lease.rent || 0).toLocaleString()} / month`, left, y); y += 16;
  doc.text(`Deposit:     $${(lease.deposit || 0).toLocaleString()}`, left, y); y += 16;
  doc.text(`Total Move-in: $${((lease.rent || 0) + (lease.deposit || 0)).toLocaleString()}`, left, y);

  y += 24;
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text("Terms & Conditions", left, y);
  y += 16;
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  const terms = [
    "1. Rent is due on the 1st of each month. A late fee will apply after the 5th.",
    "2. Tenant agrees to maintain the premises in clean and sanitary condition.",
    "3. No alterations may be made without prior written consent from the landlord.",
    "4. Maintenance issues must be reported through the EstateHub tenant portal.",
    "5. This agreement is governed by the laws of the property's jurisdiction.",
    "6. Either party may terminate with 30 days written notice as per local law."
  ];
  terms.forEach(t => { const lines = doc.splitTextToSize(t, 612 - left * 2); doc.text(lines, left, y); y += lines.length * 13 + 4; });

  y += 16;
  doc.setDrawColor(15, 23, 42);
  doc.line(left, y, left + 200, y);
  doc.line(left + 280, y, left + 480, y);
  y += 14; doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  doc.text("Landlord signature & date", left, y);
  doc.text("Tenant signature & date", left + 280, y);

  return doc;
}

export default function Leases() {
  const { state, dispatch, nextId } = useStore();
  const { fmt } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const tenantOpts = state.tenants;
  const unitOpts = useMemo(() => state.units.map(u => ({ ...u, propertyName: state.properties.find(p => p.id === u.propertyId)?.name || "—" })), [state.units, state.properties]);

  const rows = useMemo(() => {
    return state.leases
      .map(l => {
        const tenant = state.tenants.find(t => t.id === l.tenantId);
        const unit = state.units.find(u => u.id === l.unitId);
        const property = state.properties.find(p => p.id === unit?.propertyId);
        return { ...l, tenant, unit, property };
      })
      .filter(l => (!q || (l.tenant?.name || "").toLowerCase().includes(q.toLowerCase()) || (l.property?.name || "").toLowerCase().includes(q.toLowerCase())) && (status === "All" || l.status === status));
  }, [state.leases, state.tenants, state.units, state.properties, q, status]);

  function save(payload) {
    if (edit?.id) dispatch({ type: "UPDATE_LEASE", payload: { ...edit, ...payload } });
    else dispatch({ type: "ADD_LEASE", payload: { id: nextId("L", state.leases), ...payload } });
    setOpen(false); setEdit(null);
  }

  function exportPdf(l) {
    const doc = buildLeasePdf(l, l.tenant, l.unit, l.property);
    doc.save(`Lease-${l.id}-${(l.tenant?.name || "").replace(/\s+/g,"_")}.pdf`);
  }

  return (
    <>
      <Topbar
        title="Lease Agreements"
        subtitle="Document, track, and renew tenant leases."
        action={<button className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> New Lease</button>}
      />
      <main className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Active Leases",   value: state.leases.filter(l => l.status === "Active").length,   color: "from-emerald-600 to-emerald-800" },
            { label: "Expiring Soon",   value: state.leases.filter(l => l.status === "Expiring").length, color: "from-amber-500 to-orange-600" },
            { label: "Pending Renewal", value: state.leases.filter(l => l.status === "Renewal").length,  color: "from-stone-600 to-stone-800" }
          ].map(s => (
            <div key={s.label} className="card p-6 flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl text-white grid place-items-center bg-gradient-to-br ${s.color} shadow-lg`}>
                <FileText size={24} />
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold">{s.label}</div>
                <div className="text-3xl font-bold text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search by tenant or property..." />
          <Select className="md:w-44" value={status} onChange={setStatus} options={["All", ...STATUSES]} />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="No leases yet" hint="Create a lease to start tracking term, rent and deposit for a tenant." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Lease</button>} />
        ) : (
          <div className="card overflow-hidden border-none shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50">
                    <th className="table-th">Lease ID</th>
                    <th className="table-th">Tenant</th>
                    <th className="table-th">Property / Unit</th>
                    <th className="table-th">Term</th>
                    <th className="table-th">Rent</th>
                    <th className="table-th">Deposit</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {rows.map(l => (
                    <tr key={l.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                      <td className="table-td font-mono text-xs text-stone-500">{l.id}</td>
                      <td className="table-td font-bold text-stone-900 dark:text-stone-100">{l.tenant?.name || "—"}</td>
                      <td className="table-td">
                        <div className="font-semibold text-stone-800 dark:text-stone-200">{l.property?.name || "—"}</div>
                        <div className="text-xs text-stone-500">Unit {l.unit?.label || "—"}</div>
                      </td>
                      <td className="table-td text-stone-600 dark:text-stone-400 font-medium">{fmtDate(l.start)} → {fmtDate(l.end)}</td>
                      <td className="table-td font-bold text-stone-900 dark:text-stone-100">{fmt(l.rent)}</td>
                      <td className="table-td font-medium text-stone-600 dark:text-stone-400">{fmt(l.deposit)}</td>
                      <td className="table-td"><Pill className={statusClass(l.status)}>{l.status}</Pill></td>
                      <td className="table-td text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => exportPdf(l)} title="Download PDF" className="h-8 w-8 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Download size={14} /></button>
                          <button onClick={() => { setEdit(l); setOpen(true); }} className="h-8 w-8 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setConfirm(l)} className="h-8 w-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit lease" : "New lease"} size="lg">
        <LeaseForm initial={edit || undefined} tenants={tenantOpts} units={unitOpts} onSubmit={save} onCancel={() => { setOpen(false); setEdit(null); }} />
      </Modal>

      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: "DELETE_LEASE", payload: confirm.id }); setConfirm(null); }} title={`Delete lease ${confirm?.id}?`} />
    </>
  );
}
