import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function fixAllEnrollmentStatuses() {
  console.log("Début de la correction des statuts d'inscription...");

  const allStudents = await prisma.student.findMany();
  let totalFixed = 0;

  for (const student of allStudents) {
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: "Active",
      },
      orderBy: {
        enrollmentDate: "desc",
      },
    });

    if (activeEnrollments.length > 1) {
      console.log(
        `Étudiant ${student.firstName} ${student.lastName}: ${activeEnrollments.length} inscriptions actives`
      );

      // Garder seulement la plus récente
      const enrollmentsToUpdate = activeEnrollments.slice(1);

      for (const enrollment of enrollmentsToUpdate) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "Completed",
            // endDate: new Date(),
          },
        });
      }

      totalFixed += enrollmentsToUpdate.length;
      console.log(
        `→ ${enrollmentsToUpdate.length} inscription(s) marquée(s) comme terminée(s)`
      );
    }
  }

  console.log(
    `\nCorrection terminée ! ${totalFixed} inscription(s) corrigée(s) au total.`
  );
}

fixAllEnrollmentStatuses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
