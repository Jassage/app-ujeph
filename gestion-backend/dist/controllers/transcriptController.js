"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadTranscript = exports.deleteTranscript = exports.updateTranscript = exports.createTranscript = exports.getTranscriptById = exports.getAllTranscripts = void 0;
const jspdf_1 = __importDefault(require("jspdf"));
const pdfGenerators_1 = require("./pdfGenerators");
const prisma_1 = __importDefault(require("../prisma"));
function generateFileName(type, student, academicYear, semester) {
    const baseName = `${type.toLowerCase()}-${student.lastName}-${student.firstName}-${academicYear.year}`;
    if (semester && semester !== "all" && semester !== "ANNUAL") {
        return `${baseName}-${semester}.pdf`;
    }
    return `${baseName}.pdf`;
}
// GET /api/transcripts
const getAllTranscripts = async (req, res) => {
    try {
        const { studentId, academicYearId, semester, page = 1, limit = 10, } = req.query;
        const where = {};
        if (studentId)
            where.studentId = studentId;
        if (academicYearId)
            where.academicYearId = academicYearId;
        if (semester)
            where.semester = semester;
        const skip = (Number(page) - 1) * Number(limit);
        const [transcripts, total] = await Promise.all([
            prisma_1.default.transcript.findMany({
                where,
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            studentId: true,
                            email: true,
                        },
                    },
                    academicYear: true,
                    transcriptGrades: {
                        include: {
                            grade: {
                                include: {
                                    ue: true,
                                },
                            },
                        },
                        orderBy: { order: "asc" },
                    },
                },
                orderBy: { generatedAt: "desc" },
                skip,
                take: Number(limit),
            }),
            prisma_1.default.transcript.count({ where }),
        ]);
        res.json({
            transcripts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("Error fetching transcripts:", error);
        res
            .status(500)
            .json({ error: "Erreur serveur lors de la récupération des relevés" });
    }
};
exports.getAllTranscripts = getAllTranscripts;
// GET /api/transcripts/:id
const getTranscriptById = async (req, res) => {
    try {
        const { id } = req.params;
        const transcript = await prisma_1.default.transcript.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        studentId: true,
                        email: true,
                        phone: true,
                        dateOfBirth: true,
                        placeOfBirth: true,
                        address: true,
                        cin: true,
                        sexe: true,
                    },
                },
                academicYear: true,
                transcriptGrades: {
                    include: {
                        grade: {
                            include: {
                                ue: true,
                            },
                        },
                    },
                    orderBy: { order: "asc" },
                },
            },
        });
        if (!transcript) {
            return res.status(404).json({ error: "Relevé non trouvé" });
        }
        res.json(transcript);
    }
    catch (error) {
        console.error("Error fetching transcript:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getTranscriptById = getTranscriptById;
// POST /api/transcripts
// backend/controllers/transcriptController.ts
const createTranscript = async (req, res) => {
    try {
        const { studentId, academicYearId, semester, level, grades, statistics, documentType = "BULLETIN", language = "fr", withSignature = true, withStamp = true, } = req.body;
        // Validation des données requises
        if (!studentId || !academicYearId || !semester || !level) {
            return res.status(400).json({
                error: "Données manquantes: studentId, academicYearId, semester et level sont requis",
            });
        }
        // Vérifier que l'étudiant existe
        const student = await prisma_1.default.student.findUnique({
            where: { id: studentId },
            include: { enrollments: true },
        });
        if (!student) {
            return res.status(404).json({ error: "Étudiant non trouvé" });
        }
        // Vérifier que l'année académique existe
        const academicYear = await prisma_1.default.academicYear.findUnique({
            where: { id: academicYearId },
        });
        if (!academicYear) {
            return res.status(404).json({ error: "Année académique non trouvée" });
        }
        // Vérifier les notes
        const gradeRecords = await prisma_1.default.grade.findMany({
            where: {
                id: { in: grades },
                studentId,
                academicYearId,
                semester: semester === "all" ? undefined : semester,
            },
            include: { ue: true },
        });
        if (gradeRecords.length === 0) {
            return res.status(400).json({
                error: "Aucune note valide trouvée pour les critères sélectionnés",
            });
        }
        // Conversion explicite des types
        const signatureOption = Boolean(withSignature);
        const stampOption = Boolean(withStamp);
        const languageOption = language === "EN" ? "FR" : "FR"; // S'assurer que c'est 'fr' ou 'en'
        // Générer le PDF
        const pdfBuffer = await generateDocumentPDF({
            documentType,
            student,
            academicYear,
            semester: semester === "all" ? "ANNUAL" : semester,
            level,
            grades: gradeRecords,
            statistics,
            language: languageOption,
            withSignature: signatureOption,
            withStamp: stampOption,
        });
        // Générer le nom de fichier
        const fileName = generateFileName(documentType, student, academicYear, semester);
        // Créer le relevé dans la base de données - CORRECTION ICI
        const newTranscript = await prisma_1.default.transcript.create({
            data: {
                studentId,
                academicYearId,
                semester: semester === "all" ? "ANNUAL" : semester,
                level,
                documentType: documentType, // Conversion pour Prisma
                gpa: statistics.gpa || 0,
                totalCredits: statistics.totalCredits || 0,
                creditsEarned: statistics.creditsEarned || 0,
                successRate: statistics.successRate || 0,
                fileName,
                pdfData: pdfBuffer,
                status: "GENERATED",
                language: languageOption, // Conversion pour l'enum Prisma
                // Ajouter les champs manquants
                metadata: {
                    withSignature: signatureOption,
                    withStamp: stampOption,
                    includeAllGrades: req.body.includeAllGrades || false,
                    generatedAt: new Date().toISOString(),
                },
                // Créer les transcriptGrades
                transcriptGrades: {
                    create: gradeRecords.map((grade, index) => ({
                        gradeId: grade.id,
                        order: index,
                    })),
                },
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        studentId: true,
                        email: true,
                    },
                },
                academicYear: true,
                transcriptGrades: {
                    include: {
                        grade: {
                            include: {
                                ue: true,
                            },
                        },
                    },
                },
            },
        });
        // Retourner sans les données PDF
        const { pdfData, ...responseData } = newTranscript;
        res.status(201).json(responseData);
    }
    catch (error) {
        console.error("Error creating transcript:", error);
        res.status(400).json({ error: "Erreur lors de la création du relevé" });
    }
};
exports.createTranscript = createTranscript;
// PUT /api/transcripts/:id
const updateTranscript = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedTranscript = await prisma_1.default.transcript.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                student: true,
                academicYear: true,
                transcriptGrades: {
                    include: {
                        grade: {
                            include: {
                                ue: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(updatedTranscript);
    }
    catch (error) {
        console.error("Error updating transcript:", error);
        res.status(400).json({ error: "Erreur lors de la mise à jour du relevé" });
    }
};
exports.updateTranscript = updateTranscript;
// DELETE /api/transcripts/:id
const deleteTranscript = async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier que le relevé existe
        const transcript = await prisma_1.default.transcript.findUnique({
            where: { id },
        });
        if (!transcript) {
            return res.status(404).json({ error: "Relevé non trouvé" });
        }
        // Supprimer d'abord les transcriptGrades associées
        await prisma_1.default.transcriptGrade.deleteMany({
            where: { transcriptId: id },
        });
        // Puis supprimer le relevé
        await prisma_1.default.transcript.delete({
            where: { id },
        });
        res.json({
            message: "Relevé supprimé avec succès",
            deletedTranscript: transcript,
        });
    }
    catch (error) {
        console.error("Error deleting transcript:", error);
        res.status(400).json({ error: "Erreur lors de la suppression du relevé" });
    }
};
exports.deleteTranscript = deleteTranscript;
// GET /api/transcripts/:id/download
const downloadTranscript = async (req, res) => {
    try {
        const { id } = req.params;
        const transcript = await prisma_1.default.transcript.findUnique({
            where: { id },
            include: {
                student: true,
                academicYear: true,
                transcriptGrades: {
                    include: {
                        grade: {
                            include: {
                                ue: true,
                            },
                        },
                    },
                },
            },
        });
        if (!transcript) {
            return res.status(404).json({ error: "Relevé non trouvé" });
        }
        if (!transcript.pdfData) {
            // Regénérer le PDF si les données ne sont pas stockées
            const grades = await prisma_1.default.grade.findMany({
                where: {
                    id: {
                        in: transcript.transcriptGrades.map((tg) => tg.gradeId),
                    },
                },
                include: { ue: true },
            });
            const pdfBuffer = await generateDocumentPDF({
                documentType: transcript.documentType,
                student: transcript.student,
                academicYear: transcript.academicYear,
                semester: transcript.semester,
                level: transcript.level,
                grades,
                language: transcript.language,
                statistics: {
                    gpa: transcript.gpa,
                    totalCredits: transcript.totalCredits,
                    creditsEarned: transcript.creditsEarned,
                },
                withSignature: false,
                withStamp: false,
            });
            // Mettre à jour le transcript avec les nouvelles données PDF
            await prisma_1.default.transcript.update({
                where: { id },
                data: { pdfData: pdfBuffer },
            });
            transcript.pdfData = pdfBuffer;
        }
        // Configurer les headers pour le téléchargement
        const fileName = `${transcript.documentType.toLowerCase()}-${transcript.student.lastName}-${transcript.student.firstName}-${transcript.academicYear.year}-${transcript.semester}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Length", transcript.pdfData.length);
        // Envoyer le PDF
        res.send(transcript.pdfData);
    }
    catch (error) {
        console.error("Error downloading transcript:", error);
        res.status(500).json({ error: "Erreur lors du téléchargement du PDF" });
    }
};
exports.downloadTranscript = downloadTranscript;
async function generateDocumentPDF(options) {
    const { documentType, student, academicYear, semester, level, grades, statistics, language, withSignature, withStamp, } = options;
    const doc = new jspdf_1.default();
    // Configuration commune
    const primaryColor = [52, 152, 219];
    const textColor = [0, 0, 0];
    const redColor = [231, 76, 60];
    const greenColor = [46, 204, 113];
    const grayColor = [240, 240, 240];
    // En-tête universitaire (commun à tous les documents)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, "F");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("UNIVERSITÉ JÉRUSALEM DE PIGNON D'HAÏTI", 105, 15, {
        align: "center",
    });
    doc.setFontSize(14);
    doc.text("UJEPH", 105, 22, { align: "center" });
    doc.setFontSize(10);
    doc.text("83, Rue de l'Université Jérusalem, Pignon, Haïti", 105, 28, {
        align: "center",
    });
    doc.text("E-mail : info@ujeph.edu.ht | Téls : +509 4289-9225 / 3620-3021", 105, 32, { align: "center" });
    // Barre de séparation
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(10, 36, 200, 36);
    // Contenu spécifique au type de document
    switch (documentType) {
        case "BULLETIN":
            return generateBulletinPDF(doc, options);
        case "RELEVE":
            return (0, pdfGenerators_1.generateRelevePDF)(doc, options);
        case "ATTESTATION_NIVEAU":
            return (0, pdfGenerators_1.generateAttestationNiveauPDF)(doc, options);
        case "ATTESTATION_FIN_ETUDES":
            return (0, pdfGenerators_1.generateAttestationFinEtudesPDF)(doc, options);
        case "CERTIFICAT_SCOLARITE":
            return (0, pdfGenerators_1.generateCertificatScolaritePDF)(doc, options);
        default:
            return generateBulletinPDF(doc, options);
    }
}
// Implémentations spécifiques pour chaque type de document...
function generateBulletinPDF(doc, options) {
    const { student, academicYear, semester, level, grades, statistics } = options;
    // Titre du document
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("BULLETIN DE NOTES OFFICIEL", 105, 45, { align: "center" });
    // ... implémentation détaillée du bulletin (reprenant votre logique existante)
    return Buffer.from(doc.output("arraybuffer"));
}
// ... autres fonctions de génération (releve, attestations, etc.)
