import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";
import {
  CourseAssignment,
  UE,
  Professeur,
  AcademicYear,
  FacultyWithLevels,
} from "../types/academic";
import { GroupedAssignments } from "@/components/professorDetails";

// ==================== TYPES ET INTERFACES ====================
interface CourseAssignmentState {
  assignments: CourseAssignment[];
  ues: UE[];
  professeurs: Professeur[];
  academicYears: AcademicYear[];
  faculties: FacultyWithLevels[];
  loading: boolean;
  error: string | null;

  // Méthodes principales
  fetchAssignments: (filters?: AssignmentFilters) => Promise<void>;
  fetchAssignmentsByFaculty: (
    facultyId: string,
    level: string,
    academicYearId: string,
    semester: string
  ) => Promise<CourseAssignment[]>;
  fetchUeByFacultyAndLevel: (facultyId: string, level: string) => Promise<UE[]>;
  fetchAssignmentsByProfessor: (professorId: string) => Promise<void>;

  // Méthodes CRUD
  addAssignment: (
    assignment: Omit<CourseAssignment, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateAssignment: (
    id: string,
    assignment: Partial<CourseAssignment>
  ) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  // Getters
  getAssignmentById: (id: string) => CourseAssignment | undefined;
  getAssignmentsByUE: (ueId: string) => CourseAssignment[];
  getAssignmentsByProfessor: (professorId: string) => CourseAssignment[];
  groupAssignmentsByFacultyAndYear: () => GroupedAssignments;

  // Utilitaires
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

interface AssignmentFilters {
  facultyId?: string;
  level?: string;
  academicYearId?: string;
  semester?: string;
  professeurId?: string;
  ueId?: string;
}

// ==================== GESTION D'ERREURS ====================
class CourseAssignmentError extends Error {
  constructor(message: string, public code: string, public context?: any) {
    super(message);
    this.name = "CourseAssignmentError";
  }
}

const handleStoreError = (error: unknown, context: string): never => {
  console.error(`Error in ${context}:`, error);

  if (error instanceof CourseAssignmentError) {
    throw error;
  }

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Une erreur inconnue s'est produite";

  throw new CourseAssignmentError(errorMessage, "STORE_ERROR", {
    context,
    error,
  });
};

// ==================== STORE IMPLEMENTATION ====================
export const useCourseAssignmentStore = create<CourseAssignmentState>()(
  persist(
    (set, get) => ({
      assignments: [],
      ues: [],
      professeurs: [],
      academicYears: [],
      faculties: [],
      loading: false,
      error: null,

      // ==================== MÉTHODES DE RÉCUPÉRATION ====================
      fetchAssignments: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
          const queryParams = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value.toString());
          });

          const response = await api.get(
            `/course-assignments?${queryParams.toString()}`
          );

          if (!response.data.success) {
            throw new CourseAssignmentError(
              response.data.error ||
                "Erreur lors du chargement des affectations",
              "FETCH_ERROR",
              { response: response.data }
            );
          }

          set({
            assignments: response.data.data || [],
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Erreur inconnue",
            loading: false,
          });
          handleStoreError(error, "fetchAssignments");
        }
      },

      // Dans votre store courseAssignmentStore.ts - CORRECTION DE LA MÉTHODE
      fetchAssignmentsByFaculty: async (
        facultyId: string,
        level: string,
        academicYearId: string,
        semester: string
      ) => {
        set({ loading: true, error: null });
        try {
          // Validation des paramètres
          if (!facultyId || !level || !academicYearId || !semester) {
            throw new CourseAssignmentError(
              "Paramètres manquants pour la récupération des affectations",
              "VALIDATION_ERROR",
              { facultyId, level, academicYearId, semester }
            );
          }

          console.log("🔍 Fetch assignments avec params:", {
            facultyId,
            level,
            academicYearId,
            semester,
          });

          // CORRECTION : Utiliser les query parameters correctement
          const queryParams = new URLSearchParams({
            level,
            academicYearId,
            semester,
          }).toString();

          const response = await api.get(
            `/course-assignments/faculty/${facultyId}?${queryParams}`
          );

          console.log("✅ Réponse assignments:", response.data);

          // CORRECTION : Gérer différentes structures de réponse
          let assignmentsData = [];

          if (response.data && Array.isArray(response.data)) {
            // Si l'API retourne directement un tableau
            assignmentsData = response.data;
          } else if (
            response.data &&
            response.data.success &&
            Array.isArray(response.data.data)
          ) {
            // Si l'API retourne { success: true, data: [...] }
            assignmentsData = response.data.data;
          } else if (
            response.data &&
            Array.isArray(response.data.assignments)
          ) {
            // Si l'API retourne { assignments: [...] }
            assignmentsData = response.data.assignments;
          } else {
            console.warn("⚠️ Structure de réponse inattendue:", response.data);
            assignmentsData = [];
          }

          // CORRECTION : Mettre à jour le store avec les données
          set((state) => ({
            assignments: [
              ...state.assignments.filter(
                (a) =>
                  !(
                    a.facultyId === facultyId &&
                    a.level === level &&
                    a.academicYearId === academicYearId &&
                    a.semester === semester
                  )
              ),
              ...assignmentsData,
            ],
            loading: false,
          }));

          return assignmentsData;
        } catch (error: any) {
          console.error("❌ Erreur fetchAssignmentsByFaculty:", error);

          // CORRECTION : Meilleure gestion des erreurs
          let errorMessage = "Erreur lors du chargement des affectations";

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 400) {
            errorMessage = "Requête invalide - vérifiez les paramètres";
          } else if (error.response?.status === 404) {
            errorMessage = "Aucune affectation trouvée pour ces critères";
          }

          set({
            error: errorMessage,
            loading: false,
          });

          // Ne pas throw l'erreur pour éviter de bloquer l'UI
          return [];
        }
      },
      fetchUeByFacultyAndLevel: async (facultyId: string, level: string) => {
        try {
          // Validation des paramètres
          if (!facultyId || !level) {
            throw new CourseAssignmentError(
              "facultyId et level sont requis",
              "VALIDATION_ERROR",
              { facultyId, level }
            );
          }

          const response = await api.get(
            `/ues/faculty/${facultyId}/level/${level}`
          );

          if (!response.data.success) {
            throw new CourseAssignmentError(
              response.data.error || "Erreur lors du chargement des UEs",
              "FETCH_ERROR",
              { response: response.data }
            );
          }

          return response.data.data || [];
        } catch (error) {
          console.error("Erreur récupération UEs:", error);

          // Retourner un tableau vide plutôt que de throw pour éviter de bloquer l'UI
          if (error instanceof CourseAssignmentError) {
            throw error;
          }

          return [];
        }
      },

      fetchAssignmentsByProfessor: async (professorId: string) => {
        set({ loading: true, error: null });
        try {
          if (!professorId) {
            throw new CourseAssignmentError(
              "ID du professeur requis",
              "VALIDATION_ERROR"
            );
          }

          const response = await api.get(
            `/professeurs/${professorId}/assignments`
          );

          console.log("📡 Réponse assignments professeur:", response);

          // CORRECTION: Gérer différentes structures de réponse
          let assignmentsData = [];

          if (response.data && Array.isArray(response.data)) {
            // Si l'API retourne directement un tableau
            assignmentsData = response.data;
          } else if (
            response.data &&
            response.data.success &&
            Array.isArray(response.data.data)
          ) {
            // Si l'API retourne { success: true, data: [...] }
            assignmentsData = response.data.data;
          } else if (
            response.data &&
            Array.isArray(response.data.assignments)
          ) {
            // Si l'API retourne { assignments: [...] }
            assignmentsData = response.data.assignments;
          } else {
            // console.warn("⚠️ Structure de réponse inattendue:", response.data);
            assignmentsData = [];
          }

          set({
            assignments: assignmentsData,
            loading: false,
          });
        } catch (error) {
          // console.error("❌ Erreur fetchAssignmentsByProfessor:", error);

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Erreur lors du chargement des affectations du professeur";

          set({
            error: errorMessage,
            loading: false,
            assignments: [], // Réinitialiser en cas d'erreur
          });

          // Ne pas throw l'erreur pour éviter de bloquer l'UI
          // handleStoreError(error, "fetchAssignmentsByProfessor");
        }
      },

      // ==================== MÉTHODES CRUD ====================
      addAssignment: async (assignmentData) => {
        set({ loading: true, error: null });
        try {
          // Validation des données
          if (
            !assignmentData.ueId ||
            !assignmentData.professeurId ||
            !assignmentData.facultyId ||
            !assignmentData.level ||
            !assignmentData.academicYearId ||
            !assignmentData.semester
          ) {
            throw new CourseAssignmentError(
              "Tous les champs obligatoires doivent être remplis",
              "VALIDATION_ERROR",
              { assignmentData }
            );
          }

          const response = await api.post(
            "/course-assignments",
            assignmentData
          );

          if (!response.data.success) {
            throw new CourseAssignmentError(
              response.data.error || "Erreur lors de la création",
              "CREATE_ERROR",
              { response: response.data }
            );
          }

          set((state) => ({
            assignments: [...state.assignments, response.data.data],
            loading: false,
          }));

          // Recharger les données pour s'assurer de la cohérence
          await get().fetchAssignments();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Erreur inconnue",
            loading: false,
          });
          handleStoreError(error, "addAssignment");
        }
      },

      updateAssignment: async (id, assignmentData) => {
        set({ loading: true, error: null });
        try {
          if (!id) {
            throw new CourseAssignmentError(
              "ID de l'affectation requis",
              "VALIDATION_ERROR"
            );
          }

          const response = await api.put(
            `/course-assignments/${id}`,
            assignmentData
          );

          if (!response.data.success) {
            throw new CourseAssignmentError(
              response.data.error || "Erreur lors de la mise à jour",
              "UPDATE_ERROR",
              { response: response.data }
            );
          }

          set((state) => ({
            assignments: state.assignments.map((a) =>
              a.id === id ? { ...a, ...response.data.data } : a
            ),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Erreur inconnue",
            loading: false,
          });
          handleStoreError(error, "updateAssignment");
        }
      },
      groupAssignmentsByFacultyAndYear: () => {
        const { assignments } = get();

        const grouped: GroupedAssignments = {};

        assignments.forEach((assignment) => {
          const facultyName = assignment.faculty?.name || "Faculté inconnue";
          const academicYear = assignment.academicYearId || "Année inconnue";
          const semester = assignment.semester || "Semestre inconnu";

          if (!grouped[facultyName]) {
            grouped[facultyName] = {};
          }

          if (!grouped[facultyName][academicYear]) {
            grouped[facultyName][academicYear] = {};
          }

          if (!grouped[facultyName][academicYear][semester]) {
            grouped[facultyName][academicYear][semester] = [];
          }

          grouped[facultyName][academicYear][semester].push(assignment);
        });

        return grouped;
      },

      deleteAssignment: async (id) => {
        set({ loading: true, error: null });
        try {
          if (!id) {
            throw new CourseAssignmentError(
              "ID de l'affectation requis",
              "VALIDATION_ERROR"
            );
          }

          const response = await api.delete(`/course-assignments/${id}`);

          if (!response.data.success) {
            throw new CourseAssignmentError(
              response.data.error || "Erreur lors de la suppression",
              "DELETE_ERROR",
              { response: response.data }
            );
          }

          set((state) => ({
            assignments: state.assignments.filter(
              (assignment) => assignment.id !== id
            ),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Erreur inconnue",
            loading: false,
          });
          handleStoreError(error, "deleteAssignment");
        }
      },

      // ==================== GETTERS ====================
      getAssignmentById: (id) => {
        const { assignments } = get();
        return assignments.find((a) => a.id === id);
      },

      getAssignmentsByUE: (ueId) => {
        const { assignments } = get();
        return assignments.filter((a) => a.ueId === ueId);
      },

      getAssignmentsByProfessor: (professorId) => {
        const { assignments } = get();
        return assignments.filter((a) => a.professeurId === professorId);
      },

      // ==================== UTILITAIRES ====================
      clearError: () => set({ error: null }),

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: "course-assignment-storage",
      partialize: (state) => ({
        assignments: state.assignments,
        ues: state.ues,
        professeurs: state.professeurs,
        academicYears: state.academicYears,
        faculties: state.faculties,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration depuis la version 0
          return {
            ...persistedState,
            faculties: [],
          };
        }
        return persistedState;
      },
    }
  )
);

// ==================== INITIALISATION ====================
export const initializeCourseAssignmentStore = async () => {
  try {
    const store = useCourseAssignmentStore.getState();
    store.setLoading(true);

    await Promise.allSettled([
      store
        .fetchAssignments()
        .catch((error) =>
          console.error("Erreur chargement affectations:", error)
        ),
      // Autres initialisations si nécessaire
    ]);

    store.setLoading(false);
  } catch (error) {
    console.error("Erreur initialisation store:", error);
    useCourseAssignmentStore.getState().setLoading(false);
  }
};
