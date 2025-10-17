"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uEController_1 = require("../controllers/uEController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const courseAssignmentControllers_1 = require("../controllers/courseAssignmentControllers");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
// Routes publiques
router.get("/public/search", uEController_1.searchUEs);
// Routes protégées
router.get("/", uEController_1.getUEs);
router.get("/faculty/:facultyId/level/:level", courseAssignmentControllers_1.getUEsByFacultyAndLevel);
router.get("/search", uEController_1.searchUEs);
router.get("/:id", uEController_1.getUEById);
router.get("/:id/stats", uEController_1.getUEStats);
router.post("/", (0, auth_middleware_1.requireRole)(["Admin", "Directeur", "Secrétaire"]), uEController_1.createUE);
router.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(["Admin", "Directeur", "Secrétaire"]), uEController_1.updateUE);
router.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(["Admin", "Directeur"]), uEController_1.deleteUE);
router.post("/:id/prerequisites", auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(["Admin", "Directeur", "Secrétaire"]), uEController_1.addPrerequisite);
router.delete("/:id/prerequisites/:prerequisiteId", auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(["Admin", "Directeur", "Secrétaire"]), uEController_1.removePrerequisite);
exports.default = router;
