import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Eye,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  BarChart3,
  Award,
  TrendingUp,
  Target,
  Crown,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  School,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useAcademicStore } from "@/store/studentStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { useFacultyStore } from "@/store/facultyStore";
import { useUEStore } from "@/store/courseStore";
import { useGradeStore } from "@/store/gradeStore";
import { useAuthStore } from "@/store/userStore";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Composant de statistiques pour doyen
const DeanStatCard = ({
  icon: Icon,
  value,
  label,
  description,
  trend,
  gradient = "from-blue-500/10 to-indigo-500/10",
  borderColor = "border-blue-200",
}: {
  icon: any;
  value: string | number;
  label: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
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
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              <TrendingUp
                className={cn("h-3 w-3", !trend.isPositive && "rotate-180")}
              />
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Composant de note avec indicateur visuel
const GradeIndicator = ({
  grade,
  passingGrade = 10,
}: {
  grade: number;
  passingGrade?: number;
}) => {
  const percentage = (grade / 20) * 100;
  const isPassing = grade >= passingGrade;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{grade}/20</span>
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

export const DeanGradesView = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { students } = useAcademicStore();
  const { academicYears } = useAcademicYearStore();
  const { faculties } = useFacultyStore();
  const { ues: allUes } = useUEStore();
  const { grades, fetchGrades } = useGradeStore();

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

  // Trouver la faculté du doyen - version plus robuste
  const deanFaculty = useMemo(() => {
    if (!user?.id || !faculties.length) return null;

    // Plusieurs façons de trouver la faculté du doyen
    const faculty = faculties.find(
      (f) => f.deanId === user.id // selon votre structure
    );

    console.log("Faculté trouvée pour le doyen:", faculty);
    return faculty;
  }, [faculties, user]);

  const selectedAcademicYear = useMemo(() => {
    return academicYears.find((ay) => ay.id === filters.academicYearId);
  }, [filters.academicYearId, academicYears]);

  // Initialisation des filtres - version améliorée
  useEffect(() => {
    if (deanFaculty && academicYears.length > 0 && !initialized) {
      const currentAcademicYear =
        academicYears.find((ay) => ay.isCurrent) ||
        academicYears[academicYears.length - 1]; // dernière année si pas de courant

      setFilters((prev) => ({
        ...prev,
        academicYearId: currentAcademicYear?.id || academicYears[0]?.id || "",
      }));
      setInitialized(true);
    }
  }, [deanFaculty, academicYears, initialized]);

  // Charger les notes - avec meilleure gestion des conditions
  useEffect(() => {
    if (selectedUE?.id && filters.academicYearId && deanFaculty) {
      loadGrades();
    }
  }, [selectedUE?.id, filters.academicYearId, filters.semester, deanFaculty]);

  const loadGrades = async () => {
    if (!selectedUE?.id || !filters.academicYearId) return;

    setLoading(true);
    try {
      await fetchGrades({
        academicYear: filters.academicYearId,
        semester: filters.semester,
        ueId: selectedUE.id,
      });
    } catch (error) {
      console.error("Erreur chargement notes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les étudiants de la faculté du doyen - version plus robuste
  const facultyStudents = useMemo(() => {
    if (!deanFaculty) return [];

    return students.filter((student) => {
      // Vérifier que l'étudiant est actif
      if (student.status !== "Active") return false;

      // Vérifier les inscriptions
      const enrollments = student.enrollments || [];
      return enrollments.some((enrollment) => {
        const matchesFaculty = enrollment.facultyId === deanFaculty.id;
        const matchesLevel =
          filters.level === "all" || enrollment.level === filters.level;
        const matchesYear =
          enrollment.academicYearId === filters.academicYearId;

        return matchesFaculty && matchesLevel && matchesYear;
      });
    });
  }, [students, deanFaculty, filters]);

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

  // UE de la faculté du doyen
  const facultyUEs = useMemo(() => {
    if (!deanFaculty) return [];
    return allUes.filter((ue) => ue.facultyId === deanFaculty.id);
  }, [allUes, deanFaculty]);

  // Obtenir une note existante
  const getExistingGrade = (studentId: string, ueId: string) => {
    try {
      if (!Array.isArray(grades)) return undefined;

      return grades.find(
        (grade) =>
          grade &&
          typeof grade === "object" &&
          grade.studentId === studentId &&
          grade.ueId === ueId &&
          grade.academicYearId === filters.academicYearId &&
          grade.semester === filters.semester
      );
    } catch (error) {
      console.error("Erreur dans getExistingGrade:", error);
      return undefined;
    }
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!selectedUE) return null;

    const studentsWithGrades = filteredStudents.filter((s) =>
      getExistingGrade(s.id, selectedUE.id)
    );

    const gradesList = studentsWithGrades
      .map((s) => getExistingGrade(s.id, selectedUE.id)?.grade)
      .filter(Boolean) as number[];

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
    };
  }, [filteredStudents, selectedUE, grades, filters]);

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const exportResults = () => {
    toast({
      title: "Export en cours",
      description: "Préparation du fichier d'export...",
    });
    // Implémentez l'export ici
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 16)
      return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    if (grade >= 14)
      return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    if (grade >= 12)
      return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  };

  const getGradeStatusIcon = (status: string) => {
    switch (status) {
      case "Valid_":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Non_valid_":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  if (!deanFaculty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <Crown className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous n'êtes pas assigné comme doyen d'une faculté.
          </p>

          {/* Informations de debug */}
          <div className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm">
            <p>
              <strong>User ID:</strong> {user?.id}
            </p>
            <p>
              <strong>Nombre de facultés:</strong> {faculties.length}
            </p>
            <p>
              <strong>Facultés disponibles:</strong>
            </p>
            <ul className="list-disc list-inside">
              {faculties.map((f) => (
                <li key={f.id}>
                  {f.name} (Dean: {f.deanId})
                </li>
              ))}
            </ul>
          </div>

          <Button className="mt-4" onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
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
              Consultation des résultats de votre faculté - {deanFaculty.name}
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
                Mode consultation seule
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                En tant que doyen, vous avez un accès en lecture seule aux notes
                de votre faculté.
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
                  <SelectItem value="1">1ère année</SelectItem>
                  <SelectItem value="2">2ème année</SelectItem>
                  <SelectItem value="3">3ème année</SelectItem>
                  <SelectItem value="4">4ème année</SelectItem>
                  <SelectItem value="5">5ème année</SelectItem>
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
                }}
              >
                <SelectTrigger className="border-blue-200 dark:border-blue-700">
                  <SelectValue placeholder="Sélectionner une UE" />
                </SelectTrigger>
                <SelectContent>
                  {facultyUEs.map((ue) => (
                    <SelectItem key={ue.id} value={ue.id}>
                      {ue.code} - {ue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
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
      {selectedUE && filteredStudents.length > 0 && (
        <div className="space-y-4">
          {filteredStudents.map((student) => {
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
                              {/* <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Inscrit depuis{" "}
                                {new Date(student.enrollments?.enrollmentDate).getFullYear()}
                              </span> */}
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
                                {existingGrade.grade}/20
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
                                      UE:
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
                                  passingGrade={selectedUE.passingGrade || 10}
                                />
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Seuil de validation:{" "}
                                  {selectedUE.passingGrade || 10}/20
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
        </div>
      )}

      {/* États vides */}
      {!selectedUE && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sélectionnez une UE
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              Choisissez une unité d'enseignement dans la liste pour consulter
              les notes des étudiants.
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
      {loading && (
        <Card className="border-2 border-blue-200 dark:border-blue-700">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chargement des notes...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
