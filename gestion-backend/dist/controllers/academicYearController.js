"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAcademicYear = exports.createAcademicYear = exports.getCurrentYear = exports.getAcademicYears = void 0;
const academicYearService_1 = require("../services/academicYearService");
const prisma_1 = __importDefault(require("../prisma")); // Assure-toi d'importer ton client Prisma
// Récupérer toutes les années académiques
const getAcademicYears = async (req, res) => {
    try {
        const academicYears = await (0, academicYearService_1.getAllAcademicYears)();
        res.json(academicYears);
    }
    catch (error) {
        console.error("Erreur getAcademicYears:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.getAcademicYears = getAcademicYears;
// Récupérer l'année académique courante
const getCurrentYear = async (req, res) => {
    try {
        const currentYear = await (0, academicYearService_1.getCurrentAcademicYear)();
        res.json(currentYear);
    }
    catch (error) {
        console.error("Erreur getCurrentYear:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.getCurrentYear = getCurrentYear;
// Créer une nouvelle année académique (via Postman)
const createAcademicYear = async (req, res) => {
    try {
        const { year, startDate, endDate, isCurrent } = req.body;
        if (!year || !startDate || !endDate) {
            return res.status(400).json({
                message: "Les champs year, startDate et endDate sont obligatoires",
            });
        }
        const newYear = await prisma_1.default.academicYear.create({
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
exports.createAcademicYear = createAcademicYear;
// Vérifier si une nouvelle année académique doit être créée
const checkAcademicYear = async (req, res) => {
    try {
        const needNewYear = (0, academicYearService_1.shouldCreateNewAcademicYear)();
        if (needNewYear) {
            await (0, academicYearService_1.initializeAcademicYear)();
        }
        const currentYear = await (0, academicYearService_1.getCurrentAcademicYear)();
        res.json({ shouldCreate: needNewYear, currentYear });
    }
    catch (error) {
        console.error("Erreur checkAcademicYear:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.checkAcademicYear = checkAcademicYear;
