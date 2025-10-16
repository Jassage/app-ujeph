
import { useState } from 'react';
import { RotateCcw, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAcademicStore } from '../store/academicStore';

export const RetakesManager = () => {
  const { students, ues, retakes, updateRetakeStatus } = useAcademicStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const filteredRetakes = retakes.filter(retake => {
    return selectedStatus === '' || selectedStatus === 'ALL_STATUSES' || retake.status === selectedStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      'Programmé': { variant: 'secondary' as const, icon: Calendar },
      'En cours': { variant: 'default' as const, icon: AlertTriangle },
      'Terminé': { variant: 'outline' as const, icon: CheckCircle }
    };
    
    const { variant, icon: Icon } = config[status as keyof typeof config] || { variant: 'secondary' as const, icon: Calendar };
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleStatusChange = (retakeId: string, status: string) => {
    updateRetakeStatus(retakeId, status as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Reprises</h2>
          <p className="text-muted-foreground">
            Gérez les sessions de rattrapage des étudiants
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Programmées</p>
                <p className="text-2xl font-bold text-blue-600">
                  {retakes.filter(r => r.status === 'Programmé').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Cours</p>
                <p className="text-2xl font-bold text-orange-600">
                  {retakes.filter(r => r.status === 'En cours').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold text-green-600">
                  {retakes.filter(r => r.status === 'Terminé').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_STATUSES">Tous les statuts</SelectItem>
              <SelectItem value="Programmé">Programmé</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tableau des reprises */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Liste des Reprises ({filteredRetakes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead>UE</TableHead>
                <TableHead>Note Originale</TableHead>
                <TableHead>Note Reprise</TableHead>
                <TableHead>Semestre Programmé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRetakes.map((retake) => {
                const student = students.find(s => s.id === retake.studentId);
                const ue = ues.find(u => u.id === retake.ueId);
                
                return (
                  <TableRow key={retake.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {student?.firstName} {student?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student?.studentId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ue?.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {ue?.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-semibold">
                        {retake.originalGrade.toFixed(2)}/20
                      </span>
                    </TableCell>
                    <TableCell>
                      {retake.retakeGrade ? (
                        <span className={retake.retakeGrade >= (ue?.passingGrade || 10) ? 'text-green-600' : 'text-red-600'}>
                          {retake.retakeGrade.toFixed(2)}/20
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{retake.scheduledSemester}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(retake.status)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={retake.status}
                        onValueChange={(value) => handleStatusChange(retake.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Programmé">Programmé</SelectItem>
                          <SelectItem value="En cours">En cours</SelectItem>
                          <SelectItem value="Terminé">Terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredRetakes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune reprise trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
