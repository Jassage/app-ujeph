// src/routes/studentRoutes.ts
import express from "express";
import { createStudent, getStudents, updateStudent, deleteStudent, importStudents, updateStudentPhoto, downloadImportTemplate, getStudent, } from "../controllers/studentController";
import { uploadProfile, uploadImport } from "../middleware/upload";
import { deanPermissions, checkDeanAccess, } from "../middleware/deanPermissions";
import { authenticateToken } from "../middleware/auth.middleware";
// import { authenticateToken } from "../middleware/auth.middleware";
const router = express.Router();
// Appliquer l'authentification et les permissions doyen à toutes les routes
router.use(authenticateToken, deanPermissions);
router.post("/", authenticateToken, uploadProfile.single("photo"), createStudent);
router.get("/", getStudents);
router.get("/:id", checkDeanAccess("student"), getStudent);
router.put("/:id", uploadProfile.single("photo"), checkDeanAccess("student"), updateStudent);
router.delete("/:id", checkDeanAccess("student"), deleteStudent);
// Autres routes
router.post("/import", uploadImport.single("file"), importStudents);
router.patch("/:id/photo", uploadProfile.single("photo"), checkDeanAccess("student"), updateStudentPhoto);
router.get("/import/template", downloadImportTemplate);
export default router;
//# sourceMappingURL=studentRoutes.js.map