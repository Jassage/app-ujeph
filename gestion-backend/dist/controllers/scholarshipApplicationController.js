"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScholarshipApplication = exports.updateScholarshipApplication = exports.createScholarshipApplication = exports.getScholarshipApplicationById = exports.getAllScholarshipApplications = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllScholarshipApplications = async (req, res) => {
    try {
        const scholarshipApplications = await prisma_1.default.scholarshipApplication.findMany();
        res.json(scholarshipApplications);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllScholarshipApplications = getAllScholarshipApplications;
const getScholarshipApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const scholarshipApplication = await prisma_1.default.scholarshipApplication.findUnique({ where: { id } });
        if (!scholarshipApplication)
            return res.status(404).json({ error: "ScholarshipApplication non trouvé" });
        res.json(scholarshipApplication);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getScholarshipApplicationById = getScholarshipApplicationById;
const createScholarshipApplication = async (req, res) => {
    try {
        const data = req.body;
        const newScholarshipApplication = await prisma_1.default.scholarshipApplication.create({ data });
        res.status(201).json(newScholarshipApplication);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createScholarshipApplication = createScholarshipApplication;
const updateScholarshipApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedScholarshipApplication = await prisma_1.default.scholarshipApplication.update({ where: { id }, data });
        res.json(updatedScholarshipApplication);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateScholarshipApplication = updateScholarshipApplication;
const deleteScholarshipApplication = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.scholarshipApplication.delete({ where: { id } });
        res.json({ message: "ScholarshipApplication supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteScholarshipApplication = deleteScholarshipApplication;
