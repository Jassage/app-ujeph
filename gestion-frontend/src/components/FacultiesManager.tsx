import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Building2,
  Edit,
  Trash2,
  Users,
  BookOpen,
  ChevronRight,
  School,
  Calendar,
  UserCog,
  Loader2,
  BarChart3,
  Target,
  Sparkles,
  Filter,
  MoreHorizontal,
  Download,
  Upload,
  RotateCcw,
  Eye,
  GraduationCap,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  User,
  Mail,
  Crown,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initializeFacultyStore, useFacultyStore } from "../store/facultyStore";
import { FacultyWithLevels } from "../types/academic";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { useUEStore } from "@/store/courseStore";
import { useAcademicStore } from "@/store/studentStore";
import { useCourseAssignmentStore } from "@/store/courseAssignmentStore";
import { useAuthStore } from "@/store/userStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export const FacultiesManager = () => {
  const {
    faculties,
    loading,
    error,
    fetchFaculties,
    addFaculty,
    updateFaculty,
    deleteFaculty,
    getFacultyStats,
    updateStudentCounts,
    updateCourseCountsFromAssignments,
    recalculateAllStats,
    reset,
  } = useFacultyStore();

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] =
    useState<FacultyWithLevels | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    dean: "",
    deanId: "",
    studyDuration: 3,
    status: "Active" as "Active" | "Inactive",
  });
  const [stats, setStats] = useState<any>(null);
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { enrollments } = useEnrollmentStore();
  const { assignments } = useCourseAssignmentStore();
  const [potentialDeans, setPotentialDeans] = useState<any[]>([]);
  const { fetchPotentialDeans, user } = useAuthStore();

  // Chargement initial
  useEffect(() => {
    initializeFacultyStore();
    loadStats();
  }, []);

  useEffect(() => {
    if (isFormOpen) {
      loadPotentialDeans();
    }
  }, [isFormOpen]);

  useEffect(() => {
    if (enrollments.length > 0) {
      updateStudentCounts(enrollments);
    }
  }, [enrollments, updateStudentCounts]);

  useEffect(() => {
    if (assignments.length > 0) {
      updateCourseCountsFromAssignments(assignments);
    }
  }, [assignments, updateCourseCountsFromAssignments]);

  const loadPotentialDeans = async () => {
    try {
      const deans = await fetchPotentialDeans();
      console.log(deans);

      setPotentialDeans(deans);
    } catch (error) {
      console.error("Erreur chargement des doyens:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des doyens",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getFacultyStats();
      setStats(statsData);
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  const handleResetCache = () => {
    reset();
    localStorage.removeItem("faculty-storage");
    sessionStorage.clear();
    toast({
      title: "Cache réinitialisé",
      description: "Toutes les données en cache ont été supprimées",
    });
    fetchFaculties();
    loadStats();
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    fetchFaculties({ search: searchTerm });
  };

  const handleFilterByStatus = (status: string) => {
    setStatusFilter(status);
    fetchFaculties({ status: status === "all" ? undefined : status });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Champs manquants",
        description: "Le nom et le code sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedFaculty) {
        await updateFaculty(selectedFaculty.id, formData);
        toast({
          title: "Faculté mise à jour",
          description: "La faculté a été modifiée avec succès",
        });
      } else {
        await addFaculty(formData);
        toast({
          title: "Faculté créée",
          description: "La nouvelle faculté a été créée avec succès",
        });
      }
      setIsFormOpen(false);
      resetForm();
      recalculateAllStats();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description:
          error.response?.data?.message ||
          error.message ||
          "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      dean: "",
      deanId: "",
      studyDuration: 3,
      status: "Active",
    });
    setSelectedFaculty(null);
  };

  const handleEdit = (faculty: FacultyWithLevels) => {
    setSelectedFaculty(faculty);
    setFormData({
      name: faculty.name,
      code: faculty.code,
      description: faculty.description || "",
      dean: faculty.dean || "",
      deanId: faculty.deanId || "",
      studyDuration: faculty.studyDuration,
      status: faculty.status,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFaculty) return;
    try {
      await deleteFaculty(selectedFaculty.id);
      setIsDeleteDialogOpen(false);
      setSelectedFaculty(null);
      toast({
        title: "Faculté supprimée",
        description: "La faculté a été supprimée avec succès",
      });
      recalculateAllStats();
    } catch (err: any) {
      console.error("Erreur lors de la suppression:", err);
      toast({
        title: "Erreur",
        description:
          err.response?.data?.message ||
          err.message ||
          "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const toggleFacultyExpansion = (facultyId: string) => {
    setExpandedFaculty(expandedFaculty === facultyId ? null : facultyId);
  };

  const getDeanDisplayInfo = (faculty: FacultyWithLevels) => {
    if (faculty.dean && typeof faculty.dean === "object") {
      const dean = faculty.dean as any;
      return {
        name: `${dean.firstName || ""} ${dean.lastName || ""}`.trim(),
        email: dean.email || "",
        avatar: dean.avatar || "",
        initials: `${dean.firstName?.[0] || ""}${
          dean.lastName?.[0] || ""
        }`.toUpperCase(),
      };
    }

    // Si faculty.dean est une chaîne (nom complet)
    if (faculty.dean && typeof faculty.dean === "string") {
      return {
        name: faculty.dean,
        email: "",
        avatar: "",
        initials: faculty.dean
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      };
    }

    // Si seulement deanId est présent mais pas dean
    if (faculty.deanId && !faculty.dean) {
      return {
        name: "Doyen non spécifié",
        email: "",
        avatar: "",
        initials: "DN",
      };
    }

    return null;
  };

  const filteredFaculties =
    faculties?.filter((faculty) => {
      const matchesSearch =
        faculty?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty?.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || faculty.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  // Composant Skeleton pour le chargement
  const FacultyCardSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-muted/10">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
    </Card>
  );

  if (loading && !faculties.length) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <FacultyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !faculties.length) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4 flex items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Erreur: {error}
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => fetchFaculties()}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </Button>
          <Button
            onClick={handleResetCache}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser Cache
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            {user?.role === "Doyen" ? "Ma Faculté" : "Gestion des Facultés"}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "Doyen"
              ? "Informations et gestion de votre faculté"
              : "Administration des facultés et programmes d'études"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleResetCache}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>

          {user?.role !== "Doyen" && (
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle Faculté
            </Button>
          )}
        </div>
      </div>

      {/* Bannière Doyen */}
      {user?.role === "Doyen" && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Vue limitée à votre faculté
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  En tant que doyen, vous avez accès uniquement aux données de
                  votre faculté.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total Facultés
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.totalFaculties}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <Building2 className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Facultés Actives
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {stats.activeFaculties}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <Target className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Total Étudiants
                  </p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {stats.totalStudents}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-200 dark:bg-amber-800">
                  <Users className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Total Cours
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {stats.totalCourses}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <BookOpenCheck className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une faculté par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchTerm);
                  }
                }}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleFilterByStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrer par statut" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Active">Actives</SelectItem>
                <SelectItem value="Inactive">Inactives</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions groupées</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2">
                  <Download className="h-4 w-4" />
                  Exporter les données
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importer des facultés
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    fetchFaculties();
                    loadStats();
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Actualiser les données
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Liste des facultés */}
      {filteredFaculties.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredFaculties.map((faculty: FacultyWithLevels) => {
            const deanInfo = getDeanDisplayInfo(faculty);

            return (
              <motion.div key={faculty.id} layout>
                <Card
                  className={cn(
                    "overflow-hidden transition-all hover:shadow-md border",
                    expandedFaculty === faculty.id &&
                      "border-primary/50 shadow-md",
                    faculty.status === "Inactive" && "opacity-70 bg-muted/20"
                  )}
                >
                  <CardHeader
                    className={cn(
                      "pb-3 cursor-pointer transition-colors",
                      expandedFaculty === faculty.id
                        ? "bg-gradient-to-r from-primary/5 to-primary/10"
                        : "bg-gradient-to-r from-muted/10 to-muted/5 hover:from-muted/20 hover:to-muted/10"
                    )}
                    onClick={() => toggleFacultyExpansion(faculty.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Avatar de la faculté */}
                          <div
                            className={cn(
                              "p-3 rounded-xl transition-colors",
                              faculty.status === "Active"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <School className="h-6 w-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <CardTitle className="text-xl truncate">
                                {faculty.name}
                              </CardTitle>
                              <Badge
                                variant="secondary"
                                className="font-mono text-sm"
                              >
                                {faculty.code}
                              </Badge>
                              <Badge
                                variant={
                                  faculty.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {faculty.status === "Active"
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                                <Calendar className="h-3 w-3" />
                                {faculty.studyDuration} an
                                {faculty.studyDuration > 1 ? "s" : ""}
                              </span>

                              {/* Affichage du doyen */}
                              {deanInfo && (
                                <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded">
                                  <UserCog className="h-3 w-3" />
                                  <span className="font-medium">
                                    {deanInfo.name}
                                  </span>
                                  {deanInfo.email && (
                                    <span className="text-xs opacity-75">
                                      ({deanInfo.email})
                                    </span>
                                  )}
                                </div>
                              )}

                              {!deanInfo && (
                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <User className="h-3 w-3" />
                                  Aucun doyen assigné
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" className="ml-2">
                        {expandedFaculty === faculty.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {expandedFaculty === faculty.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="pt-0">
                          <Separator className="mb-4" />

                          {/* Description */}
                          {faculty.description && (
                            <div className="mb-4">
                              <Label className="text-sm font-medium mb-2">
                                Description
                              </Label>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {faculty.description}
                              </p>
                            </div>
                          )}

                          {/* Informations du doyen */}
                          {deanInfo && (
                            <div className="mb-4 p-3 bg-secondary/20 rounded-lg">
                              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Crown className="h-4 w-4 text-amber-600" />
                                Doyen de la faculté
                              </Label>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={deanInfo.avatar} />
                                  <AvatarFallback className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                    {deanInfo.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{deanInfo.name}</p>
                                  {deanInfo.email && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {deanInfo.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Statistiques */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {faculty.studentsCount || 0}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Étudiants
                              </div>
                            </div>

                            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                              <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {faculty.coursesCount || 0}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                Cours
                              </div>
                            </div>

                            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                              <GraduationCap className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                {faculty.levels?.length || 0}
                              </div>
                              <div className="text-xs text-amber-600 dark:text-amber-400">
                                Niveaux
                              </div>
                            </div>
                          </div>

                          {/* Niveaux */}
                          {faculty.levels && faculty.levels.length > 0 && (
                            <div className="mb-4">
                              <Label className="text-sm font-medium mb-2">
                                Niveaux offerts
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {faculty.levels.map((level) => (
                                  <Badge
                                    key={
                                      typeof level === "string"
                                        ? level
                                        : level.id
                                    }
                                    variant="outline"
                                    className="px-3 py-1"
                                  >
                                    {typeof level === "string"
                                      ? level
                                      : level.level}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <Separator className="my-4" />

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(faculty)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFaculty(faculty);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </Button>
                            <Button size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              Voir détails
                            </Button>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-muted/5 to-muted/10 rounded-lg border-2 border-dashed">
          <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Aucune faculté trouvée
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchTerm || statusFilter !== "all"
              ? `Aucun résultat pour votre recherche. Essayez d'autres termes ou modifiez les filtres.`
              : "Commencez par créer votre première faculté pour organiser vos programmes d'études."}
          </p>
          {user?.role !== "Doyen" && (
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer une faculté
            </Button>
          )}
        </div>
      )}

      {/* Modal de formulaire */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedFaculty
                ? "Modifier la Faculté"
                : "Créer une nouvelle Faculté"}
            </DialogTitle>
            <DialogDescription>
              {selectedFaculty
                ? `Modifiez les informations de la faculté ${selectedFaculty.name}`
                : "Ajoutez une nouvelle faculté à votre établissement"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <span>Nom de la faculté</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Faculté des Sciences"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <span>Code</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="FST"
                  className="uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <UserCog className="h-4 w-4" />
                <span>Doyen</span>
              </Label>
              <Select
                value={formData.deanId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    deanId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un doyen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun doyen</SelectItem>
                  {potentialDeans.map((dean) => (
                    <SelectItem key={dean.id} value={dean.id}>
                      {dean.firstName} {dean.lastName} ({dean.email})
                      {dean.deanOf && ` - Doyen de: ${dean.deanOf.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sélectionnez un utilisateur avec le rôle "Doyen"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Durée d'étude</span>
                </Label>
                <Select
                  value={formData.studyDuration.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      studyDuration: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez la durée" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year} an{year > 1 ? "s" : ""} (Niveaux:{" "}
                        {Array.from(
                          { length: year },
                          (_, i) => `L${i + 1}`
                        ).join(", ")}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <UserCog className="h-4 w-4" />
                  <span>Statut</span>
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      checked={formData.status === "Active"}
                      onChange={() =>
                        setFormData({ ...formData, status: "Active" })
                      }
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      checked={formData.status === "Inactive"}
                      onChange={() =>
                        setFormData({ ...formData, status: "Inactive" })
                      }
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description de la faculté..."
                rows={3}
                className="min-h-[100px]"
              />
            </div>

            <Separator className="my-2" />

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-gray-300"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : selectedFaculty ? (
                  "Mettre à jour"
                ) : (
                  "Créer la faculté"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Supprimer la faculté
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la faculté "
              {selectedFaculty?.name}" ? Cette action est irréversible et
              supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
