import { Bell, Search, Sun, Moon, Menu, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function initials(name = "") {
  return name.split(" ").filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
}

export default function Topbar({ title, subtitle, action }) {
  const { theme, setTheme, currency, setCurrency, currencies, setMobileNavOpen } = useApp();
  const { user } = useAuth();

  return (
    <header className="h-16 glass px-4 md:px-6 flex items-center gap-3 sticky top-0 z-20">
      <button
        onClick={() => setMobileNavOpen?.(true)}
        className="md:hidden h-10 w-10 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base md:text-lg font-semibold text-[#1C3738] dark:text-stone-100 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-stone-500 truncate">{subtitle}</p>}
      </div>

      <div className="hidden lg:flex relative w-64">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input className="input pl-9" placeholder="Quick search…" readOnly title="Use page-level search filters" />
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title="Toggle theme"
        className="h-10 w-10 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="relative">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1C3738] text-sm font-semibold hover:bg-stone-50 dark:hover:bg-stone-800"
          title="Display currency"
        >
          {Object.values(currencies).map((c) => (
            <option key={c.code} value={c.code}>{c.code} · {c.symbol}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
      </div>

      <button className="relative h-10 w-10 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300" title="Notifications">
        <Bell size={18} />
      </button>

      {action}

      {/* <div className="flex items-center gap-3 pl-2 ml-1 border-l border-stone-200 dark:border-stone-800">
        <div className="h-9 w-9 rounded-full bg-stone-700 border border-stone-600 grid place-items-center text-stone-200 font-bold text-sm">
          {initials(user?.name)}
        </div>
        <div className="hidden md:block leading-tight min-w-0">
          <div className="text-sm font-semibold text-[#1C3738] dark:text-stone-100 truncate max-w-[120px]">{user?.name || "Admin"}</div>
          <div className="text-xs text-stone-500">{user?.role === "tenant" ? "Tenant" : "Admin"}</div>
        </div>
      </div> */}
    </header>
  );
}
