"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/feePaymentRoutes.ts
const express_1 = require("express");
const feePaymentController_1 = require("../controllers/feePaymentController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
router.get("/", feePaymentController_1.getAllFeePayments);
router.get("/:id", feePaymentController_1.getFeePaymentById);
router.post("/", feePaymentController_1.createFeePayment);
router.put("/:id", feePaymentController_1.updateFeePayment);
router.delete("/:id", feePaymentController_1.deleteFeePayment);
router.get("/:studentFeeId/history", feePaymentController_1.getPaymentHistory);
exports.default = router;
