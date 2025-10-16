// src/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../services/api";
import { User } from "../types/academic";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  lastActivity: number;
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
  updateActivity: () => void;
  initialize: () => Promise<void>;
  fetchPotentialDeans: () => Promise<any[]>;
}

// Timeout d'inactivité (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Monitoring d'activité
let activityMonitor: NodeJS.Timeout;

const startActivityMonitoring = (logout: (reason: string) => void) => {
  stopActivityMonitoring();

  activityMonitor = setInterval(() => {
    const state = useAuthStore.getState();
    if (
      state.isAuthenticated &&
      Date.now() - state.lastActivity > INACTIVITY_TIMEOUT
    ) {
      logout("Inactivité prolongée");
    }
  }, 60000); // Vérifier toutes les minutes
};

const stopActivityMonitoring = () => {
  if (activityMonitor) {
    clearInterval(activityMonitor);
  }
};

// Gestionnaire d'événements pour l'activité utilisateur
const setupActivityListeners = () => {
  const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];

  const updateActivity = () => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      state.updateActivity();
    }
  };

  events.forEach((event) => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  return () => {
    events.forEach((event) => {
      document.removeEventListener(event, updateActivity);
    });
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: false,
      lastActivity: Date.now(),

      // MÉTHODE D'INITIALISATION - CORRIGÉE
      initialize: async () => {
        const { token, initialized } = get();

        // Si déjà initialisé, ne rien faire
        if (initialized) {
          console.log("✅ Authentification déjà initialisée");
          return;
        }

        console.log("🔄 Initialisation de l'authentification...");

        if (!token) {
          console.log("❌ Aucun token trouvé dans le store");
          set({
            initialized: true,
            isAuthenticated: false,
            loading: false,
          });
          return;
        }

        try {
          set({ loading: true });
          console.log("🔍 Vérification du token avec le serveur...");

          // Configurer le header d'autorisation
          if (api?.defaults?.headers) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          }

          // Vérifier le token côté serveur
          const response = await api.get("/auth/me");
          console.log(
            "✅ Utilisateur récupéré depuis le serveur:",
            response.data
          );

          set({
            user: response.data,
            isAuthenticated: true,
            loading: false,
            error: null,
            initialized: true,
            lastActivity: Date.now(),
          });

          // Démarrer le monitoring d'activité
          startActivityMonitoring(get().logout);
          setupActivityListeners();

          console.log("✅ Authentification initialisée avec succès");
        } catch (error: any) {
          console.error("❌ Erreur lors de l'initialisation:", error);

          // Nettoyer les données invalides
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");

          if (api?.defaults?.headers) {
            delete api.defaults.headers.common["Authorization"];
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: "Session expirée",
            initialized: true,
          });

          toast.error("Votre session a expiré. Veuillez vous reconnecter.");
        }
      },

      // MÉTHODE DE CONNEXION - CORRIGÉE
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });

        try {
          if (!email || !password) {
            throw new Error("Email et mot de passe requis");
          }

          console.log("🔄 Tentative de connexion avec:", email);

          const response = await api.post("/auth/login", {
            email: email.trim(),
            password,
          });

          const { token, user, expiresIn } = response.data;

          console.log("✅ Réponse API reçue:", {
            token: token ? "✓ Présent" : "✗ Absent",
            user: user ? "✓ Présent" : "✗ Absent",
            expiresIn,
          });

          if (!token || !user) {
            throw new Error("Réponse d'authentification invalide");
          }

          // Vérifier si le compte est actif ou verrouillé
          if (user.status && user.status !== "Actif") {
            throw new Error(
              "Votre compte est désactivé. Contactez l'administrateur."
            );
          }

          if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
            const unlockDate = new Date(user.lockUntil).toLocaleString("fr-FR");
            throw new Error(`Compte verrouillé jusqu'au ${unlockDate}`);
          }

          // CORRECTION CRITIQUE : Mettre à jour le store AVANT le stockage
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
            initialized: true, // IMPORTANT : marquer comme initialisé
            lastActivity: Date.now(),
          });

          // Stockage sécurisé
          localStorage.setItem("authToken", token);
          localStorage.setItem("userData", JSON.stringify(user));

          // Configurer les headers API
          if (api?.defaults?.headers) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          }

          // Démarrer le monitoring
          startActivityMonitoring(get().logout);
          setupActivityListeners();

          console.log("✅ Connexion réussie, utilisateur:", user.email);
          toast.success(`Bienvenue ${user.firstName} ${user.lastName} !`);
        } catch (error: any) {
          console.error("❌ Erreur de connexion:", error);

          let errorMessage = "Erreur de connexion au serveur";

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 423) {
            errorMessage = "Compte verrouillé temporairement.";
          } else if (error.response?.status === 401) {
            errorMessage = "Email ou mot de passe incorrect";
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Affichage du nombre de tentatives restantes si disponible
          if (error.response?.data?.remainingAttempts !== undefined) {
            toast.info(
              `Tentatives restantes : ${error.response.data.remainingAttempts}`
            );
          }

          toast.error(errorMessage);

          // Nettoyage en cas d'erreur
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");

          if (api?.defaults?.headers) {
            delete api.defaults.headers.common["Authorization"];
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: errorMessage,
            initialized: true, // IMPORTANT : même en cas d'erreur
          });

          throw error;
        }
      },

      // MÉTHODE DE DÉCONNEXION
      logout: (reason = "Déconnexion utilisateur") => {
        console.log(`🔒 Déconnexion: ${reason}`);

        // Nettoyage sécurisé
        if (api?.defaults?.headers) {
          delete api.defaults.headers.common["Authorization"];
        }

        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
          initialized: true,
        });

        // Arrêter le monitoring
        stopActivityMonitoring();

        toast.info("Vous avez été déconnecté");
      },

      // VÉRIFICATION D'AUTHENTIFICATION
      checkAuth: async () => {
        console.log("🔍 Vérification de l'authentification...");
        await get().initialize();
      },

      // EFFACER LES ERREURS
      clearError: () => set({ error: null }),

      // RAFRAÎCHISSEMENT DU TOKEN
      refreshToken: async (): Promise<boolean> => {
        const { token } = get();

        if (!token) {
          console.log("❌ Aucun token à rafraîchir");
          return false;
        }

        try {
          console.log("🔄 Rafraîchissement du token...");
          const response = await api.post("/auth/refresh", { token });
          const { newToken } = response.data;

          if (api?.defaults?.headers) {
            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          }

          set({
            token: newToken,
            lastActivity: Date.now(),
          });

          localStorage.setItem("authToken", newToken);
          console.log("✅ Token rafraîchi avec succès");
          return true;
        } catch (error) {
          console.error("❌ Erreur lors du rafraîchissement du token:", error);
          get().logout("Impossible de rafraîchir le token");
          return false;
        }
      },

      // MISE À JOUR DE L'ACTIVITÉ
      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      // RÉCUPÉRATION DES DOYENS POTENTIELS
      fetchPotentialDeans: async (): Promise<any[]> => {
        try {
          console.log("🔍 Récupération des doyens potentiels...");
          const response = await api.get("/users/potential-deans");
          console.log("✅ Doyens potentiels récupérés:", response.data.length);
          return response.data;
        } catch (error) {
          console.error("❌ Erreur lors de la récupération des doyens:", error);
          throw new Error("Impossible de charger la liste des doyens");
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        lastActivity: state.lastActivity,
        initialized: state.initialized, // IMPORTANT : persister l'état d'initialisation
      }),
      // NOTE: On ne utilise plus onRehydrateStorage car il causait des problèmes
    }
  )
);

// Export pour utilisation dans les intercepteurs
export const getAuthState = () => useAuthStore.getState();

// Initialisation automatique au chargement de l'application
export const initializeAuthStore = () => {
  console.log("🚀 Initialisation du store d'authentification...");

  // Vérifier si on est dans un environnement browser
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    console.log(
      "📋 Token trouvé dans localStorage:",
      token ? "✓ Oui" : "✗ Non"
    );

    if (token) {
      // Démarrage automatique de l'initialisation
      setTimeout(() => {
        useAuthStore.getState().initialize();
      }, 100);
    } else {
      // Marquer comme initialisé même sans token
      useAuthStore.setState({
        initialized: true,
        isAuthenticated: false,
        loading: false,
      });
    }
  }
};

// Démarrer l'initialisation automatique
if (typeof window !== "undefined") {
  initializeAuthStore();
}
