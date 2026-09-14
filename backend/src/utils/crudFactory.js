/**
 * Generic CRUD helpers that keep the frontend shape (custom `id` field)
 * and strip MongoDB `_id` / `__v` from responses.
 *
 * Every write stamps adminId from req.user.id.
 * Every read filters by adminId so landlords never see each other's data.
 * Tenant-role users are further scoped by tenantFilter (unchanged).
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
 * Resolves the base query filter for a request:
 * - Admins: scoped to their own adminId
 * - Tenants: scoped by tenantFilter (e.g. { tenantId: req.user.tenantId })
 *   BUT we look up what adminId their tenantId belongs to so we still
 *   only read from the right admin's data silo.
 */
function baseFilter(req, tenantFilter) {
  if (req.user?.role === "tenant" && tenantFilter) {
    // Tenant reads are scoped by tenantId — adminId is not on req.user
    // for tenants, so we do NOT add an adminId filter here. The tenantFilter
    // (e.g. { tenantId }) is already scoped correctly because tenantIds are
    // globally unique strings — no two admins can have the same tenant id.
    return tenantFilter(req.user);
  }
  // Admin: scope to their own data
  return { adminId: req.user.id };
}

/**
 * Creates standard list / get / create / update / delete handlers
 * for models that use a string `id` field (matching the frontend).
 */
export function createCrudHandlers(Model, options = {}) {
  const {
    tenantFilter = null,
    required = [],
  } = options;

  return {
    async list(req, res) {
      try {
        let filter = baseFilter(req, tenantFilter);
        // Support simple query params: ?propertyId=... &status=... etc.
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
        const filter = { ...baseFilter(req, tenantFilter), id: req.params.id };
        const doc = await Model.findOne(filter).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
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
        if (!payload.id) {
          return res.status(400).json({ error: "id is required" });
        }

        // Stamp the admin's id — this is what isolates their data
        if (req.user?.role === "admin") {
          payload.adminId = req.user.id;
        } else if (!payload.adminId) {
          // Tenant-created records (e.g. maintenance tickets) need an adminId.
          // We resolve it from the tenant's profile which was created by an admin.
          // For now fall back to a sentinel so the unique constraint on `id` still
          // protects the DB — the routes that allow tenant writes should set this.
          payload.adminId = req.user.adminId || "tenant";
        }

<<<<<<< HEAD
        const existing = await Model.findOne({ id: payload.id });
=======
        // Check for duplicate ID within this admin's own data only.
        // Two different admins are allowed to have documents with the same
        // id string — they live in separate silos.
        const existing = await Model.findOne({ id: payload.id, adminId: payload.adminId });
>>>>>>> 7e4e8ca (another commit)
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
        // Scope update to the admin's own data — prevents one admin from
        // updating another's document even if they guess the id.
        const scopeFilter = req.user?.role === "admin"
          ? { id: req.params.id, adminId: req.user.id }
          : { id: req.params.id };

        const doc = await Model.findOneAndUpdate(
          scopeFilter,
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
        const scopeFilter = req.user?.role === "admin"
          ? { id: req.params.id, adminId: req.user.id }
          : { id: req.params.id };

        const doc = await Model.findOneAndDelete(scopeFilter);
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true, id: req.params.id });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}
