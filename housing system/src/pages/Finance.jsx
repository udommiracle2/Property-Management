import Topbar from "../components/Topbar.jsx";
import { expenses, monthly } from "../data.js";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Download, TrendingUp, Wallet, ArrowDownRight } from "lucide-react";

const COLORS = ["#2f7bff", "#19a979", "#f59e0b", "#a855f7", "#0ea5e9", "#f43f5e"];

const byCategory = Object.values(
  expenses.reduce((acc, e) => {
    acc[e.category] = acc[e.category] || { name: e.category, value: 0 };
    acc[e.category].value += e.amount;
    return acc;
  }, {})
);

export default function Finance() {
  const totalIncome = monthly[monthly.length - 1].revenue;
  const totalExpense = monthly[monthly.length - 1].expenses;
  const net = totalIncome - totalExpense;

  return (
    <>
      <Topbar
        title="Finance"
        subtitle="Income, expenses, and profitability reports."
        action={<button className="btn-ghost"><Download size={14} /> Download Report</button>}
      />
      <main className="p-4 md:p-6 space-y-5">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-xs text-slate-500">Total Income (Aug)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">${totalIncome.toLocaleString()}</div>
            <div className="mt-2 text-xs text-emerald-600 inline-flex items-center gap-1 font-semibold">
              <TrendingUp size={12} /> +11.7% vs July
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-slate-500">Total Expenses (Aug)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">${totalExpense.toLocaleString()}</div>
            <div className="mt-2 text-xs text-rose-600 inline-flex items-center gap-1 font-semibold">
              <ArrowDownRight size={12} /> +4.7% vs July
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-slate-500">Net Operating Income</div>
            <div className="text-2xl font-bold text-brand-700 mt-1">${net.toLocaleString()}</div>
            <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
              <Wallet size={12} /> Margin {Math.round((net/totalIncome)*100)}%
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">Cash Flow</h2>
                <p className="text-xs text-slate-500">Income vs Expenses · 6 months</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="revenue"  name="Income"   fill="#2f7bff" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">Expense Breakdown</h2>
                <p className="text-xs text-slate-500">By category · July</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={40} iconType="circle" />
                  <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Expenses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Description</th>
                  <th className="table-th text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="table-td">{e.date}</td>
                    <td className="table-td"><span className="pill bg-slate-100 text-slate-700">{e.category}</span></td>
                    <td className="table-td">{e.description}</td>
                    <td className="table-td text-right font-semibold">${e.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
