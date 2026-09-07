import { Router } from "express";
import Lease from "../models/Lease.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers, toClient } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Lease, {
  required: ["id", "tenantId", "unitId"],
  tenantFilter: (user) => ({ tenantId: user.tenantId }),
});

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "tenant") {
      filter.tenantId = req.user.tenantId;
    } else {
      // admin can filter by query
      if (req.query.tenantId) filter.tenantId = req.query.tenantId;
      if (req.query.unitId) filter.unitId = req.query.unitId;
      if (req.query.status) filter.status = req.query.status;
    }
    const docs = await Lease.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs.map(toClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Lease.findOne({ id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "tenant" && doc.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", adminOnly, crud.create);
router.put("/:id", adminOnly, crud.update);
router.delete("/:id", adminOnly, crud.remove);

export default router;
