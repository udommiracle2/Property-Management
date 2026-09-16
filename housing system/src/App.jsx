import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Properties from "./pages/Properties.jsx";
import Tenants from "./pages/Tenants.jsx";
import Leases from "./pages/Leases.jsx";
import Rent from "./pages/Rent.jsx";
import Expenses from "./pages/Expenses.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Messages from "./pages/Messages.jsx";
import Owners from "./pages/Owners.jsx";
import Vendors from "./pages/Vendors.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TenantRegister from "./pages/TenantRegister.jsx";
import TenantPortal from "./pages/TenantPortal.jsx";
import TenantSidebar from "./components/TenantSidebar.jsx";

function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

function TenantLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-stone-950">
      <TenantSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function RequireAdmin({ children }) {
  const { user, ready, isAuthenticated } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950">
        <div className="text-sm text-slate-500 animate-pulse">Loading…</div>
      </div>
    );
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === "tenant") return <Navigate to="/tenant" replace />;
  return children;
}

function RequireTenant({ children }) {
  const { user, ready, isAuthenticated } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950">
        <div className="text-sm text-slate-500 animate-pulse">Loading…</div>
      </div>
    );
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role !== "tenant") return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, isAuthenticated, ready } = useAuth();
  if (!ready) return null;
  if (isAuthenticated && user) {
    return <Navigate to={user.role === "tenant" ? "/tenant" : "/"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tenant-register" element={<TenantRegister />} />

      {/* Admin / Landlord routes */}
      <Route path="/" element={<RequireAdmin><ProtectedLayout><Dashboard /></ProtectedLayout></RequireAdmin>} />
      <Route path="/properties" element={<RequireAdmin><ProtectedLayout><Properties /></ProtectedLayout></RequireAdmin>} />
      <Route path="/tenants" element={<RequireAdmin><ProtectedLayout><Tenants /></ProtectedLayout></RequireAdmin>} />
      <Route path="/leases" element={<RequireAdmin><ProtectedLayout><Leases /></ProtectedLayout></RequireAdmin>} />
      <Route path="/rent" element={<RequireAdmin><ProtectedLayout><Rent /></ProtectedLayout></RequireAdmin>} />
      <Route path="/expenses" element={<RequireAdmin><ProtectedLayout><Expenses /></ProtectedLayout></RequireAdmin>} />
      <Route path="/maintenance" element={<RequireAdmin><ProtectedLayout><Maintenance /></ProtectedLayout></RequireAdmin>} />
      <Route path="/messages" element={<RequireAdmin><ProtectedLayout><Messages /></ProtectedLayout></RequireAdmin>} />
      <Route path="/owners" element={<RequireAdmin><ProtectedLayout><Owners /></ProtectedLayout></RequireAdmin>} />
      {/* <Route path="/vendors" element={<RequireAdmin><ProtectedLayout><Vendors /></ProtectedLayout></RequireAdmin>} /> */}

      {/* Tenant routes */}
      <Route path="/tenant" element={<RequireTenant><TenantLayout><TenantPortal /></TenantLayout></RequireTenant>} />
      <Route path="/tenant/payments" element={<RequireTenant><TenantLayout><TenantPortal /></TenantLayout></RequireTenant>} />
      <Route path="/tenant/maintenance" element={<RequireTenant><TenantLayout><TenantPortal /></TenantLayout></RequireTenant>} />
      <Route path="/tenant/messages" element={<RequireTenant><TenantLayout><TenantPortal /></TenantLayout></RequireTenant>} />
      <Route path="/tenant/lease" element={<RequireTenant><TenantLayout><TenantPortal /></TenantLayout></RequireTenant>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}