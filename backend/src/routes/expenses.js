import { Router } from "express";
import Expense from "../models/Expense.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { createCrudHandlers } from "../utils/crudFactory.js";

const router = Router();
const crud = createCrudHandlers(Expense, { required: ["id", "amount"] });

router.use(authRequired, adminOnly);

router.get("/", crud.list);
router.get("/:id", crud.get);
router.post("/", crud.create);
router.put("/:id", crud.update);
router.delete("/:id", crud.remove);

export default router;
