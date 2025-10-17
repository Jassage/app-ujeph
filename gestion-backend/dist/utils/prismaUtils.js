"use strict";
// src/utils/prismaUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareStudentData = exports.toPrismaStatus = exports.toPrismaSexe = exports.toPrismaBloodGroup = void 0;
// import { BloodGroup, StudentSexe, StudentStatus } from "@/types/academic";
// Fonctions de conversion pour Prisma
const toPrismaBloodGroup = (bloodGroup) => {
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
exports.toPrismaBloodGroup = toPrismaBloodGroup;
const toPrismaSexe = (sexe) => {
    if (!sexe)
        return null;
    const validSexes = ["Masculin", "Feminin", "Autre"];
    return validSexes.includes(sexe)
        ? sexe
        : null;
};
exports.toPrismaSexe = toPrismaSexe;
const toPrismaStatus = (status) => {
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
exports.toPrismaStatus = toPrismaStatus;
// Fonction utilitaire pour préparer les données étudiantes
const prepareStudentData = (data) => {
    return {
        ...data,
        bloodGroup: (0, exports.toPrismaBloodGroup)(data.bloodGroup),
        sexe: (0, exports.toPrismaSexe)(data.sexe),
        status: (0, exports.toPrismaStatus)(data.status),
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        placeOfBirth: data.placeOfBirth || null,
        address: data.address || null,
        allergies: data.allergies || null,
        disabilities: data.disabilities || null,
        cin: data.cin || null,
    };
};
exports.prepareStudentData = prepareStudentData;
