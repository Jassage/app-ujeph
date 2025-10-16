import { Router } from "express";
import {
  getAllPrerequisites,
  getPrerequisiteById,
  createPrerequisite,
  updatePrerequisite,
  deletePrerequisite,
} from "../controllers/prerequisiteController";

const router = Router();

router.get("/", getAllPrerequisites);
router.get("/:id", getPrerequisiteById);
router.post("/", createPrerequisite);
router.put("/:id", updatePrerequisite);
router.delete("/:id", deletePrerequisite);

export default router;