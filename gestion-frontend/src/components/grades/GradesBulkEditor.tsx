import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Users,
  BookOpen,
  GraduationCap,
  Save,
  Edit,
  Trash2,
  Calendar,
  Filter,
  Plus,
  Upload,
  Download,
  FileText,
  Table,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ShieldAlert,
  DownloadCloud,
  UploadCloud,
} from "lucide-react";
import { useAcademicStore } from "../../store/studentStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { useFacultyStore } from "@/store/facultyStore";
import { useUEStore } from "@/store/courseStore";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { useCourseAssignmentStore } from "@/store/courseAssignmentStore";
import { useGradeStore } from "@/store/gradeStore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useInitialData } from "@/hooks/useInitialData";

// Types améliorés avec validation
interface GradeEditModalProps {
  student: any;
  ue: any;
  existingGrade: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (grade: number, isRetake: boolean) => void;
  isLoading?: boolean;
}

interface BulkControlsProps {
  selectedCount: number;
  bulkGradeValue: string;
  onApplyGrade: (grade: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Composant de chargement réutilisable
const LoadingSpinner = ({
  message = "Chargement...",
}: {
  message?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-8 space-y-3">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

// Composant d'état vide
const EmptyState = ({
  icon: Icon = BookOpen,
  title,
  description,
}: {
  icon?: any;
  title: string;
  description: string;
}) => (
  <div className="text-center py-12">
    <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
    <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      {description}
    </p>
  </div>
);

// Composant de statistiques amélioré
const StatCard = ({
  icon: Icon,
  value,
  label,
  gradient = "from-blue-100 to-blue-200",
  iconBg = "bg-blue-600",
  darkGradient = "from-blue-900/50 to-blue-800/50",
}: {
  icon: any;
  value: string | number;
  label: string;
  gradient?: string;
  iconBg?: string;
  darkGradient?: string;
}) => (
  <Card
    className={`border-0 shadow-md bg-gradient-to-br ${gradient} dark:${darkGradient} overflow-hidden transition-all hover:shadow-lg`}
  >
    <CardContent className="p-5 relative">
      <div className="absolute top-3 right-3 opacity-20 dark:opacity-10">
        <Icon className="h-8 w-8 text-foreground" />
      </div>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${iconBg} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Modal d'édition amélioré avec validation robuste
const GradeEditModal = ({
  student,
  ue,
  existingGrade,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: GradeEditModalProps) => {
  const [grade, setGrade] = useState(existingGrade?.grade?.toString() || "");
  const [isRetake, setIsRetake] = useState(!!existingGrade);
  const [errors, setErrors] = useState<{ grade?: string }>({});

  useEffect(() => {
    setGrade(existingGrade?.grade?.toString() || "");
    setIsRetake(!!existingGrade);
    setErrors({});
  }, [existingGrade, isOpen]);

  const validateGrade = (value: string): string | null => {
    const numericValue = parseFloat(value);
    if (value.trim() === "") return "La note est requise";
    if (isNaN(numericValue)) return "La note doit être un nombre valide";
    if (numericValue < 0 || numericValue > 100)
      return "La note doit être entre 0 et 100";
    return null;
  };

  const handleGradeChange = (value: string) => {
    setGrade(value);
    const error = validateGrade(value);
    setErrors((prev) => ({ ...prev, grade: error || undefined }));
  };

  const handleSave = () => {
    const gradeError = validateGrade(grade);
    if (gradeError) {
      setErrors({ grade: gradeError });
      toast.error(gradeError);
      return;
    }

    const numericGrade = parseFloat(grade);
    onSave(numericGrade, isRetake);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {existingGrade
              ? isRetake
                ? "Ajouter une note de reprise"
                : "Modifier la note"
              : "Ajouter une note"}
          </DialogTitle>
          <DialogDescription>
            Pour{" "}
            <strong>
              {student.firstName} {student.lastName}
            </strong>{" "}
            - {ue.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-medium">
              Note (/100) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              placeholder="Entrez la note entre 0 et 100"
              className={
                errors.grade
                  ? "border-destructive focus:border-destructive"
                  : ""
              }
              disabled={isLoading}
            />
            {errors.grade && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {errors.grade}
              </p>
            )}
          </div>

          {existingGrade && (
            <>
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="isRetake"
                  checked={isRetake}
                  onChange={(e) => setIsRetake(e.target.checked)}
                  className="rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600"
                  disabled={isLoading}
                />
                <Label htmlFor="isRetake" className="text-sm flex-1">
                  Marquer comme note de reprise (conserve l'ancienne note dans
                  l'historique)
                </Label>
              </div>

              <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-foreground">Note actuelle:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span>Note:</span>
                  <span className="font-medium">{existingGrade.grade}/100</span>
                  <span>Session:</span>
                  <span className="font-medium">{existingGrade.session}</span>
                  <span>Statut:</span>
                  <span className="font-medium">{existingGrade.status}</span>
                </div>
                {isRetake && (
                  <p className="text-amber-600 dark:text-amber-400 font-medium mt-2 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    ⚠️ Une nouvelle note de reprise sera créée
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!errors.grade || isLoading}
            className="min-w-20"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : existingGrade ? (
              isRetake ? (
                "Créer reprise"
              ) : (
                "Modifier"
              )
            ) : (
              "Ajouter"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Contrôles en masse améliorés
const BulkControls = ({
  selectedCount,
  bulkGradeValue,
  onApplyGrade,
  onSave,
  onCancel,
  isLoading = false,
}: BulkControlsProps) => {
  const [localGrade, setLocalGrade] = useState(bulkGradeValue);

  const handleApply = () => {
    if (localGrade.trim()) {
      onApplyGrade(localGrade);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-xl mb-4 flex-wrap border border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
        >
          ✅ {selectedCount} étudiant(s) sélectionné(s)
        </Badge>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="Note (/100)"
          value={localGrade}
          onChange={(e) => setLocalGrade(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-28 h-9 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
          disabled={isLoading}
        />
        <Button
          onClick={handleApply}
          disabled={!localGrade.trim() || isLoading}
          size="sm"
          className="h-9 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Appliquer"
          )}
        </Button>
      </div>

      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          onClick={onCancel}
          size="sm"
          className="h-9 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          onClick={onSave}
          size="sm"
          className="h-9 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 dark:from-green-700 dark:to-teal-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
};

export const GradesBulkEditor = () => {
  useInitialData();
  const { students, fetchStudents } = useAcademicStore();
  const { academicYears } = useAcademicYearStore();
  const { faculties } = useFacultyStore();
  const { ues: allUes } = useUEStore();
  const { enrollments } = useEnrollmentStore();
  const { fetchAssignmentsByFaculty } = useCourseAssignmentStore();
  const { addGrade, updateGrade, grades, recalculateStatus, bulkAddGrades } =
    useGradeStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    facultyId: "",
    level: "1",
    academicYearId: "",
    semester: "S1" as "S1" | "S2",
  });

  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [selectedUE, setSelectedUE] = useState<any>(null);
  const [editingGrade, setEditingGrade] = useState<{
    studentId: string;
    ueId: string;
  } | null>(null);
  const [assignedUEs, setAssignedUEs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkGrades, setBulkGrades] = useState<{ [key: string]: string }>({});
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedAcademicYear = useMemo(() => {
    return academicYears.find((ay) => ay.id === filters.academicYearId);
  }, [filters.academicYearId, academicYears]);

  // Fonction utilitaire pour les messages d'erreur
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return "Une erreur inconnue s'est produite";
  };

  // Chargement initial des données
  useEffect(() => {
    const initializeData = async () => {
      if (faculties.length > 0 && academicYears.length > 0) {
        const currentAcademicYear =
          academicYears.find((ay) => ay.isCurrent) || academicYears[0];
        const defaultFaculty =
          faculties.find((f) => f.status === "Active") || faculties[0];

        if (defaultFaculty && currentAcademicYear) {
          setFilters({
            facultyId: defaultFaculty.id,
            level: "1",
            academicYearId: currentAcademicYear.id,
            semester: "S1",
          });
          setSelectedFaculty(defaultFaculty);
        }
      }
    };

    initializeData();
  }, [faculties, academicYears]);

  // Charger les UE assignées
  useEffect(() => {
    if (filters.facultyId && filters.academicYearId) {
      loadAssignedUEs();
    }
  }, [filters]);

  const loadAssignedUEs = async () => {
    setLoading(true);
    try {
      const assignments = await fetchAssignmentsByFaculty(
        filters.facultyId,
        filters.level,
        filters.academicYearId,
        filters.semester
      );

      const ues = assignments.map((assignment: any) => ({
        ...assignment.ue,
        professor: assignment.professeur,
      }));

      setAssignedUEs(ues);
    } catch (error) {
      console.error("Erreur lors du chargement des UE:", error);
      toast.error("Erreur lors du chargement des cours");
    } finally {
      setLoading(false);
    }
  };

  // Remplacez le useEffect problématique par :
  useEffect(() => {
    const loadGrades = async () => {
      if (filters.academicYearId && filters.semester && selectedUE?.id) {
        try {
          setLoading(true);
          await useGradeStore.getState().fetchGrades({
            academicYear: filters.academicYearId,
            semester: filters.semester,
            ueId: selectedUE.id,
          });
        } catch (error) {
          console.error("Erreur chargement notes:", error);
          toast.error("Erreur lors du chargement des notes");
        } finally {
          setLoading(false);
        }
      }
    };

    loadGrades();
  }, [filters.academicYearId, filters.semester, selectedUE?.id]);

  // Filtrer les étudiants
  const filteredStudents = useMemo(() => {
    let result = students.filter(
      (student) =>
        student.status === "Active" &&
        student.enrollments?.some(
          (enrollment) =>
            enrollment.facultyId === filters.facultyId &&
            enrollment.level === filters.level &&
            enrollment.academicYearId === filters.academicYearId
        )
    );

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (student) =>
          student.firstName.toLowerCase().includes(term) ||
          student.lastName.toLowerCase().includes(term) ||
          student.studentId.toLowerCase().includes(term)
      );
    }

    return result;
  }, [students, filters, searchTerm]);

  // Obtenir une note existante

  const getExistingGrade = (studentId: string, ueId: string) => {
    try {
      const storeGrades = useGradeStore.getState().grades;

      // Vérification robuste que storeGrades est un tableau
      if (!Array.isArray(storeGrades)) {
        console.warn(
          "storeGrades n'est pas un tableau:",
          typeof storeGrades,
          storeGrades
        );
        return undefined;
      }

      const academicYearId = filters.academicYearId;
      const semester = filters.semester;

      // Vérification des paramètres requis
      if (!studentId || !ueId || !academicYearId || !semester) {
        console.warn("Paramètres manquants pour getExistingGrade:", {
          studentId,
          ueId,
          academicYearId,
          semester,
        });
        return undefined;
      }

      const foundGrade = storeGrades.find(
        (grade) =>
          grade &&
          typeof grade === "object" &&
          grade.studentId === studentId &&
          grade.ueId === ueId &&
          grade.academicYearId === academicYearId &&
          grade.semester === semester
      );

      return foundGrade;
    } catch (error) {
      console.error("Erreur dans getExistingGrade:", error);
      return undefined;
    }
  };

  const handleFacultyChange = (facultyId: string) => {
    const faculty = faculties.find((f) => f.id === facultyId);
    setSelectedFaculty(faculty);
    setFilters((prev) => ({ ...prev, facultyId }));
    setSelectedUE(null);
  };

  const handleLevelChange = (level: string) => {
    setFilters((prev) => ({ ...prev, level }));
    setSelectedUE(null);
  };

  // Gestion de la sélection des étudiants
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  // Appliquer une note en masse
  const applyBulkGrade = (gradeValue: string) => {
    const newBulkGrades = { ...bulkGrades };
    selectedStudents.forEach((studentId) => {
      newBulkGrades[studentId] = gradeValue;
    });
    setBulkGrades(newBulkGrades);
  };

  // Sauvegarder les notes en masse
  const saveBulkGrades = async () => {
    if (!selectedUE) {
      toast.error("Veuillez sélectionner une UE");
      return;
    }

    if (!selectedAcademicYear) {
      toast.error("Veuillez sélectionner une année académique");
      return;
    }

    setIsSaving(true);
    const academicYearValue = selectedAcademicYear.id;
    const uePassingGrade = selectedUE.passingGrade;
    let savedCount = 0;
    let errorCount = 0;

    try {
      for (const [studentId, gradeValue] of Object.entries(bulkGrades)) {
        if (gradeValue.trim() === "") continue;

        const grade = parseFloat(gradeValue);
        if (isNaN(grade) || grade < 0 || grade > 100) {
          toast.error(`Note invalide pour l'étudiant ${studentId}`);
          errorCount++;
          continue;
        }

        try {
          const existingGrade = getExistingGrade(studentId, selectedUE.id);
          const status = recalculateStatus(grade, uePassingGrade);
          const isRetake = existingGrade?.session === "Reprise";

          if (existingGrade) {
            await updateGrade(existingGrade.id, {
              grade: grade,
              status: status,
              session: isRetake ? "Reprise" : existingGrade.session,
              studentId: existingGrade.studentId,
              ueId: existingGrade.ueId,
              academicYearId: existingGrade.academicYearId,
              semester: existingGrade.semester,
              level: existingGrade.level,
            });
          } else {
            await addGrade({
              studentId,
              ueId: selectedUE.id,
              grade,
              status,
              session: "Normale",
              semester: filters.semester,
              academicYearId: academicYearValue,
              level: filters.level,
            } as any);
          }
          savedCount++;
        } catch (error) {
          console.error(`Erreur sauvegarde étudiant ${studentId}:`, error);
          errorCount++;
        }
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} notes sauvegardées avec succès`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} erreurs lors de la sauvegarde`);
      }
      if (savedCount === 0 && errorCount === 0) {
        toast.info("Aucune note à sauvegarder");
      }

      setBulkGrades({});
      setBulkEditMode(false);
      setSelectedStudents([]);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Gestion de l'édition individuelle
  // Dans votre composant frontend - S'assurer de la bonne session
  const handleSaveGrade = async (
    studentId: string,
    ueId: string,
    newGrade: number,
    isRetake: boolean
  ) => {
    setIsSaving(true);
    try {
      const academicYearObj = academicYears.find(
        (ay) => ay.id === filters.academicYearId
      );

      if (!academicYearObj) throw new Error("Année académique non trouvée");

      const existingGrade = getExistingGrade(studentId, ueId);
      const status = recalculateStatus(
        newGrade,
        selectedUE?.passingGrade || 10
      );

      if (existingGrade) {
        // CORRECTION: Déterminer la bonne session
        const session = isRetake ? "Reprise" : "Normale";

        // Si c'est une reprise, utiliser updateGrade avec isRetake=true
        if (isRetake) {
          await updateGrade(
            existingGrade.id,
            {
              grade: newGrade,
              status,
            },
            true // isRetake = true
          );
          toast.success("Note de reprise ajoutée avec succès");
        } else {
          // Mise à jour normale
          await updateGrade(
            existingGrade.id,
            {
              grade: newGrade,
              status,
              session: "Normale", // S'assurer que c'est bien "Normale"
            },
            false // isRetake = false
          );
          toast.success("Note modifiée avec succès");
        }
      } else {
        // Nouvelle note - CORRECTION: Déterminer la session
        const session = isRetake ? "Reprise" : "Normale";

        await addGrade({
          studentId,
          ueId,
          grade: newGrade,
          status,
          session, // ← CORRECTION: Utiliser la bonne session
          semester: filters.semester,
          academicYearId: academicYearObj.id,
          level: filters.level,
          isActive: true,
          ue: undefined,
        });

        toast.success(
          `Note ${isRetake ? "de reprise" : ""} ajoutée avec succès`
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setIsSaving(false);
      setEditingGrade(null);
    }
  };

  // Fonction pour gérer les conflits
  const handleGradeConflict = (existingGrade: any, newGradeData: any) => {
    // Ouvrir un modal pour choisir entre :
    // 1. Mettre à jour la note existante
    // 2. Créer une note de reprise
    // 3. Annuler
    console.log("Gérer le conflit:", { existingGrade, newGradeData });

    // Implémentez votre logique de gestion de conflit ici
  };

  // Fonctions d'import/export améliorées
  const handleExportJSON = () => {
    try {
      const dataToExport = grades
        .filter(
          (grade) =>
            (!selectedUE?.id || grade.ueId === selectedUE.id) &&
            (!selectedAcademicYear?.year ||
              grade.academicYearId === selectedAcademicYear.id) &&
            (!filters.semester || grade.semester === filters.semester)
        )
        .map((grade) => {
          const student = students.find((s) => s.id === grade.studentId);
          const ue = allUes.find((u) => u.id === grade.ueId);

          return {
            "Matricule Étudiant": student?.studentId,
            "Nom Étudiant": `${student?.firstName} ${student?.lastName}`,
            "Code UE": ue?.code,
            "Nom UE": ue?.title,
            Note: grade.grade,
            Statut: grade.status,
            Session: grade.session,
            Semestre: grade.semester,
            "Année Académique": grade.academicYearId,
          };
        });

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, `notes-${new Date().toISOString().split("T")[0]}.json`);
      toast.success("Export JSON réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export JSON");
    }
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = grades
        .filter(
          (grade) =>
            (!selectedUE?.id || grade.ueId === selectedUE.id) &&
            (!selectedAcademicYear?.year ||
              grade.academicYearId === selectedAcademicYear.id) &&
            (!filters.semester || grade.semester === filters.semester)
        )
        .map((grade) => {
          const student = students.find((s) => s.id === grade.studentId);
          const ue = allUes.find((u) => u.id === grade.ueId);

          return {
            Matricule: student?.studentId,
            Nom: student?.firstName,
            Prénom: student?.lastName,
            "Code UE": ue?.code,
            UE: ue?.title,
            Note: grade.grade,
            Statut: grade.status,
            Session: grade.session,
            Semestre: grade.semester,
            Année: grade.academicYearId,
            Level: grade.level,
          };
        });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Notes");

      // Auto-size columns
      const colWidths = Object.keys(dataToExport[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...dataToExport.map(
            (row) => String(row[key as keyof typeof row] || "").length
          )
        ),
      }));
      worksheet["!cols"] = colWidths;

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `notes-export-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Export Excel réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export Excel");
    }
  };
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation de la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10MB)");
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (!content) throw new Error("Impossible de lire le fichier");

        let data: any[] = [];

        if (file.name.endsWith(".json")) {
          data = JSON.parse(content as string);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          const workbook = XLSX.read(content, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet);
        } else {
          throw new Error("Format de fichier non supporté");
        }

        await processImportedData(data);
        toast.success("Import réussi");
      } catch (error) {
        console.error("Erreur import:", error);
        toast.error(`Erreur lors de l'import: ${getErrorMessage(error)}`);
      }
    };

    reader.onerror = () => {
      toast.error("Erreur de lecture du fichier");
    };

    if (file.name.endsWith(".json")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processImportedData = async (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Le fichier ne contient pas de données valides");
    }

    const gradesToAdd: any[] = [];
    const gradesToUpdate: any[] = [];
    let skippedCount = 0;

    for (const [index, item] of data.entries()) {
      try {
        const student = students.find(
          (s) =>
            s.studentId === item["Matricule Étudiant"] ||
            s.studentId === item["Matricule"]
        );

        const ue = allUes.find(
          (u) => u.code === item["Code UE"] || u.code === item["Code UE"]
        );

        if (!student || !ue) {
          console.warn(`Ligne ${index + 1}: Étudiant ou UE non trouvé`);
          skippedCount++;
          continue;
        }

        const gradeValue = Number(item["Note"]);
        if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
          console.warn(`Ligne ${index + 1}: Note invalide`);
          skippedCount++;
          continue;
        }

        const gradeData = {
          studentId: student.id,
          ueId: ue.id,
          grade: gradeValue,
          status:
            item["Statut"] ||
            recalculateStatus(gradeValue, ue.passingGrade || 10),
          session: item["Session"] || "Normale",
          semester: item["Semestre"] || filters.semester || "S1",
          academicYearId: item["Année Académique"] || selectedAcademicYear?.id,
          level: filters.level,
        };

        const existingGrade = grades.find(
          (g) =>
            g.studentId === student.id &&
            g.ueId === ue.id &&
            g.academicYearId === gradeData.academicYearId &&
            g.semester === gradeData.semester
        );

        if (existingGrade) {
          gradesToUpdate.push({
            id: existingGrade.id,
            ...gradeData,
          });
        } else {
          gradesToAdd.push(gradeData);
        }
      } catch (error) {
        console.error(`Erreur ligne ${index + 1}:`, error);
        skippedCount++;
      }
    }

    if (gradesToAdd.length > 0) {
      await bulkAddGrades(gradesToAdd);
    }

    for (const grade of gradesToUpdate) {
      await updateGrade(grade.id, grade);
    }

    toast.success(
      `${gradesToAdd.length} notes ajoutées, ${
        gradesToUpdate.length
      } notes mises à jour${
        skippedCount > 0 ? `, ${skippedCount} lignes ignorées` : ""
      }`
    );
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Matricule Étudiant": "STU20250001",
        "Code UE": "MATH101",
        Note: 15.5,
        Session: "Normale",
        Semestre: "S1",
        "Année Académique": selectedAcademicYear?.year || "2024-2025",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Auto-size columns
    const colWidths = Object.keys(template[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...template.map((row) => String(row[key as keyof typeof row]).length)
      ),
    }));
    worksheet["!cols"] = colWidths;

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "template-import-notes.xlsx");
    toast.info("Template téléchargé");
  };

  const getLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      1: "1ère Année",
      2: "2ème Année",
      3: "3ème Année",
      4: "4ème Année",
      5: "5ème Année",
    };
    return levels[level] || level;
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950/30 min-h-screen">
      {/* Header avec import/export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-blue-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📊 Édition des Notes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des notes par faculté, niveau et année académique
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json,.xlsx,.xls"
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="bg-white dark:bg-gray-700 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/50"
          >
            <DownloadCloud className="h-4 w-4 mr-1" />
            Template
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            className="bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            <UploadCloud className="h-4 w-4 mr-1" />
            Importer
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="bg-white dark:bg-gray-700 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/50"
          >
            <FileText className="h-4 w-4 mr-1" />
            JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="bg-white dark:bg-gray-700 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50"
          >
            <Table className="h-4 w-4 mr-1" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Filtres
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Faculté */}
              <div className="space-y-2">
                <Label htmlFor="faculty" className="text-sm font-medium">
                  Faculté
                </Label>
                <Select
                  value={filters.facultyId}
                  onValueChange={handleFacultyChange}
                >
                  <SelectTrigger
                    id="faculty"
                    className="h-10 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
                  >
                    <SelectValue placeholder="Sélectionner une faculté" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Niveau */}
              <div className="space-y-2">
                <Label htmlFor="level" className="text-sm font-medium">
                  Niveau
                </Label>
                <Select value={filters.level} onValueChange={handleLevelChange}>
                  <SelectTrigger
                    id="level"
                    className="h-10 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
                  >
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {getLevelLabel(level.toString())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Année académique */}
              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-sm font-medium">
                  Année académique
                </Label>
                <Select
                  value={filters.academicYearId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, academicYearId: value }))
                  }
                >
                  <SelectTrigger
                    id="academicYear"
                    className="h-10 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
                  >
                    <SelectValue placeholder="Sélectionner une année" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                        {year.isCurrent && " (En cours)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Semestre */}
              <div className="space-y-2">
                <Label htmlFor="semester" className="text-sm font-medium">
                  Semestre
                </Label>
                <Select
                  value={filters.semester}
                  onValueChange={(value: "S1" | "S2") =>
                    setFilters((prev) => ({ ...prev, semester: value }))
                  }
                >
                  <SelectTrigger
                    id="semester"
                    className="h-10 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
                  >
                    <SelectValue placeholder="Sélectionner un semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S1">Semestre 1</SelectItem>
                    <SelectItem value="S2">Semestre 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          value={selectedAcademicYear?.year || "N/A"}
          label="Année académique"
          gradient="from-blue-100 to-blue-200"
          darkGradient="from-blue-900/50 to-blue-800/50"
        />
        <StatCard
          icon={Users}
          value={filteredStudents.length}
          label="Étudiants"
          gradient="from-green-100 to-green-200"
          iconBg="bg-green-600"
          darkGradient="from-green-900/50 to-green-800/50"
        />
        <StatCard
          icon={BookOpen}
          value={assignedUEs.length}
          label="Cours assignés"
          gradient="from-purple-100 to-purple-200"
          iconBg="bg-purple-600"
          darkGradient="from-purple-900/50 to-purple-800/50"
        />
        <StatCard
          icon={GraduationCap}
          value={
            selectedUE
              ? filteredStudents.filter((s) =>
                  getExistingGrade(s.id, selectedUE.id)
                ).length
              : 0
          }
          label="Notes saisies"
          gradient="from-amber-100 to-amber-200"
          iconBg="bg-amber-600"
          darkGradient="from-amber-900/50 to-amber-800/50"
        />
      </div>

      {/* UE à évaluer */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-indigo-800 dark:text-indigo-200">
            Choisissez le Cours à évaluer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner message="Chargement des cours assignés..." />
          ) : assignedUEs.length > 0 ? (
            <Select
              value={selectedUE?.id || ""}
              onValueChange={(value) => {
                const ue = assignedUEs.find((u) => u.id === value);
                setSelectedUE(ue);
              }}
            >
              <SelectTrigger className="h-11 border-indigo-300 dark:border-indigo-700 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700">
                <SelectValue placeholder="Sélectionner une UE" />
              </SelectTrigger>
              <SelectContent>
                {assignedUEs.map((ue) => (
                  <SelectItem key={ue.id} value={ue.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {ue.code} - {ue.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ue.professor?.firstName} {ue.professor?.lastName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Aucun cours assigné"
              description="Aucun cours n'est assigné pour les critères sélectionnés. Veuillez ajuster les filtres."
            />
          )}
        </CardContent>
      </Card>

      {/* Informations sur la sélection */}
      {selectedFaculty && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="text-xs bg-white/20 text-white border-white/30">
                  {getLevelLabel(filters.level)}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs bg-white/10 text-white border-white/30"
                >
                  {filters.semester === "S1" ? "1ère Session" : "2ème Session"}
                </Badge>
                {selectedUE && (
                  <Badge className="text-xs bg-amber-500/20 text-amber-100 border-amber-400/30">
                    {selectedUE.code}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold">{selectedFaculty.name}</h2>
              <div className="flex items-center gap-6 mt-2 flex-wrap text-sm">
                <div>
                  <p className="text-indigo-200">Année académique</p>
                  <p className="font-semibold">
                    {selectedAcademicYear?.year || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-200">Étudiants inscrits</p>
                  <p className="font-semibold">{filteredStudents.length}</p>
                </div>
                {selectedUE && (
                  <div>
                    <p className="text-indigo-200">Notes saisies</p>
                    <p className="font-semibold">
                      {
                        filteredStudents.filter((s) =>
                          getExistingGrade(s.id, selectedUE.id)
                        ).length
                      }
                      /{filteredStudents.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des étudiants */}
      {selectedUE && filteredStudents.length > 0 && (
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {selectedUE.title} ({selectedUE.code})
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredStudents.length} étudiant(s) - Seuil de validation:{" "}
                  {selectedUE.passingGrade}/100
                </p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9 h-10 w-[200px] border-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {!bulkEditMode ? (
                  <Button
                    onClick={() => setBulkEditMode(true)}
                    className="h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-700 dark:to-purple-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Édition en masse
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={selectAllStudents}
                      className="h-10 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      {selectedStudents.length === filteredStudents.length
                        ? "Tout désélectionner"
                        : "Tout sélectionner"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Contrôles d'édition en masse */}
            {bulkEditMode && (
              <BulkControls
                selectedCount={selectedStudents.length}
                bulkGradeValue={Object.values(bulkGrades)[0] || ""}
                onApplyGrade={applyBulkGrade}
                onSave={saveBulkGrades}
                onCancel={() => {
                  setBulkEditMode(false);
                  setSelectedStudents([]);
                  setBulkGrades({});
                }}
                isLoading={isSaving}
              />
            )}

            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const existingGrade = getExistingGrade(
                  student.id,
                  selectedUE.id
                );
                const isSelected = selectedStudents.includes(student.id);
                const bulkGradeValue = bulkGrades[student.id] || "";

                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-sm"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    {/* Checkbox pour la sélection en masse */}
                    {bulkEditMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700"
                      />
                    )}

                    <div className="flex-1 ml-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {student.studentId}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {bulkEditMode ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="Note"
                          value={bulkGradeValue}
                          onChange={(e) =>
                            setBulkGrades((prev) => ({
                              ...prev,
                              [student.id]: e.target.value,
                            }))
                          }
                          className="w-20 h-9 text-sm border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700"
                        />
                      ) : existingGrade ? (
                        <div className="text-right">
                          <Badge
                            className={
                              existingGrade.status === "Valid_"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"
                                : existingGrade.status === "Non_valid_"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700"
                            }
                          >
                            {existingGrade.grade}/100
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {existingGrade.status} ({existingGrade.session})
                          </p>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                        >
                          Non noté
                        </Badge>
                      )}

                      {!bulkEditMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditingGrade({
                              studentId: student.id,
                              ueId: selectedUE.id,
                            })
                          }
                          className="h-9 w-9 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* État vide quand aucun étudiant */}
      {selectedUE && filteredStudents.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun étudiant trouvé"
          description={
            searchTerm
              ? "Aucun étudiant ne correspond à votre recherche. Essayez d'autres termes."
              : "Aucun étudiant n'est inscrit pour les critères sélectionnés."
          }
        />
      )}

      {/* Modal d'édition */}
      {editingGrade && selectedUE && (
        <GradeEditModal
          student={students.find((s) => s.id === editingGrade.studentId)}
          ue={selectedUE}
          existingGrade={getExistingGrade(
            editingGrade.studentId,
            editingGrade.ueId
          )}
          isOpen={!!editingGrade}
          onClose={() => setEditingGrade(null)}
          onSave={(grade, isRetake) =>
            handleSaveGrade(
              editingGrade.studentId,
              editingGrade.ueId,
              grade,
              isRetake
            )
          }
          isLoading={isSaving}
        />
      )}
    </div>
  );
};
