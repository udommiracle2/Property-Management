import { Router } from "express";
import Maintenance from "../models/Maintenance.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers, toClient } from "../utils/crudFactory.js";
import { todayISO } from "../utils/ids.js";

const router = Router();
const crud = createCrudHandlers(Maintenance, {
  tenantFilter: (u) => ({ tenantId: u.tenantId }),
  required: ["id", "title"],
});

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "tenant") {
      // Tenant sees only their own tickets — tenantId is globally unique
      filter.tenantId = req.user.tenantId;
    } else {
      // Admin sees only their own portfolio's tickets
      filter.adminId = req.user.id;
      if (req.query.unitId)   filter.unitId   = req.query.unitId;
      if (req.query.tenantId) filter.tenantId = req.query.tenantId;
      if (req.query.status)   filter.status   = req.query.status;
    }
    const docs = await Maintenance.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs.map(toClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Maintenance.findOne({ id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "tenant" && doc.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.user.role === "admin" && doc.adminId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Tenants can create maintenance requests for themselves */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.id || !payload.title) {
      return res.status(400).json({ error: "id and title are required" });
    }
    if (req.user.role === "tenant") {
      payload.tenantId = req.user.tenantId;
      // adminId for tenant-created tickets: look it up from their Tenant profile
      // so it's stamped into the right admin's silo.
      const Tenant = (await import("../models/Tenant.js")).default;
      const tenantDoc = await Tenant.findOne({ id: req.user.tenantId }).lean();
      payload.adminId = tenantDoc?.adminId || "unknown";
    } else {
      payload.adminId = req.user.id;
    }
    if (!payload.created) payload.created = todayISO();
    if (!payload.updated) payload.updated = todayISO();
    const existing = await Maintenance.findOne({ id: payload.id, adminId: payload.adminId });
    if (existing) return res.status(409).json({ error: "ID already exists" });
    const doc = await Maintenance.create(payload);
    res.status(201).json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", adminOnly, crud.update);
router.delete("/:id", adminOnly, crud.remove);

/** PATCH status (move ticket) — scoped to admin's own data */
router.patch("/:id/status", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });
    const doc = await Maintenance.findOneAndUpdate(
      { id: req.params.id, adminId: req.user.id },
      { $set: { status, updated: todayISO() } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
