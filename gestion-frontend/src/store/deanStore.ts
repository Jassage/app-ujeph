// src/store/deanStore.ts
import { create } from "zustand";
import api from "../services/api";
import { FacultyWithLevels } from "../types/academic";

interface DeanState {
  faculty: FacultyWithLevels | null;
  loading: boolean;
  error: string | null;
  fetchDeanFaculty: (userId: string) => Promise<void>;
  clearFaculty: () => void;
}

export const useDeanStore = create<DeanState>((set, get) => ({
  faculty: null,
  loading: false,
  error: null,

  fetchDeanFaculty: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      // Cette route devrait retourner la faculté dont l'utilisateur est doyen
      const response = await api.get(`/faculties/dean/${userId}`);

      set({
        faculty: response.data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Erreur récupération faculté doyen:", error);

      set({
        faculty: null,
        loading: false,
        error: error.response?.data?.message || "Erreur de chargement",
      });
    }
  },

  clearFaculty: () => set({ faculty: null, error: null }),
}));
