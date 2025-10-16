
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicStore } from '../store/academicStore';
import { Schedule } from '../types/academic';
import { Clock, Calendar, MapPin, User, Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ScheduleManager = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, ues, users, faculties } = useAcademicStore();
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const [formData, setFormData] = useState({
    ueId: '',
    professorId: '',
    classroom: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: '',
    faculty: '',
    level: '',
    semester: 'S1' as 'S1' | 'S2',
    academicYear: '2024-2025'
  });

  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const professors = users.filter(user => user.role === 'Professeur');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schedule: Schedule = {
      id: editingSchedule?.id || `schedule_${Date.now()}`,
      ...formData
    };

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, schedule);
    } else {
      addSchedule(schedule);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      ueId: '',
      professorId: '',
      classroom: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: '',
      faculty: '',
      level: '',
      semester: 'S1',
      academicYear: '2024-2025'
    });
    setEditingSchedule(null);
    setShowForm(false);
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData(schedule);
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet emploi du temps ?')) {
      deleteSchedule(id);
    }
  };

  const filteredSchedules = schedules.filter(schedule => 
    (selectedFaculty === '' || selectedFaculty === 'ALL_FACULTIES' || schedule.faculty === selectedFaculty) &&
    (selectedLevel === '' || selectedLevel === 'ALL_LEVELS' || schedule.level === selectedLevel)
  );

  const getUETitle = (ueId: string) => {
    const ue = ues.find(u => u.id === ueId);
    return ue ? `${ue.code} - ${ue.title}` : 'UE non trouvée';
  };

  const getProfessorName = (professorId: string) => {
    const professor = professors.find(p => p.id === professorId);
    return professor ? `${professor.firstName} ${professor.lastName}` : 'Professeur non trouvé';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Emplois du Temps</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Créneau
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faculté</Label>
              <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les facultés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_FACULTIES">Toutes les facultés</SelectItem>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.name}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_LEVELS">Tous les niveaux</SelectItem>
                  <SelectItem value="L1">L1</SelectItem>
                  <SelectItem value="L2">L2</SelectItem>
                  <SelectItem value="L3">L3</SelectItem>
                  <SelectItem value="M1">M1</SelectItem>
                  <SelectItem value="M2">M2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSchedule ? 'Modifier' : 'Ajouter'} un Créneau</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unité d'Enseignement *</Label>
                  <Select value={formData.ueId} onValueChange={(value) => setFormData({...formData, ueId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une UE" />
                    </SelectTrigger>
                    <SelectContent>
                      {ues.map((ue) => (
                        <SelectItem key={ue.id} value={ue.id}>
                          {ue.code} - {ue.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Professeur *</Label>
                  <Select value={formData.professorId} onValueChange={(value) => setFormData({...formData, professorId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un professeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {professors.map((professor) => (
                        <SelectItem key={professor.id} value={professor.id}>
                          {professor.firstName} {professor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Jour *</Label>
                  <Select value={formData.dayOfWeek.toString()} onValueChange={(value) => setFormData({...formData, dayOfWeek: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Heure de début *</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure de fin *</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salle *</Label>
                  <Input
                    value={formData.classroom}
                    onChange={(e) => setFormData({...formData, classroom: e.target.value})}
                    placeholder="Ex: Amphi A, Salle 201..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Faculté *</Label>
                  <Select value={formData.faculty} onValueChange={(value) => setFormData({...formData, faculty: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une faculté" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.name}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Niveau *</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L1">L1</SelectItem>
                      <SelectItem value="L2">L2</SelectItem>
                      <SelectItem value="L3">L3</SelectItem>
                      <SelectItem value="M1">M1</SelectItem>
                      <SelectItem value="M2">M2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semestre *</Label>
                  <Select value={formData.semester} onValueChange={(value) => setFormData({...formData, semester: value as 'S1' | 'S2'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S1">S1</SelectItem>
                      <SelectItem value="S2">S2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingSchedule ? 'Modifier' : 'Ajouter'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des créneaux */}
      <div className="grid gap-4">
        {filteredSchedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{getUETitle(schedule.ueId)}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {days[schedule.dayOfWeek]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {schedule.classroom}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {getProfessorName(schedule.professorId)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{schedule.faculty}</Badge>
                    <Badge variant="outline">{schedule.level}</Badge>
                    <Badge variant="outline">{schedule.semester}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(schedule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
