// src/components/AppInitializer.tsx
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer = ({ children }: AppInitializerProps) => {
  const { getCurrentUser, isAuthenticated } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem("token");

      // Only check if we have a token but aren't authenticated yet
      if (token && !isAuthenticated) {
        try {
          await getCurrentUser();
        } catch (error) {
          console.error("Erreur initialisation app:", error);
        }
      }

      setIsInitialized(true);
    };

    initializeApp();
  }, []); // Empty dependency array - run only once on mount

  if (!isInitialized && localStorage.getItem("token")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
