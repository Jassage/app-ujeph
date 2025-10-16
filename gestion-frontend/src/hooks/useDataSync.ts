// Hook pour synchroniser les données avec MongoDB
// Ce hook gère le chargement initial et la synchronisation

import { useEffect, useState } from 'react';
import { useAcademicStore } from '../store/academicStore';
import { apiService } from '../services/api';
import { 
  mockFaculties, 
  mockUsers, 
  mockStudents, 
  mockEnrollments, 
  mockUEs, 
  mockGuardians, 
  mockGrades 
} from '../data/mockData';

export const useDataSync = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    students,
    faculties,
    users,
    enrollments,
    ues,
    guardians,
    grades,
    addStudent,
    addFaculty,
    addUser,
    addEnrollment,
    addUE,
    addGuardian,
    addGrade
  } = useAcademicStore();

  // Fonction pour charger les données depuis l'API (ou mock)
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Pour le moment, on charge les données mock
      // Plus tard, on remplacera par des appels API MongoDB
      await loadMockData();
      
      // Future implémentation MongoDB:
      // const [facultiesRes, usersRes, studentsRes] = await Promise.all([
      //   apiService.getFaculties(),
      //   apiService.getUsers(),
      //   apiService.getStudents()
      // ]);
      
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données mock (temporaire)
  const loadMockData = async () => {
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 500));

    // Charger les facultés
    if (faculties.length === 0) {
      mockFaculties.forEach(faculty => addFaculty(faculty));
    }

    // Charger les utilisateurs
    if (users.length === 0) {
      mockUsers.forEach(user => addUser(user));
    }

    // Charger les étudiants
    if (students.length === 0) {
      mockStudents.forEach(student => addStudent(student));
    }

    // Charger les immatriculations
    if (enrollments.length === 0) {
      mockEnrollments.forEach(enrollment => addEnrollment(enrollment));
    }

    // Charger les UEs
    if (ues.length === 0) {
      mockUEs.forEach(ue => addUE(ue));
    }

    // Charger les tuteurs
    if (guardians.length === 0) {
      mockGuardians.forEach(guardian => addGuardian(guardian));
    }

    // Charger les notes
    if (grades.length === 0) {
      mockGrades.forEach(grade => addGrade(grade));
    }
  };

  // Synchroniser avec MongoDB (future implémentation)
  const syncWithMongoDB = async () => {
    try {
      // Future implémentation pour synchroniser les changements locaux avec MongoDB
      console.log('Synchronisation avec MongoDB (à implémenter)');
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  // Charger les données au démarrage
  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    isLoading,
    error,
    loadInitialData,
    syncWithMongoDB
  };
};