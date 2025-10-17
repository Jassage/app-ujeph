"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFacultyLevel = exports.updateFacultyLevel = exports.createFacultyLevel = exports.getFacultyLevelById = exports.getAllFacultyLevels = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllFacultyLevels = async (req, res) => {
    try {
        const facultyLevels = await prisma_1.default.facultyLevel.findMany();
        res.json(facultyLevels);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllFacultyLevels = getAllFacultyLevels;
const getFacultyLevelById = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyLevel = await prisma_1.default.facultyLevel.findUnique({ where: { id } });
        if (!facultyLevel)
            return res.status(404).json({ error: "FacultyLevel non trouvé" });
        res.json(facultyLevel);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getFacultyLevelById = getFacultyLevelById;
const createFacultyLevel = async (req, res) => {
    try {
        const data = req.body;
        const newFacultyLevel = await prisma_1.default.facultyLevel.create({ data });
        res.status(201).json(newFacultyLevel);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createFacultyLevel = createFacultyLevel;
const updateFacultyLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedFacultyLevel = await prisma_1.default.facultyLevel.update({ where: { id }, data });
        res.json(updatedFacultyLevel);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateFacultyLevel = updateFacultyLevel;
const deleteFacultyLevel = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.facultyLevel.delete({ where: { id } });
        res.json({ message: "FacultyLevel supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteFacultyLevel = deleteFacultyLevel;
