"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScholarshipDocument = exports.updateScholarshipDocument = exports.createScholarshipDocument = exports.getScholarshipDocumentById = exports.getAllScholarshipDocuments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllScholarshipDocuments = async (req, res) => {
    try {
        const scholarshipDocuments = await prisma_1.default.scholarshipDocument.findMany();
        res.json(scholarshipDocuments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllScholarshipDocuments = getAllScholarshipDocuments;
const getScholarshipDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const scholarshipDocument = await prisma_1.default.scholarshipDocument.findUnique({ where: { id } });
        if (!scholarshipDocument)
            return res.status(404).json({ error: "ScholarshipDocument non trouvé" });
        res.json(scholarshipDocument);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getScholarshipDocumentById = getScholarshipDocumentById;
const createScholarshipDocument = async (req, res) => {
    try {
        const data = req.body;
        const newScholarshipDocument = await prisma_1.default.scholarshipDocument.create({ data });
        res.status(201).json(newScholarshipDocument);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createScholarshipDocument = createScholarshipDocument;
const updateScholarshipDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedScholarshipDocument = await prisma_1.default.scholarshipDocument.update({ where: { id }, data });
        res.json(updatedScholarshipDocument);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateScholarshipDocument = updateScholarshipDocument;
const deleteScholarshipDocument = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.scholarshipDocument.delete({ where: { id } });
        res.json({ message: "ScholarshipDocument supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteScholarshipDocument = deleteScholarshipDocument;
