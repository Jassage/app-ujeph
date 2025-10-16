import { Router } from "express";
import { getAllEnrollments, createEnrollment, updateEnrollment, deleteEnrollment, fixEnrollmentStatuses, fixStudentEnrollmentStatus, } from "../controllers/enrollmentController";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions } from "../middleware/deanPermissions";
const router = Router();
router.use(authenticateToken, deanPermissions);
router.get("/", getAllEnrollments);
// router.get("/:id", getEnrollmentById);
router.post("/", createEnrollment);
router.put("/:id", updateEnrollment);
router.delete("/:id", deleteEnrollment);
// Nouvelles routes pour corriger les statuts
router.post("/fix-statuses/all", fixEnrollmentStatuses); // Pour tous les étudiants
router.post("/fix-statuses/student/:studentId", fixStudentEnrollmentStatus); // Pour un étudiant spécifique
export default router;
//# sourceMappingURL=enrollmentRoutes.js.map