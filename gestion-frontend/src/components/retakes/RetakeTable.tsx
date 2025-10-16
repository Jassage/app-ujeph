
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle } from 'lucide-react';
import { Student, Course, Grade, Retake } from '../../types/academic';

interface StudentRetakeInfo {
  student: Student;
  failedGrades: Grade[];
  scheduledRetakes: Retake[];
}

interface RetakeTableProps {
  studentsWithRetakes: StudentRetakeInfo[];
  ues: Course[];
  retakes: Retake[];
  onProgrammerClick: (studentId: string) => void;
}

export const RetakeTable = ({ studentsWithRetakes, ues, retakes, onProgrammerClick }: RetakeTableProps) => {
  const getUEInfo = (ueId: string): Course | undefined => {
    return ues.find(ue => ue.id === ueId);
  };

  const getRetakeStatus = (studentId: string, ueId: string): string => {
    const retake = retakes.find(r => r.studentId === studentId && r.ueId === ueId);
    return retake?.status || 'Non programmé';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Programmé': return 'default';
      case 'En cours': return 'secondary';
      case 'Terminé': return 'outline';
      default: return 'destructive';
    }
  };

  if (studentsWithRetakes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Étudiants avec UE à reprendre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">Aucune reprise en attente</p>
            <p className="text-muted-foreground">Tous les étudiants sont à jour</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étudiants avec UE à reprendre</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Étudiant</TableHead>
              <TableHead>UE Échouée</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Statut Reprise</TableHead>
              <TableHead>Semestre Programmé</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentsWithRetakes.map(({ student, failedGrades }) => 
              failedGrades.map((grade) => {
                const ue = getUEInfo(grade.ueId);
                const retakeStatus = getRetakeStatus(student.id, grade.ueId);
                const retake = retakes.find(r => r.studentId === student.id && r.ueId === grade.ueId);
                
                return (
                  <TableRow key={`${student.id}-${grade.ueId}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-muted-foreground">{student.studentId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ue?.code}</p>
                        <p className="text-sm text-muted-foreground">{ue?.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {grade.grade}/20
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(retakeStatus)}>
                        {retakeStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {retake?.scheduledSemester || '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onProgrammerClick(student.id)}
                      >
                        Programmer
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
