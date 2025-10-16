// hooks/useInitialData.ts
import { useEffect } from "react";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { useFacultyStore } from "@/store/facultyStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { useUEStore } from "@/store/courseStore";
import { useCourseAssignmentStore } from "@/store/courseAssignmentStore";
import { usePaymentStore } from "@/store/paymentStore";
import { useGradeStore } from "@/store/gradeStore";

export const useInitialData = () => {
  const { fetchEnrollments, enrollments } = useEnrollmentStore();
  const { fetchFaculties, faculties } = useFacultyStore();
  const { fetchAcademicYears, academicYears } = useAcademicYearStore();
  const { fetchUEs, ues } = useUEStore();
  const {
    fetchAssignments,
    fetchAssignmentsByFaculty,
    fetchAssignmentsByProfessor,
    fetchUeByFacultyAndLevel,
  } = useCourseAssignmentStore();
  const { fetchPayments } = usePaymentStore();
  const { grades, fetchGrades } = useGradeStore();

  useEffect(() => {
    const loadData = async () => {
      const promises = [];

      if (enrollments.length === 0) {
        promises.push(fetchEnrollments());
      }
      if (faculties.length === 0) {
        promises.push(fetchFaculties());
      }
      if (academicYears.length === 0) {
        promises.push(fetchAcademicYears());
      }
      if (ues.length === 0) {
        promises.push(fetchUEs());
      }
      if (fetchAssignments.length === 0) {
        promises.push(fetchAssignments());
      }
      if (fetchAssignmentsByFaculty.length === 0) {
        promises.push(fetchAssignmentsByFaculty);
      }
      if (fetchAssignmentsByProfessor.length === 0) {
        promises.push(fetchAssignmentsByProfessor);
      }
      if (fetchUeByFacultyAndLevel.length === 0) {
        promises.push(fetchUeByFacultyAndLevel);
      }

      if (fetchPayments.length === 0) {
        promises.push(fetchPayments);
      }
      if (grades.length === 0) {
        promises.push(fetchGrades());
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    loadData();
  }, []);

  return { enrollments, faculties, academicYears, ues };
};
