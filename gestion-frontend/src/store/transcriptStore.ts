import { create } from "zustand";
// import { apiService } from '../services/api';
import { Transcript, DocumentGenerationOptions } from "../types/academic";
import { apiService } from "@/services/apiService";

interface TranscriptStore {
  transcripts: Transcript[];
  isLoading: boolean;
  currentGeneration: string | null;

  // Actions
  generateTranscript: (
    options: DocumentGenerationOptions
  ) => Promise<Transcript>;
  getStudentTranscripts: (studentId: string) => Promise<Transcript[]>;
  downloadTranscript: (transcriptId: string) => Promise<void>;
  fetchTranscripts: (filters?: any) => Promise<void>;
  deleteTranscript: (transcriptId: string) => Promise<void>;
}

export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
  transcripts: [],
  isLoading: false,
  currentGeneration: null,

  generateTranscript: async (options) => {
    set({ isLoading: true, currentGeneration: options.type });

    try {
      const transcript = await apiService.generateDocument(options);

      set((state) => ({
        transcripts: [...state.transcripts, transcript],
        isLoading: false,
        currentGeneration: null,
      }));

      return transcript;
    } catch (error) {
      set({ isLoading: false, currentGeneration: null });
      throw error;
    }
  },

  getStudentTranscripts: async (studentId) => {
    try {
      const response = await apiService.getTranscripts({ studentId });
      return response.transcripts || [];
    } catch (error) {
      console.error("Error fetching student transcripts:", error);
      throw error;
    }
  },

  downloadTranscript: async (transcriptId) => {
    try {
      const { blob, fileName } = await apiService.downloadTranscript(
        transcriptId
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading transcript:", error);
      throw error;
    }
  },

  fetchTranscripts: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const response = await apiService.getTranscripts(filters);
      set({ transcripts: response.transcripts, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTranscript: async (transcriptId) => {
    try {
      await apiService.deleteTranscript(transcriptId);
      set((state) => ({
        transcripts: state.transcripts.filter((t) => t.id !== transcriptId),
      }));
    } catch (error) {
      console.error("Error deleting transcript:", error);
      throw error;
    }
  },
}));
