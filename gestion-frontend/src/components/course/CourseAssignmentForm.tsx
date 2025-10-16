import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Building2, User, Calendar } from "lucide-react";
import { UE, Professeur, FacultyWithLevels } from "../../types/academic";
import { useUEStore } from "@/store/courseStore";

interface CourseAssignmentFormProps {
  ues: UE[];
  professeurs: Professeur[];
  faculties: FacultyWithLevels[];
  onSubmit: (assignment: AssignmentData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<AssignmentData>;
  loading?: boolean;
}

interface AssignmentData {
  ueId: string;
  facultyId: string;
  professeurId: string;
  academicYear: string;
  semester: "S1" | "S2";
  level: string;
  status: "Active" | "Inactive";
}

export const CourseAssignmentForm = ({
  professeurs,
  faculties,
  onSubmit,
  onCancel,
  initialData,
  loading = false,
}: CourseAssignmentFormProps) => {
  const [formData, setFormData] = useState<AssignmentData>({
    ueId: "",
    facultyId: "",
    professeurId: "",
    academicYear: new Date().getFullYear().toString(),
    semester: "S1",
    level: "",
    status: "Active",
    ...initialData,
  });

  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { ues } = useUEStore();

  // Charger les niveaux lorsque la faculté change
  useEffect(() => {
    if (formData.facultyId) {
      const faculty = faculties.find((f) => f.id === formData.facultyId);
      if (faculty) {
        const levels = faculty.levels.map((l) =>
          typeof l === "string" ? l : l.level
        );
        setAvailableLevels(levels);
        // Réinitialiser le niveau si non disponible dans la nouvelle faculté
        if (formData.level && !levels.includes(formData.level)) {
          setFormData((prev) => ({ ...prev, level: "" }));
        }
      }
    } else {
      setAvailableLevels([]);
    }
  }, [formData.facultyId, faculties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.ueId) newErrors.ueId = "UE obligatoire";
    if (!formData.facultyId) newErrors.facultyId = "Faculté obligatoire";
    if (!formData.professeurId)
      newErrors.professeurId = "Professeur obligatoire";
    if (!formData.academicYear)
      newErrors.academicYear = "Année académique obligatoire";
    if (!formData.level) newErrors.level = "Niveau obligatoire";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      await onSubmit(formData);
      if (!initialData) {
        // Réinitialiser le formulaire après création réussie
        setFormData({
          ueId: "",
          facultyId: "",
          professeurId: "",
          academicYear: new Date().getFullYear().toString(),
          semester: "S1",
          level: "",
          status: "Active",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    }
  };

  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear - 1}-${currentYear}`,
      `${currentYear}-${currentYear + 1}`,
      `${currentYear + 1}-${currentYear + 2}`,
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {initialData
            ? "Modifier une affectation"
            : "Nouvelle affectation de cours"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* UE */}
            <div className="space-y-2">
              <Label htmlFor="ueId" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>Unité d'Enseignement *</span>
              </Label>
              <Select
                value={formData.ueId}
                onValueChange={(value) =>
                  setFormData({ ...formData, ueId: value })
                }
              >
                <SelectTrigger className={errors.ueId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner une UE" />
                </SelectTrigger>
                <SelectContent>
                  {ues.map((ue) => (
                    <SelectItem key={ue.id} value={ue.id}>
                      {ue.code} - {ue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ueId && (
                <p className="text-red-500 text-sm">{errors.ueId}</p>
              )}
            </div>

            {/* Faculté */}
            <div className="space-y-2">
              <Label htmlFor="facultyId" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>Faculté *</span>
              </Label>
              <Select
                value={formData.facultyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, facultyId: value })
                }
              >
                <SelectTrigger
                  className={errors.facultyId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Sélectionner une faculté" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.facultyId && (
                <p className="text-red-500 text-sm">{errors.facultyId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Professeur */}
            <div className="space-y-2">
              <Label htmlFor="professeurId" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Professeur *</span>
              </Label>
              <Select
                value={formData.professeurId}
                onValueChange={(value) =>
                  setFormData({ ...formData, professeurId: value })
                }
              >
                <SelectTrigger
                  className={errors.professeurId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Sélectionner un professeur" />
                </SelectTrigger>
                <SelectContent>
                  {professeurs.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.firstName} {prof.lastName}
                      {prof.speciality && ` - ${prof.speciality}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.professeurId && (
                <p className="text-red-500 text-sm">{errors.professeurId}</p>
              )}
            </div>

            {/* Niveau */}
            <div className="space-y-2">
              <Label htmlFor="level" className="flex items-center gap-1">
                <span>Niveau *</span>
              </Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData({ ...formData, level: value })
                }
                disabled={!formData.facultyId}
              >
                <SelectTrigger className={errors.level ? "border-red-500" : ""}>
                  <SelectValue
                    placeholder={
                      formData.facultyId
                        ? "Sélectionner un niveau"
                        : "Sélectionnez d'abord une faculté"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-red-500 text-sm">{errors.level}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Année académique */}
            <div className="space-y-2">
              <Label htmlFor="academicYear" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Année académique *</span>
              </Label>
              <Select
                value={formData.academicYear}
                onValueChange={(value) =>
                  setFormData({ ...formData, academicYear: value })
                }
              >
                <SelectTrigger
                  className={errors.academicYear ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  {generateAcademicYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicYear && (
                <p className="text-red-500 text-sm">{errors.academicYear}</p>
              )}
            </div>

            {/* Semestre */}
            <div className="space-y-2">
              <Label htmlFor="semester">Semestre *</Label>
              <Select
                value={formData.semester}
                onValueChange={(value: "S1" | "S2") =>
                  setFormData({ ...formData, semester: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">Semestre 1</SelectItem>
                  <SelectItem value="S2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Actif</SelectItem>
                  <SelectItem value="Inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? "Modifier" : "Créer l'affectation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
