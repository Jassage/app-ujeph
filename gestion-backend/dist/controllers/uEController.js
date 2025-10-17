"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUEs = exports.getUEStats = exports.removePrerequisite = exports.addPrerequisite = exports.deleteUE = exports.updateUE = exports.getUEById = exports.createUE = exports.getUEs = void 0;
const prisma_1 = __importDefault(require("../prisma")); // Assurez-vous que ce chemin est correct
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
const getUEs = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || "unknown",
    };
    try {
        const { type, search, page = "1", limit = "10" } = req.query;
        console.log("🔍 Récupération UEs avec params:", {
            type,
            search,
            page,
            limit,
        });
        const where = {};
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        if (type && type !== "all") {
            where.type = type;
        }
        if (search) {
            where.OR = [
                { code: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        console.log("📋 Filtre WHERE:", where);
        const [ues, total] = await Promise.all([
            prisma_1.default.ue.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    prerequisites: {
                        include: {
                            prerequisite: {
                                select: {
                                    id: true,
                                    code: true,
                                    title: true,
                                },
                            },
                        },
                    },
                    requiredFor: {
                        include: {
                            ue: {
                                select: {
                                    id: true,
                                    code: true,
                                    title: true,
                                },
                            },
                        },
                    },
                    assignments: {
                        include: {
                            professeur: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            faculty: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    code: "asc",
                },
                skip,
                take,
            }),
            prisma_1.default.ue.count({ where }),
        ]);
        console.log(`✅ ${ues.length} cours récupérées sur ${total} total`);
        // Log de consultation réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_UES_LIST",
            entity: "UE",
            description: `Consultation de la liste des cours - ${ues.length} cours trouvées sur ${total}`,
            status: "SUCCESS",
        });
        res.json({
            ues,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("❌ Erreur récupération UEs:", error);
        console.error("❌ Stack:", error.stack);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_UES_LIST_ERROR",
            entity: "UE",
            description: "Erreur lors de la récupération de la liste des cours",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur lors de la récupération des cours",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getUEs = getUEs;
const createUE = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        const { code, title, credits, type, passingGrade, description, objectives, createdById, prerequisites = [], // ← AJOUT: Récupérer les prérequis
         } = req.body;
        console.log("📨 Données reçues:", req.body);
        // Validation des champs obligatoires
        if (!code || !title || !credits || !type || !createdById) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_UE_ATTEMPT",
                entity: "UE",
                description: "Tentative de création du cours - champs obligatoires manquants",
                status: "ERROR",
            });
            return res.status(400).json({
                message: "Les champs code, title, credits, type et createdById sont obligatoires",
            });
        }
        // Vérifier si le code UE existe déjà
        const existingUE = await prisma_1.default.ue.findUnique({
            where: { code },
        });
        if (existingUE) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_UE_ATTEMPT",
                entity: "UE",
                description: `Tentative de création du cours - code ${code} déjà existant`,
                status: "ERROR",
            });
            return res.status(400).json({
                message: "Une UE avec ce code existe déjà",
            });
        }
        // Vérifier si l'utilisateur existe
        const user = await prisma_1.default.user.findUnique({
            where: { id: createdById },
        });
        if (!user) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_UE_ATTEMPT",
                entity: "COURS",
                description: `Tentative de création du cours - utilisateur ${createdById} non trouvé`,
                status: "ERROR",
            });
            return res.status(400).json({
                message: "L'utilisateur spécifié n'existe pas",
            });
        }
        // VÉRIFICATION DES PRÉREQUIS
        if (prerequisites && prerequisites.length > 0) {
            // Vérifier que tous les prérequis existent
            const existingPrerequisites = await prisma_1.default.ue.findMany({
                where: {
                    id: { in: prerequisites },
                },
                select: { id: true, code: true },
            });
            if (existingPrerequisites.length !== prerequisites.length) {
                const foundIds = existingPrerequisites.map((p) => p.id);
                const missingIds = prerequisites.filter((id) => !foundIds.includes(id));
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "CREATE_UE_ATTEMPT",
                    entity: "UE",
                    description: `Tentative de création du cours - prérequis non trouvés: ${missingIds.join(", ")}`,
                    status: "ERROR",
                });
                return res.status(400).json({
                    message: "Certains prérequis spécifiés n'existent pas",
                    missingPrerequisites: missingIds,
                });
            }
            // Vérifier les références circulaires
            if (prerequisites.includes(code)) {
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "CREATE_UE_ATTEMPT",
                    entity: "UE",
                    description: "Tentative de création du cours - référence circulaire détectée",
                    status: "ERROR",
                });
                return res.status(400).json({
                    message: "Une UE ne peut pas être son propre prérequis",
                });
            }
        }
        // CRÉATION DE L'UE AVEC PRÉREQUIS (transaction)
        const result = await prisma_1.default.$transaction(async (tx) => {
            // 1. Créer l'UE
            const ue = await tx.ue.create({
                data: {
                    code,
                    title,
                    credits: parseInt(credits),
                    type,
                    passingGrade: passingGrade ? parseInt(passingGrade) : 60,
                    description: description || null,
                    objectives: objectives || null,
                    createdById,
                },
            });
            // 2. Ajouter les prérequis si présents
            if (prerequisites && prerequisites.length > 0) {
                const prerequisiteRelations = prerequisites.map((prerequisiteId) => ({
                    ueId: ue.id,
                    prerequisiteId,
                }));
                await tx.uePrerequisite.createMany({
                    data: prerequisiteRelations,
                    skipDuplicates: true,
                });
            }
            // 3. Récupérer l'UE complète avec ses relations
            const completeUE = await tx.ue.findUnique({
                where: { id: ue.id },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    prerequisites: {
                        include: {
                            prerequisite: {
                                select: {
                                    id: true,
                                    code: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            });
            return completeUE;
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_UE_SUCCESS",
            entity: "UE",
            entityId: result?.id,
            description: `Cours ${code} (${title}) créée avec succès avec ${prerequisites.length} prérequis`,
            status: "SUCCESS",
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error("❌ Erreur création UE:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_UE_ERROR",
            entity: "UE",
            description: "Erreur lors de la création du cours",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.createUE = createUE;
const getUEById = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const ue = await prisma_1.default.ue.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                prerequisites: {
                    include: {
                        prerequisite: {
                            select: {
                                id: true,
                                code: true,
                                title: true,
                                credits: true,
                                type: true,
                            },
                        },
                    },
                },
                requiredFor: {
                    include: {
                        ue: {
                            select: {
                                id: true,
                                code: true,
                                title: true,
                                credits: true,
                                type: true,
                            },
                        },
                    },
                },
                assignments: {
                    include: {
                        professeur: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        ue: {
                            select: {
                                id: true,
                                code: true,
                                title: true,
                            },
                        },
                    },
                },
                grades: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                    },
                },
                retakes: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                studentId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!ue) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "GET_UE_DETAILS_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: "Tentative de consultation du cours - non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "UE non trouvée",
            });
        }
        // Log de consultation réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_UE_DETAILS_SUCCESS",
            entity: "UE",
            entityId: id,
            description: `Consultation des détails du cours ${ue.code} (${ue.title})`,
            status: "SUCCESS",
        });
        res.json(ue);
    }
    catch (error) {
        console.error("Erreur récupération UE:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_UE_DETAILS_ERROR",
            entity: "UE",
            entityId: req.params.id,
            description: "Erreur lors de la récupération des détails du cours",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getUEById = getUEById;
const updateUE = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const { code, title, credits, type, passingGrade, description, objectives, } = req.body;
        // Vérifier si l'UE existe
        const existingUE = await prisma_1.default.ue.findUnique({
            where: { id },
        });
        if (!existingUE) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "UPDATE_UE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: "Tentative de mise à jour du Cours - non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "Cours non trouvée",
            });
        }
        // Vérifier les conflits de code
        if (code && code !== existingUE.code) {
            const existingCode = await prisma_1.default.ue.findUnique({
                where: { code },
            });
            if (existingCode) {
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_UE_ATTEMPT",
                    entity: "UE",
                    entityId: id,
                    description: `Tentative de mise à jour du cours - code ${code} déjà existant`,
                    status: "ERROR",
                });
                return res.status(400).json({
                    message: "Une UE avec ce code existe déjà",
                });
            }
        }
        // Mettre à jour l'UE
        const ue = await prisma_1.default.ue.update({
            where: { id },
            data: {
                code: code ?? undefined,
                title: title ?? undefined,
                credits: credits ? parseInt(credits) : undefined,
                type: type ?? undefined,
                passingGrade: passingGrade ? parseInt(passingGrade) : undefined,
                description: description ?? undefined,
                objectives: objectives ?? undefined,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_UE_SUCCESS",
            entity: "UE",
            entityId: id,
            description: `Cours ${ue.code} (${ue.title}) mise à jour avec succès`,
            status: "SUCCESS",
        });
        res.json(ue);
    }
    catch (error) {
        console.error("Erreur modification UE:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_UE_ERROR",
            entity: "UE",
            entityId: req.params.id,
            description: "Erreur lors de la mise à jour du cours",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.updateUE = updateUE;
const deleteUE = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        // Vérifier si l'UE existe
        const ue = await prisma_1.default.ue.findUnique({
            where: { id },
            include: {
                assignments: true,
                grades: true,
                retakes: true,
                prerequisites: true,
                requiredFor: true,
            },
        });
        if (!ue) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "DELETE_UE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: "Tentative de suppression du cours - non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "UE non trouvée",
            });
        }
        // Vérifier les dépendances
        if (ue.assignments.length > 0 ||
            ue.grades.length > 0 ||
            ue.retakes.length > 0) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "DELETE_UE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: `Tentative de suppression du cours avec dépendances - ${ue.assignments.length} affectations, ${ue.grades.length} notes, ${ue.retakes.length} rattrapages`,
                status: "ERROR",
            });
            return res.status(400).json({
                message: "Impossible de supprimer une UE avec des affectations, notes ou rattrapages",
            });
        }
        // Supprimer les prérequis d'abord
        await prisma_1.default.uePrerequisite.deleteMany({
            where: {
                OR: [{ ueId: id }, { prerequisiteId: id }],
            },
        });
        // Supprimer l'UE
        await prisma_1.default.ue.delete({
            where: { id },
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_UE_SUCCESS",
            entity: "UE",
            entityId: id,
            description: `Cours ${ue.code} (${ue.title}) supprimée avec succès`,
            status: "SUCCESS",
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Erreur suppression UE:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_UE_ERROR",
            entity: "UE",
            entityId: req.params.id,
            description: "Erreur lors de la suppression du cours",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.deleteUE = deleteUE;
const addPrerequisite = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const { prerequisiteId } = req.body;
        // Vérifier si l'UE existe
        const ue = await prisma_1.default.ue.findUnique({
            where: { id },
        });
        if (!ue) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "ADD_PREREQUISITE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: "Tentative d'ajout de prérequis - Cours non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "UE non trouvée",
            });
        }
        // Vérifier si le prérequis existe
        const prerequisite = await prisma_1.default.ue.findUnique({
            where: { id: prerequisiteId },
        });
        if (!prerequisite) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "ADD_PREREQUISITE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: `Tentative d'ajout de prérequis - Cours prérequis ${prerequisiteId} non trouvée`,
                status: "ERROR",
            });
            return res.status(404).json({
                message: "cours prérequis non trouvée",
            });
        }
        // Éviter les références circulaires
        if (id === prerequisiteId) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "ADD_PREREQUISITE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: "Tentative d'ajout de prérequis - référence circulaire",
                status: "ERROR",
            });
            return res.status(400).json({
                message: "Une UE ne peut pas être son propre prérequis",
            });
        }
        // Vérifier si le prérequis existe déjà
        const existingPrerequisite = await prisma_1.default.uePrerequisite.findUnique({
            where: {
                ueId_prerequisiteId: {
                    ueId: id,
                    prerequisiteId,
                },
            },
        });
        if (existingPrerequisite) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "ADD_PREREQUISITE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: `Tentative d'ajout de prérequis - relation déjà existante`,
                status: "ERROR",
            });
            return res.status(400).json({
                message: "Ce prérequis existe déjà",
            });
        }
        // Ajouter le prérequis
        const prerequisiteRelation = await prisma_1.default.uePrerequisite.create({
            data: {
                ueId: id,
                prerequisiteId,
            },
            include: {
                ue: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                    },
                },
                prerequisite: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                    },
                },
            },
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "ADD_PREREQUISITE_SUCCESS",
            entity: "UE",
            entityId: id,
            description: `Prérequis ajouté : ${prerequisite.code} pour ${ue.code}`,
            status: "SUCCESS",
        });
        res.status(201).json(prerequisiteRelation);
    }
    catch (error) {
        console.error("Erreur ajout prérequis:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "ADD_PREREQUISITE_ERROR",
            entity: "UE",
            entityId: req.params.id,
            description: "Erreur lors de l'ajout du prérequis",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.addPrerequisite = addPrerequisite;
const removePrerequisite = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id, prerequisiteId } = req.params;
        // Vérifier si la relation existe
        const prerequisite = await prisma_1.default.uePrerequisite.findUnique({
            where: {
                ueId_prerequisiteId: {
                    ueId: id,
                    prerequisiteId,
                },
            },
        });
        if (!prerequisite) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "REMOVE_PREREQUISITE_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: `Tentative de suppression de prérequis - relation non trouvée`,
                status: "ERROR",
            });
            return res.status(404).json({
                message: "Relation de prérequis non trouvée",
            });
        }
        // Supprimer le prérequis
        await prisma_1.default.uePrerequisite.delete({
            where: {
                ueId_prerequisiteId: {
                    ueId: id,
                    prerequisiteId,
                },
            },
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "REMOVE_PREREQUISITE_SUCCESS",
            entity: "UE",
            entityId: id,
            description: `Prérequis ${prerequisiteId} supprimé du cours ${id}`,
            status: "SUCCESS",
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Erreur suppression prérequis:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "REMOVE_PREREQUISITE_ERROR",
            entity: "UE",
            entityId: req.params.id,
            description: "Erreur lors de la suppression du prérequis",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.removePrerequisite = removePrerequisite;
const getUEStats = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        // Vérifier si l'UE existe
        const ueExists = await prisma_1.default.ue.findUnique({
            where: { id },
            select: { id: true, code: true, title: true },
        });
        if (!ueExists) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "GET_UE_STATS_ATTEMPT",
                entity: "UE",
                entityId: id,
                description: "Tentative de consultation des statistiques - Cours non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "UE non trouvée",
            });
        }
        // Récupérer toutes les statistiques en parallèle
        const [gradeStats, averageValidGrade, retakeStats, gradeDistribution] = await Promise.all([
            // Statistiques par statut
            prisma_1.default.grade.groupBy({
                by: ["status"],
                where: { ueId: id },
                _count: { id: true },
            }),
            // Note moyenne des notes valides
            prisma_1.default.grade.aggregate({
                where: {
                    ueId: id,
                    status: "Valid_", // ← CORRECTION ICI
                },
                _avg: { grade: true },
                _count: { id: true },
            }),
            // Statistiques des rattrapages
            prisma_1.default.retake.groupBy({
                by: ["status"],
                where: { ueId: id },
                _count: { id: true },
            }),
            // Distribution des notes (pour histogramme)
            prisma_1.default.grade.findMany({
                where: { ueId: id },
                select: { grade: true, status: true },
                orderBy: { grade: "asc" },
            }),
        ]);
        // Calculer les totaux
        const totalGrades = gradeStats.reduce((sum, item) => sum + item._count.id, 0);
        const validGradesCount = gradeStats.find((stat) => stat.status === "Valid_")?._count.id || 0;
        const nonValidGradesCount = gradeStats.find((stat) => stat.status === "Non_valid_")?._count.id || 0;
        const reprendreGradesCount = gradeStats.find((stat) => stat.status === "reprendre")?._count.id || 0;
        // Calculer les pourcentages
        const validPercentage = totalGrades > 0 ? (validGradesCount / totalGrades) * 100 : 0;
        const nonValidPercentage = totalGrades > 0 ? (nonValidGradesCount / totalGrades) * 100 : 0;
        const reprendrePercentage = totalGrades > 0 ? (reprendreGradesCount / totalGrades) * 100 : 0;
        const response = {
            // Statistiques de base
            gradeStats,
            averageGrade: averageValidGrade._avg?.grade ?? 0,
            retakeStats,
            // Métriques calculées
            totals: {
                grades: totalGrades,
                valid: validGradesCount,
                nonValid: nonValidGradesCount,
                reprendre: reprendreGradesCount,
            },
            percentages: {
                valid: Math.round(validPercentage * 100) / 100,
                nonValid: Math.round(nonValidPercentage * 100) / 100,
                reprendre: Math.round(reprendrePercentage * 100) / 100,
            },
            // Distribution des notes
            gradeDistribution: gradeDistribution.map((g) => ({
                grade: g.grade,
                status: g.status,
            })),
            hasData: totalGrades > 0,
        };
        // Log de consultation des statistiques
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_UE_STATS_SUCCESS",
            entity: "UE",
            entityId: id,
            description: `Consultation des statistiques du cours ${ueExists.code} - ${totalGrades} notes analysées`,
            status: "SUCCESS",
        });
        res.json(response);
    }
    catch (error) {
        console.error("Erreur récupération statistiques UE:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_UE_STATS_ERROR",
            entity: "UE",
            entityId: req.params.id,
            description: "Erreur lors de la récupération des statistiques du cours",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur lors de la récupération des statistiques",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getUEStats = getUEStats;
const searchUEs = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { q } = req.query;
        if (!q) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "SEARCH_UES_ATTEMPT",
                entity: "UE",
                description: "Tentative de recherche des Cours - paramètre de recherche manquant",
                status: "ERROR",
            });
            return res.status(400).json({
                message: "Le paramètre de recherche est requis",
            });
        }
        const ues = await prisma_1.default.ue.findMany({
            where: {
                OR: [
                    { code: { contains: q } },
                    { title: { contains: q } },
                    { description: { contains: q } },
                ],
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            take: 20,
        });
        // Log de recherche réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "SEARCH_UES_SUCCESS",
            entity: "UE",
            description: `Recherche des Cours avec terme "${q}" - ${ues.length} résultats trouvés`,
            status: "SUCCESS",
        });
        res.json(ues);
    }
    catch (error) {
        console.error("Erreur recherche Cours:", error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "SEARCH_COURSES_ERROR",
            entity: "UE",
            description: "Erreur lors de la recherche du cours",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur interne du serveur",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.searchUEs = searchUEs;
