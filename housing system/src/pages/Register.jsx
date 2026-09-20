import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2, Home } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  const passwordHints = [
    { ok: form.password.length >= 6, label: "At least 6 characters" },
    { ok: form.password === form.confirm && form.confirm.length > 0, label: "Passwords match" }
  ];

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-stone-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden text-white bg-black">
        <img
          src="/images/luxury-architecture.jpg"
          alt="Luxury Architecture"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 border border-white/10 backdrop-blur grid place-items-center">
              <Home size={22} />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">EstateHub</div>
              <div className="text-xs text-white/50">Property Management</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="max-w-md">
              <h1 className="text-3xl font-bold leading-tight tracking-tight">
                Create your admin<br />workspace in seconds.
              </h1>
              <p className="mt-4 text-white/60 text-sm leading-relaxed">
                One account controls your entire portfolio — properties, units, tenants,
                leases, rent collection, maintenance, and expenses.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {[
                { n: "Properties", d: "Buildings & units" },
                { n: "Tenants", d: "Profiles & scores" },
                { n: "Leases", d: "PDF agreements" },
                { n: "Finance", d: "Rent & expenses" }
              ].map((c) => (
                <div key={c.n} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                  <div className="font-semibold text-sm">{c.n}</div>
                  <div className="text-xs text-white/45 mt-0.5">{c.d}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/35">© {new Date().getFullYear()} EstateHub · Admin portal</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl bg-slate-900 grid place-items-center text-white">
              <Home size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">EstateHub</div>
              <div className="text-xs text-slate-500">Property Management</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Create admin account</h2>
            <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
              Register as a property manager to start tracking your portfolio.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  className="input pl-9"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={set("name")}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Work email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  className="input pl-9"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set("email")}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  className="input pl-9 pr-10"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={set("password")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  className="input pl-9"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  required
                />
              </div>
              <ul className="mt-2 space-y-1">
                {passwordHints.map((h) => (
                  <li key={h.label} className={`flex items-center gap-1.5 text-xs ${h.ok ? "text-emerald-600" : "text-slate-400"}`}>
                    <CheckCircle2 size={12} /> {h.label}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-brand-700 text-white hover:bg-brand-800 active:scale-[0.98] transition mt-1 disabled:opacity-60"
            >
              {loading ? "Creating account…" : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-stone-900 hover:text-black dark:text-white dark:hover:text-stone-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}