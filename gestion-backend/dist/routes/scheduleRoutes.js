import { Router } from "express";
import { getAllSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule, } from "../controllers/scheduleController";
const router = Router();
router.get("/", getAllSchedules);
router.get("/:id", getScheduleById);
router.post("/", createSchedule);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);
export default router;
//# sourceMappingURL=scheduleRoutes.js.map