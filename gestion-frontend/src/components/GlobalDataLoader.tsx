// components/GlobalDataLoader.tsx
import { useEffect } from "react";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { useFacultyStore } from "@/store/facultyStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { useUEStore } from "@/store/courseStore";

export const GlobalDataLoader = () => {
  const { fetchEnrollments } = useEnrollmentStore();
  const { fetchFaculties } = useFacultyStore();
  const { fetchAcademicYears } = useAcademicYearStore();
  const { fetchUEs } = useUEStore();

  useEffect(() => {
    // Charger toutes les données nécessaires au démarrage de l'application
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchEnrollments(),
          fetchFaculties(),
          fetchAcademicYears(),
          fetchUEs(),
        ]);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données initiales:",
          error
        );
      }
    };

    loadInitialData();
  }, [fetchEnrollments, fetchFaculties, fetchAcademicYears, fetchUEs]);

  return null;
};
