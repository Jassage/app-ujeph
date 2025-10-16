// routes/grades.ts
import express from "express";
import {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getStudentGrades,
  getUEGrades,
  bulkCreateGrades,
  getGradeHistory, // Nouvelle route si nécessaire
} from "../controllers/gradeController";

const router = express.Router();

// Routes de base
router.get("/", getAllGrades);
router.get("/:id", getGradeById);
router.post("/", createGrade);
router.put("/:id", updateGrade); // ← Vérifiez que cette route existe
router.delete("/:id", deleteGrade);

// Routes spécifiques
router.get("/student/:studentId", getStudentGrades);
router.get("/ue/:ueId", getUEGrades);
router.post("/bulk", bulkCreateGrades);
router.get(
  "/history/:studentId/:ueId/:academicYearId/:semester",
  getGradeHistory
);

export default router;
