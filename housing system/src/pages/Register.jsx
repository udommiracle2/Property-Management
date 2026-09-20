import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, Home,
  DoorOpen, MessageSquare, Receipt, ShieldCheck
} from "lucide-react";

const PERKS = [
  { icon: DoorOpen, text: "See your lease and unit details in one place" },
  { icon: MessageSquare, text: "Message your property manager directly" },
  { icon: Receipt, text: "View and download rent receipts anytime" },
];

export default function TenantRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { tenantRegister } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await tenantRegister(name, email, password);
      navigate("/tenant");
    } catch (err) {
      setError(err.message || "Activation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-stone-50">
      {/* Decorative side panel — tenant palette, hidden on small screens */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-resident-700 via-resident-600 to-tenant-yale">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-tenant-bronze/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
              <Home size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">EstateHub</span>
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">Resident portal</p>
              <h1 className="text-3xl font-bold leading-tight">
                Everything about<br />your home, in one place.
              </h1>
            </div>
            <ul className="space-y-4">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur grid place-items-center shrink-0">
                    <Icon size={15} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck size={14} />
            Your data is encrypted and only visible to your property manager.
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-resident-600 text-white grid place-items-center">
              <Home size={18} />
            </div>
            <span className="font-bold text-lg text-stone-900">EstateHub</span>
          </div>

          <h2 className="text-2xl font-bold text-stone-900">Activate resident access</h2>
          <p className="mt-1.5 text-sm text-stone-500">
            Ask your property manager first if you haven't already been added as a tenant.
          </p>

          {error && (
            <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Full name</label>
              <div className="relative mt-1.5">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-resident-300 focus:border-resident-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Email address</label>
              <div className="relative mt-1.5">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-resident-300 focus:border-resident-400 transition"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-stone-400">Use the email your property manager has on file for you.</p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Password</label>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-resident-300 focus:border-resident-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-resident-600 hover:bg-resident-700 active:bg-resident-800 text-white text-sm font-semibold py-2.5 mt-2 transition disabled:opacity-60"
            >
              {loading ? "Activating…" : (<>Activate account <ArrowRight size={15} /></>)}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already activated?{" "}
            <Link to="/login" className="font-semibold text-resident-600 hover:text-resident-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}