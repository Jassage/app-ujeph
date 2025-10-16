// Correction temporaire pour éviter les erreurs TypeScript
// Ces composants seront mis à jour avec la fonction utilitaire getStudentEnrollmentInfo()

import { Student, Enrollment } from "../types/academic";

export const getStudentEnrollmentInfo = (
  student: Student,
  enrollments: Enrollment[],
  academicYear: any
): { faculty: string; level: string; academicYear: string } => {
  // Trouver l'immatriculation active la plus récente
  const activeEnrollments = enrollments.filter(
    (e) => e.studentId === student.id && e.status === "Active"
  );

  if (activeEnrollments.length === 0) {
    return { faculty: "Non immatriculé", level: "N/A", academicYear: "N/A" };
  }

  // Retourner l'immatriculation la plus récente
  const latestEnrollment = activeEnrollments.sort(
    (a, b) =>
      new Date(b.enrollmentDate).getTime() -
      new Date(a.enrollmentDate).getTime()
  )[0];

  return {
    faculty: latestEnrollment.faculty,
    level: latestEnrollment.level,
    academicYear: latestEnrollment.academicYear,
  };
};

// Extension temporaire du type Student pour éviter les erreurs
declare module "../types/academic" {
  interface Student {
    faculty?: string;
    level?: string;
    academicYear?: string;
  }
}
