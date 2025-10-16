// src/middleware/deanPermissions.ts
import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

export const deanPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user || user.role !== "Doyen") {
      return next();
    }

    // Récupérer la faculté dont l'utilisateur est le doyen
    const faculty = await prisma.faculty.findFirst({
      where: {
        deanId: user.id,
      },
    });

    if (!faculty) {
      return res.status(403).json({
        message: "Aucune faculté associée à votre compte de doyen",
      });
    }

    // Ajouter les informations de faculté à la requête
    (req as any).facultyId = faculty.id;
    (req as any).faculty = faculty;

    next();
  } catch (error: any) {
    res.status(500).json({ message: "Erreur de vérification des permissions" });
  }
};

export const checkDeanAccess = (
  resourceType: "student" | "faculty" | "user" | "enrollment"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const facultyId = (req as any).facultyId;

    if (!user || user.role !== "Doyen") {
      return next();
    }

    try {
      let hasAccess = false;

      switch (resourceType) {
        case "student":
          const studentId = req.params.id;
          if (studentId) {
            // Vérifier si l'étudiant est inscrit dans la faculté du doyen
            const enrollment = await prisma.enrollment.findFirst({
              where: {
                studentId: studentId,
                facultyId: facultyId,
                status: "Active",
              },
            });
            hasAccess = !!enrollment;
          } else {
            hasAccess = true; // Pour les listes, le filtrage se fait dans le controller
          }
          break;

        case "faculty":
          const targetFacultyId = req.params.id;
          hasAccess = targetFacultyId === facultyId;
          break;

        case "user":
          // Les doyens ne peuvent voir que les utilisateurs de leur faculté
          const targetUserId = req.params.id;
          if (targetUserId) {
            const targetUser = await prisma.user.findUnique({
              where: { id: targetUserId },
              include: {
                student: {
                  include: {
                    enrollments: {
                      where: { facultyId: facultyId },
                    },
                  },
                },
                professeur: {
                  include: {
                    assignments: {
                      where: { facultyId: facultyId },
                    },
                  },
                },
              },
            });

            // L'utilisateur a accès s'il est lié à la faculté via student ou professeur
            hasAccess = !!(
              targetUser?.student?.enrollments?.length ||
              targetUser?.professeur?.assignments?.length
            );
          } else {
            hasAccess = true; // Pour les listes, le filtrage se fait dans le controller
          }
          break;

        case "enrollment":
          const enrollmentId = req.params.id;
          if (enrollmentId) {
            const enrollment = await prisma.enrollment.findFirst({
              where: {
                id: enrollmentId,
                facultyId: facultyId,
              },
            });
            hasAccess = !!enrollment;
          } else {
            hasAccess = true;
          }
          break;
      }

      if (!hasAccess) {
        return res.status(403).json({
          message: "Accès non autorisé à cette ressource",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Erreur de vérification d'accès" });
    }
  };
};
