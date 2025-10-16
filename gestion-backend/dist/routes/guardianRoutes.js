import { Router } from "express";
import { getAllGuardians, getGuardianById, createGuardian, updateGuardian, deleteGuardian, } from "../controllers/guardianController";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions } from "../middleware/deanPermissions";
const router = Router();
router.use(authenticateToken, deanPermissions);
router.get("/", getAllGuardians);
router.get("/:id", getGuardianById);
router.post("/", createGuardian);
router.put("/:id", updateGuardian);
router.delete("/:id", deleteGuardian);
export default router;
//# sourceMappingURL=guardianRoutes.js.map