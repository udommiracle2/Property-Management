import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Building2, Home, CreditCard, Wrench, MessageSquare, FileText, LogOut, X, UserX } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import DeleteAccountModal from "./DeleteAccountModal.jsx";
import ModeSwitcher from "./ModeSwitcher.jsx";

const links = [
  { to: "/tenant", label: "Home", icon: Home },
  { to: "/tenant/payments", label: "Invoices & Receipts", icon: CreditCard },
  { to: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { to: "/tenant/lease", label: "My lease", icon: FileText }
];

function TenantNav({ onNavigate }) {
  return <nav className="flex-1 px-3 py-5 space-y-1">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/tenant"} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? "bg-resident-600 text-white shadow-lg shadow-resident-900/30" : "text-stone-400 hover:bg-stone-800 hover:text-white"}`}><Icon size={18} />{label}</NavLink>)}</nav>;
}

function TenantProfile() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const signOut = () => { logout(); navigate("/login", { replace: true }); };
  return <div className="px-3 py-3 border-t border-stone-800"><div className="flex items-center gap-3 px-3 py-2 mb-1"><div className="h-9 w-9 rounded-full bg-resident-600/20 border border-resident-400/30 text-resident-200 grid place-items-center font-bold text-xs">{user?.name?.split(" ").map(x => x[0]).slice(0, 2).join("") || "TE"}</div><div className="min-w-0"><div className="text-sm font-semibold truncate">{user?.name}</div><div className="text-xs text-stone-500">Tenant portal</div></div></div><ModeSwitcher variant="light" /><button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-rose-500/10"><LogOut size={17} />Sign out</button><button onClick={() => setDeleteOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-600 hover:text-rose-400 hover:bg-rose-500/10"><UserX size={15} />Delete account</button><DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} /></div>;
}

export default function TenantSidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useApp();
  const brand = <div className="h-20 px-6 flex items-center gap-3 border-b border-stone-800"><div className="h-10 w-10 rounded-2xl bg-resident-600 grid place-items-center shadow-lg shadow-resident-900/30"><Building2 size={20} /></div><div><div className="font-bold tracking-tight">EstateHub</div><div className="text-[10px] text-resident-300 uppercase tracking-[.18em]">Resident portal</div></div></div>;
  return <><aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col bg-[#003D5B] text-white">{brand}<TenantNav /><TenantProfile /></aside>{mobileNavOpen && <div className="md:hidden fixed inset-0 z-40"><div onClick={() => setMobileNavOpen(false)} className="absolute inset-0 bg-[#003D5B]/60" /><aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#003D5B] text-white flex flex-col"><div className="flex items-center justify-between border-b border-stone-800">{brand}<button onClick={() => setMobileNavOpen(false)} className="mr-4 p-2"><X size={18} /></button></div><TenantNav onNavigate={() => setMobileNavOpen(false)} /><TenantProfile /></aside></div>}</>;
}
