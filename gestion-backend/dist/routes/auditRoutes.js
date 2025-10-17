"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/audit.routes.ts
const express_1 = __importDefault(require("express"));
const auditController_1 = require("../controllers/auditController");
const backupController_1 = require("../controllers/backupController");
const router = express_1.default.Router();
router.get("/audit-logs", auditController_1.getAuditLogs);
router.get("/audit-statistics", auditController_1.getAuditStatistics);
router.get("/backup/sql", backupController_1.exportSQL);
router.get("/audit-logs/export", auditController_1.exportAuditLogs); // Ajoutez cette route
exports.default = router;
