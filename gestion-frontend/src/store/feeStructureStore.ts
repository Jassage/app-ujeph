import { create } from "zustand";
import api from "../services/api";
import { FeeStructure, StudentFee } from "../types/academic";

interface FeeStructureStore {
  // State
  feeStructures: FeeStructure[];
  studentFees: StudentFee[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;

  // Actions pour les structures de frais
  createFeeStructure: (
    feeData: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  getFeeStructures: (
    academicYear?: string,
    program?: string
  ) => Promise<FeeStructure[]>;
  getFeeStructure: (id: string) => Promise<FeeStructure | null>;
  updateFeeStructure: (
    id: string,
    feeData: Partial<FeeStructure>
  ) => Promise<void>;
  deleteFeeStructure: (id: string) => Promise<void>;

  // Actions pour les frais étudiants
  assignFeeToStudent: (
    studentId: string,
    academicYear: string,
    feeStructureId: string
  ) => Promise<void>;
  getStudentFees: (studentId: string) => Promise<StudentFee[]>;
  getStudentFeeByYear: (
    studentId: string,
    academicYear: string
  ) => Promise<StudentFee | null>;
  updateStudentFee: (id: string, feeData: Partial<StudentFee>) => Promise<void>;
  recordPayment: (studentFeeId: string, paymentData: any) => Promise<void>;
  getPaymentHistory: (studentFeeId: string) => Promise<any[]>;
  deleteStudenFeePayment: (id: string) => Promise<void>;
  getAllStudentFees: () => Promise<void>;
}

export const useFeeStructureStore = create<FeeStructureStore>((set, get) => ({
  feeStructures: [],
  studentFees: [],
  loading: false,
  error: null,
  lastUpdated: Date.now(),

  // Créer une structure de frais
  createFeeStructure: async (feeData) => {
    set({ loading: true, error: null });
    try {
      console.log("Données envoyées au serveur:", feeData);

      // ENVOYER LES DONNÉES DIRECTEMENT, SANS OBJET "payload"
      const response = await api.post("/fee-structures", feeData);

      if (response.data) {
        set((state) => ({
          feeStructures: [...state.feeStructures, response.data],
          loading: false,
        }));
      } else {
        throw new Error(response.data?.error || "Erreur lors de la création");
      }
    } catch (err) {
      console.error("Erreur createFeeStructure:", err);
      set({
        error: "Erreur lors de la création de la structure de frais",
        loading: false,
      });
      throw err;
    }
  },

  // Récupérer les structures de frais
  getFeeStructures: async (academicYear?: string, program?: string) => {
    set({ loading: true, error: null });
    try {
      let url = "/fee-structures";
      const params = new URLSearchParams();

      if (academicYear) params.append("academicYear", academicYear);
      if (program) params.append("program", program);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      console.log("✅ Réponse API fee structures:", response.data);

      // Gestion des différents formats de réponse

      if (response.data) {
        set({
          feeStructures: response.data,
          loading: false,
          lastUpdated: Date.now(),
        });
        return response.data;
      } else {
        throw new Error(
          response.data.error || "Erreur lors de la récupération"
        );
      }
    } catch (err) {
      set({
        error: "Erreur lors de la récupération des structures de frais",
        loading: false,
      });
      return [];
    }
  },

  // Récupérer une structure de frais spécifique
  getFeeStructure: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/fee-structures`);

      if (response.data) {
        set({ loading: false });
        return response.data;
      } else {
        throw new Error(
          response.data.error || "Structure de frais non trouvée"
        );
      }
    } catch (err) {
      set({
        error: "Erreur lors de la récupération de la structure de frais",
        loading: false,
      });
      return null;
    }
  },

  // Mettre à jour une structure de frais
  updateFeeStructure: async (id: string, feeData: Partial<FeeStructure>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/fee-structures/${id}`, feeData);

      if (response.data) {
        set((state) => ({
          feeStructures: state.feeStructures.map((fee) =>
            fee.id === id ? response.data.data : fee
          ),
          loading: false,
        }));
      } else {
        throw new Error(response.data.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      set({
        error: "Erreur lors de la mise à jour de la structure de frais",
        loading: false,
      });
      throw err;
    }
  },

  // Supprimer une structure de frais
  deleteFeeStructure: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/fee-structures/${id}`);

      if (response.data) {
        set((state) => ({
          feeStructures: state.feeStructures.filter((fee) => fee.id !== id),
          loading: false,
        }));
      } else {
        throw new Error(response.data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      set({
        error: "Erreur lors de la suppression de la structure de frais",
        loading: false,
      });
      throw err;
    }
  },

  deleteStudenFeePayment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`//student-fees/${id}`);

      if (response.data) {
        set((state) => ({
          studentFees: state.studentFees.filter((fee) => fee.id !== id),
          loading: false,
        }));
      } else {
        throw new Error(response.data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      set({
        error: "Erreur lors de la suppression de la structure de frais",
        loading: false,
      });
      throw err;
    }
  },

  // Assigner des frais à un étudiant
  assignFeeToStudent: async (
    studentId: string,
    academicYear: string,
    feeStructureId: string
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/student-fees/assign", {
        studentId,
        academicYear,
        feeStructureId,
      });

      if (response.data) {
        set((state) => ({
          studentFees: [...state.studentFees, response.data],
          loading: false,
        }));
      } else {
        throw new Error(response.data.error || "Erreur lors de l'assignation");
      }
    } catch (err) {
      set({
        error: "Erreur lors de l'assignation des frais",
        loading: false,
      });
      throw err;
    }
  },
  getAllStudentFees: async () => {
    set({ loading: true, error: null });
    try {
      // ✅ Utilisation correcte des query parameters
      const response = await api.get(`/student-fees`);

      if (response.data) {
        set({
          studentFees: response.data, // ✅ Direct response.data sans .success
          loading: false,
        });
        return response.data;
      } else {
        throw new Error("Erreur lors de la récupération");
      }
    } catch (err) {
      set({
        error: "Erreur lors de la récupération des frais étudiants",
        loading: false,
      });
      return [];
    }
  },

  // Récupérer les frais d'un étudiant
  getStudentFees: async (studentId: string) => {
    set({ loading: true, error: null });
    try {
      // ✅ Utilisation correcte des query parameters
      const response = await api.get(`/student-fees?studentId=${studentId}`);

      if (response.data) {
        set({
          studentFees: response.data, // ✅ Direct response.data sans .success
          loading: false,
        });
        return response.data;
      } else {
        throw new Error("Erreur lors de la récupération");
      }
    } catch (err) {
      set({
        error: "Erreur lors de la récupération des frais étudiants",
        loading: false,
      });
      return [];
    }
  },

  // Récupérer les frais d'un étudiant pour une année spécifique
  getStudentFeeByYear: async (studentId: string, academicYear: string) => {
    try {
      // ✅ Utilisation des query parameters
      const response = await api.get(
        `/student-fees?studentId=${studentId}&academicYear=${academicYear}`
      );

      // ✅ Votre backend retourne un tableau, on prend le premier élément
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (err) {
      console.error("Error getting student fee by year:", err);
      return null;
    }
  },
  // Mettre à jour les frais d'un étudiant
  updateStudentFee: async (id: string, feeData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/student-fees/${id}`, feeData);

      if (response.data.success) {
        set((state) => ({
          studentFees: state.studentFees.map((fee) =>
            fee.id === id ? response.data.data : fee
          ),
          loading: false,
        }));
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      set({
        error: "Erreur lors de la mise à jour des frais étudiants",
        loading: false,
      });
      throw err;
    }
  },

  getFeeStructuresByFilters: async (filters: {
    faculty?: string;
    level?: string;
    academicYear?: string;
  }) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.faculty) params.append("faculty", filters.faculty);
      if (filters.level) params.append("level", filters.level);
      if (filters.academicYear)
        params.append("academicYear", filters.academicYear);

      const response = await api.get(`/fee-structures?${params.toString()}`);

      set({ loading: false });
      return response.data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return [];
    }
  },

  // Dans votre feeStructureStore.ts
  recordPayment: async (studentFeeId: string, paymentData: any) => {
    set({ loading: true, error: null });
    try {
      // ✅ URL corrigée
      const response = await api.post("/fee-payments", {
        studentFeeId,
        ...paymentData,
      });

      if (response.data) {
        // Mettre à jour les frais étudiants dans le store
        set((state) => ({
          studentFees: state.studentFees.map((fee) =>
            fee.id === studentFeeId ? response.data.studentFee : fee
          ),
          loading: false,
        }));
        return response.data;
      } else {
        throw new Error(
          response.data?.error || "Erreur lors de l'enregistrement"
        );
      }
    } catch (err: any) {
      console.error("Erreur recordPayment:", err.response?.data || err.message);
      set({
        error: "Erreur lors de l'enregistrement du paiement",
        loading: false,
      });
      throw err;
    }
  },

  getPaymentHistory: async (studentFeeId: string) => {
    try {
      // ✅ URL corrigée
      const response = await api.get(`/fee-payments/${studentFeeId}/history`);

      if (response.data) {
        return response.data;
      }
      return [];
    } catch (err: any) {
      console.error(
        "Erreur getPaymentHistory:",
        err.response?.data || err.message
      );
      throw err;
    }
  },
}));
