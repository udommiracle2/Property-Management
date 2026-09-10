// import { useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import {
//   LayoutDashboard, Building2, Users, FileText, Receipt, Wallet,
//   Wrench, MessageSquare, X, LogOut, RefreshCw, User, Briefcase, UserX
// } from "lucide-react";
// import { useApp } from "../context/AppContext.jsx";
// import { useStore } from "../context/StoreContext.jsx";
// import { useAuth } from "../context/AuthContext.jsx";
// import DeleteAccountModal from "./DeleteAccountModal.jsx";

// const nav = [
//   { to: "/",            label: "Dashboard",   icon: LayoutDashboard },
//   { to: "/properties",  label: "Properties",  icon: Building2 },
//   { to: "/tenants",     label: "Tenants",     icon: Users },
//   { to: "/leases",      label: "Leases",      icon: FileText },
//   { to: "/rent",        label: "Rent",        icon: Receipt },
//   { to: "/expenses",    label: "Expenses",    icon: Wallet },
//   { to: "/maintenance", label: "Maintenance", icon: Wrench },
//   { to: "/messages",    label: "Messages",    icon: MessageSquare },
//   { to: "/owners",      label: "Owners",      icon: User },
//   { to: "/vendors",     label: "Vendors",     icon: Briefcase }
// ];

// function NavList({ onNavigate }) {
//   return (
//     <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
//       {nav.map((item) => {
//         const Icon = item.icon;
//         return (
//           <NavLink
//             key={item.to}
//             to={item.to}
//             end={item.to === "/"}
//             onClick={onNavigate}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
//                 isActive
//                   ? "bg-stone-800 text-white shadow-inner"
//                   : "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200"
//               }`
//             }
//           >
//             <Icon size={18} />
//             <span>{item.label}</span>
//           </NavLink>
//         );
//       })}
//     </nav>
//   );
// }

// function initials(name = "") {
//   return name.split(" ").filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
// }

// export default function Sidebar() {
//   const { mobileNavOpen, setMobileNavOpen } = useApp();
//   const { dispatch } = useStore();
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [deleteOpen, setDeleteOpen] = useState(false);

//   function reset() {
//     if (confirm("Clear all portfolio data? Properties, tenants, leases, invoices and messages will be permanently removed. Your admin account stays.")) {
//       dispatch({ type: "RESET" });
//       navigate("/");
//     }
//   }

//   function signOut() {
//     logout();
//     navigate("/login", { replace: true });
//   }

//   return (
//     <>
//       {/* Desktop */}
//       <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col bg-stone-950 text-white border-r border-stone-800">
//         <div className="h-20 flex items-center gap-3 px-6 border-b border-stone-800 bg-stone-950/50 backdrop-blur-md sticky top-0 z-10">
//           <div className="h-10 w-10 rounded-2xl bg-stone-800 border border-stone-700 grid place-items-center shadow-sm">
//             <Building2 size={20} className="text-stone-200" />
//           </div>
//           <div className="flex flex-col">
//             <div className="font-bold text-base leading-tight tracking-tight">EstateHub</div>
//           </div>
//         </div>

//         <NavList />

//         <div className="px-3 py-3 border-t border-stone-800 space-y-1 bg-stone-950/50">
//           {user && (
//             <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-stone-900/50 border border-stone-800">
//               <div className="h-9 w-9 rounded-full bg-stone-700 border border-stone-600 grid place-items-center text-stone-200 text-xs font-bold shrink-0">
//                 {initials(user.name)}
//               </div>
//               <div className="min-w-0">
//                 <div className="text-sm font-semibold truncate">{user.name}</div>
//                 <div className="text-xs text-stone-500 truncate">{user.email}</div>
//               </div>
//             </div>
//           )}
//           <button onClick={reset} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition">
//             <RefreshCw size={18} /> Clear portfolio data
//           </button>
//           <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition">
//             <LogOut size={18} /> Sign out
//           </button>
//           <button onClick={() => setDeleteOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-600 hover:text-rose-400 hover:bg-rose-500/10 transition">
//             <UserX size={15} /> Delete account
//           </button>
//         </div>
//       </aside>

//       {/* Mobile drawer */}
//       {mobileNavOpen && (
//         <div className="md:hidden fixed inset-0 z-40">
//           <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
//           <aside className="absolute left-0 top-0 bottom-0 w-72 bg-stone-950 text-white flex flex-col animate-slide-up border-r border-stone-800">
//             <div className="h-16 flex items-center justify-between px-5 border-b border-stone-800">
//               <div className="flex items-center gap-2">
//                 <div className="h-9 w-9 rounded-xl bg-stone-800 border border-stone-700 grid place-items-center">
//                   <Building2 size={18} className="text-stone-200" />
//                 </div>
//                 <div className="font-bold">EstateHub</div>
//               </div>
//               <button onClick={() => setMobileNavOpen(false)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-stone-800">
//                 <X size={18} />
//               </button>
//             </div>
//             <NavList onNavigate={() => setMobileNavOpen(false)} />
//             <div className="px-3 py-3 border-t border-stone-800 space-y-1 bg-stone-950/50">
//               {user && (
//                 <div className="flex items-center gap-3 px-3 py-2.5">
//                   <div className="h-9 w-9 rounded-full bg-stone-700 border border-stone-600 grid place-items-center text-stone-200 text-xs font-bold">
//                     {initials(user.name)}
//                   </div>
//                   <div className="min-w-0">
//                     <div className="text-sm font-semibold truncate">{user.name}</div>
//                     <div className="text-xs text-stone-500 truncate">{user.email}</div>
//                   </div>
//                 </div>
//               )}
//               <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10">
//                 <LogOut size={18} /> Sign out
//               </button>
//               <button onClick={() => setDeleteOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-600 hover:text-rose-400 hover:bg-rose-500/10">
//                 <UserX size={15} /> Delete account
//               </button>
//             </div>
//           </aside>
//         </div>
//       )}
//       <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
//     </>
//   );
// }











import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, FileText, Receipt, Wallet,
  Wrench, MessageSquare, X, LogOut, RefreshCw, User, Briefcase, UserX,
  ChevronDown, RefreshCcw
} from "lucide-react";
import { useApp, CURRENCIES } from "../context/AppContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import DeleteAccountModal from "./DeleteAccountModal.jsx";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/leases", label: "Leases", icon: FileText },
  { to: "/rent", label: "Rent", icon: Receipt },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/owners", label: "Owners", icon: User },
  { to: "/vendors", label: "Vendors", icon: Briefcase }
];

function NavList({ onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                ? "bg-stone-800 text-white shadow-inner"
                : "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200"
              }`
            }
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function CurrencySwitcher() {
  const { currency, setCurrency, ratesLoading, ratesError, fetchRates } = useApp();
  const current = CURRENCIES[currency] || CURRENCIES.NGN;
  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Currency</span>
        {ratesLoading && <span className="text-[10px] text-stone-500 animate-pulse">Fetching rates…</span>}
        {ratesError && !ratesLoading && (
          <button onClick={fetchRates} className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <RefreshCcw size={10} /> Retry
          </button>
        )}
      </div>
      <div className="relative">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full appearance-none bg-stone-900 border border-stone-700 text-stone-200 text-sm rounded-xl px-3 py-2 pr-8 cursor-pointer hover:border-stone-600 transition focus:outline-none focus:ring-2 focus:ring-stone-600"
        >
          {Object.values(CURRENCIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code} — {c.name}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
      </div>
      {ratesError && (
        <p className="text-[10px] text-amber-400/80 mt-1">Using fallback rates — live rates unavailable</p>
      )}
    </div>
  );
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "AD";
}

export default function Sidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useApp();
  const { dispatch } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function reset() {
    if (confirm("Clear all portfolio data? Properties, tenants, leases, invoices and messages will be permanently removed. Your admin account stays.")) {
      dispatch({ type: "RESET" });
      navigate("/");
    }
  }

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col bg-stone-950 text-white border-r border-stone-800">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-stone-800 bg-stone-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="h-10 w-10 rounded-2xl bg-stone-800 border border-stone-700 grid place-items-center shadow-sm">
            <Building2 size={20} className="text-stone-200" />
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-base leading-tight tracking-tight">EstateHub</div>
          </div>
        </div>

        <NavList />

        <div className="px-3 py-3 border-t border-stone-800 space-y-1 bg-stone-950/50">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-stone-900/50 border border-stone-800">
              <div className="h-9 w-9 rounded-full bg-stone-700 border border-stone-600 grid place-items-center text-stone-200 text-xs font-bold shrink-0">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{user.name}</div>
                <div className="text-xs text-stone-500 truncate">{user.email}</div>
              </div>
            </div>
          )}
          <CurrencySwitcher />
          <button onClick={reset} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition">
            <RefreshCw size={18} /> Clear portfolio data
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition">
            <LogOut size={18} /> Sign out
          </button>
          <button onClick={() => setDeleteOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-600 hover:text-rose-400 hover:bg-rose-500/10 transition">
            <UserX size={15} /> Delete account
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-stone-950 text-white flex flex-col animate-slide-up border-r border-stone-800">
            <div className="h-16 flex items-center justify-between px-5 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-stone-800 border border-stone-700 grid place-items-center">
                  <Building2 size={18} className="text-stone-200" />
                </div>
                <div className="font-bold">EstateHub</div>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-stone-800">
                <X size={18} />
              </button>
            </div>
            <NavList onNavigate={() => setMobileNavOpen(false)} />
            <div className="px-3 py-3 border-t border-stone-800 space-y-1 bg-stone-950/50">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-9 w-9 rounded-full bg-stone-700 border border-stone-600 grid place-items-center text-stone-200 text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{user.name}</div>
                    <div className="text-xs text-stone-500 truncate">{user.email}</div>
                  </div>
                </div>
              )}
              <CurrencySwitcher />
              <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10">
                <LogOut size={18} /> Sign out
              </button>
              <button onClick={() => setDeleteOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-600 hover:text-rose-400 hover:bg-rose-500/10">
                <UserX size={15} /> Delete account
              </button>
            </div>
          </aside>
        </div>
      )}
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </>
  );
}