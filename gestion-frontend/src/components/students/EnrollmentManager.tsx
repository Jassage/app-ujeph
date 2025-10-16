// EnrollmentManager.tsx - VERSION COMPLÈTE CORRIGÉE
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  UserPlus,
  Trash2,
  Edit,
  Filter,
  GraduationCap,
  Mail,
  IdCard,
  Calendar,
  BookOpen,
  Users,
  CheckCircle,
  BarChart3,
  BookOpenCheck,
  Sparkles,
  RotateCcw,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  DollarSign,
  XCircle,
  Loader2,
} from "lucide-react";
import { useEnrollmentStore } from "../../store/enrollmentStore";
import { useAcademicStore } from "../../store/studentStore";
import { Student, Enrollment, FeeStructure } from "../../types/academic";
import { useFacultyStore } from "@/store/facultyStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "../ui/switch";
import { useFeeStructureStore } from "@/store/feeStructureStore";

// Types pour les props des composants
interface StudentListProps {
  students: Student[];
  getEnrollmentsByStudent: (studentId: string) => Enrollment[];
  onEnroll: (student: Student) => void;
  onEdit: (student: Student, enrollment: Enrollment) => void;
  onDelete: (enrollmentId: string, studentName: string) => void;
  getStatusBadge: (status: Enrollment["status"]) => React.ReactNode;
  expandedStudents: Record<string, boolean>;
  onToggleExpansion: (studentId: string) => void;
  deletingIds: Set<string>;
  currentPage: number;
  itemsPerPage: number;
}

interface EnrollmentFormProps {
  student: Student;
  enrollment?: Enrollment | null;
  onClose: () => void;
  onSuccess: () => void;
}

// FONCTIONS UTILITAIRES CORRIGÉES
const safeLowerCase = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number") return value.toString().toLowerCase();
  return String(value).toLowerCase();
};

const safeRender = (value: unknown, defaultValue: string = "N/A"): string => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "string") return value.trim() || defaultValue;
  if (typeof value === "number") return value.toString();
  if (typeof value === "object") {
    // CORRECTION CRITIQUE : Extraire les propriétés des objets
    if (value && "name" in value)
      return String((value as { name: string }).name);
    if (value && "year" in value)
      return String((value as { year: string }).year);
    if (value && "id" in value) return String((value as { id: string }).id);
    if (value && "title" in value)
      return String((value as { title: string }).title);
    return defaultValue;
  }
  return String(value);
};

// COMPOSANT SELECT VALUE SÉCURISÉ
const SafeSelectValue = ({
  placeholder = "Sélectionner...",
  value,
}: {
  placeholder?: string;
  value?: unknown;
}) => {
  const displayValue = useMemo(() => {
    if (!value) return placeholder;

    // CORRECTION : Toujours convertir les objets en string
    if (typeof value === "object" && value !== null) {
      if ("name" in value) {
        return String((value as { name: string }).name);
      }
      if ("year" in value) {
        return String((value as { year: string }).year);
      }
      if ("title" in value) {
        return String((value as { title: string }).title);
      }
      // Pour tout autre objet, retourner le placeholder
      return placeholder;
    }

    return String(value);
  }, [value, placeholder]);

  return <SelectValue placeholder={displayValue} />;
};

// COMPOSANTS D'INTERFACE UTILISATEUR
const LoadingSpinner = ({
  message = "Chargement...",
}: {
  message?: string;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) => (
  <Card className="border-destructive/50 bg-destructive/10">
    <CardContent className="p-6 text-center">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Erreur de chargement
      </h3>
      <p className="text-muted-foreground mb-4">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      )}
    </CardContent>
  </Card>
);

const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  return (
    <nav
      className={`flex items-center justify-between px-2 ${className}`}
      aria-label="Pagination"
    >
      <div className="flex-1 text-sm text-muted-foreground hidden md:block">
        Page {currentPage} sur {totalPages} - {totalPages} page
        {totalPages !== 1 ? "s" : ""}
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden md:flex h-8 w-8 p-0"
          aria-label="Première page"
        >
          «
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
          aria-label="Page précédente"
        >
          ‹
        </Button>

        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-8 w-8 p-0 text-xs"
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
          aria-label="Page suivante"
        >
          ›
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden md:flex h-8 w-8 p-0"
          aria-label="Dernière page"
        >
          »
        </Button>
      </div>

      <div className="flex-1 hidden md:block" />
    </nav>
  );
};

// COMPOSANT ENROLLMENT FORM CORRIGÉ
const EnrollmentForm = React.memo(
  ({ student, enrollment, onClose, onSuccess }: EnrollmentFormProps) => {
    const { addEnrollment, updateEnrollment, assignFeeToStudent } =
      useEnrollmentStore();
    const { feeStructures, getFeeStructures } = useFeeStructureStore();
    const { faculties } = useFacultyStore();
    const { academicYears } = useAcademicYearStore();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
      faculty: "",
      level: "",
      academicYearId: "",
      status: "Active" as "Active" | "Suspended" | "Completed",
      feeStructureId: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignFees, setAssignFees] = useState(true);
    const [filteredFeeStructures, setFilteredFeeStructures] = useState<
      FeeStructure[]
    >([]);

    useEffect(() => {
      getFeeStructures().catch(console.error);
    }, [getFeeStructures]);

    useEffect(() => {
      if (enrollment) {
        setFormData({
          faculty: safeRender(enrollment.faculty),
          level: safeRender(enrollment.level),
          academicYearId: safeRender(enrollment.academicYearId),
          status: enrollment.status || "Active",
          feeStructureId: "",
        });
      } else if (academicYears.length > 0) {
        const currentYear =
          academicYears.find((ay) => ay.isCurrent) || academicYears[0];
        setFormData((prev) => ({
          ...prev,
          academicYearId: currentYear?.id || "",
        }));
      }
    }, [enrollment, academicYears]);

    useEffect(() => {
      if (formData.faculty && formData.level && formData.academicYearId) {
        const filtered = feeStructures.filter(
          (fee) =>
            fee.faculty === formData.faculty &&
            fee.level === formData.level &&
            fee.academicYear === formData.academicYearId &&
            fee.isActive
        );
        setFilteredFeeStructures(filtered);

        if (filtered.length === 1 && !formData.feeStructureId) {
          setFormData((prev) => ({ ...prev, feeStructureId: filtered[0].id }));
        }
      } else {
        setFilteredFeeStructures([]);
        setFormData((prev) => ({ ...prev, feeStructureId: "" }));
      }
    }, [
      formData.faculty,
      formData.level,
      formData.academicYearId,
      feeStructures,
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.faculty || !formData.level || !formData.academicYearId) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }

      if (assignFees && !formData.feeStructureId) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une structure de frais",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      // console.log("🔍 DEBUG - Données du formulaire:", formData);
      // console.log("🔍 DEBUG - Student ID:", student.id);

      try {
        const enrollmentData = {
          studentId: student.id,
          faculty: formData.faculty,
          level: formData.level,
          academicYearId: formData.academicYearId,
          status: formData.status,
          enrollmentDate:
            enrollment?.enrollmentDate || new Date().toISOString(),
        };

        // console.log("🔍 DEBUG - Données d'immatriculation:", enrollmentData);
        let newEnrollment;

        if (enrollment) {
          newEnrollment = await updateEnrollment(enrollment.id, enrollmentData);
          toast({
            title: "Immatriculation modifiée",
            description: "L'immatriculation a été modifiée avec succès.",
          });
        } else {
          newEnrollment = await addEnrollment(enrollmentData);
          toast({
            title: "Immatriculation créée",
            description: "L'étudiant a été immatriculé avec succès.",
          });
        }

        if (assignFees && formData.feeStructureId) {
          try {
            await assignFeeToStudent({
              studentId: student.id,
              feeStructureId: formData.feeStructureId,
              academicYearId: formData.academicYearId,
            });
            toast({
              title: "Frais attribués",
              description: "Les frais ont été attribués avec succès.",
            });
          } catch (feeError: any) {
            console.error("Erreur lors de l'attribution des frais:", feeError);
            toast({
              title: "Avertissement",
              description:
                "Immatriculation réussie, mais erreur lors de l'attribution des frais.",
              variant: "default",
            });
          }
        }

        onSuccess();
        onClose();
      } catch (error: any) {
        console.error("Erreur lors de l'opération:", error);
        toast({
          title: "Erreur",
          description:
            error.message || "Une erreur s'est produite lors de l'opération.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const getAcademicYearDisplay = useCallback(
      (yearId: string): string => {
        const year = academicYears.find((y) => y.id === yearId);
        return safeRender(year?.year, yearId);
      },
      [academicYears]
    );

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {safeRender(student.firstName)} {safeRender(student.lastName)}
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                >
                  <IdCard className="h-3 w-3" />
                  {safeRender(student.studentId)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {safeRender(student.email)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Faculté *
            </Label>
            <Select
              value={formData.faculty}
              onValueChange={(value) =>
                setFormData({ ...formData, faculty: value, feeStructureId: "" })
              }
              required
            >
              <SelectTrigger className="h-11">
                <SafeSelectValue
                  value={
                    formData.faculty
                      ? faculties.find((f) => f.id === formData.faculty)
                      : undefined
                  }
                  placeholder="Sélectionner une faculté"
                />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id}>
                    {safeRender(faculty.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <GraduationCap className="h-4 w-4" />
              Niveau *
            </Label>
            <Select
              value={formData.level}
              onValueChange={(value) =>
                setFormData({ ...formData, level: value, feeStructureId: "" })
              }
              required
            >
              <SelectTrigger className="h-11">
                <SafeSelectValue
                  value={
                    formData.level
                      ? `Licence ${formData.level} (L${formData.level})`
                      : undefined
                  }
                  placeholder="Sélectionner un niveau"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Licence 1 (L1)</SelectItem>
                <SelectItem value="2">Licence 2 (L2)</SelectItem>
                <SelectItem value="3">Licence 3 (L3)</SelectItem>
                <SelectItem value="4">Licence 4 (L4)</SelectItem>
                <SelectItem value="5">Licence 5 (L5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Année Académique *
            </Label>
            <Select
              value={formData.academicYearId}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  academicYearId: value,
                  feeStructureId: "",
                })
              }
              required
            >
              <SelectTrigger>
                <SafeSelectValue
                  value={
                    formData.academicYearId
                      ? academicYears.find(
                          (y) => y.id === formData.academicYearId
                        )
                      : undefined
                  }
                  placeholder="Sélectionner une année"
                />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {safeRender(year.year)} {year.isCurrent && "(En cours)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
            <Switch
              checked={assignFees}
              onCheckedChange={setAssignFees}
              id="assign-fees"
            />
            <Label htmlFor="assign-fees" className="cursor-pointer font-medium">
              Attribuer des frais de scolarité
            </Label>
          </div>

          {assignFees && (
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sélection des Frais
              </h4>

              {filteredFeeStructures.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {formData.faculty &&
                  formData.level &&
                  formData.academicYearId ? (
                    <div className="space-y-2">
                      <XCircle className="h-8 w-8 mx-auto text-amber-500" />
                      <p>
                        Aucune structure de frais disponible pour cette
                        combinaison
                      </p>
                      <p className="text-sm">
                        {safeRender(formData.faculty)} - Niveau{" "}
                        {safeRender(formData.level)} -{" "}
                        {getAcademicYearDisplay(formData.academicYearId)}
                      </p>
                    </div>
                  ) : (
                    <p>
                      Sélectionnez d'abord une faculté, un niveau et une année
                      académique
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Structure de Frais *</Label>
                    <Select
                      value={formData.feeStructureId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, feeStructureId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SafeSelectValue
                          value={
                            formData.feeStructureId
                              ? filteredFeeStructures.find(
                                  (f) => f.id === formData.feeStructureId
                                )?.name
                              : undefined
                          }
                          placeholder="Choisir les frais"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFeeStructures.map((fee) => (
                          <SelectItem key={fee.id} value={fee.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{safeRender(fee.name)}</span>
                              <span className="font-semibold text-green-600 ml-2">
                                {fee.amount?.toLocaleString()} HTG
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.feeStructureId && (
                    <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {safeRender(
                                filteredFeeStructures.find(
                                  (f) => f.id === formData.feeStructureId
                                )?.name
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Frais sélectionnés
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-300 dark:border-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {filteredFeeStructures
                              .find((f) => f.id === formData.feeStructureId)
                              ?.amount?.toLocaleString()}{" "}
                            HTG
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : enrollment ? (
              "Modifier l'immatriculation"
            ) : (
              "Créer l'immatriculation"
            )}
          </Button>
        </div>
      </form>
    );
  }
);

EnrollmentForm.displayName = "EnrollmentForm";

// COMPOSANT STUDENT LIST CORRIGÉ
const StudentList = React.memo(
  ({
    students,
    getEnrollmentsByStudent,
    onEnroll,
    onEdit,
    onDelete,
    getStatusBadge,
    expandedStudents,
    onToggleExpansion,
    deletingIds,
    currentPage,
    itemsPerPage,
  }: StudentListProps) => {
    const getLevelDisplay = useCallback((level: string): string => {
      const levels: Record<string, string> = {
        "1": "1ère Année",
        "2": "2ème Année",
        "3": "3ème Année",
        "4": "4ème Année",
        "5": "5ème Année",
      };
      return levels[level] || level;
    }, []);

    const paginatedStudents = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return students.slice(startIndex, startIndex + itemsPerPage);
    }, [students, currentPage, itemsPerPage]);

    if (students.length === 0) {
      return (
        <div
          className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20"
          role="status"
          aria-label="Aucun étudiant trouvé"
        >
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Aucun étudiant trouvé
          </h3>
          <p className="text-muted-foreground mt-1">
            Aucun étudiant ne correspond à vos critères de recherche.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4" role="list" aria-label="Liste des étudiants">
        {paginatedStudents.map((student) => {
          const studentEnrollments = getEnrollmentsByStudent(student.id);
          const isExpanded = expandedStudents[student.id] || false;
          const isBeingDeleted = deletingIds.has(student.id);

          return (
            <Card
              key={student.id}
              className="overflow-hidden transition-all hover:shadow-md border-border bg-card"
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-muted/10 to-muted/5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full mt-1 flex-shrink-0">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2 truncate">
                          {safeRender(student.firstName)}{" "}
                          {safeRender(student.lastName)}
                          {studentEnrollments.length > 0 && (
                            <Badge
                              variant="outline"
                              className="ml-2 flex-shrink-0"
                            >
                              {studentEnrollments.length} immatriculation(s)
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-2 mt-2">
                          <span className="flex items-center gap-1 truncate">
                            <IdCard className="h-3 w-3 flex-shrink-0" />
                            {safeRender(student.studentId)}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {safeRender(student.email)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onEnroll(student)}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isBeingDeleted}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">
                        Immatriculer
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleExpansion(student.id)}
                      className="gap-1"
                      disabled={isBeingDeleted}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only">
                            Réduire
                          </span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only">
                            Détails
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-4">
                      {studentEnrollments.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                            <BookOpenCheck className="h-4 w-4" />
                            IMMATRICULATIONS
                          </h4>
                          {studentEnrollments.map((enrollment) => (
                            <div
                              key={enrollment.id}
                              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 border rounded-lg bg-gradient-to-r from-muted/5 to-muted/10"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h4 className="font-semibold truncate">
                                    {safeRender(enrollment.faculty)} -{" "}
                                    {safeRender(
                                      getLevelDisplay(enrollment.level)
                                    )}
                                  </h4>
                                  {getStatusBadge(enrollment.status)}
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    Année: {safeRender(enrollment.academicYear)}
                                  </span>
                                  <span>
                                    Inscrit le:{" "}
                                    {enrollment.enrollmentDate
                                      ? new Date(
                                          enrollment.enrollmentDate
                                        ).toLocaleDateString("fr-FR")
                                      : "Date inconnue"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEdit(student, enrollment)}
                                  className="h-9 gap-1"
                                  disabled={deletingIds.has(enrollment.id)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span className="sr-only sm:not-sr-only">
                                    Modifier
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onDelete(
                                      enrollment.id,
                                      `${safeRender(
                                        student.firstName
                                      )} ${safeRender(student.lastName)}`
                                    )
                                  }
                                  className="h-9 text-destructive gap-1 hover:bg-destructive/10"
                                  disabled={deletingIds.has(enrollment.id)}
                                >
                                  {deletingIds.has(enrollment.id) ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                  <span className="sr-only sm:not-sr-only">
                                    {deletingIds.has(enrollment.id)
                                      ? "Suppression..."
                                      : "Supprimer"}
                                  </span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                          <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Aucune immatriculation pour cet étudiant</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEnroll(student)}
                            className="mt-2 gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter une immatriculation
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    );
  }
);

StudentList.displayName = "StudentList";

// COMPOSANT PRINCIPAL CORRIGÉ
export const EnrollmentManager = () => {
  const { students, fetchStudents } = useAcademicStore();
  const { academicYears, fetchAcademicYears } = useAcademicYearStore();
  const {
    enrollments,
    fetchEnrollments,
    deleteEnrollment,
    getEnrollmentsByStudent,
    error: enrollmentError,
    clearError,
  } = useEnrollmentStore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);
  const [isEnrollmentFormOpen, setIsEnrollmentFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedStudents, setExpandedStudents] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      await Promise.all([
        fetchEnrollments(),
        fetchAcademicYears(),
        fetchStudents(),
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchEnrollments, fetchAcademicYears, fetchStudents, toast, clearError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (enrollmentError) {
      toast({
        title: "Erreur",
        description: enrollmentError,
        variant: "destructive",
      });
    }
  }, [enrollmentError, toast]);

  const toggleStudentExpansion = useCallback((studentId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  }, []);

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];

    return students.filter((student) => {
      if (!student) return false;

      const studentName = `${safeRender(student.firstName)} ${safeRender(
        student.lastName
      )}`;
      const studentId = safeRender(student.studentId);

      const matchesSearch =
        safeLowerCase(studentName).includes(safeLowerCase(searchTerm)) ||
        safeLowerCase(studentId).includes(safeLowerCase(searchTerm));

      const studentEnrollments = getEnrollmentsByStudent(student.id);
      const matchesStatus =
        statusFilter === "all" ||
        studentEnrollments.some((e) => e && e.status === statusFilter);

      const matchesFaculty =
        facultyFilter === "all" ||
        studentEnrollments.some((e) => e && e.faculty === facultyFilter);

      let matchesTab = true;
      if (activeTab === "enrolled") {
        matchesTab = studentEnrollments.length > 0;
      } else if (activeTab === "notEnrolled") {
        matchesTab = studentEnrollments.length === 0;
      }

      return matchesSearch && matchesStatus && matchesFaculty && matchesTab;
    });
  }, [
    students,
    searchTerm,
    statusFilter,
    facultyFilter,
    activeTab,
    getEnrollmentsByStudent,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, facultyFilter, activeTab]);

  const handleEnrollStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setSelectedEnrollment(null);
    setIsEnrollmentFormOpen(true);
  }, []);

  const handleEditEnrollment = useCallback(
    (student: Student, enrollment: Enrollment) => {
      setSelectedStudent(student);
      setSelectedEnrollment(enrollment);
      setIsEnrollmentFormOpen(true);
    },
    []
  );

  const handleFormSuccess = useCallback(() => {
    loadData();
    setIsEnrollmentFormOpen(false);
    setSelectedStudent(null);
    setSelectedEnrollment(null);
  }, [loadData]);

  const handleDeleteEnrollment = useCallback(
    async (enrollmentId: string, studentName: string) => {
      if (
        !confirm(
          `Êtes-vous sûr de vouloir supprimer l'immatriculation de ${studentName} ?`
        )
      ) {
        return;
      }

      setDeletingIds((prev) => new Set(prev).add(enrollmentId));

      try {
        await deleteEnrollment(enrollmentId);
        await loadData();

        toast({
          title: "Immatriculation supprimée",
          description: "L'immatriculation a été supprimée avec succès.",
        });
      } catch (error) {
        console.error("Erreur détaillée lors de la suppression:", error);
        toast({
          title: "Erreur",
          description: `Impossible de supprimer l'immatriculation: ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`,
          variant: "destructive",
        });
      } finally {
        setDeletingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(enrollmentId);
          return newSet;
        });
      }
    },
    [deleteEnrollment, loadData, toast]
  );

  const getEnrollmentStatusBadge = useCallback(
    (status: Enrollment["status"]) => {
      switch (status) {
        case "Active":
          return (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Actif
            </Badge>
          );
        case "Suspended":
          return (
            <Badge variant="destructive" className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Suspendu
            </Badge>
          );
        case "Completed":
          return (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700">
              <Clock className="h-3 w-3 mr-1" />
              Terminé
            </Badge>
          );
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    },
    []
  );

  const uniqueFaculties = useMemo(() => {
    if (!Array.isArray(enrollments)) return [];
    return Array.from(
      new Set(enrollments.map((e) => e?.faculty).filter(Boolean))
    ) as string[];
  }, [enrollments]);

  const totalStudents = Array.isArray(students) ? students.length : 0;
  const enrolledStudents = useMemo(() => {
    if (!Array.isArray(students)) return 0;
    return students.filter(
      (student) => student && getEnrollmentsByStudent(student.id).length > 0
    ).length;
  }, [students, getEnrollmentsByStudent]);

  const enrollmentRate = useMemo(
    () => (totalStudents > 0 ? (enrolledStudents / totalStudents) * 100 : 0),
    [totalStudents, enrolledStudents]
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredStudents.length / itemsPerPage),
    [filteredStudents.length, itemsPerPage]
  );

  if (isLoading) {
    return (
      <LoadingSpinner message="Chargement des données d'immatriculation..." />
    );
  }

  if (enrollmentError && filteredStudents.length === 0) {
    return <ErrorDisplay error={enrollmentError} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Sparkles className="h-7 w-7 text-primary" />
            Gestion des Immatriculations
          </h2>
          <p className="text-muted-foreground mt-1">
            Gérez les inscriptions des étudiants aux programmes académiques
          </p>
        </div>

        <Dialog
          open={isEnrollmentFormOpen}
          onOpenChange={setIsEnrollmentFormOpen}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <UserPlus className="h-4 w-4" />
              Nouvelle Immatriculation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {selectedEnrollment
                  ? "Modifier l'immatriculation"
                  : "Nouvelle immatriculation"}
              </DialogTitle>
              <DialogDescription>
                {selectedEnrollment
                  ? "Modifiez les détails de l'immatriculation de l'étudiant."
                  : "Inscrivez un étudiant à un programme académique."}
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <EnrollmentForm
                student={selectedStudent}
                enrollment={selectedEnrollment}
                onClose={() => {
                  setIsEnrollmentFormOpen(false);
                  setSelectedStudent(null);
                  setSelectedEnrollment(null);
                }}
                onSuccess={handleFormSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Étudiants
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {totalStudents}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Inscrits
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {enrolledStudents}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Taux d'Inscription
                </p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {enrollmentRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-200 dark:bg-amber-800">
                <BarChart3 className="h-6 w-6 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
            <Progress
              value={enrollmentRate}
              className="h-2 mt-4 bg-amber-200 dark:bg-amber-800"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Immatriculations
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {enrollments.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                <BookOpenCheck className="h-6 w-6 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="grid grid-cols-3 w-full md:w-auto bg-muted/50 p-1">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Tous
            </TabsTrigger>
            <TabsTrigger
              value="enrolled"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Inscrits
            </TabsTrigger>
            <TabsTrigger
              value="notEnrolled"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Non-inscrits
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-background"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full sm:w-[140px] bg-background">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SafeSelectValue
                    value={statusFilter !== "all" ? statusFilter : undefined}
                    placeholder="Statut"
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="Active">Actif</SelectItem>
                <SelectItem value="Suspended">Suspendu</SelectItem>
                <SelectItem value="Completed">Terminé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={facultyFilter} onValueChange={setFacultyFilter}>
              <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <SafeSelectValue
                    value={facultyFilter !== "all" ? facultyFilter : undefined}
                    placeholder="Faculté"
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes facultés</SelectItem>
                {uniqueFaculties.map((faculty) => (
                  <SelectItem key={faculty} value={faculty}>
                    {faculty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {["all", "enrolled", "notEnrolled"].map((tabValue) => (
          <TabsContent
            key={tabValue}
            value={tabValue}
            className="mt-6 space-y-6"
          >
            <StudentList
              students={filteredStudents}
              getEnrollmentsByStudent={getEnrollmentsByStudent}
              onEnroll={handleEnrollStudent}
              onEdit={handleEditEnrollment}
              onDelete={handleDeleteEnrollment}
              getStatusBadge={getEnrollmentStatusBadge}
              expandedStudents={expandedStudents}
              onToggleExpansion={toggleStudentExpansion}
              deletingIds={deletingIds}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
            />

            {filteredStudents.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      {filteredStudents.length} étudiant
                      {filteredStudents.length !== 1 ? "s" : ""} au total
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Label
                          htmlFor="itemsPerPage"
                          className="text-sm text-muted-foreground whitespace-nowrap"
                        >
                          Éléments par page:
                        </Label>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[70px] bg-background">
                            <SafeSelectValue value={itemsPerPage.toString()} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default EnrollmentManager;
