// src/components/students/StudentsManager.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  GraduationCap,
  Download,
  Upload,
  Filter,
  MoreVertical,
  User,
  ArrowLeft,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAcademicStore } from "@/store/studentStore";
// import { StudentForm } from "./StudentForm";
// import { StudentDetails } from "./StudentDetails";
import { Student } from "@/types/academic";
import { getStudentEnrollmentInfo } from "@/utils/enrollmentUtils";
import { toast } from "@/hooks/use-toast";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import * as XLSX from "xlsx";
import { useAcademicYearStore } from "@/store/academicYearStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DialogDescription } from "@radix-ui/react-dialog";
import { StudentDetails } from "./students/StudentDetails";
import { StudentForm } from "./students/StudentForm";
import { useAuthStore } from "@/store/authStore";

// Composant Carte Étudiant
const StudentCard = ({
  student,
  onViewDetails,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  isSelecting,
}: {
  student: Student;
  onViewDetails: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  isSelected: boolean;
  onSelect: (studentId: string) => void;
  isSelecting: boolean;
}) => {
  const { enrollments = [] } = useAcademicStore();
  const { currentAcademicYear } = useAcademicYearStore();
  const { user } = useAuthStore();
  const academicYear = currentAcademicYear ? currentAcademicYear.year : "";

  const enrollmentInfo = useMemo(
    () => getStudentEnrollmentInfo(student, enrollments, academicYear),
    [student, enrollments, academicYear]
  );

  return (
    <Card className="mb-4 relative hover:shadow-md transition-shadow duration-200">
      {isSelecting && (
        <div className="absolute top-4 left-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(student.id)}
            aria-label={`Sélectionner ${student.firstName} ${student.lastName}`}
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {student.firstName?.[0] || ""}
              {student.lastName?.[0] || ""}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {student.firstName} {student.lastName}
              </div>
              <div className="text-sm text-muted-foreground font-mono truncate">
                {student.studentId}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {student.email}
              </div>
              <div className="mt-2">{getStatusBadge(student.status)}</div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(student)}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(student.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Téléphone</div>
            <div>{student.phone || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Programme</div>
            <div className="truncate">
              {enrollmentInfo?.faculty || "Non assigné"}
            </div>
            <div className="text-muted-foreground text-xs">
              {enrollmentInfo?.level || ""}{" "}
              {enrollmentInfo?.level && enrollmentInfo?.academicYear ? "•" : ""}{" "}
              {enrollmentInfo?.academicYear || ""}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant Pagination
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  totalItems: number;
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        Affichage de {startIndex} à {endIndex} sur {totalItems} étudiant(s)
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium hidden md:block">
            Éléments par page
          </p>
          <Select
            value={`${itemsPerPage}`}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-sm font-medium w-8">
            {currentPage}
          </div>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Barre d'actions groupées
const BulkActionsBar = ({
  selectedCount,
  onDeselectAll,
  onBulkDelete,
  onBulkStatusChange,
  onBulkExport,
}: {
  selectedCount: number;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkStatusChange: (status: string) => void;
  onBulkExport: () => void;
}) => {
  return (
    <Card className="bg-blue-50 border-blue-200 mb-4">
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">
              {selectedCount} étudiant(s) sélectionné(s)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Modifier le statut
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onBulkStatusChange("Active")}>
                  Marquer comme actif
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onBulkStatusChange("Inactive")}
                >
                  Marquer comme inactif
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onBulkStatusChange("Graduated")}
                >
                  Marquer comme diplômé
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onBulkExport}
            >
              <Download className="h-3 w-3 mr-1" />
              Exporter
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={onBulkDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Supprimer
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={onDeselectAll}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Fonction utilitaire pour les badges de statut
const getStatusBadge = (status: Student["status"]) => {
  if (!status) return null;

  const variants = {
    Active: "default",
    Inactive: "secondary",
    Graduated: "outline",
    Suspended: "destructive",
  } as const;

  const labels = {
    Active: "Actif",
    Inactive: "Inactif",
    Graduated: "Diplômé",
    Suspended: "Suspendu",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

// Squelette de chargement
const StudentSkeleton = () => (
  <Card className="p-4 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </Card>
);

export const StudentsManager = () => {
  const {
    students = [],
    enrollments = [],
    deleteStudent,
    fetchStudents,
    loading,
    importStudents,
    updateStudent,
    error,
    clearError,
  } = useAcademicStore();

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Gestion des erreurs globales
  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, clearError]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const { currentAcademicYear } = useAcademicYearStore();
  const { user } = useAuthStore();

  const academicYear = currentAcademicYear ? currentAcademicYear.year : "";

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset à la première page lors d'une nouvelle recherche
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Utiliser useMemo pour optimiser le filtrage
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (!student || !student.id) return false;

      const matchesSearch =
        `${student.firstName || ""} ${student.lastName || ""}`
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (student.studentId || "")
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (student.email || "")
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, debouncedSearchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handleEditStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  }, []);

  const handleViewDetails = useCallback((student: Student) => {
    setSelectedStudent(student);
    setViewMode("details");
  }, []);

  const handleDeleteStudent = useCallback((studentId: string) => {
    setStudentToDelete(studentId);
    setIsModalOpen(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedStudent(null);
    setSelectedStudents([]);
    setIsSelecting(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!studentToDelete) return;

    try {
      // Vérifier si c'est une suppression groupée
      if (studentToDelete.includes(",")) {
        const ids = studentToDelete.split(",");
        const deletePromises = ids.map((id) => deleteStudent(id));
        await Promise.all(deletePromises);

        toast({
          title: "Suppression réussie",
          description: `${ids.length} étudiants ont été supprimés avec succès`,
        });
      } else {
        await deleteStudent(studentToDelete);
        toast({
          title: "Suppression réussie",
          description: "L'étudiant a été supprimé avec succès",
        });
      }

      setIsModalOpen(false);
      setStudentToDelete(null);
      setSelectedStudents([]);

      // Recharger les données
      await fetchStudents();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression",
        variant: "destructive",
      });
    }
  }, [studentToDelete, deleteStudent, fetchStudents]);

  // Sélection des étudiants
  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedStudents.length === paginatedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(paginatedStudents.map((s) => s.id));
    }
  }, [selectedStudents, paginatedStudents]);

  const handleBulkDelete = useCallback(() => {
    if (selectedStudents.length === 0) return;
    setStudentToDelete(selectedStudents.join(","));
    setIsModalOpen(true);
  }, [selectedStudents]);

  const handleBulkStatusChange = useCallback(
    async (newStatus: Student["status"]) => {
      if (selectedStudents.length === 0) return;

      try {
        const updatePromises = selectedStudents.map((studentId) => {
          const student = students.find((s) => s.id === studentId);
          if (student) {
            return updateStudent(studentId, { ...student, status: newStatus });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);

        toast({
          title: "Statut mis à jour",
          description: `Le statut de ${selectedStudents.length} étudiants a été modifié`,
        });

        setSelectedStudents([]);
        await fetchStudents();
      } catch (error) {
        console.error("Erreur lors de la mise à jour groupée:", error);
        toast({
          title: "Erreur",
          description:
            "Une erreur s'est produite lors de la mise à jour des statuts",
          variant: "destructive",
        });
      }
    },
    [selectedStudents, students, updateStudent, fetchStudents]
  );

  const handleBulkExport = useCallback(() => {
    if (selectedStudents.length === 0) return;

    try {
      const selectedStudentsData = students.filter((student) =>
        selectedStudents.includes(student.id)
      );

      const data = selectedStudentsData.map((student) => {
        const enrollmentInfo = getStudentEnrollmentInfo(
          student,
          enrollments,
          academicYear
        );
        return {
          "ID Étudiant": student.studentId || "",
          Prénom: student.firstName || "",
          Nom: student.lastName || "",
          Email: student.email || "",
          Téléphone: student.phone || "",
          Statut: student.status || "",
          Faculté: enrollmentInfo?.faculty || "",
          Niveau: enrollmentInfo?.level || "",
          "Année Académique": enrollmentInfo?.academicYear || "",
          "Date de Naissance": student.dateOfBirth
            ? new Date(student.dateOfBirth).toLocaleDateString()
            : "",
          "Lieu de Naissance": student.placeOfBirth || "",
          Adresse: student.address || "",
          "Date de Création": student.createdAt
            ? new Date(student.createdAt).toLocaleDateString()
            : "",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Étudiants");
      XLSX.writeFile(workbook, "etudiants-selection.xlsx");

      toast({
        title: "Export réussi",
        description: `Les données de ${selectedStudents.length} étudiants ont été exportées`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'exportation",
        variant: "destructive",
      });
    }
  }, [selectedStudents, students, enrollments, academicYear]);

  const exportToExcel = useCallback(() => {
    try {
      const data = filteredStudents.map((student) => {
        const enrollmentInfo = getStudentEnrollmentInfo(
          student,
          enrollments,
          academicYear
        );
        return {
          "ID Étudiant": student.studentId || "",
          Prénom: student.firstName || "",
          Nom: student.lastName || "",
          Email: student.email || "",
          Téléphone: student.phone || "",
          Statut: student.status || "",
          Faculté: enrollmentInfo?.faculty || "",
          Niveau: enrollmentInfo?.level || "",
          "Année Académique": enrollmentInfo?.academicYear || "",
          "Date de Naissance": student.dateOfBirth
            ? new Date(student.dateOfBirth).toLocaleDateString()
            : "",
          "Lieu de Naissance": student.placeOfBirth || "",
          Adresse: student.address || "",
          "Date de Création": student.createdAt
            ? new Date(student.createdAt).toLocaleDateString()
            : "",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Étudiants");
      XLSX.writeFile(workbook, "etudiants.xlsx");

      toast({
        title: "Export réussi",
        description: `Les données de ${filteredStudents.length} étudiants ont été exportées`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'exportation",
        variant: "destructive",
      });
    }
  }, [filteredStudents, enrollments, academicYear]);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const result = await importStudents(file);

        toast({
          title: "Import réussi",
          description: result.message,
        });

        // Réinitialiser l'input file
        event.target.value = "";
      } catch (error: any) {
        console.error("Erreur import:", error);
        toast({
          title: "Erreur d'import",
          description: error.message || "Erreur lors de l'importation",
          variant: "destructive",
        });
      }
    },
    [importStudents]
  );

  // Convertir le niveau en format texte
  const getLevelText = (level: string) => {
    const levelNum = parseInt(level);
    if (isNaN(levelNum)) return level;
    if (levelNum === 1) return "1ère année";
    return `${levelNum}ème année`;
  };

  // Affichage des détails de l'étudiant
  if (viewMode === "details" && selectedStudent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="hover-scale transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Détails de l'étudiant</h2>
            <p className="text-muted-foreground">
              {selectedStudent.firstName} {selectedStudent.lastName}
            </p>
          </div>
        </div>

        <StudentDetails
          student={selectedStudent}
          onClose={handleBackToList}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier Étudiant</DialogTitle>
              <DialogDescription>
                Modifier les informations de l'étudiant
              </DialogDescription>
            </DialogHeader>

            <StudentForm
              student={selectedStudent}
              onClose={() => {
                setIsFormOpen(false);
                setSelectedStudent(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const renderContent = () => {
    if (loading && students.length === 0) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <StudentSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="text-center py-12">
          <User className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            Aucun étudiant trouvé
          </h3>
          <p className="text-muted-foreground mt-1">
            {debouncedSearchTerm || statusFilter !== "all"
              ? "Aucun étudiant ne correspond à vos critères de recherche"
              : "Aucun étudiant n'a été ajouté pour le moment"}
          </p>
          {!debouncedSearchTerm && statusFilter === "all" && (
            <Button onClick={() => setIsFormOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le premier étudiant
            </Button>
          )}
        </div>
      );
    }

    if (isDesktop) {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead key="select-header" className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedStudents.length === paginatedStudents.length &&
                      paginatedStudents.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Sélectionner tous les étudiants"
                  />
                </TableHead>
                <TableHead key="id-header" className="w-[180px]">
                  ID Étudiant
                </TableHead>
                <TableHead key="name-header" className="w-[200px]">
                  Nom Complet
                </TableHead>
                <TableHead key="email-header" className="w-[200px]">
                  Email
                </TableHead>
                <TableHead key="phone-header" className="w-[150px]">
                  Téléphone
                </TableHead>
                <TableHead key="status-header" className="w-[120px]">
                  Statut
                </TableHead>
                <TableHead key="program-header" className="w-[200px]">
                  Programme
                </TableHead>
                <TableHead
                  key="actions-header"
                  className="w-[120px] text-center"
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => {
                const enrollmentInfo = getStudentEnrollmentInfo(
                  student,
                  enrollments,
                  academicYear
                );

                return (
                  <TableRow
                    key={student.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell key={`${student.id}-select`}>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() =>
                          toggleStudentSelection(student.id)
                        }
                        aria-label={`Sélectionner ${student.firstName} ${student.lastName}`}
                      />
                    </TableCell>
                    <TableCell key={`${student.id}-id`}>
                      <div className="font-mono text-sm font-medium">
                        {student.studentId}
                      </div>
                    </TableCell>
                    <TableCell key={`${student.id}-name`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {student.firstName?.[0] || ""}
                          {student.lastName?.[0] || ""}
                        </div>
                        <div>
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell key={`${student.id}-email`}>
                      <div className="text-sm">{student.email}</div>
                    </TableCell>
                    <TableCell key={`${student.id}-phone`}>
                      <div className="text-sm">{student.phone || "-"}</div>
                    </TableCell>
                    <TableCell key={`${student.id}-status`}>
                      {getStatusBadge(student.status)}
                    </TableCell>
                    <TableCell key={`${student.id}-program`}>
                      <div className="text-sm">
                        <div className="font-medium">
                          {enrollmentInfo?.faculty || "Non assigné"}
                        </div>
                        <div className="text-muted-foreground">
                          {getLevelText(enrollmentInfo?.level) || ""}{" "}
                          {getLevelText(enrollmentInfo?.level) &&
                          enrollmentInfo?.academicYear
                            ? "•"
                            : ""}{" "}
                          {enrollmentInfo?.academicYear || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell key={`${student.id}-actions`}>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewDetails(student)}
                          title="Voir détails"
                          aria-label="Voir détails"
                        >
                          <GraduationCap className="h-4 w-4" />
                        </Button>
                        {user?.role === "Admin" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditStudent(student)}
                              title="Modifier"
                              aria-label="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteStudent(student.id)}
                              title="Supprimer"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      );
    }

    // Vue mobile/tablette
    return (
      <div className="space-y-4">
        {paginatedStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onViewDetails={handleViewDetails}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            isSelected={selectedStudents.includes(student.id)}
            onSelect={toggleStudentSelection}
            isSelecting={isSelecting}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestion des Étudiants
          </h2>
          <p className="text-muted-foreground mt-2">
            Gérez les informations des étudiants de votre établissement
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Bouton Import */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => document.getElementById("import-file")?.click()}
            disabled={loading}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importer</span>
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleImport}
              className="hidden"
            />
          </Button>

          {/* Bouton Export */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportToExcel}
            disabled={filteredStudents.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>

          {/* Bouton Sélection */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsSelecting(!isSelecting)}
            disabled={filteredStudents.length === 0}
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Sélection</span>
          </Button>

          {/* Bouton Nouvel Étudiant */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setSelectedStudent(null)}
                className="gap-2"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvel Étudiant</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedStudent ? "Modifier Étudiant" : "Nouvel Étudiant"}
                </DialogTitle>
              </DialogHeader>
              <StudentForm
                student={selectedStudent}
                onClose={() => {
                  setIsFormOpen(false);
                  setSelectedStudent(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barre d'actions groupées */}
      {selectedStudents.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedStudents.length}
          onDeselectAll={() => setSelectedStudents([])}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkExport={handleBulkExport}
        />
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, ID étudiant ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 w-full"
                aria-label="Rechercher des étudiants"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-full lg:w-32"
                  aria-label="Filtrer par statut"
                >
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="Active">Actif</SelectItem>
                  <SelectItem value="Inactive">Inactif</SelectItem>
                  <SelectItem value="Graduated">Diplômé</SelectItem>
                  <SelectItem value="Suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des étudiants */}
      <Card>
        <CardHeader className="bg-muted/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Liste des Étudiants
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {filteredStudents.length} étudiant
              {filteredStudents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && students.length > 0 ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">
                Mise à jour...
              </p>
            </div>
          ) : (
            renderContent()
          )}
        </CardContent>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={filteredStudents.length}
          />
        )}
      </Card>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          studentToDelete && studentToDelete.includes(",")
            ? "Confirmer la suppression multiple"
            : "Confirmer la suppression"
        }
        message={
          studentToDelete && studentToDelete.includes(",")
            ? `Êtes-vous sûr de vouloir supprimer ${
                studentToDelete.split(",").length
              } étudiants ? Cette action est irréversible.`
            : "Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible."
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        // variant="destructive"
      />
    </div>
  );
};
