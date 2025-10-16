// controllers/enrollmentController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
import { z } from "zod";
import { createAuditLog } from "./auditController";

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

const getErrorName = (error: unknown): string => {
  if (error instanceof Error) {
    return error.name;
  } else {
    return "UnknownError";
  }
};

// Fonction utilitaire pour créer des logs d'audit

// Schémas de validation avec Zod
const EnrollmentCreateSchema = z.object({
  studentId: z.string().min(1, "L'ID étudiant est requis"),
  faculty: z.string().min(1, "La faculté est requise"),
  level: z.string().min(1, "Le niveau est requis"), // Accepter string
  academicYearId: z.string().min(1, "L'ID de l'année académique est requis"), // Changer le nom
  status: z.enum(["Active", "Completed", "Cancelled"]).default("Active"),
  enrollmentDate: z.string().datetime("Date d'inscription invalide").optional(),
});

const EnrollmentUpdateSchema = EnrollmentCreateSchema.partial();

export const createEnrollment = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const {
      studentId,
      faculty,
      level,
      academicYearId,
      status,
      enrollmentDate,
    } = req.body;

    console.log("📥 Données reçues pour nouvelle inscription:", req.body);

    // Log de tentative de création
    await createAuditLog({
      ...auditData,
      action: "CREATE_ENROLLMENT_ATTEMPT",
      entity: "Enrollment",
      description: "Tentative de création d'une nouvelle inscription",
      status: "SUCCESS",
      metadata: {
        studentId,
        faculty,
        level,
        academicYearId,
        status,
      },
    });

    // Valider les données avec Zod
    try {
      EnrollmentCreateSchema.parse(req.body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("❌ Erreur validation Zod:", validationError.issues);

        await createAuditLog({
          ...auditData,
          action: "CREATE_ENROLLMENT_ATTEMPT",
          entity: "Enrollment",
          description:
            "Tentative de création d'inscription - validation des données échouée",
          status: "ERROR",
          errorMessage: "Données de validation invalides",
          metadata: {
            errors: validationError.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          },
        });

        return res.status(400).json({
          error: "Données de validation invalides",
          details: validationError.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      throw validationError;
    }

    // 1. Trouver la faculté par son nom
    const facultyRecord = await prisma.faculty.findFirst({
      where: { id: faculty },
    });

    if (!facultyRecord) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_ENROLLMENT_ATTEMPT",
        entity: "Enrollment",
        description: `Tentative de création d'inscription - faculté "${faculty}" non trouvée`,
        status: "ERROR",
        metadata: { faculty },
      });

      return res.status(400).json({
        error: "Faculté non trouvée",
        details: `La faculté "${faculty}" n'existe pas`,
      });
    }

    // 2. Trouver l'année académique par son année
    const academicYearRecord = await prisma.academicYear.findFirst({
      where: { id: academicYearId },
    });

    if (!academicYearRecord) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_ENROLLMENT_ATTEMPT",
        entity: "Enrollment",
        description: `Tentative de création d'inscription - année académique "${academicYearId}" non trouvée`,
        status: "ERROR",
        metadata: { academicYearId },
      });

      return res.status(400).json({
        error: "Année académique non trouvée",
        details: `L'année académique "${academicYearId}" n'existe pas`,
      });
    }

    // 3. Vérifier si l'étudiant existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_ENROLLMENT_ATTEMPT",
        entity: "Enrollment",
        description: `Tentative de création d'inscription - étudiant avec ID ${studentId} non trouvé`,
        status: "ERROR",
        metadata: { studentId },
      });

      return res.status(400).json({
        error: "Étudiant non trouvé",
        details: `L'étudiant avec l'ID ${studentId} n'existe pas`,
      });
    }

    // 4. VALIDATION CRITIQUE : Vérifier si l'étudiant est déjà inscrit dans un niveau différent pour la même année
    const existingEnrollmentSameYear = await prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        academicYearId: academicYearRecord.id,
        NOT: {
          level: level,
        },
      },
      include: {
        academicYear: { select: { year: true } },
        faculty: { select: { name: true } },
      },
    });

    if (existingEnrollmentSameYear) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_ENROLLMENT_ATTEMPT",
        entity: "Enrollment",
        description:
          "Tentative de création d'inscription - inscription multiple interdite",
        status: "ERROR",
        errorMessage: "Inscription multiple interdite",
        metadata: {
          studentId,
          existingEnrollment: {
            faculty: existingEnrollmentSameYear.faculty.name,
            level: existingEnrollmentSameYear.level,
            academicYear: existingEnrollmentSameYear.academicYear.year,
            status: existingEnrollmentSameYear.status,
          },
        },
      });

      return res.status(400).json({
        error: "Inscription multiple interdite",
        details: `Cet étudiant est déjà inscrit en ${existingEnrollmentSameYear.level}ème année (${existingEnrollmentSameYear.faculty.name}) pour l'année académique ${existingEnrollmentSameYear.academicYear.year}. Un étudiant ne peut pas s'inscrire dans deux niveaux différents pour la même année académique.`,
        existingEnrollment: {
          faculty: existingEnrollmentSameYear.faculty.name,
          level: existingEnrollmentSameYear.level,
          academicYear: existingEnrollmentSameYear.academicYear.year,
          status: existingEnrollmentSameYear.status,
        },
      });
    }

    // 5. Vérifier si l'étudiant est déjà inscrit exactement au même niveau/faculté/année
    const existingExactEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        facultyId: facultyRecord.id,
        academicYearId: academicYearRecord.id,
        level,
      },
    });

    if (existingExactEnrollment) {
      await createAuditLog({
        ...auditData,
        action: "CREATE_ENROLLMENT_ATTEMPT",
        entity: "Enrollment",
        description:
          "Tentative de création d'inscription - inscription déjà existante",
        status: "ERROR",
        errorMessage: "Inscription déjà existante",
        metadata: {
          studentId,
          facultyId: facultyRecord.id,
          academicYearId: academicYearRecord.id,
          level,
        },
      });

      return res.status(400).json({
        error: "Inscription déjà existante",
        details:
          "Cet étudiant est déjà inscrit dans cette faculté à ce niveau pour cette année académique",
      });
    }

    // 6. VÉRIFICATION : Marquer toutes les inscriptions précédentes comme "Completed"
    const previousEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        status: "Active",
      },
    });

    console.log(
      `Inscriptions précédentes actives trouvées: ${previousEnrollments.length}`
    );

    // 7. Mettre à jour les inscriptions précédentes
    if (previousEnrollments.length > 0) {
      await prisma.enrollment.updateMany({
        where: {
          studentId: studentId,
          status: "Active",
        },
        data: {
          status: "Completed",
        },
      });
      console.log(
        `Mise à jour de ${previousEnrollments.length} inscription(s) précédente(s) en statut "Completed"`
      );
    }

    // 8. Créer la nouvelle inscription avec statut "Active"
    const newEnrollment = await prisma.enrollment.create({
      data: {
        studentId,
        facultyId: facultyRecord.id,
        level,
        academicYearId: academicYearRecord.id,
        status: "Active",
        enrollmentDate: enrollmentDate || new Date().toISOString(),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
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

    console.log("✅ Nouvelle inscription créée avec succès:", newEnrollment.id);

    // Log de succès
    await createAuditLog({
      ...auditData,
      action: "CREATE_ENROLLMENT_SUCCESS",
      entity: "Enrollment",
      entityId: newEnrollment.id,
      description: "Inscription créée avec succès",
      status: "SUCCESS",
      metadata: {
        studentId: newEnrollment.studentId,
        faculty: facultyRecord.name,
        level: newEnrollment.level,
        academicYear: academicYearRecord.year,
        previousEnrollmentsUpdated: previousEnrollments.length,
      },
    });

    res.status(201).json(newEnrollment);
  } catch (error) {
    console.error(
      "❌ Erreur détaillée lors de la création d'inscription:",
      error
    );

    const errorMessage = getErrorMessage(error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "CREATE_ENROLLMENT_ERROR",
      entity: "Enrollment",
      description: "Erreur lors de la création de l'inscription",
      status: "ERROR",
      errorMessage: errorMessage,
    });

    res.status(400).json({
      error: "Erreur lors de la création de l'inscription",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

export const updateEnrollment = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).user?.id || (req as any).userId || null,
  };

  try {
    const { id } = req.params;
    const { studentId, faculty, academicYear, ...otherData } = req.body;

    console.log(
      "📥 Requête mise à jour inscription - ID:",
      id,
      "Body:",
      req.body
    );

    // Log de tentative de mise à jour
    await createAuditLog({
      ...auditData,
      action: "UPDATE_ENROLLMENT_ATTEMPT",
      entity: "Enrollment",
      entityId: id,
      description: "Tentative de mise à jour d'inscription",
      status: "SUCCESS",
      metadata: {
        updateFields: Object.keys(req.body),
      },
    });

    // Vérifier si l'inscription existe
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!existingEnrollment) {
      await createAuditLog({
        ...auditData,
        action: "UPDATE_ENROLLMENT_ATTEMPT",
        entity: "Enrollment",
        entityId: id,
        description:
          "Tentative de mise à jour d'inscription - inscription non trouvée",
        status: "ERROR",
      });

      return res.status(404).json({ error: "Inscription non trouvée" });
    }

    const updateData: any = { ...otherData };

    // Si faculty est fourni, trouver l'ID correspondant
    if (faculty) {
      const facultyRecord = await prisma.faculty.findFirst({
        where: { id: faculty },
      });
      if (!facultyRecord) {
        await createAuditLog({
          ...auditData,
          action: "UPDATE_ENROLLMENT_ATTEMPT",
          entity: "Enrollment",
          entityId: id,
          description: `Tentative de mise à jour d'inscription - faculté "${faculty}" non trouvée`,
          status: "ERROR",
          metadata: { faculty },
        });

        return res.status(400).json({ error: "Faculté non trouvée" });
      }
      updateData.facultyId = facultyRecord.id;
    }

    // Si academicYear est fourni, trouver l'ID correspondant
    if (academicYear) {
      const academicYearRecord = await prisma.academicYear.findFirst({
        where: { year: academicYear },
      });
      if (!academicYearRecord) {
        await createAuditLog({
          ...auditData,
          action: "UPDATE_ENROLLMENT_ATTEMPT",
          entity: "Enrollment",
          entityId: id,
          description: `Tentative de mise à jour d'inscription - année académique "${academicYear}" non trouvée`,
          status: "ERROR",
          metadata: { academicYear },
        });

        return res.status(400).json({ error: "Année académique non trouvée" });
      }
      updateData.academicYearId = academicYearRecord.id;
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        faculty: {
          select: {
            name: true,
          },
        },
        academicYear: {
          select: {
            year: true,
          },
        },
      },
    });

    console.log("✅ Inscription mise à jour avec succès:", id);

    // Log de succès
    await createAuditLog({
      ...auditData,
      action: "UPDATE_ENROLLMENT_SUCCESS",
      entity: "Enrollment",
      entityId: id,
      description: "Inscription mise à jour avec succès",
      status: "SUCCESS",
      metadata: {
        updatedFields: Object.keys(updateData),
        studentId: updatedEnrollment.studentId,
      },
    });

    res.json(updatedEnrollment);
  } catch (error) {
    console.error("❌ Erreur mise à jour inscription:", error);

    const errorMessage = getErrorMessage(error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "UPDATE_ENROLLMENT_ERROR",
      entity: "Enrollment",
      entityId: req.params.id,
      description: "Erreur lors de la mise à jour de l'inscription",
      status: "ERROR",
      errorMessage: errorMessage,
    });

    res.status(400).json({
      error: "Erreur lors de la mise à jour",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

export const getAllEnrollments = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentId: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transformer les données pour le frontend
    const transformedEnrollments = enrollments.map((enrollment) => ({
      ...enrollment,
      faculty: enrollment.faculty?.name || "",
      academicYear: enrollment.academicYear?.year || "",
    }));

    // Log de consultation
    await createAuditLog({
      ...auditData,
      action: "GET_ALL_ENROLLMENTS",
      entity: "Enrollment",
      description: "Consultation de la liste de toutes les inscriptions",
      status: "SUCCESS",
      metadata: {
        count: enrollments.length,
      },
    });

    res.json(transformedEnrollments);
  } catch (error) {
    console.error("❌ Erreur récupération inscriptions:", error);

    const errorMessage = getErrorMessage(error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "GET_ALL_ENROLLMENTS_ERROR",
      entity: "Enrollment",
      description:
        "Erreur lors de la récupération de la liste des inscriptions",
      status: "ERROR",
      errorMessage: errorMessage,
    });

    res.status(500).json({
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { id } = req.params;

    console.log("🗑️ Tentative de suppression inscription:", id);

    // Vérifier si l'inscription existe
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        faculty: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingEnrollment) {
      await createAuditLog({
        ...auditData,
        action: "DELETE_ENROLLMENT_ATTEMPT",
        entity: "Enrollment",
        entityId: id,
        description: "Tentative de suppression d'inscription - non trouvée",
        status: "ERROR",
      });

      return res.status(404).json({ error: "Inscription non trouvée" });
    }

    await prisma.enrollment.delete({
      where: { id },
    });

    console.log("✅ Inscription supprimée avec succès:", id);

    // Log de suppression réussie
    await createAuditLog({
      ...auditData,
      action: "DELETE_ENROLLMENT_SUCCESS",
      entity: "Enrollment",
      entityId: id,
      description: "Inscription supprimée avec succès",
      status: "SUCCESS",
      metadata: {
        studentId: existingEnrollment.student.studentId,
        studentName: `${existingEnrollment.student.firstName} ${existingEnrollment.student.lastName}`,
        faculty: existingEnrollment.faculty.name,
        level: existingEnrollment.level,
        status: existingEnrollment.status,
      },
    });

    res.json({ message: "Inscription supprimée avec succès" });
  } catch (error) {
    console.error("❌ Erreur suppression inscription:", error);

    const errorMessage = getErrorMessage(error);

    // Log d'erreur de suppression
    await createAuditLog({
      ...auditData,
      action: "DELETE_ENROLLMENT_ERROR",
      entity: "Enrollment",
      entityId: req.params.id,
      description: "Erreur lors de la suppression de l'inscription",
      status: "ERROR",
      errorMessage: errorMessage,
    });

    res.status(500).json({
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

// Fonction utilitaire pour s'assurer qu'un étudiant n'a qu'une seule inscription active
export const ensureSingleActiveEnrollment = async (
  studentId: string
): Promise<void> => {
  const activeEnrollments = await prisma.enrollment.findMany({
    where: {
      studentId: studentId,
      status: "Active",
    },
  });

  // S'il y a plus d'une inscription active, garder la plus récente
  if (activeEnrollments.length > 1) {
    // Trier par date d'inscription (la plus récente en premier)
    const sortedEnrollments = activeEnrollments.sort(
      (a, b) =>
        new Date(b.enrollmentDate).getTime() -
        new Date(a.enrollmentDate).getTime()
    );

    // Garder la première (plus récente) et marquer les autres comme "Completed"
    const enrollmentsToUpdate = sortedEnrollments.slice(1);

    for (const enrollment of enrollmentsToUpdate) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "Completed",
        },
      });
    }

    console.log(
      `Mise à jour de ${enrollmentsToUpdate.length} inscription(s) pour l'étudiant ${studentId}`
    );
  }
};

export const fixEnrollmentStatuses = async (req: Request, res: Response) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const studentId = req.params.studentId;

    // Log de début de correction
    await createAuditLog({
      ...auditData,
      action: "FIX_ENROLLMENT_STATUSES_START",
      entity: "Enrollment",
      description: "Début de la correction des statuts d'inscription",
      status: "SUCCESS",
      metadata: {
        studentId: studentId || "all",
      },
    });

    if (studentId) {
      console.log(`🔧 Vérification des statuts pour l'étudiant: ${studentId}`);
      await ensureSingleActiveEnrollment(studentId);

      const result = await prisma.enrollment.findMany({
        where: { studentId },
        select: { id: true, status: true, academicYear: true, level: true },
      });

      // Log de correction pour un étudiant spécifique
      await createAuditLog({
        ...auditData,
        action: "FIX_ENROLLMENT_STATUSES_COMPLETE",
        entity: "Enrollment",
        description: `Correction des statuts d'inscription pour l'étudiant ${studentId}`,
        status: "SUCCESS",
        metadata: {
          studentId,
          enrollmentsCount: result.length,
          enrollments: result,
        },
      });

      return res.json({
        message: `Statuts vérifiés pour l'étudiant ${studentId}`,
        enrollments: result,
      });
    }

    // Vérifier tous les étudiants si aucun ID spécifique
    console.log("🔧 Vérification des statuts pour tous les étudiants...");
    const allStudents = await prisma.student.findMany();
    let fixedCount = 0;
    let studentsChecked = 0;

    for (const student of allStudents) {
      const beforeCount = (
        await prisma.enrollment.findMany({
          where: { studentId: student.id, status: "Active" },
        })
      ).length;

      await ensureSingleActiveEnrollment(student.id);

      const afterCount = (
        await prisma.enrollment.findMany({
          where: { studentId: student.id, status: "Active" },
        })
      ).length;

      if (beforeCount !== afterCount) {
        fixedCount++;
        console.log(
          `Corrigé étudiant ${student.firstName} ${student.lastName}: ${beforeCount} → ${afterCount} inscription(s) active(s)`
        );
      }

      studentsChecked++;
    }

    // Log de correction globale
    await createAuditLog({
      ...auditData,
      action: "FIX_ENROLLMENT_STATUSES_COMPLETE",
      entity: "Enrollment",
      description:
        "Correction des statuts d'inscription pour tous les étudiants",
      status: "SUCCESS",
      metadata: {
        studentsChecked,
        fixedCount,
        successRate: `${(((studentsChecked - fixedCount) / studentsChecked) * 100).toFixed(2)}%`,
      },
    });

    res.json({
      message: `Statuts vérifiés pour ${studentsChecked} étudiants, ${fixedCount} corrigés`,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification des statuts:", error);

    const errorMessage = getErrorMessage(error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "FIX_ENROLLMENT_STATUSES_ERROR",
      entity: "Enrollment",
      description: "Erreur lors de la correction des statuts d'inscription",
      status: "ERROR",
      errorMessage: errorMessage,
    });

    res.status(500).json({
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

// Fonction spécifique pour un étudiant
export const fixStudentEnrollmentStatus = async (
  req: Request,
  res: Response
) => {
  const auditData = {
    ipAddress: req.ip || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    userId: (req as any).userId || "unknown",
  };

  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: "ID étudiant requis" });
    }

    // Vérifier que l'étudiant existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      await createAuditLog({
        ...auditData,
        action: "FIX_STUDENT_ENROLLMENT_STATUS_ATTEMPT",
        entity: "Enrollment",
        description: `Tentative de correction des statuts - étudiant ${studentId} non trouvé`,
        status: "ERROR",
        metadata: { studentId },
      });

      return res.status(404).json({ error: "Étudiant non trouvé" });
    }

    console.log(
      `🔧 Correction des statuts pour l'étudiant: ${student.firstName} ${student.lastName}`
    );

    // Appliquer la correction
    await ensureSingleActiveEnrollment(studentId);

    // Récupérer les inscriptions mises à jour
    const updatedEnrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        academicYear: { select: { year: true } },
        faculty: { select: { name: true } },
      },
      orderBy: { enrollmentDate: "desc" },
    });

    // Log de correction réussie
    await createAuditLog({
      ...auditData,
      action: "FIX_STUDENT_ENROLLMENT_STATUS_SUCCESS",
      entity: "Enrollment",
      description: `Statuts d'inscription corrigés pour ${student.firstName} ${student.lastName}`,
      status: "SUCCESS",
      metadata: {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        enrollmentsCount: updatedEnrollments.length,
        activeEnrollments: updatedEnrollments.filter(
          (e) => e.status === "Active"
        ).length,
      },
    });

    res.json({
      message: `Statuts corrigés pour ${student.firstName} ${student.lastName}`,
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
      },
      enrollments: updatedEnrollments.map((e) => ({
        id: e.id,
        faculty: e.faculty.name,
        level: e.level,
        academicYear: e.academicYear.year,
        status: e.status,
        enrollmentDate: e.enrollmentDate,
      })),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la correction des statuts:", error);

    const errorMessage = getErrorMessage(error);

    // Log d'erreur
    await createAuditLog({
      ...auditData,
      action: "FIX_STUDENT_ENROLLMENT_STATUS_ERROR",
      entity: "Enrollment",
      description:
        "Erreur lors de la correction des statuts d'inscription pour un étudiant",
      status: "ERROR",
      errorMessage: errorMessage,
      metadata: {
        studentId: req.params.studentId,
      },
    });

    res.status(500).json({
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};
