// routes/studentFeeRoutes.ts
import { Router } from "express";
import { getAllStudentFees, getStudentFeeById, updateStudentFee, deleteStudentFee, assignFeeToStudent, getStudentFeeByStudentAndYear, getStudentFeesByStudent, } from "../controllers/studentFeeController";
const router = Router();
router.get("/", getAllStudentFees);
router.get("/:id", getStudentFeeById);
// Ajoutez cette nouvelle route
router.get("/student/:studentId/:academicYear", getStudentFeeByStudentAndYear);
router.get("/student/:studentId", getStudentFeesByStudent);
router.post("/", assignFeeToStudent);
router.put("/:id", updateStudentFee);
router.delete("/:id", deleteStudentFee);
export default router;
//# sourceMappingURL=studentFeeRoutes.js.map