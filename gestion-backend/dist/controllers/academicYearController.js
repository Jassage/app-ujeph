import { initializeAcademicYear, getCurrentAcademicYear, getAllAcademicYears, shouldCreateNewAcademicYear, } from "../services/academicYearService";
import prisma from "../prisma"; // Assure-toi d'importer ton client Prisma
// Récupérer toutes les années académiques
export const getAcademicYears = async (req, res) => {
    try {
        const academicYears = await getAllAcademicYears();
        res.json(academicYears);
    }
    catch (error) {
        console.error("Erreur getAcademicYears:", error);
        res.status(500).json({ message: error.message });
    }
};
// Récupérer l'année académique courante
export const getCurrentYear = async (req, res) => {
    try {
        const currentYear = await getCurrentAcademicYear();
        res.json(currentYear);
    }
    catch (error) {
        console.error("Erreur getCurrentYear:", error);
        res.status(500).json({ message: error.message });
    }
};
// Créer une nouvelle année académique (via Postman)
export const createAcademicYear = async (req, res) => {
    try {
        const { year, startDate, endDate, isCurrent } = req.body;
        if (!year || !startDate || !endDate) {
            return res.status(400).json({
                message: "Les champs year, startDate et endDate sont obligatoires",
            });
        }
        const newYear = await prisma.academicYear.create({
            data: {
                year,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isCurrent: isCurrent ?? false,
            },
        });
        res.status(201).json(newYear);
    }
    catch (error) {
        console.error("Erreur createAcademicYear:", error);
        res.status(500).json({ message: error.message });
    }
};
// Vérifier si une nouvelle année académique doit être créée
export const checkAcademicYear = async (req, res) => {
    try {
        const needNewYear = shouldCreateNewAcademicYear();
        if (needNewYear) {
            await initializeAcademicYear();
        }
        const currentYear = await getCurrentAcademicYear();
        res.json({ shouldCreate: needNewYear, currentYear });
    }
    catch (error) {
        console.error("Erreur checkAcademicYear:", error);
        res.status(500).json({ message: error.message });
    }
};
//# sourceMappingURL=academicYearController.js.map