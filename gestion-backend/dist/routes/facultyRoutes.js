// src/routes/facultyRoutes.ts
import express from "express";
import { createFaculty, getFaculties, getFacultyById, updateFaculty, deleteFaculty, getFacultyStats, getDeanFaculty, // ← Ajoutez cette fonction
 } from "../controllers/facultyController";
import { authenticateToken } from "../middleware/auth.middleware";
import { deanPermissions, checkDeanAccess, } from "../middleware/deanPermissions";
const router = express.Router();
// Appliquer l'authentification et les permissions doyen à toutes les routes
router.use(authenticateToken, deanPermissions);
router.post("/", createFaculty); // Les doyens sont bloqués dans le controller
router.get("/", getFaculties);
router.get("/stats", getFacultyStats);
router.get("/dean/:userId", getDeanFaculty); // ← Nouvelle route pour récupérer la faculté d'un doyen
router.get("/:id", checkDeanAccess("faculty"), getFacultyById);
router.put("/:id", checkDeanAccess("faculty"), updateFaculty);
router.delete("/:id", checkDeanAccess("faculty"), deleteFaculty); // Les doyens sont bloqués dans le controller
export default router;
//# sourceMappingURL=facultyRoutes.js.map