"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const router = (0, express_1.Router)();
// POST /api/documents/generate - Générer un nouveau document
router.post("/generate", documentController_1.generateDocument);
// GET /api/documents/preview/:id - Prévisualiser un document
router.get("/preview/:id", documentController_1.previewDocument);
// GET /api/documents/download/:id - Télécharger un document
router.get("/download/:id", documentController_1.downloadDocument);
// GET /api/documents/student/:studentId - Obtenir les documents d'un étudiant
router.get("/student/:studentId", documentController_1.getStudentDocuments);
exports.default = router;
