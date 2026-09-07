import { Router } from "express";
import Announcement from "../models/Announcement.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Announcement, { required: ["id", "subject"] });

router.use(authRequired);

// Both roles can read announcements
router.get("/", crud.list);
router.get("/:id", crud.get);

router.post("/", adminOnly, crud.create);
router.put("/:id", adminOnly, crud.update);
router.delete("/:id", adminOnly, crud.remove);

export default router;
