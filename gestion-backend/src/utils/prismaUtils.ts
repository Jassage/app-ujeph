// src/utils/prismaUtils.ts

import { BloodGroup, StudentSexe, StudentStatus } from "../../generated/prisma";

// import { BloodGroup, StudentSexe, StudentStatus } from "@/types/academic";

// Fonctions de conversion pour Prisma
export const toPrismaBloodGroup = (
  bloodGroup: string | null | undefined
): BloodGroup | null => {
  if (!bloodGroup) return null;

  const validBloodGroups: BloodGroup[] = [
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
  ];

  return validBloodGroups.includes(bloodGroup as BloodGroup)
    ? (bloodGroup as BloodGroup)
    : null;
};

export const toPrismaSexe = (
  sexe: string | null | undefined
): StudentSexe | null => {
  if (!sexe) return null;

  const validSexes: StudentSexe[] = ["Masculin", "Feminin", "Autre"];

  return validSexes.includes(sexe as StudentSexe)
    ? (sexe as StudentSexe)
    : null;
};

export const toPrismaStatus = (
  status: string | null | undefined
): StudentStatus => {
  if (!status) return "Active";

  const validStatuses: StudentStatus[] = [
    "Active",
    "Inactive",
    "Graduated",
    "Suspended",
  ];

  return validStatuses.includes(status as StudentStatus)
    ? (status as StudentStatus)
    : "Active";
};

// Fonction utilitaire pour préparer les données étudiantes
export const prepareStudentData = (data: any) => {
  return {
    ...data,
    bloodGroup: toPrismaBloodGroup(data.bloodGroup),
    sexe: toPrismaSexe(data.sexe),
    status: toPrismaStatus(data.status),
    phone: data.phone || null,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    placeOfBirth: data.placeOfBirth || null,
    address: data.address || null,
    allergies: data.allergies || null,
    disabilities: data.disabilities || null,
    cin: data.cin || null,
  };
};
