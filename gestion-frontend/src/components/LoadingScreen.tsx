// Écran de chargement pendant la synchronisation des données
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Chargement des données...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-96">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {message}
            </h2>
            <p className="text-sm text-muted-foreground">
              Préparation de l'environnement académique...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};