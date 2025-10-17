"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAcademicYears = exports.getCurrentAcademicYear = exports.shouldCreateNewAcademicYear = exports.initializeAcademicYear = exports.getAcademicYearDates = exports.getAcademicYearFromDate = void 0;
// src/services/academicYearService.ts
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
// Fonctions utilitaires
const getAcademicYearFromDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Janvier = 1, Décembre = 12
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};
exports.getAcademicYearFromDate = getAcademicYearFromDate;
const getAcademicYearDates = (academicYear) => {
    const [startYear] = academicYear.split("-").map(Number);
    return {
        start: new Date(startYear, 8, 1), // 1er septembre
        end: new Date(startYear + 1, 7, 31), // 31 août
    };
};
exports.getAcademicYearDates = getAcademicYearDates;
const initializeAcademicYear = async () => {
    try {
        const today = new Date();
        const currentAcademicYear = (0, exports.getAcademicYearFromDate)(today);
        const { start, end } = (0, exports.getAcademicYearDates)(currentAcademicYear);
        // Vérifier si l'année existe déjà
        const existingYear = await prisma.academicYear.findUnique({
            where: { year: currentAcademicYear },
        });
        if (!existingYear) {
            console.log(`🔄 Création de la nouvelle année académique: ${currentAcademicYear}`);
            // Créer la nouvelle année académique
            await prisma.academicYear.create({
                data: {
                    year: currentAcademicYear,
                    startDate: start,
                    endDate: end,
                    isCurrent: true,
                },
            });
            // Désactiver les autres années
            await prisma.academicYear.updateMany({
                where: {
                    year: { not: currentAcademicYear },
                },
                data: {
                    isCurrent: false,
                },
            });
            console.log(`✅ Année académique ${currentAcademicYear} créée avec succès`);
        }
        else {
            // S'assurer qu'une seule année est marquée comme courante
            const currentYear = await prisma.academicYear.findFirst({
                where: { isCurrent: true },
            });
            if (!currentYear || currentYear.year !== currentAcademicYear) {
                await prisma.academicYear.updateMany({
                    where: {
                        year: { not: currentAcademicYear },
                    },
                    data: {
                        isCurrent: false,
                    },
                });
                await prisma.academicYear.update({
                    where: { year: currentAcademicYear },
                    data: { isCurrent: true },
                });
                console.log(`🔄 Année courante mise à jour: ${currentAcademicYear}`);
            }
        }
    }
    catch (error) {
        console.error("❌ Erreur lors de l'initialisation de l'année académique:", error);
    }
};
exports.initializeAcademicYear = initializeAcademicYear;
// Vérifier si c'est le 1er septembre
const shouldCreateNewAcademicYear = () => {
    const today = new Date();
    return today.getDate() === 1 && today.getMonth() === 8; // 1er septembre
};
exports.shouldCreateNewAcademicYear = shouldCreateNewAcademicYear;
// Obtenir l'année académique courante
const getCurrentAcademicYear = async () => {
    return await prisma.academicYear.findFirst({
        where: { isCurrent: true },
    });
};
exports.getCurrentAcademicYear = getCurrentAcademicYear;
// Obtenir toutes les années académiques
const getAllAcademicYears = async () => {
    return await prisma.academicYear.findMany({
        orderBy: { year: "desc" },
    });
};
exports.getAllAcademicYears = getAllAcademicYears;
exports.default = prisma;
