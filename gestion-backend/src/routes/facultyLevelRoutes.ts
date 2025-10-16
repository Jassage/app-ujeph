import { Router } from "express";
import {
  getAllFacultyLevels,
  getFacultyLevelById,
  createFacultyLevel,
  updateFacultyLevel,
  deleteFacultyLevel,
} from "../controllers/facultyLevelController";

const router = Router();

router.get("/", getAllFacultyLevels);
router.get("/:id", getFacultyLevelById);
router.post("/", createFacultyLevel);
router.put("/:id", updateFacultyLevel);
router.delete("/:id", deleteFacultyLevel);

export default router;