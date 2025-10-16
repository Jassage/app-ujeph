import React from 'react';
import { useAcademicStore } from '@/store/academicStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X,
  Clock,
  DollarSign,
  BookOpen,
  UserCheck
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  category: 'payment' | 'academic' | 'attendance' | 'system';
  read: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { students, payments } = useAcademicStore();

  // Générer des notifications basées sur les données
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];

    // Notifications de paiements en retard
    const overduePayments = payments.filter(p => 
      p.status === 'En attente' && new Date(p.dueDate) < new Date()
    );
    
    if (overduePayments.length > 0) {
      notifications.push({
        id: 'overdue-payments',
        type: 'warning',
        title: 'Paiements en retard',
        message: `${overduePayments.length} paiement(s) en retard nécessitent votre attention`,
        timestamp: new Date(),
        category: 'payment',
        read: false
      });
    }

    // Nouveaux étudiants inscrits cette semaine
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const newStudents = students.filter(s => {
      // Utiliser la date actuelle comme approximation pour les nouveaux étudiants
      return students.length > 10; // Simulation d'étudiants récents
    }).slice(0, 3);

    if (newStudents.length > 0) {
      notifications.push({
        id: 'new-students',
        type: 'info',
        title: 'Nouveaux étudiants',
        message: `${newStudents.length} nouvel(aux) étudiant(s) cette semaine`,
        timestamp: new Date(),
        category: 'academic',
        read: false
      });
    }

    // Notification système
    notifications.push({
      id: 'system-update',
      type: 'success',
      title: 'Mise à jour système',
      message: 'Le système a été mis à jour avec succès vers la version 2.1.0',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2 heures
      category: 'system',
      read: true
    });

    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string, category: string) => {
    if (category === 'payment') return DollarSign;
    if (category === 'academic') return BookOpen;
    if (category === 'attendance') return UserCheck;
    
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'error': return X;
      default: return Info;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-orange-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (!isOpen) return null;

  return (
    <Card className="absolute top-full right-0 mt-2 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => {
                const Icon = getIcon(notification.type, notification.category);
                
                return (
                  <div key={notification.id}>
                    <div className={`p-4 hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-muted/20' : ''}`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${getTypeColor(notification.type)}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-4">
              <Button variant="ghost" className="w-full text-sm">
                Voir toutes les notifications
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};