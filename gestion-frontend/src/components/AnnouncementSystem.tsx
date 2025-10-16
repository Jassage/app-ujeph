
import React, { useState } from 'react';
import { useAcademicStore } from '../store/academicStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Edit, Trash2, AlertTriangle, Info, Clock } from 'lucide-react';
import { Announcement } from '../types/academic';

export const AnnouncementSystem = () => {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, getActiveAnnouncements } = useAcademicStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    targetAudience: 'Tous',
    priority: 'Normal',
    isActive: true
  });

  const activeAnnouncements = getActiveAnnouncements();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const announcementData: Announcement = {
      id: editingAnnouncement?.id || `announcement_${Date.now()}`,
      title: formData.title || '',
      content: formData.content || '',
      authorId: 'admin_1', // Dans une vraie app, cela viendrait de l'authentification
      publishDate: editingAnnouncement?.publishDate || new Date().toISOString(),
      expiryDate: formData.expiryDate,
      targetAudience: formData.targetAudience || 'Tous',
      priority: formData.priority || 'Normal',
      attachments: formData.attachments || [],
      isActive: formData.isActive ?? true
    };

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, announcementData);
    } else {
      addAnnouncement(announcementData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      targetAudience: 'Tous',
      priority: 'Normal',
      isActive: true
    });
    setEditingAnnouncement(null);
    setIsFormOpen(false);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData(announcement);
    setIsFormOpen(true);
  };

  const handleDelete = (announcementId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      deleteAnnouncement(announcementId);
    }
  };

  const getPriorityColor = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'Urgent': return 'destructive';
      case 'Important': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'Urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'Important': return <Clock className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Système d'Annonces</h1>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Annonce
        </Button>
      </div>

      {/* Annonces actives en vedette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Annonces Actives
          </CardTitle>
          <CardDescription>
            {activeAnnouncements.length} annonce(s) active(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAnnouncements
              .sort((a, b) => {
                // Trier par priorité puis par date
                const priorityOrder = { 'Urgent': 3, 'Important': 2, 'Normal': 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
              })
              .slice(0, 5)
              .map((announcement) => (
                <Card key={announcement.id} className={`${announcement.priority === 'Urgent' ? 'border-destructive' : announcement.priority === 'Important' ? 'border-secondary' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getPriorityIcon(announcement.priority)}
                        {announcement.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline">
                          {announcement.targetAudience}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{announcement.content}</p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Publié le {new Date(announcement.publishDate).toLocaleDateString('fr-FR')}</span>
                      {announcement.expiryDate && (
                        <span>Expire le {new Date(announcement.expiryDate).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste complète des annonces */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les Annonces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements
              .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
              .map((announcement) => (
                <div key={announcement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium flex items-center gap-2">
                        {getPriorityIcon(announcement.priority)}
                        {announcement.title}
                      </h3>
                      <Badge variant={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                      <Badge variant="outline">
                        {announcement.targetAudience}
                      </Badge>
                      {!announcement.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Publié le {new Date(announcement.publishDate).toLocaleDateString('fr-FR')}</span>
                      {announcement.expiryDate && (
                        <span>Expire le {new Date(announcement.expiryDate).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'ajout/modification */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAnnouncement ? 'Modifier l\'Annonce' : 'Nouvelle Annonce'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Titre</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Contenu</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Public cible</label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value: Announcement['targetAudience']) => 
                      setFormData(prev => ({ ...prev, targetAudience: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tous">Tous</SelectItem>
                      <SelectItem value="Étudiants">Étudiants</SelectItem>
                      <SelectItem value="Professeurs">Professeurs</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Priorité</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Announcement['priority']) => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Important">Important</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date d'expiration (optionnel)</label>
                <Input
                  type="date"
                  value={formData.expiryDate ? formData.expiryDate.split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    expiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span className="text-sm">Annonce active</span>
                </label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingAnnouncement ? 'Modifier' : 'Publier'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
