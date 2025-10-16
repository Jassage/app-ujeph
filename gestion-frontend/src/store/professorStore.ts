// store/professorStore.ts - CORRECTION DE L'INTERFACE
import { create } from "zustand";
import api from "../services/api";
import {
  Professeur,
  ProfessorAssignment,
  CreateProfessorData,
  UpdateProfessorData,
  ProfessorImportResult,
} from "../types/academic";
import { toast } from "sonner";

interface ProfessorStore {
  professors: Professeur[];
  assignments: ProfessorAssignment[];
  loading: boolean;
  error: string | null;

  // CORRECTION: Types cohérents avec l'implémentation
  fetchProfessors: () => Promise<void>;
  fetchProfessorAssignments: (professorId: string) => Promise<void>;
  addProfessor: (professor: CreateProfessorData) => Promise<Professeur>; // ← Retourne Professeur
  updateProfessor: (
    id: string,
    professor: UpdateProfessorData
  ) => Promise<Professeur>; // ← Retourne Professeur
  deleteProfessor: (id: string) => Promise<void>;
  bulkUpdateStatus: (
    ids: string[],
    status: "Actif" | "Inactif"
  ) => Promise<void>;
  bulkImportProfessors: (
    professors: CreateProfessorData[]
  ) => Promise<ProfessorImportResult>;

  // Utilitaires
  clearError: () => void;
}

// store/professorStore.ts - CORRECTION de validateProfessorsData
const validateProfessorsData = (data: any): Professeur[] => {
  console.log("🛠️ Validation des données:", data);

  if (!data) {
    console.warn("❌ Données null ou undefined");
    return [];
  }

  // Si c'est un objet avec une propriété data
  if (data.data && Array.isArray(data.data)) {
    data = data.data;
  }

  // Si c'est un objet avec une propriété professeurs
  if (data.professeurs && Array.isArray(data.professeurs)) {
    data = data.professeurs;
  }

  if (!Array.isArray(data)) {
    console.warn("❌ Données n'est pas un tableau:", typeof data, data);
    return [];
  }

  const validProfessors = data.filter((prof: any) => {
    if (!prof || typeof prof !== "object") {
      console.warn("❌ Professeur invalide:", prof);
      return false;
    }

    // Validation plus flexible selon votre schéma Prisma
    const isValid =
      prof.id &&
      typeof prof.id === "string" &&
      typeof prof.firstName === "string" &&
      typeof prof.lastName === "string" &&
      typeof prof.email === "string";

    if (!isValid) {
      console.warn("❌ Structure professeur invalide:", prof);
    }

    return isValid;
  });

  console.log(
    `📊 ${validProfessors.length} professeurs valides sur ${data.length}`
  );
  return validProfessors;
};
// Fonction utilitaire pour créer un Professeur valide
const createValidProfessor = (apiData: any, defaults: any): Professeur => {
  // Extraire les données du professeur selon différents formats
  const professorData = apiData.professor || apiData.data || apiData;

  // CORRECTION: S'assurer que tous les champs requis sont présents
  return {
    id: professorData.id || `temp-${Date.now()}`,
    firstName: professorData.firstName || defaults.firstName,
    lastName: professorData.lastName || defaults.lastName,
    email: professorData.email || defaults.email,
    phone: professorData.phone || defaults.phone,
    speciality: professorData.speciality || defaults.speciality,
    status: professorData.status || defaults.status, // Garanti d'avoir une valeur
    createdAt: professorData.createdAt || new Date().toISOString(),
    updatedAt: professorData.updatedAt,
  };
};

export const useProfessorStore = create<ProfessorStore>((set, get) => ({
  professors: [],
  assignments: [],
  loading: false,
  error: null,

  fetchProfessors: async () => {
    set({ loading: true, error: null });

    try {
      console.log("🔄 Début du chargement des professeurs...");

      const response = await api.get("/professeurs");
      console.log("📡 Réponse API professors:", response);

      let professorsData: Professeur[] = [];

      // CORRECTION: Vérifier la structure de réponse de votre API
      if (response && response.data) {
        // Votre API retourne { success: true, data: [...], count: ... }
        if (response.data.success && Array.isArray(response.data.data)) {
          professorsData = validateProfessorsData(response.data.data);
        }
        // Si l'API retourne directement un tableau
        else if (Array.isArray(response.data)) {
          professorsData = validateProfessorsData(response.data);
        }
        // Structure alternative
        else if (response.data.professeurs) {
          professorsData = validateProfessorsData(response.data.professeurs);
        }

        console.log(`✅ ${professorsData.length} professeurs validés`);
      } else {
        console.warn("⚠️ Réponse API invalide:", response);
        professorsData = [];
      }

      set({
        professors: professorsData,
        loading: false,
      });

      console.log("✅ Chargement des professeurs terminé");
    } catch (err: any) {
      console.error("❌ Erreur fetchProfessors:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Erreur lors du chargement des professeurs";

      set({
        professors: [],
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw err;
    }
  },

  fetchProfessorAssignments: async (professorId: string) => {
    set({ loading: true, error: null });

    try {
      const response = await api.get(`/professeurs/${professorId}/assignments`);

      const assignmentsData = Array.isArray(response?.data)
        ? response.data
        : [];

      set({
        assignments: assignmentsData,
        loading: false,
      });
    } catch (err: any) {
      console.error("Erreur fetchProfessorAssignments:", err);

      set({
        assignments: [],
        error:
          err.response?.data?.error ||
          "Erreur lors du chargement des affectations",
        loading: false,
      });

      throw err;
    }
  },
  // store/professorStore.ts - VERSION SIMPLIFIÉE ET ROBUSTE
  addProfessor: async (
    professorData: CreateProfessorData
  ): Promise<Professeur> => {
    set({ loading: true, error: null });

    try {
      console.log("🔄 Tentative d'ajout du professeur:", professorData);

      // CORRECTION: Préparation des données avec valeurs par défaut
      const professorWithDefaults = {
        status: "Actif" as const,
        phone: "",
        speciality: "",
        ...professorData,
      };

      const response = await api.post("/professeurs", professorWithDefaults);
      console.log("📡 Réponse API addProfessor:", response);

      let newProfessor: Professeur;

      if (response?.data) {
        // CORRECTION: Fonction utilitaire pour créer un Professeur valide
        newProfessor = createValidProfessor(
          response.data,
          professorWithDefaults
        );
      } else {
        // Fallback: création locale
        newProfessor = {
          id: `temp-${Date.now()}`,
          ...professorWithDefaults,
          createdAt: new Date().toISOString(),
        };
      }

      set((state) => ({
        professors: [...state.professors, newProfessor],
        loading: false,
      }));

      toast.success("Professeur ajouté avec succès");
      return newProfessor;
    } catch (err: any) {
      console.error("❌ Erreur addProfessor:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de l'ajout du professeur";

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // CORRECTION: updateProfessor doit aussi retourner Professeur
  updateProfessor: async (
    id: string,
    professorData: UpdateProfessorData
  ): Promise<Professeur> => {
    set({ loading: true, error: null });

    try {
      const response = await api.put(`/professeurs/${id}`, professorData);

      let updatedProfessor: Professeur;

      if (response?.data) {
        updatedProfessor = createValidProfessor(response.data, professorData);
      } else {
        // Fallback: trouver le professeur et le mettre à jour localement
        const existingProfessor = get().professors.find((p) => p.id === id);
        if (!existingProfessor) {
          throw new Error("Professeur non trouvé");
        }
        // CORRECTION: Garder le status existant si non fourni
        updatedProfessor = {
          ...existingProfessor,
          ...professorData,
          status: professorData.status || existingProfessor.status, // Garde l'ancien status si non fourni
        };
      }

      set((state) => ({
        professors: state.professors.map((prof) =>
          prof.id === id ? updatedProfessor : prof
        ),
        loading: false,
      }));

      toast.success("Professeur modifié avec succès");
      return updatedProfessor;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erreur lors de la modification du professeur";

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  deleteProfessor: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await api.delete(`/professeurs/${id}`);

      set((state) => ({
        professors: state.professors.filter((prof) => prof.id !== id),
        loading: false,
      }));

      toast.success("Professeur supprimé avec succès");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erreur lors de la suppression du professeur";

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  bulkUpdateStatus: async (ids: string[], status: "Actif" | "Inactif") => {
    set({ loading: true, error: null });

    try {
      const response = await api.patch("/professeurs/bulk-status", {
        ids,
        status,
      });

      set((state) => ({
        professors: state.professors.map((prof) =>
          ids.includes(prof.id) ? { ...prof, status } : prof
        ),
        loading: false,
      }));

      toast.success(`Statut de ${ids.length} professeur(s) modifié(s)`);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erreur lors de la modification en masse";

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  bulkImportProfessors: async (professorsData: CreateProfessorData[]) => {
    set({ loading: true, error: null });

    try {
      const response = await api.post("/professeurs/bulk-import", {
        professors: professorsData,
      });

      const result: ProfessorImportResult = response?.data || {
        success: 0,
        errors: [],
      };

      if (result.success > 0) {
        await get().fetchProfessors();
      }

      set({ loading: false });
      return result;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || "Erreur lors de l'import";

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),
}));
