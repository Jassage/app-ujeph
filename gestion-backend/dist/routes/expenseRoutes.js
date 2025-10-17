"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/expenseRoutes.ts
const express_1 = __importDefault(require("express"));
const expenseController_1 = require("../controllers/expenseController");
const validation_1 = require("../middleware/validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
router.post("/", validation_1.validateExpense, expenseController_1.createExpense);
router.get("/", expenseController_1.getExpenses);
router.get("/stats", expenseController_1.getExpenseStats);
router.get("/:id", expenseController_1.getExpenseById);
router.put("/:id", expenseController_1.updateExpense);
router.delete("/:id", expenseController_1.deleteExpense);
exports.default = router;
