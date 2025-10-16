import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  X,
  Download,
  Printer,
  FileText,
  BarChart3,
  Calendar,
  BookOpen,
  Award,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  History,
} from "lucide-react";
import { Student, Enrollment, GradeWithDetails } from "../../types/academic";
import { GradeHistoryModal } from "../GradeHistoryModal";

interface GradesModalProps {
  enrollment: Enrollment;
  student: Student;
  grades: GradeWithDetails[];
  onClose: () => void;
  onGenerateReport: (session?: string) => void;
}

export const GradesModal = ({
  enrollment,
  student,
  grades,
  onClose,
  onGenerateReport,
}: GradesModalProps) => {
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [activeView, setActiveView] = useState<"grades" | "stats">("grades");
  const [isLoading, setIsLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUEForHistory, setSelectedUEForHistory] = useState<string>("");

  // CORRECTION: Filtrer uniquement les notes actives
  const activeGrades = useMemo(() => {
    return grades.filter((grade) => grade.isActive !== false);
  }, [grades]);

  // Nouvelle fonction pour ouvrir l'historique
  const handleViewHistory = (ueId: string) => {
    console.log("🔍 Opening history for UE:", ueId);
    setSelectedUEForHistory(ueId);
    setShowHistoryModal(true);
  };

  // CORRECTION: Utiliser activeGrades au lieu de grades
  useEffect(() => {
    console.log("🔍 DEBUG GradesModal:", {
      student: `${student.firstName} ${student.lastName}`,
      enrollment: enrollment,
      allGradesCount: grades.length,
      activeGradesCount: activeGrades.length,
      activeGrades: activeGrades,
      firstGrade: activeGrades?.[0],
      ueStructure: activeGrades?.[0]?.ue,
    });

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeGrades, student, enrollment, grades]);

  // CORRECTION: Valeur par défaut pour passingGrade
  const DEFAULT_PASSING_GRADE = 70;

  // CORRECTION: Fonction pour obtenir le passingGrade sécurisée
  const getPassingGrade = (grade: GradeWithDetails) => {
    if (!grade) return DEFAULT_PASSING_GRADE;

    const passingGrade =
      grade.ue?.passingGrade || grade.passingGrade || DEFAULT_PASSING_GRADE;

    return Number(passingGrade);
  };

  // CORRECTION: Fonction pour déterminer le statut basé sur passingGrade
  const getGradeStatus = (grade: GradeWithDetails) => {
    if (!grade || grade.grade === null || grade.grade === undefined)
      return "Non noté";

    const gradeValue = Number(grade.grade);
    if (isNaN(gradeValue) || gradeValue === 0) return "Non noté";

    const passingGrade = getPassingGrade(grade);
    const isOutOf20 = passingGrade <= 20;

    if (isOutOf20) {
      if (gradeValue >= passingGrade) {
        return "Validé";
      } else if (gradeValue >= passingGrade - 3) {
        return "Rattrapage";
      } else {
        return "Échec";
      }
    } else {
      if (gradeValue >= passingGrade) {
        return "Validé";
      } else if (gradeValue >= passingGrade - 15) {
        return "Rattrapage";
      } else {
        return "Échec";
      }
    }
  };

  // CORRECTION: Fonction pour obtenir la variante du badge selon le statut
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Validé":
        return "default";
      case "Rattrapage":
        return "secondary";
      case "Échec":
        return "destructive";
      default:
        return "outline";
    }
  };

  // CORRECTION: Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Validé":
        return <CheckCircle className="h-4 w-4" />;
      case "Rattrapage":
        return <AlertCircle className="h-4 w-4" />;
      case "Échec":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // CORRECTION: Fonction pour afficher la note formatée
  const getFormattedGrade = (grade: GradeWithDetails) => {
    if (!grade || grade.grade === null || grade.grade === undefined) return "-";

    const gradeValue = Number(grade.grade);
    if (isNaN(gradeValue)) return "-";

    const passingGrade = getPassingGrade(grade);
    const isOutOf20 = passingGrade <= 20;

    if (isOutOf20) {
      return `${gradeValue}/20`;
    } else {
      return `${gradeValue}/100`;
    }
  };

  // CORRECTION: Fonction pour afficher le seuil formaté
  const getFormattedPassingGrade = (grade: GradeWithDetails) => {
    const passingGrade = getPassingGrade(grade);
    const isOutOf20 = passingGrade <= 20;

    if (isOutOf20) {
      return `${passingGrade}/20`;
    } else {
      return `${passingGrade}/100`;
    }
  };

  // CORRECTION: Grouper les notes ACTIVES par semestre
  const gradesBySemester = activeGrades?.reduce((acc, grade) => {
    if (!grade || !grade.semester) return acc;

    const semester = grade.semester;
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(grade);
    return acc;
  }, {} as Record<string, GradeWithDetails[]>);

  const semesters = gradesBySemester
    ? Object.keys(gradesBySemester).sort()
    : [];

  // CORRECTION: Sélectionner le premier semestre par défaut
  useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      setSelectedSemester(semesters[0]);
    }
  }, [semesters, selectedSemester]);

  // CORRECTION: Notes ACTIVES du semestre sélectionné
  const semesterGrades =
    selectedSemester && gradesBySemester
      ? gradesBySemester[selectedSemester] || []
      : [];

  // CORRECTION: Calculer les statistiques avec les notes ACTIVES
  const calculateStats = () => {
    if (!semesterGrades || semesterGrades.length === 0) {
      return {
        average: 0,
        passed: 0,
        total: 0,
        passingGrade: DEFAULT_PASSING_GRADE,
        isOutOf20: false,
      };
    }

    const validGrades = semesterGrades.filter(
      (grade) =>
        grade &&
        grade.grade !== null &&
        grade.grade !== undefined &&
        Number(grade.grade) > 0
    );

    if (validGrades.length === 0) {
      return {
        average: 0,
        passed: 0,
        total: 0,
        passingGrade: DEFAULT_PASSING_GRADE,
        isOutOf20: false,
      };
    }

    // Détecter le système de notation basé sur le premier cours valide
    const firstGrade = validGrades[0];
    const firstPassingGrade = getPassingGrade(firstGrade);
    const isOutOf20 = firstPassingGrade <= 20;

    const total = validGrades.reduce((sum, grade) => {
      const gradeValue = Number(grade.grade);
      return sum + (isNaN(gradeValue) ? 0 : gradeValue);
    }, 0);

    const average = total / validGrades.length;
    const passed = validGrades.filter(
      (grade) => getGradeStatus(grade) === "Validé"
    ).length;

    return {
      average: Math.round(average * 100) / 100,
      passed,
      total: validGrades.length,
      passingGrade: firstPassingGrade,
      isOutOf20,
    };
  };

  const stats = calculateStats();

  // CORRECTION: Obtenir le titre de l'UE de manière sécurisée
  const getUETitle = (grade: GradeWithDetails) => {
    if (!grade) return "Cours inconnu";
    return grade.ue?.title || grade.courseTitle || "Cours inconnu";
  };

  // CORRECTION: Obtenir le code de l'UE de manière sécurisée
  const getUECode = (grade: GradeWithDetails) => {
    if (!grade) return "N/A";
    return grade.ue?.code || grade.courseCode || "N/A";
  };

  // CORRECTION: Obtenir les crédits de manière sécurisée
  const getUECredits = (grade: GradeWithDetails) => {
    if (!grade) return 0;
    return grade.ue?.credits || grade.credits || 0;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Chargement des notes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all scale-100 opacity-100 flex flex-col">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Bulletin de Notes</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {enrollment.faculty}
                  </h3>
                  <p className="text-blue-100">
                    {enrollment.level} • {enrollment.academicYear}
                  </p>
                  <p className="text-blue-100 text-sm">
                    Seuil de réussite:{" "}
                    {stats.isOutOf20
                      ? `${stats.passingGrade}/20`
                      : `${stats.passingGrade}/100`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-blue-100 text-sm">
                    ID: {student.studentId}
                  </p>
                  {/* CORRECTION: Afficher le compte des notes actives */}
                  <p className="text-blue-100 text-sm">
                    {activeGrades.length} note(s) active(s) sur {grades.length}{" "}
                    au total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Sélecteur de semestre et actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              {semesters.length > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <label className="font-medium text-sm">Semestre:</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium"
                  >
                    {semesters.map((semester) => (
                      <option key={semester} value={semester}>
                        Semestre {semester}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Tabs
                defaultValue="grades"
                className="w-auto"
                onValueChange={(v: any) => setActiveView(v)}
              >
                <TabsList className="grid grid-cols-2 h-9">
                  <TabsTrigger
                    value="grades"
                    className="text-xs flex items-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Notes Actives
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="text-xs flex items-center gap-1"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Stats
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => onGenerateReport(selectedSemester)}
                disabled={semesterGrades.length === 0}
              >
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => onGenerateReport(selectedSemester)}
                disabled={semesterGrades.length === 0}
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>

          {/* État vide - CORRECTION: Utiliser activeGrades */}
          {(!activeGrades || activeGrades.length === 0) && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                Aucune note active disponible
              </h3>
              <p>
                Cet étudiant n'a pas de notes actives enregistrées pour cette
                période.
                {grades.length > 0 && (
                  <span className="block mt-2 text-sm">
                    ({grades.length} note(s) inactive(s) dans l'historique)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Tableau des notes ACTIVES - SANS EXPANSION */}
          {semesterGrades.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="text-left p-4 font-semibold text-sm">
                      Unités d'Enseignement
                    </th>
                    <th className="text-center p-4 font-semibold text-sm w-24">
                      Note
                    </th>
                    <th className="text-center p-4 font-semibold text-sm w-28">
                      Seuil
                    </th>
                    <th className="text-center p-4 font-semibold text-sm w-32">
                      Statut
                    </th>
                    <th className="text-center p-4 font-semibold text-sm w-16">
                      Crédits
                    </th>
                    <th className="text-center p-4 font-semibold text-sm">
                      Session
                    </th>
                    <th className="text-center p-4 font-semibold text-sm w-20">
                      Historique
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {semesterGrades.map((grade, index) => {
                    if (!grade) return null;

                    const status = getGradeStatus(grade);
                    const statusVariant = getStatusVariant(status);
                    const StatusIcon = getStatusIcon(status);

                    return (
                      <tr
                        key={grade.id || `grade-${index}`}
                        className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="p-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <div className="text-left">
                              <div className="font-medium">
                                {getUETitle(grade)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getUECode(grade)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {grade.grade && Number(grade.grade) > 0 ? (
                            <span
                              className={`font-bold ${
                                status === "Validé"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {getFormattedGrade(grade)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center text-sm text-muted-foreground">
                          {getFormattedPassingGrade(grade)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant={statusVariant as any}
                            className="text-xs flex items-center gap-1 w-fit mx-auto"
                          >
                            {StatusIcon}
                            {status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center text-sm">
                          {getUECredits(grade)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {grade.session || "N/A"}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleViewHistory(grade.ue?.id || grade.ueId)
                            }
                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                            title="Voir l'historique des notes"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : activeGrades && activeGrades.length > 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune note active disponible pour ce semestre</p>
            </div>
          ) : null}

          {/* Résumé en bas */}
          {semesterGrades.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Moyenne du semestre
                  </p>
                  <p className="text-xl font-bold">
                    {stats.average}/{stats.isOutOf20 ? "20" : "100"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Crédits obtenus
                  </p>
                  <p className="text-xl font-bold">
                    {semesterGrades
                      .filter((g) => getGradeStatus(g) === "Validé")
                      .reduce((sum, g) => sum + getUECredits(g), 0)}
                    /
                    {semesterGrades.reduce(
                      (sum, g) => sum + getUECredits(g),
                      0
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Taux de réussite
                  </p>
                  <p className="text-xl font-bold">
                    {stats.total > 0
                      ? Math.round((stats.passed / stats.total) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CORRECTION: Modal d'historique */}
      {showHistoryModal && selectedUEForHistory && (
        <GradeHistoryModal
          enrollment={enrollment}
          student={student}
          ueId={selectedUEForHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedUEForHistory("");
          }}
        />
      )}
    </div>
  );
};
