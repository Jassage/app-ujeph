import { Router } from "express";
import {
  getAllEventParticipants,
  getEventParticipantById,
  createEventParticipant,
  updateEventParticipant,
  deleteEventParticipant,
} from "../controllers/eventParticipantController";

const router = Router();

router.get("/", getAllEventParticipants);
router.get("/:id", getEventParticipantById);
router.post("/", createEventParticipant);
router.put("/:id", updateEventParticipant);
router.delete("/:id", deleteEventParticipant);

export default router;