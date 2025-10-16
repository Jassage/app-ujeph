
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicStore } from '../store/academicStore';
import { Attendance } from '../types/academic';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AttendanceManager = () => {
  const { 
    attendances, 
    addAttendance, 
    updateAttendance, 
    students, 
    schedules, 
    ues, 
    users,
    faculties 
  } = useAcademicStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const professors = users.filter(user => user.role === 'Professeur');
  const dayOfWeek = new Date(selectedDate).getDay();
  
  const filteredSchedules = schedules.filter(schedule => 
    schedule.dayOfWeek === dayOfWeek &&
    (selectedFaculty === '' || selectedFaculty === 'ALL_FACULTIES' || schedule.faculty === selectedFaculty) &&
    (selectedLevel === '' || selectedLevel === 'ALL_LEVELS' || schedule.level === selectedLevel)
  );

  const getScheduleStudents = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return [];
    
    return students.filter(student => 
      student.faculty === schedule.faculty && 
      student.level === schedule.level &&
      student.status === 'Active'
    );
  };

  const getAttendanceForStudent = (studentId: string, scheduleId: string, date: string) => {
    return attendances.find(a => 
      a.studentId === studentId && 
      a.scheduleId === scheduleId && 
      a.date === date
    );
  };

  const handleAttendanceUpdate = (studentId: string, scheduleId: string, status: Attendance['status']) => {
    const existingAttendance = getAttendanceForStudent(studentId, scheduleId, selectedDate);
    
    if (existingAttendance) {
      updateAttendance(existingAttendance.id, { status });
    } else {
      const newAttendance: Attendance = {
        id: `attendance_${Date.now()}_${studentId}`,
        studentId,
        scheduleId,
        date: selectedDate,
        status
      };
      addAttendance(newAttendance);
    }
  };

  const getUETitle = (ueId: string) => {
    const ue = ues.find(u => u.id === ueId);
    return ue ? `${ue.code} - ${ue.title}` : 'UE non trouvée';
  };

  const getProfessorName = (professorId: string) => {
    const professor = professors.find(p => p.id === professorId);
    return professor ? `${professor.firstName} ${professor.lastName}` : 'Professeur non trouvé';
  };

  const getAttendanceStats = (scheduleId: string) => {
    const scheduleStudents = getScheduleStudents(scheduleId);
    const attendanceRecords = scheduleStudents.map(student => 
      getAttendanceForStudent(student.id, scheduleId, selectedDate)
    );
    
    const present = attendanceRecords.filter(a => a?.status === 'Présent').length;
    const absent = attendanceRecords.filter(a => a?.status === 'Absent').length;
    const late = attendanceRecords.filter(a => a?.status === 'Retard').length;
    const excused = attendanceRecords.filter(a => a?.status === 'Excusé').length;
    const unmarked = attendanceRecords.filter(a => !a).length;
    
    return { present, absent, late, excused, unmarked, total: scheduleStudents.length };
  };

  const getStatusBadge = (status: Attendance['status']) => {
    switch (status) {
      case 'Présent':
        return <Badge className="bg-green-100 text-green-800">Présent</Badge>;
      case 'Absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'Retard':
        return <Badge className="bg-orange-100 text-orange-800">Retard</Badge>;
      case 'Excusé':
        return <Badge className="bg-blue-100 text-blue-800">Excusé</Badge>;
      default:
        return <Badge variant="outline">Non marqué</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Présences</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">{new Date(selectedDate).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Sélection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
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
            <div className="space-y-2">
              <Label>Cours</Label>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un cours" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSchedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {getUETitle(schedule.ueId)} - {schedule.startTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSchedule && (
        <div className="space-y-4">
          {/* Informations du cours */}
          <Card>
            <CardContent className="p-4">
              {(() => {
                const schedule = schedules.find(s => s.id === selectedSchedule);
                const stats = getAttendanceStats(selectedSchedule);
                
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{schedule && getUETitle(schedule.ueId)}</h3>
                        <p className="text-muted-foreground">
                          {schedule && getProfessorName(schedule.professorId)} - {schedule?.startTime} à {schedule?.endTime} - {schedule?.classroom}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{schedule?.faculty}</Badge>
                        <Badge variant="outline">{schedule?.level}</Badge>
                      </div>
                    </div>
                    
                    {/* Statistiques */}
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-semibold">{stats.present}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Présents</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="font-semibold">{stats.absent}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Absents</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{stats.late}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">En retard</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-semibold">{stats.excused}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Excusés</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="font-semibold">{stats.total}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Liste des étudiants */}
          <Card>
            <CardHeader>
              <CardTitle>Liste de Présence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getScheduleStudents(selectedSchedule).map((student) => {
                  const attendance = getAttendanceForStudent(student.id, selectedSchedule, selectedDate);
                  
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-muted-foreground">{student.studentId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {attendance && getStatusBadge(attendance.status)}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={attendance?.status === 'Présent' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceUpdate(student.id, selectedSchedule, 'Présent')}
                          >
                            Présent
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance?.status === 'Absent' ? 'destructive' : 'outline'}
                            onClick={() => handleAttendanceUpdate(student.id, selectedSchedule, 'Absent')}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance?.status === 'Retard' ? 'secondary' : 'outline'}
                            onClick={() => handleAttendanceUpdate(student.id, selectedSchedule, 'Retard')}
                          >
                            Retard
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance?.status === 'Excusé' ? 'secondary' : 'outline'}
                            onClick={() => handleAttendanceUpdate(student.id, selectedSchedule, 'Excusé')}
                          >
                            Excusé
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
