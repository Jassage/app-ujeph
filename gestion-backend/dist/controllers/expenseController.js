"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectExpense = exports.approveExpense = exports.getExpenseStats = exports.deleteExpense = exports.updateExpense = exports.getExpenseById = exports.getExpenses = exports.createExpense = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const auditController_1 = require("./auditController");
// Fonction utilitaire pour gérer les erreurs unknown
const getErrorMessage = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    else if (typeof error === "string") {
        return error;
    }
    else if (error && typeof error === "object" && "message" in error) {
        return String(error.message);
    }
    else {
        return "Erreur inconnue";
    }
};
const createExpense = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const expenseData = req.body;
        console.log(`Received expense data:`, expenseData);
        // Validation des données obligatoires basée sur votre modèle
        if (!expenseData.category ||
            !expenseData.amount ||
            !expenseData.date ||
            !expenseData.paymentMethod ||
            !expenseData.createdBy) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_EXPENSE_ATTEMPT",
                entity: "Expense",
                description: "Tentative de création de dépense - données obligatoires manquantes",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "Les champs category, amount, date, paymentMethod et createdBy sont obligatoires",
            });
        }
        // Validation du montant
        if (expenseData.amount <= 0) {
            await (0, auditController_1.createAuditLog)({
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
        const creator = await prisma_1.default.user.findUnique({
            where: { id: expenseData.createdBy },
            select: { id: true, firstName: true, lastName: true },
        });
        if (!creator) {
            await (0, auditController_1.createAuditLog)({
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
        const expense = await prisma_1.default.expense.create({
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
        await (0, auditController_1.createAuditLog)({
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
    }
    catch (error) {
        console.error("Error creating expense:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
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
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.createExpense = createExpense;
const getExpenses = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { category, status, startDate, endDate, minAmount, maxAmount, createdBy, page = 1, limit = 10, } = req.query;
        const where = {};
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        if (createdBy)
            where.createdBy = createdBy;
        if (minAmount || maxAmount) {
            where.amount = {};
            if (minAmount)
                where.amount.gte = parseFloat(minAmount);
            if (maxAmount)
                where.amount.lte = parseFloat(maxAmount);
        }
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [expenses, total] = await Promise.all([
            prisma_1.default.expense.findMany({
                where,
                skip,
                take: parseInt(limit),
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
            prisma_1.default.expense.count({ where }),
        ]);
        // Log de consultation réussie
        await (0, auditController_1.createAuditLog)({
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
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching expenses:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
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
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.getExpenses = getExpenses;
const getExpenseById = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        if (!id) {
            await (0, auditController_1.createAuditLog)({
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
        const expense = await prisma_1.default.expense.findUnique({
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
            await (0, auditController_1.createAuditLog)({
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
        await (0, auditController_1.createAuditLog)({
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
    }
    catch (error) {
        console.error("Error fetching expense:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
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
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.getExpenseById = getExpenseById;
const updateExpense = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            await (0, auditController_1.createAuditLog)({
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
        const existingExpense = await prisma_1.default.expense.findUnique({
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
            await (0, auditController_1.createAuditLog)({
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
            await (0, auditController_1.createAuditLog)({
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
            const approver = await prisma_1.default.user.findUnique({
                where: { id: updateData.approvedBy },
                select: { id: true, firstName: true, lastName: true },
            });
            if (!approver) {
                await (0, auditController_1.createAuditLog)({
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
        const expense = await prisma_1.default.expense.update({
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
        await (0, auditController_1.createAuditLog)({
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
    }
    catch (error) {
        console.error("Error updating expense:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
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
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        if (!id) {
            await (0, auditController_1.createAuditLog)({
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
        const existingExpense = await prisma_1.default.expense.findUnique({
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
            await (0, auditController_1.createAuditLog)({
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
        await prisma_1.default.expense.delete({
            where: { id },
        });
        // Log de suppression réussie
        await (0, auditController_1.createAuditLog)({
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
    }
    catch (error) {
        console.error("Error deleting expense:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
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
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.deleteExpense = deleteExpense;
const getExpenseStats = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { period = "month" } = req.query;
        const now = new Date();
        let startDate;
        let periodDescription;
        if (period === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            periodDescription = "mois en cours";
        }
        else if (period === "year") {
            startDate = new Date(now.getFullYear(), 0, 1);
            periodDescription = "année en cours";
        }
        else {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
            periodDescription = "30 derniers jours";
        }
        const stats = await prisma_1.default.expense.groupBy({
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
        const total = await prisma_1.default.expense.aggregate({
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
        await (0, auditController_1.createAuditLog)({
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
    }
    catch (error) {
        console.error("Error fetching stats:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_EXPENSE_STATS_ERROR",
            entity: "Expense",
            description: "Erreur lors de la récupération des statistiques des dépenses",
            status: "ERROR",
            errorMessage: getErrorMessage(error),
        });
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des statistiques",
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.getExpenseStats = getExpenseStats;
const approveExpense = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const { approvedBy } = req.body;
        if (!id) {
            await (0, auditController_1.createAuditLog)({
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
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "APPROVE_EXPENSE_ATTEMPT",
                entity: "Expense",
                entityId: id,
                description: "Tentative d'approbation de dépense - approbateur manquant",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "ID de l'approbateur requis",
            });
        }
        // Vérifier si la dépense existe
        const existingExpense = await prisma_1.default.expense.findUnique({
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
            await (0, auditController_1.createAuditLog)({
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
        const approver = await prisma_1.default.user.findUnique({
            where: { id: approvedBy },
            select: { id: true, firstName: true, lastName: true },
        });
        if (!approver) {
            await (0, auditController_1.createAuditLog)({
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
        const expense = await prisma_1.default.expense.update({
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
        await (0, auditController_1.createAuditLog)({
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
    }
    catch (error) {
        console.error("Error approving expense:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
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
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.approveExpense = approveExpense;
const rejectExpense = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        const { id } = req.params;
        const { approvedBy, description } = req.body;
        if (!id) {
            await (0, auditController_1.createAuditLog)({
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
            await (0, auditController_1.createAuditLog)({
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
        const existingExpense = await prisma_1.default.expense.findUnique({
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
            await (0, auditController_1.createAuditLog)({
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
        const approver = await prisma_1.default.user.findUnique({
            where: { id: approvedBy },
            select: { id: true, firstName: true, lastName: true },
        });
        if (!approver) {
            await (0, auditController_1.createAuditLog)({
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
        const expense = await prisma_1.default.expense.update({
            where: { id },
            data: {
                status: "Rejected",
                approvedBy,
                description: description ||
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
        await (0, auditController_1.createAuditLog)({
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
    }
    catch (error) {
        console.error("Error rejecting expense:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
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
            details: process.env.NODE_ENV === "development"
                ? getErrorMessage(error)
                : undefined,
        });
    }
};
exports.rejectExpense = rejectExpense;
