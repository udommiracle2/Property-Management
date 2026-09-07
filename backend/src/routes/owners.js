import { Router } from "express";
import Owner from "../models/Owner.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Owner, { required: ["id", "name"] });

router.use(authRequired, adminOnly);

router.get("/", crud.list);
router.get("/:id", crud.get);
router.post("/", crud.create);
router.put("/:id", crud.update);
router.delete("/:id", crud.remove);

export default router;
