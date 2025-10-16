// utils/courseStats.ts
export const getCourseStatsByFaculty = (assignments: any[]) => {
  const courseStats: Record<
    string,
    {
      totalCourses: number;
      uniqueCourses: Set<string>;
      professors: Set<string>;
      semesters: Set<string>;
    }
  > = {};

  assignments.forEach((assignment) => {
    if (assignment.facultyId) {
      if (!courseStats[assignment.facultyId]) {
        courseStats[assignment.facultyId] = {
          totalCourses: 0,
          uniqueCourses: new Set(),
          professors: new Set(),
          semesters: new Set(),
        };
      }

      // Compter chaque affectation comme un cours
      courseStats[assignment.facultyId].totalCourses++;

      // Ajouter le cours aux cours uniques
      if (assignment.ueId) {
        courseStats[assignment.facultyId].uniqueCourses.add(assignment.ueId);
      }

      // Ajouter le professeur
      if (assignment.professorId) {
        courseStats[assignment.facultyId].professors.add(
          assignment.professorId
        );
      }

      // Ajouter le semestre
      if (assignment.semester) {
        courseStats[assignment.facultyId].semesters.add(assignment.semester);
      }
    }
  });

  return courseStats;
};
