// src/store/courseStore.ts
import { create } from "zustand";
import api from "../services/api";
import { CreateUEData, UE, UpdateUEData } from "../types/academic";

interface UEFilters {
  type?: string;
  search?: string;
  facultyId?: string;
  level?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UEState {
  ues: UE[];
  currentUE: UE | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  fetchUEs: (
    filters?: UEFilters,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchUEById: (id: string) => Promise<void>;
  createUE: (ueData: CreateUEData) => Promise<UE>; // ← Utiliser CreateUEData
  updateUE: (id: string, ueData: UpdateUEData) => Promise<void>; // ← Utiliser UpdateUEData
  deleteUE: (id: string) => Promise<void>;
  addPrerequisite: (ueId: string, prerequisiteId: string) => Promise<void>;
  removePrerequisite: (ueId: string, prerequisiteId: string) => Promise<void>;
  searchUEs: (query: string) => Promise<UE[]>;
  getUEStats: (ueId: string) => Promise<any>;
}

export const useUEStore = create<UEState>((set, get) => ({
  ues: [],
  currentUE: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  fetchUEs: async (filters = {}, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });

      console.log(`🔄 Fetching UEs: /ues?${params.toString()}`);

      const response = await api.get(`/ues?${params}`);

      set({
        ues: response.data.ues || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
        loading: false,
      });
    } catch (error: any) {
      console.error("❌ Erreur fetchUEs:", error);
      set({
        error: error.response?.data?.message || "Erreur de chargement des UEs",
        loading: false,
      });
      throw error;
    }
  },

  fetchUEById: async (id: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/ues/${id}`);
      set({ currentUE: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de chargement de l'UE",
        loading: false,
      });
      throw error;
    }
  },

  createUE: async (ueData: CreateUEData) => {
    // ← Type correct
    set({ loading: true });
    try {
      // Préparer le payload correctement
      const payload = {
        code: ueData.code,
        title: ueData.title,
        credits: ueData.credits,
        type: ueData.type,
        passingGrade: ueData.passingGrade || 60,
        description: ueData.description || "",
        objectives: ueData.objectives || "",
        createdById: ueData.createdById,
        prerequisites: ueData.prerequisites || [], // ← Ce sont des strings
      };

      console.log("📤 Payload création UE:", payload);

      const response = await api.post("/ues", payload);

      set((state) => ({
        ues: [...state.ues, response.data],
        loading: false,
      }));

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur de création de l'UE";
      console.error("❌ Erreur création UE:", error.response?.data);
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  updateUE: async (id: string, ueData: UpdateUEData) => {
    // ← Type correct
    set({ loading: true });
    try {
      const response = await api.put(`/ues/${id}`, ueData);
      set((state) => ({
        ues: state.ues.map((ue) => (ue.id === id ? response.data : ue)),
        currentUE: state.currentUE?.id === id ? response.data : state.currentUE,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Erreur de modification de l'UE",
        loading: false,
      });
      throw error;
    }
  },

  deleteUE: async (id: string) => {
    set({ loading: true });
    try {
      await api.delete(`/ues/${id}`);
      set((state) => ({
        ues: state.ues.filter((ue) => ue.id !== id),
        currentUE: state.currentUE?.id === id ? null : state.currentUE,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de suppression de l'UE",
        loading: false,
      });
      throw error;
    }
  },

  addPrerequisite: async (ueId: string, prerequisiteId: string) => {
    set({ loading: true });
    try {
      const response = await api.post(`/ues/${ueId}/prerequisites`, {
        prerequisiteId,
      });
      set((state) => ({
        currentUE:
          state.currentUE?.id === ueId
            ? {
                ...state.currentUE,
                prerequisites: [
                  ...(state.currentUE.prerequisites || []),
                  response.data,
                ],
              }
            : state.currentUE,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur d'ajout de prérequis",
        loading: false,
      });
      throw error;
    }
  },

  removePrerequisite: async (ueId: string, prerequisiteId: string) => {
    set({ loading: true });
    try {
      await api.delete(`/ues/${ueId}/prerequisites/${prerequisiteId}`);
      set((state) => ({
        currentUE:
          state.currentUE?.id === ueId
            ? {
                ...state.currentUE,
                prerequisites: (state.currentUE.prerequisites || []).filter(
                  (p: any) => p.prerequisiteId !== prerequisiteId
                ),
              }
            : state.currentUE,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Erreur de suppression de prérequis",
        loading: false,
      });
      throw error;
    }
  },

  searchUEs: async (query: string) => {
    set({ loading: true });
    try {
      const response = await api.get(
        `/ues/search?q=${encodeURIComponent(query)}`
      );
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de recherche",
        loading: false,
      });
      throw error;
    }
  },

  getUEStats: async (ueId: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/ues/${ueId}/stats`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ||
          "Erreur de chargement des statistiques",
        loading: false,
      });
      throw error;
    }
  },
}));
