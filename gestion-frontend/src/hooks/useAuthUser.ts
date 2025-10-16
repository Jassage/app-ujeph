// src/hooks/useAuthUser.ts
import { useAuthStore } from "@/store/authStore";

export const useAuthUser = () => {
  const { user, isAuthenticated, loading } = useAuthStore();

  return {
    user,
    isAuthenticated,
    loading,
    isAdmin: user?.role === "Admin",
    isDoyen: user?.role === "Doyen",
    isProfesseur: user?.role === "Professeur",
    isSecretaire: user?.role === "Secrétaire",
    isDirecteur: user?.role === "Directeur",
  };
};
