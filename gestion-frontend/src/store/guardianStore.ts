// stores/guardianStore.ts
import { create } from "zustand";
import api from "../services/api";
import { Guardian, Student } from "../types/academic";

interface GuardianStore {
  guardians: Guardian[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchGuardians: () => Promise<void>;
  fetchGuardiansByStudent: (studentId: string) => Promise<Guardian[]>;
  getGuardian: (id: string) => Guardian | undefined;
  addGuardian: (
    guardian: Omit<Guardian, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateGuardian: (id: string, guardian: Partial<Guardian>) => Promise<void>;
  deleteGuardian: (id: string) => Promise<void>;
  setPrimaryGuardian: (studentId: string, guardianId: string) => Promise<void>;

  // Getters utilitaires
  getStudentGuardians: (studentId: string) => Guardian[];
  getPrimaryGuardian: (studentId: string) => Guardian | undefined;
}

export const useGuardianStore = create<GuardianStore>((set, get) => ({
  guardians: [],
  loading: false,
  error: null,

  // Récupérer tous les guardians
  fetchGuardians: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/guardians");
      set({
        guardians: response.data,
        loading: false,
      });
    } catch (error: any) {
      console.error("Erreur fetchGuardians:", error);
      set({
        error:
          error.response?.data?.message ||
          "Erreur lors du chargement des responsables",
        loading: false,
      });
      throw error;
    }
  },

  // Récupérer les guardians d'un étudiant spécifique
  fetchGuardiansByStudent: async (studentId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/students/${studentId}/guardians`);
      const studentGuardians = response.data;

      // Mettre à jour le store avec les guardians de cet étudiant
      set((state) => {
        const existingGuardians = state.guardians.filter(
          (g) => g.studentId !== studentId
        );
        return {
          guardians: [...existingGuardians, ...studentGuardians],
          loading: false,
        };
      });

      return studentGuardians;
    } catch (error: any) {
      console.error("Erreur fetchGuardiansByStudent:", error);
      set({
        error:
          error.response?.data?.message ||
          "Erreur lors du chargement des responsables",
        loading: false,
      });
      throw error;
    }
  },

  // Obtenir un guardian par son ID
  getGuardian: (id: string) => {
    return get().guardians.find((guardian) => guardian.id === id);
  },

  // Ajouter un nouveau guardian
  addGuardian: async (guardianData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/guardians", guardianData);
      const newGuardian = response.data;

      set((state) => ({
        guardians: [...state.guardians, newGuardian],
        loading: false,
      }));

      return newGuardian;
    } catch (error: any) {
      console.error("Erreur addGuardian:", error);
      set({
        error:
          error.response?.data?.message ||
          "Erreur lors de l'ajout du responsable",
        loading: false,
      });
      throw error;
    }
  },

  // Modifier un guardian existant
  updateGuardian: async (id, guardianData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/guardians/${id}`, guardianData);
      const updatedGuardian = response.data;

      set((state) => ({
        guardians: state.guardians.map((guardian) =>
          guardian.id === id ? updatedGuardian : guardian
        ),
        loading: false,
      }));

      return updatedGuardian;
    } catch (error: any) {
      console.error("Erreur updateGuardian:", error);
      set({
        error:
          error.response?.data?.message ||
          "Erreur lors de la modification du responsable",
        loading: false,
      });
      throw error;
    }
  },

  // Supprimer un guardian
  deleteGuardian: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/guardians/${id}`);

      set((state) => ({
        guardians: state.guardians.filter((guardian) => guardian.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error("Erreur deleteGuardian:", error);
      set({
        error:
          error.response?.data?.message ||
          "Erreur lors de la suppression du responsable",
        loading: false,
      });
      throw error;
    }
  },

  // Définir un guardian comme principal
  setPrimaryGuardian: async (studentId: string, guardianId: string) => {
    set({ loading: true, error: null });
    try {
      // D'abord, réinitialiser tous les guardians de cet étudiant
      const studentGuardians = get().guardians.filter(
        (g) => g.studentId === studentId
      );

      for (const guardian of studentGuardians) {
        await api.patch(`/guardians/${guardian.id}`, {
          isPrimary: guardian.id === guardianId,
        });
      }

      // Mettre à jour le store
      set((state) => ({
        guardians: state.guardians.map((guardian) => ({
          ...guardian,
          isPrimary:
            guardian.studentId === studentId
              ? guardian.id === guardianId
              : guardian.isPrimary,
        })),
        loading: false,
      }));
    } catch (error: any) {
      console.error("Erreur setPrimaryGuardian:", error);
      set({
        error:
          error.response?.data?.message ||
          "Erreur lors de la définition du responsable principal",
        loading: false,
      });
      throw error;
    }
  },

  // Obtenir tous les guardians d'un étudiant
  getStudentGuardians: (studentId: string) => {
    return get()
      .guardians.filter((guardian) => guardian.studentId === studentId)
      .sort((a, b) => {
        // Le guardian principal en premier
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });
  },

  // Obtenir le guardian principal d'un étudiant
  getPrimaryGuardian: (studentId: string) => {
    return get().guardians.find(
      (guardian) => guardian.studentId === studentId && guardian.isPrimary
    );
  },
}));

// Hook personnalisé pour faciliter l'utilisation
export const useStudentGuardians = (studentId?: string) => {
  const { guardians, getStudentGuardians, fetchGuardiansByStudent } =
    useGuardianStore();

  const studentGuardians = studentId ? getStudentGuardians(studentId) : [];

  return {
    guardians: studentGuardians,
    primaryGuardian: studentGuardians.find((g) => g.isPrimary),
    secondaryGuardians: studentGuardians.filter((g) => !g.isPrimary),
    fetchGuardians: () =>
      studentId ? fetchGuardiansByStudent(studentId) : Promise.resolve([]),
  };
};
