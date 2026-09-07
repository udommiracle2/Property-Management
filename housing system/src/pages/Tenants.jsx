import { useMemo, useRef, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Select, Pill, statusClass, initials, fmtDate } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Plus, Mail, Phone, Star, X, Pencil, Trash2, FileText, Download, PawPrint, Users as UsersIcon, Briefcase, StickyNote, Image as ImageIcon } from "lucide-react";

const STATUSES = ["Active", "Pending", "Overdue", "Past"];
const TABS = [
  { key: "profile", label: "Profile", icon: Mail },
  { key: "emergency", label: "Emergency", icon: Phone },
  { key: "employment", label: "Employment", icon: Briefcase },
  { key: "pets", label: "Pets", icon: PawPrint },
  { key: "co", label: "Co-tenants", icon: UsersIcon },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "docs", label: "Documents", icon: FileText }
];

function emptyForm() {
  return {
    name: "", email: "", phone: "", unitId: "", rent: 0, status: "Active", score: 85, joined: new Date().toISOString().slice(0,10),
    emergencyContact: { name: "", phone: "", rel: "" },
    employment: { employer: "", income: 0, position: "" },
    notes: "",
    coTenantIds: [],
    pets: [],
    documents: []
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (file.size > 2 * 1024 * 1024) return reject(new Error("File too large (max 2 MB)."));
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function TenantForm({ initial, units, tenants, onSubmit, onCancel }) {
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState(initial || emptyForm());
  const fileRef = useRef(null);
  const set = (path) => (e) => setForm((f) => ({ ...f, [path]: e.target.value }));
  const setNested = (path, key) => (e) => setForm((f) => ({ ...f, [path]: { ...(f[path] || {}), [key]: e.target.value } }));

  function pickUnit(e) {
    const unitId = e.target.value;
    const u = units.find(x => x.id === unitId);
    setForm((f) => ({ ...f, unitId, rent: u ? u.rent : f.rent }));
  }

  function addPet() { setForm((f) => ({ ...f, pets: [...(f.pets || []), { name: "", type: "Dog", fee: 0 }] })); }
  function setPet(i, k, v) {
    setForm((f) => ({ ...f, pets: f.pets.map((p, idx) => idx === i ? { ...p, [k]: k === "fee" ? Number(v) || 0 : v } : p) }));
  }
  function removePet(i) { setForm((f) => ({ ...f, pets: f.pets.filter((_, idx) => idx !== i) })); }

  function toggleCoTenant(id) {
    setForm((f) => ({ ...f, coTenantIds: f.coTenantIds.includes(id) ? f.coTenantIds.filter(x => x !== id) : [...f.coTenantIds, id] }));
  }

  async function addDoc(e) {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      const dataUrl = await readFileAsDataUrl(f);
      setForm((p) => ({ ...p, documents: [...(p.documents || []), { name: f.name, mime: f.type, dataUrl }] }));
    } catch (err) { alert(err.message); } finally { e.target.value = ""; }
  }
  function removeDoc(i) { setForm((f) => ({ ...f, documents: f.documents.filter((_, idx) => idx !== i) })); }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      rent: Number(form.rent) || 0,
      score: Number(form.score) || 0,
      employment: { ...(form.employment || {}), income: Number(form.employment?.income) || 0 },
      pets: (form.pets || []).filter(p => p.name),
      coTenantIds: form.coTenantIds || [],
      documents: form.documents || []
    });
  }

  const otherTenants = tenants.filter(t => t.id !== initial?.id);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-stone-200 dark:border-stone-700 -mx-1 px-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${tab === t.key ? "border-stone-800 text-stone-900 dark:text-stone-100" : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-200"}`}>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Full name</label><input className="input" value={form.name} onChange={set("name")} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set("email")} required /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
          <div>
            <label className="label">Assign unit</label>
            <select className="input" value={form.unitId} onChange={pickUnit} required>
              <option value="">Choose unit...</option>
              {units.map(u => {
                const p = (u.property || {}).name || "";
                const s = u.status || (u.vacant ? "Vacant" : "Occupied");
                return <option key={u.id} value={u.id}>{p} · {u.label} ({s})</option>;
              })}
            </select>
          </div>
          <div><label className="label">Monthly rent</label><input className="input" type="number" min="0" value={form.rent} onChange={set("rent")} required /></div>
          <div><label className="label">Status</label><select className="input" value={form.status} onChange={set("status")}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Tenant score</label><input className="input" type="number" min="0" max="100" value={form.score} onChange={set("score")} /></div>
        </div>
      )}


      {tab === "emergency" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Contact name</label><input className="input" value={form.emergencyContact.name} onChange={setNested("emergencyContact", "name")} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.emergencyContact.phone} onChange={setNested("emergencyContact", "phone")} /></div>
          <div><label className="label">Relationship</label><input className="input" placeholder="e.g. Spouse" value={form.emergencyContact.rel} onChange={setNested("emergencyContact", "rel")} /></div>
        </div>
      )}

      {tab === "employment" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Employer</label><input className="input" value={form.employment.employer} onChange={setNested("employment", "employer")} /></div>
          <div><label className="label">Position</label><input className="input" value={form.employment.position} onChange={setNested("employment", "position")} /></div>
          <div><label className="label">Monthly income</label><input className="input" type="number" min="0" value={form.employment.income} onChange={setNested("employment", "income")} /></div>
        </div>
      )}

      {tab === "pets" && (
        <div className="space-y-3">
          {(form.pets || []).length === 0 && <p className="text-xs text-stone-500">No pets registered.</p>}
          {(form.pets || []).map((p, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4"><label className="label">Name</label><input className="input" value={p.name} onChange={(e) => setPet(i, "name", e.target.value)} /></div>
              <div className="col-span-4"><label className="label">Type</label>
                <select className="input" value={p.type} onChange={(e) => setPet(i, "type", e.target.value)}>
                  {["Dog","Cat","Bird","Fish","Reptile","Other"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-3"><label className="label">Pet fee (USD/mo)</label><input className="input" type="number" min="0" value={p.fee} onChange={(e) => setPet(i, "fee", e.target.value)} /></div>
              <div className="col-span-1"><button type="button" onClick={() => removePet(i)} className="h-10 w-10 grid place-items-center rounded-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button></div>
            </div>
          ))}
          <button type="button" onClick={addPet} className="btn-ghost"><Plus size={14} /> Add pet</button>
        </div>
      )}

      {tab === "co" && (
        <div className="space-y-2">
          <p className="text-xs text-stone-500">Select other tenants that share this lease.</p>
          {otherTenants.length === 0 && <p className="text-xs text-stone-500">No other tenants yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {otherTenants.map(t => {
              const on = form.coTenantIds.includes(t.id);
              return (
                <label key={t.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${on ? "border-stone-800 bg-stone-100 dark:bg-stone-800" : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/50"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleCoTenant(t.id)} className="rounded border-stone-300" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{t.name}</div>
                    <div className="text-xs text-stone-500 truncate">{t.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}


      {tab === "notes" && (
        <div>
          <label className="label">Internal notes</label>
          <textarea className="input min-h-[160px]" value={form.notes} onChange={set("notes")} placeholder="Notes about this tenant — visible only to staff." />
        </div>
      )}

      {tab === "docs" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost"><ImageIcon size={14} /> Upload document</button>
            <input ref={fileRef} type="file" className="hidden" onChange={addDoc} />
            <span className="text-xs text-stone-500">Stored locally. Max 2 MB each.</span>
          </div>
          {(form.documents || []).length === 0 && <p className="text-xs text-stone-500">No documents uploaded.</p>}
          <ul className="space-y-1">
            {(form.documents || []).map((d, i) => (
              <li key={i} className="flex items-center justify-between p-2 rounded-xl border border-stone-200 dark:border-stone-700 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <span className="text-sm truncate">{d.name}</span>
                <div className="inline-flex gap-1">
                  <a href={d.dataUrl} download={d.name} className="h-8 w-8 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Download size={14} /></a>
                  <button type="button" onClick={() => removeDoc(i)} className="h-8 w-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}


      <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-700">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Create profile"}</button>
      </div>
    </form>
  );
}

export default function Tenants() {
  const { state, dispatchAudit, nextId } = useStore();
  const { fmt } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const unitsWithProps = useMemo(() =>
    state.units.map(u => ({ ...u, property: state.properties.find(p => p.id === u.propertyId) })),
    [state.units, state.properties]
  );

  const rows = useMemo(() => {
    return state.tenants
      .map(t => ({ ...t, unit: state.units.find(u => u.id === t.unitId), property: state.properties.find(p => p.id === state.units.find(u => u.id === t.unitId)?.propertyId) }))
      .filter(t => (!q || t.name.toLowerCase().includes(q.toLowerCase()) || t.email.toLowerCase().includes(q.toLowerCase())) && (status === "All" || t.status === status))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [state.tenants, state.units, state.properties, q, status]);

  function save(payload) {
    if (edit?.id) {
      if (edit.unitId && edit.unitId !== payload.unitId) {
        const oldUnit = state.units.find(u => u.id === edit.unitId);
        if (oldUnit) dispatchAudit({ type: "UPDATE_UNIT", payload: { ...oldUnit, vacant: true, status: "Vacant" } }, { entityType: "unit", detail: oldUnit.label, log: false });
      }
      if (payload.unitId) {
        const newUnit = state.units.find(u => u.id === payload.unitId);
        if (newUnit) dispatchAudit({ type: "UPDATE_UNIT", payload: { ...newUnit, vacant: false, status: "Occupied" } }, { entityType: "unit", detail: newUnit.label, log: false });
      }
      dispatchAudit({ type: "UPDATE_TENANT", payload: { ...edit, ...payload } }, { entityType: "tenant", detail: edit.name });
    } else {
      const newTenant = { id: nextId("T", state.tenants), ...payload };
      dispatchAudit({ type: "ADD_TENANT", payload: newTenant }, { entityType: "tenant", detail: payload.name });
      if (payload.unitId) {
        const u = state.units.find(x => x.id === payload.unitId);
        if (u) dispatchAudit({ type: "UPDATE_UNIT", payload: { ...u, vacant: false, status: "Occupied" } }, { entityType: "unit", detail: u.label, log: false });
      }
    }
    setOpen(false); setEdit(null);
  }

  function del(t) {
    dispatchAudit({ type: "DELETE_TENANT", payload: t.id }, { entityType: "tenant", detail: t.name });
    if (t.unitId) {
      const u = state.units.find(x => x.id === t.unitId);
      if (u) dispatchAudit({ type: "UPDATE_UNIT", payload: { ...u, vacant: true, status: "Vacant" } }, { entityType: "unit", detail: u.label, log: false });
    }
    setConfirm(null);
  }

  return (
    <>
      <Topbar
        title="Tenants"
        subtitle="Onboard new tenants and manage profiles."
        action={<button className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Onboard Tenant</button>}
      />

      <main className="p-4 md:p-6 space-y-6">
        <div className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search by name or email..." />
          <Select className="md:w-44" value={status} onChange={setStatus} options={["All", ...STATUSES]} />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Plus} title="No tenants match" hint="Try adjusting your filters or onboard a new tenant." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Onboard Tenant</button>} />
        ) : (
          <div className="card overflow-hidden border-none shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="table-th">Tenant</th>
                    <th className="table-th">Contact</th>
                    <th className="table-th">Unit</th>
                    <th className="table-th">Rent</th>
                    <th className="table-th">Score</th>
                    <th className="table-th">Joined</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {rows.map(t => (
                    <tr key={t.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-stone-800 dark:bg-stone-700 grid place-items-center text-stone-100 text-sm font-bold shadow-sm border border-stone-700 dark:border-stone-600">
                            {initials(t.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 dark:text-stone-100 truncate">{t.name}</div>
                            <div className="text-xs text-stone-500 truncate font-light">{t.id}</div>
                            {(t.pets && t.pets.length > 0) && <div className="text-[10px] text-stone-500 inline-flex items-center gap-1 mt-0.5"><PawPrint size={10} /> {t.pets.length} pet{t.pets.length === 1 ? "" : "s"}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300"><Mail size={12} /> {t.email}</span>
                          <span className="inline-flex items-center gap-1 text-stone-500"><Phone size={12} /> {t.phone || "—"}</span>
                        </div>
                      </td>
                      <td className="table-td font-medium text-stone-800 dark:text-stone-200">{t.property?.name || "—"} · {t.unit?.label || "—"}</td>
                      <td className="table-td font-bold text-stone-900 dark:text-stone-100">{fmt(t.rent)}</td>
                      <td className="table-td">
                        <div className="inline-flex items-center gap-1 font-bold text-stone-800 dark:text-stone-200"><Star size={14} className="text-amber-500 fill-amber-400" /> {t.score}</div>
                      </td>
                      <td className="table-td text-stone-600 dark:text-stone-400">{fmtDate(t.joined)}</td>
                      <td className="table-td"><Pill className={statusClass(t.status)}>{t.status}</Pill></td>
                      <td className="table-td text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => { setEdit(t); setOpen(true); }} className="h-8 w-8 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setConfirm(t)} className="h-8 w-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
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

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit tenant" : "Onboard new tenant"} size="lg">
        <TenantForm initial={edit || undefined} units={unitsWithProps} tenants={state.tenants} onSubmit={save} onCancel={() => { setOpen(false); setEdit(null); }} />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => del(confirm)}
        title={`Delete "${confirm?.name}"?`}
        message="The tenant's leases, invoices and maintenance history will remain but may show missing references."
      />
    </>
  );
}
