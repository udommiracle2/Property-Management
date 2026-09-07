import { Router } from "express";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import { authRequired, adminOnly, adminOrSelfTenant } from "../middleware/auth.js";
import { createCrudHandlers, toClient } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Tenant, {
  required: ["id", "name"],
  tenantFilter: (user) => ({ id: user.tenantId }),
});

router.use(authRequired);

router.get("/", adminOnly, crud.list);

/** Tenant can fetch their own profile */
router.get("/me", async (req, res) => {
  try {
    if (req.user.role !== "tenant" || !req.user.tenantId) {
      return res.status(403).json({ error: "Tenant access required" });
    }
    const doc = await Tenant.findOne({ id: req.user.tenantId }).lean();
    if (!doc) return res.status(404).json({ error: "Tenant profile not found" });

    const tenant = toClient(doc);
    let unit = null;
    let property = null;
    if (tenant.unitId) {
      const unitDoc = await Unit.findOne({ id: tenant.unitId }).lean();
      if (unitDoc) {
        unit = toClient(unitDoc);
        const propertyDoc = await Property.findOne({ id: unit.propertyId }).lean();
        if (propertyDoc) property = toClient(propertyDoc);
      }
    }

    res.json({ ...tenant, unit, property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", adminOrSelfTenant, async (req, res) => {
  try {
    const doc = await Tenant.findOne({ id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (req.user.role === "tenant" && doc.id !== req.user.tenantId) {
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
