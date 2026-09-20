import { useMemo, useRef, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Pill } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Plus, Building2, MapPin, Pencil, Trash2, Home, DoorOpen, Image as ImageIcon, X, FileText, Archive, ArchiveRestore, ArrowUpRight } from "lucide-react";

const TYPES = ["Apartment", "Loft", "Villa", "Townhouse", "Studio", "Other"];
const UNIT_STATUSES = ["Vacant", "Occupied", "Under Maintenance", "Notice Given"];
const AMENITIES = ["Wi-Fi", "Parking", "Pool", "Gym", "Security", "Generator", "Water", "Elevator", "Furnished"];

// Read a File into a base64 data URL, capped to ~2 MB to keep localStorage usable.
function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (file.size > 2 * 1024 * 1024) return reject(new Error("File too large (max 2 MB)."));
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function PhotoGrid({ urls = [], onRemove }) {
  if (!urls.length) return <p className="text-xs text-stone-500">No photos uploaded.</p>;
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((u, i) => (
        <div key={i} className="relative group rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700">
          <img src={u} alt="" className="w-full h-24 object-cover" />
          <button type="button" onClick={() => onRemove(i)} className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded bg-white/90 text-rose-600 opacity-0 group-hover:opacity-100 transition">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function AmenityPicker({ value = [], onChange }) {
  const toggle = (a) => {
    if (value.includes(a)) onChange(value.filter(x => x !== a));
    else onChange([...value, a]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES.map(a => {
        const on = value.includes(a);
        return (
          <button type="button" key={a} onClick={() => toggle(a)} className={`pill border transition ${on ? "bg-stone-800 text-white border-stone-800" : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"}`}>
            {a}
          </button>
        );
      })}
    </div>
  );
}

function PropertyForm({ initial, owners, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", address: "", type: "Apartment", monthlyRevenue: 0, ownerId: "", ownershipPct: 100, amenities: [], photoDataUrls: [], archived: false });
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  async function addPhoto(e) {
    const files = Array.from(e.target.files || []);
    try {
      const urls = [];
      for (const f of files) urls.push(await readImage(f));
      setForm((p) => ({ ...p, photoDataUrls: [...(p.photoDataUrls || []), ...urls] }));
    } catch (err) {
      alert(err.message || "Could not load image");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, monthlyRevenue: Number(form.monthlyRevenue) || 0, ownershipPct: Number(form.ownershipPct) || 0, amenities: form.amenities || [], photoDataUrls: form.photoDataUrls || [], archived: !!form.archived }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Property name</label><input className="input" value={form.name} onChange={set("name")} required /></div>
        <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={set("address")} required /></div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={set("type")}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </div>
        <div>
          <label className="label">Monthly revenue</label>
          <input className="input" type="number" min="0" value={form.monthlyRevenue} onChange={set("monthlyRevenue")} />
        </div>
        <div>
          <label className="label">Owner</label>
          <select className="input" value={form.ownerId} onChange={set("ownerId")}>
            <option value="">— No owner —</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ownership %</label>
          <input className="input" type="number" min="0" max="100" value={form.ownershipPct} onChange={set("ownershipPct")} />
        </div>
        <div className="col-span-2">
          <label className="label">Amenities</label>
          <AmenityPicker value={form.amenities || []} onChange={(a) => setForm((f) => ({ ...f, amenities: a }))} />
        </div>
        <div className="col-span-2">
          <label className="label">Photos</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost"><ImageIcon size={14} /> Add photos</button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhoto} />
            <span className="text-xs text-stone-500">Up to 2 MB each. Stored locally.</span>
          </div>
          <div className="mt-2">
            <PhotoGrid urls={form.photoDataUrls || []} onRemove={(i) => setForm((f) => ({ ...f, photoDataUrls: f.photoDataUrls.filter((_, idx) => idx !== i) }))} />
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input id="archived" type="checkbox" checked={!!form.archived} onChange={setBool("archived")} className="h-4 w-4 rounded border-stone-300" />
          <label htmlFor="archived" className="text-sm text-stone-700 dark:text-stone-300">Archive (hide from default list)</label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button><button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Create property"}</button></div>
    </form>
  );
}

function UnitForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { label: "", bedrooms: 1, sqft: 0, rent: 0, status: "Vacant", photoDataUrls: [], floorPlanDataUrl: "" });
  const fileRef = useRef(null);
  const planRef = useRef(null);

  async function addPhoto(e) {
    try {
      const urls = [];
      for (const f of Array.from(e.target.files || [])) urls.push(await readImage(f));
      setForm((p) => ({ ...p, photoDataUrls: [...(p.photoDataUrls || []), ...urls] }));
    } catch (err) { alert(err.message); } finally { e.target.value = ""; }
  }
  async function addPlan(e) {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = await readImage(f);
      setForm((p) => ({ ...p, floorPlanDataUrl: url }));
    } catch (err) { alert(err.message); } finally { e.target.value = ""; }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        ...form,
        bedrooms: Number(form.bedrooms) || 0,
        sqft: Number(form.sqft) || 0,
        rent: Number(form.rent) || 0,
        vacant: form.status === "Vacant",
        status: form.status
      });
    }} className="grid grid-cols-2 gap-4">
      <div><label className="label">Unit label</label><input className="input" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required /></div>
      <div><label className="label">Bedrooms</label><input className="input" type="number" min="0" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} required /></div>
      <div><label className="label">Sqft</label><input className="input" type="number" min="0" value={form.sqft} onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))} /></div>
      <div><label className="label">Monthly rent (USD)</label><input className="input" type="number" min="0" value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} required /></div>
      <div className="col-span-2">
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          {UNIT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="label">Photos</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost"><ImageIcon size={14} /> Add photos</button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhoto} />
        </div>
        <div className="mt-2">
          <PhotoGrid urls={form.photoDataUrls || []} onRemove={(i) => setForm((f) => ({ ...f, photoDataUrls: f.photoDataUrls.filter((_, idx) => idx !== i) }))} />
        </div>
      </div>
      <div className="col-span-2">
        <label className="label">Floor plan</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => planRef.current?.click()} className="btn-ghost"><FileText size={14} /> Upload floor plan</button>
          <input ref={planRef} type="file" accept="image/*" className="hidden" onChange={addPlan} />
          {form.floorPlanDataUrl && <button type="button" onClick={() => setForm((f) => ({ ...f, floorPlanDataUrl: "" }))} className="text-rose-600 text-xs">Remove</button>}
        </div>
        {form.floorPlanDataUrl && <img src={form.floorPlanDataUrl} alt="floor plan" className="mt-2 max-h-40 rounded-3xl border border-stone-200 dark:border-stone-700" />}
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button><button type="submit" className="btn-primary">{initial?.id ? "Save unit" : "Add unit"}</button></div>
    </form>
  );
}

function unitStatusClass(s) {
  if (s === "Vacant") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (s === "Occupied") return "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300";
  if (s === "Under Maintenance") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  if (s === "Notice Given") return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
  return "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300";
}

export default function Properties() {
  const { state, dispatchAudit, nextId } = useStore();
  const { fmt } = useApp();
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // Units manager state
  const [manageProp, setManageProp] = useState(null);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitEdit, setUnitEdit] = useState(null);
  const [unitConfirm, setUnitConfirm] = useState(null);

  const list = useMemo(() => {
    return state.properties.filter(p => {
      const okQ = !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.address.toLowerCase().includes(q.toLowerCase());
      const okT = type === "All" || p.type === type;
      const okA = showArchived ? !!p.archived : !p.archived;
      return okQ && okT && okA;
    });
  }, [state.properties, q, type, showArchived]);

  function save(payload) {
    if (edit?.id) dispatchAudit({ type: "UPDATE_PROPERTY", payload: { ...edit, ...payload } }, { entityType: "property", detail: edit.name });
    else dispatchAudit({ type: "ADD_PROPERTY", payload: { id: nextId("P", state.properties), ...payload } }, { entityType: "property", detail: payload.name });
    setOpen(false); setEdit(null);
  }

  function saveUnit(payload) {
    if (unitEdit?.id) dispatchAudit({ type: "UPDATE_UNIT", payload: { ...unitEdit, ...payload } }, { entityType: "unit", detail: unitEdit.label });
    else dispatchAudit({
      type: "ADD_UNIT",
      payload: {
        id: nextId("U", state.units),
        propertyId: manageProp.id,
        ...payload
      }
    }, { entityType: "unit", detail: payload.label });
    setUnitOpen(false);
    setUnitEdit(null);
  }

  function deleteUnit(u) {
    const tenant = state.tenants.find(t => t.unitId === u.id);
    if (tenant) dispatchAudit({ type: "UPDATE_TENANT", payload: { ...tenant, unitId: "", status: "Past" } }, { entityType: "tenant", detail: tenant.name, log: false });
    state.leases.filter(l => l.unitId === u.id).forEach(l => {
      dispatchAudit({ type: "DELETE_LEASE", payload: l.id }, { entityType: "lease", detail: l.id, log: false });
    });
    dispatchAudit({ type: "DELETE_UNIT", payload: u.id }, { entityType: "unit", detail: u.label });
    setUnitConfirm(null);
  }

  const managedUnits = manageProp
    ? state.units.filter(u => u.propertyId === manageProp.id).sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const archivedCount = state.properties.filter(p => p.archived).length;

  return (
    <>
      <Topbar
        title="Properties"
        subtitle="Manage buildings, units, and occupancy."
        action={<button className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add Property</button>}
      />

      <main className="p-4 md:p-6 space-y-6">
        <div className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search by name or address..." />
          <div className="flex flex-wrap gap-2">
            {["All", ...TYPES].map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`pill border transition ${type === t ? "bg-stone-800 text-white border-stone-800" : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"}`}>
                {t}
              </button>
            ))}
          </div>
          {archivedCount > 0 && (
            <button onClick={() => setShowArchived(s => !s)} className={`pill border transition ${showArchived ? "bg-amber-600 text-white border-amber-600" : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700"}`}>
              <Archive size={12} /> Archived ({archivedCount})
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            hint="Add your first building to start tracking units, tenants, and rent."
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Property</button>}
          />
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {list.map(p => {
              const units = state.units.filter(u => u.propertyId === p.id);
              const occupied = units.filter(u => (u.status || (u.vacant ? "Vacant" : "Occupied")) === "Occupied").length;
              const occ = units.length ? Math.round((occupied / units.length) * 100) : 0;
              const owner = state.owners.find(o => o.id === p.ownerId);
              return (
                <article key={p.id} className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="h-32 relative overflow-hidden">
                    {p.photoDataUrls && p.photoDataUrls.length > 0 ? (
                      <img src={p.photoDataUrls[0]} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-600 to-stone-800" />
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                      </>
                    )}
                    <Pill className="absolute top-3 left-3 bg-white/90 text-stone-700 font-semibold backdrop-blur-sm">{p.type}</Pill>
                    {p.archived && <Pill className="absolute top-3 left-20 bg-amber-100 text-amber-700 font-semibold backdrop-blur-sm"><Archive size={12} /> Archived</Pill>}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex gap-1">
                      <button onClick={() => { setEdit(p); setOpen(true); }} className="h-8 w-8 grid place-items-center rounded-full bg-white/90 text-stone-700 hover:bg-white shadow-sm"><Pencil size={14} /></button>
                      <button onClick={() => setConfirm(p)} className="h-8 w-8 grid place-items-center rounded-full bg-white/90 text-rose-600 hover:bg-white shadow-sm"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-stone-900 dark:text-stone-100 truncate text-lg">{p.name}</h3>
                        <div className="mt-1 flex items-center gap-1 text-xs text-stone-500"><MapPin size={12} /> <span className="truncate">{p.address}</span></div>
                        {owner && <div className="text-xs text-stone-500 mt-1">Owner: <span className="font-semibold text-stone-700 dark:text-stone-300">{owner.name}</span> ({p.ownershipPct}%)</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-stone-400">Revenue</div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">{fmt(p.monthlyRevenue)}</div>
                      </div>
                    </div>
                    {(p.amenities && p.amenities.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {p.amenities.slice(0, 4).map(a => <span key={a} className="pill bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 text-[10px] border-stone-200 dark:border-stone-700">{a}</span>)}
                        {p.amenities.length > 4 && <span className="pill bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 text-[10px] border-stone-200 dark:border-stone-700">+{p.amenities.length - 4}</span>}
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1.5">
                        <span className="font-medium">Occupancy</span>
                        <span className="font-bold">{occupied}/{units.length} units · {occ}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        <div className="h-full bg-stone-800 dark:bg-stone-200 transition-all duration-500" style={{ width: `${occ}%` }} />
                      </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-1 text-xs text-stone-500 font-medium"><Building2 size={12} /> {units.length} units</div>
                      <button className="text-xs font-bold text-stone-800 dark:text-stone-200 hover:text-stone-600 dark:hover:text-stone-400 transition-all flex items-center gap-1" onClick={() => setManageProp(p)}>Manage units <ArrowUpRight size={12} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Property add/edit */}
      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit property" : "Add property"} size="lg">
        <PropertyForm initial={edit || undefined} owners={state.owners} onSubmit={save} onCancel={() => { setOpen(false); setEdit(null); }} />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { dispatchAudit({ type: "DELETE_PROPERTY", payload: confirm.id }, { entityType: "property", detail: confirm.name }); setConfirm(null); }}
        title={`Delete "${confirm?.name}"?`}
        message="All units and related data under this property will also be removed."
      />

      {/* Units manager modal */}
      <Modal
        open={!!manageProp}
        onClose={() => { setManageProp(null); setUnitOpen(false); setUnitEdit(null); }}
        title={manageProp ? `Units — ${manageProp.name}` : "Units"}
        subtitle="Add, edit, or remove units for this property."
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => { setUnitEdit(null); setUnitOpen(true); }}>
              <Plus size={16} /> Add unit
            </button>
          </div>

          {managedUnits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <DoorOpen className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">No units yet. Add the first unit for this property.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="table-th">Label</th>
                    <th className="table-th">Beds</th>
                    <th className="table-th">Sqft</th>
                    <th className="table-th">Rent</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {managedUnits.map(u => {
                    const status = u.status || (u.vacant ? "Vacant" : "Occupied");
                    return (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="table-td font-semibold text-stone-900 dark:text-stone-100">{u.label}</td>
                        <td className="table-td">{u.bedrooms}</td>
                        <td className="table-td">{u.sqft || "—"}</td>
                        <td className="table-td font-bold text-stone-900 dark:text-stone-100">{fmt(u.rent)}</td>
                        <td className="table-td"><Pill className={unitStatusClass(status)}>{status}</Pill></td>
                        <td className="table-td text-right">
                          <div className="inline-flex gap-1">
                            <button onClick={() => { setUnitEdit(u); setUnitOpen(true); }} className="h-8 w-8 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => setUnitConfirm(u)} className="h-8 w-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Unit add/edit form (nested) */}
      <Modal
        open={unitOpen}
        onClose={() => { setUnitOpen(false); setUnitEdit(null); }}
        title={unitEdit?.id ? "Edit unit" : "Add unit"}
        size="lg"
      >
        <UnitForm
          initial={unitEdit || undefined}
          onSubmit={saveUnit}
          onCancel={() => { setUnitOpen(false); setUnitEdit(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!unitConfirm}
        onCancel={() => setUnitConfirm(null)}
        onConfirm={() => deleteUnit(unitConfirm)}
        title={`Delete unit "${unitConfirm?.label}"?`}
        message="Related leases will be removed and any tenant on this unit will be unassigned."
      />
    </>
  );
}
