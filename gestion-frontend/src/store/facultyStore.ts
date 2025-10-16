import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";
import { FacultyWithLevels } from "../types/academic";

// Ajouter ces interfaces pour les statistiques
interface FacultyStats {
  totalFaculties: number;
  activeFaculties: number;
  totalStudents: number;
  totalCourses: number;
  studentsByFaculty: Record<string, number>;
  coursesByFaculty: Record<string, number>;
}

interface FacultyState {
  faculties: FacultyWithLevels[];
  loading: boolean;
  error: string | null;
  stats: FacultyStats | null;
  fetchFaculties: (params?: {
    search?: string;
    status?: string;
  }) => Promise<void>;
  addFaculty: (
    faculty: Omit<
      FacultyWithLevels,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "levels"
      | "studentsCount"
      | "coursesCount"
      | "assignments"
      | "_count"
    >
  ) => Promise<FacultyWithLevels>;
  updateFaculty: (
    id: string,
    faculty: Partial<
      Omit<
        FacultyWithLevels,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "levels"
        | "studentsCount"
        | "coursesCount"
        | "assignments"
        | "_count"
      >
    >
  ) => Promise<void>;
  deleteFaculty: (id: string) => Promise<void>;
  getFacultyById: (id: string) => FacultyWithLevels | undefined;
  getFacultyStats: () => Promise<FacultyStats>;
  // Nouvelles fonctions pour le comptage dynamique
  updateStudentCounts: (enrollments: any[]) => void;
  updateCourseCounts: (courses: any[]) => void;
  recalculateAllStats: () => void;
  updateCourseCountsFromAssignments: (assignments: any[]) => void;
  // NOUVELLE FONCTION RESET
  reset: () => void;
}

export const useFacultyStore = create<FacultyState>()(
  persist(
    (set, get) => ({
      faculties: [],
      loading: false,
      error: null,
      stats: null,

      // FONCTION RESET
      reset: () => {
        set({
          faculties: [],
          loading: false,
          error: null,
          stats: null,
        });
      },

      fetchFaculties: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const queryParams = new URLSearchParams();
          if (params.search) queryParams.append("search", params.search);
          if (params.status) queryParams.append("status", params.status);
          queryParams.append("includeLevels", "true");

          const response = await api.get(
            `/faculties?${queryParams.toString()}`
          );
          const faculties = response.data;

          set({ faculties, loading: false });

          // Recalculer les statistiques après le chargement
          get().recalculateAllStats();
        } catch (error) {
          set({
            error:
              error.response?.data?.message ||
              "Erreur lors du chargement des facultés",
            loading: false,
          });
        }
      },

      addFaculty: async (faculty) => {
        set({ loading: true });
        try {
          // Ajouter les valeurs par défaut pour les champs optionnels
          const payload = {
            ...faculty,
            studentsCount: 0, // Valeur par défaut
            coursesCount: 0, // Valeur par défaut
          };

          console.log("store :", payload);

          const response = await api.post("/faculties", payload);
          const newFaculty = response.data.faculty || response.data;

          set((state) => ({
            faculties: [...state.faculties, newFaculty],
            loading: false,
          }));
          return newFaculty;
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            "Erreur lors de la création de la faculté";
          set({
            error: errorMessage,
            loading: false,
          });
          throw new Error(errorMessage);
        }
      },

      updateFaculty: async (id, updates) => {
        set({ loading: true });
        try {
          const response = await api.put(`/faculties/${id}`, updates);
          const updatedFaculty = response.data.faculty || response.data;

          set((state) => ({
            faculties: state.faculties.map((f) =>
              f.id === id ? { ...f, ...updatedFaculty } : f
            ),
            loading: false,
          }));
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            "Erreur lors de la mise à jour de la faculté";
          set({
            error: errorMessage,
            loading: false,
          });
          throw new Error(errorMessage);
        }
      },

      deleteFaculty: async (id) => {
        set({ loading: true });
        try {
          await api.delete(`/faculties/${id}`);
          set((state) => ({
            faculties: state.faculties.filter((f) => f.id !== id),
            loading: false,
          }));
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            "Erreur lors de la suppression de la faculté";
          set({
            error: errorMessage,
            loading: false,
          });
          throw new Error(errorMessage);
        }
      },

      getFacultyById: (id) => {
        return get().faculties.find((f) => f.id === id);
      },

      getFacultyStats: async () => {
        try {
          const response = await api.get("/faculties/stats");
          const stats = response.data;
          set({ stats });
          return stats;
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            "Erreur lors de la récupération des statistiques";
          throw new Error(errorMessage);
        }
      },

      updateStudentCounts: (enrollments) => {
        const { faculties } = get();

        const studentCountByFaculty: Record<string, Set<string>> = {};

        enrollments.forEach((enrollment) => {
          if (enrollment.facultyId) {
            if (!studentCountByFaculty[enrollment.facultyId]) {
              studentCountByFaculty[enrollment.facultyId] = new Set();
            }
            studentCountByFaculty[enrollment.facultyId].add(
              enrollment.studentId
            );
          }
        });

        const updatedFaculties = faculties.map((faculty) => ({
          ...faculty,
          studentsCount: studentCountByFaculty[faculty.id]?.size || 0,
        }));

        set({ faculties: updatedFaculties });
        get().recalculateAllStats();
      },

      updateCourseCounts: (ues) => {
        const { faculties } = get();

        const courseCountByFaculty: Record<string, number> = {};

        ues.forEach((ue) => {
          if (ue.facultyId) {
            courseCountByFaculty[ue.facultyId] =
              (courseCountByFaculty[ue.facultyId] || 0) + 1;
          }
        });

        const updatedFaculties = faculties.map((faculty) => ({
          ...faculty,
          coursesCount: courseCountByFaculty[faculty.id] || 0,
        }));

        set({ faculties: updatedFaculties });
        get().recalculateAllStats();
      },

      updateCourseCountsFromAssignments: (assignments: any) => {
        const { faculties } = get();

        // Compter les cours uniques par faculté
        const courseCountByFaculty: Record<string, Set<string>> = {};

        assignments.forEach(
          (assignment: { facultyId: string | number; ueId: string }) => {
            if (assignment.facultyId && assignment.ueId) {
              if (!courseCountByFaculty[assignment.facultyId]) {
                courseCountByFaculty[assignment.facultyId] = new Set();
              }
              courseCountByFaculty[assignment.facultyId].add(assignment.ueId);
            }
          }
        );

        const updatedFaculties = faculties.map((faculty) => ({
          ...faculty,
          coursesCount: courseCountByFaculty[faculty.id]?.size || 0,
        }));

        set({ faculties: updatedFaculties });
        get().recalculateAllStats();
      },

      recalculateAllStats: () => {
        const { faculties } = get();

        const totalFaculties = faculties.length;
        const activeFaculties = faculties.filter(
          (f) => f.status === "Active"
        ).length;

        const studentsByFaculty: Record<string, number> = {};
        const coursesByFaculty: Record<string, number> = {};

        let totalStudents = 0;
        let totalCourses = 0;

        faculties.forEach((faculty) => {
          studentsByFaculty[faculty.id] = faculty.studentsCount || 0;
          coursesByFaculty[faculty.id] = faculty.coursesCount || 0;

          totalStudents += faculty.studentsCount || 0;
          totalCourses += faculty.coursesCount || 0;
        });

        const stats: FacultyStats = {
          totalFaculties,
          activeFaculties,
          totalStudents,
          totalCourses,
          studentsByFaculty,
          coursesByFaculty,
        };

        set({ stats });
      },
    }),
    {
      name: "faculty-storage",
      partialize: (state) => ({ faculties: state.faculties }),
    }
  )
);

// Fonction utilitaire pour l'initialisation
export const initializeFacultyStore = async () => {
  const { fetchFaculties, faculties } = useFacultyStore.getState();
  if (faculties.length === 0) {
    await fetchFaculties();
  }
};

// FONCTION POUR RÉINITIALISER TOUS LES STORES
export const resetAllStores = () => {
  useFacultyStore.getState().reset();
  // Ajoutez les autres stores ici quand vous les aurez créés
  // useEnrollmentStore.getState().reset();
  // useUEStore.getState().reset();
  // etc.
};
