"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadImportTemplate = exports.deleteStudent = exports.getStudent = exports.getStudents = exports.updateStudentPhoto = exports.importStudents = exports.updateStudent = exports.createStudent = void 0;
// import { PrismaClient } from "@prisma/client";
const XLSX = __importStar(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const auditController_1 = require("./auditController");
// const prisma = new PrismaClient();
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
const getErrorName = (error) => {
    if (error instanceof Error) {
        return error.name;
    }
    else {
        return "UnknownError";
    }
};
// Schémas de validation avec Zod
const GuardianSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(2, "Le prénom doit contenir au moins 2 caractères")
        .max(100),
    lastName: zod_1.z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(100),
    relationship: zod_1.z.string().min(1, "La relation est requise").max(50),
    phone: zod_1.z
        .string()
        .min(8, "Le téléphone doit contenir au moins 8 caractères")
        .max(20),
    email: zod_1.z.string().email("Email invalide").optional().or(zod_1.z.literal("")),
    address: zod_1.z.string().max(500).optional(),
    isPrimary: zod_1.z.boolean().default(false),
});
const StudentCreateSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(2, "Le prénom doit contenir au moins 2 caractères")
        .max(100),
    lastName: zod_1.z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(100),
    studentId: zod_1.z.string().min(1, "L'ID étudiant est requis").max(50),
    email: zod_1.z.string().email("Email invalide").max(255),
    phone: zod_1.z.string().max(20).optional(),
    dateOfBirth: zod_1.z.string().datetime("Date de naissance invalide").optional(),
    placeOfBirth: zod_1.z.string().max(100).optional(),
    address: zod_1.z.string().max(500).optional(),
    bloodGroup: zod_1.z
        .enum([
        "A_POSITIVE",
        "A_NEGATIVE",
        "B_POSITIVE",
        "B_NEGATIVE",
        "AB_POSITIVE",
        "AB_NEGATIVE",
        "O_POSITIVE",
        "O_NEGATIVE",
    ])
        .optional(),
    allergies: zod_1.z.string().max(500).optional(),
    disabilities: zod_1.z.string().max(500).optional(),
    cin: zod_1.z.string().max(20).optional(),
    sexe: zod_1.z.enum(["Masculin", "Feminin", "Autre"]).optional(),
    status: zod_1.z
        .enum(["Active", "Inactive", "Graduated", "Suspended"])
        .default("Active"),
    guardians: zod_1.z.array(GuardianSchema).optional().default([]),
});
const StudentUpdateSchema = StudentCreateSchema.partial();
// Utilitaires de sécurité
const safeDeleteFile = async (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            await fs_1.default.promises.unlink(filePath);
        }
    }
    catch (error) {
        console.error(`Erreur suppression fichier ${filePath}:`, error);
    }
};
const validateUploadedFile = (file) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/json",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error("Type de fichier non autorisé");
    }
    if (file.size > maxSize) {
        throw new Error("Fichier trop volumineux (max 10MB)");
    }
};
// Middleware de validation - CORRIGÉ
const validateStudentData = (schema) => {
    return (req, res, next) => {
        try {
            let body = req.body;
            console.log(body);
            // Parser le body si c'est une string JSON
            if (typeof req.body === "string") {
                try {
                    body = JSON.parse(req.body);
                }
                catch (parseError) {
                    return res.status(400).json({
                        message: "Format de données invalide",
                    });
                }
            }
            // Valider les données - CORRECTION ICI
            const validatedData = schema.parse(body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                // CORRECTION : Utiliser error.issues au lieu de error.errors
                return res.status(400).json({
                    message: "Données de validation invalides",
                    errors: error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                });
            }
            next(error);
        }
    };
};
// Dans studentController.ts - CORRECTION
const createStudent = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    let fileCleanupRequired = false;
    try {
        // console.log("📥 Requête reçue - Body:", req.body);
        // console.log("📥 Fichier:", req.file);
        let body = req.body;
        // Gérer le format avec studentData
        if (body.studentData && typeof body.studentData === "string") {
            try {
                body = JSON.parse(body.studentData);
                console.log("📦 Données parsées depuis studentData:", body);
            }
            catch (parseError) {
                console.error("❌ Erreur parsing studentData:", parseError);
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "CREATE_STUDENT_ATTEMPT",
                    entity: "Student",
                    description: "Tentative de création d'étudiant - format de données invalide",
                    status: "ERROR",
                    errorMessage: "Format de données invalide",
                });
                return res.status(400).json({
                    message: "Format de données invalide",
                });
            }
        }
        const { firstName, lastName, studentId, email, phone, dateOfBirth, placeOfBirth, address, bloodGroup, allergies, disabilities, cin, sexe, status, guardians = [], } = body;
        console.log("🔍 Données extraites:", {
            firstName,
            lastName,
            studentId,
            email,
            guardians: guardians,
        });
        // Valider les données avec Zod
        try {
            StudentCreateSchema.parse(body);
        }
        catch (validationError) {
            if (validationError instanceof zod_1.z.ZodError) {
                console.error("❌ Erreur validation Zod:", validationError.issues);
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "CREATE_STUDENT_ATTEMPT",
                    entity: "Student",
                    description: "Tentative de création d'étudiant - validation des données échouée",
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
                    message: "Données de validation invalides",
                    errors: validationError.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                });
            }
            throw validationError;
        }
        // Marquer le fichier pour nettoyage si nécessaire
        if (req.file) {
            fileCleanupRequired = true;
            validateUploadedFile(req.file);
        }
        // Vérifier les doublons
        const existingStudent = await prisma_1.default.student.findUnique({
            where: { studentId },
        });
        const existingEmail = await prisma_1.default.student.findUnique({
            where: { email },
        });
        const existingCin = cin
            ? await prisma_1.default.student.findUnique({
                where: { cin },
            })
            : null;
        console.log("🔍 Vérification doublons:", {
            existingStudent: !!existingStudent,
            existingEmail: !!existingEmail,
            existingCin: !!existingCin,
        });
        if (existingStudent) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_STUDENT_ATTEMPT",
                entity: "Student",
                description: "Tentative de création d'étudiant - matricule déjà existant",
                status: "ERROR",
                metadata: { studentId },
            });
            throw new Error("Un étudiant avec ce matricule existe déjà");
        }
        if (existingEmail) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_STUDENT_ATTEMPT",
                entity: "Student",
                description: "Tentative de création d'étudiant - email déjà existant",
                status: "ERROR",
                metadata: { email },
            });
            throw new Error("Un étudiant avec cet email existe déjà");
        }
        if (existingCin) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "CREATE_STUDENT_ATTEMPT",
                entity: "Student",
                description: "Tentative de création d'étudiant - CIN déjà existant",
                status: "ERROR",
                metadata: { cin },
            });
            throw new Error("Un étudiant avec ce CIN existe déjà");
        }
        // CORRECTION : Préparer les données SANS photo d'abord
        const studentData = {
            firstName,
            lastName,
            studentId,
            email,
            phone: phone || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            placeOfBirth: placeOfBirth || null,
            address: address || null,
            bloodGroup: bloodGroup || null,
            allergies: allergies || null,
            disabilities: disabilities || null,
            cin: cin || null,
            sexe: sexe || null,
            status: status || "Active",
            updatedAt: new Date(),
        };
        // CORRECTION : Ajouter la photo seulement si elle existe
        if (req.file) {
            studentData.photo = `uploads/profiles/${req.file.filename}`;
        }
        console.log("📦 Données pour création étudiant:", studentData);
        // Créer l'étudiant avec transaction
        const student = await prisma_1.default.$transaction(async (tx) => {
            const newStudent = await tx.student.create({
                data: studentData,
            });
            console.log("✅ Étudiant créé:", newStudent.id);
            // Créer les gardiens
            if (guardians && guardians.length > 0) {
                console.log("👥 Création des gardiens:", guardians);
                const guardiansToCreate = guardians.map((guardian) => ({
                    firstName: guardian.firstName,
                    lastName: guardian.lastName,
                    relationship: guardian.relationship,
                    phone: guardian.phone,
                    email: guardian.email || null,
                    address: guardian.address || null,
                    isPrimary: guardian.isPrimary || false,
                    studentId: newStudent.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));
                await tx.guardian.createMany({
                    data: guardiansToCreate,
                });
                console.log("✅ Gardiens créés:", guardiansToCreate.length);
            }
            // Retourner l'étudiant complet
            return await tx.student.findUnique({
                where: { id: newStudent.id },
                include: { guardians: true },
            });
        });
        console.log("🎉 Création terminée:", student?.id);
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_STUDENT_SUCCESS",
            entity: "Student",
            entityId: student?.id,
            description: "Étudiant créé avec succès",
            status: "SUCCESS",
            metadata: {
                studentId: student?.studentId,
                email: student?.email,
                guardiansCount: guardians.length,
                hasPhoto: !!req.file,
            },
        });
        res.status(201).json({
            message: "Étudiant créé avec succès",
            student,
        });
        fileCleanupRequired = false;
    }
    catch (error) {
        console.error("❌ Erreur création étudiant:", error);
        // Nettoyer le fichier en cas d'erreur
        if (fileCleanupRequired && req.file?.path) {
            await safeDeleteFile(req.file.path);
        }
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "CREATE_STUDENT_ERROR",
            entity: "Student",
            description: "Erreur lors de la création de l'étudiant",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(400).json({
            message: errorMessage || "Erreur lors de la création",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.createStudent = createStudent;
// Dans studentController.ts - CORRECTION updateStudent
const updateStudent = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    let fileCleanupRequired = false;
    try {
        const { id } = req.params;
        console.log("📥 Requête mise à jour reçue - Body:", req.body);
        console.log("📥 Fichier:", req.file);
        console.log("📥 ID étudiant:", id);
        let body = req.body;
        // Gérer le format avec studentData
        if (body.studentData && typeof body.studentData === "string") {
            try {
                body = JSON.parse(body.studentData);
                console.log("📦 Données parsées depuis studentData:", body);
            }
            catch (parseError) {
                console.error("❌ Erreur parsing studentData:", parseError);
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_STUDENT_ATTEMPT",
                    entity: "Student",
                    entityId: id,
                    description: "Tentative de mise à jour d'étudiant - format de données invalide",
                    status: "ERROR",
                    errorMessage: "Format de données invalide",
                });
                return res.status(400).json({
                    message: "Format de données invalide",
                });
            }
        }
        const { firstName, lastName, studentId, email, phone, dateOfBirth, placeOfBirth, address, bloodGroup, allergies, disabilities, status, cin, sexe, guardians, } = body;
        console.log("🔍 Données extraites pour mise à jour:", {
            firstName,
            lastName,
            studentId,
            email,
            guardians: guardians,
        });
        // Valider les données avec Zod
        try {
            StudentUpdateSchema.parse(body);
        }
        catch (validationError) {
            if (validationError instanceof zod_1.z.ZodError) {
                console.error("❌ Erreur validation Zod:", validationError.issues);
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_STUDENT_ATTEMPT",
                    entity: "Student",
                    entityId: id,
                    description: "Tentative de mise à jour d'étudiant - validation des données échouée",
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
                    message: "Données de validation invalides",
                    errors: validationError.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                });
            }
            throw validationError;
        }
        // Vérifier si l'étudiant existe
        const existingStudent = await prisma_1.default.student.findUnique({
            where: { id },
            include: { guardians: true },
        });
        if (!existingStudent) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "UPDATE_STUDENT_ATTEMPT",
                entity: "Student",
                entityId: id,
                description: "Tentative de mise à jour d'étudiant - étudiant non trouvé",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "Étudiant non trouvé",
            });
        }
        // Vérifier les conflits
        if (studentId && studentId !== existingStudent.studentId) {
            const existingStudentId = await prisma_1.default.student.findUnique({
                where: { studentId },
            });
            if (existingStudentId) {
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_STUDENT_ATTEMPT",
                    entity: "Student",
                    entityId: id,
                    description: "Tentative de mise à jour d'étudiant - matricule déjà existant",
                    status: "ERROR",
                    metadata: { studentId },
                });
                throw new Error("Un étudiant avec ce matricule existe déjà");
            }
        }
        if (email && email !== existingStudent.email) {
            const existingEmail = await prisma_1.default.student.findUnique({
                where: { email },
            });
            if (existingEmail) {
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_STUDENT_ATTEMPT",
                    entity: "Student",
                    entityId: id,
                    description: "Tentative de mise à jour d'étudiant - email déjà existant",
                    status: "ERROR",
                    metadata: { email },
                });
                throw new Error("Un étudiant avec cet email existe déjà");
            }
        }
        if (cin && cin !== existingStudent.cin) {
            const existingCin = await prisma_1.default.student.findUnique({
                where: { cin },
            });
            if (existingCin) {
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "UPDATE_STUDENT_ATTEMPT",
                    entity: "Student",
                    entityId: id,
                    description: "Tentative de mise à jour d'étudiant - CIN déjà existant",
                    status: "ERROR",
                    metadata: { cin },
                });
                throw new Error("Un étudiant avec ce CIN existe déjà");
            }
        }
        // Marquer le fichier pour nettoyage si nécessaire
        if (req.file) {
            fileCleanupRequired = true;
            validateUploadedFile(req.file);
        }
        // Gestion de la photo
        let photoPath = existingStudent.photo;
        if (req.file) {
            // Supprimer l'ancienne photo si elle existe
            if (existingStudent.photo) {
                const oldPhotoPath = path_1.default.join(__dirname, "..", "..", existingStudent.photo);
                await safeDeleteFile(oldPhotoPath);
            }
            photoPath = `/uploads/profiles/${req.file.filename}`;
        }
        // Gestion de la date de naissance
        let dobDate = existingStudent.dateOfBirth;
        if (dateOfBirth) {
            dobDate = new Date(dateOfBirth);
            if (isNaN(dobDate.getTime())) {
                dobDate = existingStudent.dateOfBirth;
            }
        }
        // Préparer les données de mise à jour
        const updateData = {
            firstName: firstName ?? existingStudent.firstName,
            lastName: lastName ?? existingStudent.lastName,
            studentId: studentId ?? existingStudent.studentId,
            email: email ?? existingStudent.email,
            phone: phone ?? existingStudent.phone,
            dateOfBirth: dobDate,
            placeOfBirth: placeOfBirth ?? existingStudent.placeOfBirth,
            address: address ?? existingStudent.address,
            bloodGroup: bloodGroup ?? existingStudent.bloodGroup,
            allergies: allergies ?? existingStudent.allergies,
            disabilities: disabilities ?? existingStudent.disabilities,
            cin: cin ?? existingStudent.cin,
            sexe: sexe ?? existingStudent.sexe,
            status: status ?? existingStudent.status,
            photo: photoPath,
        };
        console.log("📦 Données pour mise à jour étudiant:", updateData);
        // Mise à jour en transaction
        const student = await prisma_1.default.$transaction(async (tx) => {
            // Mettre à jour l'étudiant
            const updatedStudent = await tx.student.update({
                where: { id },
                data: updateData,
            });
            console.log("✅ Étudiant mis à jour:", updatedStudent.id);
            // Gestion des gardiens si fournis
            if (guardians && Array.isArray(guardians)) {
                console.log("👥 Mise à jour des gardiens:", guardians);
                // Supprimer les anciens gardiens
                await tx.guardian.deleteMany({
                    where: { studentId: id },
                });
                // Créer les nouveaux gardiens
                if (guardians.length > 0) {
                    await tx.guardian.createMany({
                        data: guardians.map((guardian) => ({
                            firstName: guardian.firstName,
                            lastName: guardian.lastName,
                            relationship: guardian.relationship,
                            phone: guardian.phone,
                            email: guardian.email || null,
                            address: guardian.address || null,
                            isPrimary: guardian.isPrimary || false,
                            studentId: id,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })),
                    });
                }
            }
            // Retourner l'étudiant mis à jour avec ses gardiens
            return await tx.student.findUnique({
                where: { id },
                include: { guardians: true },
            });
        });
        console.log("🎉 Mise à jour terminée:", student?.id);
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_STUDENT_SUCCESS",
            entity: "Student",
            entityId: student?.id,
            description: "Étudiant mis à jour avec succès",
            status: "SUCCESS",
            metadata: {
                studentId: student?.studentId,
                updatedFields: Object.keys(updateData),
                guardiansUpdated: !!guardians,
                photoUpdated: !!req.file,
            },
        });
        res.json({
            message: "Étudiant mis à jour avec succès",
            student,
        });
        fileCleanupRequired = false;
    }
    catch (error) {
        console.error("❌ Erreur modification étudiant:", error);
        // Nettoyer le fichier en cas d'erreur
        if (fileCleanupRequired && req.file?.path) {
            await safeDeleteFile(req.file.path);
        }
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_STUDENT_ERROR",
            entity: "Student",
            entityId: req.params.id,
            description: "Erreur lors de la mise à jour de l'étudiant",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(400).json({
            message: errorMessage || "Erreur lors de la modification",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.updateStudent = updateStudent;
const importStudents = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    if (!req.file) {
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "IMPORT_STUDENTS_ATTEMPT",
            entity: "Student",
            description: "Tentative d'importation d'étudiants - aucun fichier fourni",
            status: "ERROR",
        });
        return res.status(400).json({
            message: "Aucun fichier fourni",
        });
    }
    try {
        validateUploadedFile(req.file);
        const filePath = req.file.path;
        let studentsData = [];
        // Log de début d'importation
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "IMPORT_STUDENTS_START",
            entity: "Student",
            description: "Début de l'importation des étudiants",
            status: "SUCCESS",
            metadata: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
            },
        });
        // Lire le fichier (votre code existant)
        if (req.file.mimetype.includes("excel") ||
            req.file.mimetype.includes("spreadsheet") ||
            req.file.originalname.match(/\.(xlsx|xls)$/i)) {
            const workbook = XLSX.readFile(filePath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            studentsData = XLSX.utils.sheet_to_json(worksheet);
        }
        else if (req.file.mimetype.includes("json") ||
            req.file.originalname.match(/\.json$/i)) {
            const fileContent = await fs_1.default.promises.readFile(filePath, "utf-8");
            studentsData = JSON.parse(fileContent);
        }
        else {
            await safeDeleteFile(filePath);
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "IMPORT_STUDENTS_ERROR",
                entity: "Student",
                description: "Format de fichier non supporté pour l'importation",
                status: "ERROR",
                metadata: { mimeType: req.file.mimetype },
            });
            return res.status(400).json({
                message: "Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou JSON",
            });
        }
        console.log("📊 Données importées:", studentsData.length, "étudiants");
        const results = {
            success: 0,
            errors: 0,
            details: [],
        };
        // Traiter chaque étudiant
        for (const [index, studentData] of studentsData.entries()) {
            try {
                // Validation des données obligatoires
                if (!studentData.firstName ||
                    !studentData.lastName ||
                    !studentData.studentId ||
                    !studentData.email ||
                    !studentData.guardianFirstName ||
                    !studentData.guardianLastName ||
                    !studentData.guardianRelationship ||
                    !studentData.guardianPhone) {
                    throw new Error("Données obligatoires manquantes");
                }
                // Vérifier les doublons
                const [existingStudent, existingEmail] = await Promise.all([
                    prisma_1.default.student.findUnique({
                        where: { studentId: studentData.studentId },
                    }),
                    prisma_1.default.student.findUnique({ where: { email: studentData.email } }),
                ]);
                if (existingStudent) {
                    throw new Error("Matricule déjà existant");
                }
                if (existingEmail) {
                    throw new Error("Email déjà existant");
                }
                // CORRECTION : Appliquer la même logique que createStudent
                const studentCreateData = {
                    firstName: studentData.firstName,
                    lastName: studentData.lastName,
                    studentId: studentData.studentId,
                    email: studentData.email,
                    phone: studentData.phone || null,
                    dateOfBirth: studentData.dateOfBirth
                        ? new Date(studentData.dateOfBirth)
                        : null,
                    placeOfBirth: studentData.placeOfBirth || null,
                    address: studentData.address || null,
                    bloodGroup: studentData.bloodGroup || null,
                    allergies: studentData.allergies || null,
                    disabilities: studentData.disabilities || null,
                    status: studentData.status || "Active",
                    cin: studentData.cin || null,
                    sexe: studentData.sexe || null,
                    updatedAt: new Date(),
                };
                console.log(`📦 Import étudiant ${index + 1}:`, studentCreateData.firstName, studentCreateData.lastName);
                // CORRECTION : Utiliser la même transaction que createStudent
                await prisma_1.default.$transaction(async (tx) => {
                    // 1. Créer l'étudiant
                    const newStudent = await tx.student.create({
                        data: studentCreateData,
                    });
                    console.log("✅ Étudiant importé créé:", newStudent.id);
                    // 2. Créer le gardien (même logique que createStudent)
                    const guardianData = {
                        firstName: studentData.guardianFirstName,
                        lastName: studentData.guardianLastName,
                        relationship: studentData.guardianRelationship,
                        phone: studentData.guardianPhone,
                        email: studentData.guardianEmail || null,
                        address: studentData.guardianAddress || null,
                        isPrimary: true,
                        studentId: newStudent.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    await tx.guardian.create({
                        data: guardianData,
                    });
                    console.log("✅ Gardien importé créé pour:", newStudent.id);
                });
                results.success++;
                results.details.push({
                    index: index + 1,
                    studentId: studentData.studentId,
                    status: "success",
                    message: "Étudiant créé avec succès",
                });
            }
            catch (error) {
                const errorMessage = getErrorMessage(error);
                console.error(`❌ Erreur ligne ${index + 1}:`, errorMessage);
                results.errors++;
                results.details.push({
                    index: index + 1,
                    studentId: studentData.studentId,
                    status: "error",
                    message: errorMessage,
                    data: studentData,
                });
            }
        }
        // Supprimer le fichier après traitement
        await safeDeleteFile(filePath);
        console.log("🎉 Import terminé:", results.success, "succès,", results.errors, "erreurs");
        // Log de fin d'importation
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "IMPORT_STUDENTS_COMPLETE",
            entity: "Student",
            description: "Importation des étudiants terminée",
            status: "SUCCESS",
            metadata: {
                total: studentsData.length,
                success: results.success,
                errors: results.errors,
                successRate: `${((results.success / studentsData.length) * 100).toFixed(2)}%`,
            },
        });
        res.json({
            message: `Import terminé: ${results.success} succès, ${results.errors} erreurs`,
            summary: {
                total: studentsData.length,
                success: results.success,
                errors: results.errors,
            },
            results: results.details,
        });
    }
    catch (error) {
        console.error("❌ Erreur import étudiants:", error);
        // Nettoyer le fichier en cas d'erreur
        if (req.file?.path) {
            await safeDeleteFile(req.file.path);
        }
        const errorMessage = getErrorMessage(error);
        // Log d'erreur d'importation
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "IMPORT_STUDENTS_ERROR",
            entity: "Student",
            description: "Erreur lors de l'importation des étudiants",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            message: "Erreur lors de l'importation: " + errorMessage,
        });
    }
};
exports.importStudents = importStudents;
const updateStudentPhoto = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        if (!req.file) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "UPDATE_STUDENT_PHOTO_ATTEMPT",
                entity: "Student",
                entityId: id,
                description: "Tentative de mise à jour de photo - aucune photo fournie",
                status: "ERROR",
            });
            return res.status(400).json({
                message: "Aucune photo fournie",
            });
        }
        validateUploadedFile(req.file);
        // Vérifier si l'étudiant existe
        const student = await prisma_1.default.student.findUnique({
            where: { id },
        });
        if (!student) {
            await safeDeleteFile(req.file.path);
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "UPDATE_STUDENT_PHOTO_ATTEMPT",
                entity: "Student",
                entityId: id,
                description: "Tentative de mise à jour de photo - étudiant non trouvé",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "Étudiant non trouvé",
            });
        }
        // Supprimer l'ancienne photo si elle existe
        if (student.photo) {
            const oldPhotoPath = path_1.default.join(__dirname, "..", "..", student.photo);
            await safeDeleteFile(oldPhotoPath);
        }
        // Mettre à jour la photo
        const photoPath = `/uploads/profiles/${req.file.filename}`;
        const updatedStudent = await prisma_1.default.student.update({
            where: { id },
            data: { photo: photoPath },
        });
        // Log de succès
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_STUDENT_PHOTO_SUCCESS",
            entity: "Student",
            entityId: id,
            description: "Photo de l'étudiant mise à jour avec succès",
            status: "SUCCESS",
            metadata: {
                studentId: student.studentId,
                oldPhoto: student.photo ? "supprimée" : "aucune",
                newPhoto: photoPath,
            },
        });
        res.json({
            message: "Photo mise à jour avec succès",
            student: updatedStudent,
        });
    }
    catch (error) {
        console.error("Erreur mise à jour photo:", error);
        // Nettoyer le fichier en cas d'erreur
        if (req.file?.path) {
            await safeDeleteFile(req.file.path);
        }
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "UPDATE_STUDENT_PHOTO_ERROR",
            entity: "Student",
            entityId: req.params.id,
            description: "Erreur lors de la mise à jour de la photo de l'étudiant",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            message: "Erreur lors de la mise à jour de la photo",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.updateStudentPhoto = updateStudentPhoto;
const getStudents = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user.id || "unknown",
    };
    try {
        const user = req.user;
        const facultyId = req.facultyId;
        let whereCondition = {};
        // Si c'est un doyen, limiter aux étudiants de sa faculté
        if (user?.role === "Doyen" && facultyId) {
            whereCondition = {
                enrollments: {
                    some: {
                        facultyId: facultyId,
                        status: "Active",
                    },
                },
            };
        }
        const students = await prisma_1.default.student.findMany({
            where: whereCondition,
            include: {
                guardians: true,
                enrollments: {
                    where: user?.role === "Doyen" ? { facultyId: facultyId } : undefined,
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        academicYear: true,
                    },
                },
                grades: {
                    include: {
                        ue: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        // Log de consultation
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_STUDENTS_LIST",
            entity: "Student",
            description: "Consultation de la liste des étudiants",
            status: "SUCCESS",
            metadata: {
                count: students.length,
                userRole: user?.role,
                facultyFilter: facultyId || "none",
            },
        });
        res.json(students);
    }
    catch (error) {
        console.error("Erreur récupération étudiants:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_STUDENTS_LIST_ERROR",
            entity: "Student",
            description: "Erreur lors de la récupération de la liste des étudiants",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            message: "Erreur lors de la récupération des étudiants",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.getStudents = getStudents;
const getStudent = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        const user = req.user;
        const facultyId = req.facultyId;
        // Vérifier l'accès pour les doyens
        if (user?.role === "Doyen") {
            const enrollment = await prisma_1.default.enrollment.findFirst({
                where: {
                    studentId: id,
                    facultyId: facultyId,
                    status: "Active",
                },
            });
            if (!enrollment) {
                await (0, auditController_1.createAuditLog)({
                    ...auditData,
                    action: "GET_STUDENT_DETAILS_ATTEMPT",
                    entity: "Student",
                    entityId: id,
                    description: "Tentative d'accès non autorisé aux détails d'un étudiant",
                    status: "ERROR",
                    metadata: {
                        userRole: user?.role,
                        facultyId: facultyId,
                    },
                });
                return res.status(403).json({
                    message: "Accès non autorisé à cet étudiant",
                });
            }
        }
        const student = await prisma_1.default.student.findUnique({
            where: { id },
            include: {
                guardians: true,
                enrollments: {
                    include: {
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                dean: true,
                            },
                        },
                        academicYear: true,
                    },
                },
                grades: {
                    include: {
                        ue: true,
                    },
                },
            },
        });
        if (!student) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "GET_STUDENT_DETAILS_ATTEMPT",
                entity: "Student",
                entityId: id,
                description: "Tentative de consultation d'étudiant - non trouvé",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "Étudiant non trouvé",
            });
        }
        // Log de consultation réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_STUDENT_DETAILS_SUCCESS",
            entity: "Student",
            entityId: id,
            description: "Consultation des détails de l'étudiant",
            status: "SUCCESS",
            metadata: {
                studentId: student.studentId,
                hasGuardians: student.guardians.length > 0,
                hasEnrollments: student.enrollments.length > 0,
            },
        });
        res.json(student);
    }
    catch (error) {
        console.error("Erreur récupération étudiant:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "GET_STUDENT_DETAILS_ERROR",
            entity: "Student",
            entityId: req.params.id,
            description: "Erreur lors de la récupération des détails de l'étudiant",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            message: "Erreur lors de la récupération de l'étudiant",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.getStudent = getStudent;
const deleteStudent = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const { id } = req.params;
        // Vérifier d'abord si l'étudiant existe
        const student = await prisma_1.default.student.findUnique({
            where: { id },
            include: {
                guardians: true,
                enrollments: true,
                grades: true,
            },
        });
        if (!student) {
            await (0, auditController_1.createAuditLog)({
                ...auditData,
                action: "DELETE_STUDENT_ATTEMPT",
                entity: "Student",
                entityId: id,
                description: "Tentative de suppression d'étudiant - non trouvé",
                status: "ERROR",
            });
            return res.status(404).json({
                message: "Étudiant non trouvé",
            });
        }
        // CORRECTION : Transaction simplifiée pour la suppression
        await prisma_1.default.$transaction(async (tx) => {
            // Supprimer les données liées dans l'ordre
            if (student.grades && student.grades.length > 0) {
                await tx.grade.deleteMany({
                    where: { studentId: id },
                });
            }
            if (student.enrollments && student.enrollments.length > 0) {
                await tx.enrollment.deleteMany({
                    where: { studentId: id },
                });
            }
            if (student.guardians && student.guardians.length > 0) {
                await tx.guardian.deleteMany({
                    where: { studentId: id },
                });
            }
            // Supprimer l'étudiant
            await tx.student.delete({
                where: { id },
            });
        });
        // Supprimer la photo si elle existe
        if (student.photo) {
            const photoPath = path_1.default.join(__dirname, "..", "..", student.photo);
            await safeDeleteFile(photoPath);
        }
        // Log de suppression réussie
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_STUDENT_SUCCESS",
            entity: "Student",
            entityId: id,
            description: "Étudiant supprimé avec succès",
            status: "SUCCESS",
            metadata: {
                studentId: student.studentId,
                deletedGuardians: student.guardians.length,
                deletedEnrollments: student.enrollments.length,
                deletedGrades: student.grades.length,
                photoDeleted: !!student.photo,
            },
        });
        res.json({
            message: "Étudiant supprimé avec succès",
        });
    }
    catch (error) {
        console.error("Erreur suppression étudiant:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur de suppression
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DELETE_STUDENT_ERROR",
            entity: "Student",
            entityId: req.params.id,
            description: "Erreur lors de la suppression de l'étudiant",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            message: "Erreur lors de la suppression de l'étudiant",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.deleteStudent = deleteStudent;
const downloadImportTemplate = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.userId || "unknown",
    };
    try {
        const templateData = [
            {
                firstName: "Jean",
                lastName: "Dupont",
                studentId: "STU20240001",
                email: "jean.dupont@example.com",
                phone: "1234567890",
                dateOfBirth: "2000-01-01",
                placeOfBirth: "Port-au-Prince",
                address: "123 Rue Principale",
                bloodGroup: "O_POSITIVE",
                allergies: "Aucune",
                disabilities: "Aucune",
                cin: "1234567890123",
                sexe: "Masculin",
                status: "Active",
                guardianFirstName: "Marie",
                guardianLastName: "Dupont",
                guardianRelationship: "Mère",
                guardianPhone: "0987654321",
                guardianEmail: "marie.dupont@example.com",
                guardianAddress: "123 Rue Principale",
            },
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Étudiants");
        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=template-import-etudiants.xlsx");
        // Log de téléchargement du template
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DOWNLOAD_IMPORT_TEMPLATE",
            entity: "Student",
            description: "Téléchargement du template d'importation d'étudiants",
            status: "SUCCESS",
        });
        res.send(buffer);
    }
    catch (error) {
        console.error("Erreur génération template:", error);
        const errorMessage = getErrorMessage(error);
        // Log d'erreur
        await (0, auditController_1.createAuditLog)({
            ...auditData,
            action: "DOWNLOAD_IMPORT_TEMPLATE_ERROR",
            entity: "Student",
            description: "Erreur lors de la génération du template d'importation",
            status: "ERROR",
            errorMessage: errorMessage,
        });
        res.status(500).json({
            message: "Erreur lors de la génération du template",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
};
exports.downloadImportTemplate = downloadImportTemplate;
