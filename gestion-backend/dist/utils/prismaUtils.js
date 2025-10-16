// src/utils/prismaUtils.ts
// import { BloodGroup, StudentSexe, StudentStatus } from "@/types/academic";
// Fonctions de conversion pour Prisma
export const toPrismaBloodGroup = (bloodGroup) => {
    if (!bloodGroup)
        return null;
    const validBloodGroups = [
        "A_POSITIVE",
        "A_NEGATIVE",
        "B_POSITIVE",
        "B_NEGATIVE",
        "AB_POSITIVE",
        "AB_NEGATIVE",
        "O_POSITIVE",
        "O_NEGATIVE",
    ];
    return validBloodGroups.includes(bloodGroup)
        ? bloodGroup
        : null;
};
export const toPrismaSexe = (sexe) => {
    if (!sexe)
        return null;
    const validSexes = ["Masculin", "Feminin", "Autre"];
    return validSexes.includes(sexe)
        ? sexe
        : null;
};
export const toPrismaStatus = (status) => {
    if (!status)
        return "Active";
    const validStatuses = [
        "Active",
        "Inactive",
        "Graduated",
        "Suspended",
    ];
    return validStatuses.includes(status)
        ? status
        : "Active";
};
// Fonction utilitaire pour préparer les données étudiantes
export const prepareStudentData = (data) => {
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
//# sourceMappingURL=prismaUtils.js.map