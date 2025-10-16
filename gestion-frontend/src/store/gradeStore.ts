import { create } from "zustand";
import { Grade, GradeWithDetails } from "../types/academic";
import api from "@/services/api";

// Types améliorés
interface GradeStore {
  grades: Grade[];
  loading: boolean;
  error: string | null;
  fetchGrades: (filters?: GradeFilters) => Promise<void>;
  fetchGradesByStudent: (studentId: string) => Promise<GradeWithDetails[]>;
  fetchGradesByUE: (
    ueId: string,
    academicYear?: string
  ) => Promise<GradeWithDetails[]>;
  fetchStudentGrades: (
    studentId: string,
    academicYear?: string
  ) => Promise<GradeWithDetails[]>;
  addGrade: (
    grade: Omit<Grade, "id" | "createdAt" | "updatedAt">
  ) => Promise<Grade>;
  updateGrade: (
    id: string,
    grade: Partial<Grade>,
    isRetake?: boolean
  ) => Promise<Grade | { grade: Grade }>;
  deleteGrade: (id: string) => Promise<void>;
  bulkAddGrades: (
    grades: Omit<Grade, "id" | "createdAt" | "updatedAt">[]
  ) => Promise<Grade[]>;
  recalculateStatus: (
    grade: number,
    passingGrade?: number
  ) => "Valid_" | "Non_valid_" | "reprendre";
  getStudentGradeForUE: (
    studentId: string,
    ueId: string,
    academicYear: string,
    semester: string
  ) => Grade | null;
  clearError: () => void;
  getStudentGradeHistory: (
    studentId: string,
    ueId: string,
    academicYearId: string,
    semester: string
  ) => Grade[];

  // Méthode pour récupérer toutes les notes d'un étudiant (y compris historiques)
  getAllStudentGrades: (studentId: string) => Grade[];
  getGradeHistory: (
    studentId: string,
    ueId: string,
    academicYearId: string,
    semester: string
  ) => Promise<Grade[]>;
}

interface GradeFilters {
  studentId?: string;
  ueId?: string;
  academicYear?: string;
  semester?: "S1" | "S2";
  status?: Grade["status"];
}

// Classe d'erreur métier
class GradeStoreError extends Error {
  constructor(message: string, public code: string, public context?: any) {
    super(message);
    this.name = "GradeStoreError";
  }
}

// Validateur de données
class GradeDataValidator {
  static validateGradeInput(gradeData: any): void {
    const errors: string[] = [];

    if (!gradeData.studentId) errors.push("ID étudiant manquant");
    if (!gradeData.ueId) errors.push("ID UE manquant");
    if (gradeData.grade === undefined || gradeData.grade === null)
      errors.push("Note manquante");

    if (gradeData.grade !== undefined) {
      const grade = Number(gradeData.grade);
      if (isNaN(grade)) errors.push("La note doit être un nombre");
      if (grade < 0 || grade > 100)
        errors.push("La note doit être entre 0 et 100");
    }

    if (!gradeData.academicYearId) errors.push("Année académique manquante");
    if (!gradeData.semester) errors.push("Semestre manquant");

    if (errors.length > 0) {
      throw new GradeStoreError(
        errors.join(", "),
        "VALIDATION_ERROR",
        gradeData
      );
    }
  }
}

export const useGradeStore = create<GradeStore>((set, get) => ({
  grades: [],
  loading: false,
  error: null,

  fetchGrades: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/grades?${params}`);

      if (response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      // CORRECTION : S'assurer que response.data est bien un tableau
      const gradesData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.grades)
        ? response.data.grades
        : [];

      set({ grades: gradesData, loading: false });
    } catch (error) {
      const storeError =
        error instanceof GradeStoreError
          ? error
          : new GradeStoreError(
              "Erreur lors du chargement des notes",
              "FETCH_ERROR",
              { filters, error }
            );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },

  fetchGradesByStudent: async (studentId: string) => {
    set({ loading: true, error: null });
    try {
      if (!studentId) {
        throw new GradeStoreError("ID étudiant manquant", "VALIDATION_ERROR");
      }

      const response = await api.get(`/grades/student/${studentId}`);

      if (response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      set({ loading: false });
      return response.data?.grades || response.data || [];
    } catch (error) {
      const storeError =
        error instanceof GradeStoreError
          ? error
          : new GradeStoreError(
              "Erreur lors du chargement des notes de l'étudiant",
              "FETCH_ERROR",
              { studentId, error }
            );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },

  // Dans gradeStore.ts - Améliorer addGrade
  addGrade: async (gradeData) => {
    set({ loading: true, error: null });
    try {
      // Validation des données
      GradeDataValidator.validateGradeInput(gradeData);

      console.log("🔄 Store: Adding grade", gradeData);

      const response = await api.post("/grades", gradeData);

      // Gérer les différents codes de statut
      if (response.status === 409) {
        // Conflit - note déjà existante
        const conflictData = response.data;
        throw new GradeStoreError(
          conflictData.error || "Note déjà existante",
          "CONFLICT_ERROR",
          {
            gradeData,
            existingGrade: conflictData.existingGrade,
            suggestions: conflictData.suggestions,
          }
        );
      }

      if (response.status !== 201 && response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      const newGrade = response.data?.grade || response.data;

      set((state) => ({
        grades: [...state.grades, newGrade],
        loading: false,
      }));

      return newGrade;
    } catch (error) {
      console.error("❌ Store: Error adding grade:", error);

      // Gérer spécifiquement les conflits
      if (error.response?.status === 409) {
        const storeError = new GradeStoreError(
          error.response.data?.error ||
            "Une note existe déjà pour cet étudiant et ce cours",
          "CONFLICT_ERROR",
          {
            gradeData,
            existingGrade: error.response.data?.existingGrade,
            suggestions: error.response.data?.suggestions,
          }
        );
        set({ error: storeError.message, loading: false });
        throw storeError;
      }

      const storeError =
        error instanceof GradeStoreError
          ? error
          : new GradeStoreError(
              "Erreur lors de l'ajout de la note",
              "ADD_ERROR",
              { gradeData, error: error.message }
            );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },

  // store/gradeStore.ts - Corriger la méthode updateGrade
  updateGrade: async (id, gradeData, isRetake = false) => {
    set({ loading: true, error: null });
    try {
      if (!id) {
        throw new GradeStoreError("ID de note manquant", "VALIDATION_ERROR");
      }

      console.log("🔄 Store: Updating grade", { id, gradeData, isRetake });

      // Validation partielle pour la mise à jour
      if (gradeData.grade !== undefined) {
        const grade = Number(gradeData.grade);
        if (isNaN(grade) || grade < 0 || grade > 100) {
          throw new GradeStoreError("Note invalide", "VALIDATION_ERROR");
        }
      }

      const response = await api.put(`/grades/${id}`, {
        ...gradeData,
        isRetake,
      });

      console.log("📡 API Response:", response);

      if (response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}: ${response.statusText}`,
          "NETWORK_ERROR"
        );
      }

      const result = response.data;

      if (isRetake && result.grade) {
        // Si c'est une reprise, ajouter la nouvelle note
        console.log("🔄 Adding retake grade to store:", result.grade);
        set((state) => ({
          grades: [...state.grades, result.grade],
          loading: false,
        }));
        return result;
      } else {
        // Mise à jour normale
        console.log("✏️ Updating existing grade in store");
        set((state) => ({
          grades: state.grades.map((grade) =>
            grade.id === id ? { ...grade, ...gradeData } : grade
          ),
          loading: false,
        }));
        return result.grade || result;
      }
    } catch (error) {
      console.error("❌ Store: Error updating grade:", error);

      // Amélioration du message d'erreur
      let errorMessage = "Erreur lors de la modification de la note";
      if (error.response?.status === 404) {
        errorMessage = "Note non trouvée. Vérifiez que la note existe encore.";
      } else if (error.response?.status === 400) {
        errorMessage = "Données invalides pour la mise à jour";
      }

      const storeError = new GradeStoreError(errorMessage, "UPDATE_ERROR", {
        id,
        gradeData,
        isRetake,
        error: error.message,
      });

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },

  bulkAddGrades: async (grades) => {
    set({ loading: true, error: null });
    try {
      // Validation de toutes les notes
      grades.forEach((gradeData) => {
        GradeDataValidator.validateGradeInput(gradeData);
      });

      const response = await api.post("/grades/bulk", { grades });

      if (response.status !== 201) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      const newGrades = response.data?.results?.success || response.data || [];

      set((state) => ({
        grades: [...state.grades, ...newGrades],
        loading: false,
      }));

      return newGrades;
    } catch (error) {
      const storeError =
        error instanceof GradeStoreError
          ? error
          : new GradeStoreError(
              "Erreur lors de l'ajout des notes en masse",
              "BULK_ADD_ERROR",
              { gradesCount: grades.length, error }
            );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },
  // store/gradeStore.ts - Corriger l'implémentation
  getGradeHistory: async (
    studentId: string,
    ueId: string,
    academicYearId: string,
    semester: string
  ): Promise<Grade[]> => {
    set({ loading: true, error: null });

    try {
      console.log("🔍 getGradeHistory API call:", {
        studentId,
        ueId,
        academicYearId,
        semester,
      });

      // Appel API direct pour récupérer l'historique
      const response = await api.get(
        `/grades/history/${studentId}/${ueId}/${academicYearId}/${semester}`
      );

      console.log("🔍 getGradeHistory API response:", {
        status: response.status,
        data: response.data,
      });

      if (response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      // Extraire les notes de la réponse et les typer correctement
      const historyGrades: Grade[] =
        response.data?.grades || response.data || [];
      console.log("🔍 History grades from API:", historyGrades.length);

      // Mettre à jour le store avec l'historique
      set((state) => {
        // Filtrer les notes existantes pour éviter les doublons
        const existingIds = new Set(state.grades.map((g) => g.id));
        const newGrades = historyGrades.filter(
          (grade: Grade) => !existingIds.has(grade.id)
        );

        return {
          grades: [...state.grades, ...newGrades],
          loading: false,
        };
      });

      return historyGrades; // Retourne Grade[] comme promis
    } catch (error) {
      console.error("❌ Error in getGradeHistory:", error);

      const storeError = new GradeStoreError(
        "Erreur lors du chargement de l'historique",
        "HISTORY_FETCH_ERROR",
        { studentId, ueId, academicYearId, semester, error: error.message }
      );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },

  getAllGradesByStudent: (studentId: string): Grade[] => {
    const { grades } = get();
    return grades.filter((grade) => grade.studentId === studentId);
  },
  getStudentGradeHistory: (studentId, ueId, academicYearId, semester) => {
    const { grades } = get();
    return grades
      .filter(
        (grade) =>
          grade.studentId === studentId &&
          grade.ueId === ueId &&
          grade.academicYearId === academicYearId &&
          grade.semester === semester
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  getAllStudentGrades: (studentId) => {
    const { grades } = get();
    return grades.filter((grade) => grade.studentId === studentId);
  },

  deleteGrade: async (id) => {
    set({ loading: true, error: null });
    try {
      if (!id) {
        throw new GradeStoreError("ID de note manquant", "VALIDATION_ERROR");
      }

      const response = await api.delete(`/grades/${id}`);

      if (response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      set((state) => ({
        grades: state.grades.filter((grade) => grade.id !== id),
        loading: false,
      }));
    } catch (error) {
      const storeError =
        error instanceof GradeStoreError
          ? error
          : new GradeStoreError(
              "Erreur lors de la suppression de la note",
              "DELETE_ERROR",
              { id, error }
            );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },

  recalculateStatus: (grade, passingGrade = 10) => {
    if (grade >= passingGrade) return "Valid_";
    if (grade >= passingGrade * 0.7) return "reprendre";
    return "Non_valid_";
  },

  getStudentGradeForUE: (studentId, ueId, academicYearId, semester) => {
    const { grades } = get();

    // CORRECTION : Vérification que grades est bien un tableau
    if (!Array.isArray(grades)) {
      console.warn("Grades n'est pas un tableau:", grades);
      return null;
    }

    if (!studentId || !ueId || !academicYearId || !semester) {
      console.warn("Paramètres manquants pour getStudentGradeForUE");
      return null;
    }

    const foundGrade = grades.find(
      (grade) =>
        grade.studentId === studentId &&
        grade.ueId === ueId &&
        grade.academicYearId === academicYearId &&
        grade.semester === semester
    );

    return foundGrade || null;
  },

  clearError: () => set({ error: null }),

  fetchGradesByUE: async (ueId: string, academicYear?: string) => {
    set({ loading: true, error: null });
    try {
      if (!ueId) {
        throw new GradeStoreError("ID UE manquant", "VALIDATION_ERROR");
      }

      const params = new URLSearchParams();
      if (academicYear) params.append("academicYear", academicYear);

      const response = await api.get(`/grades/ue/${ueId}?${params}`);

      if (response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      set({ loading: false });
      return response.data?.grades || response.data || [];
    } catch (error) {
      const storeError =
        error instanceof GradeStoreError
          ? error
          : new GradeStoreError(
              "Erreur lors du chargement des notes de l'UE",
              "FETCH_ERROR",
              { ueId, academicYear, error }
            );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },

  fetchStudentGrades: async (studentId: string, academicYear?: string) => {
    set({ loading: true, error: null });
    try {
      if (!studentId) {
        throw new GradeStoreError("ID étudiant manquant", "VALIDATION_ERROR");
      }

      const params = new URLSearchParams();
      if (academicYear) params.append("academicYear", academicYear);

      const response = await api.get(`/grades/student/${studentId}?${params}`);

      if (response.status !== 200) {
        throw new GradeStoreError(
          `Erreur HTTP ${response.status}`,
          "NETWORK_ERROR"
        );
      }

      set({ loading: false });
      return response.data?.grades || response.data || [];
    } catch (error) {
      const storeError =
        error instanceof GradeStoreError
          ? error
          : new GradeStoreError(
              "Erreur lors du chargement des notes de l'étudiant",
              "FETCH_ERROR",
              { studentId, academicYear, error }
            );

      set({ error: storeError.message, loading: false });
      throw storeError;
    }
  },
}));
