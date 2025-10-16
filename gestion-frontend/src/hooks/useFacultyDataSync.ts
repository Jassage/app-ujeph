// hooks/useFacultyDataSync.ts
import { useEffect } from "react";
import { useFacultyStore } from "@/store/facultyStore";

import { useEnrollmentStore } from "@/store/enrollmentStore";
import { useUEStore } from "@/store/courseStore";

export const useFacultyDataSync = () => {
  const { recalculateAllStats } = useFacultyStore();
  const { enrollments, fetchEnrollments } = useEnrollmentStore();
  const { ues, fetchUEs } = useUEStore();
  const { faculties, fetchFaculties } = useFacultyStore();

  // Charger toutes les données au montage
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([fetchFaculties(), fetchEnrollments(), fetchUEs()]);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    loadAllData();
  }, [fetchFaculties, fetchEnrollments, fetchUEs]);

  // Recalculer les statistiques quand les données changent
  useEffect(() => {
    if (faculties.length > 0 && enrollments.length > 0 && ues.length > 0) {
      recalculateAllStats();
    }
  }, [faculties, enrollments, ues, recalculateAllStats]);

  return { faculties, enrollments, ues };
};
