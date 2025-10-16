import { Request, Response } from "express";
// import { PrismaClient, DocumentType } from "@prisma/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DocumentType } from "../../generated/prisma";
import prisma from "../prisma";

// const prisma = new PrismaClient();

// Configuration des couleurs pour les PDF
const COLORS = {
  PRIMARY: [52, 152, 219] as [number, number, number],
  SUCCESS: [46, 204, 113] as [number, number, number],
  DANGER: [231, 76, 60] as [number, number, number],
  DARK: [52, 73, 94] as [number, number, number],
  LIGHT_GRAY: [240, 240, 240] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number],
};

// Interface pour les options de génération
interface GeneratePDFOptions {
  documentType: DocumentType;
  student: any;
  academicYear: any;
  semester: string;
  level: string;
  grades?: any[];
  statistics?: any;
  language?: "fr" | "en";
  withSignature?: boolean;
  withStamp?: boolean;
}

// POST /api/documents/generate
export const generateDocument = async (req: Request, res: Response) => {
  try {
    const {
      type,
      studentId,
      academicYearId,
      semester = "all",
      level,
      language = "fr",
      withSignature = true,
      withStamp = true,
      includeAllGrades = false,
    } = req.body;

    // Validation des données requises
    if (!studentId || !academicYearId || !level) {
      return res.status(400).json({
        error:
          "Données manquantes: studentId, academicYearId et level sont requis",
      });
    }

    // Récupérer l'étudiant
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { academicYearId },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }

    // Récupérer l'année académique
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return res.status(404).json({ error: "Année académique non trouvée" });
    }

    // Récupérer les notes si nécessaire
    let grades: any[] = [];
    if (type === DocumentType.BULLETIN || type === DocumentType.RELEVE) {
      const whereClause: any = {
        studentId,
        academicYearId,
        isActive: true,
      };

      if (semester !== "all") {
        whereClause.semester = semester;
      }

      if (!includeAllGrades) {
        whereClause.OR = [{ status: "Validé" }, { status: "À_reprendre" }];
      }

      grades = await prisma.grade.findMany({
        where: whereClause,
        include: { ue: true },
        orderBy: [{ semester: "asc" }, { ue: { code: "asc" } }],
      });
    }

    // Calculer les statistiques
    const statistics = calculateStatistics(grades);

    // Générer le PDF
    const pdfBuffer = await generateDocumentPDF({
      documentType: type,
      student,
      academicYear,
      semester: semester === "all" ? "ANNUAL" : semester,
      level,
      grades,
      statistics,
      language,
      withSignature,
      withStamp,
    });

    // Générer le nom de fichier
    const fileName = generateFileName(type, student, academicYear, semester);

    // Créer le document dans la base
    const document = await prisma.transcript.create({
      data: {
        studentId,
        academicYearId,
        semester: semester === "all" ? "ANNUAL" : semester,
        level,
        documentType: type,
        gpa: statistics.gpa,
        totalCredits: statistics.totalCredits,
        creditsEarned: statistics.creditsEarned,
        successRate: statistics.successRate,
        fileName,
        pdfData: pdfBuffer,
        status: "GENERATED",
        language: language === "en" ? "EN" : "FR",
        metadata: {
          withSignature,
          withStamp,
          includeAllGrades,
          language,
          generatedAt: new Date().toISOString(),
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
      },
    });

    // Retourner sans les données PDF
    const { pdfData, ...responseData } = document;
    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error generating document:", error);
    res.status(500).json({ error: "Erreur lors de la génération du document" });
  }
};

// GET /api/documents/preview/:id
export const previewDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.transcript.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!document) {
      return res.status(404).json({ error: "Document non trouvé" });
    }

    if (!document.pdfData) {
      return res.status(404).json({ error: "Fichier PDF non disponible" });
    }

    // Headers pour la prévisualisation (affichage dans le navigateur)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.fileName}"`
    );
    res.setHeader("Content-Length", document.pdfData.length);

    res.send(document.pdfData);
  } catch (error) {
    console.error("Error previewing document:", error);
    res.status(500).json({ error: "Erreur lors de la prévisualisation" });
  }
};

// GET /api/documents/download/:id
export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.transcript.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!document) {
      return res.status(404).json({ error: "Document non trouvé" });
    }

    if (!document.pdfData) {
      return res.status(404).json({ error: "Fichier PDF non disponible" });
    }

    // Headers pour le téléchargement
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.fileName}"`
    );
    res.setHeader("Content-Length", document.pdfData.length);

    res.send(document.pdfData);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Erreur lors du téléchargement" });
  }
};

// GET /api/documents/student/:studentId
export const getStudentDocuments = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { type } = req.query;

    const where: any = { studentId };
    if (type) {
      where.documentType = type;
    }

    const documents = await prisma.transcript.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        academicYear: true,
      },
      orderBy: { generatedAt: "desc" },
    });

    // Retirer les données PDF pour alléger la réponse
    const documentsWithoutPdf = documents.map(
      ({ pdfData, ...doc }: { pdfData: any; [key: string]: any }) => doc
    );

    res.json(documentsWithoutPdf);
  } catch (error) {
    console.error("Error fetching student documents:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des documents" });
  }
};

// Fonction principale de génération PDF
async function generateDocumentPDF(
  options: GeneratePDFOptions
): Promise<Buffer> {
  const {
    documentType,
    student,
    academicYear,
    semester,
    level,
    grades = [],
    statistics = {},
    language = "fr",
    withSignature = true,
    withStamp = true,
  } = options;

  const doc = new jsPDF();
  const isEnglish = language === "en";

  // En-tête universitaire
  generateUniversityHeader(doc, isEnglish);

  // Contenu selon le type de document
  switch (documentType) {
    case DocumentType.BULLETIN:
      return generateBulletinPDF(doc, options);
    case DocumentType.RELEVE:
      return generateRelevePDF(doc, options);
    case DocumentType.ATTESTATION_NIVEAU:
      return generateAttestationNiveauPDF(doc, options);
    case DocumentType.ATTESTATION_FIN_ETUDES:
      return generateAttestationFinEtudesPDF(doc, options);
    case DocumentType.CERTIFICAT_SCOLARITE:
      return generateCertificatScolaritePDF(doc, options);
    default:
      return generateBulletinPDF(doc, options);
  }
}

// Fonctions de génération spécifiques
function generateBulletinPDF(doc: jsPDF, options: GeneratePDFOptions): Buffer {
  const {
    student,
    academicYear,
    semester,
    level,
    grades = [],
    statistics,
    language,
    withSignature,
    withStamp,
  } = options;
  const isEnglish = language === "en";

  // Titre
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text(
    isEnglish ? "OFFICIAL GRADE REPORT" : "BULLETIN DE NOTES OFFICIEL",
    105,
    50,
    { align: "center" }
  );

  // Informations étudiant
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.DARK);
  doc.text(
    `${isEnglish ? "Student" : "Étudiant"}: ${student.firstName} ${student.lastName}`,
    20,
    70
  );
  doc.text(`${isEnglish ? "ID" : "Matricule"}: ${student.studentId}`, 20, 80);
  doc.text(`${isEnglish ? "Level" : "Niveau"}: ${level}`, 20, 90);
  doc.text(
    `${isEnglish ? "Academic Year" : "Année académique"}: ${academicYear.year}`,
    20,
    100
  );

  let currentY = 120;

  // Tableau des notes
  if (grades.length > 0) {
    const tableData = grades.map((grade, index) => {
      const ue = grade.ue;
      const noteColor =
        grade.status === "Validé" ? COLORS.SUCCESS : COLORS.DANGER;

      return [
        (index + 1).toString(),
        ue.code,
        ue.title,
        ue.credits.toString(),
        {
          content: grade.grade.toFixed(2),
          styles: { textColor: noteColor as any, fontStyle: "bold" as any },
        },
        grade.status,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "#",
          isEnglish ? "Code" : "Code UE",
          isEnglish ? "Course" : "Matière",
          isEnglish ? "Credits" : "Crédits",
          isEnglish ? "Grade" : "Note",
          isEnglish ? "Status" : "Statut",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.PRIMARY,
        textColor: COLORS.WHITE,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { left: 15, right: 15 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Statistiques
  if (withSignature) {
    doc.setFontSize(10);
    doc.text(
      isEnglish ? "Done at Pignon on" : "Fait à Pignon le",
      20,
      currentY + 20
    );
    doc.text(
      new Date().toLocaleDateString(isEnglish ? "en-US" : "fr-FR"),
      20,
      currentY + 25
    );

    doc.text("_________________________", 150, currentY + 20);
    doc.text(
      isEnglish ? "Academic Director" : "Le Directeur des Études",
      150,
      currentY + 25
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function generateRelevePDF(doc: jsPDF, options: GeneratePDFOptions): Buffer {
  // Implémentation similaire mais plus synthétique
  // ... code pour le relevé de notes
  return Buffer.from(doc.output("arraybuffer"));
}

function generateAttestationNiveauPDF(
  doc: jsPDF,
  options: GeneratePDFOptions
): Buffer {
  const { student, academicYear, level, language } = options;
  const isEnglish = language === "en";

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text(
    isEnglish ? "CERTIFICATE OF LEVEL" : "ATTESTATION DE NIVEAU",
    105,
    50,
    { align: "center" }
  );

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.DARK);

  const texts = isEnglish
    ? [
        "This is to certify that:",
        `${student.firstName} ${student.lastName}`,
        `is duly registered in ${level}`,
        `for the academic year ${academicYear.year}.`,
      ]
    : [
        "Je soussigné, certifie que:",
        `${student.firstName} ${student.lastName}`,
        `est régulièrement inscrit(e) en ${level}`,
        `pour l'année académique ${academicYear.year}.`,
      ];

  texts.forEach((text, index) => {
    doc.text(text, 105, 80 + index * 15, { align: "center" });
  });

  return Buffer.from(doc.output("arraybuffer"));
}

// Les autres fonctions de génération (similaires)
function generateAttestationFinEtudesPDF(
  doc: jsPDF,
  options: GeneratePDFOptions
): Buffer {
  // Implémentation pour l'attestation de fin d'études
  return Buffer.from(doc.output("arraybuffer"));
}

function generateCertificatScolaritePDF(
  doc: jsPDF,
  options: GeneratePDFOptions
): Buffer {
  // Implémentation pour le certificat de scolarité
  return Buffer.from(doc.output("arraybuffer"));
}

// Fonctions utilitaires
function generateUniversityHeader(doc: jsPDF, isEnglish: boolean = false) {
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, 210, 40, "F");

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.WHITE);
  doc.setFont("helvetica", "bold");
  doc.text("UNIVERSITÉ JÉRUSALEM DE PIGNON D'HAÏTI", 105, 15, {
    align: "center",
  });
  doc.text("UJEPH", 105, 22, { align: "center" });

  doc.setFontSize(10);
  doc.text("83, Rue de l'Université Jérusalem, Pignon, Haïti", 105, 30, {
    align: "center",
  });
  doc.text(
    "E-mail : info@ujeph.edu.ht | Téls : +509 4289-9225 / 3620-3021",
    105,
    35,
    { align: "center" }
  );

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(10, 42, 200, 42);
}

function calculateStatistics(grades: any[]) {
  const validGrades = grades.filter((g) => g.status === "Validé");
  const gpa =
    validGrades.length > 0
      ? validGrades.reduce((sum, grade) => sum + grade.grade, 0) /
        validGrades.length
      : 0;

  const totalCredits = grades.reduce(
    (sum, grade) => sum + (grade.ue?.credits || 0),
    0
  );
  const creditsEarned = validGrades.reduce(
    (sum, grade) => sum + (grade.ue?.credits || 0),
    0
  );
  const successRate =
    totalCredits > 0 ? (creditsEarned / totalCredits) * 100 : 0;

  return { gpa, totalCredits, creditsEarned, successRate };
}

function generateFileName(
  type: DocumentType,
  student: any,
  academicYear: any,
  semester: string
): string {
  const typeMap = {
    [DocumentType.BULLETIN]: "bulletin",
    [DocumentType.RELEVE]: "releve",
    [DocumentType.ATTESTATION_NIVEAU]: "attestation-niveau",
    [DocumentType.ATTESTATION_FIN_ETUDES]: "attestation-fin-etudes",
    [DocumentType.CERTIFICAT_SCOLARITE]: "certificat-scolarite",
  };

  const baseName = `${typeMap[type]}-${student.lastName}-${student.firstName}-${academicYear.year}`;

  if (semester && semester !== "all" && semester !== "ANNUAL") {
    return `${baseName}-${semester}.pdf`;
  }

  return `${baseName}.pdf`;
}
