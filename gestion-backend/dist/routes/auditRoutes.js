// routes/audit.routes.ts
import express from "express";
import { exportAuditLogs, getAuditLogs, getAuditStatistics, } from "../controllers/auditController";
import { exportSQL } from "../controllers/backupController";
const router = express.Router();
router.get("/audit-logs", getAuditLogs);
router.get("/audit-statistics", getAuditStatistics);
router.get("/backup/sql", exportSQL);
router.get("/audit-logs/export", exportAuditLogs); // Ajoutez cette route
export default router;
//# sourceMappingURL=auditRoutes.js.map