import { create } from "zustand";
import api from "../services/api";
import { Payment } from "../types/academic";

type PaymentStore = {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  fetchPayments: () => Promise<void>;
  addPayment: (payment: Omit<Payment, "id">) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  updatePaymentStatus: (
    id: string,
    status: "Payé" | "En attente" | "Retard" | "Annulé"
  ) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getPaymentsByStudent: (studentId: string) => Payment[];
  getPaymentsByType: (
    type: "Inscription" | "Scolarité" | "Examen" | "Certificat" | "Autre"
  ) => Payment[];
  getPaymentsByStatus: (
    status: "Payé" | "En attente" | "Retard" | "Annulé"
  ) => Payment[];
  getPaymentsByAcademicYear: (academicYear: string) => Payment[];
  getTotalAmount: (filter?: {
    studentId?: string;
    type?: Payment["type"];
    status?: Payment["status"];
    academicYear?: string;
  }) => number;
  getPaidAmount: (filter?: {
    studentId?: string;
    type?: Payment["type"];
    academicYear?: string;
  }) => number;
};

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],
  loading: false,
  error: null,

  // Récupère tous les paiements
  fetchPayments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/payments");
      set({
        payments: response.data,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      set({
        error: "Erreur lors du chargement des paiements",
        loading: false,
      });
    }
  },

  // Ajoute un nouveau paiement
  addPayment: async (payment) => {
    set({ loading: true });
    try {
      const payload = {
        studentId: payment.studentId,
        amount: payment.amount,
        type: payment.type,
        status: payment.status || "En attente",
        moyen: payment.moyen,
        paidDate: payment.paidDate
          ? new Date(payment.paidDate).toISOString()
          : null,
        description: payment.description,
        academicYearId: payment.academicYearId,
      };

      await api.post("/payments", payload);
      await get().fetchPayments(); // Recharge les données
    } catch (err) {
      console.error("Failed to add payment:", err);
      set({ error: "Erreur lors de l'ajout du paiement" });
    } finally {
      set({ loading: false });
    }
  },

  // Met à jour un paiement
  updatePayment: async (id, payment) => {
    set({ loading: true });
    try {
      const cleanData = {
        studentId: payment.studentId,
        amount: payment.amount,
        type: payment.type,
        status: payment.status || "En attente",
        moyen: payment.moyen,
        paidDate: payment.paidDate
          ? new Date(payment.paidDate).toISOString()
          : null,
        description: payment.description,
        academicYearId: payment.academicYearId,
      };

      // console.log("Updating payment with data:", cleanData);

      await api.put(`/payments/${id}`, cleanData);
      await get().fetchPayments();
    } catch (err) {
      console.error("Failed to update payment:", err);
      set({ error: "Erreur lors de la mise à jour du paiement" });
    } finally {
      set({ loading: false });
    }
  },

  // Met à jour uniquement le statut
  updatePaymentStatus: async (id, status) => {
    set({ loading: true });
    try {
      await api.patch(`/payments/${id}/status`, { status });
      await get().fetchPayments();
    } catch (err) {
      console.error("Failed to update payment status:", err);
      set({ error: "Erreur lors du changement de statut" });
    } finally {
      set({ loading: false });
    }
  },

  // Supprime un paiement
  deletePayment: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/payments/${id}`);
      await get().fetchPayments();
    } catch (err) {
      console.error("Failed to delete payment:", err);
      set({ error: "Erreur lors de la suppression du paiement" });
    } finally {
      set({ loading: false });
    }
  },

  // Méthodes utilitaires
  getPaymentsByStudent: (studentId) => {
    return get().payments.filter((p) => p.studentId === studentId);
  },

  getPaymentsByType: (type) => {
    return get().payments.filter((p) => p.type === type);
  },

  getPaymentsByStatus: (status) => {
    return get().payments.filter((p) => p.status === status);
  },

  getPaymentsByAcademicYear: (academicYear) => {
    return get().payments.filter((p) => p.academicYear === academicYear);
  },

  // Calcule le montant total selon des filtres optionnels
  getTotalAmount: (filter = {}) => {
    const { studentId, type, status, academicYear } = filter;
    return get()
      .payments.filter((p) => {
        return (
          (!studentId || p.studentId === studentId) &&
          (!type || p.type === type) &&
          (!status || p.status === status) &&
          (!academicYear || p.academicYear === academicYear)
        );
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
  },

  // Calcule le montant payé (seulement les paiements avec statut "Payé")
  getPaidAmount: (filter = {}) => {
    const { studentId, type, academicYear } = filter;
    return get()
      .payments.filter((p) => {
        return (
          p.status === "Payé" &&
          (!studentId || p.studentId === studentId) &&
          (!type || p.type === type) &&
          (!academicYear || p.academicYear === academicYear)
        );
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
  },
  fetchPaymentsByStudent: async (studentId: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/payments?studentId=${studentId}`);
      set({ payments: response.data });
    } catch (err) {
      set({ error: "Erreur lors du chargement des paiements" });
    } finally {
      set({ loading: false });
    }
  },
}));
