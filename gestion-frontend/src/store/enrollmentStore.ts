// store/enrollmentStore.ts - VERSION CORRIGÉE
import { create } from "zustand";
import api from "../services/api";
import {
  Enrollment,
  CreateEnrollmentData,
  UpdateEnrollmentData,
} from "../types/academic";
import { toast } from "sonner";

interface EnrollmentStore {
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchEnrollments: () => Promise<void>;
  addEnrollment: (enrollment: CreateEnrollmentData) => Promise<void>;
  updateEnrollment: (
    id: string,
    enrollment: UpdateEnrollmentData
  ) => Promise<void>;
  updateEnrollmentStatus: (
    id: string,
    status: "Active" | "Completed" | "Suspended"
  ) => Promise<void>;
  deleteEnrollment: (id: string) => Promise<void>;

  // Méthodes utilitaires synchrones
  getEnrollmentsByStudent: (studentId: string) => Enrollment[];
  getEnrollmentsByFaculty: (faculty: string, level?: string) => Enrollment[];
  getActiveEnrollment: (studentId: string) => Enrollment | null;

  // Méthode pour charger les inscriptions par étudiant
  fetchEnrollmentsByStudent: (studentId: string) => Promise<void>;
  assignFeeToStudent: (feeAssignmentData: any) => Promise<any>;

  // Utilitaires
  clearError: () => void;
}

export const useEnrollmentStore = create<EnrollmentStore>((set, get) => ({
  enrollments: [],
  loading: false,
  error: null,

  fetchEnrollments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/enrollments");
      set({
        enrollments: response.data,
        loading: false,
      });
    } catch (err: any) {
      console.error("Failed to fetch enrollments:", err);
      set({
        error:
          err.response?.data?.error ||
          "Erreur lors du chargement des inscriptions",
        loading: false,
      });
      throw err;
    }
  },

  addEnrollment: async (enrollmentData: CreateEnrollmentData) => {
    set({ loading: true, error: null });
    try {
      // console.log("🔍 DEBUG - Données envoyées à l'API:", enrollmentData);
      const payload = {
        studentId: enrollmentData.studentId,
        faculty: enrollmentData.faculty,
        level: enrollmentData.level,
        academicYearId: enrollmentData.academicYearId,
        enrollmentDate:
          enrollmentData.enrollmentDate || new Date().toISOString(),
        status: "Active",
      };

      // console.log("🔍 DEBUG - Données formatées:", payload);
      const response = await api.post("/enrollments", payload);

      // Recharger toutes les inscriptions
      const enrollmentsResponse = await api.get("/enrollments");

      set({
        enrollments: enrollmentsResponse.data,
        loading: false,
      });

      toast.success("Inscription créée avec succès");
      return response.data;
    } catch (err: any) {
      console.error("❌ Erreur détaillée lors de l'ajout:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.details ||
        "Erreur lors de l'ajout de l'inscription";
      console.error("Failed to add enrollment:", err);
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  updateEnrollment: async (
    id: string,
    enrollmentData: UpdateEnrollmentData
  ) => {
    set({ loading: true, error: null });
    try {
      const cleanData: any = {};

      if (enrollmentData.faculty !== undefined)
        cleanData.faculty = enrollmentData.faculty;
      if (enrollmentData.level !== undefined)
        cleanData.level = enrollmentData.level;
      if (enrollmentData.academicYearId !== undefined)
        cleanData.academicYearId = enrollmentData.academicYearId;
      if (enrollmentData.status !== undefined)
        cleanData.status = enrollmentData.status;

      const response = await api.put(`/enrollments/${id}`, cleanData);

      // CORRECTION CRITIQUE : Normaliser les données reçues de l'API
      const updatedData = response.data;
      const normalizedEnrollment = {
        ...updatedData,
        // S'assurer que faculty et academicYear sont des strings, pas des objets
        faculty:
          typeof updatedData.faculty === "object"
            ? updatedData.faculty.name || updatedData.faculty.id
            : updatedData.faculty,
        academicYear:
          typeof updatedData.academicYear === "object"
            ? updatedData.academicYear.year || updatedData.academicYear.id
            : updatedData.academicYear,
      };

      console.log(
        "🔍 DEBUG updateEnrollment - Données normalisées:",
        normalizedEnrollment
      );

      set((state) => ({
        enrollments: state.enrollments.map((e) =>
          e.id === id ? normalizedEnrollment : e
        ),
        loading: false,
      }));

      return normalizedEnrollment;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.details ||
        "Erreur lors de la mise à jour de l'inscription";
      console.error("Failed to update enrollment:", err);
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  updateEnrollmentStatus: async (
    id: string,
    status: "Active" | "Completed" | "Suspended"
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/enrollments/${id}/status`, { status });

      set((state) => ({
        enrollments: state.enrollments.map((e) =>
          e.id === id ? { ...e, status } : e
        ),
        loading: false,
      }));

      toast.success("Statut d'inscription mis à jour");
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Erreur lors du changement de statut";
      console.error("Failed to update enrollment status:", err);
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  deleteEnrollment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/enrollments/${id}`);

      set((state) => ({
        enrollments: state.enrollments.filter((e) => e.id !== id),
        loading: false,
      }));

      toast.success("Inscription supprimée avec succès");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Erreur lors de la suppression de l'inscription";
      console.error("Failed to delete enrollment:", err);
      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  getEnrollmentsByStudent: (studentId: string) => {
    return get().enrollments.filter((e) => e.studentId === studentId);
  },

  getEnrollmentsByFaculty: (faculty: string, level?: string) => {
    return get().enrollments.filter(
      (e) => e.faculty === faculty && (level ? e.level === level : true)
    );
  },

  getActiveEnrollment: (studentId: string) => {
    return (
      get().enrollments.find(
        (e) => e.studentId === studentId && e.status === "Active"
      ) || null
    );
  },

  fetchEnrollmentsByStudent: async (studentId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/enrollments?studentId=${studentId}`);
      set({
        enrollments: response.data,
        loading: false,
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Erreur lors du chargement des inscriptions";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  assignFeeToStudent: async (feeAssignmentData: any) => {
    set({ loading: true, error: null });
    console.log("frais etudiant", feeAssignmentData);

    try {
      const response = await api.post("/student-fees", feeAssignmentData);

      toast.success("Frais attribués avec succès");
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Erreur lors de l'attribution des frais";
      set({ error: errorMessage, loading: false });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),
}));
