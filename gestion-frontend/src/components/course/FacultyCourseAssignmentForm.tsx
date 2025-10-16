// src/components/course/FacultyCourseAssignmentForm.tsx
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AcademicYear, FacultyWithLevels } from "@/types/academic";

interface FacultyCourseAssignmentFormProps {
  faculties: FacultyWithLevels[];
  academicYears: AcademicYear[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const FacultyCourseAssignmentForm: React.FC<
  FacultyCourseAssignmentFormProps
> = ({ faculties, academicYears, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    facultyId: "",
    level: "",
    academicYear: "",
    semester: "S1",
    ueId: "",
    professeurId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Faculté</Label>
          <Select
            value={formData.facultyId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, facultyId: value }))
            }
            required
          >
            <SelectTrigger>
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
          <Label>Niveau</Label>
          <Select
            value={formData.level}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, level: value }))
            }
            required
          >
            <SelectTrigger>
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
          <Label>Année académique</Label>
          <Select
            value={formData.academicYear}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, academicYear: value }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une année" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.year}>
                  {year.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Semestre</Label>
          <Select
            value={formData.semester}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, semester: value }))
            }
            required
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
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Créer l'affectation</Button>
      </div>
    </form>
  );
};
