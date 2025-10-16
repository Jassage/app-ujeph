import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Download,
  Users,
  BookOpen,
  BarChart3,
  Award,
  TrendingUp,
  Target,
  Crown,
  FileText,
  ChevronDown,
  Sparkles,
  School,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ShieldAlert,
  RefreshCw,
  BookMarked,
  UserCog,
} from "lucide-react";
import { useAcademicStore } from "@/store/studentStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { useFacultyStore } from "@/store/facultyStore";
import { useUEStore } from "@/store/courseStore";
import { useGradeStore } from "@/store/gradeStore";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { useAuthStore } from "@/store/authStore";
import { useCourseAssignmentStore } from "@/store/courseAssignmentStore";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UE } from "@/types/academic";

// Composant de statistiques
const DeanStatCard = ({
  icon: Icon,
  value,
  label,
  description,
  gradient = "from-blue-500/10 to-indigo-500/10",
  borderColor = "border-blue-200",
}: {
  icon: any;
  value: string | number;
  label: string;
  description?: string;
  gradient?: string;
  borderColor?: string;
}) => (
  <Card
    className={cn(
      "border-2 bg-gradient-to-br backdrop-blur-sm",
      gradient,
      borderColor
    )}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-sm">
              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {label}
            </p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Indicateur de note
const GradeIndicator = ({
  grade,
  passingGrade = 70,
}: {
  grade: number;
  passingGrade?: number;
}) => {
  const percentage = (grade / 100) * 100;
  const isPassing = grade >= passingGrade;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{grade}/100</span>
          <span
            className={cn(
              "font-semibold",
              isPassing ? "text-green-600" : "text-red-600"
            )}
          >
            {isPassing ? "Validé" : "Non validé"}
          </span>
        </div>
        <Progress
          value={percentage}
          className={cn("h-2", isPassing ? "bg-green-100" : "bg-red-100")}
        />
      </div>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Page {currentPage} sur {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};

export const DeanGradesView = () => {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    initialize,
  } = useAuthStore();
  const { toast } = useToast();
  const { students } = useAcademicStore();
  const { academicYears } = useAcademicYearStore();
  const { faculties } = useFacultyStore();
  const { ues: allUes } = useUEStore();
  const { grades, fetchGrades } = useGradeStore();
  const { enrollments } = useEnrollmentStore();

  // Utilisation du store d'affectations
  const {
    assignments,
    fetchAssignmentsByFaculty,
    loading: assignmentsLoading,
  } = useCourseAssignmentStore();

  const [filters, setFilters] = useState({
    level: "all",
    academicYearId: "",
    semester: "S1" as "S1" | "S2",
  });

  const [selectedUE, setSelectedUE] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Initialisation de l'authentification
  useEffect(() => {
    console.log("🔄 Initialisation de l'authentification...");
    initialize();
  }, [initialize]);

  // Recherche de la faculté du doyen
  const deanFaculty = useMemo(() => {
    if (authLoading) return null;
    if (!user?.id) return null;
    if (!faculties.length) return null;

    // Méthode principale : Recherche par deanId
    const facultyByDeanId = faculties.find((f) => f.deanId === user.id);
    if (facultyByDeanId) {
      console.log("✅ Faculté trouvée par deanId:", facultyByDeanId.name);
      return facultyByDeanId;
    }

    // Méthode secondaire : Si l'user a un facultyId direct
    if (user.facultyId) {
      const facultyById = faculties.find((f) => f.id === user.facultyId);
      if (facultyById) return facultyById;
    }

    return null;
  }, [faculties, user, authLoading]);

  // Chargement initial des données
  useEffect(() => {
    const loadInitialData = async () => {
      if (!deanFaculty || authLoading) return;

      console.log("🚀 Chargement des données initiales...");
      setLoading(true);

      try {
        // Charger les affectations si nécessaire
        if (filters.academicYearId && filters.level !== "all") {
          await loadAssignments();
        }

        // Charger les notes si une UE est sélectionnée
        if (selectedUE) {
          await loadGrades();
        }

        console.log("✅ Données initiales chargées");
      } catch (error) {
        console.error("❌ Erreur chargement données initiales:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [deanFaculty, authLoading, filters.academicYearId, filters.level]);

  // AJOUTEZ CE DEBUG DANS DeanGradesView
  useEffect(() => {
    console.log("🔍 DEBUG DES DONNÉES UE:", {
      totalUEs: allUes.length,
      assignmentsCount: assignments.length,
      facultyId: deanFaculty?.id,
      ueIdsInAssignments: [...new Set(assignments.map((a) => a.ueId))],
      ueIdsInAllUes: allUes.map((ue) => ue.id),
      matchingUEs: allUes.filter((ue) =>
        assignments.some(
          (a) => a.ueId === ue.id && a.facultyId === deanFaculty?.id
        )
      ).length,
    });

    // Vérifier l'UE spécifique de l'affectation
    if (assignments.length > 0) {
      const assignment = assignments[0];
      console.log("📋 Détail de l'affectation:", {
        ueId: assignment.ueId,
        ueInAllUes: allUes.find((ue) => ue.id === assignment.ueId),
        ueData: assignment.ue, // Vérifier si l'UE est incluse dans l'affectation
      });
    }
  }, [allUes, assignments, deanFaculty]);

  // Initialisation des filtres
  useEffect(() => {
    if (
      deanFaculty &&
      academicYears.length > 0 &&
      !initialized &&
      !authLoading
    ) {
      const currentAcademicYear =
        academicYears.find((ay) => ay.isCurrent) || academicYears[0];

      setFilters((prev) => ({
        ...prev,
        academicYearId: currentAcademicYear?.id || "",
      }));
      setInitialized(true);
      console.log("✅ Filtres initialisés pour la faculté:", deanFaculty.name);
    }
  }, [deanFaculty, academicYears, initialized, authLoading]);

  // Chargement des affectations pour la faculté du doyen
  useEffect(() => {
    if (
      deanFaculty &&
      filters.academicYearId &&
      filters.semester &&
      filters.level !== "all"
    ) {
      loadAssignments();
    }
  }, [deanFaculty, filters.academicYearId, filters.semester, filters.level]);

  const getAssignmentsByFilters = useCallback(
    (filters: {
      facultyId?: string;
      level?: string;
      academicYearId?: string;
      semester?: string;
      ueId?: string;
    }) => {
      console.log("🔍 Filtrage des assignments avec:", filters);

      const filtered = assignments.filter((assignment) => {
        // Debug chaque assignment
        const matches = {
          facultyId:
            !filters.facultyId || assignment.facultyId === filters.facultyId,
          level: !filters.level || assignment.level === filters.level,
          academicYearId:
            !filters.academicYearId ||
            assignment.academicYearId === filters.academicYearId,
          semester:
            !filters.semester || assignment.semester === filters.semester,
          ueId: !filters.ueId || assignment.ueId === filters.ueId,
        };

        const isMatch = Object.values(matches).every(Boolean);

        if (isMatch) {
          console.log("✅ Assignment correspondant:", {
            id: assignment.id,
            ueId: assignment.ueId,
            ue: assignment.ue,
            level: assignment.level,
            facultyId: assignment.facultyId,
          });
        }

        return isMatch;
      });

      console.log("📋 Résultat du filtrage:", filtered.length, "assignments");
      return filtered;
    },
    [assignments]
  );
  const loadAssignments = async () => {
    if (
      !deanFaculty ||
      !filters.academicYearId ||
      !filters.semester ||
      filters.level === "all"
    ) {
      console.log("⏸️  Paramètres manquants pour charger les affectations");
      return;
    }

    try {
      console.log("📚 Chargement des affectations pour:", {
        faculty: deanFaculty.name,
        facultyId: deanFaculty.id,
        level: filters.level,
        academicYear: filters.academicYearId,
        semester: filters.semester,
      });

      const assignmentsData = await fetchAssignmentsByFaculty(
        deanFaculty.id,
        filters.level,
        filters.academicYearId,
        filters.semester
      );

      console.log(
        "✅ Affectations chargées avec succès:",
        assignmentsData.length
      );

      if (assignmentsData.length === 0) {
        console.log("ℹ️  Aucune affectation trouvée pour ces critères");
      }
    } catch (error) {
      console.error("❌ Erreur chargement affectations:", error);

      // CORRECTION : Afficher un toast plus informatif
      toast({
        title: "Information sur les affectations",
        description:
          "Aucune affectation trouvée ou erreur de chargement. Les UE affichées sont celles de la faculté.",
        variant: "default",
      });
    }
  };

  // DEBUG des structures de données
  useEffect(() => {
    console.log("🔍 ANALYSE DES DONNÉES:", {
      // Faculté
      deanFaculty: deanFaculty,

      // Étudiants
      studentsSample: students.slice(0, 2).map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        status: s.status,
      })),

      // Inscriptions
      enrollmentsSample: enrollments.slice(0, 3).map((e) => ({
        id: e.id,
        studentId: e.studentId,
        faculty: e.faculty,
        level: e.level,
        academicYearId: e.academicYearId,
      })),

      // Structure complète d'une inscription
      firstEnrollment: enrollments[0]
        ? {
            ...enrollments[0],
            facultyType: typeof enrollments[0].faculty,
            facultyValue: enrollments[0].faculty,
          }
        : null,
    });
  }, [deanFaculty, students, enrollments]);

  // CORRECTION pour les UE
  const facultyUEs = useMemo(() => {
    if (!deanFaculty) return [];

    console.log("🔄 Extraction des UE pour la faculté:", deanFaculty.name);

    // Méthode directe : utiliser les UE qui ont le bon facultyId
    const directUEs = allUes.filter((ue) => {
      const matches = ue.facultyId === deanFaculty.id;
      if (matches) {
        console.log("✅ UE directe:", ue.title);
      }
      return matches;
    });

    // Méthode via les affectations
    const uesFromAssignments = assignments
      .map((assignment) => {
        const matchesFilters =
          assignment.facultyId === deanFaculty.id &&
          (!filters.level ||
            filters.level === "all" ||
            assignment.level === filters.level) &&
          (!filters.academicYearId ||
            assignment.academicYearId === filters.academicYearId) &&
          (!filters.semester || assignment.semester === filters.semester);

        if (matchesFilters && assignment.ue) {
          console.log("✅ UE via affectation:", assignment.ue.title);
          return assignment.ue;
        }
        return null;
      })
      .filter((ue): ue is UE => ue !== null)
      .filter(
        (ue, index, self) => index === self.findIndex((u) => u.id === ue.id)
      );

    const result = [...directUEs, ...uesFromAssignments];
    console.log("🎯 UE finales:", result.length, result);
    return result;
  }, [allUes, assignments, deanFaculty, filters]);

  // Charger les notes quand une UE est sélectionnée
  useEffect(() => {
    if (selectedUE?.id && filters.academicYearId && deanFaculty) {
      console.log("🔄 Chargement des notes pour UE:", selectedUE.title);
      loadGrades();
    }
  }, [selectedUE?.id, filters.academicYearId, filters.semester, deanFaculty]);

  // Sélection automatique de la première UE quand elles sont chargées
  useEffect(() => {
    if (facultyUEs.length > 0 && !selectedUE) {
      const firstUE = facultyUEs[0];
      setSelectedUE(firstUE);
      console.log("🎯 UE sélectionnée automatiquement:", firstUE.title);
    }
  }, [facultyUEs, selectedUE]);

  const loadGrades = useCallback(async () => {
    if (!selectedUE?.id || !filters.academicYearId) return;

    setLoading(true);
    setError(null);
    try {
      await fetchGrades({
        academicYear: filters.academicYearId,
        semester: filters.semester,
        ueId: selectedUE.id,
      });
      console.log("✅ Notes chargées avec succès");
    } catch (error) {
      const errorMessage = "Impossible de charger les notes";
      console.error("❌ Erreur chargement notes:", error);
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    selectedUE?.id,
    filters.academicYearId,
    filters.semester,
    fetchGrades,
    toast,
  ]);

  // Filtrer les étudiants de la faculté du doyen - VERSION CORRIGÉE
  const facultyStudents = useMemo(() => {
    if (!deanFaculty || !Array.isArray(enrollments)) return [];

    console.log("🎯 Filtrage des étudiants pour:", deanFaculty.name);
    console.log("📊 Données disponibles:", {
      totalStudents: students.length,
      totalEnrollments: enrollments.length,
      deanFacultyId: deanFaculty.id,
      deanFacultyName: deanFaculty.name,
    });

    const filteredStudents = students.filter((student) => {
      // Vérifier que l'étudiant est actif
      if (student.status !== "Active") {
        console.log(`❌ Étudiant ${student.id} non actif`);
        return false;
      }

      // Trouver les inscriptions de cet étudiant
      const studentEnrollments = enrollments.filter(
        (enrollment) => enrollment.studentId === student.id
      );

      console.log(
        `📝 Étudiant ${student.id}: ${studentEnrollments.length} inscriptions`
      );

      // Vérifier si au moins une inscription correspond aux critères
      const hasValidEnrollment = studentEnrollments.some((enrollment) => {
        // CORRECTION : Comparer avec le NOM de la faculté au lieu de l'ID
        let facultyIdentifier: string | undefined;

        if (enrollment.faculty == null) {
          console.log(`❌ Inscription ${enrollment.id} sans faculté`);
          return false;
        }

        if (typeof enrollment.faculty === "object") {
          facultyIdentifier =
            (enrollment.faculty as any).name || (enrollment.faculty as any).id;
        } else {
          facultyIdentifier = enrollment.faculty;
        }

        // CORRECTION : Comparer avec le nom de la faculté
        const matchesFaculty =
          facultyIdentifier === deanFaculty.name ||
          facultyIdentifier === deanFaculty.id;
        const matchesLevel =
          filters.level === "all" || enrollment.level === filters.level;
        const matchesYear =
          !filters.academicYearId ||
          enrollment.academicYearId === filters.academicYearId;

        console.log(`🔍 Vérification inscription ${enrollment.id}:`, {
          facultyIdentifier,
          deanFacultyName: deanFaculty.name,
          deanFacultyId: deanFaculty.id,
          matchesFaculty,
          enrollmentLevel: enrollment.level,
          filterLevel: filters.level,
          matchesLevel,
          enrollmentYear: enrollment.academicYearId,
          filterYear: filters.academicYearId,
          matchesYear,
        });

        return matchesFaculty && matchesLevel && matchesYear;
      });

      if (hasValidEnrollment) {
        console.log(
          `✅ Étudiant ${student.firstName} ${student.lastName} inclus`
        );
      } else {
        console.log(
          `❌ Étudiant ${student.firstName} ${student.lastName} exclus - aucune inscription valide`
        );
      }

      return hasValidEnrollment;
    });

    console.log(
      "👥 Étudiants filtrés:",
      filteredStudents.length,
      filteredStudents
    );
    return filteredStudents;
  }, [
    students,
    enrollments,
    deanFaculty,
    filters.academicYearId,
    filters.level,
  ]);

  // Filtrer avec la recherche
  const filteredStudents = useMemo(() => {
    let result = facultyStudents;

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
  }, [facultyStudents, searchTerm]);

  // Pagination des étudiants
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, selectedUE]);

  // Obtenir une note existante
  const getExistingGrade = useCallback(
    (studentId: string, ueId: string) => {
      try {
        if (!Array.isArray(grades)) return undefined;

        const grade = grades.find(
          (grade) =>
            grade &&
            typeof grade === "object" &&
            grade.studentId === studentId &&
            grade.ueId === ueId &&
            grade.academicYearId === filters.academicYearId &&
            grade.semester === filters.semester
        );

        return grade;
      } catch (error) {
        console.error("❌ Erreur dans getExistingGrade:", error);
        return undefined;
      }
    },
    [grades, filters.academicYearId, filters.semester]
  );

  // Fonction : Obtenir le professeur assigné à une UE
  const getAssignedProfessor = useCallback(
    (ueId: string) => {
      if (!assignments.length) return null;

      const assignment = assignments.find(
        (a) =>
          a.ueId === ueId &&
          a.facultyId === deanFaculty?.id &&
          a.level === filters.level &&
          a.academicYearId === filters.academicYearId &&
          a.semester === filters.semester
      );

      return assignment?.professeur || null;
    },
    [assignments, deanFaculty, filters]
  );

  // Calcul des statistiques amélioré avec les affectations
  const stats = useMemo(() => {
    if (!selectedUE) return null;

    const studentsWithGrades = filteredStudents.filter((s) =>
      getExistingGrade(s.id, selectedUE.id)
    );

    const gradesList = studentsWithGrades
      .map((s) => getExistingGrade(s.id, selectedUE.id)?.grade)
      .filter(
        (grade): grade is number => grade !== undefined && grade !== null
      );

    const averageGrade =
      gradesList.length > 0
        ? gradesList.reduce((sum, grade) => sum + grade, 0) / gradesList.length
        : 0;

    const passingStudents = studentsWithGrades.filter((s) => {
      const grade = getExistingGrade(s.id, selectedUE.id);
      return grade && grade.status === "Valid_";
    }).length;

    const successRate =
      studentsWithGrades.length > 0
        ? (passingStudents / studentsWithGrades.length) * 100
        : 0;

    // Nouvelle stat : Professeur assigné
    const assignedProfessor = getAssignedProfessor(selectedUE.id);

    // Statistiques de répartition des notes
    const gradesBelow10 = studentsWithGrades.filter((s) => {
      const grade = getExistingGrade(s.id, selectedUE.id);
      return grade && grade.grade < 10;
    }).length;

    const grades10to12 = studentsWithGrades.filter((s) => {
      const grade = getExistingGrade(s.id, selectedUE.id);
      return grade && grade.grade >= 10 && grade.grade < 12;
    }).length;

    const grades12to14 = studentsWithGrades.filter((s) => {
      const grade = getExistingGrade(s.id, selectedUE.id);
      return grade && grade.grade >= 12 && grade.grade < 14;
    }).length;

    const gradesAbove14 = studentsWithGrades.filter((s) => {
      const grade = getExistingGrade(s.id, selectedUE.id);
      return grade && grade.grade >= 14;
    }).length;

    return {
      totalStudents: filteredStudents.length,
      studentsWithGrades: studentsWithGrades.length,
      averageGrade: Math.round(averageGrade * 100) / 100,
      successRate: Math.round(successRate),
      passingStudents,
      excellentStudents: studentsWithGrades.filter((s) => {
        const grade = getExistingGrade(s.id, selectedUE.id);
        return grade && grade.grade >= 16;
      }).length,
      assignedProfessor,
      hasAssignment: !!assignedProfessor,
      gradesBelow10,
      grades10to12,
      grades12to14,
      gradesAbove14,
    };
  }, [filteredStudents, selectedUE, getExistingGrade, getAssignedProfessor]);

  const toggleStudentExpansion = useCallback((studentId: string) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  }, []);

  const exportResults = useCallback(() => {
    if (!selectedUE || !stats) {
      toast({
        title: "Action impossible",
        description: "Veuillez sélectionner une UE d'abord",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = [
        "Nom",
        "Prénom",
        "Matricule",
        "Note",
        "Statut",
        "UE",
        "Semestre",
        "Professeur",
      ];
      const assignedProfessor = getAssignedProfessor(selectedUE.id);
      const professorName = assignedProfessor
        ? `${assignedProfessor.firstName} ${assignedProfessor.lastName}`
        : "Non assigné";

      const csvData = filteredStudents.map((student) => {
        const grade = getExistingGrade(student.id, selectedUE.id);
        return [
          student.lastName,
          student.firstName,
          student.studentId,
          grade?.grade || "Non noté",
          grade?.status?.replace("_", " ") || "En attente",
          selectedUE.title,
          filters.semester,
          professorName,
        ];
      });

      const csvContent = [headers, ...csvData]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notes-${selectedUE.code}-${filters.semester}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Les données ont été exportées en CSV",
      });
    } catch (error) {
      console.error("❌ Erreur d'export:", error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  }, [
    selectedUE,
    stats,
    filteredStudents,
    getExistingGrade,
    filters.semester,
    getAssignedProfessor,
    toast,
  ]);

  const getGradeColor = useCallback((grade: number) => {
    if (grade >= 16)
      return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    if (grade >= 14)
      return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    if (grade >= 12)
      return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  }, []);

  const getGradeStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "Valid_":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Non_valid_":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  }, []);

  // États de chargement combinés
  const isLoading = authLoading || loading || assignmentsLoading;

  // Affichage des états de chargement et erreurs
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Chargement...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Initialisation de votre session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session expirée
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Votre session a expiré ou vous n'êtes pas connecté.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => (window.location.href = "/login")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Se connecter
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!deanFaculty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <Crown className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accès restreint
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous n'êtes pas assigné comme doyen d'une faculté.
          </p>

          {/* Informations de debug */}
          <div className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm mb-4">
            <p>
              <strong>User ID:</strong> {user?.id}
            </p>
            <p>
              <strong>Nom:</strong> {user?.firstName} {user?.lastName}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Rôle:</strong> {user?.role}
            </p>
            <p>
              <strong>Faculté ID:</strong> {user?.facultyId || "Aucune"}
            </p>
            <p>
              <strong>Facultés disponibles:</strong> {faculties.length}
            </p>
            <p>
              <strong>Authentifié:</strong> {isAuthenticated ? "Oui" : "Non"}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Tableau de Bord des Notes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Consultation des résultats - {deanFaculty.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {facultyStudents.length} étudiants • {facultyUEs.length} UE
              disponibles
              {assignments.length > 0 &&
                ` • ${assignments.length} affectations`}
            </p>
          </div>
        </div>

        <Button
          onClick={exportResults}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter les résultats
        </Button>
      </div>

      {/* Bannière information doyen */}
      <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Doyen de la Faculté des {deanFaculty.name}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Accès aux notes et aux informations d'affectation des cours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card className="border-2 border-blue-100 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Filter className="h-5 w-5" />
            Filtres de consultation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Année académique */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Année académique</Label>
              <Select
                value={filters.academicYearId}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, academicYearId: value }))
                }
              >
                <SelectTrigger className="border-blue-200 dark:border-blue-700">
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
              <Label className="text-sm font-medium">Semestre</Label>
              <Select
                value={filters.semester}
                onValueChange={(value: "S1" | "S2") =>
                  setFilters((prev) => ({ ...prev, semester: value }))
                }
              >
                <SelectTrigger className="border-blue-200 dark:border-blue-700">
                  <SelectValue placeholder="Sélectionner un semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">Semestre 1</SelectItem>
                  <SelectItem value="S2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Niveau */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Niveau</Label>
              <Select
                value={filters.level}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger className="border-blue-200 dark:border-blue-700">
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="1">Licence 1</SelectItem>
                  <SelectItem value="2">Licence 2</SelectItem>
                  <SelectItem value="3">Licence 3</SelectItem>
                  <SelectItem value="4">Licence 4</SelectItem>
                  <SelectItem value="5">Licence 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* UE */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Unité d'Enseignement
              </Label>
              <Select
                value={selectedUE?.id || ""}
                onValueChange={(value) => {
                  const ue = facultyUEs.find((u) => u.id === value);
                  setSelectedUE(ue);
                  console.log("🎯 UE sélectionnée:", ue?.title);
                }}
                disabled={facultyUEs.length === 0}
              >
                <SelectTrigger className="border-blue-200 dark:border-blue-700">
                  <SelectValue
                    placeholder={
                      facultyUEs.length === 0
                        ? "Chargement des UE..."
                        : "Sélectionner une UE"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {facultyUEs.map((ue) => (
                    <SelectItem key={ue.id} value={ue.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ue.code}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            - {ue.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getAssignedProfessor(ue.id) && (
                            <UserCog className="h-3 w-3 text-green-600" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {ue.credits} crédits
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Messages d'information */}
              {facultyUEs.length === 0 && (
                <p className="text-xs text-amber-600">
                  Aucune Cours disponible pour les critères sélectionnés
                </p>
              )}
              {facultyUEs.length > 0 && (
                <p className="text-xs text-green-600">
                  {facultyUEs.length} UE(s) disponible(s)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section : Informations d'affectation */}
      {selectedUE && stats && (
        <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookMarked className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    {selectedUE.code} - {selectedUE.title}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {stats.hasAssignment ? (
                      <span>
                        Enseigné par{" "}
                        <strong>
                          {stats.assignedProfessor?.firstName}{" "}
                          {stats.assignedProfessor?.lastName}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-amber-600">
                        Aucun professeur assigné
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Badge
                variant={stats.hasAssignment ? "default" : "secondary"}
                className={
                  stats.hasAssignment
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }
              >
                {stats.hasAssignment ? "Assigné" : "Non assigné"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques principales */}
      {selectedUE && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DeanStatCard
            icon={Users}
            value={stats.totalStudents}
            label="Étudiants inscrits"
            description="Total dans la sélection"
            gradient="from-blue-500/10 to-indigo-500/10"
            borderColor="border-blue-200"
          />
          <DeanStatCard
            icon={UserCheck}
            value={stats.studentsWithGrades}
            label="Notes saisies"
            description={`${Math.round(
              (stats.studentsWithGrades / stats.totalStudents) * 100
            )}% de complétion`}
            gradient="from-green-500/10 to-emerald-500/10"
            borderColor="border-green-200"
          />
          <DeanStatCard
            icon={Target}
            value={`${stats.averageGrade}/20`}
            label="Moyenne générale"
            description="Moyenne de tous les étudiants"
            gradient="from-purple-500/10 to-pink-500/10"
            borderColor="border-purple-200"
          />
          <DeanStatCard
            icon={Award}
            value={`${stats.successRate}%`}
            label="Taux de réussite"
            description={`${stats.passingStudents} étudiants validés`}
            gradient="from-amber-500/10 to-orange-500/10"
            borderColor="border-amber-200"
          />
        </div>
      )}

      {/* Statistiques de répartition des notes */}
      {selectedUE && stats && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition des notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {stats.gradesBelow10}
                </div>
                <div className="text-sm text-red-500">{"< 25/100"}</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.grades10to12}
                </div>
                <div className="text-sm text-yellow-500">25-50/100</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.grades12to14}
                </div>
                <div className="text-sm text-blue-500">50-75/100</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.gradesAbove14}
                </div>
                <div className="text-sm text-green-500">{"> 75/100"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recherche */}
      {selectedUE && (
        <Card className="border-2 border-indigo-100 dark:border-indigo-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un étudiant par nom, prénom ou matricule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-indigo-200 dark:border-indigo-700"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredStudents.length} étudiant(s) trouvé(s)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des étudiants */}
      {selectedUE && paginatedStudents.length > 0 && (
        <div className="space-y-4">
          {paginatedStudents.map((student) => {
            const existingGrade = getExistingGrade(student.id, selectedUE.id);
            const isExpanded = expandedStudent === student.id;

            return (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={cn(
                    "border-2 transition-all hover:shadow-lg cursor-pointer",
                    isExpanded
                      ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700"
                  )}
                >
                  <CardContent className="p-0">
                    {/* En-tête de la carte */}
                    <div
                      className="p-6"
                      onClick={() => toggleStudentExpansion(student.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md">
                            <UserCheck className="h-6 w-6 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {student.firstName} {student.lastName}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {student.studentId}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <School className="h-3 w-3" />
                                Niveau{" "}
                                {student.enrollments?.[0]?.level || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Note principale */}
                          {existingGrade ? (
                            <div className="text-right">
                              <Badge
                                className={cn(
                                  "text-lg px-3 py-2",
                                  getGradeColor(existingGrade.grade)
                                )}
                              >
                                {existingGrade.grade}/100
                              </Badge>
                              <div className="flex items-center gap-1 mt-1 justify-end">
                                {getGradeStatusIcon(existingGrade.status)}
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {existingGrade.status?.replace("_", " ") ||
                                    "En attente"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-gray-500 border-gray-300"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Non noté
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Détails expansibles */}
                    <AnimatePresence>
                      {isExpanded && existingGrade && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Détails de la note */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Détails de l'évaluation
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Cours:
                                    </span>
                                    <p className="font-medium">
                                      {selectedUE.code} - {selectedUE.title}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Session:
                                    </span>
                                    <p className="font-medium">
                                      {existingGrade.session}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Semestre:
                                    </span>
                                    <p className="font-medium">
                                      {filters.semester}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Statut:
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {getGradeStatusIcon(existingGrade.status)}
                                      <span className="font-medium capitalize">
                                        {existingGrade.status?.replace(
                                          "_",
                                          " "
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Indicateur de performance */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  Performance
                                </h4>
                                <GradeIndicator
                                  grade={existingGrade.grade}
                                  passingGrade={selectedUE.passingGrade || 70}
                                />
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Seuil de validation:{" "}
                                  {selectedUE.passingGrade || 70}/100
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* États vides */}
      {!selectedUE && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sélectionnez une Cours
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              Choisissez un Cours dans la liste pour consulter les notes des
              étudiants.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedUE && filteredStudents.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun étudiant trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              {searchTerm
                ? "Aucun étudiant ne correspond à votre recherche. Essayez d'autres termes."
                : "Aucun étudiant n'est inscrit pour les critères sélectionnés."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Indicateur de chargement */}
      {isLoading && (
        <Card className="border-2 border-blue-200 dark:border-blue-700">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chargement des données...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <Card className="border-2 border-red-200 dark:border-red-700">
          <CardContent className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-6 w-6" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
