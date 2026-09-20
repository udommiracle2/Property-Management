import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, tenantId, name }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function tenantOnly(req, res, next) {
  if (!req.user || req.user.role !== "tenant") {
    return res.status(403).json({ error: "Tenant access required" });
  }
  next();
}

/** Allow admin or the specific tenant who owns the resource */
export function adminOrSelfTenant(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (req.user.role === "admin") return next();
  // Tenant can only access their own data – enforced in route handlers via tenantId
  next();
}

/**
 * Signs a session token scoped to ONE mode: either "admin" (this account
 * managing its own properties) or "tenant" acting as one specific linked
 * Tenant profile. A dual-capability account gets a fresh token each time
 * it switches modes (see POST /api/auth/login's mode selection and
 * POST /api/auth/switch-mode) — every existing role check in this file
 * and every tenant-scoped route still just reads req.user.role/tenantId
 * from this token, unchanged, since a token only ever represents one
 * mode at a time.
 */
export function signToken(user, { mode, tenantId } = {}) {
  const resolvedMode = mode || user.role || "admin";
  return jwt.sign(
    {
      id: user._id?.toString() || user.id,
      email: user.email,
      role: resolvedMode,
      tenantId: resolvedMode === "tenant" ? (tenantId || "") : "",
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}
