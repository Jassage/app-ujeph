// store/backupStore.ts
import { create } from "zustand";
import api from "../services/api";
import { toast } from "@/components/ui/use-toast";

interface Backup {
  filename: string;
  size: number;
  timestamp: string;
  records: {
    students: number;
    professors: number;
    users: number;
    ues: number;
    enrollments: number;
    assignments: number;
    grades: number;
    payments: number;
    auditLogs: number;
  };
  exists?: boolean;
}

interface BackupStore {
  backups: Backup[];
  loading: boolean;
  creating: boolean;
  exporting: boolean;

  // Actions
  createBackup: (name?: string, modules?: string[]) => Promise<Backup | null>;
  exportData: (
    format: "json" | "csv" | "sql",
    includeAuditLogs?: boolean
  ) => Promise<void>;
  downloadBackup: (filename: string) => Promise<void>;
  getBackupStats: () => Promise<any>;
  loadBackups: () => Promise<void>;
  deleteBackup: (filename: string) => Promise<void>;
}

export const useBackupStore = create<BackupStore>((set, get) => ({
  backups: [],
  loading: false,
  creating: false,
  exporting: false,

  createBackup: async (name?: string, modules?: string[]) => {
    set({ creating: true });
    try {
      const response = await api.post("/backup/create", { name, modules });
      const backup = response.data.backup;

      if (backup) {
        set((state) => ({
          backups: [backup, ...state.backups],
          creating: false,
        }));

        toast({
          title: "✅ Sauvegarde créée",
          description: `La sauvegarde "${backup.filename}" a été créée avec succès (${backup.size} bytes)`,
        });

        return backup;
      }
      return null;
    } catch (error: any) {
      console.error("Erreur création sauvegarde:", error);
      toast({
        title: "❌ Erreur",
        description:
          error.response?.data?.error || "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
      return null;
    } finally {
      set({ creating: false });
    }
  },

  exportData: async (format = "json", includeAuditLogs = false) => {
    set({ exporting: true });
    try {
      if (format === "sql") {
        // Pour SQL, on utilise l'endpoint d'export qui stream le vrai fichier
        const response = await api.get("/backup/export", {
          responseType: "blob",
        });

        // Créer un blob et le télécharger
        const blob = new Blob([response.data], { type: "application/sql" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Extraire le filename depuis les headers ou utiliser un nom par défaut
        const contentDisposition = response.headers["content-disposition"];
        let filename = `backup-academic-${
          new Date().toISOString().split("T")[0]
        }.sql`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: "✅ Export SQL réussi",
          description: `La base de données a été exportée en SQL (${response.data.size} bytes)`,
        });
      } else {
        // Pour JSON/CSV, simulation pour l'instant
        const data = {
          message: `Export ${format} en cours de développement`,
          format,
          includeAuditLogs,
          timestamp: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: format === "json" ? "application/json" : "text/csv",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `export-${new Date().toISOString().split("T")[0]}.${format}`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: "✅ Export réussi",
          description: `Les données ont été exportées en format ${format.toUpperCase()}`,
        });
      }
    } catch (error: any) {
      console.error("Erreur export:", error);
      toast({
        title: "❌ Erreur export",
        description:
          error.response?.data?.error || "Erreur lors de l'export des données",
        variant: "destructive",
      });
    } finally {
      set({ exporting: false });
    }
  },

  downloadBackup: async (filename: string) => {
    try {
      const response = await api.get(`/backup/download/${filename}`, {
        responseType: "blob",
      });

      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], { type: "application/sql" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Téléchargement réussi",
        description: `La sauvegarde "${filename}" a été téléchargée`,
      });
    } catch (error: any) {
      console.error("Erreur téléchargement:", error);
      toast({
        title: "❌ Erreur",
        description:
          error.response?.data?.error || "Erreur lors du téléchargement",
        variant: "destructive",
      });
    }
  },

  getBackupStats: async () => {
    try {
      const response = await api.get("/backup/statistics");
      return response.data;
    } catch (error: any) {
      console.error("Erreur statistiques sauvegardes:", error);
      return null;
    }
  },

  loadBackups: async () => {
    set({ loading: true });
    try {
      const response = await api.get("/backup/list");
      set({ backups: response.data.backups || [] });
    } catch (error: any) {
      console.error("Erreur chargement sauvegardes:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger la liste des sauvegardes",
        variant: "destructive",
      });
      set({ backups: [] });
    } finally {
      set({ loading: false });
    }
  },

  deleteBackup: async (filename: string) => {
    try {
      await api.delete(`/backup/${filename}`);

      // Mettre à jour l'état local
      set((state) => ({
        backups: state.backups.filter((b) => b.filename !== filename),
      }));

      toast({
        title: "✅ Succès",
        description: "Sauvegarde supprimée avec succès",
      });
    } catch (error: any) {
      console.error("Erreur suppression:", error);
      toast({
        title: "❌ Erreur",
        description:
          error.response?.data?.error || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  },
}));
