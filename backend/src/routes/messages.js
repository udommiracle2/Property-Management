import { Router } from "express";
import Message from "../models/Message.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers, toClient } from "../utils/crudFactory.js";
import { todayISO } from "../utils/ids.js";

const router = Router();
const crud = createCrudHandlers(Message, {
  tenantFilter: (u) => ({ tenantId: u.tenantId }),
  required: ["id"],
});

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "tenant") {
      filter.tenantId = req.user.tenantId;
    } else {
      filter.adminId = req.user.id;
    }
    const docs = await Message.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs.map(toClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Message.findOne({ id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "tenant" && doc.tenantId && doc.tenantId !== req.user.tenantId) {
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

router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.id) return res.status(400).json({ error: "id is required" });
    if (req.user.role === "tenant") {
      payload.tenantId = req.user.tenantId;
      payload.from = req.user.name || req.user.email;
      // Resolve adminId from tenant profile
      const Tenant = (await import("../models/Tenant.js")).default;
      const tenantDoc = await Tenant.findOne({ id: req.user.tenantId }).lean();
      payload.adminId = tenantDoc?.adminId || "unknown";
    } else {
      payload.adminId = req.user.id;
    }
    const existing = await Message.findOne({ id: payload.id, adminId: payload.adminId });
    if (existing) return res.status(409).json({ error: "ID already exists" });
    const doc = await Message.create(payload);
    res.status(201).json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", adminOnly, crud.update);
router.delete("/:id", adminOnly, crud.remove);

/** POST /api/messages/:id/reply */
router.post("/:id/reply", async (req, res) => {
  try {
    const { text, from } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });
    const scopeFilter = req.user.role === "tenant"
      ? { id: req.params.id }
      : { id: req.params.id, adminId: req.user.id };
    const msg = await Message.findOne(scopeFilter);
    if (!msg) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "tenant" && msg.tenantId && msg.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const reply = { text, from: from || req.user.name || req.user.email, at: todayISO() };
    msg.thread = msg.thread || [];
    msg.thread.push(reply);
    msg.preview = text;
    msg.unread = req.user.role === "tenant";
    await msg.save();
    res.json(toClient(msg));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/messages/:id/read */
router.patch("/:id/read", async (req, res) => {
  try {
    const scopeFilter = req.user.role === "tenant"
      ? { id: req.params.id }
      : { id: req.params.id, adminId: req.user.id };
    const doc = await Message.findOneAndUpdate(
      scopeFilter,
      { $set: { unread: false } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
