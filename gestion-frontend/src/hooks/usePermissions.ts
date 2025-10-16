// src/hooks/usePermissions.ts
import { useAuthUser } from "./useAuthUser";
import { useDeanStore } from "@/store/deanStore";
import { useEffect } from "react";

export const usePermissions = () => {
  const { user, isDoyen } = useAuthUser();
  const { faculty, fetchDeanFaculty, loading } = useDeanStore();

  // Charger la faculté du doyen si nécessaire
  useEffect(() => {
    if (isDoyen && user?.id && !faculty) {
      fetchDeanFaculty(user.id);
    }
  }, [isDoyen, user?.id, faculty, fetchDeanFaculty]);

  const hasPermission = (
    requiredPermission: string,
    resource?: any
  ): boolean => {
    // Admin a tous les accès
    if (user?.role === "Admin") return true;

    // Vérifications pour les doyens
    if (user?.role === "Doyen") {
      switch (requiredPermission) {
        case "view_faculty":
          // Un doyen ne peut voir que sa propre faculté
          return resource?.id ? resource.id === faculty?.id : true;

        case "view_students":
          // Un doyen ne peut voir que les étudiants de sa faculté
          return true; // Le filtrage se fait côté backend
        case "view_dashboard":
          return true;

        case "view_grades":
          return true;

        case "create_user":
          // Un doyen ne peut créer que des professeurs et secrétaires
          return resource?.role
            ? ["Professeur", "Secretaire"].includes(resource.role)
            : true;

        case "delete_user":
          // Un doyen ne peut pas supprimer des admins ou autres doyens
          return resource?.role
            ? !["Admin", "Doyen"].includes(resource.role)
            : false;

        default:
          return false;
      }
    }

    // Permissions pour autres rôles
    switch (user?.role) {
      case "Professeur":
        return ["view_courses", "view_students", "manage_grades"].includes(
          requiredPermission
        );

      case "Secrétaire":
        return [
          "view_students",
          "manage_enrollments",
          "view_payments",
        ].includes(requiredPermission);

      case "Directeur":
        return ["view_reports", "view_analytics"].includes(requiredPermission);

      default:
        return false;
    }
  };

  const getAccessibleModules = (): string[] => {
    const baseModules = ["dashboard", "settings", "profile"];

    switch (user?.role) {
      case "Admin":
        return [
          ...baseModules,
          "students",
          "enrollments",
          "courses",
          "professeurs",
          "grades",
          "retakes",
          "guardians",
          "expenses",
          "fees",
          "payments",
          "student-cards",
          "transcripts",
          "users",
          "faculties",
          "analytics",
          "audit-logs",
          "backup",
        ];

      case "Doyen":
        return [
          ...baseModules,
          "students",
          "courses",
          "grades",
          "schedules",
          "attendance",
          "analytics",
        ];

      case "Professeur":
        return [...baseModules, "courses", "grades", "attendance"];

      case "Secrétaire":
        return [
          ...baseModules,
          "students",
          "courses",
          "payments",
          "enrollments",
        ];

      case "Directeur":
        return [...baseModules, "analytics", "reports"];

      default:
        return baseModules;
    }
  };

  return {
    hasPermission,
    getAccessibleModules,
    faculty,
    loading,
    isDoyen,
    userRole: user?.role,
  };
};
