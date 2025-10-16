import { BookOpen, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { useCourseAssignmentStore } from "@/store/courseAssignmentStore";
import { useState } from "react";

export const ProfessorSchedule = ({ professorId }) => {
  const { assignments } = useCourseAssignmentStore();
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  // Filtrer les assignments pour le professeur sélectionné
  const professorAssignments = assignments.filter(
    (assignment) => assignment.professeur?.id === professorId
  );

  // Générer les jours de la semaine sélectionnée
  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(
      date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)
    );

    return Array.from({ length: 5 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays(selectedWeek);

  // Plages horaires standard
  const timeSlots = [
    "08:00 - 09:30",
    "09:45 - 11:15",
    "11:30 - 13:00",
    "14:00 - 15:30",
    "15:45 - 17:15",
    "17:30 - 19:00",
  ];

  // Formater la date pour l'affichage
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  };

  // Trouver le cours à un créneau horaire spécifique
  const findAssignmentAtTime = (day, timeIndex) => {
    return professorAssignments.find((assignment) => {
      // Cette logique devrait être adaptée à votre structure de données réelle
      // Ici, on suppose que chaque assignment a un jour et un créneau horaire
      //   return (
      //     assignment.day === day.getDay() && assignment.timeSlot === timeIndex
      //   );
    });
  };

  // Navigation entre les semaines
  const changeWeek = (direction) => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(selectedWeek.getDate() + (direction === "next" ? 7 : -7));
    setSelectedWeek(newDate);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Emploi du temps
            </CardTitle>
            <CardDescription>
              Semaine du {formatDate(weekDays[0])} au {formatDate(weekDays[4])}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek("prev")}
            >
              Semaine précédente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeek(new Date())}
            >
              Cette semaine
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek("next")}
            >
              Semaine suivante
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {professorAssignments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Horaire</TableHead>
                  {weekDays.map((day) => (
                    <TableHead key={day.toISOString()} className="text-center">
                      {formatDate(day)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map((time, timeIndex) => (
                  <TableRow key={time}>
                    <TableCell className="font-medium">{time}</TableCell>
                    {weekDays.map((day) => {
                      const assignment = findAssignmentAtTime(day, timeIndex);
                      return (
                        <TableCell
                          key={day.toISOString()}
                          className="text-center p-1"
                        >
                          {assignment ? (
                            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                              <div className="font-medium text-sm">
                                {assignment.ue?.code}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.faculty?.name}
                              </div>
                              <div className="text-xs mt-1">
                                <Badge variant="outline">
                                  Salle {assignment.room || "N/A"}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 text-muted-foreground text-sm">
                              -
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucun cours planifié pour cette semaine</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Résumé des heures cette semaine
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-md">
              <div className="text-2xl font-bold">12h</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-background rounded-md">
              <div className="text-2xl font-bold">8h</div>
              <div className="text-sm text-muted-foreground">Cours</div>
            </div>
            <div className="text-center p-3 bg-background rounded-md">
              <div className="text-2xl font-bold">4h</div>
              <div className="text-sm text-muted-foreground">TD/TP</div>
            </div>
            <div className="text-center p-3 bg-background rounded-md">
              <div className="text-2xl font-bold">2h</div>
              <div className="text-sm text-muted-foreground">Réunions</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
