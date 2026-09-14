import { createContext, useContext, useEffect, useReducer, useCallback, useRef, useState } from "react";
import { initialSeedV3 } from "../data.js";
import { useAuth } from "./AuthContext.jsx";
import { apiRequest } from "../api.js";

function reducer(state, action) {
  switch (action.type) {
    // ---- Properties
    case "ADD_PROPERTY":    return { ...state, properties: [action.payload, ...state.properties] };
    case "UPDATE_PROPERTY": return { ...state, properties: state.properties.map(p => p.id === action.payload.id ? action.payload : p) };
    case "DELETE_PROPERTY": {
      const id = action.payload;
      const unitsToDelete = state.units.filter(u => u.propertyId === id).map(u => u.id);
      const tenantsOnUnits = state.tenants.filter(t => unitsToDelete.includes(t.unitId)).map(t => t.id);
      return {
        ...state,
        properties: state.properties.filter(p => p.id !== id),
        units:      state.units.filter(u => u.propertyId !== id),
        tenants:    state.tenants.map(t => unitsToDelete.includes(t.unitId) ? { ...t, unitId: "", status: "Past" } : t),
        leases:     state.leases.filter(l => !unitsToDelete.includes(l.unitId)),
        invoices:   state.invoices.filter(i => !tenantsOnUnits.includes(i.tenantId)),
        maintenance:state.maintenance.filter(m => !unitsToDelete.includes(m.unitId)),
        documents:  state.documents.filter(d => !(d.entityType === "property" && d.entityId === id) && !(d.entityType === "unit" && unitsToDelete.includes(d.entityId)))
      };
    }

    // ---- Units
    case "ADD_UNIT":        return { ...state, units: [action.payload, ...state.units] };
    case "UPDATE_UNIT":     return { ...state, units: state.units.map(u => u.id === action.payload.id ? action.payload : u) };
    case "DELETE_UNIT":     return { ...state, units: state.units.filter(u => u.id !== action.payload) };

    // ---- Tenants
    case "ADD_TENANT":      return { ...state, tenants: [action.payload, ...state.tenants] };
    case "UPDATE_TENANT":   return { ...state, tenants: state.tenants.map(t => t.id === action.payload.id ? action.payload : t) };
    case "DELETE_TENANT":   return { ...state, tenants: state.tenants.filter(t => t.id !== action.payload) };

    // ---- Leases
    case "ADD_LEASE":       return { ...state, leases: [action.payload, ...state.leases] };
    case "UPDATE_LEASE":    return { ...state, leases: state.leases.map(l => l.id === action.payload.id ? action.payload : l) };
    case "DELETE_LEASE":    return { ...state, leases: state.leases.filter(l => l.id !== action.payload) };

    // ---- Invoices
    case "ADD_INVOICE":     return { ...state, invoices: [action.payload, ...state.invoices] };
    case "UPDATE_INVOICE":  return { ...state, invoices: state.invoices.map(i => i.id === action.payload.id ? action.payload : i) };
    case "DELETE_INVOICE":  return { ...state, invoices: state.invoices.filter(i => i.id !== action.payload) };
    // Optimistic status flip only — the server creates the authoritative
    // Payment record (with receipt number), which is reconciled in via
    // ADD_PAYMENT once the API call resolves (see StoreProvider below).
    case "MARK_INVOICE_PAID": return {
      ...state,
      invoices: state.invoices.map(i => i.id === action.payload.id
        ? { ...i, status: "Paid", paid: new Date().toISOString().slice(0,10), method: action.payload.method || i.method || "" }
        : i
      )
    };
    case "ADD_PAYMENT":     return { ...state, payments: [action.payload, ...state.payments] };
    case "APPLY_LATE_FEE":  return {
      ...state,
      invoices: state.invoices.map(i => i.id === action.payload.id
        ? { ...i, lateFee: action.payload.fee, total: (i.amount || 0) + action.payload.fee }
        : i
      )
    };

    // ---- Expenses
    case "ADD_EXPENSE":     return { ...state, expenses: [action.payload, ...state.expenses] };
    case "UPDATE_EXPENSE":  return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) };
    case "DELETE_EXPENSE":  return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

    // ---- Maintenance
    case "ADD_MAINT":       return { ...state, maintenance: [action.payload, ...state.maintenance] };
    case "UPDATE_MAINT":    return { ...state, maintenance: state.maintenance.map(m => m.id === action.payload.id ? action.payload : m) };
    case "DELETE_MAINT":    return { ...state, maintenance: state.maintenance.filter(m => m.id !== action.payload) };
    case "MOVE_MAINT":      return {
      ...state,
      maintenance: state.maintenance.map(m => m.id === action.payload.id
        ? { ...m, status: action.payload.status, updated: new Date().toISOString().slice(0,10) }
        : m
      )
    };

    // ---- Messages
    case "ADD_MESSAGE":     return { ...state, messages: [action.payload, ...state.messages] };
    case "SEND_REPLY":      return {
      ...state,
      messages: state.messages.map(m => m.id === action.payload.id
        ? { ...m, thread: [...(m.thread||[]), action.payload.reply], preview: action.payload.reply.text, unread: false }
        : m
      )
    };
    case "MARK_READ":       return {
      ...state,
      messages: state.messages.map(m => m.id === action.payload ? { ...m, unread: false } : m)
    };
    // Replaces a message wholesale with server truth (used to reconcile
    // SEND_REPLY / MARK_READ once the API confirms the change, since the
    // server derives fields like `from`/`at` that the optimistic update
    // above can't know in advance).
    case "REPLACE_MESSAGE": return { ...state, messages: state.messages.map(m => m.id === action.payload.id ? action.payload : m) };
    case "DELETE_MESSAGE":  return { ...state, messages: state.messages.filter(m => m.id !== action.payload) };

    // ---- Announcements
    case "ADD_ANNOUNCEMENT":return { ...state, announcements: [action.payload, ...state.announcements] };
    case "DELETE_ANNOUNCEMENT": return { ...state, announcements: state.announcements.filter(a => a.id !== action.payload) };

    // ---- Owners
    case "ADD_OWNER":       return { ...state, owners: [action.payload, ...state.owners] };
    case "UPDATE_OWNER":    return { ...state, owners: state.owners.map(o => o.id === action.payload.id ? action.payload : o) };
    case "DELETE_OWNER":    return { ...state, owners: state.owners.filter(o => o.id !== action.payload) };

    // ---- Vendors
    case "ADD_VENDOR":      return { ...state, vendors: [action.payload, ...state.vendors] };
    case "UPDATE_VENDOR":   return { ...state, vendors: state.vendors.map(v => v.id === action.payload.id ? action.payload : v) };
    case "DELETE_VENDOR":   return { ...state, vendors: state.vendors.filter(v => v.id !== action.payload) };

    // ---- Documents
    case "ADD_DOCUMENT":    return { ...state, documents: [action.payload, ...state.documents] };
    case "DELETE_DOCUMENT": return { ...state, documents: state.documents.filter(d => d.id !== action.payload) };

    // ---- Notifications
    case "ADD_NOTIFICATION":return { ...state, notifications: [action.payload, ...state.notifications.filter(n => !(n.kind === action.payload.kind && n.refId === action.payload.refId))] };
    case "MARK_NOTIF_READ": return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case "MARK_ALL_NOTIF_READ": return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    case "CLEAR_NOTIFICATIONS": return { ...state, notifications: [] };

    // ---- Audit
    case "ADD_AUDIT":       return { ...state, auditLog: [action.payload, ...state.auditLog].slice(0, 1000) };

    // ---- Bulk (used internally for hydration/reset — never synced itself)
    case "RESET":           return initialSeedV3();
    case "IMPORT":          return action.payload;

    default: return state;
  }
}

const StoreCtx = createContext(null);

// Side-effect generators (notifications, auto-invoices, preventive tickets).
// They run on boot and after every dispatch, but only once the store has
// been hydrated from the server and only for admins (notifications are an
// admin-only collection on the backend).
function deriveSideEffects(state, dispatch) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  // Notifications — lease expiring within 30 / 7 days.
  state.leases.forEach(l => {
    if (!l.end) return;
    const days = Math.floor((new Date(l.end) - today) / 86400000);
    if (days >= 0 && days <= 30 && (l.status === "Active" || l.status === "Expiring")) {
      const kind = days <= 7 ? "lease_expiring_urgent" : "lease_expiring";
      const existing = state.notifications.some(n => n.kind === kind && n.refId === l.id);
      if (!existing) {
        dispatch({ type: "ADD_NOTIFICATION", payload: {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          kind,
          title: `Lease ${l.id} ${days === 0 ? "expires today" : `expires in ${days} day${days===1?"":"s"}`}`,
          body: `Review renewal options for this lease.`,
          refType: "lease", refId: l.id, createdAt: todayStr, read: false
        }});
      }
    }
  });

  // Notifications — overdue invoices.
  state.invoices.forEach(i => {
    if (i.status === "Overdue") {
      const kind = "invoice_overdue";
      const existing = state.notifications.some(n => n.kind === kind && n.refId === i.id);
      if (!existing) {
        dispatch({ type: "ADD_NOTIFICATION", payload: {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          kind,
          title: `Invoice ${i.id} is overdue`,
          body: `Follow up with the tenant for payment.`,
          refType: "invoice", refId: i.id, createdAt: todayStr, read: false
        }});
      }
    }
  });

  // Preventive maintenance — if a ticket has dueAt in the past and isPreventive, clone a new ticket.
  state.maintenance.forEach(m => {
    if (m.isPreventive && m.dueAt && new Date(m.dueAt) <= today) {
      const kind = "preventive_due";
      const existing = state.notifications.some(n => n.kind === kind && n.refId === m.id);
      if (!existing) {
        dispatch({ type: "ADD_NOTIFICATION", payload: {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          kind,
          title: `Preventive: ${m.title}`,
          body: `Scheduled ticket is due. A new ticket has been generated.`,
          refType: "maintenance", refId: m.id, createdAt: todayStr, read: false
        }});
      }
    }
  });
}

// ---------------------------------------------------------------------
// Server sync — maps a dispatched action to the matching backend call.
// Returns null for actions that have no server-side effect (e.g. the
// internal IMPORT/RESET bootstrap actions, which are applied via
// rawDispatch directly and never flow through here).
// ---------------------------------------------------------------------
async function syncAction(action, user) {
  const role = user?.role;
  switch (action.type) {
    case "ADD_PROPERTY":    return apiRequest("POST", "/properties", action.payload);
    case "UPDATE_PROPERTY": return apiRequest("PUT", `/properties/${action.payload.id}`, action.payload);
    case "DELETE_PROPERTY": return apiRequest("DELETE", `/properties/${action.payload}`);

    case "ADD_UNIT":        return apiRequest("POST", "/units", action.payload);
    case "UPDATE_UNIT":     return apiRequest("PUT", `/units/${action.payload.id}`, action.payload);
    case "DELETE_UNIT":     return apiRequest("DELETE", `/units/${action.payload}`);

    case "ADD_TENANT":      return apiRequest("POST", "/tenants", action.payload);
    case "UPDATE_TENANT":   return apiRequest("PUT", `/tenants/${action.payload.id}`, action.payload);
    case "DELETE_TENANT":   return apiRequest("DELETE", `/tenants/${action.payload}`);

    case "ADD_LEASE":       return apiRequest("POST", "/leases", action.payload);
    case "UPDATE_LEASE":    return apiRequest("PUT", `/leases/${action.payload.id}`, action.payload);
    case "DELETE_LEASE":    return apiRequest("DELETE", `/leases/${action.payload}`);

    case "ADD_INVOICE":     return apiRequest("POST", "/invoices", action.payload);
    case "UPDATE_INVOICE":  return apiRequest("PUT", `/invoices/${action.payload.id}`, action.payload);
    case "DELETE_INVOICE":  return apiRequest("DELETE", `/invoices/${action.payload}`);
    case "MARK_INVOICE_PAID": return apiRequest("POST", `/invoices/${action.payload.id}/pay`, { method: action.payload.method || "", note: action.payload.note || "" });
    case "APPLY_LATE_FEE":  return apiRequest("POST", `/invoices/${action.payload.id}/late-fee`, { fee: action.payload.fee });
    case "ADD_PAYMENT":     return apiRequest("POST", "/payments", action.payload);

    case "ADD_EXPENSE":     return apiRequest("POST", "/expenses", action.payload);
    case "UPDATE_EXPENSE":  return apiRequest("PUT", `/expenses/${action.payload.id}`, action.payload);
    case "DELETE_EXPENSE":  return apiRequest("DELETE", `/expenses/${action.payload}`);

    case "ADD_MAINT":       return apiRequest("POST", "/maintenance", action.payload);
    case "UPDATE_MAINT":    return apiRequest("PUT", `/maintenance/${action.payload.id}`, action.payload);
    case "DELETE_MAINT":    return apiRequest("DELETE", `/maintenance/${action.payload}`);
    case "MOVE_MAINT":      return apiRequest("PATCH", `/maintenance/${action.payload.id}/status`, { status: action.payload.status });

    case "ADD_MESSAGE":     return apiRequest("POST", "/messages", action.payload);
    case "SEND_REPLY":      return apiRequest("POST", `/messages/${action.payload.id}/reply`, { text: action.payload.reply.text });
    case "MARK_READ":       return apiRequest("PATCH", `/messages/${action.payload}/read`);
    case "DELETE_MESSAGE":  return apiRequest("DELETE", `/messages/${action.payload}`);

    case "ADD_ANNOUNCEMENT":return apiRequest("POST", "/announcements", action.payload);
    case "DELETE_ANNOUNCEMENT": return apiRequest("DELETE", `/announcements/${action.payload}`);

    case "ADD_OWNER":       return apiRequest("POST", "/owners", action.payload);
    case "UPDATE_OWNER":    return apiRequest("PUT", `/owners/${action.payload.id}`, action.payload);
    case "DELETE_OWNER":    return apiRequest("DELETE", `/owners/${action.payload}`);

    case "ADD_VENDOR":      return apiRequest("POST", "/vendors", action.payload);
    case "UPDATE_VENDOR":   return apiRequest("PUT", `/vendors/${action.payload.id}`, action.payload);
    case "DELETE_VENDOR":   return apiRequest("DELETE", `/vendors/${action.payload}`);

    case "ADD_DOCUMENT":    return apiRequest("POST", "/documents", action.payload);
    case "DELETE_DOCUMENT": return apiRequest("DELETE", `/documents/${action.payload}`);

    // Notifications are an admin-only collection on the backend.
    case "ADD_NOTIFICATION":    return role === "admin" ? apiRequest("POST", "/notifications", action.payload) : null;
    case "MARK_NOTIF_READ":     return role === "admin" ? apiRequest("PATCH", `/notifications/${action.payload}/read`) : null;
    case "MARK_ALL_NOTIF_READ": return role === "admin" ? apiRequest("PATCH", "/notifications/read-all") : null;
    case "CLEAR_NOTIFICATIONS": return role === "admin" ? apiRequest("DELETE", "/notifications") : null;

    case "ADD_AUDIT":       return role === "admin" ? apiRequest("POST", "/audit", action.payload) : null;

    case "RESET":            return apiRequest("DELETE", "/store");
    case "IMPORT":           return apiRequest("PUT", "/store", action.payload);

    default: return null;
  }
}

async function hydrateAdmin() {
  const data = await apiRequest("GET", "/store");
  return { ...initialSeedV3(), ...data };
}

async function hydrateTenant() {
  const [me, leases, invoices, maintenance, messages, announcements] = await Promise.all([
    apiRequest("GET", "/tenants/me"),
    apiRequest("GET", "/leases"),
    apiRequest("GET", "/invoices"),
    apiRequest("GET", "/maintenance"),
    apiRequest("GET", "/messages"),
    apiRequest("GET", "/announcements"),
  ]);
  const { unit, property, ...tenant } = me || {};
  return {
    ...initialSeedV3(),
    tenants: tenant?.id ? [tenant] : [],
    units: unit ? [unit] : [],
    properties: property ? [property] : [],
    leases: leases || [],
    invoices: invoices || [],
    maintenance: maintenance || [],
    messages: messages || [],
    announcements: announcements || [],
  };
}

export function StoreProvider({ children }) {
  const { user, ready: authReady, isAuthenticated } = useAuth();
  const [state, rawDispatch] = useReducer(reducer, undefined, initialSeedV3);
  const [storeReady, setStoreReady] = useState(false);
  const [syncError, setSyncError] = useState("");
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const hydrate = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      const data = currentUser.role === "tenant" ? await hydrateTenant() : await hydrateAdmin();
      rawDispatch({ type: "IMPORT", payload: data });
      setSyncError("");
    } catch (err) {
      console.error("Failed to load data from the server:", err);
      setSyncError("Could not load your data from the server. Make sure the API and MongoDB are running.");
    } finally {
      setStoreReady(true);
    }
  }, []);

  // Hydrate from MongoDB whenever a user logs in / switches; clear local
  // state on logout so the next person doesn't see stale data.
  useEffect(() => {
    if (!authReady) return;
    if (isAuthenticated && user) {
      setStoreReady(false);
      hydrate();
    } else {
      rawDispatch({ type: "IMPORT", payload: initialSeedV3() });
      setStoreReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAuthenticated, user?._id, user?.role, hydrate]);

  // Run side-effect generators after every state change, once hydrated,
  // and only for admins (the notifications collection is admin-only).
  useEffect(() => {
    if (!storeReady || userRef.current?.role !== "admin") return;
    deriveSideEffects(state, dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, storeReady]);

  // ID generator — uses timestamp + random suffix so IDs are globally unique
  // across all admin accounts. Sequential IDs like PROP-0001 would collide
  // when two different landlords both create their first property.
  const nextId = useCallback((prefix) => {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}-${ts}${rand}`;
  }, []);

  // Wrapped dispatch: applies the change locally right away (so the UI
  // feels instant), then persists it to MongoDB in the background. A
  // handful of actions get their optimistic payload reconciled with the
  // server's authoritative response (e.g. a payment's real receipt
  // number). Any failure resyncs the whole store from the server so
  // local state never drifts silently out of sync with the database.
  const dispatch = useCallback((action) => {
    rawDispatch(action);
    const currentUser = userRef.current;
    if (!currentUser) return;

    syncAction(action, currentUser)
      .then((result) => {
        if (!result) return;
        switch (action.type) {
          case "MARK_INVOICE_PAID":
            if (result.invoice) rawDispatch({ type: "UPDATE_INVOICE", payload: result.invoice });
            if (result.payment) rawDispatch({ type: "ADD_PAYMENT", payload: result.payment });
            break;
          case "APPLY_LATE_FEE":
            rawDispatch({ type: "UPDATE_INVOICE", payload: result });
            break;
          case "SEND_REPLY":
          case "MARK_READ":
            rawDispatch({ type: "REPLACE_MESSAGE", payload: result });
            break;
          case "MOVE_MAINT":
            rawDispatch({ type: "UPDATE_MAINT", payload: result });
            break;
          case "RESET":
            hydrate();
            break;
          default:
            break;
        }
      })
      .catch((err) => {
        console.error(`Failed to save "${action.type}" to the server:`, err);
        setSyncError(err.message || "A change could not be saved to the server.");
        // Only resync from the server for genuine failures (network error,
        // 5xx). A 409 conflict means the server rejected our data — resyncing
        // would just wipe out what the user typed with no benefit.
        if (err.status !== 409) {
          hydrate();
        }
      });
  }, [hydrate]);

  const audit = useCallback((entry) => {
    dispatch({ type: "ADD_AUDIT", payload: {
      id: `A-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      at: new Date().toISOString(),
      actor: entry.actor || "admin",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || "",
      detail: entry.detail || ""
    }});
  }, [dispatch]);

  const dispatchAudit = useCallback((action, meta = {}) => {
    dispatch(action);
    if (meta.log !== false) {
      audit({
        action: action.type,
        entityType: meta.entityType || action.type.split("_")[1]?.toLowerCase() || "unknown",
        entityId: (action.payload && (action.payload.id || action.payload)) || "",
        detail: meta.detail || ""
      });
    }
  }, [dispatch, audit]);

  const value = { state, dispatch, dispatchAudit, audit, nextId, storeReady, syncError };
  return (
    <StoreCtx.Provider value={value}>
      {children}
      {syncError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl bg-rose-600 text-white text-sm px-4 py-3 shadow-lg flex items-start gap-3">
          <span className="flex-1">{syncError}</span>
          <button onClick={() => setSyncError("")} className="opacity-80 hover:opacity-100" aria-label="Dismiss">✕</button>
        </div>
      )}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);

// Selector helpers that re-derive cheap aggregates
export function useStats() {
  const { state } = useStore();
  const totalUnits   = state.units.length;
  const occupiedUnits= state.units.filter(u => u.status === "Occupied" || (!u.status && !u.vacant)).length;
  const occupancy    = totalUnits ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const vacantUnits  = state.units.filter(u => u.status === "Vacant" || (!u.status && u.vacant));
  const monthly      = state.units.reduce((s, u) => s + ((u.status === "Occupied" || (!u.status && !u.vacant)) ? (u.rent || 0) : 0), 0);
  return { totalUnits, occupiedUnits, occupancy, vacantUnits, monthly };
}
