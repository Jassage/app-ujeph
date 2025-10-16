// components/students/GradeHistoryModal.tsx - Version corrigée
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  X,
  FileText,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  History,
  Clock,
  RefreshCw,
  User,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Student, Enrollment, GradeWithDetails, Grade } from "@/types/academic";
import { useGradeStore } from "@/store/gradeStore";
import { toast } from "sonner";

interface GradeHistoryModalProps {
  enrollment: Enrollment;
  student: Student;
  ueId: string;
  onClose: () => void;
}

export const GradeHistoryModal = ({
  enrollment,
  student,
  ueId,
  onClose,
}: GradeHistoryModalProps) => {
  const { getGradeHistory, grades: allGrades } = useGradeStore();
  const [gradeHistory, setGradeHistory] = useState<GradeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUE, setCurrentUE] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("S1");

  // CORRECTION: Récupérer les semestres disponibles depuis les notes existantes
  const availableSemesters = useMemo(() => {
    const semesters = new Set<string>();
    allGrades.forEach((grade) => {
      if (
        grade.studentId === student.id &&
        grade.ueId === ueId &&
        grade.academicYearId === enrollment.academicYearId
      ) {
        semesters.add(grade.semester);
      }
    });
    return Array.from(semesters).sort();
  }, [allGrades, student.id, ueId, enrollment.academicYearId]);

  // CORRECTION: Charger l'historique avec le semestre sélectionné
  useEffect(() => {
    const loadGradeHistory = async () => {
      if (!selectedSemester) {
        setError("Veuillez sélectionner un semestre");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔍 Loading grade history for:", {
          studentId: student.id,
          ueId,
          academicYearId: enrollment.academicYearId,
          semester: selectedSemester, // Utiliser le semestre sélectionné
        });

        const history = await getGradeHistory(
          student.id,
          ueId,
          enrollment.academicYearId,
          selectedSemester // CORRECTION: Utiliser selectedSemester
        );

        console.log("🔍 History from API:", history);

        if (history && Array.isArray(history)) {
          setGradeHistory(history as GradeWithDetails[]);

          // Trouver les infos de l'UE
          if (history.length > 0 && (history[0] as GradeWithDetails).ue) {
            setCurrentUE((history[0] as GradeWithDetails).ue);
          } else {
            const anyGradeWithUE = allGrades.find(
              (g) => g.ueId === ueId && (g as GradeWithDetails).ue
            );
            if (anyGradeWithUE?.ue) {
              setCurrentUE((anyGradeWithUE as GradeWithDetails).ue);
            }
          }
        } else {
          setGradeHistory([]);
        }
      } catch (error) {
        console.error("❌ Error loading grade history:", error);
        setError("Impossible de charger l'historique des notes");
      } finally {
        setIsLoading(false);
      }
    };

    if (student.id && ueId && enrollment.academicYearId && selectedSemester) {
      loadGradeHistory();
    } else {
      console.error("❌ Missing parameters for history:", {
        studentId: student.id,
        ueId,
        academicYearId: enrollment.academicYearId,
        semester: selectedSemester,
      });
      setIsLoading(false);
    }
  }, [
    student.id,
    ueId,
    enrollment.academicYearId,
    selectedSemester,
    getGradeHistory,
    allGrades,
  ]);

  // CORRECTION: Sélectionner le premier semestre disponible par défaut
  useEffect(() => {
    if (availableSemesters.length > 0 && !selectedSemester) {
      setSelectedSemester(availableSemesters[0]);
    }
  }, [availableSemesters, selectedSemester]);

  // Fonction pour déterminer le statut
  const getGradeStatus = (grade: GradeWithDetails) => {
    if (!grade || (grade.grade === null && grade.grade !== 0))
      return "Non noté";

    const gradeValue = Number(grade.grade);
    const passingGrade =
      grade.ue?.passingGrade || currentUE?.passingGrade || 50;
    const isOutOf20 = passingGrade <= 20;

    if (isOutOf20) {
      if (gradeValue >= passingGrade) return "Validé";
      if (gradeValue >= passingGrade - 3) return "Rattrapage";
      return "Échec";
    } else {
      if (gradeValue >= passingGrade) return "Validé";
      if (gradeValue >= passingGrade - 15) return "Rattrapage";
      return "Échec";
    }
  };

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

  const formatGrade = (grade: GradeWithDetails) => {
    if (!grade?.grade && grade?.grade !== 0) return "-";
    const passingGrade =
      grade.ue?.passingGrade || currentUE?.passingGrade || 50;
    const isOutOf20 = passingGrade <= 20;
    return isOutOf20 ? `${grade.grade}/20` : `${grade.grade}/100`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Déterminer la note actuelle (la plus récente active)
  const currentGrade =
    gradeHistory.find((grade) => grade.isActive !== false) || gradeHistory[0];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Chargement de l'historique...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <History className="h-6 w-6" />
                  Historique des Notes
                </h2>
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
                    {currentUE?.title || "UE inconnue"}
                    {currentUE?.code && (
                      <span className="text-purple-200 ml-2">
                        ({currentUE.code})
                      </span>
                    )}
                  </h3>
                  <p className="text-purple-100">
                    {enrollment.faculty} • {enrollment.level}
                  </p>
                  <p className="text-purple-100 text-sm">
                    {enrollment.academicYear}
                    {/* CORRECTION: Afficher le semestre sélectionné */}
                    {selectedSemester && ` • Semestre ${selectedSemester}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-purple-100 text-sm">
                    ID: {student.studentId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* CORRECTION: Sélecteur de semestre */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
                <label className="font-medium text-sm">Semestre:</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium"
                >
                  <option value="">Sélectionner un semestre</option>
                  {availableSemesters.map((semester) => (
                    <option key={semester} value={semester}>
                      Semestre {semester}
                    </option>
                  ))}
                  {/* Options par défaut si aucun semestre n'est trouvé */}
                  {availableSemesters.length === 0 && (
                    <>
                      <option value="S1">Semestre 1</option>
                      <option value="S2">Semestre 2</option>
                    </>
                  )}
                </select>
              </div>

              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {gradeHistory.length} note(s) trouvée(s)
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Recharger avec les mêmes paramètres
                const load = async () => {
                  setIsLoading(true);
                  try {
                    const history = await getGradeHistory(
                      student.id,
                      ueId,
                      enrollment.academicYearId,
                      selectedSemester
                    );
                    setGradeHistory(history as GradeWithDetails[]);
                  } catch (error) {
                    setError("Erreur lors du rechargement");
                  } finally {
                    setIsLoading(false);
                  }
                };
                load();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          </div>

          {/* Message d'erreur pour semestre manquant */}
          {!selectedSemester && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                      Sélectionnez un semestre pour voir l'historique
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message d'erreur général */}
          {error && selectedSemester && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contenu de l'historique */}
          {selectedSemester && !isLoading && !error && (
            <>
              {/* Statistiques */}
              {gradeHistory.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="text-center p-4">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {gradeHistory.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tentatives
                    </div>
                  </Card>

                  <Card className="text-center p-4">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {
                        gradeHistory.filter((g) => g.session === "Normale")
                          .length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sessions normales
                    </div>
                  </Card>

                  <Card className="text-center p-4">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {
                        gradeHistory.filter((g) => g.session === "Reprise")
                          .length
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reprises
                    </div>
                  </Card>

                  <Card className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {gradeHistory.find((g) => g.isActive !== false)
                        ? formatGrade(
                            gradeHistory.find((g) => g.isActive !== false)!
                          )
                        : "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Note actuelle
                    </div>
                  </Card>
                </div>
              )}

              {/* Historique des notes */}
              {gradeHistory.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Chronologie des notes - Semestre {selectedSemester}
                  </h3>

                  {gradeHistory.map((grade, index) => {
                    const status = getGradeStatus(grade);
                    const statusVariant = getStatusVariant(status);
                    const StatusIcon = getStatusIcon(status);
                    const isCurrent = grade.isActive !== false;
                    const isRetake = grade.session === "Reprise";
                    const isFirst = index === 0;

                    return (
                      <Card
                        key={grade.id}
                        className={`border-l-4 relative ${
                          isCurrent
                            ? "border-l-green-500 bg-green-50/50 dark:bg-green-900/20"
                            : "border-l-gray-300"
                        } ${
                          isFirst ? "ring-2 ring-blue-200" : ""
                        } transition-all hover:shadow-md`}
                      >
                        {isFirst && (
                          <div className="absolute -top-2 -right-2">
                            <Badge variant="default" className="text-xs">
                              Plus récent
                            </Badge>
                          </div>
                        )}

                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  {isCurrent && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Actuelle
                                    </Badge>
                                  )}
                                  {isRetake ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Reprise
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Normale
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={statusVariant as any}
                                    className="text-xs flex items-center gap-1"
                                  >
                                    {StatusIcon}
                                    {status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(grade.createdAt)}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">Note:</span>
                                  <span
                                    className={`text-lg font-bold ${
                                      status === "Validé"
                                        ? "text-green-600"
                                        : status === "Rattrapage"
                                        ? "text-orange-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {formatGrade(grade)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">Session:</span>
                                  <span className="capitalize">
                                    {grade.session}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">Statut:</span>
                                  <span className="capitalize">
                                    {grade.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Active:</span>
                                  <Badge
                                    variant={
                                      grade.isActive !== false
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {grade.isActive !== false ? "Oui" : "Non"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : selectedSemester ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    Aucune note trouvée
                  </h3>
                  <p>
                    Aucune note n'a été enregistrée pour le semestre{" "}
                    {selectedSemester}.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
