// store/feeStore.ts
import { create } from "zustand";
import { FeeStructure, StudentFee, FeePayment } from "@/types/academic";

interface FeeStore {
  // Structures de frais
  feeStructures: FeeStructure[];
  loading: boolean;

  // Méthodes pour les structures de frais
  getFeeStructures: () => Promise<void>;
  createFeeStructure: (data: Partial<FeeStructure>) => Promise<void>;
  updateFeeStructure: (
    id: string,
    data: Partial<FeeStructure>
  ) => Promise<void>;
  deleteFeeStructure: (id: string) => Promise<void>;

  // Méthodes pour les frais étudiants
  assignFeeToStudent: (
    studentId: string,
    feeStructureId: string
  ) => Promise<void>;
  getStudentFees: (studentId: string) => Promise<StudentFee[]>;
  recordPayment: (
    studentFeeId: string,
    paymentData: Partial<FeePayment>
  ) => Promise<void>;
  getPaymentHistory: (studentFeeId: string) => Promise<FeePayment[]>;
}

export const useFeeStore = create<FeeStore>((set, get) => ({
  feeStructures: [],
  loading: false,

  getFeeStructures: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/fee-structures");
      const data = await response.json();
      set({ feeStructures: data, loading: false });
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      set({ loading: false });
    }
  },

  createFeeStructure: async (data: Partial<FeeStructure>) => {
    try {
      const response = await fetch("/api/fee-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erreur lors de la création");

      // Recharger la liste
      get().getFeeStructures();
    } catch (error) {
      console.error("Error creating fee structure:", error);
      throw error;
    }
  },

  updateFeeStructure: async (id: string, data: Partial<FeeStructure>) => {
    try {
      const response = await fetch(`/api/fee-structures/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erreur lors de la modification");

      // Recharger la liste
      get().getFeeStructures();
    } catch (error) {
      console.error("Error updating fee structure:", error);
      throw error;
    }
  },

  deleteFeeStructure: async (id: string) => {
    try {
      const response = await fetch(`/api/fee-structures/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      // Recharger la liste
      get().getFeeStructures();
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      throw error;
    }
  },

  assignFeeToStudent: async (studentId: string, feeStructureId: string) => {
    try {
      const response = await fetch("/api/student-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, feeStructureId }),
      });

      if (!response.ok)
        throw new Error("Erreur lors de l'attribution des frais");

      return await response.json();
    } catch (error) {
      console.error("Error assigning fee to student:", error);
      throw error;
    }
  },

  getStudentFees: async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/fees`);
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des frais");

      return await response.json();
    } catch (error) {
      console.error("Error getting student fees:", error);
      throw error;
    }
  },

  recordPayment: async (
    studentFeeId: string,
    paymentData: Partial<FeePayment>
  ) => {
    try {
      const response = await fetch("/api/fee-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentFeeId, ...paymentData }),
      });

      if (!response.ok)
        throw new Error("Erreur lors de l'enregistrement du paiement");

      return await response.json();
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  },

  getPaymentHistory: async (studentFeeId: string) => {
    try {
      const response = await fetch(
        `/api/student-fees/${studentFeeId}/payments`
      );
      if (!response.ok)
        throw new Error("Erreur lors de la récupération de l'historique");

      return await response.json();
    } catch (error) {
      console.error("Error getting payment history:", error);
      throw error;
    }
  },
}));
