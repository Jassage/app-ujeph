// src/store/academicYearStore.ts
import { create } from "zustand";
import api from "../services/api";

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface AcademicYearState {
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear | null;
  loading: boolean;
  error: string | null;
  fetchAcademicYears: () => Promise<void>;
}

export const useAcademicYearStore = create<AcademicYearState>((set) => ({
  academicYears: [],
  currentAcademicYear: null,
  loading: false,
  error: null,

  fetchAcademicYears: async () => {
    set({ loading: true });
    try {
      const response = await api.get("/academic-years");
      const years = response.data;
      set({
        academicYears: years,
        currentAcademicYear:
          years.find((y: AcademicYear) => y.isCurrent) || null,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message, loading: false });
    }
  },
}));
