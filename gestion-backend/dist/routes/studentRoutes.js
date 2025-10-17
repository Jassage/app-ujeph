"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/studentRoutes.ts
const express_1 = __importDefault(require("express"));
const studentController_1 = require("../controllers/studentController");
const upload_1 = require("../middleware/upload");
const deanPermissions_1 = require("../middleware/deanPermissions");
const auth_middleware_1 = require("../middleware/auth.middleware");
// import { authenticateToken } from "../middleware/auth.middleware";
const router = express_1.default.Router();
// Appliquer l'authentification et les permissions doyen à toutes les routes
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
router.post("/", auth_middleware_1.authenticateToken, upload_1.uploadProfile.single("photo"), studentController_1.createStudent);
router.get("/", studentController_1.getStudents);
router.get("/:id", (0, deanPermissions_1.checkDeanAccess)("student"), studentController_1.getStudent);
router.put("/:id", upload_1.uploadProfile.single("photo"), (0, deanPermissions_1.checkDeanAccess)("student"), studentController_1.updateStudent);
router.delete("/:id", (0, deanPermissions_1.checkDeanAccess)("student"), studentController_1.deleteStudent);
// Autres routes
router.post("/import", upload_1.uploadImport.single("file"), studentController_1.importStudents);
router.patch("/:id/photo", upload_1.uploadProfile.single("photo"), (0, deanPermissions_1.checkDeanAccess)("student"), studentController_1.updateStudentPhoto);
router.get("/import/template", studentController_1.downloadImportTemplate);
exports.default = router;
