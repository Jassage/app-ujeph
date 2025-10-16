import { Router } from "express";
import { getAllAnnouncementAttachments, getAnnouncementAttachmentById, createAnnouncementAttachment, updateAnnouncementAttachment, deleteAnnouncementAttachment, } from "../controllers/announcementAttachmentController";
const router = Router();
router.get("/", getAllAnnouncementAttachments);
router.get("/:id", getAnnouncementAttachmentById);
router.post("/", createAnnouncementAttachment);
router.put("/:id", updateAnnouncementAttachment);
router.delete("/:id", deleteAnnouncementAttachment);
export default router;
//# sourceMappingURL=announcementAttachmentRoutes.js.map