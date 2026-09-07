import { Router } from "express";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers, toClient } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Payment, { required: ["id", "invoiceId", "amount"] });

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "tenant") {
      // payments for invoices belonging to this tenant
      const invoices = await Invoice.find({ tenantId: req.user.tenantId }).select("id").lean();
      filter.invoiceId = { $in: invoices.map((i) => i.id) };
    } else if (req.query.invoiceId) {
      filter.invoiceId = req.query.invoiceId;
    }
    const docs = await Payment.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs.map(toClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", adminOnly, crud.get);
router.post("/", adminOnly, crud.create);
router.put("/:id", adminOnly, crud.update);
router.delete("/:id", adminOnly, crud.remove);

export default router;
