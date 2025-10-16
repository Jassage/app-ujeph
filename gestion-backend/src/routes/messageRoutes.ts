import { Router } from "express";
import {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
} from "../controllers/messageController";

const router = Router();

router.get("/", getAllMessages);
router.get("/:id", getMessageById);
router.post("/", createMessage);
router.put("/:id", updateMessage);
router.delete("/:id", deleteMessage);

export default router;