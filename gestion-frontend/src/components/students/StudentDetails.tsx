// src/components/students/StudentDetails.tsx
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Heart,
  AlertTriangle,
  Edit,
  Trash2,
  BookOpen,
  Award,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  Download,
  Filter,
  ScrollText,
  User2,
} from "lucide-react";
import { Student, Enrollment, GradeWithDetails } from "../../types/academic";
import { useAcademicStore } from "../../store/studentStore";
import { useEnrollmentStore } from "../../store/enrollmentStore";
import { usePaymentStore } from "../../store/paymentStore";
import { useInitialData } from "@/hooks/useInitialData";
import { Checkbox } from "../ui/checkbox";
import { useFeeStructureStore } from "@/store/feeStructureStore";
import { StudentFeesSection } from "../StudentFeesSection";
import { GradesModal } from "./GradesModal";
import { useGradeStore } from "@/store/gradeStore";
import { DocumentGeneratorModal } from "@/components/documents/DocumentGeneratorModal";
import { useDocumentStore } from "@/store/documentStore";
import { DocumentTypeI } from "@/types/academic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAuthStore } from "@/store/authStore";

interface StudentDetailsProps {
  student: Student;
  onClose: () => void;
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
}

export const StudentDetails = ({
  student,
  onClose,
  onEdit,
  onDelete,
}: StudentDetailsProps) => {
  useInitialData();

  const {
    getStudentGrades,
    getStudentGuardians,
    getStudentRetakes,
    fetchGrades,
    fetchUEs,
    ues,
  } = useAcademicStore();

  // CORRECTION: Utiliser le store des notes directement
  const { grades: allGrades, fetchGrades: fetchAllGrades } = useGradeStore();
  const { enrollments, getEnrollmentsByStudent } = useEnrollmentStore();
  const { payments, getPaymentsByStudent, getTotalAmount, getPaidAmount } =
    usePaymentStore();

  const [activeTab, setActiveTab] = useState("info");
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const guardians = getStudentGuardians(student.id);
  const retakes = getStudentRetakes(student.id);
  const studentEnrollments = getEnrollmentsByStudent(student.id);
  const studentPayments = getPaymentsByStudent(student.id);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const { studentFees, getStudentFees, getStudentFeeByYear } =
    useFeeStructureStore();
  const { user } = useAuthStore();
  const [currentStudentFee, setCurrentStudentFee] = useState<any>(null);
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    type: DocumentTypeI;
    enrollment: Enrollment | null;
  }>({
    isOpen: false,
    type: DocumentTypeI.BULLETIN,
    enrollment: null,
  });

  useEffect(() => {
    const loadStudentGrades = async () => {
      if (student.id) {
        setLoadingGrades(true);
        try {
          // Option 1: Utiliser le store académique si disponible
          const studentGrades = getStudentGrades(student.id);
          if (studentGrades && studentGrades.length > 0) {
            setGrades(studentGrades);
          } else {
            // Option 2: Filtrer depuis le store des notes
            const filteredGrades = allGrades.filter(
              (grade) => grade.studentId === student.id
            );
            setGrades(filteredGrades as GradeWithDetails[]);

            // Si toujours pas de notes, essayer de les charger
            if (filteredGrades.length === 0) {
              await fetchAllGrades({ studentId: student.id });
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement des notes:", error);
        } finally {
          setLoadingGrades(false);
        }
      }
    };

    if (activeTab === "academic" || activeTab === "enrollments") {
      loadStudentGrades();
    }
  }, [student.id, activeTab, allGrades, getStudentGrades, fetchAllGrades]);

  const loadStudentFeeData = async () => {
    try {
      await getStudentFees(student.id);
      if (currentEnrollment) {
        const fee = await getStudentFeeByYear(
          student.id,
          currentEnrollment.academicYear
        );
        setCurrentStudentFee(fee);
      }
    } catch (error) {
      console.error("Error loading fee data:", error);
    }
  };
  // CORRECTION: Fonction pour obtenir les notes d'une inscription spécifique
  const getGradesForEnrollment = (
    enrollment: Enrollment
  ): GradeWithDetails[] => {
    return grades.filter(
      (grade) =>
        grade.studentId === enrollment.studentId &&
        grade.academicYearId === enrollment.academicYearId
    );
  };

  // CORRECTION: Fonction pour ouvrir le modal des notes
  const handleViewGrades = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    const enrollmentGrades = getGradesForEnrollment(enrollment);
    console.log("Notes pour l'inscription:", {
      enrollment,
      gradesCount: enrollmentGrades.length,
      grades: enrollmentGrades,
    });
    setShowGradesModal(true);
  };
  // Fonction pour ouvrir le modal des notes
  // const handleViewGrades = (enrollment: Enrollment) => {
  //   setSelectedEnrollment(enrollment);
  //   setShowGradesModal(true);
  // };

  // Fonctions pour ouvrir les modaux
  const openDocumentModal = (type: DocumentTypeI, enrollment: Enrollment) => {
    setDocumentModal({
      isOpen: true,
      type,
      enrollment,
    });
  };

  // Fonction pour fermer le modal
  const handleCloseGradesModal = () => {
    setShowGradesModal(false);
    setSelectedEnrollment(null);
  };

  // Fonction pour générer le bulletin
  const handleGenerateReport = (session?: string) => {
    console.log("Générer bulletin pour:", {
      student: `${student.firstName} ${student.lastName}`,
      enrollment: selectedEnrollment,
      session: session || "toutes sessions",
    });
    // Implémentez ici la logique de génération du bulletin
  };

  useEffect(() => {
    // Charger les données supplémentaires si nécessaire
    if (activeTab === "payments" && studentPayments.length === 0) {
      // Potentiellement charger les paiements ici
    }
    if (activeTab === "enrollments" && studentEnrollments.length === 0) {
      // Potentiellement charger les inscriptions ici
    }
    if (grades.length === 0) {
      fetchGrades();
    }
    if (ues.length === 0) {
      fetchUEs();
    }
  }, [activeTab]);

  // Trouver l'inscription active
  const currentEnrollment =
    studentEnrollments.find((e) => e.status === "Active") ||
    studentEnrollments[studentEnrollments.length - 1];

  const getStatusBadge = (status: Student["status"]) => {
    const config = {
      Active: { variant: "default" as const, label: "Actif" },
      Inactive: { variant: "secondary" as const, label: "Inactif" },
      Graduated: { variant: "outline" as const, label: "Diplômé" },
      Suspended: { variant: "destructive" as const, label: "Suspendu" },
    };

    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + grade.grade, 0);
    return Math.round((total / grades.length) * 100) / 100;
  };

  const getSuccessRate = () => {
    if (grades.length === 0) return 0;
    const validatedGrades = grades.filter((g) => g.status === "Valid_").length;
    return Math.round((validatedGrades / grades.length) * 100);
  };

  // Convertir le niveau en format texte
  const getLevelText = (level: string) => {
    const levelNum = parseInt(level);
    if (isNaN(levelNum)) return level;
    if (levelNum === 1) return "1ère année";
    return `${levelNum}ème année`;
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-h-[90vh] overflow-auto animate-fade-in">
      {/* En-tête avec photo et infos principales */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-grid-small-white/10 animate-pulse" />
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-8">
              <Avatar className="w-28 h-28 border-4 border-background shadow-xl hover-scale transition-all duration-300">
                <AvatarImage
                  src={student.photo}
                  alt={`${student.firstName} ${student.lastName}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 animate-scale-in">
                    <h1 className="text-3xl font-bold tracking-tight story-link">
                      {student.firstName} {student.lastName}
                    </h1>
                    {getStatusBadge(student.status)}
                  </div>
                  {currentEnrollment && (
                    <p className="text-muted-foreground">
                      {currentEnrollment.faculty} •{" "}
                      {getLevelText(currentEnrollment.level)} •{" "}
                      {currentEnrollment.academicYear}
                    </p>
                  )}
                </div>

                {/* Statistiques rapides */}
                <div
                  className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in"
                  style={{ animationDelay: "0.2s" }}
                >
                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="text-center p-3 rounded-lg bg-background/50 border cursor-pointer hover:bg-background/80 hover-scale transition-all duration-300 hover:shadow-lg">
                        <div className="text-2xl font-bold text-primary animate-scale-in">
                          {calculateGPA()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Moyenne
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Moyenne Générale</h4>
                        <p className="text-sm text-muted-foreground">
                          Calculée sur {grades.length} notes enregistrées
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="text-center p-3 rounded-lg bg-background/50 border cursor-pointer hover:bg-background/80 hover-scale transition-all duration-300 hover:shadow-lg">
                        <div className="text-2xl font-bold text-green-600 animate-scale-in">
                          {getSuccessRate()}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Réussite
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Taux de Réussite</h4>
                        <p className="text-sm text-muted-foreground">
                          {grades.filter((g) => g.status === "Valid_").length}{" "}
                          Cours validées sur {grades.length}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="text-center p-3 rounded-lg bg-background/50 border cursor-pointer hover:bg-background/80 hover-scale transition-all duration-300 hover:shadow-lg">
                        <div className="text-2xl font-bold text-yellow-600 animate-scale-in">
                          {retakes.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rattrapages
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Rattrapages</h4>
                        <p className="text-sm text-muted-foreground">
                          {
                            retakes.filter((r) => r.status === "Programmé")
                              .length
                          }{" "}
                          programmés,{" "}
                          {retakes.filter((r) => r.status === "Terminé").length}{" "}
                          terminés
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="text-center p-3 rounded-lg bg-background/50 border cursor-pointer hover:bg-background/80 hover-scale transition-all duration-300 hover:shadow-lg">
                        <div className="text-2xl font-bold text-blue-600 animate-scale-in">
                          {getPaidAmount({
                            studentId: student.id,
                          }).toLocaleString()}{" "}
                          HTG
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Payés
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Paiements</h4>
                        <p className="text-sm text-muted-foreground">
                          {getPaidAmount({
                            studentId: student.id,
                          }).toLocaleString()}{" "}
                          HTG sur{" "}
                          {getTotalAmount({
                            studentId: student.id,
                          }).toLocaleString()}{" "}
                          HTG
                        </p>
                        <Progress
                          value={
                            (getPaidAmount({ studentId: student.id }) /
                              Math.max(
                                getTotalAmount({ studentId: student.id }),
                                1
                              )) *
                            100
                          }
                          className="w-full"
                        />
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 animate-slide-in-right">
              {user?.role === "Admin" && (
                <>
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(student)}
                      className="backdrop-blur-sm hover-scale transition-all duration-300"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="backdrop-blur-sm hover-scale transition-all duration-300 text-destructive border-destructive hover:bg-destructive hover:text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirmer la suppression
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer l'étudiant{" "}
                            <strong>
                              {student.firstName} {student.lastName}
                            </strong>{" "}
                            ? Cette action est irréversible et supprimera toutes
                            les données associées (notes, paiements, etc.).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(student.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer définitivement
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs
        defaultValue="info"
        className="w-full animate-fade-in"
        style={{ animationDelay: "0.3s" }}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-6 h-12 p-1 bg-muted/50 hover:shadow-md transition-shadow duration-300">
          <TabsTrigger
            value="info"
            className="flex items-center gap-2 data-[state=active]:bg-background hover-scale transition-all duration-200"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Informations</span>
          </TabsTrigger>
          <TabsTrigger
            value="academic"
            className="flex items-center gap-2 data-[state=active]:bg-background hover-scale transition-all duration-200"
          >
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Académique</span>
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Frais</span>
            <Badge variant="secondary">
              {currentStudentFee ? "Défini" : "Non défini"}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="flex items-center gap-2 data-[state=active]:bg-background hover-scale transition-all duration-200"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Paiements</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {studentPayments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="enrollments"
            className="flex items-center gap-2 data-[state=active]:bg-background hover-scale transition-all duration-200"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Inscriptions</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {studentEnrollments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="guardians"
            className="flex items-center gap-2 data-[state=active]:bg-background hover-scale transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Tuteurs</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {guardians.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        <TabsContent value="info" className="mt-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {/* Informations personnelles */}
            <Card
              className="group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                    <User className="h-5 w-5" />
                  </div>
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{student.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Téléphone
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {student.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date de Naissance
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {student.dateOfBirth
                          ? formatDate(student.dateOfBirth)
                          : "Non renseignée"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Lieu de Naissance
                    </label>
                    <p className="font-medium mt-1">
                      {student.placeOfBirth || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      CIN
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <ScrollText className="h-4 w-4 text-muted-foreground" />
                      {student.cin ? (
                        <p className="font-medium">{student.cin}</p>
                      ) : (
                        <p className="text-muted-foreground italic">
                          Non renseigné
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Sexe
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <User2 className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="capitalize">
                        {student.sexe || "Non spécifié"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de contact et adresse */}
            <Card
              className="group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-scale-in lg:col-span-2 xl:col-span-1"
              style={{ animationDelay: "0.3s" }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                    <MapPin className="h-5 w-5" />
                  </div>
                  Contact & Adresse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Adresse Complète
                  </label>
                  <p className="font-medium mt-1 leading-relaxed">
                    {student.address || "Non renseignée"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ID Étudiant
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {student.studentId}
                    </code>
                  </div>
                </div>
                {student.bloodGroup && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Groupe Sanguin
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive" className="font-mono">
                        {student.bloodGroup}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations médicales */}
            {(student.allergies || student.disabilities) && (
              <Card className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    Informations Médicales
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  {student.allergies && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <label className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Allergies
                      </label>
                      <p className="font-medium mt-2 text-red-900 dark:text-red-300">
                        {student.allergies}
                      </p>
                    </div>
                  )}
                  {student.disabilities && (
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                      <label className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Handicaps / Besoins Spéciaux
                      </label>
                      <p className="font-medium mt-2 text-orange-900 dark:text-orange-300">
                        {student.disabilities}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="academic" className="mt-6">
          <div className="space-y-6">
            {/* Statistiques académiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {grades.filter((g) => g.status === "Valid_").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Cours Validées
                </div>
                <Progress
                  value={
                    (grades.filter((g) => g.status === "Valid_").length /
                      Math.max(grades.length, 1)) *
                    100
                  }
                  className="mt-2"
                />
              </Card>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {retakes.length}
                </div>
                <div className="text-sm text-muted-foreground">Rattrapages</div>
              </Card>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-primary mb-1">
                  {calculateGPA()}
                </div>
                <div className="text-sm text-muted-foreground">Moyenne</div>
                <Progress
                  value={(calculateGPA() / 20) * 100}
                  className="mt-2"
                />
              </Card>
            </div>

            {/* Détails des notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Notes et Résultats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length > 0 ? (
                  <div className="space-y-4">
                    {grades.map((grade) => (
                      <div
                        key={grade.id}
                        className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">
                                {grade.ue.title}
                              </h4>
                              <Badge
                                variant={
                                  grade.status === "Valid_"
                                    ? ("default" as const)
                                    : grade.status === "Non_valid_"
                                    ? ("secondary" as const)
                                    : ("destructive" as const)
                                }
                              >
                                {grade.status}
                              </Badge>
                              <Badge
                                variant={
                                  grade.session === "Normale"
                                    ? ("secondary" as const)
                                    : grade.session === "Reprise"
                                    ? ("destructive" as const)
                                    : ("default" as const)
                                }
                              >
                                {grade.session}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Semestre {grade.semester} •{" "}
                              {grade.academicYear.year}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {grade.grade > 0 ? grade.grade : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Coefficient: {100}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Aucune note enregistrée
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="mt-6">
          <div className="space-y-6">
            {/* Chargement des données de frais */}
            {activeTab === "fees" && (
              <div className="animate-fade-in">
                <StudentFeesSection
                  student={student}
                  currentEnrollment={currentEnrollment}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="space-y-6">
            {/* Résumé financier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-primary mb-1">
                  {getTotalAmount({ studentId: student.id }).toLocaleString()}{" "}
                  HTG
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Facturé
                </div>
              </Card>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {getPaidAmount({ studentId: student.id }).toLocaleString()}{" "}
                  HTG
                </div>
                <div className="text-sm text-muted-foreground">Payé</div>
              </Card>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-destructive mb-1">
                  {(
                    getTotalAmount({ studentId: student.id }) -
                    getPaidAmount({ studentId: student.id })
                  ).toLocaleString()}{" "}
                  HTG
                </div>
                <div className="text-sm text-muted-foreground">Solde</div>
              </Card>
            </div>

            {/* Historique des paiements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Historique des Paiements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentPayments.length > 0 ? (
                  <div className="space-y-3">
                    {studentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{payment.type}</h4>
                              <Badge
                                variant={
                                  payment.status === "Payé"
                                    ? "default"
                                    : payment.status === "En attente"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {payment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {payment.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {payment.paidDate && (
                                <span>
                                  Payé le: {formatDate(payment.paidDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">
                              {payment.amount.toLocaleString()} HTG
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.academicYear}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Aucun paiement enregistré
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <BookOpen className="h-6 w-6" />
                Historique des Inscriptions
              </CardTitle>
              <p className="text-blue-100 font-light">
                Parcours académique de {student.firstName} {student.lastName}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {studentEnrollments.length > 0 ? (
                <div className="overflow-hidden">
                  {/* Regrouper les inscriptions par faculté */}
                  {Object.entries(
                    studentEnrollments.reduce((acc, enrollment) => {
                      if (!acc[enrollment.faculty]) {
                        acc[enrollment.faculty] = [];
                      }
                      acc[enrollment.faculty].push(enrollment);
                      return acc;
                    }, {} as Record<string, Enrollment[]>)
                  ).map(([faculty, enrollments]) => (
                    <div key={faculty} className="mb-6 last:mb-0">
                      {/* En-tête de faculté */}
                      <div className="bg-slate-100 dark:bg-slate-800 px-6 py-3">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          {faculty}
                        </h3>
                      </div>

                      {/* Tableau des inscriptions */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Niveau
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Année Académique
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Statut
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Date d'Inscription
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {enrollments.map((enrollment) => {
                              return (
                                <tr
                                  key={enrollment.id}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors duration-150"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-slate-900 dark:text-white">
                                      {getLevelText(enrollment.level)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge
                                      variant="outline"
                                      className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                                    >
                                      {enrollment.academicYear}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge
                                      variant={
                                        enrollment.status === "Active"
                                          ? "default"
                                          : enrollment.status === "Completed"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="flex items-center gap-1 w-fit"
                                    >
                                      {enrollment.status === "Active" && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                      {enrollment.status === "Active"
                                        ? "Actif"
                                        : enrollment.status === "Completed"
                                        ? "Terminé"
                                        : enrollment.status}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                    {formatDate(enrollment.enrollmentDate)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex gap-2 justify-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        onClick={() =>
                                          handleViewGrades(enrollment)
                                        }
                                        title="Voir les notes"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>

                                      {/* Menu déroulant pour tous les documents */}
                                      <Select
                                        onValueChange={(value: DocumentTypeI) =>
                                          openDocumentModal(value, enrollment)
                                        }
                                      >
                                        <SelectTrigger className="h-8 w-32 bg-green-50 text-green-600 hover:bg-green-100 border-green-200">
                                          <SelectValue placeholder="Documents" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem
                                            value={DocumentTypeI.BULLETIN}
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4" />
                                              Bulletin
                                            </div>
                                          </SelectItem>
                                          <SelectItem
                                            value={DocumentTypeI.RELEVE}
                                          >
                                            <div className="flex items-center gap-2">
                                              <BookOpen className="h-4 w-4" />
                                              Relevé
                                            </div>
                                          </SelectItem>
                                          <SelectItem
                                            value={
                                              DocumentTypeI.ATTESTATION_NIVEAU
                                            }
                                          >
                                            <div className="flex items-center gap-2">
                                              <GraduationCap className="h-4 w-4" />
                                              Attestation Niveau
                                            </div>
                                          </SelectItem>
                                          <SelectItem
                                            value={
                                              DocumentTypeI.ATTESTATION_FIN_ETUDES
                                            }
                                          >
                                            <div className="flex items-center gap-2">
                                              <Award className="h-4 w-4" />
                                              Fin d'Études
                                            </div>
                                          </SelectItem>
                                          <SelectItem
                                            value={
                                              DocumentTypeI.CERTIFICAT_SCOLARITE
                                            }
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4" />
                                              Scolarité
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Aucune inscription enregistrée
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Cet étudiant n'a pas encore d'inscription.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tuteurs et Responsables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guardians.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {guardians.map((guardian) => (
                    <Card
                      key={guardian.id}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold">
                            {guardian.firstName} {guardian.lastName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {guardian.relationship}
                            {guardian.isPrimary && " • Principal"}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{guardian.phone}</span>
                          </div>
                          {guardian.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{guardian.email}</span>
                            </div>
                          )}
                          {guardian.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-muted-foreground">
                                {guardian.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucun tuteur enregistré
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {documentModal.isOpen && documentModal.enrollment && (
        <DocumentGeneratorModal
          student={student}
          enrollment={documentModal.enrollment}
          isOpen={documentModal.isOpen}
          onClose={() =>
            setDocumentModal({
              isOpen: false,
              type: DocumentTypeI.BULLETIN,
              enrollment: null,
            })
          }
          documentType={documentModal.type}
        />
      )}

      {showGradesModal && selectedEnrollment && (
        <GradesModal
          enrollment={selectedEnrollment}
          student={student}
          grades={grades.filter(
            (grade) =>
              grade.studentId === selectedEnrollment.studentId &&
              grade.academicYearId === selectedEnrollment.academicYearId
          )}
          onClose={() => setShowGradesModal(false)}
          onGenerateReport={(session) => {
            console.log("Générer bulletin pour:", session);
          }}
        />
      )}
    </div>
  );
};
