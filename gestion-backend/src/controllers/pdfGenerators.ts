// backend/controllers/pdfGenerators.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Configuration des couleurs
const COLORS = {
  PRIMARY: [52, 152, 219] as [number, number, number],
  SUCCESS: [46, 204, 113] as [number, number, number],
  DANGER: [231, 76, 60] as [number, number, number],
  WARNING: [241, 196, 15] as [number, number, number],
  DARK: [52, 73, 94] as [number, number, number],
  LIGHT_GRAY: [240, 240, 240] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number],
};

// Interface pour les options de génération
interface GeneratePDFOptions {
  documentType: string;
  student: any;
  academicYear: any;
  semester: string;
  level: string;
  grades?: any[];
  statistics?: any;
  language?: "FR" | "EN";
  withSignature?: boolean;
  withStamp?: boolean;
}

// Fonction principale de génération
export async function generateDocumentPDF(
  options: GeneratePDFOptions
): Promise<Buffer> {
  // Déstructurer avec valeurs par défaut
  const {
    documentType,
    student,
    academicYear,
    semester,
    level,
    grades = [],
    statistics = {},
    language = "FR",
    withSignature = true,
    withStamp = true,
  } = options;

  const doc = new jsPDF();

  // En-tête universitaire commun
  generateUniversityHeader(doc);

  // Contenu spécifique au type de document
  switch (documentType) {
    case "BULLETIN":
      return generateBulletinPDF(doc, {
        documentType,
        student,
        academicYear,
        semester,
        level,
        grades,
        statistics,
        language,
        withSignature,
        withStamp,
      });
    case "RELEVE":
      return generateRelevePDF(doc, {
        documentType,
        student,
        academicYear,
        semester,
        level,
        grades,
        statistics,
        language,
        withSignature,
        withStamp,
      });
    case "ATTESTATION_NIVEAU":
      return generateAttestationNiveauPDF(doc, {
        documentType,
        student,
        academicYear,
        semester,
        level,
        grades,
        statistics,
        language,
        withSignature,
        withStamp,
      });
    case "ATTESTATION_FIN_ETUDES":
      return generateAttestationFinEtudesPDF(doc, {
        documentType,
        student,
        academicYear,
        semester,
        level,
        grades,
        statistics,
        language,
        withSignature,
        withStamp,
      });
    case "CERTIFICAT_SCOLARITE":
      return generateCertificatScolaritePDF(doc, {
        documentType,
        student,
        academicYear,
        semester,
        level,
        grades,
        statistics,
        language,
        withSignature,
        withStamp,
      });
    default:
      return generateBulletinPDF(doc, {
        documentType,
        student,
        academicYear,
        semester,
        level,
        grades,
        statistics,
        language,
        withSignature,
        withStamp,
      });
  }
}

// En-tête universitaire commun
function generateUniversityHeader(doc: jsPDF) {
  // Rectangle de fond
  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(0, 0, 210, 40, "F");

  // Nom de l'université
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.WHITE);
  doc.setFont("helvetica", "bold");
  doc.text("UNIVERSITÉ JÉRUSALEM DE PIGNON D'HAÏTI", 105, 15, {
    align: "center",
  });

  // Sigle
  doc.setFontSize(16);
  doc.text("UJEPH", 105, 22, { align: "center" });

  // Coordonnées
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

  // Barre de séparation
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(10, 42, 200, 42);
}

// 1. BULLETIN DE NOTES
function generateBulletinPDF(doc: jsPDF, options: GeneratePDFOptions): Buffer {
  const {
    student,
    academicYear,
    semester,
    level,
    grades = [],
    statistics = {},
  } = options;

  // Titre du document
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text("BULLETIN DE NOTES OFFICIEL", 105, 55, { align: "center" });

  // Sous-titre
  doc.setFontSize(12);
  doc.text(
    `Année académique ${academicYear.year} - ${getSemesterLabel(semester)}`,
    105,
    62,
    { align: "center" }
  );

  let currentY = 75;

  // Informations étudiant
  currentY = generateStudentInfoSection(doc, student, level, currentY);

  // Séparation
  currentY += 5;
  doc.setDrawColor(...COLORS.PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(15, currentY, 195, currentY);
  currentY += 10;

  // Tableau des notes détaillé
  if (grades.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DES NOTES PAR UNITÉ D'ENSEIGNEMENT", 105, currentY, {
      align: "center",
    });
    currentY += 8;

    const tableData = grades.map((grade, index) => {
      const ue = grade.ue;
      const noteColor =
        grade.status === "Validé" ? COLORS.SUCCESS : COLORS.DANGER;
      const sessionIndicator = grade.session === "Reprise" ? " (R)" : "";

      return [
        (index + 1).toString(),
        ue.code,
        ue.title,
        ue.credits.toString(),
        {
          content: `${grade.grade.toFixed(2)}${sessionIndicator}`,
          styles: {
            textColor: noteColor as any,
            fontStyle: "bold" as any,
            fontSize: 10,
          },
        },
        grade.status,
        getMention(grade.grade),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "#",
          "Code UE",
          "Intitulé",
          "Crédits",
          "Note/100",
          "Statut",
          "Mention",
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
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 30 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Résumé statistique détaillé
  currentY = generateStatisticsSection(doc, statistics, currentY);

  // Signature et cachet
  generateSignatureSection(doc, currentY, true, true);

  return Buffer.from(doc.output("arraybuffer"));
}

// 2. RELEVÉ DE NOTES (Synthèse)
function generateRelevePDF(doc: jsPDF, options: GeneratePDFOptions): Buffer {
  const {
    student,
    academicYear,
    semester,
    level,
    grades = [],
    statistics = {},
  } = options;

  // Titre du document
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text("RELEVÉ DE NOTES OFFICIEL - SYNTHÈSE", 105, 55, { align: "center" });

  let currentY = 70;

  // Informations étudiant compactes
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Étudiant: ${student.firstName} ${student.lastName}`, 20, currentY);
  doc.text(`Matricule: ${student.studentId}`, 20, currentY + 5);
  doc.text(`Niveau: ${level}`, 20, currentY + 10);
  doc.text(`Année: ${academicYear.year}`, 120, currentY);
  doc.text(`Semestre: ${getSemesterLabel(semester)}`, 120, currentY + 5);
  doc.text(
    `Date: ${new Date().toLocaleDateString("fr-FR")}`,
    120,
    currentY + 10
  );

  currentY += 20;

  // Résumé statistique en tableau
  const statsData = [
    ["Moyenne Générale", `${statistics.gpa?.toFixed(2) || "0.00"}/100`],
    [
      "Crédits Obtenus",
      `${statistics.creditsEarned || 0}/${statistics.totalCredits || 0}`,
    ],
    ["Taux de Réussite", `${calculateSuccessRate(statistics)}%`],
    [
      "Unités Validées",
      `${grades.filter((g) => g.status === "Validé").length}/${grades.length}`,
    ],
    ["Mention Globale", getMention(statistics.gpa || 0)],
  ];

  autoTable(doc, {
    startY: currentY,
    body: statsData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.DARK,
      textColor: COLORS.WHITE,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 10,
    },
    styles: {
      halign: "center",
      cellPadding: 5,
    },
    margin: { left: 40, right: 40 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { cellWidth: 50 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Graphique visuel des résultats (simulé avec du texte)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RÉPARTITION DES RÉSULTATS", 105, currentY, { align: "center" });
  currentY += 8;

  const validCount = grades.filter((g) => g.status === "Validé").length;
  const failCount = grades.length - validCount;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`✓ Unités validées: ${validCount}`, 30, currentY);
  doc.text(`✗ Unités à reprendre: ${failCount}`, 30, currentY + 5);

  // Barre de progression simulée
  const successRate = calculateSuccessRate(statistics);
  doc.setFillColor(...COLORS.SUCCESS);
  doc.rect(120, currentY - 2, successRate * 0.6, 8, "F");
  doc.setDrawColor(0, 0, 0);
  doc.rect(120, currentY - 2, 60, 8, "S");
  doc.text(`${successRate}%`, 185, currentY + 3);

  currentY += 15;

  // Signature simplifiée
  generateSignatureSection(doc, currentY, true, false);

  return Buffer.from(doc.output("arraybuffer"));
}

// 3. ATTESTATION DE NIVEAU
function generateAttestationNiveauPDF(
  doc: jsPDF,
  options: GeneratePDFOptions
): Buffer {
  const { student, academicYear, level, language = "FR" } = options;

  // Titre
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text("ATTESTATION DE NIVEAU D'ÉTUDES", 105, 60, { align: "center" });

  let currentY = 80;

  // Corps du texte
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const texts = {
    FR: [
      "LE DIRECTEUR DE L'UNIVERSITÉ JÉRUSALEM DE PIGNON D'HAÏTI (UJEPH)",
      "SOUSSIGNÉ",
      "",
      "ATTESTE que :",
      "",
      `Monsieur/Madame ${student.firstName} ${student.lastName}`,
      `Né(e) le ${new Date(student.dateOfBirth).toLocaleDateString("fr-FR")} à ${student.placeOfBirth || "non renseigné"}`,
      `Numéro de matricule : ${student.studentId}`,
      "",
      `est régulièrement inscrit(e) à l'Université Jérusalem de Pignon d'Haïti`,
      `pour l'année académique ${academicYear.year} et suit les cours de ${level}.`,
      "",
      "La présente attestation est délivrée pour servir et valoir ce que de droit.",
    ],
    EN: [
      "THE DIRECTOR OF JERUSALEM UNIVERSITY OF PIGNON, HAITI (UJEPH)",
      "UNDERSIGNED",
      "",
      "CERTIFIES that:",
      "",
      `Mr/Ms ${student.firstName} ${student.lastName}`,
      `Born on ${new Date(student.dateOfBirth).toLocaleDateString("en-US")} in ${student.placeOfBirth || "not specified"}`,
      `Student ID: ${student.studentId}`,
      "",
      `is duly registered at Jerusalem University of Pignon, Haiti`,
      `for the academic year ${academicYear.year} and is attending ${level} classes.`,
      "",
      "This certificate is issued for all legal purposes.",
    ],
  };

  const selectedTexts = texts[language];

  selectedTexts.forEach((text: string | string[], index: any) => {
    if (text === "") {
      currentY += 5;
    } else {
      doc.text(text, 105, currentY, { align: "center" });
      currentY += 7;
    }
  });

  currentY += 15;

  // Signature et cachet
  generateFormalSignatureSection(
    doc,
    currentY,
    "Le Directeur des Études",
    "Director of Studies"
  );

  return Buffer.from(doc.output("arraybuffer"));
}

// 4. ATTESTATION DE FIN D'ÉTUDES
function generateAttestationFinEtudesPDF(
  doc: jsPDF,
  options: GeneratePDFOptions
): Buffer {
  const {
    student,
    academicYear,
    level,
    language = "FR",
    statistics = {},
  } = options;

  // Titre
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text("ATTESTATION DE RÉUSSITE ET FIN D'ÉTUDES", 105, 60, {
    align: "center",
  });

  let currentY = 80;

  // Corps du texte
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const texts = {
    FR: [
      "LE PRÉSIDENT DE L'UNIVERSITÉ JÉRUSALEM DE PIGNON D'HAÏTI",
      "VU le dossier académique de l'étudiant(e),",
      "VU les délibérations du jury de fin de cycle,",
      "",
      "DÉCLARE que :",
      "",
      `Monsieur/Madame ${student.firstName} ${student.lastName}`,
      `Né(e) le ${new Date(student.dateOfBirth).toLocaleDateString("fr-FR")} à ${student.placeOfBirth || "non renseigné"}`,
      `Numéro de matricule : ${student.studentId}`,
      "",
      `a suivi avec assiduité le cycle de formation de ${level}`,
      `et a subi avec succès les épreuves de fin d'études de l'année académique ${academicYear.year}.`,
      "",
      `Moyenne générale : ${statistics.gpa?.toFixed(2) || "N/A"}/100`,
      `Mention : ${getMention(statistics.gpa || 0)}`,
      "",
      "Est par conséquent autorisé(e) à porter le titre de :",
      `« Diplômé(e) de l'Université Jérusalem de Pignon d'Haïti en ${level} »`,
      "",
      "Fait à Pignon, le _________________________",
    ],
    EN: [
      "THE PRESIDENT OF JERUSALEM UNIVERSITY OF PIGNON, HAITI",
      "HAVING REVIEWED the student's academic record,",
      "HAVING CONSIDERED the deliberations of the final examination board,",
      "",
      "DECLARES that:",
      "",
      `Mr/Ms ${student.firstName} ${student.lastName}`,
      `Born on ${new Date(student.dateOfBirth).toLocaleDateString("en-US")} in ${student.placeOfBirth || "not specified"}`,
      `Student ID: ${student.studentId}`,
      "",
      `has duly completed the ${level} training program`,
      `and successfully passed the final examinations for the academic year ${academicYear.year}.`,
      "",
      `Overall GPA: ${statistics.gpa?.toFixed(2) || "N/A"}/100`,
      `Honors: ${getMention(statistics.gpa || 0)}`,
      "",
      "Is therefore entitled to bear the title of:",
      `"Graduate of Jerusalem University of Pignon, Haiti in ${level}"`,
      "",
      "Done at Pignon, on _________________________",
    ],
  };

  const selectedTexts = texts[language];

  selectedTexts.forEach((text: string | string[], index: any) => {
    if (text === "") {
      currentY += 5;
    } else {
      doc.text(text, 105, currentY, { align: "center" });
      currentY += 6;
    }
  });

  currentY += 20;

  // Signatures multiples
  generateDiplomaSignatureSection(doc, currentY);

  return Buffer.from(doc.output("arraybuffer"));
}

// 5. CERTIFICAT DE SCOLARITÉ
function generateCertificatScolaritePDF(
  doc: jsPDF,
  options: GeneratePDFOptions
): Buffer {
  const { student, academicYear, level, language = "FR" } = options;

  // Titre
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.DARK);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICAT DE SCOLARITÉ", 105, 60, { align: "center" });

  let currentY = 80;

  // Corps du texte
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const texts = {
    FR: [
      "Je soussigné, Directeur de l'Université Jérusalem de Pignon d'Haïti,",
      "certifie que :",
      "",
      `Monsieur/Madame ${student.firstName} ${student.lastName}`,
      `Né(e) le ${new Date(student.dateOfBirth).toLocaleDateString("fr-FR")} à ${student.placeOfBirth || "non renseigné"}`,
      `Demeurant : ${student.address || "adresse non renseignée"}`,
      `Numéro CIN : ${student.cin || "non renseigné"}`,
      "",
      `est régulièrement inscrit(e) comme étudiant(e) en ${level}`,
      `à l'Université Jérusalem de Pignon d'Haïti pour l'année académique ${academicYear.year}.`,
      "",
      "La présente attestation de scolarité est délivrée à l'intéressé(e) pour",
      "faire valoir ce que de droit, notamment pour les démarches administratives.",
      "",
      "L'étudiant(e) est en règle avec l'administration de l'Université.",
    ],
    EN: [
      "I, the undersigned, Director of Jerusalem University of Pignon, Haiti,",
      "certify that:",
      "",
      `Mr/Ms ${student.firstName} ${student.lastName}`,
      `Born on ${new Date(student.dateOfBirth).toLocaleDateString("en-US")} in ${student.placeOfBirth || "not specified"}`,
      `Residing at: ${student.address || "address not specified"}`,
      `National ID: ${student.cin || "not specified"}`,
      "",
      `is duly registered as a student in ${level}`,
      `at Jerusalem University of Pignon, Haiti for the academic year ${academicYear.year}.`,
      "",
      "This certificate of enrollment is issued to the student",
      "for all legal purposes, particularly for administrative procedures.",
      "",
      "The student is in good standing with the University administration.",
    ],
  };

  const selectedTexts = texts[language];

  selectedTexts.forEach((text: string | string[], index: any) => {
    if (text === "") {
      currentY += 5;
    } else {
      doc.text(text, 105, currentY, { align: "center" });
      currentY += 6;
    }
  });

  currentY += 15;

  // Signature administrative
  generateAdministrativeSignatureSection(doc, currentY);

  return Buffer.from(doc.output("arraybuffer"));
}

// FONCTIONS AUXILIAIRES

function generateStudentInfoSection(
  doc: jsPDF,
  student: any,
  level: string,
  startY: number
): number {
  doc.setFillColor(...COLORS.LIGHT_GRAY);
  doc.rect(15, startY, 180, 30, "F");
  doc.setDrawColor(0, 0, 0);
  doc.rect(15, startY, 180, 30, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Nom et prénom: ${student.lastName} ${student.firstName}`,
    20,
    startY + 8
  );
  doc.text(`Matricule: ${student.studentId}`, 20, startY + 15);
  doc.text(`Niveau: ${level}`, 20, startY + 22);
  doc.text(`Email: ${student.email}`, 110, startY + 8);
  doc.text(`Téléphone: ${student.phone || "Non renseigné"}`, 110, startY + 15);
  doc.text(`CIN: ${student.cin || "Non renseigné"}`, 110, startY + 22);

  return startY + 35;
}

function generateStatisticsSection(
  doc: jsPDF,
  statistics: any,
  startY: number
): number {
  doc.setFillColor(...COLORS.LIGHT_GRAY);
  doc.rect(10, startY, 190, 40, "F");
  doc.setDrawColor(0, 0, 0);
  doc.rect(10, startY, 190, 40, "S");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSUMÉ ACADÉMIQUE", 105, startY + 8, { align: "center" });

  doc.setDrawColor(...COLORS.PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(15, startY + 12, 195, startY + 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const stats = [
    {
      label: "Moyenne générale",
      value: `${statistics.gpa?.toFixed(2) || "0.00"}/100`,
      x: 20,
    },
    {
      label: "Crédits obtenus",
      value: `${statistics.creditsEarned || 0}/${statistics.totalCredits || 0}`,
      x: 20,
    },
    {
      label: "Taux de réussite",
      value: `${calculateSuccessRate(statistics)}%`,
      x: 110,
    },
    { label: "Mention", value: getMention(statistics.gpa || 0), x: 110 },
  ];

  stats.forEach((stat, index) => {
    doc.text(stat.label, stat.x, startY + 20 + (index % 2) * 10);
    doc.setFont("helvetica", "bold");
    doc.text(stat.value, stat.x + 50, startY + 20 + (index % 2) * 10);
    doc.setFont("helvetica", "normal");
  });

  return startY + 45;
}

function generateSignatureSection(
  doc: jsPDF,
  startY: number,
  withSignature: boolean,
  withStamp: boolean
) {
  const pageHeight = doc.internal.pageSize.height;
  const signatureY = Math.min(startY + 30, pageHeight - 40);

  if (withSignature) {
    doc.setFontSize(10);
    doc.text("Fait à Pignon, le", 30, signatureY);
    doc.text(
      new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      30,
      signatureY + 5
    );

    doc.text("_________________________", 130, signatureY);
    doc.text("Le Directeur des Études", 135, signatureY + 5, {
      align: "center",
    });
  }

  if (withStamp) {
    // Simulation d'un cachet circulaire
    doc.setDrawColor(...COLORS.DANGER);
    doc.setLineWidth(2);
    doc.circle(160, signatureY - 10, 15);

    doc.setFontSize(6);
    doc.setTextColor(...COLORS.DANGER);
    doc.text("CACHET", 160, signatureY - 12, { align: "center" });
    doc.text("OFFICIEL", 160, signatureY - 8, { align: "center" });
    doc.text("UJEPH", 160, signatureY - 4, { align: "center" });
  }

  // Pied de page
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(10, pageHeight - 20, 200, pageHeight - 20);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.DARK);
  doc.text(
    "Daniel 2:17 - C'est Dieu qui change les temps et les circonstances",
    105,
    pageHeight - 15,
    { align: "center" }
  );
  doc.text("Document officiel - Ne pas jeter", 105, pageHeight - 10, {
    align: "center",
  });
}

function generateFormalSignatureSection(
  doc: jsPDF,
  startY: number,
  titleFr: string,
  titleEn: string
) {
  const signatureY = startY + 20;

  doc.setFontSize(10);
  doc.text("Fait à Pignon, le", 105, signatureY, { align: "center" });
  doc.text(new Date().toLocaleDateString("fr-FR"), 105, signatureY + 5, {
    align: "center",
  });

  doc.text("_________________________", 105, signatureY + 20, {
    align: "center",
  });
  doc.text(titleFr, 105, signatureY + 25, { align: "center" });
  doc.text(titleEn, 105, signatureY + 30, { align: "center" });
}

function generateDiplomaSignatureSection(doc: jsPDF, startY: number) {
  const signatureY = startY;

  // Signature du Président
  doc.text("_________________________", 50, signatureY);
  doc.text("Le Président de l'Université", 50, signatureY + 5);

  // Signature du Directeur des Études
  doc.text("_________________________", 150, signatureY);
  doc.text("Le Directeur des Études", 150, signatureY + 5);

  // Signature du Doyen
  doc.text("_________________________", 50, signatureY + 20);
  doc.text("Le Doyen de la Faculté", 50, signatureY + 25);

  // Cachet de l'Université
  doc.setDrawColor(...COLORS.PRIMARY);
  doc.setLineWidth(2);
  doc.circle(150, signatureY + 15, 12);

  doc.setFontSize(5);
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text("UNIVERSITÉ", 150, signatureY + 13, { align: "center" });
  doc.text("JÉRUSALEM", 150, signatureY + 16, { align: "center" });
  doc.text("PIGNON", 150, signatureY + 19, { align: "center" });
}

function generateAdministrativeSignatureSection(doc: jsPDF, startY: number) {
  const signatureY = startY;

  doc.setFontSize(10);
  doc.text("Pour attestation et certification", 105, signatureY, {
    align: "center",
  });

  doc.text("_________________________", 105, signatureY + 15, {
    align: "center",
  });
  doc.text("Le Secrétaire Général", 105, signatureY + 20, { align: "center" });

  // Cachet administratif
  doc.setDrawColor(...COLORS.DARK);
  doc.setLineWidth(1);
  doc.rect(140, signatureY + 5, 40, 20);

  doc.setFontSize(6);
  doc.setTextColor(...COLORS.DARK);
  doc.text("SERVICE", 160, signatureY + 10, { align: "center" });
  doc.text("ADMINISTRATIF", 160, signatureY + 14, { align: "center" });
  doc.text("UJEPH", 160, signatureY + 18, { align: "center" });
}

// Fonctions utilitaires
function getSemesterLabel(semester: string): string {
  const labels: { [key: string]: string } = {
    S1: "Semestre 1",
    S2: "Semestre 2",
    ANNUAL: "Année complète",
    all: "Année complète",
  };
  return labels[semester] || semester;
}

function getMention(gpa: number): string {
  if (gpa >= 16) return "Très Bien";
  if (gpa >= 14) return "Bien";
  if (gpa >= 12) return "Assez Bien";
  if (gpa >= 10) return "Passable";
  return "Insuffisant";
}

function calculateSuccessRate(statistics: any): number {
  if (
    !statistics.creditsEarned ||
    !statistics.totalCredits ||
    statistics.totalCredits === 0
  ) {
    return 0.0;
  }
  return parseFloat(
    ((statistics.creditsEarned / statistics.totalCredits) * 100).toFixed(1)
  );
}

export {
  generateBulletinPDF,
  generateRelevePDF,
  generateAttestationNiveauPDF,
  generateAttestationFinEtudesPDF,
  generateCertificatScolaritePDF,
};
