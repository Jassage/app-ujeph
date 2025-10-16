// routes/feePaymentRoutes.ts
import { Router } from "express";
import {
  createFeePayment,
  deleteFeePayment,
  getAllFeePayments,
  getFeePaymentById,
  updateFeePayment,
  getPaymentHistory,
} from "../controllers/feePaymentController";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions } from "../middleware/deanPermissions";

const router = Router();
router.use(authenticateToken, deanPermissions);
router.get("/", getAllFeePayments);
router.get("/:id", getFeePaymentById);
router.post("/", createFeePayment);
router.put("/:id", updateFeePayment);
router.delete("/:id", deleteFeePayment);
router.get("/:studentFeeId/history", getPaymentHistory);

export default router;
