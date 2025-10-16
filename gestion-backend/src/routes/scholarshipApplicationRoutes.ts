import { Router } from "express";
import {
  getAllScholarshipApplications,
  getScholarshipApplicationById,
  createScholarshipApplication,
  updateScholarshipApplication,
  deleteScholarshipApplication,
} from "../controllers/scholarshipApplicationController";

const router = Router();

router.get("/", getAllScholarshipApplications);
router.get("/:id", getScholarshipApplicationById);
router.post("/", createScholarshipApplication);
router.put("/:id", updateScholarshipApplication);
router.delete("/:id", deleteScholarshipApplication);

export default router;