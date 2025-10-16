import { PrismaClient } from "../../generated/prisma";
import { createAuditLog } from "./auditController";
const prisma = new PrismaClient();
// ==================== FONCTIONS UTILITAIRES ====================
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
function isPrismaError(error) {
    return error instanceof Error && "code" in error;
}
function validateAssignmentInput(data) {
    const errors = [];
    const requiredFields = [
        "ueId",
        "professeurId",
        "facultyId",
        "level",
        "academicYearId",
        "semester",
    ];
    requiredFields.forEach((field) => {
        if (!data[field]) {
            errors.push(`Le champ ${field} est requis`);
        }
    });
    // Validation du semestre
    if (data.semester && !["S1", "S2"].includes(data.semester)) {
        errors.push("Le semestre doit être 'S1' ou 'S2'");
    }
    // Validation du niveau
    if (data.level && !["1", "2", "3", "4", "5"].includes(data.level)) {
        errors.push("Le niveau doit être compris entre 1 et 5");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
// ==================== GESTIONNAIRE D'ERREURS UNIFIÉ ====================
const handleControllerError = (error, res, context, auditData) => {
    console.error(`Error in ${context}:`, error);
    let statusCode = 500;
    let errorMessage = `Erreur lors de ${context}`;
    if (isPrismaError(error)) {
        switch (error.code) {
            case "P2002":
                statusCode = 409;
                errorMessage = "Une affectation existe déjà pour cette combinaison";
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
    createAuditLog({
        ...auditData,
        action: `${auditData.action}_ERROR`,
        description: `Erreur lors de ${context}`,
        status: "ERROR",
        errorMessage: errorMessage,
    });
    const response = {
        error: errorMessage,
        success: false,
    };
    if (process.env.NODE_ENV === "development") {
        response.details = getErrorMessage(error);
        if (isPrismaError(error) && error.meta) {
            response.meta = error.meta;
        }
    }
    res.status(statusCode).json(response);
};
// ==================== CONTRÔLEURS ====================
export const createCourseAssignment = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        const assignmentData = req.body;
        console.log("Requête création affectation:", assignmentData);
        // Validation des données
        const validation = validateAssignmentInput(assignmentData);
        if (!validation.isValid) {
            await createAuditLog({
                ...auditData,
                action: "CREATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de création d'affectation - données invalides",
                status: "ERROR",
                errorMessage: validation.errors.join(", "),
            });
            return res.status(400).json({
                success: false,
                error: "Données invalides",
                details: validation.errors,
                receivedData: assignmentData,
            });
        }
        // Vérifications d'existence des entités liées
        const [professor, ue, faculty, academicYear] = await Promise.all([
            prisma.professeur.findUnique({
                where: { id: assignmentData.professeurId },
                select: { id: true, firstName: true, lastName: true },
            }),
            prisma.ue.findUnique({
                where: { id: assignmentData.ueId },
                select: { id: true, code: true, title: true },
            }),
            prisma.faculty.findUnique({
                where: { id: assignmentData.facultyId },
                select: { id: true, name: true },
            }),
            prisma.academicYear.findUnique({
                where: { id: assignmentData.academicYearId },
                select: { id: true, year: true },
            }),
        ]);
        // Vérifications avec messages d'erreur spécifiques
        if (!professor) {
            await createAuditLog({
                ...auditData,
                action: "CREATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de création d'affectation - professeur ${assignmentData.professeurId} non trouvé`,
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Professeur non trouvé",
                professeurId: assignmentData.professeurId,
            });
        }
        if (!ue) {
            await createAuditLog({
                ...auditData,
                action: "CREATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de création d'affectation - UE ${assignmentData.ueId} non trouvée`,
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Cours non trouvée",
                ueId: assignmentData.ueId,
            });
        }
        if (!faculty) {
            await createAuditLog({
                ...auditData,
                action: "CREATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de création d'affectation - faculté ${assignmentData.facultyId} non trouvée`,
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Faculté non trouvée",
                facultyId: assignmentData.facultyId,
            });
        }
        if (!academicYear) {
            await createAuditLog({
                ...auditData,
                action: "CREATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de création d'affectation - année académique ${assignmentData.academicYearId} non trouvée`,
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Année académique non trouvée",
                academicYearId: assignmentData.academicYearId,
            });
        }
        // Vérifier si l'affectation existe déjà
        const existingAssignment = await prisma.courseAssignment.findFirst({
            where: {
                ueId: assignmentData.ueId,
                professeurId: assignmentData.professeurId,
                facultyId: assignmentData.facultyId,
                level: assignmentData.level,
                academicYearId: assignmentData.academicYearId,
                semester: assignmentData.semester,
            },
        });
        if (existingAssignment) {
            await createAuditLog({
                ...auditData,
                action: "CREATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de création d'affectation - affectation déjà existante pour cette combinaison`,
                status: "ERROR",
            });
            return res.status(409).json({
                success: false,
                error: "Cette affectation existe déjà",
                existingAssignmentId: existingAssignment.id,
                details: {
                    ueId: assignmentData.ueId,
                    professeurId: assignmentData.professeurId,
                    facultyId: assignmentData.facultyId,
                    level: assignmentData.level,
                    academicYearId: assignmentData.academicYearId,
                    semester: assignmentData.semester,
                },
            });
        }
        // Créer l'affectation
        const assignment = await prisma.courseAssignment.create({
            data: assignmentData,
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
                professeur: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                faculty: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                academicYear: {
                    select: {
                        id: true,
                        year: true,
                        isCurrent: true,
                    },
                },
            },
        });
        // Log de création réussie
        await createAuditLog({
            ...auditData,
            action: "CREATE_ASSIGNMENT_SUCCESS",
            entity: "CourseAssignment",
            entityId: assignment.id,
            description: `Affectation créée: ${professor.firstName} ${professor.lastName} assigné à ${ue.code} (${faculty.name}, niveau ${assignmentData.level}, ${assignmentData.semester})`,
            status: "SUCCESS",
        });
        res.status(201).json({
            success: true,
            message: "Affectation créée avec succès",
            data: assignment,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la création de l'affectation", {
            ...auditData,
            action: "CREATE_ASSIGNMENT",
        });
    }
};
export const getCourseAssignments = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { professorId, facultyId, academicYearId, semester, level, ueId } = req.query;
        const where = {};
        // Filtres avec validation
        if (professorId)
            where.professeurId = professorId;
        if (facultyId)
            where.facultyId = facultyId;
        if (academicYearId)
            where.academicYearId = academicYearId;
        if (semester) {
            if (["S1", "S2"].includes(semester)) {
                where.semester = semester;
            }
            else {
                await createAuditLog({
                    ...auditData,
                    action: "GET_ASSIGNMENTS_ATTEMPT",
                    entity: "CourseAssignment",
                    description: "Tentative de récupération des affectations - semestre invalide",
                    status: "ERROR",
                });
                return res.status(400).json({
                    success: false,
                    error: "Semestre invalide",
                    validSemesters: ["S1", "S2"],
                });
            }
        }
        if (level) {
            if (["1", "2", "3", "4", "5"].includes(level)) {
                where.level = level;
            }
            else {
                await createAuditLog({
                    ...auditData,
                    action: "GET_ASSIGNMENTS_ATTEMPT",
                    entity: "CourseAssignment",
                    description: "Tentative de récupération des affectations - niveau invalide",
                    status: "ERROR",
                });
                return res.status(400).json({
                    success: false,
                    error: "Niveau invalide",
                    validLevels: ["1", "2", "3", "4", "5"],
                });
            }
        }
        if (ueId)
            where.ueId = ueId;
        const assignments = await prisma.courseAssignment.findMany({
            where,
            include: {
                ue: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        credits: true,
                        type: true,
                        passingGrade: true,
                    },
                },
                professeur: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        status: true,
                    },
                },
                faculty: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true,
                    },
                },
                academicYear: {
                    select: {
                        id: true,
                        year: true,
                        isCurrent: true,
                    },
                },
            },
            orderBy: [
                { academicYear: { year: "desc" } },
                { semester: "desc" },
                { level: "asc" },
                { ue: { code: "asc" } },
            ],
        });
        // Log de consultation réussie
        await createAuditLog({
            ...auditData,
            action: "GET_ASSIGNMENTS_SUCCESS",
            entity: "CourseAssignment",
            description: `Consultation de la liste des affectations - ${assignments.length} affectation(s) trouvée(s)`,
            status: "SUCCESS",
        });
        res.json({
            success: true,
            count: assignments.length,
            data: assignments,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la récupération des affectations", {
            ...auditData,
            action: "GET_ASSIGNMENTS",
        });
    }
};
export const updateCourseAssignment = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            await createAuditLog({
                ...auditData,
                action: "UPDATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de mise à jour d'affectation - ID manquant",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "ID de l'affectation requis",
            });
        }
        // Vérifier si l'affectation existe
        const existingAssignment = await prisma.courseAssignment.findUnique({
            where: { id },
            include: {
                ue: true,
                professeur: true,
                faculty: true,
                academicYear: true,
            },
        });
        if (!existingAssignment) {
            await createAuditLog({
                ...auditData,
                action: "UPDATE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                entityId: id,
                description: "Tentative de mise à jour d'affectation - non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Affectation non trouvée",
            });
        }
        // Vérifications optionnelles pour les relations
        if (updateData.ueId) {
            const ue = await prisma.ue.findUnique({
                where: { id: updateData.ueId },
                select: { id: true, code: true, title: true },
            });
            if (!ue) {
                await createAuditLog({
                    ...auditData,
                    action: "UPDATE_ASSIGNMENT_ATTEMPT",
                    entity: "CourseAssignment",
                    entityId: id,
                    description: `Tentative de mise à jour d'affectation - UE ${updateData.ueId} non trouvée`,
                    status: "ERROR",
                });
                return res.status(404).json({
                    success: false,
                    error: "UE non trouvée",
                    ueId: updateData.ueId,
                });
            }
        }
        if (updateData.facultyId) {
            const faculty = await prisma.faculty.findUnique({
                where: { id: updateData.facultyId },
                select: { id: true, name: true },
            });
            if (!faculty) {
                await createAuditLog({
                    ...auditData,
                    action: "UPDATE_ASSIGNMENT_ATTEMPT",
                    entity: "CourseAssignment",
                    entityId: id,
                    description: `Tentative de mise à jour d'affectation - faculté ${updateData.facultyId} non trouvée`,
                    status: "ERROR",
                });
                return res.status(404).json({
                    success: false,
                    error: "Faculté non trouvée",
                    facultyId: updateData.facultyId,
                });
            }
        }
        if (updateData.academicYearId) {
            const academicYear = await prisma.academicYear.findUnique({
                where: { id: updateData.academicYearId },
                select: { id: true, year: true },
            });
            if (!academicYear) {
                await createAuditLog({
                    ...auditData,
                    action: "UPDATE_ASSIGNMENT_ATTEMPT",
                    entity: "CourseAssignment",
                    entityId: id,
                    description: `Tentative de mise à jour d'affectation - année académique ${updateData.academicYearId} non trouvée`,
                    status: "ERROR",
                });
                return res.status(404).json({
                    success: false,
                    error: "Année académique non trouvée",
                    academicYearId: updateData.academicYearId,
                });
            }
        }
        if (updateData.professeurId) {
            const professor = await prisma.professeur.findUnique({
                where: { id: updateData.professeurId },
                select: { id: true, firstName: true, lastName: true },
            });
            if (!professor) {
                await createAuditLog({
                    ...auditData,
                    action: "UPDATE_ASSIGNMENT_ATTEMPT",
                    entity: "CourseAssignment",
                    entityId: id,
                    description: `Tentative de mise à jour d'affectation - professeur ${updateData.professeurId} non trouvé`,
                    status: "ERROR",
                });
                return res.status(404).json({
                    success: false,
                    error: "Professeur non trouvé",
                    professeurId: updateData.professeurId,
                });
            }
        }
        // Vérifier les conflits d'unicité si des champs clés sont modifiés
        if (updateData.ueId ||
            updateData.facultyId ||
            updateData.level ||
            updateData.academicYearId ||
            updateData.semester) {
            const conflictCheck = await prisma.courseAssignment.findFirst({
                where: {
                    id: { not: id },
                    ueId: updateData.ueId || existingAssignment.ueId,
                    facultyId: updateData.facultyId || existingAssignment.facultyId,
                    level: updateData.level || existingAssignment.level,
                    academicYearId: updateData.academicYearId || existingAssignment.academicYearId,
                    semester: updateData.semester || existingAssignment.semester,
                    professeurId: updateData.professeurId || existingAssignment.professeurId,
                },
            });
            if (conflictCheck) {
                await createAuditLog({
                    ...auditData,
                    action: "UPDATE_ASSIGNMENT_ATTEMPT",
                    entity: "CourseAssignment",
                    entityId: id,
                    description: `Tentative de mise à jour d'affectation - conflit avec l'affectation ${conflictCheck.id}`,
                    status: "ERROR",
                });
                return res.status(409).json({
                    success: false,
                    error: "Une affectation similaire existe déjà",
                    conflictingAssignmentId: conflictCheck.id,
                });
            }
        }
        // Mettre à jour l'affectation
        const updatedAssignment = await prisma.courseAssignment.update({
            where: { id },
            data: updateData,
            include: {
                ue: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        credits: true,
                    },
                },
                professeur: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                faculty: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                academicYear: {
                    select: {
                        id: true,
                        year: true,
                    },
                },
            },
        });
        // Log de mise à jour réussie
        await createAuditLog({
            ...auditData,
            action: "UPDATE_ASSIGNMENT_SUCCESS",
            entity: "CourseAssignment",
            entityId: id,
            description: `Affectation mise à jour: ${updatedAssignment.professeur.firstName} ${updatedAssignment.professeur.lastName} assigné à ${updatedAssignment.ue.code} (${updatedAssignment.faculty.name}, niveau ${updatedAssignment.level}, ${updatedAssignment.semester})`,
            status: "SUCCESS",
        });
        res.json({
            success: true,
            message: "Affectation mise à jour avec succès",
            data: updatedAssignment,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la mise à jour de l'affectation", {
            ...auditData,
            action: "UPDATE_ASSIGNMENT",
        });
    }
};
export const deleteCourseAssignment = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        if (!id) {
            await createAuditLog({
                ...auditData,
                action: "DELETE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de suppression d'affectation - ID manquant",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "ID de l'affectation requis",
            });
        }
        // Vérifier si l'affectation existe
        const existingAssignment = await prisma.courseAssignment.findUnique({
            where: { id },
            include: {
                ue: {
                    select: {
                        code: true,
                        title: true,
                    },
                },
                professeur: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                faculty: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!existingAssignment) {
            await createAuditLog({
                ...auditData,
                action: "DELETE_ASSIGNMENT_ATTEMPT",
                entity: "CourseAssignment",
                entityId: id,
                description: "Tentative de suppression d'affectation - non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Affectation non trouvée",
            });
        }
        // Supprimer l'affectation
        await prisma.courseAssignment.delete({
            where: { id },
        });
        // Log de suppression réussie
        await createAuditLog({
            ...auditData,
            action: "DELETE_ASSIGNMENT_SUCCESS",
            entity: "CourseAssignment",
            entityId: id,
            description: `Affectation supprimée: ${existingAssignment.professeur.firstName} ${existingAssignment.professeur.lastName} n'est plus assigné à ${existingAssignment.ue.code} (${existingAssignment.faculty.name})`,
            status: "SUCCESS",
        });
        res.status(200).json({
            success: true,
            message: "Affectation supprimée avec succès",
            deletedAssignment: {
                id: existingAssignment.id,
                ueId: existingAssignment.ueId,
                professeurId: existingAssignment.professeurId,
                facultyId: existingAssignment.facultyId,
            },
        });
    }
    catch (error) {
        handleControllerError(error, res, "la suppression de l'affectation", {
            ...auditData,
            action: "DELETE_ASSIGNMENT",
        });
    }
};
export const getAssignmentsByFaculty = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { facultyId } = req.params;
        const { level, academicYearId, semester } = req.query;
        if (!facultyId) {
            await createAuditLog({
                ...auditData,
                action: "GET_ASSIGNMENTS_BY_FACULTY_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de récupération par faculté - ID manquant",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "ID de la faculté requis",
            });
        }
        // Vérifier si la faculté existe
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId },
            select: { id: true, name: true },
        });
        if (!faculty) {
            await createAuditLog({
                ...auditData,
                action: "GET_ASSIGNMENTS_BY_FACULTY_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de récupération par faculté - faculté ${facultyId} non trouvée`,
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Faculté non trouvée",
                facultyId,
            });
        }
        const where = { facultyId };
        // Filtres avec validation
        if (level) {
            if (["1", "2", "3", "4", "5"].includes(level)) {
                where.level = level;
            }
            else {
                await createAuditLog({
                    ...auditData,
                    action: "GET_ASSIGNMENTS_BY_FACULTY_ATTEMPT",
                    entity: "CourseAssignment",
                    description: "Tentative de récupération par faculté - niveau invalide",
                    status: "ERROR",
                });
                return res.status(400).json({
                    success: false,
                    error: "Niveau invalide",
                    validLevels: ["1", "2", "3", "4", "5"],
                });
            }
        }
        if (academicYearId)
            where.academicYearId = academicYearId;
        if (semester) {
            if (["S1", "S2"].includes(semester)) {
                where.semester = semester;
            }
            else {
                await createAuditLog({
                    ...auditData,
                    action: "GET_ASSIGNMENTS_BY_FACULTY_ATTEMPT",
                    entity: "CourseAssignment",
                    description: "Tentative de récupération par faculté - semestre invalide",
                    status: "ERROR",
                });
                return res.status(400).json({
                    success: false,
                    error: "Semestre invalide",
                    validSemesters: ["S1", "S2"],
                });
            }
        }
        const assignments = await prisma.courseAssignment.findMany({
            where,
            include: {
                ue: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        credits: true,
                        type: true,
                        passingGrade: true,
                    },
                },
                professeur: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        status: true,
                    },
                },
                academicYear: {
                    select: {
                        id: true,
                        year: true,
                        isCurrent: true,
                    },
                },
            },
            orderBy: [
                { academicYear: { year: "desc" } },
                { semester: "desc" },
                { level: "asc" },
                { ue: { code: "asc" } },
            ],
        });
        // Log de consultation réussie
        await createAuditLog({
            ...auditData,
            action: "GET_ASSIGNMENTS_BY_FACULTY_SUCCESS",
            entity: "CourseAssignment",
            description: `Consultation des affectations de la faculté ${faculty.name} - ${assignments.length} affectation(s) trouvée(s)`,
            status: "SUCCESS",
        });
        res.json({
            success: true,
            faculty: {
                id: faculty.id,
                name: faculty.name,
            },
            count: assignments.length,
            data: assignments,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la récupération des affectations par faculté", {
            ...auditData,
            action: "GET_ASSIGNMENTS_BY_FACULTY",
        });
    }
};
export const getUEsByFacultyAndLevel = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { facultyId, level } = req.params;
        if (!facultyId || !level) {
            await createAuditLog({
                ...auditData,
                action: "GET_UES_BY_FACULTY_LEVEL_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de récupération des UEs - paramètres manquants",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "facultyId et level sont requis",
            });
        }
        // Validation du niveau
        if (!["1", "2", "3", "4", "5"].includes(level)) {
            await createAuditLog({
                ...auditData,
                action: "GET_UES_BY_FACULTY_LEVEL_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de récupération des UEs - niveau invalide",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "Niveau invalide",
                validLevels: ["1", "2", "3", "4", "5"],
            });
        }
        // Vérifier si la faculté existe
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId },
            select: { id: true, name: true },
        });
        if (!faculty) {
            await createAuditLog({
                ...auditData,
                action: "GET_UES_BY_FACULTY_LEVEL_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de récupération des UEs - faculté ${facultyId} non trouvée`,
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Faculté non trouvée",
                facultyId,
            });
        }
        const assignments = await prisma.courseAssignment.findMany({
            where: {
                facultyId,
                level,
            },
            include: {
                ue: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        credits: true,
                        type: true,
                        passingGrade: true,
                        description: true,
                    },
                },
            },
            distinct: ["ueId"],
        });
        const ues = assignments.map((assignment) => assignment.ue);
        // Log de consultation réussie
        await createAuditLog({
            ...auditData,
            action: "GET_UES_BY_FACULTY_LEVEL_SUCCESS",
            entity: "CourseAssignment",
            description: `Consultation des UEs de la faculté ${faculty.name} niveau ${level} - ${ues.length} UE(s) trouvée(s)`,
            status: "SUCCESS",
        });
        res.json({
            success: true,
            faculty: {
                id: faculty.id,
                name: faculty.name,
            },
            level,
            count: ues.length,
            data: ues,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la récupération des Cours par faculté et niveau", {
            ...auditData,
            action: "GET_UES_BY_FACULTY_LEVEL",
        });
    }
};
// ==================== CONTRÔLEURS SUPPLÉMENTAIRES ====================
export const getAssignmentById = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        if (!id) {
            await createAuditLog({
                ...auditData,
                action: "GET_ASSIGNMENT_BY_ID_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de consultation d'affectation - ID manquant",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "ID de l'affectation requis",
            });
        }
        const assignment = await prisma.courseAssignment.findUnique({
            where: { id },
            include: {
                ue: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        credits: true,
                        type: true,
                        passingGrade: true,
                        description: true,
                    },
                },
                professeur: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        status: true,
                    },
                },
                faculty: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true,
                    },
                },
                academicYear: {
                    select: {
                        id: true,
                        year: true,
                        isCurrent: true,
                    },
                },
            },
        });
        if (!assignment) {
            await createAuditLog({
                ...auditData,
                action: "GET_ASSIGNMENT_BY_ID_ATTEMPT",
                entity: "CourseAssignment",
                entityId: id,
                description: "Tentative de consultation d'affectation - non trouvée",
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Affectation non trouvée",
            });
        }
        // Log de consultation réussie
        await createAuditLog({
            ...auditData,
            action: "GET_ASSIGNMENT_BY_ID_SUCCESS",
            entity: "CourseAssignment",
            entityId: id,
            description: `Consultation de l'affectation ${id}: ${assignment.professeur.firstName} ${assignment.professeur.lastName} - ${assignment.ue.code}`,
            status: "SUCCESS",
        });
        res.json({
            success: true,
            data: assignment,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la récupération de l'affectation", {
            ...auditData,
            action: "GET_ASSIGNMENT_BY_ID",
        });
    }
};
export const getProfessorAssignments = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { professorId } = req.params;
        const { academicYearId, semester } = req.query;
        if (!professorId) {
            await createAuditLog({
                ...auditData,
                action: "GET_PROFESSOR_ASSIGNMENTS_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de récupération des affectations du professeur - ID manquant",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "ID du professeur requis",
            });
        }
        // Vérifier si le professeur existe
        const professor = await prisma.professeur.findUnique({
            where: { id: professorId },
            select: { id: true, firstName: true, lastName: true },
        });
        if (!professor) {
            await createAuditLog({
                ...auditData,
                action: "GET_PROFESSOR_ASSIGNMENTS_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de récupération des affectations du professeur - professeur ${professorId} non trouvé`,
                status: "ERROR",
            });
            return res.status(404).json({
                success: false,
                error: "Professeur non trouvé",
                professorId,
            });
        }
        const where = { professeurId: professorId };
        if (academicYearId)
            where.academicYearId = academicYearId;
        if (semester) {
            if (["S1", "S2"].includes(semester)) {
                where.semester = semester;
            }
            else {
                await createAuditLog({
                    ...auditData,
                    action: "GET_PROFESSOR_ASSIGNMENTS_ATTEMPT",
                    entity: "CourseAssignment",
                    description: "Tentative de récupération des affectations du professeur - semestre invalide",
                    status: "ERROR",
                });
                return res.status(400).json({
                    success: false,
                    error: "Semestre invalide",
                    validSemesters: ["S1", "S2"],
                });
            }
        }
        const assignments = await prisma.courseAssignment.findMany({
            where,
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
                faculty: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                academicYear: {
                    select: {
                        id: true,
                        year: true,
                    },
                },
            },
            orderBy: [
                { academicYear: { year: "desc" } },
                { semester: "desc" },
                { faculty: { name: "asc" } },
            ],
        });
        // Statistiques
        const stats = {
            total: assignments.length,
            bySemester: {
                S1: assignments.filter((a) => a.semester === "S1").length,
                S2: assignments.filter((a) => a.semester === "S2").length,
            },
            byFaculty: assignments.reduce((acc, assignment) => {
                const facultyName = assignment.faculty.name;
                acc[facultyName] = (acc[facultyName] || 0) + 1;
                return acc;
            }, {}),
        };
        // Log de consultation réussie
        await createAuditLog({
            ...auditData,
            action: "GET_PROFESSOR_ASSIGNMENTS_SUCCESS",
            entity: "CourseAssignment",
            description: `Consultation des affectations du professeur ${professor.firstName} ${professor.lastName} - ${assignments.length} affectation(s) trouvée(s)`,
            status: "SUCCESS",
        });
        res.json({
            success: true,
            professor: {
                id: professor.id,
                firstName: professor.firstName,
                lastName: professor.lastName,
            },
            stats,
            count: assignments.length,
            data: assignments,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la récupération des affectations du professeur", {
            ...auditData,
            action: "GET_PROFESSOR_ASSIGNMENTS",
        });
    }
};
export const bulkCreateAssignments = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        const { assignments } = req.body;
        if (!Array.isArray(assignments) || assignments.length === 0) {
            await createAuditLog({
                ...auditData,
                action: "BULK_CREATE_ASSIGNMENTS_ATTEMPT",
                entity: "CourseAssignment",
                description: "Tentative de création en masse - données invalides",
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "Un tableau d'affectations est requis",
            });
        }
        // Limiter le nombre d'affectations par requête
        if (assignments.length > 50) {
            await createAuditLog({
                ...auditData,
                action: "BULK_CREATE_ASSIGNMENTS_ATTEMPT",
                entity: "CourseAssignment",
                description: `Tentative de création en masse - trop d'affectations (${assignments.length})`,
                status: "ERROR",
            });
            return res.status(400).json({
                success: false,
                error: "Trop d'affectations dans une seule requête (maximum 50)",
            });
        }
        const results = {
            success: [],
            errors: [],
        };
        // Traiter chaque affectation individuellement
        for (const [index, assignmentData] of assignments.entries()) {
            try {
                const validation = validateAssignmentInput(assignmentData);
                if (!validation.isValid) {
                    results.errors.push({
                        index,
                        error: "Données invalides",
                        details: validation.errors,
                        data: assignmentData,
                    });
                    continue;
                }
                // Vérifier l'existence des entités
                const [professor, ue, faculty, academicYear] = await Promise.all([
                    prisma.professeur.findUnique({
                        where: { id: assignmentData.professeurId },
                        select: { firstName: true, lastName: true },
                    }),
                    prisma.ue.findUnique({
                        where: { id: assignmentData.ueId },
                        select: { code: true, title: true },
                    }),
                    prisma.faculty.findUnique({
                        where: { id: assignmentData.facultyId },
                        select: { name: true },
                    }),
                    prisma.academicYear.findUnique({
                        where: { id: assignmentData.academicYearId },
                        select: { year: true },
                    }),
                ]);
                if (!professor) {
                    results.errors.push({
                        index,
                        error: "Professeur non trouvé",
                        professeurId: assignmentData.professeurId,
                    });
                    continue;
                }
                if (!ue) {
                    results.errors.push({
                        index,
                        error: "Cours non trouvée",
                        ueId: assignmentData.ueId,
                    });
                    continue;
                }
                if (!faculty) {
                    results.errors.push({
                        index,
                        error: "Faculté non trouvée",
                        facultyId: assignmentData.facultyId,
                    });
                    continue;
                }
                if (!academicYear) {
                    results.errors.push({
                        index,
                        error: "Année académique non trouvée",
                        academicYearId: assignmentData.academicYearId,
                    });
                    continue;
                }
                // Vérifier l'unicité
                const existingAssignment = await prisma.courseAssignment.findFirst({
                    where: {
                        ueId: assignmentData.ueId,
                        professeurId: assignmentData.professeurId,
                        facultyId: assignmentData.facultyId,
                        level: assignmentData.level,
                        academicYearId: assignmentData.academicYearId,
                        semester: assignmentData.semester,
                    },
                });
                if (existingAssignment) {
                    results.errors.push({
                        index,
                        error: "Affectation déjà existante",
                        existingAssignmentId: existingAssignment.id,
                    });
                    continue;
                }
                // Créer l'affectation
                const newAssignment = await prisma.courseAssignment.create({
                    data: assignmentData,
                });
                results.success.push({
                    index,
                    assignmentId: newAssignment.id,
                    ueId: newAssignment.ueId,
                    professeurId: newAssignment.professeurId,
                    details: `${professor.firstName} ${professor.lastName} - ${ue.code} (${faculty.name})`,
                });
            }
            catch (error) {
                results.errors.push({
                    index,
                    error: getErrorMessage(error),
                    data: assignmentData,
                });
            }
        }
        // Log de création en masse réussie
        await createAuditLog({
            ...auditData,
            action: "BULK_CREATE_ASSIGNMENTS_SUCCESS",
            entity: "CourseAssignment",
            description: `Création en masse d'affectations terminée - ${results.success.length} succès, ${results.errors.length} erreurs`,
            status: "SUCCESS",
        });
        res.status(201).json({
            success: true,
            message: `Traitement des affectations terminé`,
            summary: {
                total: assignments.length,
                success: results.success.length,
                errors: results.errors.length,
            },
            results,
        });
    }
    catch (error) {
        handleControllerError(error, res, "la création des affectations en masse", {
            ...auditData,
            action: "BULK_CREATE_ASSIGNMENTS",
        });
    }
};
//# sourceMappingURL=courseAssignmentControllers.js.map