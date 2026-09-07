import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js"; // Import your Tenant model to check email
import { authRequired, signToken } from "../middleware/auth.js";
import { sendMail, welcomeEmail } from "../utils/mailer.js";

const router = express.Router();

// Shape the user object the same way everywhere so the frontend always
// gets tenantId (needed for the tenant portal + tenant-scoped API calls).
function toUserResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId || "",
  };
}

// 1. ADMIN REGISTER (Only creates Admin accounts)
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
      role: "admin", // Hardcoded to admin
    });

    const token = signToken(user);
    res.status(201).json({ token, user: toUserResponse(user) });

    // Fire-and-forget: email delivery should never block or fail registration.
    const { subject, text, html } = welcomeEmail({ name: user.name, role: "admin" });
    sendMail({ to: user.email, subject, text, html }).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message || "Registration failed." });
  }
});

// 2. TENANT REGISTER / ACTIVATION (Checks if Admin added them first)
router.post("/tenant-register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase();

    // Verify tenant exists in the Tenant collection (created by Admin)
    const tenantProfile = await Tenant.findOne({ email: cleanEmail });
    if (!tenantProfile) {
      return res.status(403).json({
        error: "No tenant profile found with this email. Your property manager must add you first."
      });
    }

    // Check if user account is already activated
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: "Tenant account is already activated. Please log in." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Link this login to the Tenant profile so tenant-scoped routes
    // (leases, invoices, maintenance, messages, /tenants/me) work.
    const user = await User.create({
      name: name || tenantProfile.name,
      email: cleanEmail,
      password: hashedPassword,
      role: "tenant",
      tenantId: tenantProfile.id,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: toUserResponse(user) });

    // Fire-and-forget: email delivery should never block or fail registration.
    const { subject, text, html } = welcomeEmail({ name: user.name, role: "tenant" });
    sendMail({ to: user.email, subject, text, html }).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message || "Tenant activation failed." });
  }
});

// 3. LOGIN (Handles both Admins and Tenants and returns explicit role)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Guard against missing user OR missing password field in MongoDB
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    res.json({ token, user: toUserResponse(user) });
  } catch (err) {
    res.status(500).json({ error: err.message || "Login failed." });
  }
});

// 4. SESSION RESTORE - the frontend calls this on every page load to
// restore the logged-in user from the stored token. Without this route
// the app silently signs everyone out on refresh.
router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Invalid or expired session." });
    res.json(toUserResponse(user));
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not load session." });
  }
});

// 5. DELETE ACCOUNT - lets the currently signed-in landlord or tenant
// delete their own login. Requires re-entering the password as
// confirmation. This removes the User (login) record only — a tenant's
// underlying Tenant profile, lease, invoices, and message history stay
// intact for the property manager's records, exactly like a tenant
// moving out doesn't erase their payment history. If the same email
// re-registers later, tenant-register will re-link to that same profile.
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
