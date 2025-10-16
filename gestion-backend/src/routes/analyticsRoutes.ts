import { Router } from "express";
import {
  getAllAnalyticss,
  getAnalyticsById,
  createAnalytics,
  updateAnalytics,
  deleteAnalytics,
} from "../controllers/analyticsController";

const router = Router();

router.get("/", getAllAnalyticss);
router.get("/:id", getAnalyticsById);
router.post("/", createAnalytics);
router.put("/:id", updateAnalytics);
router.delete("/:id", deleteAnalytics);

export default router;