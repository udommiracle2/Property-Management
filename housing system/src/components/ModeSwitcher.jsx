import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, DoorOpen, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// Lets a dual-capability account move between "my properties" and one of
// its linked tenant profiles (or between two different tenant profiles)
// without signing out. Renders nothing if this account only has one mode
// available — most accounts.
export default function ModeSwitcher({ variant = "dark" }) {
  const { user, switchMode, fetchModes } = useAuth();
  const navigate = useNavigate();
  const [modes, setModes] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchModes()
      .then((data) => { if (!cancelled) setModes(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role, user?.tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!modes || modes.tenants.length === 0) return null; // nothing to switch to

  const options = [
    { key: "admin", label: "My properties", sub: "Landlord dashboard", active: user.role === "admin" },
    ...modes.tenants.map((t) => ({
      key: `tenant:${t.tenantId}`,
      label: t.propertyName || "Tenant profile",
      sub: t.unitLabel ? `Unit ${t.unitLabel}` : "Tenant portal",
      active: user.role === "tenant" && user.tenantId === t.tenantId,
      tenantId: t.tenantId,
    })),
  ];

  async function choose(opt) {
    if (opt.active) { setOpen(false); return; }
    setBusy(true);
    try {
      await switchMode(opt.key === "admin" ? "admin" : "tenant", opt.tenantId);
      navigate(opt.key === "admin" ? "/" : "/tenant", { replace: true });
    } catch {
      // Silently ignore — the menu stays open so they can retry.
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  const light = variant === "light";

  return (
    <div className="relative px-3 pb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-60 ${
          light ? "bg-white/10 text-white hover:bg-white/20" : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
        }`}
      >
        <span className="flex-1 text-left truncate">Switch account view</span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 bottom-full mb-1 rounded-xl border border-stone-800 bg-stone-950 shadow-xl overflow-hidden z-20">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => choose(opt)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${
                opt.active ? "bg-stone-800 text-white" : "text-stone-300 hover:bg-stone-800/70"
              }`}
            >
              {opt.key === "admin" ? <Building2 size={15} /> : <DoorOpen size={15} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{opt.label}</span>
                <span className="block text-[10px] text-stone-500 truncate">{opt.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
