import { useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { Modal, ConfirmDialog, EmptyState, SearchBar, Select, Pill, fmtDate } from "./_shared.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Plus, Wallet, Pencil, Trash2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CATEGORIES = ["Maintenance", "Utilities", "Insurance", "Admin", "Marketing", "Taxes", "Other"];
const COLORS = ["#44403c", "#a8a29e", "#78716c", "#d6d3d1", "#57534e", "#44403c", "#a8a29e"];

function ExpenseForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || { date: new Date().toISOString().slice(0,10), category: "Maintenance", description: "", amount: 0 });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount)||0 }); }} className="grid grid-cols-2 gap-4">
      <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={set("date")} required /></div>
      <div><label className="label">Category</label><select className="input" value={form.category} onChange={set("category")}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="col-span-2"><label className="label">Description</label><input className="input" placeholder="e.g. Plumbing repair — Sunset 3" value={form.description} onChange={set("description")} required /></div>
      <div className="col-span-2"><label className="label">Amount</label><input className="input" type="number" min="0" value={form.amount} onChange={set("amount")} required /></div>
      <div className="col-span-2 flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">{initial?.id ? "Save changes" : "Add expense"}</button>
      </div>
    </form>
  );
}

export default function Expenses() {
  const { state, dispatch, nextId } = useStore();
  const { fmt } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => state.expenses
    .filter(e => (!q || e.description.toLowerCase().includes(q.toLowerCase())) && (cat === "All" || e.category === cat))
    .sort((a,b) => b.date.localeCompare(a.date)),
  [state.expenses, q, cat]);

  const byCat = useMemo(() => Object.values(
    state.expenses.reduce((a, e) => { a[e.category] = a[e.category] || { name: e.category, value: 0 }; a[e.category].value += e.amount; return a; }, {})
  ), [state.expenses]);

  const total = rows.reduce((s, e) => s + e.amount, 0);

  function save(payload) {
    if (edit?.id) dispatch({ type: "UPDATE_EXPENSE", payload: { ...edit, ...payload } });
    else dispatch({ type: "ADD_EXPENSE", payload: { id: nextId("E", state.expenses), ...payload } });
    setOpen(false); setEdit(null);
  }

  return (
    <>
      <Topbar
        title="Expenses"
        subtitle="Track operating costs across your portfolio."
        action={<button className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add Expense</button>}
      />
      <main className="p-4 md:p-6 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-1 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Total Spending (filtered)</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100 mt-2">{fmt(total)}</div>
            <div className="mt-2 text-sm text-stone-500 font-light">{rows.length} expense{rows.length === 1 ? "" : "s"} recorded</div>
          </div>
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Spending Breakdown</h2>
                <p className="text-xs text-stone-500 font-light">Distribution by category</p>
              </div>
              <Wallet size={20} className="text-stone-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={5}>
                    {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 16, border: "1px solid #d6d3d1" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search expenses..." />
          <Select className="md:w-44" value={cat} onChange={setCat} options={["All", ...CATEGORIES]} />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Wallet} title="No expenses yet" hint="Log an expense to keep your books tidy." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Expense</button>} />
        ) : (
          <div className="card overflow-hidden border-none shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-stone-50 dark:bg-stone-800/50">
                  <tr>
                    <th className="table-th">Date</th>
                    <th className="table-th">Category</th>
                    <th className="table-th">Description</th>
                    <th className="table-th text-right">Amount</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {rows.map(e => (
                    <tr key={e.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                      <td className="table-td text-stone-600 dark:text-stone-400 font-medium">{fmtDate(e.date)}</td>
                      <td className="table-td"><Pill className="bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700">{e.category}</Pill></td>
                      <td className="table-td text-stone-900 dark:text-stone-100">{e.description}</td>
                      <td className="table-td text-right font-bold text-stone-900 dark:text-stone-100">{fmt(e.amount)}</td>
                      <td className="table-td text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => { setEdit(e); setOpen(true); }} className="h-8 w-8 grid place-items-center rounded-lg text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setConfirm(e)} className="h-8 w-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 size={14} /></button>
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

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null); }} title={edit?.id ? "Edit expense" : "Add expense"} size="lg">
        <ExpenseForm initial={edit || undefined} onSubmit={save} onCancel={() => { setOpen(false); setEdit(null); }} />
      </Modal>

      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: "DELETE_EXPENSE", payload: confirm.id }); setConfirm(null); }} title={`Delete expense?`} message={confirm?.description} />
    </>
  );
}
