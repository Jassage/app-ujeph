// routes/backupRoutes.ts
import express from "express";
import { exportSQL, createBackup, listBackups, downloadBackup, getBackupStats, deleteBackup, } from "../controllers/backupController";
import { authenticateToken } from "../middleware/auth.middleware";
const router = express.Router();
router.use(authenticateToken);
router.get("/export", exportSQL);
router.post("/create", createBackup);
router.get("/list", listBackups);
router.get("/download/:filename", downloadBackup);
router.get("/statistics", getBackupStats);
router.delete("/:filename", deleteBackup); // Nouvelle route de suppression
export default router;
//# sourceMappingURL=backupRoutes.js.map