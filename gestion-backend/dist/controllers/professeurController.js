"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateStatus = exports.getprofesseurAssignments = exports.deleteprofesseur = exports.updateprofesseur = exports.getprofesseurById = exports.bulkImportProfesseurs = exports.getProfesseurs = exports.createProfesseur = void 0;
const prisma_1 = require("../../generated/prisma");
const auditController_1 = require("./auditController");
// import { createAuditLog, getUserIdFromRequest } from "../utils/auditLogger"; // Import des fonctions d'audit
const prisma = new prisma_1.PrismaClient();
function isPrismaError(error) {
    return error instanceof Error && "code" in error;
}
function getErrorMessage(error) {
    if (isPrismaError(error)) {
        return `Erreur base de données: ${error.message}`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "Une erreur inconnue s'est produite";
}
const handleControllerError = async (error, res, context, auditData) => {
    console.error(`Error in ${context}:`, error);
    let statusCode = 500;
    let errorMessage = `Erreur lors de ${context}`;
    if (isPrismaError(error)) {
        switch (error.code) {
            case "P2002":
                statusCode = 409;
                errorMessage = "Un professeur avec cet email existe déjà";
                break;
            case "P2003":
                statusCode = 404;
                errorMessage = "Référence étrangère non trouvée";
                break;
            case "P2025":
                statusCode = 404;
                errorMessage = "Enregistrement non trouvé";
                break;
            default:
                errorMessage = `Erreur base de données: ${error.message}`;
                break;
        }
    }
    else if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Log d'erreur d'audit
    await (0, auditController_1.createAuditLog)({
        ...auditData,
        action: `${auditData.action}_ERROR`,
        description: `Erreur lors de ${context}`,
        status: "ERROR",
        errorMessage: getErrorMessage(error),
    });
    res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : undefined,
    });
};
const createProfesseur = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        const { firstName, lastName, email, phone, speciality, status } = req.body;
        // Log de tentative de création
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_PROFESSEUR_ATTEMPT",
            entity: "Professeur",
            description: "Tentative de création d'un nouveau professeur",
            status: "SUCCESS",
            metadata: {
                firstName,
                lastName,
                email,
                hasPhone: !!phone,
                hasSpeciality: !!speciality,
            },
        });
        // Validation des champs obligatoires
        if (!firstName || !lastName || !email) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_PROFESSEUR_VALIDATION_ERROR",
                entity: "Professeur",
                description: "Tentative de création - champs obligatoires manquants",
                status: "ERROR",
                errorMessage: "Les champs firstName, lastName et email sont obligatoires",
            });
            return res.status(400).json({
                success: false,
                error: "Les champs firstName, lastName et email sont obligatoires",
            });
        }
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_PROFESSEUR_VALIDATION_ERROR",
                entity: "Professeur",
                description: "Tentative de création - format d'email invalide",
                status: "ERROR",
                errorMessage: "Format d'email invalide",
            });
            return res.status(400).json({
                success: false,
                error: "Format d'email invalide",
            });
        }
        // Vérifier si l'email existe déjà
        const existingProfesseur = await prisma.professeur.findUnique({
            where: { email },
        });
        if (existingProfesseur) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_PROFESSEUR_DUPLICATE_ERROR",
                entity: "Professeur",
                description: "Tentative de création - email déjà existant",
                status: "ERROR",
                errorMessage: "Un professeur avec cet email existe déjà",
                metadata: { email },
            });
            return res.status(409).json({
                success: false,
                error: "Un professeur avec cet email existe déjà",
            });
        }
        // Créer le professeur
        const professeur = await prisma.professeur.create({
            data: {
                firstName,
                lastName,
                email,
                phone: phone || null,
                speciality: speciality || null,
                status: status || "Actif",
            },
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_PROFESSEUR_SUCCESS",
            entity: "Professeur",
            entityId: professeur.id,
            description: "Professeur créé avec succès",
            status: "SUCCESS",
            metadata: {
                professeurId: professeur.id,
                fullName: `${professeur.firstName} ${professeur.lastName}`,
                email: professeur.email,
                status: professeur.status,
            },
        });
        res.status(201).json({
            success: true,
            data: professeur,
            message: "Professeur créé avec succès",
        });
    }
    catch (error) {
        await handleControllerError(error, res, "la création du professeur", {
            ...auditData,
            action: "CREATE_PROFESSEUR",
        });
    }
};
exports.createProfesseur = createProfesseur;
const getProfesseurs = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        const { status, search } = req.query;
        const where = {};
        if (status && status !== "all") {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        const professeurs = await prisma.professeur.findMany({
            where,
            orderBy: {
                lastName: "asc",
            },
        });
        // Log de consultation
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_PROFESSEURS",
            entity: "Professeur",
            description: "Consultation de la liste des professeurs",
            status: "SUCCESS",
            metadata: {
                count: professeurs.length,
                filters: {
                    status: status || "all",
                    search: search || "none",
                },
            },
        });
        res.json({
            success: true,
            data: professeurs,
            count: professeurs.length,
        });
    }
    catch (error) {
        await handleControllerError(error, res, "la récupération des professeurs", {
            ...auditData,
            action: "GET_PROFESSEURS",
        });
    }
};
exports.getProfesseurs = getProfesseurs;
const bulkImportProfesseurs = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: (0, auditController_1.getUserIdFromRequest)(req),
    };
    try {
        const { professors } = req.body;
        // Log de début d'import
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "BULK_IMPORT_PROFESSEURS_START",
            entity: "Professeur",
            description: "Début de l'import en masse des professeurs",
            status: "SUCCESS",
            metadata: {
                totalProfessors: professors?.length || 0,
            },
        });
        if (!Array.isArray(professors) || professors.length === 0) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "BULK_IMPORT_PROFESSEURS_VALIDATION_ERROR",
                entity: "Professeur",
                description: "Import annulé - données manquantes",
                status: "ERROR",
                errorMessage: "Un tableau de professeurs est requis",
            });
            return res.status(400).json({
                success: false,
                error: "Un tableau de professeurs est requis",
            });
        }
        // Limiter le nombre d'imports
        if (professors.length > 100) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "BULK_IMPORT_PROFESSEURS_VALIDATION_ERROR",
                entity: "Professeur",
                description: "Import annulé - trop de données",
                status: "ERROR",
                errorMessage: "Trop de professeurs à importer en une seule fois (maximum 100)",
            });
            return res.status(400).json({
                success: false,
                error: "Trop de professeurs à importer en une seule fois (maximum 100)",
            });
        }
        const results = {
            success: [],
            errors: [],
        };
        for (const [index, professorData] of professors.entries()) {
            try {
                // Validation des données
                if (!professorData.firstName ||
                    !professorData.lastName ||
                    !professorData.email) {
                    results.errors.push({
                        index,
                        error: "Données manquantes: firstName, lastName et email sont requis",
                        data: professorData,
                    });
                    continue;
                }
                // Validation de l'email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(professorData.email)) {
                    results.errors.push({
                        index,
                        error: "Format d'email invalide",
                        data: professorData,
                    });
                    continue;
                }
                // Vérifier l'unicité de l'email
                const existingProfesseur = await prisma.professeur.findUnique({
                    where: { email: professorData.email },
                });
                if (existingProfesseur) {
                    results.errors.push({
                        index,
                        error: "Email déjà existant",
                        data: professorData,
                    });
                    continue;
                }
                // Créer le professeur
                const professeur = await prisma.professeur.create({
                    data: {
                        firstName: professorData.firstName,
                        lastName: professorData.lastName,
                        email: professorData.email,
                        phone: professorData.phone || null,
                        speciality: professorData.speciality || null,
                        status: professorData.status || "Actif",
                    },
                });
                results.success.push(professeur);
            }
            catch (error) {
                results.errors.push({
                    index,
                    error: getErrorMessage(error),
                    data: professorData,
                });
            }
        }
        // Log de fin d'import
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "BULK_IMPORT_PROFESSEURS_COMPLETE",
            entity: "Professeur",
            description: "Import en masse des professeurs terminé",
            status: "SUCCESS",
            metadata: {
                total: professors.length,
                success: results.success.length,
                errors: results.errors.length,
                successRate: `${((results.success.length / professors.length) * 100).toFixed(2)}%`,
            },
        });
        res.status(201).json({
            success: true,
            message: `Import terminé: ${results.success.length} succès, ${results.errors.length} erreurs`,
            results,
        });
    }
    catch (error) {
        await handleControllerError(error, res, "l'import des professeurs", {
            ...auditData,
            action: "BULK_IMPORT_PROFESSEURS",
        });
    }
};
exports.bulkImportProfesseurs = bulkImportProfesseurs;
const getprofesseurById = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: (0, auditController_1.getUserIdFromRequest)(req),
    };
    try {
        const { id } = req.params;
        const professeur = await prisma.professeur.findUnique({
            where: { id },
            include: {
                assignments: {
                    include: {
                        ue: true,
                        faculty: true,
                    },
                },
            },
        });
        if (!professeur) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "GET_PROFESSEUR_BY_ID_NOT_FOUND",
                entity: "Professeur",
                entityId: id,
                description: "Tentative de consultation - professeur non trouvé",
                status: "ERROR",
                errorMessage: "Professeur non trouvé",
            });
            return res.status(404).json({
                message: "Professeur non trouvé",
            });
        }
        // Log de consultation réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_PROFESSEUR_BY_ID_SUCCESS",
            entity: "Professeur",
            entityId: id,
            description: "Consultation des détails d'un professeur",
            status: "SUCCESS",
            metadata: {
                professeurName: `${professeur.firstName} ${professeur.lastName}`,
                assignmentsCount: professeur.assignments.length,
            },
        });
        res.json(professeur);
    }
    catch (error) {
        await handleControllerError(error, res, "la récupération du professeur", {
            ...auditData,
            action: "GET_PROFESSEUR_BY_ID",
            entityId: req.params.id,
        });
    }
};
exports.getprofesseurById = getprofesseurById;
const updateprofesseur = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: (0, auditController_1.getUserIdFromRequest)(req),
    };
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, speciality, status } = req.body;
        // Log de tentative de mise à jour
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_PROFESSEUR_ATTEMPT",
            entity: "Professeur",
            entityId: id,
            description: "Tentative de mise à jour d'un professeur",
            status: "SUCCESS",
            metadata: {
                updateFields: Object.keys(req.body),
            },
        });
        // Vérifier si le professeur existe
        const existingprofesseur = await prisma.professeur.findUnique({
            where: { id },
        });
        if (!existingprofesseur) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "UPDATE_PROFESSEUR_NOT_FOUND",
                entity: "Professeur",
                entityId: id,
                description: "Tentative de mise à jour - professeur non trouvé",
                status: "ERROR",
                errorMessage: "Professeur non trouvé",
            });
            return res.status(404).json({
                message: "Professeur non trouvé",
            });
        }
        // Vérifier les conflits d'email
        if (email && email !== existingprofesseur.email) {
            const existingEmail = await prisma.professeur.findUnique({
                where: { email },
            });
            if (existingEmail) {
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_PROFESSEUR_DUPLICATE_EMAIL",
                    entity: "Professeur",
                    entityId: id,
                    description: "Tentative de mise à jour - email déjà existant",
                    status: "ERROR",
                    errorMessage: "Un professeur avec cet email existe déjà",
                    metadata: { email },
                });
                return res.status(400).json({
                    message: "Un professeur avec cet email existe déjà",
                });
            }
        }
        // Mettre à jour le professeur
        const professeur = await prisma.professeur.update({
            where: { id },
            data: {
                firstName: firstName ?? undefined,
                lastName: lastName ?? undefined,
                email: email ?? undefined,
                phone: phone ?? undefined,
                speciality: speciality ?? undefined,
                status: status ?? undefined,
            },
        });
        // Log de mise à jour réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_PROFESSEUR_SUCCESS",
            entity: "Professeur",
            entityId: id,
            description: "Professeur mis à jour avec succès",
            status: "SUCCESS",
            metadata: {
                updatedFields: Object.keys(req.body),
                previousStatus: existingprofesseur.status,
                newStatus: professeur.status,
            },
        });
        res.json(professeur);
    }
    catch (error) {
        await handleControllerError(error, res, "la modification du professeur", {
            ...auditData,
            action: "UPDATE_PROFESSEUR",
            entityId: req.params.id,
        });
    }
};
exports.updateprofesseur = updateprofesseur;
const deleteprofesseur = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: (0, auditController_1.getUserIdFromRequest)(req),
    };
    try {
        const { id } = req.params;
        // Log de tentative de suppression
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_PROFESSEUR_ATTEMPT",
            entity: "Professeur",
            entityId: id,
            description: "Tentative de suppression d'un professeur",
            status: "SUCCESS",
        });
        // Vérifier si le professeur existe
        const professeur = await prisma.professeur.findUnique({
            where: { id },
        });
        if (!professeur) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "DELETE_PROFESSEUR_NOT_FOUND",
                entity: "Professeur",
                entityId: id,
                description: "Tentative de suppression - professeur non trouvé",
                status: "ERROR",
                errorMessage: "Professeur non trouvé",
            });
            return res.status(404).json({
                message: "Professeur non trouvé",
            });
        }
        // Vérifier s'il a des affectations
        const assignments = await prisma.courseAssignment.count({
            where: { professeurId: id },
        });
        if (assignments > 0) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "DELETE_PROFESSEUR_HAS_ASSIGNMENTS",
                entity: "Professeur",
                entityId: id,
                description: "Tentative de suppression - professeur a des affectations",
                status: "ERROR",
                errorMessage: "Impossible de supprimer un professeur avec des affectations de cours",
                metadata: {
                    assignmentsCount: assignments,
                },
            });
            return res.status(400).json({
                message: "Impossible de supprimer un professeur avec des affectations de cours",
            });
        }
        // Supprimer le professeur
        await prisma.professeur.delete({
            where: { id },
        });
        // Log de suppression réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_PROFESSEUR_SUCCESS",
            entity: "Professeur",
            entityId: id,
            description: "Professeur supprimé avec succès",
            status: "SUCCESS",
            metadata: {
                professeurName: `${professeur.firstName} ${professeur.lastName}`,
                email: professeur.email,
                status: professeur.status,
            },
        });
        res.status(204).send();
    }
    catch (error) {
        await handleControllerError(error, res, "la suppression du professeur", {
            ...auditData,
            action: "DELETE_PROFESSEUR",
            entityId: req.params.id,
        });
    }
};
exports.deleteprofesseur = deleteprofesseur;
const getprofesseurAssignments = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: (0, auditController_1.getUserIdFromRequest)(req),
    };
    try {
        const { id } = req.params;
        const assignments = await prisma.courseAssignment.findMany({
            where: { professeurId: id },
            include: {
                ue: true,
                faculty: true,
            },
            orderBy: [{ semester: "desc" }],
        });
        // Log de consultation des affectations
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_PROFESSEUR_ASSIGNMENTS",
            entity: "Professeur",
            entityId: id,
            description: "Consultation des affectations d'un professeur",
            status: "SUCCESS",
            metadata: {
                assignmentsCount: assignments.length,
            },
        });
        res.json(assignments);
    }
    catch (error) {
        await handleControllerError(error, res, "la récupération des affectations", {
            ...auditData,
            action: "GET_PROFESSEUR_ASSIGNMENTS",
            entityId: req.params.id,
        });
    }
};
exports.getprofesseurAssignments = getprofesseurAssignments;
const bulkUpdateStatus = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: (0, auditController_1.getUserIdFromRequest)(req),
    };
    try {
        const { professorIds, status } = req.body;
        // Log de début de mise à jour en masse
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "BULK_UPDATE_STATUS_START",
            entity: "Professeur",
            description: "Début de la mise à jour en masse des statuts",
            status: "SUCCESS",
            metadata: {
                professorIdsCount: professorIds?.length || 0,
                newStatus: status,
            },
        });
        if (!Array.isArray(professorIds) || professorIds.length === 0) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "BULK_UPDATE_STATUS_VALIDATION_ERROR",
                entity: "Professeur",
                description: "Mise à jour en masse annulée - données invalides",
                status: "ERROR",
                errorMessage: "Liste des IDs de professeurs requise",
            });
            return res.status(400).json({
                success: false,
                error: "Liste des IDs de professeurs requise",
            });
        }
        if (!status || !["Actif", "Inactif"].includes(status)) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "BULK_UPDATE_STATUS_VALIDATION_ERROR",
                entity: "Professeur",
                description: "Mise à jour en masse annulée - statut invalide",
                status: "ERROR",
                errorMessage: "Statut invalide",
            });
            return res.status(400).json({
                success: false,
                error: "Statut invalide",
            });
        }
        const result = await prisma.professeur.updateMany({
            where: {
                id: {
                    in: professorIds,
                },
            },
            data: {
                status,
            },
        });
        // Log de mise à jour en masse réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "BULK_UPDATE_STATUS_SUCCESS",
            entity: "Professeur",
            description: "Mise à jour en masse des statuts terminée",
            status: "SUCCESS",
            metadata: {
                totalUpdated: result.count,
                professorIdsCount: professorIds.length,
                newStatus: status,
                successRate: `${((result.count / professorIds.length) * 100).toFixed(2)}%`,
            },
        });
        res.json({
            success: true,
            data: result,
            message: `${result.count} professeur(s) mis à jour avec succès`,
        });
    }
    catch (error) {
        await handleControllerError(error, res, "la mise à jour en masse des statuts", {
            ...auditData,
            action: "BULK_UPDATE_STATUS",
        });
    }
};
exports.bulkUpdateStatus = bulkUpdateStatus;
