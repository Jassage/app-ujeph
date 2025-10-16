// controllers/auditController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
// import { AuthenticatedRequest } from "../middleware/auth.middleware";

// FONCTION CORRIGÉE : Fonction utilitaire pour créer des logs d'audit
export const createAuditLog = async (data: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  status: "SUCCESS" | "ERROR" | "WARNING";
  errorMessage?: string;
  metadata?: any;
}) => {
  try {
    // Vérifier si l'utilisateur existe
    let userExists = false;
    if (data.userId && data.userId !== "unknown") {
      try {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true },
        });
        userExists = !!user;
      } catch (userError) {
        console.warn("⚠️ Erreur vérification utilisateur:", userError);
        userExists = false;
      }
    }

    await prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: userExists ? data.userId : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        description: data.description,
        status: data.status,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error("❌ Erreur création audit log:", error);
  }
};

export const getUserIdFromRequest = (
  req: Request // 🔥 Utiliser Request standard
): string | undefined => {
  return req.user?.id; // Simple et direct maintenant
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "50",
      action,
      entity,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: "insensitive" } },
        { entityId: { contains: search as string } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des logs" });
  }
};

export const getAuditStatistics = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await prisma.auditLog.groupBy({
      by: ["action", "entity"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    const dailyActivity = await prisma.auditLog.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    res.json({ stats, dailyActivity });
  } catch (error) {
    res.status(500).json({ error: "Erreur statistiques" });
  }
};

// controllers/auditController.ts - Ajoutez cette fonction
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const { format = "json", action, entity, status, search } = req.query;

    const where: any = {};

    if (action && action !== "all") where.action = action;
    if (entity && entity !== "all") where.entity = entity;
    if (status && status !== "all") where.status = status;

    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: "insensitive" } },
        { entityId: { contains: search as string } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // Conversion en CSV
      const csvHeaders = [
        "Date",
        "Action",
        "Entité",
        "Utilisateur",
        "Description",
        "Statut",
        "IP",
      ];
      const csvRows = logs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.action,
        log.entity,
        log.user ? `${log.user.firstName} ${log.user.lastName}` : "Système",
        `"${log.description.replace(/"/g, '""')}"`, // Échapper les guillemets
        log.status || "SUCCESS",
        log.ipAddress,
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${new Date().toISOString().split("T")[0]}.csv`
      );
      res.send(csvContent);
    } else {
      // JSON par défaut
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${new Date().toISOString().split("T")[0]}.json`
      );
      res.json(logs);
    }
  } catch (error) {
    console.error("Erreur export logs:", error);
    res.status(500).json({ error: "Erreur lors de l'export des logs" });
  }
};
