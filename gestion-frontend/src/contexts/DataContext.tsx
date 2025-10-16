// src/contexts/DataContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

interface DataContextType {
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  const refreshData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Ici vous pouvez charger des données globales si nécessaire
      // Par exemple, des statistiques, des configurations, etc.

      await new Promise((resolve) => setTimeout(resolve, 500)); // Simuler un chargement
    } catch (err: any) {
      console.error("Erreur chargement données:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [isAuthenticated]);

  return (
    <DataContext.Provider value={{ isLoading, error, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};
