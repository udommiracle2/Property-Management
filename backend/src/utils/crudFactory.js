/**
 * Generic CRUD helpers that keep the frontend shape (custom `id` field)
 * and strip MongoDB `_id` / `__v` from responses.
 */

export function toClient(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

export function toClientList(docs) {
  return docs.map(toClient);
}

/**
 * Creates standard list / get / create / update / delete handlers
 * for models that use a string `id` field (matching the frontend).
 */
export function createCrudHandlers(Model, options = {}) {
  const {
    // Optional filter applied for tenant-role users
    tenantFilter = null,
    // Fields that must be present on create
    required = [],
  } = options;

  return {
    async list(req, res) {
      try {
        let filter = {};
        if (req.user?.role === "tenant" && tenantFilter) {
          filter = tenantFilter(req.user);
        }
        // Support simple query params: ?propertyId=... &status=...
        const allowed = ["propertyId", "unitId", "tenantId", "status", "ownerId", "vendorId", "invoiceId"];
        for (const key of allowed) {
          if (req.query[key] !== undefined) filter[key] = req.query[key];
        }
        const docs = await Model.find(filter).sort({ createdAt: -1 }).lean();
        res.json(toClientList(docs));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async get(req, res) {
      try {
        const doc = await Model.findOne({ id: req.params.id }).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        if (req.user?.role === "tenant" && tenantFilter) {
          const allowed = tenantFilter(req.user);
          // Simple check – if tenant filter has tenantId, enforce match
          if (allowed.tenantId && doc.tenantId && doc.tenantId !== allowed.tenantId) {
            return res.status(403).json({ error: "Forbidden" });
          }
        }
        res.json(toClient(doc));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async create(req, res) {
      try {
        for (const field of required) {
          if (req.body[field] === undefined || req.body[field] === "") {
            return res.status(400).json({ error: `${field} is required` });
          }
        }
        const payload = { ...req.body };
        // Ensure id is present (frontend usually sends it)
        if (!payload.id) {
          return res.status(400).json({ error: "id is required" });
        }
        const existing = await Model.findOne({ id: payload.id });
        if (existing) return res.status(409).json({ error: "ID already exists" });

        const doc = await Model.create(payload);
        res.status(201).json(toClient(doc));
      } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: "Duplicate key" });
        res.status(500).json({ error: err.message });
      }
    },

    async update(req, res) {
      try {
        const doc = await Model.findOneAndUpdate(
          { id: req.params.id },
          { $set: req.body },
          { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(toClient(doc));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async remove(req, res) {
      try {
        const doc = await Model.findOneAndDelete({ id: req.params.id });
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true, id: req.params.id });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}
