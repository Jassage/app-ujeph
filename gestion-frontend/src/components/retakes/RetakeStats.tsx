
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Retake } from '../../types/academic';

interface RetakeStatsProps {
  studentsWithRetakesCount: number;
  retakes: Retake[];
}

export const RetakeStats = ({ studentsWithRetakesCount, retakes }: RetakeStatsProps) => {
  const programmesCount = retakes.filter(r => r.status === 'Programmé').length;
  const termineesCount = retakes.filter(r => r.status === 'Terminé').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Étudiants avec reprises
            </p>
            <p className="text-2xl font-bold">{studentsWithRetakesCount}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-orange-500" />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Reprises programmées
            </p>
            <p className="text-2xl font-bold">{programmesCount}</p>
          </div>
          <Clock className="h-8 w-8 text-blue-500" />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Reprises terminées
            </p>
            <p className="text-2xl font-bold">{termineesCount}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </CardContent>
      </Card>
    </div>
  );
};
