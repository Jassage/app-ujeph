// CORRECTION dans api.ts - Version simplifiée
import { getAuthState } from "@/store/authStore";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // ✅ Ajouter un timeout
});

// Intercepteur de requête SIMPLIFIÉ
api.interceptors.request.use(
  (config) => {
    // ✅ CORRECTION: Utiliser une seule source de vérité
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(
      `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse UNIQUE
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const { config, response } = error;

    if (!response) {
      console.error("❌ Network error:", error.message);
      return Promise.reject(new Error("Erreur de connexion au serveur"));
    }

    const { status } = response;
    const url = config?.url;

    console.log(`❌ API Error: ${status} ${url}`);

    if (status === 401) {
      // ✅ CORRECTION: Liste étendue des endpoints où 401 est normale
      const allowed401Endpoints = [
        "/auth/login",
        "/auth/verify-password",
        "/auth/register",
      ];

      const shouldIgnore401 = allowed401Endpoints.some((endpoint) =>
        url?.includes(endpoint)
      );

      if (shouldIgnore401) {
        console.log("🔄 Erreur 401 normale (login/register)");
        return Promise.reject(error);
      }

      // Pour les vraies erreurs d'authentification
      console.log("🔐 Session expirée, déconnexion...");

      // ✅ CORRECTION: Nettoyage sécurisé
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      if (api?.defaults?.headers) {
        delete api.defaults.headers.common["Authorization"];
      }

      getAuthState().logout("Session expirée");

      // Redirection vers login si pas déjà sur la page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
