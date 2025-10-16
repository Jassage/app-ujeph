// Utilisation de jsPDF avec autoTable
const { jsPDF } = window.jspdf;

// Données simulées
const mockStudents = [
  {
    id: "1",
    firstName: "Jean",
    lastName: "Dupont",
    program: "Informatique",
    academicYear: "2023-2024",
  },
  {
    id: "2",
    firstName: "Marie",
    lastName: "Martin",
    program: "Mathématiques",
    academicYear: "2023-2024",
  },
  {
    id: "3",
    firstName: "Pierre",
    lastName: "Durand",
    program: "Physique",
    academicYear: "2023-2024",
  },
  {
    id: "4",
    firstName: "Sophie",
    lastName: "Lambert",
    program: "Droit",
    academicYear: "2023-2024",
  },
  {
    id: "5",
    firstName: "Thomas",
    lastName: "Moreau",
    program: "Économie",
    academicYear: "2023-2024",
  },
];

const mockCourses = [
  {
    id: "c1",
    name: "Algorithmique",
    grade: 15.5,
    coefficient: 4,
    isRetake: false,
    semester: 1,
  },
  {
    id: "c2",
    name: "Base de données",
    grade: 12,
    coefficient: 3,
    isRetake: false,
    semester: 1,
  },
  {
    id: "c3",
    name: "Programmation web",
    grade: 9.5,
    coefficient: 3,
    isRetake: true,
    semester: 1,
  },
  {
    id: "c4",
    name: "Systèmes d'exploitation",
    grade: 14,
    coefficient: 4,
    isRetake: false,
    semester: 2,
  },
  {
    id: "c5",
    name: "Réseaux",
    grade: 16,
    coefficient: 3,
    isRetake: false,
    semester: 2,
  },
  {
    id: "c6",
    name: "Intelligence artificielle",
    grade: 13.5,
    coefficient: 4,
    isRetake: false,
    semester: 2,
  },
  {
    id: "c7",
    name: "Mathématiques discrètes",
    grade: 11,
    coefficient: 2,
    isRetake: false,
    semester: 1,
  },
  {
    id: "c8",
    name: "Anglais technique",
    grade: 14.5,
    coefficient: 2,
    isRetake: false,
    semester: 2,
  },
];

// Éléments DOM
const academicYearInput = document.getElementById("academicYear");
const selectedSemesterSelect = document.getElementById("selectedSemester");
const individualModeBtn = document.getElementById("individualMode");
const batchModeBtn = document.getElementById("batchMode");
const studentSelectionDiv = document.getElementById("studentSelection");
const selectedStudentSelect = document.getElementById("selectedStudent");
const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const printBtn = document.getElementById("printBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const statusAreaDiv = document.getElementById("statusArea");
const bulletinPreviewDiv = document.getElementById("bulletinPreview");
const statisticsSectionDiv = document.getElementById("statisticsSection");

let batchMode = false;
let currentBulletinData = null;

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  displaySampleBulletin();
  attachEventListeners();
});

function attachEventListeners() {
  individualModeBtn.addEventListener("click", () => {
    individualModeBtn.classList.add("active");
    batchModeBtn.classList.remove("active");
    studentSelectionDiv.style.display = "flex";
    batchMode = false;
    generateBtn.innerHTML = '<i class="fas fa-sync"></i> Générer le bulletin';
  });

  batchModeBtn.addEventListener("click", () => {
    batchModeBtn.classList.add("active");
    individualModeBtn.classList.remove("active");
    studentSelectionDiv.style.display = "none";
    batchMode = true;
    generateBtn.innerHTML =
      '<i class="fas fa-sync"></i> Générer tous les bulletins';
  });

  generateBtn.addEventListener("click", () => {
    if (batchMode) {
      generateAllBulletins();
    } else {
      generateBulletin();
    }
  });

  resetBtn.addEventListener("click", resetForm);
  printBtn.addEventListener("click", printBulletin);
  exportPdfBtn.addEventListener("click", exportToPDF);
  exportExcelBtn.addEventListener("click", exportToExcel);
}

// Fonction pour calculer la moyenne
function calculateAverage(courses) {
  const total = courses.reduce(
    (sum, course) => sum + course.grade * course.coefficient,
    0
  );
  const totalCoefficients = courses.reduce(
    (sum, course) => sum + course.coefficient,
    0
  );
  return totalCoefficients > 0 ? total / totalCoefficients : 0;
}

// Fonction pour générer un bulletin
function generateBulletin() {
  const academicYear = academicYearInput.value;
  const selectedSemester = selectedSemesterSelect.value;
  const studentId = selectedStudentSelect.value;

  if (!studentId) {
    showStatus("Veuillez sélectionner un étudiant", "error");
    return;
  }

  showStatus("Génération du bulletin en cours...", "loading");

  // Simulation d'un délai de chargement
  setTimeout(() => {
    const student = mockStudents.find((s) => s.id === studentId);
    if (student) {
      const filteredCourses =
        selectedSemester === "all"
          ? mockCourses
          : mockCourses.filter(
              (c) => c.semester === parseInt(selectedSemester)
            );

      currentBulletinData = {
        student,
        courses: filteredCourses,
        academicYear,
        semester: selectedSemester,
      };

      displayBulletin(currentBulletinData);
      displayStatistics(currentBulletinData);

      showStatus("Bulletin généré avec succès", "success");
    }
  }, 1500);
}

// Fonction pour générer tous les bulletins
function generateAllBulletins() {
  const academicYear = academicYearInput.value;
  showStatus("Génération de tous les bulletins en cours...", "loading");

  // Simulation d'un délai de chargement
  setTimeout(() => {
    showStatus(
      `Génération des bulletins pour tous les étudiants de ${academicYear} terminée!`,
      "success"
    );

    // Pour la démonstration, affichons le bulletin du premier étudiant
    const filteredCourses =
      selectedSemesterSelect.value === "all"
        ? mockCourses
        : mockCourses.filter(
            (c) => c.semester === parseInt(selectedSemesterSelect.value)
          );

    currentBulletinData = {
      student: mockStudents[0],
      courses: filteredCourses,
      academicYear,
      semester: selectedSemesterSelect.value,
    };

    displayBulletin(currentBulletinData);
    displayStatistics(currentBulletinData);
  }, 2000);
}

// Fonction pour afficher le bulletin
function displayBulletin(data) {
  const average = calculateAverage(data.courses);

  // Regrouper les cours par semestre
  const coursesBySemester = {};
  data.courses.forEach((course) => {
    if (!coursesBySemester[course.semester]) {
      coursesBySemester[course.semester] = [];
    }
    coursesBySemester[course.semester].push(course);
  });

  let bulletinHTML = `
                <div class="bulletin" id="bulletinToPrint">
                    <div class="watermark">UNIVERSITÉ</div>
                    <div class="university-header">
                        <div class="logo">UIS</div>
                        <div class="university-info">
                            <h2>Université Internationale des Sciences</h2>
                            <p>123 Avenue de l'Éducation, 75000 Paris</p>
                            <p>Téléphone: +33 1 23 45 67 89 | Email: contact@uis.fr</p>
                        </div>
                    </div>
                    
                    <div class="student-info">
                        <h3><i class="fas fa-user-graduate"></i> Informations de l'étudiant</h3>
                        <div class="student-details">
                            <p><i class="fas fa-id-card"></i> <strong>Nom:</strong> ${
                              data.student.lastName
                            }</p>
                            <p><i class="fas fa-signature"></i> <strong>Prénom:</strong> ${
                              data.student.firstName
                            }</p>
                            <p><i class="fas fa-graduation-cap"></i> <strong>Programme:</strong> ${
                              data.student.program
                            }</p>
                            <p><i class="fas fa-calendar"></i> <strong>Année académique:</strong> ${
                              data.academicYear
                            }</p>
                            ${
                              data.semester !== "all"
                                ? `<p><i class="fas fa-book"></i> <strong>Semestre:</strong> ${data.semester}</p>`
                                : ""
                            }
                        </div>
                    </div>
            `;

  // Ajouter un tableau pour chaque semestre
  for (const semester in coursesBySemester) {
    const semesterCourses = coursesBySemester[semester];
    const semesterAverage = calculateAverage(semesterCourses);

    let semesterStatus = "";
    if (semesterAverage >= 14) {
      semesterStatus = '<span class="badge badge-success">Excellente</span>';
    } else if (semesterAverage >= 10) {
      semesterStatus = '<span class="badge badge-warning">Satisfaisante</span>';
    } else {
      semesterStatus = '<span class="badge badge-danger">Insuffisante</span>';
    }

    bulletinHTML += `
                    <div class="semester-header">
                        <h3 class="semester-title"><i class="fas fa-book-open"></i> Semestre ${semester}</h3>
                        <div class="semester-average">Moyenne: ${semesterAverage.toFixed(
                          2
                        )} / 20 ${semesterStatus}</div>
                    </div>
                    <table class="grades-table">
                        <thead>
                            <tr>
                                <th>Matière</th>
                                <th>Coefficient</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

    semesterCourses.forEach((course) => {
      bulletinHTML += `
                        <tr>
                            <td>${course.name}</td>
                            <td>${course.coefficient}</td>
                            <td class="${course.grade < 10 ? "fail" : ""}">
                                ${course.grade.toFixed(2)}
                                ${
                                  course.isRetake
                                    ? '<span class="retake">R</span>'
                                    : ""
                                }
                                ${
                                  course.grade < 10
                                    ? '<span class="badge badge-danger">Échec</span>'
                                    : ""
                                }
                            </td>
                        </tr>
                    `;
    });

    bulletinHTML += `
                        </tbody>
                    </table>
                `;
  }

  let overallStatus = "";
  if (average >= 14) {
    overallStatus = '<span class="badge badge-success">Excellente</span>';
  } else if (average >= 10) {
    overallStatus = '<span class="badge badge-warning">Satisfaisante</span>';
  } else {
    overallStatus = '<span class="badge badge-danger">Insuffisante</span>';
  }

  bulletinHTML += `
                    <div class="bulletin-footer">
                        <div class="average">
                            <i class="fas fa-chart-line"></i> Moyenne générale: ${average.toFixed(
                              2
                            )} / 20 ${overallStatus}
                        </div>
                        <div class="signatures">
                            <div class="signature">
                                <p>Le Responsable de Formation</p>
                                <div class="signature-line"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  bulletinPreviewDiv.innerHTML = bulletinHTML;
}

// Fonction pour afficher les statistiques
function displayStatistics(data) {
  const average = calculateAverage(data.courses);
  const failedCourses = data.courses.filter(
    (course) => course.grade < 10
  ).length;
  const retakeCourses = data.courses.filter((course) => course.isRetake).length;
  const excellentCourses = data.courses.filter(
    (course) => course.grade >= 16
  ).length;

  let statisticsHTML = `
                <h3><i class="fas fa-chart-bar"></i> Statistiques du bulletin</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${data.courses.length}</div>
                        <div class="stat-label">Matières totales</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${failedCourses}</div>
                        <div class="stat-label">Matières en échec</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${retakeCourses}</div>
                        <div class="stat-label">Matières repêchées</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${excellentCourses}</div>
                        <div class="stat-label">Matières excellentes</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${average.toFixed(2)}</div>
                        <div class="stat-label">Moyenne générale</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${
                          average >= 10 ? "Validé" : "Non validé"
                        }</div>
                        <div class="stat-label">Statut</div>
                    </div>
                </div>
            `;

  statisticsSectionDiv.innerHTML = statisticsHTML;
}

// Fonction pour afficher un bulletin exemple au chargement
function displaySampleBulletin() {
  currentBulletinData = {
    student: mockStudents[0],
    courses: mockCourses,
    academicYear: "2023-2024",
    semester: "all",
  };

  displayBulletin(currentBulletinData);
  displayStatistics(currentBulletinData);
}

// Fonction pour exporter en PDF
function exportToPDF() {
  if (!currentBulletinData) {
    showStatus("Aucun bulletin à exporter", "error");
    return;
  }

  const academicYear = academicYearInput.value;
  const selectedSemester = selectedSemesterSelect.value;
  const student = currentBulletinData.student;
  const filteredCourses = currentBulletinData.courses;

  const average = calculateAverage(filteredCourses);

  // Création du PDF
  const doc = new jsPDF();

  // Ajouter l'en-tête de l'université
  doc.setFillColor(52, 152, 219);
  doc.rect(0, 0, 220, 30, "F");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Université Internationale des Sciences", 105, 15, {
    align: "center",
  });
  doc.setFontSize(10);
  doc.text(
    "123 Avenue de l'Éducation, 75000 Paris | Tél: +33 1 23 45 67 89 | Email: contact@uis.fr",
    105,
    22,
    { align: "center" }
  );

  // Informations de l'étudiant
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, "bold");
  doc.text("BULLETIN DE NOTES", 105, 40, { align: "center" });

  doc.setFont(undefined, "normal");
  doc.text(`Faculté: ${student.program}`, 20, 50);
  doc.text(`Année académique: ${academicYear}`, 20, 57);
  if (selectedSemester !== "all") {
    doc.text(`Semestre: ${selectedSemester}`, 20, 64);
  }
  doc.text(`Nom: ${student.lastName}`, 120, 50);
  doc.text(`Prénom: ${student.firstName}`, 120, 57);

  // Préparer les données du tableau
  const tableData = filteredCourses.map((course) => [
    course.name,
    course.coefficient,
    {
      content: course.grade.toFixed(2) + (course.isRetake ? " R" : ""),
      styles: {
        textColor: course.grade < 10 ? [231, 76, 60] : [0, 0, 0],
      },
    },
  ]);

  // Ajouter le tableau
  doc.autoTable({
    startY: 70,
    head: [["Matière", "Coefficient", "Note"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [52, 152, 219],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  // Ajouter la moyenne
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont(undefined, "bold");
  doc.text(`Moyenne: ${average.toFixed(2)} / 20`, 20, finalY);

  // Ajouter la signature
  doc.text("Le Responsable de Formation", 140, finalY + 20);
  doc.line(140, finalY + 22, 190, finalY + 22);

  // Enregistrer le PDF
  doc.save(
    `bulletin-${student.lastName}-${student.firstName}-${academicYear}.pdf`
  );

  showStatus("Bulletin exporté en PDF avec succès", "success");
}

// Fonction pour exporter en Excel (simulation)
function exportToExcel() {
  if (!currentBulletinData) {
    showStatus("Aucun bulletin à exporter", "error");
    return;
  }

  showStatus("Fonctionnalité d'export Excel à implémenter", "loading");

  // Simulation d'un délai
  setTimeout(() => {
    showStatus("Export Excel simulé avec succès", "success");
  }, 1000);
}

// Fonction pour imprimer le bulletin
function printBulletin() {
  const bulletinElement = document.getElementById("bulletinToPrint");
  if (!bulletinElement) {
    showStatus("Aucun bulletin à imprimer", "error");
    return;
  }

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Impression du Bulletin</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .bulletin { border: 1px solid #000; padding: 20px; }
                        .university-header { display: flex; align-items: center; margin-bottom: 20px; }
                        .logo { width: 80px; height: 80px; background: #2c3e50; color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-right: 15px; font-weight: bold; }
                        .grades-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                        .grades-table th, .grades-table td { border: 1px solid #000; padding: 8px; }
                        .grades-table th { background-color: #f2f2f2; }
                        .fail { color: #e74c3c; font-weight: bold; }
                        .retake { color: #f39c12; font-weight: bold; }
                        .bulletin-footer { display: flex; justify-content: space-between; margin-top: 20px; }
                        .signature-line { width: 200px; height: 1px; background-color: #000; margin-top: 40px; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    ${bulletinElement.outerHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 100);
                        };
                    <\/script>
                </body>
                </html>
            `);
  printWindow.document.close();
}

// Fonction pour réinitialiser le formulaire
function resetForm() {
  academicYearInput.value = "2023-2024";
  selectedSemesterSelect.value = "all";
  selectedStudentSelect.value = "";
  individualModeBtn.classList.add("active");
  batchModeBtn.classList.remove("active");
  studentSelectionDiv.style.display = "flex";
  batchMode = false;
  generateBtn.innerHTML = '<i class="fas fa-sync"></i> Générer le bulletin';

  statusAreaDiv.innerHTML = "";
  bulletinPreviewDiv.innerHTML = "";
  statisticsSectionDiv.innerHTML = "";

  showStatus("Formulaire réinitialisé", "success");
  setTimeout(() => {
    displaySampleBulletin();
  }, 1000);
}

{
  /* // Fonction pour afficher les messages de statut */
}
function showStatus(message, type) {
  let icon = "";
  switch (type) {
    case "loading":
      icon = '<i class="fas fa-spinner fa-spin"></i>';
      break;
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
  }

  statusAreaDiv.innerHTML = `<div class="status-message status-${type}">${icon} ${message}</div>`;

  if (type === "success" || type === "error") {
    setTimeout(() => {
      statusAreaDiv.innerHTML = "";
    }, 3000);
  }
}
