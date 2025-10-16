import { create } from "zustand";
import api from "../services/api";
import { User } from "../types/academic";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  register: (
    userData: Omit<User, "id" | "createdAt"> & { password: string }
  ) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  fetchPotentialDeans: () => Promise<User[]>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token, isAuthenticated: !!token });
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/register", userData);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      set({ user, token, isAuthenticated: true, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur d'inscription",
        loading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  getCurrentUser: async () => {
    set({ loading: true });
    try {
      const response = await api.get("/users/me");
      set({ user: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de chargement",
        loading: false,
      });
      // Si le token est invalide, déconnecter
      if (error.response?.status === 401) {
        get().logout();
      }
    }
  },

  updateProfile: async (userData) => {
    set({ loading: true });
    try {
      const response = await api.put(`/users/${get().user?.id}`, userData);
      set({ user: response.data.user, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de modification",
        loading: false,
      });
      throw error;
    }
  },

  fetchPotentialDeans: async () => {
    try {
      const response = await api.get("/users/potential/deans");
      return response.data;
    } catch (error: any) {
      console.error("Erreur récupération doyens:", error);
      throw error;
    }
  },
}));

// Store pour l'administration des utilisateurs
interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<User>;
  createUser: (
    userData: Omit<User, "id" | "createdAt"> & { password: string }
  ) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserManagementState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/users");
      set({ users: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de chargement",
        loading: false,
      });
      throw error;
    }
  },
  fetchPotentialDeans: async () => {
    try {
      const response = await api.get("/users/potential/deans");
      return response.data;
    } catch (error: any) {
      console.error("Erreur récupération doyens:", error);
      throw error;
    }
  },
  fetchUserById: async (id: string) => {
    set({ loading: true });
    try {
      const response = await api.get(`/users/${id}`);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de chargement",
        loading: false,
      });
      throw error;
    }
  },

  createUser: async (userData) => {
    const payload = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: userData.status,
      password: userData.password,
    };
    set({ loading: true });
    try {
      const response = await api.post("/auth/register", userData);
      set((state) => ({
        users: [...state.users, response.data.user],
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de création",
        loading: false,
      });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    set({ loading: true });
    try {
      const response = await api.put(`/users/${id}`, userData);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? response.data.user : user
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de modification",
        loading: false,
      });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/users/${id}`);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de suppression",
        loading: false,
      });
      throw error;
    }
  },

  changePassword: async (id, newPassword) => {
    set({ loading: true });
    try {
      await api.patch(`/users/${id}/password`, { newPassword });
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de modification",
        loading: false,
      });
      throw error;
    }
  },

  resetPassword: async (email) => {
    set({ loading: true });
    try {
      await api.post(`/auth/reset-password`, { email });
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erreur de modification",
        loading: false,
      });
      throw error;
    }
  },
}));
