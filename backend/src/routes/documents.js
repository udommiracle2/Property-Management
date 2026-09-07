import { Router } from "express";
import Document from "../models/Document.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Document, { required: ["id", "name"] });

router.use(authRequired, adminOnly);

router.get("/", crud.list);
router.get("/:id", crud.get);
router.post("/", crud.create);
router.put("/:id", crud.update);
router.delete("/:id", crud.remove);

export default router;
