import express from "express";
import {
  bulkImportProfesseurs,
  bulkUpdateStatus,
  createProfesseur,
  deleteprofesseur,
  getprofesseurAssignments,
  getProfesseurs,
  // getprofesseurStats,
  updateprofesseur,
} from "../controllers/professeurController";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions } from "../middleware/deanPermissions";

const router = express.Router();
router.use(authenticateToken, deanPermissions);

router.post("/", createProfesseur);
router.get("/", getProfesseurs);
// router.get("/:id", getProfesseurById);
router.put("/:id", updateprofesseur);
router.delete("/:id", deleteprofesseur);
router.get("/:id/assignments", getprofesseurAssignments);
router.post("/bulk-import", bulkImportProfesseurs);
router.patch("/bulk-status", bulkUpdateStatus);
export default router;
