import { Router } from "express";
import { getAllMessageAttachments, getMessageAttachmentById, createMessageAttachment, updateMessageAttachment, deleteMessageAttachment, } from "../controllers/messageAttachmentController";
const router = Router();
router.get("/", getAllMessageAttachments);
router.get("/:id", getMessageAttachmentById);
router.post("/", createMessageAttachment);
router.put("/:id", updateMessageAttachment);
router.delete("/:id", deleteMessageAttachment);
export default router;
//# sourceMappingURL=messageAttachmentRoutes.js.map