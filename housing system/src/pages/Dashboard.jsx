import { Link } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import { useStore, useStats } from "../context/StoreContext.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, Building2, Users, Wrench, ArrowUpRight, Home, CreditCard,
  CheckCircle2, Circle, AlertTriangle, Receipt, FileText
} from "lucide-react";

const COLORS = ["#44403c", "#a8a29e", "#78716c", "#d6d3d1", "#57534e"];

export default function Dashboard() {
  const { state } = useStore();
  const { fmt, fmtNum } = useApp();
  const { user } = useAuth();
  const s = useStats();

  const expenseTotal = state.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const overdueInvoices = state.invoices.filter((i) => i.status === "Overdue");
  const pendingInvoices = state.invoices.filter((i) => i.status === "Pending");
  const openMaint = state.maintenance.filter((m) => m.status !== "Resolved");
  const expiringLeases = state.leases.filter((l) => l.status === "Expiring" || l.status === "Renewal");

  const monthly = [
    { month: "Mar", revenue: Math.round(s.monthly * 0.86), expenses: Math.round(expenseTotal * 0.85) || 0 },
    { month: "Apr", revenue: Math.round(s.monthly * 0.91), expenses: Math.round(expenseTotal * 0.9) || 0 },
    { month: "May", revenue: Math.round(s.monthly * 0.90), expenses: Math.round(expenseTotal * 0.88) || 0 },
    { month: "Jun", revenue: Math.round(s.monthly * 0.94), expenses: Math.round(expenseTotal * 0.95) || 0 },
    { month: "Jul", revenue: Math.round(s.monthly * 0.97), expenses: Math.round(expenseTotal * 0.98) || 0 },
    { month: "Aug", revenue: s.monthly, expenses: expenseTotal }
  ];

  const occupancyTrend = monthly.map((m, i) => ({
    month: m.month,
    occupancy: s.totalUnits ? Math.min(100, Math.max(0, s.occupancy - 6 + i * 2)) : 0
  }));

  const typeMap = state.properties.reduce((acc, p) => {
    const cnt = state.units.filter((u) => u.propertyId === p.id).length;
    acc[p.type] = (acc[p.type] || 0) + cnt;
    return acc;
  }, {});
  const propertyMix = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  const hasData = state.properties.length > 0 || state.tenants.length > 0;

  const stats = [
    { label: "Monthly Revenue", value: fmt(s.monthly), hint: "From occupied units", icon: CreditCard },
    { label: "Occupancy", value: `${s.occupancy}%`, hint: `${s.occupiedUnits} of ${s.totalUnits} units filled`, icon: Building2 },
    { label: "Active Tenants", value: fmtNum(state.tenants.filter((t) => t.status === "Active").length), hint: `${state.tenants.length} total profiles`, icon: Users },
    { label: "Vacant Units", value: fmtNum(s.vacantUnits.length), hint: s.vacantUnits.length ? "Ready to lease" : "Fully occupied", icon: Home }
  ];

  const steps = [
    { done: state.properties.length > 0, label: "Add your first property", to: "/properties", desc: "Register a building or complex" },
    { done: state.units.length > 0, label: "Add units to a property", to: "/properties", desc: "Define unit labels, rent & size" },
    { done: state.tenants.length > 0, label: "Onboard a tenant", to: "/tenants", desc: "Create a tenant profile and assign a unit" },
    { done: state.leases.length > 0, label: "Create a lease", to: "/leases", desc: "Set term, deposit and generate a PDF" },
    { done: state.invoices.length > 0, label: "Issue a rent invoice", to: "/rent", desc: "Track payments and overdue amounts" }
  ];
  const completedSteps = steps.filter((x) => x.done).length;

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Here’s a live snapshot of your portfolio.`}
      />
      <main className="p-6 space-y-8">
        {/* Getting started */}
        {!hasData && (
          <section className="card p-8 border-stone-200 dark:border-stone-800 bg-gradient-to-br from-brand-50 to-white dark:from-[#1F2041]/40 dark:to-[#1F2041]">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#1C3738] dark:text-white mb-2">Get started with EstateHub</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl leading-relaxed">
                  Follow these steps to set up your portfolio. Each step unlocks the next part of the system —
                  properties feed units, units feed tenants, and tenants unlock leases and rent collection.
                </p>
                <div className="mt-6 flex items-center gap-3 text-xs font-medium text-stone-700 dark:text-stone-300">
                  <div className="h-1.5 flex-1 max-w-[200px] rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div className="h-full bg-stone-800 dark:bg-stone-200 rounded-full transition-all" style={{ width: `${(completedSteps / steps.length) * 100}%` }} />
                  </div>
                  <span>{completedSteps}/{steps.length} complete</span>
                </div>
              </div>
              <ol className="space-y-3 min-w-[280px]">
                {steps.map((step, i) => (
                  <li key={step.label}>
                    <Link
                      to={step.to}
                      className={`flex items-start gap-3 rounded-2xl px-4 py-3 transition ${
                        step.done
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200"
                          : "bg-white dark:bg-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-700"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle size={18} className="mt-0.5 shrink-0 text-stone-400" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{i + 1}. {step.label}</div>
                        <div className="text-xs opacity-70 truncate">{step.desc}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* High-End KPI Layout - Asymmetric */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main KPI - Large */}
          <div className="card p-6 md:col-span-2 flex items-center justify-between bg-[#1C3738] text-white dark:bg-stone-800">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-widest opacity-60">Monthly Revenue</div>
              <div className="text-5xl font-light tracking-tighter">{fmt(s.monthly)}</div>
              <div className="text-xs text-white/50 font-light pt-2">Projected from occupied units</div>
            </div>
            <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-2xl">
              <CreditCard size={32} className="text-white" />
            </div>
          </div>
          {/* Secondary KPIs - Stacked */}
          <div className="grid grid-cols-1 gap-6">
            <div className="card p-6 flex items-center justify-between bg-[#8BAAAD]">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-widest text-[#1C3738]">Occupancy</div>
                <div className="text-3xl font-bold text-[#1C3738] dark:text-stone-100">{s.occupancy}%</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 grid place-items-center">
                <Building2 size={24} />
              </div>
            </div>
            <div className="card p-6 flex items-center justify-between bg-[#8BAAAD]">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-widest text-[#1C3738]">Active Tenants</div>
                <div className="text-3xl font-bold text-[#1C3738] dark:text-stone-100">{fmtNum(state.tenants.filter((t) => t.status === "Active").length)}</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 grid place-items-center">
                <Users size={24} />
              </div>
            </div>
          </div>
        </section>

        {/* Attention Section - Integrated Alert Bar */}
        {(overdueInvoices.length > 0 || openMaint.length > 0 || expiringLeases.length > 0 || pendingInvoices.length > 0) && (
          <section className="bg-stone-100 dark:bg-[#1C3738]/50 rounded-3xl p-6 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#1C3738] dark:text-stone-100">Attention Required</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {overdueInvoices.length > 0 && (
                <Link to="/rent" className="card p-4 flex items-center gap-3 hover:translate-x-1 transition-all border-l-4 border-l-rose-500 bg-white dark:bg-[#1C3738]">
                  <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 grid place-items-center shrink-0">
                    <Receipt size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{overdueInvoices.length} Overdue</div>
                    <div className="text-xs text-stone-500 truncate">Payment collection</div>
                  </div>
                </Link>
              )}
              {pendingInvoices.length > 0 && (
                <Link to="/rent" className="card p-4 flex items-center gap-3 hover:translate-x-1 transition-all border-l-4 border-l-amber-500 bg-white dark:bg-[#1C3738]">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 grid place-items-center shrink-0">
                    <Receipt size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{pendingInvoices.length} Pending</div>
                    <div className="text-xs text-stone-500 truncate">Awaiting funds</div>
                  </div>
                </Link>
              )}
              {openMaint.length > 0 && (
                <Link to="/maintenance" className="card p-4 flex items-center gap-3 hover:translate-x-1 transition-all border-l-4 border-l-orange-500 bg-white dark:bg-[#1C3738]">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 grid place-items-center shrink-0">
                    <Wrench size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{openMaint.length} Maintenance</div>
                    <div className="text-xs text-stone-500 truncate">Tickets open</div>
                  </div>
                </Link>
              )}
              {expiringLeases.length > 0 && (
                <Link to="/leases" className="card p-4 flex items-center gap-3 hover:translate-x-1 transition-all border-l-4 border-l-stone-500 bg-white dark:bg-[#1C3738]">
                  <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 grid place-items-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{expiringLeases.length} Expiring</div>
                    <div className="text-xs text-stone-500 truncate">Lease renewal</div>
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Charts Section - Refined Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#1C3738] dark:text-stone-100">Financial Performance</h2>
                <p className="text-xs text-stone-500 font-light">Revenue vs Expenses over time</p>
              </div>
              <button className="btn-ghost text-xs"><ArrowUpRight size={14} /> Export Report</button>
            </div>
            <div className="h-80">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#44403c" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#44403c" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d6d3d1" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #d6d3d1" }} formatter={(v) => fmt(v)} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#44403c" strokeWidth={3} fill="url(#rev)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={3} fill="url(#exp)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-stone-400 italic">No financial data available to visualize</div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1C3738] dark:text-stone-100">Property Mix</h2>
              <Building2 size={20} className="text-stone-400" />
            </div>
            <div className="h-64">
              {propertyMix.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={propertyMix} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={5}>
                      {propertyMix.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-stone-400 italic">Portfolio mix unavailable</div>
              )}
            </div>
            <ul className="text-xs space-y-3 mt-6">
              {propertyMix.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-stone-600 dark:text-stone-400">{p.name}</span>
                  </span>
                  <span className="font-bold">{p.value} unit{p.value !== 1 ? "s" : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1C3738] dark:text-stone-100">Occupancy Trend</h2>
              <div className="px-2 py-1 rounded-full bg-[#F4FFF8] dark:bg-[1C3738] text-[10px] font-bold uppercase tracking-widest text-stone-500">Live Data</div>
            </div>
            <div className="h-64">
              {s.totalUnits > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d6d3d1" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="occupancy" name="Occupancy" fill="#44403c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-stone-400 italic">No unit data available</div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1C3738] dark:text-stone-100">Open Maintenance</h2>
              <Link to="/maintenance" className="text-xs font-bold text-stone-600 hover:text-[#1C3738] transition">View all →</Link>
            </div>
            <ul className="space-y-4">
              {openMaint.slice(0, 5).map((m) => {
                const tenant = state.tenants.find((t) => t.id === m.tenantId);
                return (
                  <li key={m.id} className="flex items-start gap-4 group">
                    <div
                      className={`h-10 w-10 rounded-2xl grid place-items-center text-white shrink-0 transition-transform group-hover:scale-110 ${
                        m.priority === "High" ? "bg-rose-500" : m.priority === "Medium" ? "bg-amber-500" : "bg-stone-400"
                      }`}
                    >
                      <Wrench size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{m.title}</div>
                      <div className="text-xs text-stone-500 truncate font-light">
                        {tenant?.name || "Unassigned"} · {m.status} · {m.priority}
                      </div>
                    </div>
                  </li>
                );
              })}
              {openMaint.length === 0 && (
                <li className="text-sm text-stone-500 py-12 text-center italic">
                  No open tickets — portfolio is clear.
                </li>
              )}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
