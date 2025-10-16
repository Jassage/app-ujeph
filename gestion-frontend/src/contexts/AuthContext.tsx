// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useInactivity } from "../hooks/useInactivity";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLocked: boolean;
  unlock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Calculer isAuthenticated basé sur la présence de l'utilisateur
  const isAuthenticated = !!user;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivity");
    setUser(null);
    setIsLocked(false);
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlock = () => {
    setIsLocked(false);
    localStorage.setItem("lastActivity", Date.now().toString());
  };

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const savedActivity = localStorage.getItem("lastActivity");

    if (token && userData) {
      const inactivityTime = savedActivity
        ? Date.now() - parseInt(savedActivity)
        : 0;
      const timeoutMinutes = 30;

      if (inactivityTime > timeoutMinutes * 60 * 1000) {
        lockApp();
      } else {
        setUser(JSON.parse(userData));
        localStorage.setItem("lastActivity", Date.now().toString());
      }
    }
  }, []);

  // Hook d'inactivité - CORRECTION : utiliser la variable isAuthenticated
  useInactivity({
    timeoutMinutes: 30,
    onTimeout: lockApp,
    enabled: isAuthenticated && !isLocked,
  });

  // Mettre à jour le dernier timestamp d'activité
  useEffect(() => {
    const updateActivity = () => {
      if (isAuthenticated) {
        localStorage.setItem("lastActivity", Date.now().toString());
      }
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    if (isAuthenticated && !isLocked) {
      events.forEach((event) => {
        document.addEventListener(event, updateActivity);
      });
    }

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [isAuthenticated, isLocked]);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("lastActivity", Date.now().toString());
    setUser(userData);
    setIsLocked(false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    isLocked,
    unlock,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
