"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentHistory = exports.deleteFeePayment = exports.updateFeePayment = exports.getFeePayments = exports.createFeePayment = exports.getFeePaymentById = exports.getAllFeePayments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
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
const auditController_1 = require("./auditController");
// Schémas de validation avec Zod
const FeePaymentCreateSchema = zod_1.z.object({
    studentFeeId: zod_1.z.string().min(1, "L'ID des frais étudiant est requis"),
    amount: zod_1.z.number().min(0.01, "Le montant doit être supérieur à 0"),
    paymentMethod: zod_1.z.string().min(1, "La méthode de paiement est requise"),
    reference: zod_1.z.string().optional(),
    paymentDate: zod_1.z.string().datetime("Date de paiement invalide").optional(),
});
const FeePaymentUpdateSchema = FeePaymentCreateSchema.partial();
const getAllFeePayments = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { studentFeeId } = req.query;
        console.log("📥 Consultation de tous les paiements - Filtre:", {
            studentFeeId,
        });
        const whereClause = {};
        if (studentFeeId)
            whereClause.studentFeeId = studentFeeId;
        const feePayments = await prisma_1.default.feePayment.findMany({
            where: whereClause,
            include: {
                studentFee: {
                    include: {
                        feeStructure: true,
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                    },
                },
            },
            orderBy: { paymentDate: "desc" },
        });
        // Log de consultation
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_ALL_FEE_PAYMENTS",
            entity: "FeePayment",
            description: "Consultation de tous les paiements de frais",
            status: "SUCCESS",
            metadata: {
                count: feePayments.length,
                studentFeeFilter: studentFeeId || "none",
            },
        });
        res.json(feePayments);
    }
    catch (error) {
        console.error("❌ Erreur récupération paiements:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_ALL_FEE_PAYMENTS_ERROR",
            entity: "FeePayment",
            description: "Erreur lors de la récupération de tous les paiements",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            error: "Erreur serveur",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.getAllFeePayments = getAllFeePayments;
const getFeePaymentById = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        console.log("📥 Consultation paiement par ID:", id);
        const feePayment = await prisma_1.default.feePayment.findUnique({
            where: { id },
            include: {
                studentFee: {
                    include: {
                        feeStructure: true,
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!feePayment) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "GET_FEE_PAYMENT_ATTEMPT",
                entity: "FeePayment",
                entityId: id,
                description: "Tentative de consultation de paiement - non trouvé",
                status: "ERROR",
            });
            return res.status(404).json({ error: "Paiement non trouvé" });
        }
        // Log de consultation réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_FEE_PAYMENT_SUCCESS",
            entity: "FeePayment",
            entityId: id,
            description: "Consultation des détails du paiement",
            status: "SUCCESS",
            metadata: {
                studentFeeId: feePayment.studentFeeId,
                amount: feePayment.amount,
                paymentMethod: feePayment.paymentMethod,
            },
        });
        res.json(feePayment);
    }
    catch (error) {
        console.error("❌ Erreur récupération paiement:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_FEE_PAYMENT_ERROR",
            entity: "FeePayment",
            entityId: req.params.id,
            description: "Erreur lors de la récupération du paiement",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            error: "Erreur serveur",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.getFeePaymentById = getFeePaymentById;
const createFeePayment = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { studentFeeId, amount, paymentMethod, reference, paymentDate } = req.body;
        console.log("📥 Création paiement - Données:", req.body);
        // Log de tentative de création
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_FEE_PAYMENT_ATTEMPT",
            entity: "FeePayment",
            description: "Tentative de création d'un nouveau paiement",
            status: "SUCCESS",
            metadata: {
                studentFeeId,
                amount,
                paymentMethod,
                reference,
            },
        });
        // Valider les données avec Zod
        try {
            FeePaymentCreateSchema.parse(req.body);
        }
        catch (validationError) {
            if (validationError instanceof zod_1.z.ZodError) {
                console.error("❌ Erreur validation Zod:", validationError.issues);
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "CREATE_FEE_PAYMENT_ATTEMPT",
                    entity: "FeePayment",
                    description: "Tentative de création de paiement - validation des données échouée",
                    status: "ERROR",
                    errorMessage: "Données de validation invalides",
                    metadata: {
                        errors: validationError.issues.map((issue) => ({
                            field: issue.path.join("."),
                            message: issue.message,
                        })),
                    },
                });
                return res.status(400).json({
                    error: "Données de validation invalides",
                    details: validationError.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                });
            }
            throw validationError;
        }
        // Validation des données
        if (!studentFeeId || !amount || !paymentMethod) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_FEE_PAYMENT_ATTEMPT",
                entity: "FeePayment",
                description: "Tentative de création de paiement - données manquantes",
                status: "ERROR",
                errorMessage: "Données manquantes",
            });
            return res.status(400).json({ error: "Données manquantes" });
        }
        // Vérifier si les frais étudiants existent
        const studentFee = await prisma_1.default.studentFee.findUnique({
            where: { id: studentFeeId },
            include: {
                feeStructure: true,
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        studentId: true,
                    },
                },
            },
        });
        if (!studentFee) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_FEE_PAYMENT_ATTEMPT",
                entity: "FeePayment",
                description: `Tentative de création de paiement - frais étudiant ${studentFeeId} non trouvé`,
                status: "ERROR",
                metadata: { studentFeeId },
            });
            return res.status(404).json({ error: "Frais étudiant non trouvé" });
        }
        // Vérifier que le montant ne dépasse pas le reste à payer
        const remainingAmount = studentFee.totalAmount - studentFee.paidAmount;
        if (amount > remainingAmount) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_FEE_PAYMENT_ATTEMPT",
                entity: "FeePayment",
                description: "Tentative de création de paiement - montant dépasse le reste à payer",
                status: "ERROR",
                errorMessage: "Montant dépasse le reste à payer",
                metadata: {
                    studentFeeId,
                    amount,
                    remainingAmount,
                    totalAmount: studentFee.totalAmount,
                    paidAmount: studentFee.paidAmount,
                },
            });
            return res.status(400).json({
                error: `Le montant dépasse le reste à payer (${remainingAmount} HTG)`,
            });
        }
        // Créer le paiement en transaction
        const result = await prisma_1.default.$transaction(async (tx) => {
            // Créer le paiement
            const payment = await tx.feePayment.create({
                data: {
                    studentFeeId,
                    amount,
                    paymentMethod,
                    reference: reference || null,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    recordedBy: req.userId || "admin",
                },
            });
            console.log("✅ Paiement créé:", payment.id);
            // Mettre à jour le montant payé dans StudentFee
            const newPaidAmount = studentFee.paidAmount + amount;
            const newStatus = newPaidAmount >= studentFee.totalAmount ? "paid" : "partial";
            const updatedStudentFee = await tx.studentFee.update({
                where: { id: studentFeeId },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus,
                },
                include: {
                    feeStructure: true,
                    student: {
                        select: {
                            firstName: true,
                            lastName: true,
                            studentId: true,
                        },
                    },
                    payments: {
                        orderBy: { paymentDate: "desc" },
                    },
                },
            });
            console.log("✅ Frais étudiant mis à jour:", updatedStudentFee.id);
            return { payment, studentFee: updatedStudentFee };
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_FEE_PAYMENT_SUCCESS",
            entity: "FeePayment",
            entityId: result.payment.id,
            description: "Paiement créé avec succès",
            status: "SUCCESS",
            metadata: {
                studentFeeId,
                amount,
                paymentMethod,
                reference,
                studentName: `${result.studentFee.student.firstName} ${result.studentFee.student.lastName}`,
                studentId: result.studentFee.student.studentId,
                newStatus: result.studentFee.status,
                newPaidAmount: result.studentFee.paidAmount,
            },
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error("❌ Erreur création paiement:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_FEE_PAYMENT_ERROR",
            entity: "FeePayment",
            description: "Erreur lors de la création du paiement",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            error: "Erreur serveur",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.createFeePayment = createFeePayment;
const getFeePayments = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { studentFeeId } = req.query;
        console.log("📥 Consultation paiements - Filtre:", { studentFeeId });
        const whereClause = {};
        if (studentFeeId)
            whereClause.studentFeeId = studentFeeId;
        const payments = await prisma_1.default.feePayment.findMany({
            where: whereClause,
            include: {
                studentFee: {
                    include: {
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                        feeStructure: true,
                    },
                },
            },
            orderBy: { paymentDate: "desc" },
        });
        // Log de consultation
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_FEE_PAYMENTS",
            entity: "FeePayment",
            description: "Consultation des paiements de frais",
            status: "SUCCESS",
            metadata: {
                count: payments.length,
                studentFeeFilter: studentFeeId || "none",
            },
        });
        res.json(payments);
    }
    catch (error) {
        console.error("❌ Erreur récupération paiements:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_FEE_PAYMENTS_ERROR",
            entity: "FeePayment",
            description: "Erreur lors de la récupération des paiements",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            error: "Erreur serveur",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.getFeePayments = getFeePayments;
const updateFeePayment = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const data = req.body;
        console.log("📥 Mise à jour paiement - ID:", id, "Données:", data);
        // Log de tentative de mise à jour
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_FEE_PAYMENT_ATTEMPT",
            entity: "FeePayment",
            entityId: id,
            description: "Tentative de mise à jour de paiement",
            status: "SUCCESS",
            metadata: {
                updateFields: Object.keys(data),
            },
        });
        // Valider les données avec Zod
        try {
            FeePaymentUpdateSchema.parse(data);
        }
        catch (validationError) {
            if (validationError instanceof zod_1.z.ZodError) {
                console.error("❌ Erreur validation Zod:", validationError.issues);
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_FEE_PAYMENT_ATTEMPT",
                    entity: "FeePayment",
                    entityId: id,
                    description: "Tentative de mise à jour de paiement - validation des données échouée",
                    status: "ERROR",
                    errorMessage: "Données de validation invalides",
                    metadata: {
                        errors: validationError.issues.map((issue) => ({
                            field: issue.path.join("."),
                            message: issue.message,
                        })),
                    },
                });
                return res.status(400).json({
                    error: "Données de validation invalides",
                    details: validationError.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                });
            }
            throw validationError;
        }
        // Récupérer l'ancien paiement pour calculer la différence
        const oldPayment = await prisma_1.default.feePayment.findUnique({
            where: { id },
            include: {
                studentFee: {
                    include: {
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!oldPayment) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "UPDATE_FEE_PAYMENT_ATTEMPT",
                entity: "FeePayment",
                entityId: id,
                description: "Tentative de mise à jour de paiement - non trouvé",
                status: "ERROR",
            });
            return res.status(404).json({ error: "Paiement non trouvé" });
        }
        // Mise à jour en transaction
        const result = await prisma_1.default.$transaction(async (tx) => {
            const updatedFeePayment = await tx.feePayment.update({
                where: { id },
                data,
            });
            // Si le montant a changé, mettre à jour les frais étudiants
            if (data.amount !== undefined && data.amount !== oldPayment.amount) {
                const amountDifference = data.amount - oldPayment.amount;
                const studentFee = await tx.studentFee.findUnique({
                    where: { id: oldPayment.studentFeeId },
                });
                if (studentFee) {
                    const newPaidAmount = studentFee.paidAmount + amountDifference;
                    let newStatus = studentFee.status;
                    if (newPaidAmount >= studentFee.totalAmount) {
                        newStatus = "paid";
                    }
                    else if (newPaidAmount > 0) {
                        newStatus = "partial";
                    }
                    else {
                        newStatus = "pending";
                    }
                    await tx.studentFee.update({
                        where: { id: oldPayment.studentFeeId },
                        data: {
                            paidAmount: newPaidAmount,
                            status: newStatus,
                        },
                    });
                    console.log("✅ Frais étudiant mis à jour après modification du paiement");
                }
            }
            return updatedFeePayment;
        });
        console.log("✅ Paiement mis à jour:", id);
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_FEE_PAYMENT_SUCCESS",
            entity: "FeePayment",
            entityId: id,
            description: "Paiement mis à jour avec succès",
            status: "SUCCESS",
            metadata: {
                oldAmount: oldPayment.amount,
                newAmount: data.amount,
                amountChanged: data.amount !== oldPayment.amount,
                studentName: `${oldPayment.studentFee.student.firstName} ${oldPayment.studentFee.student.lastName}`,
                studentId: oldPayment.studentFee.student.studentId,
            },
        });
        res.json(result);
    }
    catch (error) {
        console.error("❌ Erreur mise à jour paiement:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_FEE_PAYMENT_ERROR",
            entity: "FeePayment",
            entityId: req.params.id,
            description: "Erreur lors de la mise à jour du paiement",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(400).json({
            error: "Erreur lors de la mise à jour",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.updateFeePayment = updateFeePayment;
const deleteFeePayment = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        console.log("🗑️ Suppression paiement - ID:", id);
        // Log de tentative de suppression
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_FEE_PAYMENT_ATTEMPT",
            entity: "FeePayment",
            entityId: id,
            description: "Tentative de suppression de paiement",
            status: "SUCCESS",
        });
        // Récupérer le paiement avant suppression
        const feePayment = await prisma_1.default.feePayment.findUnique({
            where: { id },
            include: {
                studentFee: {
                    include: {
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!feePayment) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "DELETE_FEE_PAYMENT_ATTEMPT",
                entity: "FeePayment",
                entityId: id,
                description: "Tentative de suppression de paiement - non trouvé",
                status: "ERROR",
            });
            return res.status(404).json({ error: "Paiement non trouvé" });
        }
        // Suppression en transaction
        await prisma_1.default.$transaction(async (tx) => {
            // Supprimer le paiement
            await tx.feePayment.delete({ where: { id } });
            // Mettre à jour les frais étudiants
            const studentFee = await tx.studentFee.findUnique({
                where: { id: feePayment.studentFeeId },
            });
            if (studentFee) {
                const newPaidAmount = studentFee.paidAmount - feePayment.amount;
                let newStatus = studentFee.status;
                if (newPaidAmount >= studentFee.totalAmount) {
                    newStatus = "paid";
                }
                else if (newPaidAmount > 0) {
                    newStatus = "partial";
                }
                else {
                    newStatus = "pending";
                }
                await tx.studentFee.update({
                    where: { id: feePayment.studentFeeId },
                    data: {
                        paidAmount: newPaidAmount,
                        status: newStatus,
                    },
                });
                console.log("✅ Frais étudiant mis à jour après suppression du paiement");
            }
        });
        console.log("✅ Paiement supprimé:", id);
        // Log de suppression réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_FEE_PAYMENT_SUCCESS",
            entity: "FeePayment",
            entityId: id,
            description: "Paiement supprimé avec succès",
            status: "SUCCESS",
            metadata: {
                studentFeeId: feePayment.studentFeeId,
                amount: feePayment.amount,
                paymentMethod: feePayment.paymentMethod,
                studentName: `${feePayment.studentFee.student.firstName} ${feePayment.studentFee.student.lastName}`,
                studentId: feePayment.studentFee.student.studentId,
            },
        });
        res.json({ message: "Paiement supprimé" });
    }
    catch (error) {
        console.error("❌ Erreur suppression paiement:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur de suppression
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_FEE_PAYMENT_ERROR",
            entity: "FeePayment",
            entityId: req.params.id,
            description: "Erreur lors de la suppression du paiement",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(400).json({
            error: "Erreur lors de la suppression",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.deleteFeePayment = deleteFeePayment;
const getPaymentHistory = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        const { studentFeeId } = req.params;
        console.log("📥 Historique paiements - StudentFee ID:", studentFeeId);
        const payments = await prisma_1.default.feePayment.findMany({
            where: { studentFeeId },
            orderBy: { paymentDate: "desc" },
            include: {
                studentFee: {
                    include: {
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                    },
                },
            },
        });
        // Log de consultation d'historique
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_PAYMENT_HISTORY",
            entity: "FeePayment",
            description: "Consultation de l'historique des paiements",
            status: "SUCCESS",
            metadata: {
                studentFeeId,
                count: payments.length,
                totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
            },
        });
        res.json(payments);
    }
    catch (error) {
        console.error("❌ Erreur récupération historique paiements:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_PAYMENT_HISTORY_ERROR",
            entity: "FeePayment",
            description: "Erreur lors de la récupération de l'historique des paiements",
            status: "ERROR",
            errorMessage: errorMessage,
            metadata: {
                studentFeeId: req.params.studentFeeId,
            },
        });
        res.status(500).json({
            error: "Erreur serveur",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.getPaymentHistory = getPaymentHistory;
