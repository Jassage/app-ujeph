"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/backupRoutes.ts
const express_1 = __importDefault(require("express"));
const backupController_1 = require("../controllers/backupController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticateToken);
router.get("/export", backupController_1.exportSQL);
router.post("/create", backupController_1.createBackup);
router.get("/list", backupController_1.listBackups);
router.get("/download/:filename", backupController_1.downloadBackup);
router.get("/statistics", backupController_1.getBackupStats);
router.delete("/:filename", backupController_1.deleteBackup); // Nouvelle route de suppression
exports.default = router;
