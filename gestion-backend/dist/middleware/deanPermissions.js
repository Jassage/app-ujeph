"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDeanAccess = exports.deanPermissions = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const deanPermissions = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "Doyen") {
            return next();
        }
        // Récupérer la faculté dont l'utilisateur est le doyen
        const faculty = await prisma_1.default.faculty.findFirst({
            where: {
                deanId: user.id,
            },
        });
        if (!faculty) {
            return res.status(403).json({
                message: "Aucune faculté associée à votre compte de doyen",
            });
        }
        // Ajouter les informations de faculté à la requête
        req.facultyId = faculty.id;
        req.faculty = faculty;
        next();
    }
    catch (error) {
        res.status(500).json({ message: "Erreur de vérification des permissions" });
    }
};
exports.deanPermissions = deanPermissions;
const checkDeanAccess = (resourceType) => {
    return async (req, res, next) => {
        const user = req.user;
        const facultyId = req.facultyId;
        if (!user || user.role !== "Doyen") {
            return next();
        }
        try {
            let hasAccess = false;
            switch (resourceType) {
                case "student":
                    const studentId = req.params.id;
                    if (studentId) {
                        // Vérifier si l'étudiant est inscrit dans la faculté du doyen
                        const enrollment = await prisma_1.default.enrollment.findFirst({
                            where: {
                                studentId: studentId,
                                facultyId: facultyId,
                                status: "Active",
                            },
                        });
                        hasAccess = !!enrollment;
                    }
                    else {
                        hasAccess = true; // Pour les listes, le filtrage se fait dans le controller
                    }
                    break;
                case "faculty":
                    const targetFacultyId = req.params.id;
                    hasAccess = targetFacultyId === facultyId;
                    break;
                case "user":
                    // Les doyens ne peuvent voir que les utilisateurs de leur faculté
                    const targetUserId = req.params.id;
                    if (targetUserId) {
                        const targetUser = await prisma_1.default.user.findUnique({
                            where: { id: targetUserId },
                        });
                        // L'utilisateur a accès s'il est lié à la faculté via student ou professeur
                    }
                    else {
                        hasAccess = true; // Pour les listes, le filtrage se fait dans le controller
                    }
                    break;
                case "enrollment":
                    const enrollmentId = req.params.id;
                    if (enrollmentId) {
                        const enrollment = await prisma_1.default.enrollment.findFirst({
                            where: {
                                id: enrollmentId,
                                facultyId: facultyId,
                            },
                        });
                        hasAccess = !!enrollment;
                    }
                    else {
                        hasAccess = true;
                    }
                    break;
            }
            if (!hasAccess) {
                return res.status(403).json({
                    message: "Accès non autorisé à cette ressource",
                });
            }
            next();
        }
        catch (error) {
            res.status(500).json({ message: "Erreur de vérification d'accès" });
        }
    };
};
exports.checkDeanAccess = checkDeanAccess;
