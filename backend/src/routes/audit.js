import { Router } from "express";
import AuditLog from "../models/AuditLog.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(AuditLog, { required: ["id"] });

router.use(authRequired, adminOnly);

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const docs = await AuditLog.find({}).sort({ at: -1, createdAt: -1 }).limit(limit).lean();
    res.json(docs.map((d) => {
      const o = { ...d };
      delete o._id;
      delete o.__v;
      return o;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", crud.create);

export default router;
