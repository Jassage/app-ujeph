// src/components/students/StudentForm.tsx
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  ScrollText,
  Upload,
  X,
} from "lucide-react";
import { useAcademicStore } from "@/store/studentStore";
import {
  Student,
  Guardian,
  StudentFormData,
  StudentStatus,
  StudentSexe,
  BloodGroup,
  GuardianFormData,
} from "@/types/academic";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fonction pour vérifier si l'étudiant a au moins 16 ans
const isAtLeast16YearsOld = (dateString: string): boolean => {
  if (!dateString) return true;

  const today = new Date();
  const birthDate = new Date(dateString);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= 16;
  }

  return age >= 16;
};

// Schémas de validation avec Zod - CORRIGÉ
const GuardianSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100),
  relationship: z.string().min(1, "La relation est requise").max(50),
  phone: z
    .string()
    .min(8, "Le téléphone doit contenir au moins 8 caractères")
    .max(20),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  isPrimary: z.boolean().default(false),
});

// Définir les valeurs possibles pour les enums
const StudentStatusValues = [
  "Active",
  "Inactive",
  "Graduated",
  "Suspended",
] as const;
const StudentSexeValues = ["Masculin", "Feminin", "Autre"] as const;
const BloodGroupValues = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
] as const;

const StudentCreateSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100),
  studentId: z.string().min(1, "L'ID étudiant est requis").max(50),
  email: z.string().email("Email invalide").max(255),
  phone: z.string().max(20).optional(),
  dateOfBirth: z
    .string()
    .min(1, "La date de naissance est requise")
    .refine((date) => isAtLeast16YearsOld(date), {
      message: "L'étudiant doit avoir au moins 16 ans",
    }),
  placeOfBirth: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  bloodGroup: z.enum(BloodGroupValues).optional(),
  allergies: z.string().max(500).optional(),
  disabilities: z.string().max(500).optional(),
  cin: z.string().max(20).optional(),
  sexe: z.enum(StudentSexeValues).optional(),
  status: z.enum(StudentStatusValues).default("Active"),
});

const StudentUpdateSchema = StudentCreateSchema.partial();

// Type pour les données du formulaire
type StudentFormValues = z.infer<typeof StudentCreateSchema>;

interface StudentFormProps {
  student?: Student | null;
  onClose: () => void;
}

export const StudentForm = ({ student, onClose }: StudentFormProps) => {
  const { addStudent, updateStudent, loading } = useAcademicStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(student ? StudentUpdateSchema : StudentCreateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      studentId: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      placeOfBirth: "",
      address: "",
      bloodGroup: undefined,
      allergies: "",
      disabilities: "",
      cin: "",
      sexe: undefined,
      status: "Active",
    },
  });

  // Alternative sans appel à la base de données
  const generateStudentId = (): string => {
    const year = new Date().getFullYear();

    // Générer un ID basé sur le timestamp pour éviter les doublons
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(1000 + Math.random() * 9000);

    return `STU${year}${timestamp}${random}`.slice(0, 15); // Limiter à 15 caractères
  };

  // CORRECTION : Génération automatique de l'ID étudiant
  // const generateStudentId = async (): Promise<string> => {
  //   setIsGeneratingId(true);

  //   try {
  //     // Récupérer l'année courante
  //     const year = new Date().getFullYear();

  //     // Chercher le dernier ID étudiant de cette année
  //     const lastStudent = await prisma.student.findFirst({
  //       where: {
  //         studentId: {
  //           startsWith: `STU${year}`,
  //         },
  //       },
  //       orderBy: {
  //         studentId: "desc",
  //       },
  //       select: {
  //         studentId: true,
  //       },
  //     });

  //     let sequence = 1;

  //     if (lastStudent?.studentId) {
  //       // Extraire la séquence du dernier ID
  //       const lastSequence = parseInt(lastStudent.studentId.slice(-4));
  //       sequence = lastSequence + 1;
  //     }

  //     // Formater la séquence sur 4 chiffres (0001, 0002, etc.)
  //     const formattedSequence = sequence.toString().padStart(4, "0");

  //     return `STU${year}${formattedSequence}`;
  //   } catch (error) {
  //     console.error("Erreur génération ID étudiant:", error);
  //     // Fallback : génération aléatoire
  //     const year = new Date().getFullYear();
  //     const random = Math.floor(1000 + Math.random() * 9000);
  //     return `STU${year}${random}`;
  //   } finally {
  //     setIsGeneratingId(false);
  //   }
  // };

  // CORRECTION : Fonction pour régénérer l'ID
  const handleRegenerateId = async () => {
    if (student) return; // Ne pas régénérer pour la modification

    try {
      const newStudentId = await generateStudentId();
      form.setValue("studentId", newStudentId);
    } catch (error) {
      console.error("Erreur régénération ID:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer un nouvel ID étudiant",
        variant: "destructive",
      });
    }
  };

  // CORRECTION : Générer l'ID automatiquement au chargement pour les nouveaux étudiants
  useEffect(() => {
    const initializeStudentId = async () => {
      if (!student) {
        try {
          const newStudentId = await generateStudentId();
          form.setValue("studentId", newStudentId);
        } catch (error) {
          console.error("Erreur initialisation ID étudiant:", error);
        }
      }
    };

    initializeStudentId();
  }, [student, form]);

  const [guardians, setGuardians] = useState<GuardianFormData[]>([
    {
      firstName: "",
      lastName: "",
      relationship: "Père",
      phone: "",
      email: "",
      address: "",
      isPrimary: true,
    },
  ]);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Réinitialiser le formulaire
  const resetForm = () => {
    form.reset();
    setGuardians([
      {
        firstName: "",
        lastName: "",
        relationship: "Père",
        phone: "",
        email: "",
        address: "",
        isPrimary: true,
      },
    ]);
    setProfileImage(null);
    setProfileFile(null);
    setImageError(false);
    setFormError(null);
  };

  useEffect(() => {
    if (student) {
      // Vérifier si l'étudiant a au moins 16 ans
      const isAdult = student.dateOfBirth
        ? isAtLeast16YearsOld(student.dateOfBirth.split("T")[0])
        : true;

      form.reset({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        studentId: student.studentId || "",
        email: student.email || "",
        phone: student.phone || "",
        dateOfBirth: student.dateOfBirth?.split("T")[0] || "",
        placeOfBirth: student.placeOfBirth || "",
        address: student.address || "",
        bloodGroup: student.bloodGroup || undefined, // ⚠️ Doit correspondre aux valeurs de l'enum
        allergies: student.allergies || "",
        disabilities: student.disabilities || "",
        cin: student.cin || "",
        sexe: student.sexe || undefined, // ⚠️ Doit correspondre aux valeurs de l'enum
        status: student.status || "Active",
      });

      // Debug pour vérifier les valeurs
      console.log("🔍 Données étudiant chargées:", {
        bloodGroup: student.bloodGroup,
        sexe: student.sexe,
        formValues: {
          bloodGroup: student.bloodGroup || undefined,
          sexe: student.sexe || undefined,
        },
      });

      // Avertir si l'étudiant a moins de 16 ans
      if (!isAdult) {
        toast({
          title: "Attention",
          description:
            "Cet étudiant a moins de 16 ans. Veuillez vérifier les informations.",
          variant: "destructive",
        });
      }

      // Charger la photo existante
      if (student.photo) {
        setIsLoading(true);
        setImageError(false);
        // Simulation de chargement d'image
        setTimeout(() => {
          setProfileImage(null); // À remplacer par l'URL réelle
          setIsLoading(false);
        }, 1000);
      } else {
        setIsLoading(false);
      }

      if (student.guardians && student.guardians.length > 0) {
        setGuardians(
          student.guardians.map((g) => ({
            firstName: g.firstName,
            lastName: g.lastName,
            relationship: g.relationship,
            phone: g.phone,
            email: g.email || "",
            address: g.address || "",
            isPrimary: g.isPrimary,
          }))
        );
      } else {
        setGuardians([
          {
            firstName: "",
            lastName: "",
            relationship: "Père",
            phone: "",
            email: "",
            address: "",
            isPrimary: true,
          },
        ]);
      }
    }
  }, [student, form]);

  const addGuardian = () => {
    const newGuardian: GuardianFormData = {
      firstName: "",
      lastName: "",
      relationship: "Mère",
      phone: "",
      email: "",
      address: "",
      isPrimary: false,
    };
    setGuardians([...guardians, newGuardian]);
  };

  const removeGuardian = (index: number) => {
    if (guardians.length > 1) {
      const updatedGuardians = guardians.filter((_, i) => i !== index);

      // Si on supprime le responsable principal, désigner le premier comme principal
      if (guardians[index].isPrimary && updatedGuardians.length > 0) {
        updatedGuardians[0].isPrimary = true;
      }

      setGuardians(updatedGuardians);
    } else {
      toast({
        title: "Attention",
        description: "Au moins un responsable est requis",
        variant: "destructive",
      });
    }
  };

  const updateGuardian = (
    index: number,
    field: keyof GuardianFormData,
    value: string | boolean
  ) => {
    const updatedGuardians = [...guardians];
    updatedGuardians[index] = {
      ...updatedGuardians[index],
      [field]: value,
    };
    setGuardians(updatedGuardians);
  };

  const setPrimaryGuardian = (index: number) => {
    const updatedGuardians = guardians.map((guardian, i) => ({
      ...guardian,
      isPrimary: i === index,
    }));
    setGuardians(updatedGuardians);
  };

  const validateGuardians = (): string[] => {
    const errors: string[] = [];

    if (guardians.length === 0) {
      errors.push("Au moins un responsable est requis");
      return errors;
    }

    // Vérifier qu'il y a exactement un responsable principal
    const primaryGuardians = guardians.filter((g) => g.isPrimary);
    if (primaryGuardians.length !== 1) {
      errors.push(
        "Un et un seul responsable doit être désigné comme principal"
      );
    }

    // Valider chaque gardien
    guardians.forEach((guardian, index) => {
      if (!guardian.firstName?.trim()) {
        errors.push(`Responsable ${index + 1}: Le prénom est requis`);
      }
      if (!guardian.lastName?.trim()) {
        errors.push(`Responsable ${index + 1}: Le nom est requis`);
      }
      if (!guardian.phone?.trim()) {
        errors.push(`Responsable ${index + 1}: Le téléphone est requis`);
      } else if (guardian.phone.length < 8) {
        errors.push(
          `Responsable ${
            index + 1
          }: Le téléphone doit contenir au moins 8 caractères`
        );
      }
      if (
        guardian.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardian.email)
      ) {
        errors.push(`Responsable ${index + 1}: Format d'email invalide`);
      }
    });

    return errors;
  };

  const handleImageUpload = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Seuls les formats JPEG, PNG, GIF et WebP sont autorisés",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: "La photo ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
      setImageError(false);
    };
    reader.onerror = () => {
      setImageError(true);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'image",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
    setProfileFile(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileFile(null);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    toast({
      title: "Erreur",
      description: "Impossible d'afficher l'image",
      variant: "destructive",
    });
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Validation des responsables
      const guardianErrors = validateGuardians();
      if (guardianErrors.length > 0) {
        setFormError(guardianErrors.join(", "));
        setActiveTab("guardians");
        setIsSubmitting(false);
        return;
      }

      // Préparer les données pour le store - CORRIGÉ
      const studentData: StudentFormData = {
        firstName: data.firstName,
        lastName: data.lastName,
        studentId: data.studentId,
        email: data.email,
        phone: data.phone || "",
        dateOfBirth: data.dateOfBirth,
        placeOfBirth: data.placeOfBirth || "",
        address: data.address || "",
        bloodGroup: data.bloodGroup,
        allergies: data.allergies || "",
        disabilities: data.disabilities || "",
        cin: data.cin || "",
        sexe: data.sexe,
        status: data.status,
        guardians: guardians
          .filter((g) => g.firstName && g.lastName && g.phone)
          .map((g) => ({
            firstName: g.firstName,
            lastName: g.lastName,
            relationship: g.relationship,
            phone: g.phone,
            email: g.email || undefined,
            address: g.address || undefined,
            isPrimary: g.isPrimary,
          })),
      };

      if (student) {
        await updateStudent(student.id, studentData, profileFile || undefined);
        toast({
          title: "Succès",
          description: "Étudiant modifié avec succès",
        });
      } else {
        await addStudent(studentData, profileFile || undefined);
        toast({
          title: "Succès",
          description: "Étudiant créé avec succès",
        });
      }

      onClose();
    } catch (error: any) {
      console.error("Erreur:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Une erreur est survenue lors de l'enregistrement";

      setFormError(errorMessage);

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroupOptions = [
    { value: "A_POSITIVE", label: "A+" },
    { value: "A_NEGATIVE", label: "A-" },
    { value: "B_POSITIVE", label: "B+" },
    { value: "B_NEGATIVE", label: "B-" },
    { value: "AB_POSITIVE", label: "AB+" },
    { value: "AB_NEGATIVE", label: "AB-" },
    { value: "O_POSITIVE", label: "O+" },
    { value: "O_NEGATIVE", label: "O-" },
  ] as const;

  const relationshipOptions = [
    "Père",
    "Mère",
    "Tuteur",
    "Tutrice",
    "Frère",
    "Sœur",
    "Oncle",
    "Tante",
    "Grand-père",
    "Grand-mère",
    "Autre",
  ];

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="student" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Étudiant
          </TabsTrigger>

          <TabsTrigger value="guardians" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Responsables
            <Badge variant="secondary" className="ml-1">
              {guardians.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col"
          >
            <ScrollArea className="flex-1 pr-4">
              {formError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="student" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations personnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Photo de profil */}
                    <div className="space-y-3">
                      <Label htmlFor="photo">Photo de profil</Label>
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300 relative group">
                            {isLoading ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                              </div>
                            ) : profileImage && !imageError ? (
                              <>
                                <img
                                  src={profileImage}
                                  alt="Profile preview"
                                  className="w-full h-full object-cover"
                                  onError={handleImageError}
                                />
                                <button
                                  type="button"
                                  onClick={removeImage}
                                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <User className="h-10 w-10 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <Input
                              id="photo"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file);
                                }
                              }}
                              className="max-w-xs"
                              disabled={isSubmitting}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Formats supportés: JPEG, PNG, GIF, WebP (max 5MB)
                            </p>
                            {student && (
                              <p className="text-sm text-muted-foreground">
                                Laisser vide pour conserver la photo actuelle.
                              </p>
                            )}
                          </div>
                          {imageError && (
                            <p className="text-sm text-destructive">
                              Impossible de charger l'image. Veuillez en
                              sélectionner une nouvelle.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Jean"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Dupont"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="studentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              ID Étudiant *
                              {isGeneratingId && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                              )}
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  readOnly
                                  className="bg-muted font-mono"
                                  disabled={isSubmitting || isGeneratingId}
                                  placeholder="Génération automatique..."
                                />
                              </FormControl>
                              {!student && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRegenerateId}
                                  disabled={isSubmitting || isGeneratingId}
                                  className="whitespace-nowrap"
                                >
                                  {isGeneratingId ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  ) : (
                                    "🔄"
                                  )}
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                            {!student && (
                              <p className="text-sm text-muted-foreground mt-1">
                                ID généré automatiquement. Cliquez sur 🔄 pour
                                en générer un nouveau.
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                placeholder="jean.dupont@example.com"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="+33 1 23 45 67 89"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de Naissance *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                max={new Date().toISOString().split("T")[0]}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="123 Rue de l'Exemple, 75000 Paris"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="placeOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lieu de Naissance</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Paris"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bloodGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Groupe Sanguin</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un groupe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {bloodGroupOptions.map((option) => (
                                  <SelectItem
                                    key={option.value} // ⚠️ CORRECTION : Utilisez option.value comme clé unique
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CIN / Numéro d'identité</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="1234567890123"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sexe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sexe</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le sexe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Masculin">
                                  Masculin
                                </SelectItem>
                                <SelectItem value="Feminin">Féminin</SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="allergies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allergies</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Aucune connue"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="disabilities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Handicaps / Besoins spécifiques
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Aucun"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un statut" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Actif</SelectItem>
                              <SelectItem value="Inactive">Inactif</SelectItem>
                              <SelectItem value="Graduated">Diplômé</SelectItem>
                              <SelectItem value="Suspended">
                                Suspendu
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="guardians" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Personnes responsables ({guardians.length})</span>
                      <Button
                        type="button"
                        onClick={addGuardian}
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {guardians.map((guardian, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-4 relative"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium flex items-center gap-2">
                            Responsable {index + 1}
                            {guardian.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                Principal
                              </Badge>
                            )}
                          </h4>
                          {guardians.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGuardian(index)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`guardian-firstName-${index}`}>
                              Prénom *
                            </Label>
                            <Input
                              id={`guardian-firstName-${index}`}
                              value={guardian.firstName}
                              onChange={(e) =>
                                updateGuardian(
                                  index,
                                  "firstName",
                                  e.target.value
                                )
                              }
                              placeholder="Marie"
                              disabled={isSubmitting}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`guardian-lastName-${index}`}>
                              Nom *
                            </Label>
                            <Input
                              id={`guardian-lastName-${index}`}
                              value={guardian.lastName}
                              onChange={(e) =>
                                updateGuardian(
                                  index,
                                  "lastName",
                                  e.target.value
                                )
                              }
                              placeholder="Dupont"
                              disabled={isSubmitting}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`guardian-relationship-${index}`}>
                              Lien de parenté *
                            </Label>
                            <Select
                              value={guardian.relationship}
                              onValueChange={(value) =>
                                updateGuardian(index, "relationship", value)
                              }
                              disabled={isSubmitting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un lien" />
                              </SelectTrigger>
                              <SelectContent>
                                {relationshipOptions.map((relation) => (
                                  <SelectItem key={relation} value={relation}>
                                    {relation}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`guardian-phone-${index}`}>
                              Téléphone *
                            </Label>
                            <Input
                              id={`guardian-phone-${index}`}
                              value={guardian.phone}
                              onChange={(e) =>
                                updateGuardian(index, "phone", e.target.value)
                              }
                              placeholder="+33 1 23 45 67 89"
                              disabled={isSubmitting}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`guardian-email-${index}`}>
                              Email
                            </Label>
                            <Input
                              id={`guardian-email-${index}`}
                              type="email"
                              value={guardian.email || ""}
                              onChange={(e) =>
                                updateGuardian(index, "email", e.target.value)
                              }
                              placeholder="marie.dupont@example.com"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`guardian-address-${index}`}>
                              Adresse
                            </Label>
                            <Input
                              id={`guardian-address-${index}`}
                              value={guardian.address || ""}
                              onChange={(e) =>
                                updateGuardian(index, "address", e.target.value)
                              }
                              placeholder="123 Rue de l'Exemple, 75000 Paris"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`guardian-primary-${index}`}
                            checked={guardian.isPrimary}
                            onChange={() => setPrimaryGuardian(index)}
                            className="h-4 w-4"
                            disabled={isSubmitting}
                          />
                          <Label htmlFor={`guardian-primary-${index}`}>
                            Définir comme responsable principal
                          </Label>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>

            {/* Boutons de soumission */}
            <div className="flex justify-end space-x-4 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </>
                ) : student ? (
                  "Modifier l'étudiant"
                ) : (
                  "Créer l'étudiant"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};
