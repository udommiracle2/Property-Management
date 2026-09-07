import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Home } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // async function handleSubmit(e) {
  //   e.preventDefault();
  //   setError("");
  //   setLoading(true);

  //   const res = await login({ email, password });
  //   setLoading(false);

  //   if (res.ok) {
  //     navigate(res.role === "tenant" ? "/tenant" : "/", { replace: true });
  //   } else {
  //     setError(res.error);
  //   }
  // }


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Call login from AuthContext
      const data = await login(email, password);

      // Route based on user role returned from Express
      if (data.user.role === "tenant") {
        navigate("/tenant"); // Sends tenants to Tenant Portal
      } else {
        navigate("/"); // Sends landlords/admins to Landlord Dashboard
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              <Home size={22} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">EstateHub</div>
              <div className="text-xs text-white/50">Property Management</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="max-w-md mx-auto text-center lg:text-left">
              <h1 className="text-3xl font-bold leading-tight tracking-tight">
                Manage every unit,<br />tenant & payment<br />in one place.
              </h1>
              <p className="mt-4 text-white/60 text-sm leading-relaxed">
                EstateHub gives landlords and property managers a clear view of occupancy,
                rent collection, maintenance, and expenses — so nothing falls through the cracks.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-white/80 max-w-md">
              {[
                "Track properties, units & occupancy in real time",
                "Onboard tenants and issue digital leases",
                "Collect rent, flag overdue invoices automatically",
                "Log maintenance tickets and operating costs"
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-sky-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/35">© {new Date().getFullYear()} EstateHub · Admin portal</p>
        </div>
      </div>

      {/* Right panel */}
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
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Welcome back</h2>
            <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
              Sign in to your EstateHub account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  className="input pl-9"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-black active:scale-[0.98] transition mt-2 disabled:opacity-60"
            >
              {loading ? "Signing in…" : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            New to EstateHub?{" "}
            <Link to="/register" className="font-semibold text-stone-900 hover:text-black dark:text-white dark:hover:text-stone-200">
              Create an admin account
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-stone-500">
            Are you a tenant? <Link to="/tenant-register" className="font-semibold text-sky-700 hover:text-sky-800">Activate resident access</Link>
          </p>

          <div className="mt-8 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-4 text-xs text-stone-500 dark:text-stone-400">
            <strong className="text-stone-700 dark:text-stone-300">Live Database Connected:</strong> Accounts registered here are sent to your Express API and saved directly in MongoDB.
          </div>
        </div>
      </div>
    </div>
  );
}