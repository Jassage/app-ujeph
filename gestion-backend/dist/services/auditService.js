// src/services/auditService.ts
import prisma from "../prisma";
export class AuditService {
    static async log(data) {
        try {
            // Vérifier que prisma.auditLog existe
            if (!prisma.auditLog) {
                console.error("❌ AuditLog model not available in Prisma client");
                return;
            }
            await prisma.auditLog.create({
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
export default AuditService;
//# sourceMappingURL=auditService.js.map