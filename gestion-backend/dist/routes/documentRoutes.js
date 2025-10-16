import { Router } from "express";
import { generateDocument, previewDocument, downloadDocument, getStudentDocuments, } from "../controllers/documentController";
const router = Router();
// POST /api/documents/generate - Générer un nouveau document
router.post("/generate", generateDocument);
// GET /api/documents/preview/:id - Prévisualiser un document
router.get("/preview/:id", previewDocument);
// GET /api/documents/download/:id - Télécharger un document
router.get("/download/:id", downloadDocument);
// GET /api/documents/student/:studentId - Obtenir les documents d'un étudiant
router.get("/student/:studentId", getStudentDocuments);
export default router;
//# sourceMappingURL=documentRoutes.js.map