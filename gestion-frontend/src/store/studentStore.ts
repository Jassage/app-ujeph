// src/store/studentStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "../services/api";
import {
  Student,
  Enrollment,
  Guardian,
  Grade,
  UE,
  StudentFormData,
  CreateStudentData,
  UpdateStudentData,
} from "../types/academic";

interface ApiState {
  loading: boolean;
  error: string | null;
  lastOperation: "create" | "update" | "delete" | "import" | null;
  operationTimestamp: number | null;
}

interface AcademicStore extends ApiState {
  students: Student[];
  enrollments: Enrollment[];
  guardians: Guardian[];
  grades: Grade[];
  ues: UE[];
  importResults: any[];

  // Actions
  fetchStudents: () => Promise<void>;
  fetchGrades: () => Promise<void>;
  fetchUEs: () => Promise<void>;
  getStudentsByFaculty: (facultyId: string) => Student[];
  addStudent: (student: StudentFormData, photoFile?: File) => Promise<void>;
  updateStudent: (
    id: string,
    student: Partial<StudentFormData>,
    photoFile?: File
  ) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  importStudents: (file: File) => Promise<any>;
  updateStudentPhoto: (studentId: string, photoFile: File) => Promise<void>;
  downloadImportTemplate: () => Promise<void>;

  // Getters
  getStudentGuardians: (studentId: string) => Guardian[];
  getStudentGrades: (studentId: string) => any[];
  getStudentRetakes: (studentId: string) => any[];

  // Utilitaires
  clearError: () => void;
  clearImportResults: () => void;
}

// Validation côté client
const validateStudentForm = (student: any): string[] => {
  const errors: string[] = [];

  if (!student.firstName?.trim()) {
    errors.push("Le prénom est requis");
  } else if (student.firstName.length < 2) {
    errors.push("Le prénom doit contenir au moins 2 caractères");
  }

  if (!student.lastName?.trim()) {
    errors.push("Le nom est requis");
  } else if (student.lastName.length < 2) {
    errors.push("Le nom doit contenir au moins 2 caractères");
  }

  if (!student.studentId?.trim()) {
    errors.push("L'ID étudiant est requis");
  }

  if (!student.email?.trim()) {
    errors.push("L'email est requis");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    errors.push("Format d'email invalide");
  }

  if (student.phone && !/^[\d\s+\-()]{8,20}$/.test(student.phone)) {
    errors.push("Format de téléphone invalide");
  }

  return errors;
};

const validateFile = (file: File, maxSizeMB: number = 10): string | null => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/json",
  ];

  if (!allowedTypes.includes(file.type)) {
    return "Type de fichier non autorisé";
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Fichier trop volumineux (max ${maxSizeMB}MB)`;
  }

  return null;
};

export const useAcademicStore = create<AcademicStore>()(
  devtools((set, get) => ({
    // State initial avec valeurs par défaut sécurisées
    students: [],
    enrollments: [],
    guardians: [],
    grades: [], // CORRECTION: S'assurer que c'est toujours un tableau
    ues: [],
    importResults: [],
    loading: false,
    error: null,
    lastOperation: null,
    operationTimestamp: null,

    // Actions
    fetchStudents: async () => {
      set({ loading: true, error: null });

      try {
        const [studentsRes, enrollmentsRes, guardiansRes] = await Promise.all([
          api.get("/students"),
          api.get("/enrollments"),
          api.get("/guardians"),
        ]);

        set({
          students: Array.isArray(studentsRes.data) ? studentsRes.data : [],
          enrollments: Array.isArray(enrollmentsRes.data)
            ? enrollmentsRes.data
            : [],
          guardians: Array.isArray(guardiansRes.data) ? guardiansRes.data : [],
          loading: false,
          lastOperation: null,
        });
      } catch (error: any) {
        console.error("Erreur fetchStudents:", error);
        set({
          error:
            error.response?.data?.message ||
            "Erreur lors du chargement des étudiants",
          loading: false,
          lastOperation: null,
        });
      }
    },

    fetchGrades: async () => {
      set({ loading: true, error: null });

      try {
        const response = await api.get("/grades");

        // CORRECTION CRITIQUE: S'assurer que grades est toujours un tableau
        const gradesData = Array.isArray(response.data) ? response.data : [];

        set({
          grades: gradesData,
          loading: false,
          lastOperation: null,
        });
      } catch (error: any) {
        console.error("Erreur fetchGrades:", error);

        // CORRECTION: En cas d'erreur, définir un tableau vide
        set({
          grades: [],
          error:
            error.response?.data?.message ||
            "Erreur lors du chargement des notes",
          loading: false,
          lastOperation: null,
        });
      }
    },

    fetchUEs: async () => {
      set({ loading: true, error: null });

      try {
        const response = await api.get("/ues");

        set({
          ues: Array.isArray(response.data.ues) ? response.data.ues : [],
          loading: false,
          lastOperation: null,
        });
      } catch (error: any) {
        console.error("Erreur fetchUEs:", error);

        set({
          ues: [],
          error:
            error.response?.data?.message ||
            "Erreur lors du chargement des UEs",
          loading: false,
          lastOperation: null,
        });
      }
    },

    // CORRECTION: getStudentGrades avec gestion d'erreur robuste
    getStudentGrades: (studentId: string) => {
      try {
        const state = get();

        // CORRECTION: Vérifier que grades existe et est un tableau
        if (!state.grades || !Array.isArray(state.grades)) {
          console.warn("⚠️ Grades n'est pas un tableau valide:", state.grades);
          return [];
        }

        // CORRECTION: Filtrer avec gestion d'erreur pour chaque grade
        const studentGrades = state.grades.filter((grade) => {
          try {
            // Vérifications de sécurité
            if (!grade || typeof grade !== "object") return false;
            if (!grade.studentId) return false;

            return grade.studentId === studentId;
          } catch (error) {
            console.warn("⚠️ Erreur lors du filtrage d'une note:", error);
            return false;
          }
        });

        // CORRECTION: Vérifier que students et ues sont des tableaux
        const studentsArray = Array.isArray(state.students)
          ? state.students
          : [];
        const uesArray = Array.isArray(state.ues) ? state.ues : [];

        return studentGrades.map((grade) => {
          try {
            const student = studentsArray.find((s) => s.id === grade.studentId);
            const ue = uesArray.find((u) => u.id === grade.ueId);

            return {
              ...grade,
              student: student
                ? {
                    firstName: student.firstName || "Inconnu",
                    lastName: student.lastName || "Inconnu",
                    studentId: student.studentId || "N/A",
                  }
                : {
                    firstName: "Inconnu",
                    lastName: "Inconnu",
                    studentId: "N/A",
                  },
              ue: ue
                ? {
                    code: ue.code || "N/A",
                    title: ue.title || "UE Inconnue",
                    credits: ue.credits || 0,
                    passingGrade: ue.passingGrade || 10,
                  }
                : {
                    code: "N/A",
                    title: "UE Inconnue",
                    credits: 0,
                    passingGrade: 10,
                  },
            };
          } catch (error) {
            console.warn("⚠️ Erreur lors du mappage d'une note:", error);
            // Retourner une structure de base sécurisée
            return {
              ...grade,
              student: {
                firstName: "Erreur",
                lastName: "Données",
                studentId: "N/A",
              },
              ue: {
                code: "N/A",
                title: "UE Inconnue",
                credits: 0,
                passingGrade: 10,
              },
            };
          }
        });
      } catch (error) {
        console.error("❌ Erreur critique dans getStudentGrades:", error);
        return [];
      }
    },

    // CORRECTION: getStudentGuardians avec gestion d'erreur
    getStudentGuardians: (studentId: string) => {
      try {
        const state = get();

        if (!state.guardians || !Array.isArray(state.guardians)) {
          console.warn("⚠️ Guardians n'est pas un tableau valide");
          return [];
        }

        return state.guardians.filter((guardian) => {
          try {
            return guardian && guardian.studentId === studentId;
          } catch {
            return false;
          }
        });
      } catch (error) {
        console.error("❌ Erreur dans getStudentGuardians:", error);
        return [];
      }
    },

    // CORRECTION: getStudentRetakes avec gestion d'erreur
    getStudentRetakes: (studentId: string) => {
      try {
        const state = get();

        if (!state.students || !Array.isArray(state.students)) {
          return [];
        }

        const student = state.students.find((s) => s.id === studentId);

        if (!student || !student.retakes || !Array.isArray(student.retakes)) {
          return [];
        }

        return student.retakes;
      } catch (error) {
        console.error("❌ Erreur dans getStudentRetakes:", error);
        return [];
      }
    },

    // CORRECTION: getStudentsByFaculty avec gestion d'erreur
    getStudentsByFaculty: (facultyId: string) => {
      try {
        const state = get();

        if (!state.students || !Array.isArray(state.students)) {
          return [];
        }

        return state.students.filter((s) => {
          try {
            return s.faculty === facultyId;
          } catch {
            return false;
          }
        });
      } catch (error) {
        console.error("❌ Erreur dans getStudentsByFaculty:", error);
        return [];
      }
    },

    // Les autres fonctions restent similaires mais avec des validations ajoutées
    addStudent: async (student: StudentFormData, photoFile?: File) => {
      set({ loading: true, error: null });

      try {
        // Validation des données
        const formErrors = validateStudentForm(student);
        if (formErrors.length > 0) {
          throw new Error(formErrors.join(", "));
        }

        // Préparer les données étudiant
        const studentData = {
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,
          email: student.email,
          dateOfBirth: student.dateOfBirth
            ? new Date(student.dateOfBirth).toISOString()
            : null,
          phone: student.phone || "",
          placeOfBirth: student.placeOfBirth || "",
          address: student.address || "",
          bloodGroup: student.bloodGroup || "",
          allergies: student.allergies || "",
          disabilities: student.disabilities || "",
          cin: student.cin,
          sexe: student.sexe,
          status: student.status || "Active",
          guardians:
            student.guardians?.map((guardian) => ({
              firstName: guardian.firstName || "",
              lastName: guardian.lastName || "",
              relationship: guardian.relationship || "Parent",
              phone: guardian.phone || "",
              email: guardian.email || null,
              address: guardian.address || null,
              isPrimary: guardian.isPrimary || false,
            })) || [],
        };

        let response;

        if (photoFile) {
          const fileError = validateFile(photoFile, 5);
          if (fileError) {
            throw new Error(fileError);
          }

          const formData = new FormData();
          formData.append("studentData", JSON.stringify(studentData));
          formData.append("photo", photoFile);

          response = await api.post("/students", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
          });
        } else {
          response = await api.post("/students", studentData, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          });
        }

        // CORRECTION: S'assurer que la réponse contient un étudiant valide
        if (response.data && response.data.student) {
          set((state) => ({
            students: [...state.students, response.data.student],
            loading: false,
            lastOperation: "create",
            operationTimestamp: Date.now(),
          }));

          // Recharger pour synchroniser
          await get().fetchStudents();
        }

        return response.data;
      } catch (error: any) {
        console.error("❌ Erreur addStudent:", error);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Erreur lors de la création de l'étudiant";

        set({
          error: errorMessage,
          loading: false,
          lastOperation: null,
        });

        throw error;
      }
    },

    updateStudent: async (
      id: string,
      student: Partial<StudentFormData>,
      photoFile?: File
    ) => {
      set({ loading: true, error: null });

      try {
        const studentData = {
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,
          email: student.email,
          dateOfBirth: student.dateOfBirth
            ? new Date(student.dateOfBirth).toISOString()
            : undefined,
          phone: student.phone,
          placeOfBirth: student.placeOfBirth,
          address: student.address,
          bloodGroup: student.bloodGroup,
          allergies: student.allergies,
          disabilities: student.disabilities,
          cin: student.cin,
          sexe: student.sexe,
          status: student.status,
          guardians: student.guardians?.map((guardian) => ({
            firstName: guardian.firstName || "",
            lastName: guardian.lastName || "",
            relationship: guardian.relationship || "Parent",
            phone: guardian.phone || "",
            email: guardian.email || null,
            address: guardian.address || null,
            isPrimary: guardian.isPrimary || false,
          })),
        };

        let response;

        if (photoFile) {
          const fileError = validateFile(photoFile, 5);
          if (fileError) {
            throw new Error(fileError);
          }

          const formData = new FormData();
          formData.append("studentData", JSON.stringify(studentData));
          formData.append("photo", photoFile);

          response = await api.put(`/students/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
          });
        } else {
          response = await api.put(`/students/${id}`, studentData, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          });
        }

        if (response.data && response.data.student) {
          set((state) => ({
            students: state.students.map((s) =>
              s.id === id ? { ...s, ...response.data.student } : s
            ),
            loading: false,
            lastOperation: "update",
            operationTimestamp: Date.now(),
          }));
        }

        return response.data;
      } catch (error: any) {
        console.error("❌ Erreur updateStudent:", error);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Erreur lors de la modification de l'étudiant";

        set({
          error: errorMessage,
          loading: false,
          lastOperation: null,
        });

        throw error;
      }
    },

    // Les autres méthodes (deleteStudent, importStudents, etc.) restent similaires
    // mais devraient inclure les mêmes validations

    deleteStudent: async (id) => {
      set({ loading: true, error: null });

      try {
        await api.delete(`/students/${id}`);

        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          loading: false,
          lastOperation: "delete",
          operationTimestamp: Date.now(),
        }));
      } catch (error: any) {
        console.error("Erreur deleteStudent:", error);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Erreur lors de la suppression de l'étudiant";

        set({
          error: errorMessage,
          loading: false,
          lastOperation: null,
        });

        throw error;
      }
    },

    importStudents: async (file) => {
      const fileError = validateFile(file, 10);
      if (fileError) {
        throw new Error(fileError);
      }

      set({ loading: true, error: null, importResults: [] });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/students/import", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        });

        set({
          importResults: Array.isArray(response.data.results)
            ? response.data.results
            : [],
          loading: false,
          lastOperation: "import",
          operationTimestamp: Date.now(),
        });

        await get().fetchStudents();

        return response.data;
      } catch (error: any) {
        console.error("Erreur importStudents:", error);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Erreur lors de l'importation";

        set({
          error: errorMessage,
          loading: false,
          importResults: [],
          lastOperation: null,
        });

        throw error;
      }
    },

    updateStudentPhoto: async (studentId, photoFile) => {
      const fileError = validateFile(photoFile, 5);
      if (fileError) {
        throw new Error(fileError);
      }

      set({ loading: true, error: null });

      try {
        const formData = new FormData();
        formData.append("photo", photoFile);

        const response = await api.patch(
          `/students/${studentId}/photo`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
          }
        );

        set((state) => ({
          students: state.students.map((s) =>
            s.id === studentId
              ? { ...s, photo: response.data.student.photo }
              : s
          ),
          loading: false,
          lastOperation: "update",
          operationTimestamp: Date.now(),
        }));

        return response.data;
      } catch (error: any) {
        console.error("Erreur updateStudentPhoto:", error);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Erreur lors de la mise à jour de la photo";

        set({
          error: errorMessage,
          loading: false,
          lastOperation: null,
        });

        throw error;
      }
    },

    downloadImportTemplate: async () => {
      try {
        const response = await api.get("/students/import/template", {
          responseType: "blob",
          timeout: 30000,
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "template-import-etudiants.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error: any) {
        console.error("Erreur downloadImportTemplate:", error);

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Erreur lors du téléchargement du template";

        set({
          error: errorMessage,
          lastOperation: null,
        });

        throw error;
      }
    },

    // Utilitaires
    clearError: () => set({ error: null }),
    clearImportResults: () => set({ importResults: [] }),
  }))
);
