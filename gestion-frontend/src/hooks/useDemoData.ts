
import { useEffect } from 'react';
import { useAcademicStore } from '../store/academicStore';

// DEPRECATED: Ce hook est remplacé par useDataSync pour une meilleure architecture
// Il reste temporairement pour éviter les erreurs, mais sera supprimé plus tard

export const useDemoData = () => {
  const { 
    students, 
    enrollments,
    addStudent, 
    addEnrollment,
    addUE, 
    addGrade, 
    addUser, 
    addFaculty, 
    addGuardian,
    ues,
    users,
    faculties,
    guardians
  } = useAcademicStore();

  useEffect(() => {
    // Ajouter des facultés de démonstration
    if (faculties.length === 0) {
      addFaculty({
        id: 'fac-1',
        name: 'Sciences Informatiques',
        code: 'SI',
        description: 'Formation en informatique et technologies',
        dean: 'Dr. Marie Dupont',
        studentsCount: 0,
        coursesCount: 0,
        levels: ['L1', 'L2', 'L3', 'M1', 'M2'],
        status: 'Active',
        createdAt: new Date().toISOString()
      });

      addFaculty({
        id: 'fac-2',
        name: 'Sciences Agronomiques',
        code: 'SA',
        description: 'Formation en agronomie et développement rural',
        dean: 'Dr. Jean Baptiste',
        studentsCount: 0,
        coursesCount: 0,
        levels: ['L1', 'L2', 'L3'],
        status: 'Active',
        createdAt: new Date().toISOString()
      });

      addFaculty({
        id: 'fac-3',
        name: 'Théologie',
        code: 'TH',
        description: 'Formation théologique et pastorale',
        dean: 'Dr. Paul Moïse',
        studentsCount: 0,
        coursesCount: 0,
        levels: ['L1', 'L2', 'L3'],
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    }

    // Ajouter des utilisateurs de démonstration
    if (users.length === 0) {
      addUser({
        id: 'user-1',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@ujeph.edu.ht',
        phone: '+509 3456 7890',
        role: 'Admin',
        status: 'Actif',
        lastLogin: '2024-01-15',
        createdAt: new Date().toISOString()
      });

      addUser({
        id: 'user-2',
        firstName: 'Jean',
        lastName: 'Pierre',
        email: 'jean.pierre@ujeph.edu.ht',
        phone: '+509 3456 7891',
        role: 'Professeur',
        status: 'Actif',
        lastLogin: '2024-01-14',
        createdAt: new Date().toISOString()
      });

      addUser({
        id: 'user-3',
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.martin@ujeph.edu.ht',
        phone: '+509 3456 7892',
        role: 'Secrétaire',
        status: 'Actif',
        lastLogin: '2024-01-13',
        createdAt: new Date().toISOString()
      });
    }

    // Ajouter des étudiants de démonstration
    if (students.length === 0) {
      addStudent({
        id: 'student-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        studentId: 'ETU001',
        email: 'jean.dupont@student.ujeph.edu.ht',
        phone: '+509 1234 5678',
        dateOfBirth: '2000-05-15',
        placeOfBirth: 'Port-au-Prince',
        address: '123 Rue de la Paix, Port-au-Prince',
        status: 'Active'
      });

      addStudent({
        id: 'student-2',
        firstName: 'Marie',
        lastName: 'Joseph',
        studentId: 'ETU002',
        email: 'marie.joseph@student.ujeph.edu.ht',
        phone: '+509 1234 5679',
        dateOfBirth: '1999-08-22',
        placeOfBirth: 'Cap-Haïtien',
        address: '456 Avenue des Fleurs, Cap-Haïtien',
        status: 'Active'
      });

      addStudent({
        id: 'student-3',
        firstName: 'Pierre',
        lastName: 'Claude',
        studentId: 'ETU003',
        email: 'pierre.claude@student.ujeph.edu.ht',
        phone: '+509 1234 5680',
        dateOfBirth: '2001-01-10',
        placeOfBirth: 'Les Cayes',
        address: '789 Rue du Commerce, Les Cayes',
        status: 'Active'
      });
    }

    // Ajouter des immatriculations de démonstration
    if (enrollments.length === 0) {
      addEnrollment({
        id: 'enrollment-1',
        studentId: 'student-1',
        faculty: 'Sciences Informatiques',
        level: 'L2',
        academicYear: '2023-2024',
        enrollmentDate: '2023-09-01T00:00:00Z',
        status: 'Active'
      });

      addEnrollment({
        id: 'enrollment-2',
        studentId: 'student-2',
        faculty: 'Sciences Agronomiques',
        level: 'L3',
        academicYear: '2023-2024',
        enrollmentDate: '2023-09-01T00:00:00Z',
        status: 'Active'
      });

      addEnrollment({
        id: 'enrollment-3',
        studentId: 'student-3',
        faculty: 'Théologie',
        level: 'L1',
        academicYear: '2023-2024',
        enrollmentDate: '2023-09-01T00:00:00Z',
        status: 'Active'
      });
    }

    // Ajouter des UE de démonstration
    if (ues.length === 0) {
      addUE({
        id: 'ue-1',
        code: 'INFO101',
        title: 'Introduction à la Programmation',
        credits: 6,
        type: 'Obligatoire',
        passingGrade: 10,
        faculty: 'Sciences Informatiques',
        level: 'L1',
        semester: 'S1',
        prerequisites: []
      });

      addUE({
        id: 'ue-2',
        code: 'MATH101',
        title: 'Mathématiques Générales',
        credits: 6,
        type: 'Obligatoire',
        passingGrade: 10,
        faculty: 'Sciences Informatiques',
        level: 'L1',
        semester: 'S1',
        prerequisites: []
      });

      addUE({
        id: 'ue-3',
        code: 'AGRO101',
        title: 'Introduction à l\'Agronomie',
        credits: 5,
        type: 'Obligatoire',
        passingGrade: 10,
        faculty: 'Sciences Agronomiques',
        level: 'L1',
        semester: 'S1',
        prerequisites: []
      });
    }

    // Ajouter des tuteurs de démonstration
    if (guardians.length === 0) {
      addGuardian({
        id: 'guardian-1',
        studentId: 'student-1',
        firstName: 'Robert',
        lastName: 'Dupont',
        relationship: 'Père',
        phone: '+509 9876 5432',
        email: 'robert.dupont@email.com',
        address: '123 Rue de la Paix, Port-au-Prince'
      });

      addGuardian({
        id: 'guardian-2',
        studentId: 'student-2',
        firstName: 'Anne',
        lastName: 'Joseph',
        relationship: 'Mère',
        phone: '+509 9876 5433',
        email: 'anne.joseph@email.com',
        address: '456 Avenue des Fleurs, Cap-Haïtien'
      });
    }

    // Ajouter des notes de démonstration
    addGrade({
      id: 'grade-1',
      studentId: 'student-1',
      ueId: 'ue-1',
      grade: 15.5,
      status: 'Validé',
      session: 'Normale',
      semester: 'S1',
      academicYear: '2023-2024'
    });

    addGrade({
      id: 'grade-2',
      studentId: 'student-1',
      ueId: 'ue-2',
      grade: 8.5,
      status: 'À reprendre',
      session: 'Normale',
      semester: 'S1',
      academicYear: '2023-2024'
    });
  }, [students.length, enrollments.length, ues.length, users.length, faculties.length, guardians.length]);
};
