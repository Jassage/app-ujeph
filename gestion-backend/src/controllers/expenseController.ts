// controllers/expenseController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
import { createAuditLog } from "./auditController";

// Fonction utilitaire pour gérer les erreurs unknown
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  } else {
    return "Erreur inconnue";
  }
};

// Types basés sur votre modèle Prisma
interface CreateExpenseInput {
  category: string;
  amount: number;
  description?: string;
  date: Date;
  paymentMethod: string;
  createdBy: string;
}

interface UpdateExpenseInput {
  category?: string;
  amount?: number;
  description?: string;
  date?: Date;
  paymentMethod?: string;
  status?: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
}

export const createExpense = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const expenseData: CreateExpenseInput = req.body;
    console.log(`Received expense data:`, expenseData);

    // Validation des données obligatoires basée sur votre modèle
    if (
      !expenseData.category ||
      !expenseData.amount ||
      !expenseData.date ||
      !expenseData.paymentMethod ||
      !expenseData.createdBy
    ) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_EXPENSE_ATTEMPT",
        entity: "Expense",
        description:
          "Tentative de création de dépense - données obligatoires manquantes",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error:
          "Les champs category, amount, date, paymentMethod et createdBy sont obligatoires",
      });
    }

    // Validation du montant
    if (expenseData.amount <= 0) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_EXPENSE_ATTEMPT",
        entity: "Expense",
        description: "Tentative de création de dépense - montant invalide",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "Le montant doit être supérieur à 0",
      });
    }

    // Vérifier si l'utilisateur créateur existe
    const creator = await prisma.user.findUnique({
      where: { id: expenseData.createdBy },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!creator) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_EXPENSE_ATTEMPT",
        entity: "Expense",
        description: `Tentative de création de dépense - utilisateur créateur ${expenseData.createdBy} non trouvé`,
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Utilisateur créateur non trouvé",
      });
    }

    const expense = await prisma.expense.create({
      data: {
        ...expenseData,
        status: "Pending",
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log de création réussie
    await createAuditLog({
      ...auditData,
      action: "CREATE_EXPENSE_SUCCESS",
      entity: "Expense",
      entityId: expense.id,
      description: `Dépense créée: ${expense.category} - ${expense.amount} (${expense.paymentMethod}) par ${creator.firstName} ${creator.lastName}`,
      status: "SUCCESS",
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "CREATE_EXPENSE_ERROR",
      entity: "Expense",
      description: "Erreur lors de la création de la dépense",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(400).json({
      success: false,
      error: "Erreur lors de la création de la dépense",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const {
      category,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      createdBy,
      page = 1,
      limit = 10,
    } = req.query;

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (createdBy) where.createdBy = createdBy;

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount as string);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount as string);
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approver: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    // Log de consultation réussie
    await createAuditLog({
      ...auditData,
      action: "GET_EXPENSES_LIST_SUCCESS",
      entity: "Expense",
      description: `Consultation de la liste des dépenses - ${expenses.length} dépense(s) trouvée(s) sur ${total}`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "GET_EXPENSES_LIST_ERROR",
      entity: "Expense",
      description: "Erreur lors de la récupération des dépenses",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des dépenses",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "GET_EXPENSE_DETAILS_ATTEMPT",
        entity: "Expense",
        description: "Tentative de consultation de dépense - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "ID de la dépense requis",
      });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      await createAuditLog({
        ...auditData,
        action: "GET_EXPENSE_DETAILS_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: "Tentative de consultation de dépense - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Dépense non trouvée",
      });
    }

    // Log de consultation réussie
    await createAuditLog({
      ...auditData,
      action: "GET_EXPENSE_DETAILS_SUCCESS",
      entity: "Expense",
      entityId: id,
      description: `Consultation de la dépense: ${expense.category} - ${expense.amount} (${expense.paymentMethod})`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Error fetching expense:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "GET_EXPENSE_DETAILS_ERROR",
      entity: "Expense",
      entityId: req.params.id,
      description: "Erreur lors de la récupération de la dépense",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la dépense",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;
    const updateData: UpdateExpenseInput = req.body;

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "UPDATE_EXPENSE_ATTEMPT",
        entity: "Expense",
        description: "Tentative de mise à jour de dépense - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "ID de la dépense requis",
      });
    }

    // Vérifier si la dépense existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingExpense) {
      await createAuditLog({
        ...auditData,
        action: "UPDATE_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: "Tentative de mise à jour de dépense - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Dépense non trouvée",
      });
    }

    // Validation du montant si fourni
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      await createAuditLog({
        ...auditData,
        action: "UPDATE_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: "Tentative de mise à jour de dépense - montant invalide",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "Le montant doit être supérieur à 0",
      });
    }

    // Vérifier l'approbateur si fourni
    if (updateData.approvedBy) {
      const approver = await prisma.user.findUnique({
        where: { id: updateData.approvedBy },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!approver) {
        await createAuditLog({
          ...auditData,
          action: "UPDATE_EXPENSE_ATTEMPT",
          entity: "Expense",
          entityId: id,
          description: `Tentative de mise à jour de dépense - approbateur ${updateData.approvedBy} non trouvé`,
          status: "ERROR",
        });
        return res.status(404).json({
          success: false,
          error: "Approbateur non trouvé",
        });
      }
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log de mise à jour réussie
    await createAuditLog({
      ...auditData,
      action: "UPDATE_EXPENSE_SUCCESS",
      entity: "Expense",
      entityId: id,
      description: `Dépense mise à jour: ${expense.category} - ${expense.amount} (Statut: ${expense.status})`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Error updating expense:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "UPDATE_EXPENSE_ERROR",
      entity: "Expense",
      entityId: req.params.id,
      description: "Erreur lors de la mise à jour de la dépense",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(400).json({
      success: false,
      error: "Erreur lors de la mise à jour de la dépense",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "DELETE_EXPENSE_ATTEMPT",
        entity: "Expense",
        description: "Tentative de suppression de dépense - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "ID de la dépense requis",
      });
    }

    // Vérifier si la dépense existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingExpense) {
      await createAuditLog({
        ...auditData,
        action: "DELETE_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: "Tentative de suppression de dépense - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Dépense non trouvée",
      });
    }

    await prisma.expense.delete({
      where: { id },
    });

    // Log de suppression réussie
    await createAuditLog({
      ...auditData,
      action: "DELETE_EXPENSE_SUCCESS",
      entity: "Expense",
      entityId: id,
      description: `Dépense supprimée: ${existingExpense.category} - ${existingExpense.amount} créée par ${existingExpense.creator.firstName} ${existingExpense.creator.lastName}`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      message: "Dépense supprimée avec succès",
      deletedExpense: {
        id: existingExpense.id,
        category: existingExpense.category,
        amount: existingExpense.amount,
        status: existingExpense.status,
      },
    });
  } catch (error) {
    console.error("Error deleting expense:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "DELETE_EXPENSE_ERROR",
      entity: "Expense",
      entityId: req.params.id,
      description: "Erreur lors de la suppression de la dépense",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(400).json({
      success: false,
      error: "Erreur lors de la suppression de la dépense",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

export const getExpenseStats = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { period = "month" } = req.query;

    const now = new Date();
    let startDate: Date;
    let periodDescription: string;

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodDescription = "mois en cours";
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      periodDescription = "année en cours";
    } else {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30
      );
      periodDescription = "30 derniers jours";
    }

    const stats = await prisma.expense.groupBy({
      by: ["category", "status"],
      where: {
        date: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const total = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Log de consultation des statistiques réussie
    await createAuditLog({
      ...auditData,
      action: "GET_EXPENSE_STATS_SUCCESS",
      entity: "Expense",
      description: `Consultation des statistiques des dépenses (${periodDescription}) - Total: ${total._sum.amount || 0}, Count: ${total._count.id || 0}`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        totalAmount: total._sum.amount || 0,
        totalCount: total._count.id || 0,
        byCategory: stats,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "GET_EXPENSE_STATS_ERROR",
      entity: "Expense",
      description:
        "Erreur lors de la récupération des statistiques des dépenses",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

export const approveExpense = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "APPROVE_EXPENSE_ATTEMPT",
        entity: "Expense",
        description: "Tentative d'approbation de dépense - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "ID de la dépense requis",
      });
    }

    if (!approvedBy) {
      await createAuditLog({
        ...auditData,
        action: "APPROVE_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description:
          "Tentative d'approbation de dépense - approbateur manquant",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "ID de l'approbateur requis",
      });
    }

    // Vérifier si la dépense existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingExpense) {
      await createAuditLog({
        ...auditData,
        action: "APPROVE_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: "Tentative d'approbation de dépense - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Dépense non trouvée",
      });
    }

    // Vérifier si l'approbateur existe
    const approver = await prisma.user.findUnique({
      where: { id: approvedBy },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!approver) {
      await createAuditLog({
        ...auditData,
        action: "APPROVE_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: `Tentative d'approbation de dépense - approbateur ${approvedBy} non trouvé`,
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Approbateur non trouvé",
      });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: "Approved",
        approvedBy,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log d'approbation réussie
    await createAuditLog({
      ...auditData,
      action: "APPROVE_EXPENSE_SUCCESS",
      entity: "Expense",
      entityId: id,
      description: `Dépense approuvée: ${expense.category} - ${expense.amount} par ${approver.firstName} ${approver.lastName}`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      message: "Dépense approuvée avec succès",
      data: expense,
    });
  } catch (error) {
    console.error("Error approving expense:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "APPROVE_EXPENSE_ERROR",
      entity: "Expense",
      entityId: req.params.id,
      description: "Erreur lors de l'approbation de la dépense",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(400).json({
      success: false,
      error: "Erreur lors de l'approbation de la dépense",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};

export const rejectExpense = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).user?.id || (req as any).userId || null,
  };

  try {
    const { id } = req.params;
    const { approvedBy, description } = req.body;

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "REJECT_EXPENSE_ATTEMPT",
        entity: "Expense",
        description: "Tentative de rejet de dépense - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "ID de la dépense requis",
      });
    }

    if (!approvedBy) {
      await createAuditLog({
        ...auditData,
        action: "REJECT_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: "Tentative de rejet de dépense - approbateur manquant",
        status: "ERROR",
      });
      return res.status(400).json({
        success: false,
        error: "ID de l'approbateur requis",
      });
    }

    // Vérifier si la dépense existe
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingExpense) {
      await createAuditLog({
        ...auditData,
        action: "REJECT_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: "Tentative de rejet de dépense - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Dépense non trouvée",
      });
    }

    // Vérifier si l'approbateur existe
    const approver = await prisma.user.findUnique({
      where: { id: approvedBy },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!approver) {
      await createAuditLog({
        ...auditData,
        action: "REJECT_EXPENSE_ATTEMPT",
        entity: "Expense",
        entityId: id,
        description: `Tentative de rejet de dépense - approbateur ${approvedBy} non trouvé`,
        status: "ERROR",
      });
      return res.status(404).json({
        success: false,
        error: "Approbateur non trouvé",
      });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: "Rejected",
        approvedBy,
        description:
          description ||
          `Rejetée par ${approver.firstName} ${approver.lastName}`,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log de rejet réussi
    await createAuditLog({
      ...auditData,
      action: "REJECT_EXPENSE_SUCCESS",
      entity: "Expense",
      entityId: id,
      description: `Dépense rejetée: ${expense.category} - ${expense.amount} par ${approver.firstName} ${approver.lastName}`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      message: "Dépense rejetée avec succès",
      data: expense,
    });
  } catch (error) {
    console.error("Error rejecting expense:", error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "REJECT_EXPENSE_ERROR",
      entity: "Expense",
      entityId: req.params.id,
      description: "Erreur lors du rejet de la dépense",
      status: "ERROR",
      errorMessage: getErrorMessage(error),
    });

    res.status(400).json({
      success: false,
      error: "Erreur lors du rejet de la dépense",
      details:
        process.env.NODE_ENV === "development"
          ? getErrorMessage(error)
          : undefined,
    });
  }
};
