"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
// src/services/auditService.ts
const prisma_1 = __importDefault(require("../prisma"));
class AuditService {
    static async log(data) {
        try {
            // Vérifier que prisma.auditLog existe
            if (!prisma_1.default.auditLog) {
                console.error("❌ AuditLog model not available in Prisma client");
                return;
            }
            await prisma_1.default.auditLog.create({
                data: {
                    action: data.action,
                    entity: data.entity,
                    entityId: data.entityId,
                    description: data.description,
                    oldData: data.oldData,
                    newData: data.newData,
                    userId: data.userId,
                    userAgent: data.userAgent,
                    ipAddress: data.ipAddress,
                    status: data.status,
                    errorMessage: data.errorMessage,
                    duration: data.duration,
                    createdAt: new Date(),
                },
            });
        }
        catch (error) {
            console.error("❌ Échec de la journalisation d'audit:", error);
            // Ne pas throw l'erreur pour ne pas interrompre le flux principal
        }
    }
}
exports.AuditService = AuditService;
exports.default = AuditService;
