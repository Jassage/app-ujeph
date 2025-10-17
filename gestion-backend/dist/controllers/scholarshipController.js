"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScholarship = exports.updateScholarship = exports.createScholarship = exports.getScholarshipById = exports.getAllScholarships = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllScholarships = async (req, res) => {
    try {
        const scholarships = await prisma_1.default.scholarship.findMany();
        res.json(scholarships);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllScholarships = getAllScholarships;
const getScholarshipById = async (req, res) => {
    try {
        const { id } = req.params;
        const scholarship = await prisma_1.default.scholarship.findUnique({ where: { id } });
        if (!scholarship)
            return res.status(404).json({ error: "Scholarship non trouvé" });
        res.json(scholarship);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getScholarshipById = getScholarshipById;
const createScholarship = async (req, res) => {
    try {
        const data = req.body;
        const newScholarship = await prisma_1.default.scholarship.create({ data });
        res.status(201).json(newScholarship);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createScholarship = createScholarship;
const updateScholarship = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedScholarship = await prisma_1.default.scholarship.update({ where: { id }, data });
        res.json(updatedScholarship);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateScholarship = updateScholarship;
const deleteScholarship = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.scholarship.delete({ where: { id } });
        res.json({ message: "Scholarship supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteScholarship = deleteScholarship;
