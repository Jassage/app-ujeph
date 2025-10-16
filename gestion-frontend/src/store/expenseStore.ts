import { create } from "zustand";
import api from "../services/api";
import {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
} from "../types/academic";

type ExpenseStore = {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  fetchExpenseById: (id: string) => Promise<void>;
  addExpense: (expense: CreateExpenseInput) => Promise<void>;
  updateExpense: (id: string, expense: UpdateExpenseInput) => Promise<void>;
  updateExpenseStatus: (
    id: string,
    status: "Pending" | "Approved" | "Rejected",
    approvedBy?: string
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Getters
  getExpensesByCategory: (category: string) => Expense[];
  getExpensesByStatus: (
    status: "Pending" | "Approved" | "Rejected"
  ) => Expense[];
  getExpensesByCreator: (createdBy: string) => Expense[];
  getExpensesByDateRange: (startDate: string, endDate: string) => Expense[];
  getTotalAmount: (filter?: {
    category?: string;
    status?: "Pending" | "Approved" | "Rejected";
    createdBy?: string;
    startDate?: string;
    endDate?: string;
  }) => number;
  getApprovedAmount: (filter?: {
    category?: string;
    createdBy?: string;
    startDate?: string;
    endDate?: string;
  }) => number;
};

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,

  // Récupère toutes les dépenses avec filtres optionnels
  fetchExpenses: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();

      // Ajouter les filtres aux paramètres de requête
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/expenses?${queryParams}`);

      if (response.data.success) {
        set({
          expenses: response.data.data,
          loading: false,
          currentPage: response.data.pagination?.page || 1,
          totalPages: response.data.pagination?.pages || 1,
          totalCount: response.data.pagination?.total || 0,
        });
      } else {
        throw new Error(
          response.data.error || "Erreur lors du chargement des dépenses"
        );
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      set({
        error: "Erreur lors du chargement des dépenses",
        loading: false,
      });
    }
  },

  // Récupère une dépense par son ID
  fetchExpenseById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/expenses/${id}`);

      if (response.data.success) {
        // Met à jour la dépense dans la liste
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? response.data.data : expense
          ),
          loading: false,
        }));
      } else {
        throw new Error(response.data.error || "Dépense non trouvée");
      }
    } catch (err) {
      console.error("Failed to fetch expense:", err);
      set({
        error: "Erreur lors du chargement de la dépense",
        loading: false,
      });
    }
  },

  // Ajoute une nouvelle dépense
  addExpense: async (expenseData: CreateExpenseInput) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description || "",
        date: expenseData.date
          ? new Date(expenseData.date).toISOString()
          : null,
        paymentMethod: expenseData.paymentMethod,
        createdBy: expenseData.createdBy,
        status: expenseData.status || "Pending",
      };

      const response = await api.post("/expenses", payload);

      if (response.data.success) {
        // Ajoute la nouvelle dépense à la liste
        set((state) => ({
          expenses: [response.data.data, ...state.expenses],
          loading: false,
          totalCount: state.totalCount + 1,
        }));
      } else {
        throw new Error(response.data.error || "Erreur lors de la création");
      }
    } catch (err) {
      console.error("Failed to add expense:", err);
      set({
        error: "Erreur lors de l'ajout de la dépense",
        loading: false,
      });
    }
  },

  // Met à jour une dépense existante
  updateExpense: async (id: string, expenseData: UpdateExpenseInput) => {
    set({ loading: true, error: null });
    try {
      const cleanData = {
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description,
        date: expenseData.date
          ? new Date(expenseData.date).toISOString()
          : null,
        paymentMethod: expenseData.paymentMethod,
        status: expenseData.status,
        approvedBy: expenseData.approvedBy,
      };

      const response = await api.put(`/expenses/${id}`, cleanData);

      if (response.data.success) {
        // Met à jour la dépense dans la liste
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? response.data.data : expense
          ),
          loading: false,
        }));
      } else {
        throw new Error(response.data.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Failed to update expense:", err);
      set({
        error: "Erreur lors de la mise à jour de la dépense",
        loading: false,
      });
    }
  },

  // Met à jour uniquement le statut d'une dépense
  updateExpenseStatus: async (
    id: string,
    status: "Pending" | "Approved" | "Rejected",
    approvedBy?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const payload = { status, approvedBy };

      const response = await api.patch(`/expenses/${id}/status`, payload);

      if (response.data.success) {
        // Met à jour le statut dans la liste
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, status, approvedBy } : expense
          ),
          loading: false,
        }));
      } else {
        throw new Error(
          response.data.error || "Erreur lors du changement de statut"
        );
      }
    } catch (err) {
      console.error("Failed to update expense status:", err);
      set({
        error: "Erreur lors du changement de statut",
        loading: false,
      });
    }
  },

  // Supprime une dépense
  deleteExpense: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/expenses/${id}`);

      if (response.data.success) {
        // Supprime la dépense de la liste
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
          loading: false,
          totalCount: state.totalCount - 1,
        }));
      } else {
        throw new Error(response.data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
      set({
        error: "Erreur lors de la suppression de la dépense",
        loading: false,
      });
    }
  },

  // Méthodes utilitaires (getters)
  getExpensesByCategory: (category: string) => {
    return get().expenses.filter((expense) => expense.category === category);
  },

  getExpensesByStatus: (status: "Pending" | "Approved" | "Rejected") => {
    return get().expenses.filter((expense) => expense.status === status);
  },

  getExpensesByCreator: (createdBy: string) => {
    return get().expenses.filter((expense) => expense.createdBy === createdBy);
  },

  getExpensesByDateRange: (startDate: string, endDate: string) => {
    return get().expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return expenseDate >= start && expenseDate <= end;
    });
  },

  // Calcule le montant total selon des filtres optionnels
  getTotalAmount: (filter = {}) => {
    const { category, status, createdBy, startDate, endDate } = filter;

    return get()
      .expenses.filter((expense) => {
        const dateMatch =
          !startDate ||
          !endDate ||
          (new Date(expense.date) >= new Date(startDate) &&
            new Date(expense.date) <= new Date(endDate));

        return (
          (!category || expense.category === category) &&
          (!status || expense.status === status) &&
          (!createdBy || expense.createdBy === createdBy) &&
          dateMatch
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  },

  // Calcule le montant approuvé (seulement les dépenses avec statut "Approved")
  getApprovedAmount: (filter = {}) => {
    const { category, createdBy, startDate, endDate } = filter;

    return get()
      .expenses.filter((expense) => {
        const dateMatch =
          !startDate ||
          !endDate ||
          (new Date(expense.date) >= new Date(startDate) &&
            new Date(expense.date) <= new Date(endDate));

        return (
          expense.status === "Approved" &&
          (!category || expense.category === category) &&
          (!createdBy || expense.createdBy === createdBy) &&
          dateMatch
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  },
}));
