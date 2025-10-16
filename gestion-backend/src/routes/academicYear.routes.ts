// src/routes/academicYear.routes.ts
import { Router } from "express";
import {
  getAcademicYears,
  getCurrentYear,
  createAcademicYear,
  checkAcademicYear,
} from "../controllers/academicYearController";

const router = Router();

router.get("/", getAcademicYears);
router.get("/current", getCurrentYear);
router.get("/check", checkAcademicYear);
router.post("/", createAcademicYear);

export default router;
