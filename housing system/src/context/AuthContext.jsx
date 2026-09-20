import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9000/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true);
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
        else localStorage.removeItem("token");
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setReady(true));
  }, []);

  // Body: { email, password, mode?, tenantId? }. When an account can sign
  // in as more than one thing (its own properties, and/or one or more
  // linked tenant profiles), the API responds with needsModeSelection
  // instead of a token — callers should check `data.needsModeSelection`
  // and, if true, ask the person to pick before calling login again with
  // that choice included.
  const login = async (email, password, mode, tenantId) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode, tenantId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    if (data.needsModeSelection) return data;

    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  // Admin Registration
  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  // Tenant Activation / Registration — also transparently links a tenant
  // profile onto an existing (e.g. landlord) account when one exists for
  // this email and the password matches it.
  const tenantRegister = async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/tenant-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tenant activation failed");

    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  // Switch between "my properties" and a linked tenant profile (or between
  // two different tenant profiles) without a full re-login. Available modes
  // come from GET /auth/modes (see fetchModes below).
  const switchMode = async (mode, tenantId) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/auth/switch-mode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mode, tenantId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not switch mode");

    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  // The full list of modes (admin + every linked tenant profile) this
  // account can use — for rendering a "switch to..." menu.
  const fetchModes = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/auth/modes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load account modes");
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Self-service account deletion (landlord or tenant). Requires the
  // current password as confirmation. Only removes the login — a
  // tenant's lease/invoice/message history stays intact for the
  // property manager's records.
  const deleteAccount = async (password) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/auth/me`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not delete account");

    localStorage.removeItem("token");
    setUser(null);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        isAuthenticated: !!user,
        login,
        register,
        tenantRegister,
        switchMode,
        fetchModes,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
