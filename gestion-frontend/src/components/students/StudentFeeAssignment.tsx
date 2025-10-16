import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFeeStructureStore } from "@/store/feeStructureStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { Student } from "@/types/academic";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface StudentFeeAssignmentProps {
  student: Student;
  enrollment: any; // Inscription actuelle de l'étudiant
  onFeeAssigned: () => void;
}

export const StudentFeeAssignment: React.FC<StudentFeeAssignmentProps> = ({
  student,
  enrollment,
  onFeeAssigned,
}) => {
  const [selectedFeeStructure, setSelectedFeeStructure] = useState("");
  const [availableFees, setAvailableFees] = useState<any[]>([]);

  const {
    feeStructures,
    getFeeStructures,
    assignFeeToStudent,
    getStudentFeeByYear,
    loading,
  } = useFeeStructureStore();

  const { academicYears } = useAcademicYearStore();

  useEffect(() => {
    loadAvailableFees();
    checkExistingFee();
  }, [enrollment]);

  const loadAvailableFees = async () => {
    if (!enrollment) return;

    await getFeeStructures(enrollment.academicYear, enrollment.faculty);

    // Filtrer les structures disponibles pour le niveau de l'étudiant
    const filteredFees = feeStructures.filter(
      (fee) =>
        fee.level === enrollment.level && fee.faculty === enrollment.faculty
    );

    setAvailableFees(filteredFees);
  };

  const checkExistingFee = async () => {
    if (!enrollment) return;

    const existingFee = await getStudentFeeByYear(
      student.id,
      enrollment.academicYear
    );
    if (existingFee) {
      setSelectedFeeStructure(existingFee.feeStructureId);
    }
  };

  const handleAssignFee = async () => {
    if (!selectedFeeStructure || !enrollment) return;

    try {
      await assignFeeToStudent(
        student.id,
        enrollment.academicYear,
        selectedFeeStructure
      );

      toast.success("Frais assignés avec succès!");
      onFeeAssigned();
    } catch (error) {
      toast.error("Erreur lors de l'assignation des frais");
    }
  };

  const getStatusBadge = (fee: any) => {
    if (fee.isActive) {
      return <Badge variant="default">Actif</Badge>;
    }
    return <Badge variant="secondary">Inactif</Badge>;
  };

  if (!enrollment) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Aucune inscription active pour cet étudiant</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Frais de Scolarité {enrollment.academicYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Information de l'inscription */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Programme:</span>
              <p>{enrollment.faculty}</p>
            </div>
            <div>
              <span className="font-medium">Niveau:</span>
              <p>{enrollment.level}</p>
            </div>
            <div>
              <span className="font-medium">Année:</span>
              <p>{enrollment.academicYear}</p>
            </div>
            <div>
              <span className="font-medium">Statut:</span>
              <Badge
                variant={
                  enrollment.status === "Active" ? "default" : "secondary"
                }
              >
                {enrollment.status === "Active" ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sélection de la structure de frais */}
        <div className="space-y-3">
          <Label>Structure de Frais</Label>
          <Select
            value={selectedFeeStructure}
            onValueChange={setSelectedFeeStructure}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une structure de frais" />
            </SelectTrigger>
            <SelectContent>
              {availableFees.map((fee) => (
                <SelectItem key={fee.id} value={fee.id}>
                  <div className="flex items-center justify-between">
                    <span>{fee.totalAmount.toLocaleString()} HTG</span>
                    {getStatusBadge(fee)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedFeeStructure && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Détails des frais
              </h4>
              {availableFees
                .filter((fee) => fee.id === selectedFeeStructure)
                .map((fee) => (
                  <div key={fee.id} className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Frais de scolarité:</span>
                      <span>{fee.tuitionFee.toLocaleString()} HTG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais d'inscription:</span>
                      <span>{fee.registrationFee.toLocaleString()} HTG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bibliothèque:</span>
                      <span>{fee.otherFees.library.toLocaleString()} HTG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sports:</span>
                      <span>{fee.otherFees.sports.toLocaleString()} HTG</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Total:</span>
                      <span className="text-blue-900">
                        {fee.totalAmount.toLocaleString()} HTG
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleAssignFee}
          disabled={!selectedFeeStructure || loading}
          className="w-full"
        >
          {loading ? "Assignation..." : "Assigner les Frais"}
        </Button>
      </CardContent>
    </Card>
  );
};
