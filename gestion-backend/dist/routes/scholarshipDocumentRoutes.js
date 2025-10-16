import { Router } from "express";
import { getAllScholarshipDocuments, getScholarshipDocumentById, createScholarshipDocument, updateScholarshipDocument, deleteScholarshipDocument, } from "../controllers/scholarshipDocumentController";
const router = Router();
router.get("/", getAllScholarshipDocuments);
router.get("/:id", getScholarshipDocumentById);
router.post("/", createScholarshipDocument);
router.put("/:id", updateScholarshipDocument);
router.delete("/:id", deleteScholarshipDocument);
export default router;
//# sourceMappingURL=scholarshipDocumentRoutes.js.map