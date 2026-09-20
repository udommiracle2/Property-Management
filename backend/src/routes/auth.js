import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import { authRequired, signToken } from "../middleware/auth.js";
import { sendMail, welcomeEmail } from "../utils/mailer.js";

const router = express.Router();

const MAX_TENANT_PROFILES = 5;

// Shape the user object the same way everywhere. `sessionRole`/`sessionTenantId`
// come from the verified token (req.user) when available and describe which
// mode THIS session is in; tenantIds always comes fresh from the DB so the
// frontend knows every mode available to switch into.
function toUserResponse(user, session = {}) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: session.role || user.role,
    tenantId: session.tenantId || "",
    tenantIds: user.tenantIds || [],
  };
}

// Builds the list of modes this account can sign into: "admin" is always
// available (any account can manage its own properties — nothing to set
// up first), plus one entry per linked tenant profile with enough context
// (property/unit) for a person to tell them apart when picking.
async function describeModes(user) {
  const tenantIds = user.tenantIds || [];
  const tenants = tenantIds.length
    ? await Tenant.find({ id: { $in: tenantIds } }).lean()
    : [];

  const tenantModes = await Promise.all(
    tenants.map(async (t) => {
      let propertyName = "";
      let unitLabel = "";
      if (t.unitId) {
        const unit = await Unit.findOne({ id: t.unitId }).lean();
        if (unit) {
          unitLabel = unit.label || "";
          const property = await Property.findOne({ id: unit.propertyId }).lean();
          if (property) propertyName = property.name || "";
        }
      }
      return { tenantId: t.id, tenantName: t.name, propertyName, unitLabel };
    })
  );

  return { admin: true, tenants: tenantModes };
}

// 1. ADMIN REGISTER (creates a plain account — any account can also
// become a tenant later via /tenant-register, see below)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    const token = signToken(user, { mode: "admin" });
    res.status(201).json({ token, user: toUserResponse(user, { role: "admin" }) });

    const { subject, text, html } = welcomeEmail({ name: user.name, role: "admin" });
    sendMail({ to: user.email, subject, text, html }).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message || "Registration failed." });
  }
});

// 2. TENANT REGISTER / ACTIVATION / LINK
//    - No account yet for this email -> creates a fresh tenant-only account.
//    - An account already exists for this email -> this becomes "link this
//      tenant profile to my existing account" instead of a hard rejection,
//      which is what lets one person be a landlord AND a tenant (of a
//      different landlord) on a single login. Re-entering the password is
//      the proof they actually own that existing account.
router.post("/tenant-register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase();

    const tenantProfile = await Tenant.findOne({ email: cleanEmail });
    if (!tenantProfile) {
      return res.status(403).json({
        error: "No tenant profile found with this email. Your property manager must add you first."
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res.status(401).json({
          error: "An account with this email already exists. Enter its password to link this tenant profile to it."
        });
      }
      if ((existingUser.tenantIds || []).includes(tenantProfile.id)) {
        // Already linked — just sign them in as this tenant.
        const token = signToken(existingUser, { mode: "tenant", tenantId: tenantProfile.id });
        return res.json({ token, user: toUserResponse(existingUser, { role: "tenant", tenantId: tenantProfile.id }) });
      }
      if ((existingUser.tenantIds || []).length >= MAX_TENANT_PROFILES) {
        return res.status(409).json({
          error: `You can only be linked to ${MAX_TENANT_PROFILES} tenant profiles at once.`
        });
      }
      existingUser.tenantIds = [...(existingUser.tenantIds || []), tenantProfile.id];
      await existingUser.save();

      const token = signToken(existingUser, { mode: "tenant", tenantId: tenantProfile.id });
      return res.status(201).json({ token, user: toUserResponse(existingUser, { role: "tenant", tenantId: tenantProfile.id }) });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name || tenantProfile.name,
      email: cleanEmail,
      password: hashedPassword,
      role: "tenant",
      tenantIds: [tenantProfile.id],
    });

    const token = signToken(user, { mode: "tenant", tenantId: tenantProfile.id });
    res.status(201).json({ token, user: toUserResponse(user, { role: "tenant", tenantId: tenantProfile.id }) });

    const { subject, text, html } = welcomeEmail({ name: user.name, role: "tenant" });
    sendMail({ to: user.email, subject, text, html }).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message || "Tenant activation failed." });
  }
});

// 3. LOGIN
//    Body: { email, password, mode?, tenantId? }
//    - If the account only has one possible mode (plain admin, no linked
//      tenant profiles), signs in directly — identical to before.
//    - If it has more than one (admin + at least one tenant profile, or
//      several tenant profiles), and `mode` wasn't given, responds with
//      needsModeSelection + the list of modes instead of a token. The
//      frontend re-submits the same request with `mode` (and `tenantId`
//      for tenant mode) once the person picks.
router.post("/login", async (req, res) => {
  try {
    const { email, password, mode, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const modes = await describeModes(user);
    const hasChoice = modes.tenants.length > 0; // admin is always the other option

    if (!mode) {
      if (!hasChoice) {
        const token = signToken(user, { mode: "admin" });
        return res.json({ token, user: toUserResponse(user, { role: "admin" }) });
      }
      return res.json({ needsModeSelection: true, email: user.email, modes });
    }

    if (mode === "admin") {
      const token = signToken(user, { mode: "admin" });
      return res.json({ token, user: toUserResponse(user, { role: "admin" }) });
    }

    if (mode === "tenant") {
      const valid = modes.tenants.some((t) => t.tenantId === tenantId);
      if (!valid) {
        return res.status(400).json({ error: "That tenant profile isn't linked to this account." });
      }
      const token = signToken(user, { mode: "tenant", tenantId });
      return res.json({ token, user: toUserResponse(user, { role: "tenant", tenantId }) });
    }

    return res.status(400).json({ error: "Invalid mode." });
  } catch (err) {
    res.status(500).json({ error: err.message || "Login failed." });
  }
});

// 3b. SWITCH MODE — for an already-authenticated dual-capability account
// to move between "my properties" and one of its tenant profiles (or
// between two different tenant profiles) without a full re-login.
router.post("/switch-mode", authRequired, async (req, res) => {
  try {
    const { mode, tenantId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Invalid or expired session." });

    if (mode === "admin") {
      const token = signToken(user, { mode: "admin" });
      return res.json({ token, user: toUserResponse(user, { role: "admin" }) });
    }
    if (mode === "tenant") {
      if (!(user.tenantIds || []).includes(tenantId)) {
        return res.status(400).json({ error: "That tenant profile isn't linked to this account." });
      }
      const token = signToken(user, { mode: "tenant", tenantId });
      return res.json({ token, user: toUserResponse(user, { role: "tenant", tenantId }) });
    }
    return res.status(400).json({ error: "Invalid mode." });
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not switch mode." });
  }
});

// 4. SESSION RESTORE — the frontend calls this on every page load to
// restore the logged-in user from the stored token, keeping the CURRENT
// session's mode (from the verified token) while refreshing everything
// else (name, tenantIds) from the database.
router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Invalid or expired session." });
    res.json(toUserResponse(user, { role: req.user.role, tenantId: req.user.tenantId }));
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not load session." });
  }
});

// GET /api/auth/modes — the available modes for the signed-in account,
// so the frontend can render a "switch to..." menu without decoding the
// token itself.
router.get("/modes", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Invalid or expired session." });
    res.json(await describeModes(user));
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not load account modes." });
  }
});

// 5. DELETE ACCOUNT
router.delete("/me", authRequired, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Enter your password to confirm account deletion." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Invalid or expired session." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not delete account." });
  }
});

export default router;
