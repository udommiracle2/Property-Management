import { Router } from "express";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers, toClient } from "../utils/crudFactory.js";
import { makeId, todayISO } from "../utils/ids.js";

const router = Router();
const crud = createCrudHandlers(Invoice, {
  tenantFilter: (u) => ({ tenantId: u.tenantId }),
  required: ["id", "tenantId", "amount"],
});

router.use(authRequired);

router.get("/", async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "tenant") {
      filter.tenantId = req.user.tenantId;
    } else {
      // Admin: only their own invoices
      filter.adminId = req.user.id;
      if (req.query.tenantId) filter.tenantId = req.query.tenantId;
      if (req.query.status)   filter.status   = req.query.status;
    }
    const docs = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs.map(toClient));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await Invoice.findOne({ id: req.params.id }).lean();
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

router.post("/", adminOnly, crud.create);
router.put("/:id", adminOnly, crud.update);
router.delete("/:id", adminOnly, crud.remove);

/** POST /api/invoices/:id/pay  – mark paid + create payment record */
router.post("/:id/pay", adminOnly, async (req, res) => {
  try {
    const { method = "", note = "" } = req.body;
    const invoice = await Invoice.findOne({ id: req.params.id, adminId: req.user.id });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const amount = invoice.total || invoice.amount || 0;
    invoice.status = "Paid";
    invoice.paid = todayISO();
    if (method) invoice.method = method;
    await invoice.save();

    const payment = await Payment.create({
      id: makeId("PAY"),
      adminId: req.user.id,
      invoiceId: invoice.id,
      amount,
      method,
      paidAt: todayISO(),
      note,
      receiptNo: `RCT-${Math.floor(Math.random() * 9000 + 1000)}`,
    });

    res.json({ invoice: toClient(invoice), payment: toClient(payment) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/invoices/:id/late-fee */
router.post("/:id/late-fee", adminOnly, async (req, res) => {
  try {
    const fee = Number(req.body.fee) || 0;
    const invoice = await Invoice.findOne({ id: req.params.id, adminId: req.user.id });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    invoice.lateFee = fee;
    invoice.total = (invoice.amount || 0) + fee;
    await invoice.save();
    res.json(toClient(invoice));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
