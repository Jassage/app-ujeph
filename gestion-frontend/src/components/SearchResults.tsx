import React from 'react';
import { useAcademicStore } from '@/store/academicStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, FileText } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  onClose: () => void;
  onSelectStudent: (studentId: string) => void;
}

export const SearchResults = ({ query, onClose, onSelectStudent }: SearchResultsProps) => {
  const { students, faculties, enrollments } = useAcademicStore();

  if (!query.trim()) return null;

  const searchTerms = query.toLowerCase().split(' ');

  // Recherche d'étudiants
  const filteredStudents = students.filter(student => {
    const searchText = `${student.firstName} ${student.lastName} ${student.email} ${student.studentId}`.toLowerCase();
    return searchTerms.every(term => searchText.includes(term));
  });

  const hasResults = filteredStudents.length > 0;

  if (!hasResults) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">Aucun résultat trouvé pour "{query}"</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Résultats de recherche
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Étudiants */}
        {filteredStudents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Étudiants ({filteredStudents.length})
            </h4>
            <div className="space-y-2">
              {filteredStudents.slice(0, 5).map(student => {
                // Trouver les immatriculations de l'étudiant
                const studentEnrollments = enrollments.filter(e => e.studentId === student.id && e.status === 'Active');
                const latestEnrollment = studentEnrollments.sort((a, b) => 
                  new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()
                )[0];
                const faculty = latestEnrollment ? faculties.find(f => f.id === latestEnrollment.faculty) : null;
                
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      onSelectStudent(student.id);
                      onClose();
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{student.firstName} {student.lastName}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.studentId} • {student.email}
                      </div>
                      {faculty && (
                        <Badge variant="secondary" className="text-xs">
                          {faculty.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredStudents.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  et {filteredStudents.length - 5} autres résultats...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};