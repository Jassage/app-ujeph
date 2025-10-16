// routes/expenseRoutes.ts
import express from "express";
import { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense, getExpenseStats, } from "../controllers/expenseController";
import { validateExpense } from "../middleware/validation";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions } from "../middleware/deanPermissions";
const router = express.Router();
router.use(authenticateToken, deanPermissions);
router.post("/", validateExpense, createExpense);
router.get("/", getExpenses);
router.get("/stats", getExpenseStats);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);
export default router;
//# sourceMappingURL=expenseRoutes.js.map