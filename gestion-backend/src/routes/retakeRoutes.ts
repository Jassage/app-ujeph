import { Router } from "express";
import {
  getAllRetakes,
  getRetakeById,
  createRetake,
  updateRetake,
  deleteRetake,
} from "../controllers/retakeController";

const router = Router();

router.get("/", getAllRetakes);
router.get("/:id", getRetakeById);
router.post("/", createRetake);
router.put("/:id", updateRetake);
router.delete("/:id", deleteRetake);

export default router;