import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useProfessorStore } from "../../store/professorStore";
import { useCourseAssignmentStore } from "../../store/courseAssignmentStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Mail,
  Phone,
  User,
  Clock,
  BookOpen,
  Save,
  X,
  Plus,
} from "lucide-react";

// Composant ProfessorForm pour ajouter/modifier un professeur
export const ProfessorForm = ({ professor, onSuccess }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const { updateProfessor, loading } = useProfessorStore();

  const [isEditing, setIsEditing] = useState(!!professor);

  useEffect(() => {
    if (professor) {
      reset({
        firstName: professor.firstName,
        lastName: professor.lastName,
        email: professor.email,
        phone: professor.phone || "",
        department: professor.department || "",
        specialty: professor.specialty || "",
        status: professor.status || "ACTIVE",
        notes: professor.notes || "",
      });
      setIsEditing(true);
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        specialty: "",
        status: "ACTIVE",
        notes: "",
      });
      setIsEditing(false);
    }
  }, [professor, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await updateProfessor(professor.id, data);
      } else {
        await createProfessor(data);
      }
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {isEditing ? "Modifier le professeur" : "Ajouter un professeur"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifiez les informations du professeur"
            : "Remplissez le formulaire pour ajouter un nouveau professeur"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                {...register("firstName", { required: "Le prénom est requis" })}
                placeholder="Prénom"
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                {...register("lastName", { required: "Le nom est requis" })}
                placeholder="Nom"
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "L'email est requis",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Adresse email invalide",
                  },
                })}
                placeholder="email@exemple.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                {...register("department")}
                placeholder="Département"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité</Label>
              <Input
                id="specialty"
                {...register("specialty")}
                placeholder="Spécialité"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                defaultValue={professor?.status || "ACTIVE"}
                onValueChange={(value) =>
                  reset({ ...register("status").value, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="INACTIVE">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {isEditing && (
              <Button type="button" variant="outline" onClick={() => reset()}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Mettre à jour" : "Ajouter"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
