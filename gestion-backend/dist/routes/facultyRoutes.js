"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/facultyRoutes.ts
const express_1 = __importDefault(require("express"));
const facultyController_1 = require("../controllers/facultyController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = express_1.default.Router();
// Appliquer l'authentification et les permissions doyen à toutes les routes
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
router.post("/", facultyController_1.createFaculty); // Les doyens sont bloqués dans le controller
router.get("/", facultyController_1.getFaculties);
router.get("/stats", facultyController_1.getFacultyStats);
router.get("/dean/:userId", facultyController_1.getDeanFaculty); // ← Nouvelle route pour récupérer la faculté d'un doyen
router.get("/:id", (0, deanPermissions_1.checkDeanAccess)("faculty"), facultyController_1.getFacultyById);
router.put("/:id", (0, deanPermissions_1.checkDeanAccess)("faculty"), facultyController_1.updateFaculty);
router.delete("/:id", (0, deanPermissions_1.checkDeanAccess)("faculty"), facultyController_1.deleteFaculty); // Les doyens sont bloqués dans le controller
exports.default = router;
