import express from "express";
import {
  createCourseAssignment,
  getCourseAssignments,
  // getCourseAssignmentById,
  updateCourseAssignment,
  deleteCourseAssignment,
  getAssignmentsByFaculty,
  getUEsByFacultyAndLevel,
  // getAssignmentStats,
} from "../controllers/courseAssignmentControllers";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions } from "../middleware/deanPermissions";

const router = express.Router();
router.use(authenticateToken, deanPermissions);

router.post("/", createCourseAssignment);
router.get("/", getCourseAssignments);
// router.get("/stats", getAssignmentStats);
// router.get("/:id", getCourseAssignmentById);
router.put("/:id", updateCourseAssignment);
router.delete("/:id", deleteCourseAssignment);

router.get("/faculty/:facultyId", getAssignmentsByFaculty);

export default router;
