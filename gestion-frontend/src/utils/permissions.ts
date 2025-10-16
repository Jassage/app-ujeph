// src/utils/permissions.ts
export const PermissionService = {
  // Vérifier si l'utilisateur peut accéder à une ressource
  canAccessResource(
    userRole: string,
    resourceFacultyId: string,
    userFacultyId?: string
  ): boolean {
    if (userRole === "Admin") return true;
    if (userRole === "Doyen" && userFacultyId) {
      return resourceFacultyId === userFacultyId;
    }
    return false;
  },

  // Obtenir les modules accessibles selon le rôle
  getAccessibleModules(userRole: string): string[] {
    const baseModules = ["dashboard", "settings"];

    switch (userRole) {
      case "Admin":
        return [
          ...baseModules,
          "students",
          "courses",
          "professeurs",
          "grades",
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
      case "Secretaire":
        return [...baseModules, "students", "courses", "payments"];
      default:
        return baseModules;
    }
  },
};
