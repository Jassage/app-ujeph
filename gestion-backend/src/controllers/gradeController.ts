import { Request, Response } from "express";
import prisma from "../prisma";
import { GradeSession, GradeStatus } from "../../generated/prisma";
import { createAuditLog } from "./auditController";

// ==================== TYPES ET INTERFACES ====================
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
    cause?: string;
  };
}

interface GradeCreateData {
  studentId: string;
  ueId: string;
  grade: number;
  status?: GradeStatus;
  session?: GradeSession;
  semester: string;
  level: string;
  academicYearId: string;
  professeurId?: string;
}

interface GradeUpdateData {
  grade?: number;
  status?: GradeStatus;
  session?: GradeSession;
  isRetake?: boolean;
  [key: string]: any;
}

// ==================== FONCTIONS UTILITAIRES ====================
// Fonction utilitaire pour gérer les erreurs unknown
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  } else {
    return "Erreur inconnue";
  }
};

function isPrismaError(error: unknown): error is PrismaError {
  return error instanceof Error && "code" in error;
}

function calculateGradeStatus(
  grade: number,
  passingGrade: number
): GradeStatus {
  if (grade >= passingGrade) {
    return GradeStatus.Valid_;
  } else if (grade >= passingGrade * 0.7) {
    return GradeStatus.reprendre;
  } else {
    return GradeStatus.Non_valid_;
  }
}

function validateGradeInput(grade: number): {
  isValid: boolean;
  error?: string;
} {
  if (isNaN(grade) || grade < 0 || grade > 100) {
    return {
      isValid: false,
      error: "La note doit être un nombre entre 0 et 100",
    };
  }

  const decimalPlaces = grade.toString().split(".")[1]?.length || 0;
  if (decimalPlaces > 2) {
    return {
      isValid: false,
      error: "La note ne peut avoir plus de 2 décimales",
    };
  }

  return { isValid: true };
}

function validateSession(session: string): boolean {
  const validSessions = Object.values(GradeSession);
  return validSessions.includes(session as GradeSession);
}

function validateStatus(status: string): boolean {
  const validStatuses = Object.values(GradeStatus);
  return validStatuses.includes(status as GradeStatus);
}

// ==================== MIDDLEWARE DE VALIDATION ====================
const validateGradeCreation = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = [
    "studentId",
    "ueId",
    "grade",
    "academicYearId",
    "semester",
    "level",
  ];

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors.push(`Le champ ${field} est requis`);
    }
  });

  if (data.grade !== undefined) {
    const gradeValidation = validateGradeInput(Number(data.grade));
    if (!gradeValidation.isValid && gradeValidation.error) {
      errors.push(gradeValidation.error);
    }
  }

  if (data.session && !validateSession(data.session)) {
    errors.push(`Session invalide: ${data.session}`);
  }

  if (data.status && !validateStatus(data.status)) {
    errors.push(`Statut invalide: ${data.status}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ==================== GESTIONNAIRE D'ERREURS UNIFIÉ ====================
const handleControllerError = (
  error: unknown,
  res: Response,
  context: string,
  auditData: any
) => {
  console.error(`Error in ${context}:`, error);

  let statusCode = 500;
  let errorMessage = `Erreur lors de ${context}`;
  let details: string | undefined;

  if (isPrismaError(error)) {
    switch (error.code) {
      case "P2002":
        statusCode = 409;
        errorMessage = "Une contrainte d'unicité a été violée";
        const target = error.meta?.target;
        if (Array.isArray(target)) {
          details = target.join(", ");
        } else if (typeof target === "string") {
          details = target;
        } else {
          details = "Combinaison déjà existante";
        }
        break;
      case "P2003":
        statusCode = 404;
        errorMessage = "Référence étrangère non trouvée";
        break;
      case "P2025":
        statusCode = 404;
        errorMessage = "Enregistrement non trouvé";
        break;
      default:
        errorMessage = `Erreur base de données: ${error.message}`;
        break;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Log d'erreur d'audit
  createAuditLog({
    ...auditData,
    action: `${auditData.action}_ERROR`,
    description: `Erreur lors de ${context}`,
    status: "ERROR",
    errorMessage: errorMessage,
  });

  const response: any = { error: errorMessage };
  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === "development") {
    response.debug = getErrorMessage(error);
    if (isPrismaError(error) && error.meta) {
      response.meta = error.meta;
    }
  }

  res.status(statusCode).json(response);
};

// ==================== CONTRÔLEURS ====================
export const getAllGrades = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const {
      studentId,
      ueId,
      academicYearId,
      semester,
      level,
      session,
      status,
    } = req.query;

    console.log("🔍 GET All Grades - Query params:", req.query);

    const whereClause: any = { isActive: true };

    // Filtres de base
    if (studentId) whereClause.studentId = studentId as string;
    if (ueId) whereClause.ueId = ueId as string;
    if (academicYearId) whereClause.academicYearId = academicYearId as string;
    if (semester) whereClause.semester = semester as string;
    if (level) whereClause.level = level as string;

    // Filtres avec validation
    if (session) {
      if (validateSession(session as string)) {
        whereClause.session = session as GradeSession;
      } else {
        await createAuditLog({
          ...auditData,
          action: "GET_GRADES_LIST_ATTEMPT",
          entity: "Grade",
          description: "Tentative de récupération des notes - session invalide",
          status: "ERROR",
        });
        return res.status(400).json({
          error: "Session invalide",
          validSessions: Object.values(GradeSession),
        });
      }
    }

    if (status) {
      if (validateStatus(status as string)) {
        whereClause.status = status as GradeStatus;
      } else {
        await createAuditLog({
          ...auditData,
          action: "GET_GRADES_LIST_ATTEMPT",
          entity: "Grade",
          description: "Tentative de récupération des notes - statut invalide",
          status: "ERROR",
        });
        return res.status(400).json({
          error: "Statut invalide",
          validStatuses: Object.values(GradeStatus),
        });
      }
    }

    console.log("🔍 WHERE clause:", JSON.stringify(whereClause, null, 2));

    // Requête principale avec les filtres
    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        ue: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true,
            passingGrade: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
      },
      orderBy: [
        { academicYearId: "desc" },
        { semester: "desc" },
        { createdAt: "desc" },
      ],
    });

    console.log("🔍 Main query result:", grades.length, "grades found");

    // Log de consultation réussie
    await createAuditLog({
      ...auditData,
      action: "GET_GRADES_LIST_SUCCESS",
      entity: "Grade",
      description: `Consultation de la liste des notes - ${grades.length} note(s) trouvée(s)`,
      status: "SUCCESS",
    });

    res.json({
      count: grades.length,
      grades,
      debug: {
        queryParams: req.query,
        whereClause,
      },
    });
  } catch (error) {
    console.error("❌ Error in getAllGrades:", error);
    handleControllerError(error, res, "la récupération des notes", {
      ...auditData,
      action: "GET_GRADES_LIST",
    });
  }
};

export const getGradeById = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "GET_GRADE_DETAILS_ATTEMPT",
        entity: "Grade",
        description: "Tentative de consultation de note - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({ error: "ID de la note requis" });
    }

    const grade = await prisma.grade.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        ue: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true,
            passingGrade: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
      },
    });

    if (!grade) {
      await createAuditLog({
        ...auditData,
        action: "GET_GRADE_DETAILS_ATTEMPT",
        entity: "Grade",
        entityId: id,
        description: "Tentative de consultation de note - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({ error: "Note non trouvée" });
    }

    // Log de consultation réussie
    await createAuditLog({
      ...auditData,
      action: "GET_GRADE_DETAILS_SUCCESS",
      entity: "Grade",
      entityId: id,
      description: `Consultation de la note ${id} pour l'étudiant ${grade.student?.firstName} ${grade.student?.lastName}`,
      status: "SUCCESS",
    });

    res.json(grade);
  } catch (error) {
    handleControllerError(error, res, "la récupération de la note", {
      ...auditData,
      action: "GET_GRADE_DETAILS",
    });
  }
};

export const createGrade = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const gradeData: GradeCreateData = req.body;

    console.log("📝 Create Grade Request:", gradeData);

    // Validation des données
    const validation = validateGradeCreation(gradeData);
    if (!validation.isValid) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_GRADE_ATTEMPT",
        entity: "Grade",
        description: "Tentative de création de note - données invalides",
        status: "ERROR",
        errorMessage: validation.errors.join(", "),
      });
      return res.status(400).json({
        error: "Données invalides",
        details: validation.errors,
      });
    }

    const numericGrade = parseFloat(gradeData.grade.toString());

    // Vérifications d'existence des entités liées
    const [student, ue, academicYear] = await Promise.all([
      prisma.student.findUnique({ where: { id: gradeData.studentId } }),
      prisma.ue.findUnique({
        where: { id: gradeData.ueId },
        select: { id: true, passingGrade: true, code: true, title: true },
      }),
      prisma.academicYear.findUnique({
        where: { id: gradeData.academicYearId },
      }),
    ]);

    if (!student) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_GRADE_ATTEMPT",
        entity: "Grade",
        description: `Tentative de création de note - étudiant ${gradeData.studentId} non trouvé`,
        status: "ERROR",
      });
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }
    if (!ue) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_GRADE_ATTEMPT",
        entity: "Grade",
        description: `Tentative de création de note - UE ${gradeData.ueId} non trouvée`,
        status: "ERROR",
      });
      return res.status(404).json({ error: "Cours non trouvée" });
    }
    if (!academicYear) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_GRADE_ATTEMPT",
        entity: "Grade",
        description: `Tentative de création de note - année académique ${gradeData.academicYearId} non trouvée`,
        status: "ERROR",
      });
      return res.status(404).json({ error: "Année académique non trouvée" });
    }

    // Déterminer la session finale
    const finalSession = gradeData.session || GradeSession.Normale;

    // Vérifier l'unicité en fonction de la session
    const existingGrade = await prisma.grade.findFirst({
      where: {
        studentId: gradeData.studentId,
        ueId: gradeData.ueId,
        academicYearId: gradeData.academicYearId,
        semester: gradeData.semester,
        session: finalSession,
        isActive: finalSession === GradeSession.Normale ? true : undefined,
      },
    });

    if (existingGrade) {
      console.log("⚠️ Grade already exists:", existingGrade);

      if (finalSession === GradeSession.Normale) {
        // Pour la session normale, on ne peut avoir qu'une note active
        if (existingGrade.isActive === false) {
          console.log("🔄 Reactivating inactive normal grade");

          const updatedGrade = await prisma.grade.update({
            where: { id: existingGrade.id },
            data: {
              grade: numericGrade,
              status:
                gradeData.status ||
                calculateGradeStatus(numericGrade, ue.passingGrade),
              session: GradeSession.Normale,
              isActive: true,
              updatedAt: new Date(),
            },
            include: {
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                  studentId: true,
                },
              },
              ue: {
                select: {
                  code: true,
                  title: true,
                  passingGrade: true,
                },
              },
              academicYear: {
                select: {
                  year: true,
                },
              },
            },
          });

          // Log de réactivation
          await createAuditLog({
            ...auditData,
            action: "REACTIVATE_GRADE_SUCCESS",
            entity: "Grade",
            entityId: existingGrade.id,
            description: `Note réactivée et mise à jour pour l'étudiant ${student.firstName} ${student.lastName} en ${ue.code}`,
            status: "SUCCESS",
          });

          return res.status(200).json({
            message: "Note réactivée et mise à jour avec succès",
            grade: updatedGrade,
          });
        }

        // Note normale active existe déjà
        await createAuditLog({
          ...auditData,
          action: "CREATE_GRADE_ATTEMPT",
          entity: "Grade",
          description: `Tentative de création de note - note normale déjà existante pour l'étudiant ${student.firstName} ${student.lastName} en ${ue.code}`,
          status: "ERROR",
        });

        return res.status(409).json({
          error: "Une note de session normale existe déjà",
          existingGrade: {
            id: existingGrade.id,
            grade: existingGrade.grade,
            status: existingGrade.status,
            session: existingGrade.session,
          },
          suggestions: [
            "Utilisez PUT /grades/:id pour mettre à jour la note existante",
            "Utilisez PUT /grades/:id avec isRetake=true pour créer une note de reprise",
          ],
        });
      } else {
        // Pour les reprises, on peut mettre à jour la note existante
        console.log("🔄 Updating existing retake grade");

        const updatedGrade = await prisma.grade.update({
          where: { id: existingGrade.id },
          data: {
            grade: numericGrade,
            status:
              gradeData.status ||
              calculateGradeStatus(numericGrade, ue.passingGrade),
            updatedAt: new Date(),
          },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
            ue: {
              select: {
                code: true,
                title: true,
                passingGrade: true,
              },
            },
            academicYear: {
              select: {
                year: true,
              },
            },
          },
        });

        // Log de mise à jour de reprise
        await createAuditLog({
          ...auditData,
          action: "UPDATE_RETAKE_GRADE_SUCCESS",
          entity: "Grade",
          entityId: existingGrade.id,
          description: `Note de reprise mise à jour pour l'étudiant ${student.firstName} ${student.lastName} en ${ue.code}`,
          status: "SUCCESS",
        });

        return res.status(200).json({
          message: "Note de reprise mise à jour avec succès",
          grade: updatedGrade,
        });
      }
    }

    // Calcul du statut automatique si non fourni
    const finalStatus =
      gradeData.status || calculateGradeStatus(numericGrade, ue.passingGrade);

    console.log("✅ Creating new grade with:", {
      studentId: gradeData.studentId,
      ueId: gradeData.ueId,
      grade: numericGrade,
      status: finalStatus,
      session: finalSession,
    });

    const newGrade = await prisma.grade.create({
      data: {
        studentId: gradeData.studentId,
        ueId: gradeData.ueId,
        grade: numericGrade,
        status: finalStatus,
        session: finalSession,
        semester: gradeData.semester,
        level: gradeData.level,
        academicYearId: gradeData.academicYearId,
        isActive: true,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        ue: {
          select: {
            code: true,
            title: true,
            passingGrade: true,
          },
        },
        academicYear: {
          select: {
            year: true,
          },
        },
      },
    });

    console.log("🎉 Grade created successfully:", newGrade.id);

    // Log de création réussie
    await createAuditLog({
      ...auditData,
      action: "CREATE_GRADE_SUCCESS",
      entity: "Grade",
      entityId: newGrade.id,
      description: `Nouvelle note créée pour l'étudiant ${student.firstName} ${student.lastName} en ${ue.code}: ${numericGrade}/100 (${finalStatus})`,
      status: "SUCCESS",
    });

    res.status(201).json({
      message: "Note créée avec succès",
      grade: newGrade,
    });
  } catch (error) {
    console.error("❌ Error in createGrade:", error);
    handleControllerError(error, res, "la création de la note", {
      ...auditData,
      action: "CREATE_GRADE",
    });
  }
};

export const updateGrade = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("📝 Update Grade Request:", { id, updateData });

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "UPDATE_GRADE_ATTEMPT",
        entity: "Grade",
        description: "Tentative de mise à jour de note - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({ error: "ID de la note requis" });
    }

    // Vérifier si la note existe
    const existingGrade = await prisma.grade.findUnique({
      where: { id },
      include: {
        ue: {
          select: {
            passingGrade: true,
          },
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
    });

    if (!existingGrade) {
      console.log("❌ Grade not found:", id);
      await createAuditLog({
        ...auditData,
        action: "UPDATE_GRADE_ATTEMPT",
        entity: "Grade",
        entityId: id,
        description: "Tentative de mise à jour de note - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({ error: "Note non trouvée" });
    }

    // Validation de la nouvelle note si fournie
    if (updateData.grade !== undefined) {
      const gradeValue = Number(updateData.grade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
        await createAuditLog({
          ...auditData,
          action: "UPDATE_GRADE_ATTEMPT",
          entity: "Grade",
          entityId: id,
          description: "Tentative de mise à jour de note - note invalide",
          status: "ERROR",
        });
        return res
          .status(400)
          .json({ error: "La note doit être entre 0 et 100" });
      }
    }

    // Gestion des reprises
    if (updateData.isRetake) {
      console.log("🔄 Creating retake grade for:", id);

      // Vérifier s'il existe déjà une note de reprise pour cette combinaison
      const existingRetake = await prisma.grade.findFirst({
        where: {
          studentId: existingGrade.studentId,
          ueId: existingGrade.ueId,
          academicYearId: existingGrade.academicYearId,
          semester: existingGrade.semester,
          session: "Reprise",
          isActive: true,
        },
      });

      if (existingRetake) {
        await createAuditLog({
          ...auditData,
          action: "CREATE_RETAKE_ATTEMPT",
          entity: "Grade",
          entityId: id,
          description: `Tentative de création de reprise - note de reprise déjà existante pour l'étudiant ${existingGrade.student?.firstName} ${existingGrade.student?.lastName}`,
          status: "ERROR",
        });
        return res.status(409).json({
          error: "Une note de reprise existe déjà pour cette UE",
          existingRetake: {
            id: existingRetake.id,
            grade: existingRetake.grade,
            status: existingRetake.status,
          },
          suggestions: [
            "Mettez à jour la note de reprise existante",
            "Supprimez d'abord la note de reprise existante",
          ],
        });
      }

      // Désactiver l'ancienne note (si elle est active)
      if (existingGrade.isActive) {
        await prisma.grade.update({
          where: { id },
          data: { isActive: false },
        });
      }

      // Calculer le nouveau statut
      const newGradeValue =
        updateData.grade !== undefined
          ? Number(updateData.grade)
          : existingGrade.grade;

      const newStatus = calculateGradeStatus(
        newGradeValue,
        existingGrade.ue.passingGrade
      );

      // Créer une nouvelle note pour la reprise
      const retakeGrade = await prisma.grade.create({
        data: {
          studentId: existingGrade.studentId,
          ueId: existingGrade.ueId,
          grade: newGradeValue,
          status: newStatus,
          session: "Reprise",
          semester: existingGrade.semester,
          level: existingGrade.level,
          academicYearId: existingGrade.academicYearId,
          isActive: true,
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
          ue: {
            select: {
              code: true,
              title: true,
            },
          },
        },
      });

      console.log("✅ Retake grade created:", retakeGrade.id);

      // Log de création de reprise réussie
      await createAuditLog({
        ...auditData,
        action: "CREATE_RETAKE_SUCCESS",
        entity: "Grade",
        entityId: retakeGrade.id,
        description: `Note de reprise créée pour l'étudiant ${existingGrade.student?.firstName} ${existingGrade.student?.lastName}: ${newGradeValue}/100 (${newStatus})`,
        status: "SUCCESS",
      });

      return res.json({
        message: "Note de reprise créée avec succès",
        grade: retakeGrade,
        previousGrade: {
          id: existingGrade.id,
          grade: existingGrade.grade,
          session: existingGrade.session,
          status: existingGrade.status,
        },
      });
    }

    // Mise à jour normale
    const updatePayload: any = { ...updateData };

    // Recalculer le statut si la note change
    if (updateData.grade !== undefined) {
      updatePayload.status = calculateGradeStatus(
        Number(updateData.grade),
        existingGrade.ue.passingGrade
      );
    }

    // Ne pas permettre la modification de certaines propriétés
    delete updatePayload.studentId;
    delete updatePayload.ueId;
    delete updatePayload.academicYearId;
    delete updatePayload.semester;
    delete updatePayload.isRetake;

    console.log("📤 Update payload:", updatePayload);

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: updatePayload,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        ue: {
          select: {
            code: true,
            title: true,
            passingGrade: true,
          },
        },
      },
    });

    console.log("✅ Grade updated successfully:", updatedGrade.id);

    // Log de mise à jour réussie
    await createAuditLog({
      ...auditData,
      action: "UPDATE_GRADE_SUCCESS",
      entity: "Grade",
      entityId: id,
      description: `Note mise à jour pour l'étudiant ${existingGrade.student?.firstName} ${existingGrade.student?.lastName}: ${updatedGrade.grade}/100 (${updatedGrade.status})`,
      status: "SUCCESS",
    });

    res.json({
      message: "Note mise à jour avec succès",
      grade: updatedGrade,
    });
  } catch (error) {
    console.error("❌ Error in updateGrade:", error);
    handleControllerError(error, res, "la mise à jour de la note", {
      ...auditData,
      action: "UPDATE_GRADE",
    });
  }
};

export const deleteGrade = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;

    if (!id) {
      await createAuditLog({
        ...auditData,
        action: "DELETE_GRADE_ATTEMPT",
        entity: "Grade",
        description: "Tentative de suppression de note - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({ error: "ID de la note requis" });
    }

    // Vérifier si la note existe
    const existingGrade = await prisma.grade.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        ue: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });

    if (!existingGrade) {
      await createAuditLog({
        ...auditData,
        action: "DELETE_GRADE_ATTEMPT",
        entity: "Grade",
        entityId: id,
        description: "Tentative de suppression de note - non trouvée",
        status: "ERROR",
      });
      return res.status(404).json({ error: "Note non trouvée" });
    }

    // Soft delete (désactivation) au lieu de suppression physique
    await prisma.grade.update({
      where: { id },
      data: { isActive: false },
    });

    // Log de suppression réussie
    await createAuditLog({
      ...auditData,
      action: "DELETE_GRADE_SUCCESS",
      entity: "Grade",
      entityId: id,
      description: `Note supprimée pour l'étudiant ${existingGrade.student?.firstName} ${existingGrade.student?.lastName} en ${existingGrade.ue?.code}`,
      status: "SUCCESS",
    });

    res.json({
      message: "Note supprimée avec succès",
      deletedGrade: {
        id: existingGrade.id,
        studentId: existingGrade.studentId,
        ueId: existingGrade.ueId,
        grade: existingGrade.grade,
        session: existingGrade.session,
      },
    });
  } catch (error) {
    handleControllerError(error, res, "la suppression de la note", {
      ...auditData,
      action: "DELETE_GRADE",
    });
  }
};

// ==================== CONTRÔLEURS SUPPLÉMENTAIRES ====================
export const getStudentGrades = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { studentId } = req.params;
    const { academicYearId, semester } = req.query;

    if (!studentId) {
      await createAuditLog({
        ...auditData,
        action: "GET_STUDENT_GRADES_ATTEMPT",
        entity: "Grade",
        description:
          "Tentative de récupération des notes d'étudiant - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({ error: "ID étudiant requis" });
    }

    const whereClause: any = {
      studentId,
      isActive: true,
    };

    if (academicYearId) whereClause.academicYearId = academicYearId as string;
    if (semester) whereClause.semester = semester as string;

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        ue: {
          select: {
            code: true,
            title: true,
            credits: true,
            passingGrade: true,
          },
        },
        academicYear: {
          select: {
            year: true,
          },
        },
      },
      orderBy: [{ academicYearId: "desc" }, { semester: "desc" }],
    });

    // Log de consultation réussie
    await createAuditLog({
      ...auditData,
      action: "GET_STUDENT_GRADES_SUCCESS",
      entity: "Grade",
      description: `Consultation des notes de l'étudiant ${studentId} - ${grades.length} note(s) trouvée(s)`,
      status: "SUCCESS",
    });

    res.json({
      studentId,
      count: grades.length,
      grades,
    });
  } catch (error) {
    handleControllerError(
      error,
      res,
      "la récupération des notes de l'étudiant",
      {
        ...auditData,
        action: "GET_STUDENT_GRADES",
      }
    );
  }
};

export const getUEGrades = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { ueId } = req.params;
    const { academicYearId, semester } = req.query;

    if (!ueId) {
      await createAuditLog({
        ...auditData,
        action: "GET_UE_GRADES_ATTEMPT",
        entity: "Grade",
        description: "Tentative de récupération des notes d'UE - ID manquant",
        status: "ERROR",
      });
      return res.status(400).json({ error: "ID UE requis" });
    }

    const whereClause: any = {
      ueId,
      isActive: true,
    };

    if (academicYearId) whereClause.academicYearId = academicYearId as string;
    if (semester) whereClause.semester = semester as string;

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        academicYear: {
          select: {
            year: true,
          },
        },
      },
      orderBy: [
        { student: { lastName: "asc" } },
        { student: { firstName: "asc" } },
      ],
    });

    // Statistiques
    const stats = {
      total: grades.length,
      valid: grades.filter((g) => g.status === GradeStatus.Valid_).length,
      reprendre: grades.filter((g) => g.status === GradeStatus.reprendre)
        .length,
      nonValid: grades.filter((g) => g.status === GradeStatus.Non_valid_)
        .length,
      average:
        grades.length > 0
          ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length
          : 0,
    };

    // Log de consultation réussie
    await createAuditLog({
      ...auditData,
      action: "GET_UE_GRADES_SUCCESS",
      entity: "Grade",
      description: `Consultation des notes de l'UE ${ueId} - ${grades.length} note(s) trouvée(s), moyenne: ${stats.average.toFixed(2)}`,
      status: "SUCCESS",
    });

    res.json({
      ueId,
      stats,
      count: grades.length,
      grades,
    });
  } catch (error) {
    handleControllerError(error, res, "la récupération des notes de l'UE", {
      ...auditData,
      action: "GET_UE_GRADES",
    });
  }
};

export const bulkCreateGrades = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).user?.id || (req as any).userId || null,
  };

  try {
    const { grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      await createAuditLog({
        ...auditData,
        action: "BULK_CREATE_GRADES_ATTEMPT",
        entity: "Grade",
        description: "Tentative de création en masse - données invalides",
        status: "ERROR",
      });
      return res.status(400).json({
        error: "Un tableau de notes est requis",
      });
    }

    // Limiter le nombre de notes par requête
    if (grades.length > 100) {
      await createAuditLog({
        ...auditData,
        action: "BULK_CREATE_GRADES_ATTEMPT",
        entity: "Grade",
        description: `Tentative de création en masse - trop de notes (${grades.length})`,
        status: "ERROR",
      });
      return res.status(400).json({
        error: "Trop de notes dans une seule requête (maximum 100)",
      });
    }

    const results = {
      success: [] as any[],
      errors: [] as any[],
    };

    // Traiter chaque note individuellement
    for (const [index, gradeData] of grades.entries()) {
      try {
        const validation = validateGradeCreation(gradeData);
        if (!validation.isValid) {
          results.errors.push({
            index,
            error: "Données invalides",
            details: validation.errors,
            data: gradeData,
          });
          continue;
        }

        // Vérifier l'existence des entités
        const [student, ue] = await Promise.all([
          prisma.student.findUnique({ where: { id: gradeData.studentId } }),
          prisma.ue.findUnique({
            where: { id: gradeData.ueId },
            select: { passingGrade: true },
          }),
        ]);

        if (!student) {
          results.errors.push({
            index,
            error: "Étudiant non trouvé",
            studentId: gradeData.studentId,
          });
          continue;
        }

        if (!ue) {
          results.errors.push({
            index,
            error: "UE non trouvée",
            ueId: gradeData.ueId,
          });
          continue;
        }

        // Vérifier l'unicité
        const existingGrade = await prisma.grade.findFirst({
          where: {
            studentId: gradeData.studentId,
            ueId: gradeData.ueId,
            academicYearId: gradeData.academicYearId,
            semester: gradeData.semester,
            session: gradeData.session || GradeSession.Normale,
            isActive: true,
          },
        });

        if (existingGrade) {
          results.errors.push({
            index,
            error: "Note déjà existante",
            existingGradeId: existingGrade.id,
          });
          continue;
        }

        // Créer la note
        const numericGrade = parseFloat(gradeData.grade.toString());
        const status =
          gradeData.status ||
          calculateGradeStatus(numericGrade, ue.passingGrade);

        const newGrade = await prisma.grade.create({
          data: {
            ...gradeData,
            grade: numericGrade,
            status,
            session: gradeData.session || GradeSession.Normale,
            isActive: true,
          },
        });

        results.success.push({
          index,
          gradeId: newGrade.id,
          studentId: newGrade.studentId,
          ueId: newGrade.ueId,
        });
      } catch (error) {
        results.errors.push({
          index,
          error: getErrorMessage(error),
          data: gradeData,
        });
      }
    }

    // Log de création en masse réussie
    await createAuditLog({
      ...auditData,
      action: "BULK_CREATE_GRADES_SUCCESS",
      entity: "Grade",
      description: `Création en masse de notes terminée - ${results.success.length} succès, ${results.errors.length} erreurs`,
      status: "SUCCESS",
    });

    res.status(201).json({
      message: `Traitement des notes terminé`,
      summary: {
        total: grades.length,
        success: results.success.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error) {
    handleControllerError(error, res, "la création des notes en masse", {
      ...auditData,
      action: "BULK_CREATE_GRADES",
    });
  }
};

export const getGradeHistory = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { studentId, ueId, academicYearId, semester } = req.params;

    console.log("🔍 getGradeHistory params:", {
      studentId,
      ueId,
      academicYearId,
      semester,
    });

    if (!studentId || !ueId || !academicYearId || !semester) {
      await createAuditLog({
        ...auditData,
        action: "GET_GRADE_HISTORY_ATTEMPT",
        entity: "Grade",
        description:
          "Tentative de consultation d'historique - paramètres manquants",
        status: "ERROR",
      });
      return res.status(400).json({
        error: "Paramètres manquants",
        required: ["studentId", "ueId", "academicYearId", "semester"],
      });
    }

    // Récupérer TOUTES les notes sans condition isActive
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        ueId,
        academicYearId,
        semester,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        ue: {
          select: {
            code: true,
            title: true,
            credits: true,
            passingGrade: true,
          },
        },
        academicYear: {
          select: {
            year: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    console.log("🔍 Grades found in DB:", grades.length);

    // Log de consultation d'historique réussie
    await createAuditLog({
      ...auditData,
      action: "GET_GRADE_HISTORY_SUCCESS",
      entity: "Grade",
      description: `Consultation de l'historique des notes pour l'étudiant ${studentId} en ${ueId} - ${grades.length} note(s) trouvée(s)`,
      status: "SUCCESS",
    });

    res.json({
      studentId,
      ueId,
      academicYearId,
      semester,
      count: grades.length,
      grades,
    });
  } catch (error) {
    console.error("❌ Error in getGradeHistory:", error);
    handleControllerError(
      error,
      res,
      "la récupération de l'historique des notes",
      {
        ...auditData,
        action: "GET_GRADE_HISTORY",
      }
    );
  }
};
