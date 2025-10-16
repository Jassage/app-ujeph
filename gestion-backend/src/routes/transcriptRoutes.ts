import { Router } from "express";
import {
  getAllTranscripts,
  getTranscriptById,
  createTranscript,
  updateTranscript,
  deleteTranscript,
  downloadTranscript,
} from "../controllers/transcriptController";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions } from "../middleware/deanPermissions";

const router = Router();
router.use(authenticateToken, deanPermissions);

router.get("/", getAllTranscripts);
router.get("/:id", getTranscriptById);
router.post("/", createTranscript);
router.put("/:id", updateTranscript);
router.delete("/:id", deleteTranscript);
router.get("/:id/download", downloadTranscript);

export default router;
