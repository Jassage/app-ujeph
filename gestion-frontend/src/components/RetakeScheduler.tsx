
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAcademicStore } from '../store/academicStore';
import { Student, UE, Grade, Retake } from '../types/academic';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface RetakeSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentId: string | null;
}

export const RetakeScheduler = ({ isOpen, onClose, selectedStudentId }: RetakeSchedulerProps) => {
  const { students, ues, grades, retakes, addRetake, getStudent } = useAcademicStore();
  const [selectedSemester, setSelectedSemester] = useState<string>('S1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');

  const student = selectedStudentId ? getStudent(selectedStudentId) : null;
  
  const getStudentFailedGrades = (): Grade[] => {
    if (!selectedStudentId) return [];
    return grades.filter(g => 
      g.studentId === selectedStudentId && 
      g.status === 'À reprendre'
    );
  };

  const getUEInfo = (ueId: string): UE | undefined => {
    return ues.find(ue => ue.id === ueId);
  };

  const isAlreadyScheduled = (ueId: string): boolean => {
    return retakes.some(r => 
      r.studentId === selectedStudentId && 
      r.ueId === ueId && 
      r.status !== 'Terminé'
    );
  };

  const checkPrerequisites = (ueId: string): { hasPrereqs: boolean; missingPrereqs: string[] } => {
    const ue = getUEInfo(ueId);
    if (!ue || !ue.prerequisites.length) {
      return { hasPrereqs: true, missingPrereqs: [] };
    }

    const studentGrades = grades.filter(g => g.studentId === selectedStudentId);
    const validatedUEs = studentGrades
      .filter(g => g.status === 'Validé')
      .map(g => g.ueId);

    const missingPrereqs = ue.prerequisites.filter(prereq => 
      !validatedUEs.includes(prereq)
    );

    return {
      hasPrereqs: missingPrereqs.length === 0,
      missingPrereqs
    };
  };

  const scheduleRetake = (ueId: string) => {
    if (!selectedStudentId) return;

    const retakeId = `retake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const originalGrade = grades.find(g => 
      g.studentId === selectedStudentId && 
      g.ueId === ueId && 
      g.status === 'À reprendre'
    );

    const newRetake: Retake = {
      id: retakeId,
      studentId: selectedStudentId,
      ueId: ueId,
      originalGrade: originalGrade?.grade || 0,
      scheduledSemester: `${selectedSemester}-${selectedAcademicYear}`,
      status: 'Programmé'
    };

    addRetake(newRetake);
  };

  const failedGrades = getStudentFailedGrades();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Programmer les Reprises
              {student && (
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  {student.firstName} {student.lastName} - {student.studentId}
                </p>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Sélection période */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Semestre</label>
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Année Académique</label>
                <select 
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
            </div>

            {/* Liste des UE à reprendre */}
            <div>
              <h3 className="text-lg font-semibold mb-4">UE à reprendre</h3>
              {failedGrades.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-muted-foreground">Aucune UE à reprendre pour cet étudiant</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {failedGrades.map((grade) => {
                    const ue = getUEInfo(grade.ueId);
                    const alreadyScheduled = isAlreadyScheduled(grade.ueId);
                    const prereqCheck = checkPrerequisites(grade.ueId);
                    
                    return (
                      <Card key={grade.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-semibold">{ue?.code} - {ue?.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {ue?.credits} crédits • Note obtenue: {grade.grade}/20
                              </p>
                            </div>
                            
                            {!prereqCheck.hasPrereqs && (
                              <div className="flex items-center space-x-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">
                                  Prérequis manquants: {prereqCheck.missingPrereqs.join(', ')}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex space-x-2">
                              <Badge variant="destructive">
                                Note: {grade.grade}/20
                              </Badge>
                              <Badge variant="outline">
                                {ue?.type}
                              </Badge>
                              {alreadyScheduled && (
                                <Badge variant="default">
                                  Déjà programmé
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => scheduleRetake(grade.ueId)}
                            disabled={alreadyScheduled || !prereqCheck.hasPrereqs}
                            variant={alreadyScheduled ? "secondary" : "default"}
                          >
                            {alreadyScheduled ? 'Programmé' : 'Programmer'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
