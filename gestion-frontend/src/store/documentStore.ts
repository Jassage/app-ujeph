import { create } from "zustand";
import {
  DocumentType,
  DocumentGenerationOptions,
  GeneratedDocument,
} from "@/types/academic";

interface DocumentStore {
  generatedDocuments: GeneratedDocument[];
  isLoading: boolean;
  currentGeneration: DocumentType | null;

  // Actions
  generateDocument: (
    options: DocumentGenerationOptions
  ) => Promise<GeneratedDocument>;
  previewDocument: (documentId: string) => Promise<void>;
  downloadDocument: (documentId: string, fileName?: string) => Promise<void>;
  getStudentDocuments: (studentId: string) => GeneratedDocument[];
  getDocumentHistory: (
    studentId: string,
    type?: DocumentType
  ) => GeneratedDocument[];
  clearDocuments: () => void;
}

// URL de base de l'API
const API_BASE_URL = "http://localhost:4000";

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  generatedDocuments: [],
  isLoading: false,
  currentGeneration: null,

  generateDocument: async (options: DocumentGenerationOptions) => {
    set({ isLoading: true, currentGeneration: options.type });

    try {
      console.log("📤 Envoi de la requête de génération:", options);

      const response = await fetch(`${API_BASE_URL}/api/document/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur serveur:", response.status, errorText);
        throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
      }

      const document = await response.json();
      console.log("✅ Document généré avec succès:", document);

      set((state) => ({
        generatedDocuments: [...state.generatedDocuments, document],
        isLoading: false,
        currentGeneration: null,
      }));

      return document;
    } catch (error) {
      console.error("❌ Erreur lors de la génération:", error);
      set({ isLoading: false, currentGeneration: null });

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 3001."
        );
      }

      throw error;
    }
  },

  previewDocument: async (documentId: string): Promise<void> => {
    try {
      console.log("👀 Prévisualisation du document:", documentId);

      const response = await fetch(
        `${API_BASE_URL}/api/document/preview/${documentId}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la prévisualisation");
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);

      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(pdfUrl, "_blank");

      if (!newWindow) {
        throw new Error(
          "Impossible d'ouvrir un nouvel onglet. Vérifiez les bloqueurs de pop-up."
        );
      }

      // Nettoyer l'URL après un délai
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000); // 30 secondes

      console.log("✅ Prévisualisation ouverte dans un nouvel onglet");
    } catch (error) {
      console.error("❌ Erreur preview:", error);
      throw error;
    }
  },

  downloadDocument: async (
    documentId: string,
    fileName?: string
  ): Promise<void> => {
    try {
      console.log("💾 Téléchargement du document:", documentId);

      const response = await fetch(
        `${API_BASE_URL}/api/document/download/${documentId}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Utiliser le nom de fichier fourni ou celui du header
      const contentDisposition = response.headers.get("content-disposition");
      let finalFileName = fileName || "document.pdf";

      if (contentDisposition && !fileName) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) finalFileName = fileNameMatch[1];
      }

      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log("✅ Document téléchargé:", finalFileName);
    } catch (error) {
      console.error("❌ Erreur download:", error);
      throw error;
    }
  },

  getStudentDocuments: (studentId: string) => {
    return get().generatedDocuments.filter(
      (doc) => doc.studentId === studentId
    );
  },

  getDocumentHistory: (studentId: string, type?: DocumentType) => {
    let documents = get().generatedDocuments.filter(
      (doc) => doc.studentId === studentId
    );

    if (type) {
      documents = documents.filter((doc) => doc.type === type);
    }

    return documents.sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  },

  clearDocuments: () => {
    set({ generatedDocuments: [] });
  },
}));
