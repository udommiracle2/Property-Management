import { Router } from "express";
import Notification from "../models/Notification.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers, toClient } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Notification, { required: ["id"] });

router.use(authRequired, adminOnly);

router.get("/", crud.list);
router.get("/:id", crud.get);
router.post("/", crud.create);

router.patch("/:id/read", async (req, res) => {
  try {
    const doc = await Notification.findOneAndUpdate(
      { id: req.params.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(toClient(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({}, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", crud.remove);

export default router;
