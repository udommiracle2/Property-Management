/**
 * Bulk store endpoint – mirrors the frontend eh_store_v3 shape.
 * Every read is scoped to req.user.id (the admin's MongoDB _id) so
 * one landlord never sees another's data.
 */
import { Router } from "express";
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import Tenant from "../models/Tenant.js";
import Lease from "../models/Lease.js";
import Invoice from "../models/Invoice.js";
import Expense from "../models/Expense.js";
import Maintenance from "../models/Maintenance.js";
import Message from "../models/Message.js";
import Announcement from "../models/Announcement.js";
import Owner from "../models/Owner.js";
import Vendor from "../models/Vendor.js";
import Document from "../models/Document.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { toClientList } from "../utils/crudFactory.js";

const router = Router();

const collections = {
  properties:    Property,
  units:         Unit,
  tenants:       Tenant,
  leases:        Lease,
  invoices:      Invoice,
  expenses:      Expense,
  maintenance:   Maintenance,
  messages:      Message,
  announcements: Announcement,
  owners:        Owner,
  vendors:       Vendor,
  documents:     Document,
  payments:      Payment,
  notifications: Notification,
  auditLog:      AuditLog,
};

/** GET /api/store – full dump scoped to the logged-in admin */
router.get("/", authRequired, adminOnly, async (req, res) => {
  try {
    const adminId = req.user.id;
    const result = {};
    await Promise.all(
      Object.entries(collections).map(async ([key, Model]) => {
        const docs = await Model.find({ adminId }).lean();
        result[key] = toClientList(docs);
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/store – replace this admin's entire store (import). Destructive. */
router.put("/", authRequired, adminOnly, async (req, res) => {
  try {
    const adminId = req.user.id;
    const body = req.body || {};
    await Promise.all(
      Object.entries(collections).map(async ([key, Model]) => {
        if (!Array.isArray(body[key])) return;
        // Only wipe + replace this admin's documents
        await Model.deleteMany({ adminId });
        if (body[key].length) {
          const stamped = body[key].map(doc => ({ ...doc, adminId }));
          await Model.insertMany(stamped, { ordered: false });
        }
      })
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/store – reset only this admin's data, never another admin's */
router.delete("/", authRequired, adminOnly, async (req, res) => {
  try {
    const adminId = req.user.id;
    await Promise.all(
      Object.values(collections).map(Model => Model.deleteMany({ adminId }))
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
