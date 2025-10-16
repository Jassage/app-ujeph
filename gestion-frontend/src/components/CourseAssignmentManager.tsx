import { useState, useEffect } from "react";
import { useCourseAssignmentStore } from "../store/courseAssignmentStore";
import { useFacultyStore } from "../store/facultyStore";
import {
  BookOpen,
  Edit,
  Filter,
  Plus,
  School,
  Search,
  Trash2,
  Users,
  Calendar,
  UserCheck,
  Target,
  BarChart3,
  Sparkles,
  RotateCcw,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Bookmark,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  BookOpenCheck,
  Moon,
  Sun,
  Laptop,
  Building,
  GraduationCap,
  FileText,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { useProfessorStore } from "@/store/professorStore";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useUEStore } from "@/store/courseStore";
import { toast } from "./ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { useInitialData } from "@/hooks/useInitialData";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export const CourseAssignmentManager = () => {
  useInitialData();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    assignments,
    loading,
    error,
    fetchAssignmentsByFaculty,
    fetchUeByFacultyAndLevel,
    addAssignment,
    deleteAssignment,
  } = useCourseAssignmentStore();

  const { faculties, fetchFaculties } = useFacultyStore();
  const { academicYears, fetchAcademicYears } = useAcademicYearStore();
  const { professors, fetchProfessors } = useProfessorStore();
  const { ues: allUes, fetchUEs } = useUEStore();
  const { fetchEnrollments } = useEnrollmentStore();

  const [filters, setFilters] = useState({
    facultyId: "",
    level: "1",
    academicYearId: "",
    semester: "S1" as "S1" | "S2",
  });

  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [ues, setUes] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNewAssignmentOpen, setIsNewAssignmentOpen] = useState(false);
  const [selectedUe, setSelectedUe] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    ueId: "",
    professorId: "",
    academicYearId: "",
    semester: "S1" as "S1" | "S2",
    facultyId: "",
    level: "1",
  });
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionAssignments, setSessionAssignments] = useState<{
    S1: any[];
    S2: any[];
  }>({ S1: [], S2: [] });
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (faculties.length > 0 && academicYears.length > 0 && !isInitialized) {
      const currentAcademicYear =
        academicYears.find((ay) => ay.isCurrent) || academicYears[0];
      const defaultFaculty =
        faculties.find((f) => f.status === "Active") || faculties[0];

      if (defaultFaculty && currentAcademicYear) {
        setFilters((prev) => ({
          ...prev,
          facultyId: defaultFaculty.id,
          academicYearId: currentAcademicYear.id,
        }));

        setSelectedFaculty(defaultFaculty);
        setIsInitialized(true);
      }
    }
  }, [faculties, academicYears, isInitialized]);

  useEffect(() => {
    if (
      isInitialized &&
      filters.facultyId &&
      filters.level &&
      filters.academicYearId
    ) {
      fetchAssignmentsByFaculty(
        filters.facultyId,
        filters.level,
        filters.academicYearId,
        filters.semester
      );
      if (professors.length === 0) {
        fetchProfessors();
      }
      fetchUeData();
      fetchEnrollments();
      loadSessionAssignments();
    }
  }, [filters, isInitialized, fetchAssignmentsByFaculty]);

  const loadSessionAssignments = async () => {
    if (filters.facultyId && filters.level && filters.academicYearId) {
      setLoadingSessions(true);
      try {
        const s1Assignments = await fetchAssignmentsByFaculty(
          filters.facultyId,
          filters.level,
          filters.academicYearId,
          "S1"
        );

        const s2Assignments = await fetchAssignmentsByFaculty(
          filters.facultyId,
          filters.level,
          filters.academicYearId,
          "S2"
        );

        setSessionAssignments({
          S1: s1Assignments || [],
          S2: s2Assignments || [],
        });
      } catch (error) {
        console.error("Erreur chargement sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    }
  };

  const confirmDeleteAssignment = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      await deleteAssignment(assignmentToDelete);

      toast({
        title: "✅ Affectation supprimée",
        description: "L'affectation a été supprimée avec succès",
      });

      if (filters.facultyId && filters.academicYearId) {
        fetchAssignmentsByFaculty(
          filters.facultyId,
          filters.level,
          filters.academicYearId,
          filters.semester
        );
        loadSessionAssignments();
      }
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const getUesForSession = (session: "S1" | "S2") => {
    return sessionAssignments[session].map((assignment: any) => ({
      ...assignment.ue,
      professor: assignment.professeur,
      assignmentId: assignment.id,
      assignmentData: assignment,
    }));
  };

  const fetchUeData = async () => {
    if (filters.facultyId && filters.level) {
      const uesData = await fetchUeByFacultyAndLevel(
        filters.facultyId,
        filters.level
      );
      setUes(uesData);
    }
  };

  const handleFacultyChange = (facultyId: string) => {
    const faculty = faculties.find((f) => f.id === facultyId);
    setSelectedFaculty(faculty);
    setFilters((prev) => ({ ...prev, facultyId }));
    if (filters.academicYearId) {
      fetchAssignmentsByFaculty(
        facultyId,
        filters.level,
        filters.academicYearId,
        filters.semester
      );
      fetchUeData();
      loadSessionAssignments();
    }
  };

  const handleOpenAssignmentForm = (ue: any) => {
    setSelectedUe(ue);
    const existingAssignment = assignments.find(
      (a) => a.ueId === ue.id && a.semester === filters.semester
    );

    setFormData({
      ueId: ue.id,
      professorId: existingAssignment?.professeurId || "",
      academicYearId:
        existingAssignment?.academicYearId || filters.academicYearId,
      semester: existingAssignment?.semester || filters.semester,
      facultyId: existingAssignment?.facultyId || filters.facultyId,
      level: existingAssignment?.level || filters.level,
    });
    setIsFormOpen(true);
  };

  const handleOpenNewAssignmentForm = () => {
    const defaultAcademicYear =
      academicYears.find((ay) => ay.isCurrent) || academicYears[0];

    setFormData({
      ueId: "",
      professorId: "",
      academicYearId: defaultAcademicYear?.id || "",
      semester: "S1",
      facultyId: "",
      level: "1",
    });
    setIsNewAssignmentOpen(true);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAssignment({
        facultyId: formData.facultyId,
        level: formData.level,
        status: "Active",
        ueId: formData.ueId,
        professeurId: formData.professorId,
        academicYearId: formData.academicYearId,
        semester: formData.semester,
      });
      setIsFormOpen(false);
      setIsNewAssignmentOpen(false);

      if (filters.facultyId && filters.academicYearId) {
        fetchAssignmentsByFaculty(
          filters.facultyId,
          filters.level,
          filters.academicYearId,
          filters.semester
        );
      }

      toast({
        title: "✅ Affectation créée",
        description: "L'affectation a été créée avec succès",
      });
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive",
      });
    }
  };

  const getLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      "1": "1ère année",
      "2": "2ème année",
      "3": "3ème année",
      "4": "4ème année",
      "5": "5ème année",
    };
    return levels[level] || `${level}ème année`;
  };

  const filteredUes = allUes.filter(
    (ue) =>
      ue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ue.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportData = () => {
    toast({
      title: "📤 Export réussi",
      description: "Les données d'affectation ont été exportées",
    });
  };

  const handleImportData = () => {
    toast({
      title: "📥 Import à venir",
      description: "La fonctionnalité d'import sera disponible prochainement",
    });
  };

  const handleRefreshData = () => {
    loadSessionAssignments();
    toast({
      title: "🔄 Données actualisées",
      description: "Les affectations ont été mises à jour",
    });
  };

  // Calculer les statistiques
  const totalAssigned =
    sessionAssignments.S1.length + sessionAssignments.S2.length;
  const totalUes = ues.length;
  const assignmentRate =
    totalUes > 0 ? (totalAssigned / (totalUes * 2)) * 100 : 0;

  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">
            Chargement des affectations...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">Erreur: {error}</div>
        <Button onClick={loadSessionAssignments} variant="outline">
          Réessayer
        </Button>
      </div>
    );

  if (
    (faculties.length === 0 || academicYears.length === 0) &&
    !isInitialized
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <RotateCcw className="h-8 w-8 animate-spin text-primary mr-3" />
        <span>Chargement des données...</span>
      </div>
    );
  }

  if (faculties.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucune faculté disponible
            </h3>
            <p className="text-muted-foreground">
              Veuillez d'abord créer des facultés dans le système
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (academicYears.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucune année académique disponible
            </h3>
            <p className="text-muted-foreground">
              Veuillez d'abord configurer les années académiques
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Composant pour un item de cours en liste
  const CourseListItem = ({
    ue,
    session,
  }: {
    ue: any;
    session: "S1" | "S2";
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-md transition-all">
      <div className="flex items-center gap-4 flex-1">
        <div
          className={cn(
            "p-2 rounded-lg",
            ue.professor
              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
              : "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
          )}
        >
          <BookOpen className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-lg truncate">{ue.title}</h3>
            <Badge variant="outline" className="font-mono">
              {ue.code}
            </Badge>
          </div>

          {/* <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {ue.credits} crédits
            </span>
            <span>•</span>
            <Badge
              variant={ue.type === "Obligatoire" ? "default" : "secondary"}
            >
              {ue.type}
            </Badge>
            <span>•</span>
            <Badge variant="outline">
              {session === "S1" ? "Session I" : "Session II"}
            </Badge>
          </div>

          {ue.professor && (
            <div className="flex items-center gap-2 mt-2">
              <UserCheck className="h-3 w-3 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                {ue.professor.firstName} {ue.professor.lastName}
              </span>
            </div>
          )} */}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {ue.professor ? (
          <>
            <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300">
              Affecté
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenAssignmentForm(ue)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => confirmDeleteAssignment(ue.assignmentId)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Badge variant="secondary">Non affecté</Badge>
            <Button
              size="sm"
              onClick={() => handleOpenAssignmentForm(ue)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Affecter
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              Gestion des Affectations
            </h1>
            <p className="text-muted-foreground">
              Affectation des cours aux professeurs par faculté et niveau
            </p>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions groupées</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exporter les données
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportData} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importer des affectations
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRefreshData} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Actualiser les données
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleOpenNewAssignmentForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle affectation
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total Cours
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {totalUes}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <BookOpen className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Cours Affectés
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {totalAssigned}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <UserCheck className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950/20 dark:to-amber-900/20 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Taux d'Affectation
                  </p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {assignmentRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-200 dark:bg-amber-800">
                  <BarChart3 className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                </div>
              </div>
              <Progress value={assignmentRate} className="h-2 mt-4" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/20 dark:to-purple-900/20 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Professeurs
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {professors.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <Users className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle>Filtres de Recherche</CardTitle>
              </div>
              <div className="text-sm text-muted-foreground">
                {ues.length} cours disponibles
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculté</Label>
                <Select
                  value={filters.facultyId}
                  onValueChange={handleFacultyChange}
                >
                  <SelectTrigger id="faculty">
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

              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Select
                  value={filters.level}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1ère année</SelectItem>
                    <SelectItem value="2">2ème année</SelectItem>
                    <SelectItem value="3">3ème année</SelectItem>
                    <SelectItem value="4">4ème année</SelectItem>
                    <SelectItem value="5">5ème année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Année académique</Label>
                <Select
                  value={filters.academicYearId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, academicYearId: value }))
                  }
                >
                  <SelectTrigger id="academicYear">
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

              <div className="space-y-2">
                <Label htmlFor="semester">Semestre</Label>
                <Select
                  value={filters.semester}
                  onValueChange={(value: "S1" | "S2") =>
                    setFilters((prev) => ({ ...prev, semester: value }))
                  }
                >
                  <SelectTrigger id="semester">
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
        </Card>

        {/* Contenu principal */}
        {selectedFaculty && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar autres facultés */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    Autres Facultés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {faculties
                    .filter((f) => f.id !== selectedFaculty.id)
                    .map((faculty) => (
                      <button
                        key={faculty.id}
                        onClick={() => handleFacultyChange(faculty.id)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors flex items-center gap-3"
                      >
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="font-medium">{faculty.name}</span>
                      </button>
                    ))}
                </CardContent>
              </Card>

              {/* Informations sur la faculté sélectionnée */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Niveau
                    </span>
                    <Badge variant="secondary">
                      {getLevelLabel(filters.level)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Année</span>
                    <span className="font-medium">
                      {academicYears.find(
                        (ay) => ay.id === filters.academicYearId
                      )?.year || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Cours
                    </span>
                    <span className="font-medium">{ues.length}</span>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Voir les détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bloc catalogue */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  {/* En-tête faculté */}
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge
                          variant="outline"
                          className="mb-2 bg-primary text-primary-foreground"
                        >
                          LICENCE
                        </Badge>
                        <h2 className="text-2xl font-bold">
                          {selectedFaculty.name}
                        </h2>
                        <p className="text-muted-foreground mt-1">
                          {selectedFaculty.description ||
                            "Gestion des unités d'enseignement"}
                        </p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg border">
                        <div className="text-2xl font-bold text-primary">
                          {totalAssigned}/{ues.length * 2}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Cours affectés
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Année Académique
                        </div>
                        <div className="font-semibold">
                          {academicYears.find(
                            (ay) => ay.id === filters.academicYearId
                          )?.year || "N/A"}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Niveau
                        </div>
                        <div className="font-semibold">
                          {getLevelLabel(filters.level)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Statut
                        </div>
                        <div className="font-semibold text-green-600">
                          Actif
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs sessions - LISTE SIMPLIFIÉE */}
                  <Tabs defaultValue="S1" className="w-full">
                    <TabsList className="grid grid-cols-2 mb-6">
                      <TabsTrigger
                        value="S1"
                        className="flex items-center gap-2"
                      >
                        <Bookmark className="h-4 w-4" />
                        Session I (S1)
                        <Badge variant="secondary" className="ml-2">
                          {sessionAssignments.S1.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="S2"
                        className="flex items-center gap-2"
                      >
                        <Bookmark className="h-4 w-4" />
                        Session II (S2)
                        <Badge variant="secondary" className="ml-2">
                          {sessionAssignments.S2.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>

                    {["S1", "S2"].map((session) => (
                      <TabsContent
                        key={session}
                        value={session}
                        className="space-y-3"
                      >
                        {getUesForSession(session as "S1" | "S2").length > 0 ? (
                          <div className="space-y-3">
                            {getUesForSession(session as "S1" | "S2").map(
                              (ue) => (
                                <CourseListItem
                                  key={ue.assignmentId || ue.id}
                                  ue={ue}
                                  session={session as "S1" | "S2"}
                                />
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                              Aucune matière affectée
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              Aucune unité d'enseignement n'a été affectée pour
                              cette session.
                            </p>
                            <Button
                              onClick={() => handleOpenNewAssignmentForm()}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Ajouter une affectation
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Dialogues modaux */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Confirmer la suppression
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement cette affectation de
                cours. Cette action ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAssignment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog nouvelle affectation */}
        <Dialog
          open={isNewAssignmentOpen}
          onOpenChange={setIsNewAssignmentOpen}
        >
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Nouvelle affectation de cours</DialogTitle>
              <DialogDescription>
                Recherchez un cours et assignez-le à un professeur
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAssignment} className="space-y-6">
              <div className="space-y-4">
                <Label>Rechercher un cours</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou code de cours..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchTerm && (
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                    {filteredUes.length > 0 ? (
                      filteredUes.map((ue) => (
                        <div
                          key={ue.id}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer transition-colors"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              ueId: ue.id,
                              facultyId: ue.facultyId,
                              level: ue.level,
                            }));
                            setSelectedUe(ue);
                          }}
                        >
                          <div>
                            <div className="font-medium">{ue.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {ue.code} • {ue.credits} crédits
                            </div>
                          </div>
                          {formData.ueId === ue.id && (
                            <Badge variant="default">Sélectionné</Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        Aucun cours trouvé
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.ueId && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-faculty">Faculté *</Label>
                      <Select
                        value={formData.facultyId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, facultyId: value })
                        }
                        required
                      >
                        <SelectTrigger id="new-faculty">
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

                    <div className="space-y-2">
                      <Label htmlFor="new-level">Niveau *</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) =>
                          setFormData({ ...formData, level: value })
                        }
                        required
                      >
                        <SelectTrigger id="new-level">
                          <SelectValue placeholder="Sélectionner un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1ère année</SelectItem>
                          <SelectItem value="2">2ème année</SelectItem>
                          <SelectItem value="3">3ème année</SelectItem>
                          <SelectItem value="4">4ème année</SelectItem>
                          <SelectItem value="5">5ème année</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-professor">Professeur *</Label>
                      <Select
                        value={formData.professorId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, professorId: value })
                        }
                        required
                      >
                        <SelectTrigger id="new-professor">
                          <SelectValue placeholder="Sélectionner un professeur" />
                        </SelectTrigger>
                        <SelectContent>
                          {professors
                            .filter((p) => p.status === "Actif")
                            .map((professor) => (
                              <SelectItem
                                key={professor.id}
                                value={professor.id}
                              >
                                {professor.firstName} {professor.lastName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Année académique *</Label>
                      <Select
                        value={formData.academicYearId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, academicYearId: value })
                        }
                        required
                      >
                        <SelectTrigger id="academicYear">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-semester">Semestre *</Label>
                      <Select
                        value={formData.semester}
                        onValueChange={(value: "S1" | "S2") =>
                          setFormData({ ...formData, semester: value })
                        }
                        required
                      >
                        <SelectTrigger id="new-semester">
                          <SelectValue placeholder="Sélectionner un semestre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S1">Semestre 1</SelectItem>
                          <SelectItem value="S2">Semestre 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewAssignmentOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !formData.ueId ||
                    !formData.professorId ||
                    !formData.academicYearId
                  }
                >
                  Créer l'affectation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog modification affectation */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedUe
                  ? `Modifier l'affectation - ${selectedUe.title}`
                  : "Modifier l'affectation"}
              </DialogTitle>
              <DialogDescription>
                Modifier le professeur assigné à ce cours
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAssignment} className="space-y-6">
              {selectedUe && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="font-medium">{selectedUe.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedUe.code} • {selectedUe.credits} crédits
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="professor">Professeur *</Label>
                <Select
                  value={formData.professorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, professorId: value })
                  }
                  required
                >
                  <SelectTrigger id="professor">
                    <SelectValue placeholder="Sélectionner un professeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors
                      .filter((p) => p.status === "Actif")
                      .map((professor) => (
                        <SelectItem key={professor.id} value={professor.id}>
                          {professor.firstName} {professor.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semestre *</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value: "S1" | "S2") =>
                      setFormData({ ...formData, semester: value })
                    }
                    required
                  >
                    <SelectTrigger id="semester">
                      <SelectValue placeholder="Sélectionner un semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S1">Semestre 1</SelectItem>
                      <SelectItem value="S2">Semestre 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Année académique *</Label>
                  <Select
                    value={formData.academicYearId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, academicYearId: value })
                    }
                    required
                  >
                    <SelectTrigger id="academicYear">
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
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={!formData.professorId}>
                  Modifier l'affectation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
