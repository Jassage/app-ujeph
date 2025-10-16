// export interface Student {
//   retakes: any[];
//   id: string;
//   firstName: string;
//   lastName: string;
//   studentId: string;
//   email: string;
//   phone: string;
//   dateOfBirth: string;
//   placeOfBirth: string;
//   address: string;
//   photo?: string;
//   bloodGroup?: string;
//   allergies?: string;
//   disabilities?: string;
//   status: "Active" | "Inactive" | "Graduated";
//   guardians: Guardian[];
//   enrollments?: Enrollment[];
//   grades?: Grade[];
//   cin?: string;
//   sexe?: string;
//   createdAt: string;
// }

// // types/academic.ts
export interface Enrollment {
  id: string;
  studentId: string;
  faculty: string; // Nom de la faculté (pour l'affichage)
  facultyId?: string; // ID de la faculté (pour l'API)
  level: string;
  semester: "S1" | "S2";
  academicYear: string; // Année académique (pour l'affichage)
  academicYearId?: string; // ID de l'année académique (pour l'API)
  status: "Active" | "Suspended" | "Completed";
  enrollmentDate: string;
  createdAt?: string;
  updatedAt?: string;

  // Relations optionnelles pour l'affichage
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentId: string;
  };
}
export interface CreateEnrollmentData {
  studentId: string;
  faculty: string;
  level: string;
  academicYearId: string;
  enrollmentDate?: string;
  status?: "Active" | "Completed" | "Suspended";
}

export interface UpdateEnrollmentData {
  faculty?: string;
  level?: string;
  academicYearId?: string;
  status?: "Active" | "Completed" | "Suspended";
}
// export interface CreateEnrollmentData {
//   studentId: string;
//   faculty: string;
//   level: string;
//   academicYearId: string;
//   // academicYear: string; // ✅ requis
//   status: "Active" | "Suspended" | "Completed";
//   enrollmentDate: string;
// }

// export interface UpdateEnrollmentData {
//   faculty?: string;
//   level?: string;
//   academicYearId?: string;
//   status?: "Active" | "Suspended" | "Completed";
// }

// export interface Guardian {
//   id?: string;
//   firstName: string;
//   lastName: string;
//   studentId: string;
//   relationship: string;
//   phone: string;
//   email?: string;
//   address?: string;
//   isPrimary: boolean;
//   createdAt?: string;
// }
// src/types/academic.ts

// src/types/academic.ts

// Utiliser des unions de string literals au lieu d'enum
export type StudentStatus = "Active" | "Inactive" | "Graduated" | "Suspended";
export type StudentSexe = "Masculin" | "Feminin" | "Autre";
export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  placeOfBirth: string;
  address: string;
  photo?: string;
  bloodGroup?: BloodGroup;
  allergies?: string;
  disabilities?: string;
  status: StudentStatus;
  guardians: Guardian[];
  enrollments?: Enrollment[];
  grades?: Grade[];
  cin?: string;
  sexe?: StudentSexe;
  createdAt: string;
  updatedAt?: string;
  retakes?: any[];
}

export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Types pour les opérations de formulaire
export type StudentFormData = {
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  address?: string;
  bloodGroup?: BloodGroup;
  allergies?: string;
  disabilities?: string;
  cin?: string;
  sexe?: StudentSexe;
  status: StudentStatus;
  guardians: GuardianFormData[];
};

export type GuardianFormData = {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
};

export type CreateStudentData = Omit<
  StudentFormData,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateStudentData = Partial<StudentFormData>;
// export interface Enrollment {
//   id: string;
//   studentId: string;
//   facultyId: string;
//   academicYearId: string;
//   level: string;
//   enrollmentDate: string; // ISO string
//   status: "Active" | "Completed" | "Cancelled";
//   faculty?: {
//     id: string;
//     name: string;
//     code: string;
//     dean?: string;
//   };
//   academicYear?: {
//     id: string;
//     year: string;
//     startDate: string;
//     endDate: string;
//     isCurrent: boolean;
//   };
//   createdAt: string;
//   updatedAt?: string;
// }

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface StudentApiResponse extends ApiResponse<Student> {}
export interface StudentsApiResponse extends ApiResponse<Student[]> {}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  passingGrade: number;
  type: "Obligatoire" | "Optionnelle";
  prerequisites: string[];
  inCatalog?: boolean;
}

// export interface Grade {
//   id: string;
//   studentId: string;
//   ueId: string;
//   grade: number;
//   status: "Validé" | "À reprendre" | "En cours";
//   session: "Normale" | "Rattrapage";
//   semester: string;
//   academicYear: string;
// }

export interface Retake {
  id: string;
  studentId: string;
  ueId: string;
  originalGrade: number;
  retakeGrade?: number;
  scheduledSemester: string;
  status: "Programmé" | "En cours" | "Terminé";
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  facultyId?: string;
  role: "Admin" | "Professeur" | "Secrétaire" | "Directeur" | "Doyen";
  status: "Actif" | "Inactif";
  lastLogin?: string;
  avatar?: string;
  createdAt: string;
}

export interface FacultyLevel {
  id: string;
  level: string;
  facultyId: string;
  assignments?: any[]; // Ajouté pour la relation
}

export interface FacultyWithLevels {
  id: string;
  name: string;
  code: string;
  description?: string;
  deanId?: string;
  dean?: string;
  studentsCount?: number; // Rendre optionnel
  coursesCount?: number; // Rendre optionnel
  studyDuration: number;
  levels: FacultyLevel[];
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
  assignments?: any[];
  _count?: {
    assignments: number;
  };
}
// Nouvelles interfaces pour les fonctionnalités ajoutées
export interface Schedule {
  id: string;
  ueId: string;
  professorId: string;
  classroom: string;
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, etc.
  startTime: string;
  endTime: string;
  faculty: string;
  level: string;
  semester: "S1" | "S2";
  academicYear: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  scheduleId: string;
  date: string;
  status: "Présent" | "Absent" | "Retard" | "Excusé";
  notes?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: "Inscription" | "Scolarité" | "Examen" | "Certificat" | "Autre";
  status: "En attente" | "Payé" | "Annulé";
  moyen: "Cash" | "Natcash" | "Moncash" | "Sogebank" | "Fonkoze";
  description?: string;
  academicYear: string; // Ex: "2024-2025"
  academicYearId: string; // ID de l'année académique
  paidDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  faculty: string;
  quantity: number;
  available: number;
  location: string;
  status: "Disponible" | "Épuisé" | "En commande";
}

export interface BookLoan {
  id: string;
  bookId: string;
  studentId: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: "En cours" | "Retourné" | "En retard" | "Perdu";
  renewalCount: number;
  fine?: number;
}

export interface Transcript {
  id: string;
  studentId: string;
  semester: string;
  academicYear: string;
  grades: Grade[];
  gpa: number;
  totalCredits: number;
  creditsEarned: number;
  generatedDate: string;
}

// Nouvelles interfaces pour les fonctionnalités avancées
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
  priority: "Normal" | "Urgent" | "Important";
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: string;
  category: "Académique" | "Culturel" | "Sportif" | "Administratif" | "Autre";
  participants: string[];
  isPublic: boolean;
  status: "Programmé" | "En cours" | "Terminé" | "Annulé";
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  publishDate: string;
  expiryDate?: string;
  targetAudience: "Tous" | "Étudiants" | "Professeurs" | "Administration";
  priority: "Normal" | "Important" | "Urgent";
  attachments?: string[];
  isActive: boolean;
}

export interface Scholarship {
  id: string;
  name: string;
  description: string;
  amount: number;
  criteria: string;
  applicationDeadline: string;
  academicYear: string;
  maxRecipients: number;
  currentRecipients: number;
  status: "Ouvert" | "Fermé" | "En évaluation" | "Attribué";
}

export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  studentId: string;
  applicationDate: string;
  documents: string[];
  motivation: string;
  status: "Soumise" | "En cours" | "Acceptée" | "Refusée";
  reviewNotes?: string;
}

export interface Room {
  id: string;
  name: string;
  type:
    | "Amphithéâtre"
    | "Salle de cours"
    | "Laboratoire"
    | "Bibliothèque"
    | "Bureau";
  capacity: number;
  equipment: string[];
  location: string;
  status: "Disponible" | "Occupée" | "Maintenance" | "Réservée";
}

export interface RoomReservation {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "Confirmée" | "En attente" | "Annulée";
  recurring?: {
    frequency: "Quotidien" | "Hebdomadaire" | "Mensuel";
    endDate: string;
  };
}

export interface Certificate {
  id: string;
  studentId: string;
  type: "Diplôme" | "Certificat" | "Attestation" | "Relevé de notes";
  title: string;
  issueDate: string;
  validUntil?: string;
  signedBy: string;
  verificationCode: string;
  status: "Émis" | "En préparation" | "Annulé";
}

export interface Analytics {
  id: string;
  type: "Performance" | "Présence" | "Paiements" | "Général";
  data: Record<string, any>;
  generatedDate: string;
  parameters: Record<string, any>;
}

// types/academic.ts
export interface CourseAssignment {
  id: string;
  ueId: string;
  facultyId: string;
  professeurId: string;
  academicYearId: string;
  semester: "S1" | "S2";
  level: string;
  facultyLevelId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  // Relations (optionnelles, pour l'UI)
  ue?: UE;
  faculty?: FacultyWithLevels;
  professeur?: Professeur;
  academicYear?: AcademicYear;
}

export interface UE {
  semester?: string;
  facultyId: string;
  level: string;
  id: string;
  code: string;
  title: string;
  credits: number;
  type: UEType;
  passingGrade: number;
  description?: string;
  objectives?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  createdById: string;

  prerequisites: UEPrerequisite[];
  requiredFor: UEPrerequisite[];
  assignments: CourseAssignment[];
  grades: Grade[];
  retakes: Retake[];
  inCatalog: boolean;
}

export interface UEPrerequisite {
  id: string;
  ueId: string;
  prerequisiteId: string;
  ue: UE;
  prerequisite: UE;
  createdAt: string;
}

// Ajoutez un type pour la création sans les relations complexes
export interface CreateUEData {
  code: string;
  title: string;
  credits: number;
  type: UEType;
  passingGrade: number;
  description?: string;
  objectives?: string;
  createdById: string;
  inCatalog: boolean;
  facultyId?: string;
  level?: string;
  prerequisites: string[]; // Pour la création, on envoie juste les IDs
}

export interface UpdateUEData {
  code?: string;
  title?: string;
  credits?: number;
  type?: UEType;
  passingGrade?: number;
  description?: string;
  objectives?: string;
  inCatalog?: boolean;
  facultyId?: string;
  level?: string;
  prerequisites?: string[]; // Pour la mise à jour aussi
}

export type UEType = "Obligatoire" | "Optionnelle";

// export interface Professeur {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   speciality?: string;
//   status: "Actif" | "Inactif";
//   createdAt: string;
//   updatedAt?: string;
// }

// types/academic.ts
export interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
export type GradeSession = "Normale" | "Reprise";
// export type GradeStatus = "Valide" | "AReprendre" | "EnCours";
export type GradeStatus = "Valid_" | "Non_valid_" | "reprendre";

// types/academic.ts
export interface Grade {
  ue: any;
  id: string;
  studentId: string;
  ueId: string;
  grade: number;
  status: GradeStatus;
  session: GradeSession;
  semester: "S1" | "S2";
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  level: string;
}

// export interface GradeWithDetails extends Grade {
//   student: {
//     firstName: string;
//     lastName: string;
//     studentId: string;
//   };
//   ue: {
//     id: string;
//     code: string;
//     title: string;
//     credits: number;
//     passingGrade: number;
//   };
//   academicYearId: string;
//   semester: "S1" | "S2";
// }

// types/expense.ts
export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  paymentMethod: string;
  status: "Pending" | "Approved" | "Rejected";
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateExpenseInput {
  category: string;
  amount: number;
  description?: string;
  date: string;
  paymentMethod: string;
  createdBy: string;
  status?: "Pending" | "Approved" | "Rejected";
}

export interface UpdateExpenseInput {
  category?: string;
  amount?: number;
  description?: string;
  date?: string;
  paymentMethod?: string;
  status?: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
}

export interface ExpenseFilters {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  createdBy?: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicYear: string; // ex: "2023-2024"
  faculty: string; // ID ou nom de la faculté
  level: string; // ex: "1", "2", "3"
  amount: number; // ← Total des frais
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Champs optionnels pour l'interface utilisateur seulement
  tuitionFee?: number;
  tshirtFee?: number;
  cardIdFee?: number;
}

// Type pour la création (sans les champs optionnels)
export type FeeStructureCreate = Omit<
  FeeStructure,
  "id" | "createdAt" | "updatedAt"
>;

export interface StudentFee {
  id: string;
  studentId: string;
  academicYearId: string;
  feeStructureId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "partial" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  feeStructure?: FeeStructure;
  academicYearRef?: AcademicYear;
}

export interface CreateFeeStructureInput {
  academicYear: string;
  name: string;
  faculty: string;
  level: string;
  amount: number;
  isActive?: boolean;
}

export interface AssignFeeToStudentInput {
  studentId: string;
  academicYear: string;
  feeStructureId: string;
}

export interface UpdateFeePaymentInput {
  amount: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  type: "Inscription" | "Scolarité" | "Examen" | "Certificat" | "Autre";
  status: "En attente" | "Payé" | "Annulé";
  moyen: "Cash" | "Natcash" | "Moncash" | "Sogebank" | "Fonkoze";
  description?: string;
  academicYear: string; // Ex: "2024-2025"
  academicYearId: string; // ID de l'année académique
  paidDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum DocumentTypeI {
  BULLETIN = "BULLETIN",
  RELEVE = "RELEVE",
  ATTESTATION_NIVEAU = "ATTESTATION_NIVEAU",
  ATTESTATION_FIN_ETUDES = "ATTESTATION_FIN_ETUDES",
  CERTIFICAT_SCOLARITE = "CERTIFICAT_SCOLARITE",
}

export interface DocumentGenerationOptions {
  type: DocumentTypeI;
  studentId: string;
  academicYearId: string;
  semester?: "S1" | "S2" | "all";
  level: string;
  includeAllGrades?: boolean;
  language?: "fr" | "en";
  withSignature?: boolean;
  withStamp?: boolean;
}

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  studentId: string;
  fileName: string;
  generatedAt: Date;
  metadata: Record<string, any>;
  // Ajoutez d'autres champs selon votre API
}

// Types pour les différents documents
export type DocumentType =
  | "transcript" // Bulletin de notes
  | "grade-report" // Relevé de notes
  | "level-certificate" // Attestation de niveau
  | "completion-certificate" // Attestation de fin d'études
  | "diploma-certificate"; // Certificat de diplôme

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiredFields: string[];
}

export interface DocumentData {
  student: any;
  academicInfo: {
    faculty: string;
    level: string;
    academicYear: string;
    program: string;
  };
  grades?: any[];
  summary?: {
    gpa: number;
    creditsEarned: number;
    totalCredits: number;
    mention: string;
  };
  issueDate: Date;
  documentId: string;
}

// types/academic.ts - AJOUT DES TYPES PROFESSEUR COMPLETS

// Types pour les professeurs
export interface Professeur {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  speciality?: string;
  status: "Actif" | "Inactif";
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les affectations des professeurs
export interface ProfessorAssignment {
  id: string;
  professorId: string;
  professor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  ueId: string;
  ue?: {
    id: string;
    code: string;
    title: string;
    credits: number;
    faculty?: string;
    level?: string;
  };
  academicYearId: string;
  academicYear?: {
    id: string;
    year: string;
    isCurrent: boolean;
  };
  hours: number;
  type: "Cours" | "TD" | "TP";
  status: "Active" | "Completed" | "Cancelled";
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les données de formulaire des professeurs
export interface ProfessorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  speciality?: string;
  status: "Actif" | "Inactif";
}

export interface CreateProfessorData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  speciality?: string;
  status?: "Actif" | "Inactif";
}

export interface UpdateProfessorData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  speciality?: string;
  status?: "Actif" | "Inactif";
}

// Types pour les affectations
export interface CreateAssignmentData {
  professorId: string;
  ueId: string;
  academicYearId: string;
  hours: number;
  type: "Cours" | "TD" | "TP";
  startDate?: string;
  endDate?: string;
}

export interface UpdateAssignmentData {
  ueId?: string;
  academicYearId?: string;
  hours?: number;
  type?: "Cours" | "TD" | "TP";
  status?: "Active" | "Completed" | "Cancelled";
  startDate?: string;
  endDate?: string;
}

// Types pour les statistiques des professeurs
export interface ProfessorStats {
  total: number;
  active: number;
  inactive: number;
  totalAssignments: number;
  bySpeciality: Record<string, number>;
  byStatus: Record<string, number>;
}

// Types pour l'import des professeurs
export interface ProfessorImportResult {
  success: number;
  errors: Array<{
    row: number;
    errors: string[];
    data: any;
  }>;
}

// Types pour la réponse des opérations en masse
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// Dans types/academic.ts
export interface GradeWithDetails {
  id: string;
  studentId: string;
  ueId: string;
  ue?: {
    id: string;
    code: string;
    title: string;
    credits: number;
    passingGrade: number;
  };
  grade: number;
  status: string;
  session: string;
  semester: "S1" | "S2";
  academicYearId: string;
  isActive: boolean;
  academicYear?: {
    id: string;
    year: string;
  };
  // Champs de secours
  courseTitle?: string;
  courseCode?: string;
  credits?: number;
  passingGrade?: number;
  createdAt: string;
}
