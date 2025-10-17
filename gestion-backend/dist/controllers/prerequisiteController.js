"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePrerequisite = exports.updatePrerequisite = exports.createPrerequisite = exports.getPrerequisiteById = exports.getAllPrerequisites = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllPrerequisites = async (req, res) => {
    try {
        const prerequisites = await prisma_1.default.uePrerequisite.findMany();
        res.json(prerequisites);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllPrerequisites = getAllPrerequisites;
const getPrerequisiteById = async (req, res) => {
    try {
        const { id } = req.params;
        const prerequisite = await prisma_1.default.uePrerequisite.findUnique({
            where: { id },
        });
        if (!prerequisite)
            return res.status(404).json({ error: "Prerequisite non trouvé" });
        res.json(prerequisite);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getPrerequisiteById = getPrerequisiteById;
const createPrerequisite = async (req, res) => {
    try {
        const data = req.body;
        const newPrerequisite = await prisma_1.default.uePrerequisite.create({ data });
        res.status(201).json(newPrerequisite);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createPrerequisite = createPrerequisite;
const updatePrerequisite = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedPrerequisite = await prisma_1.default.uePrerequisite.update({
            where: { id },
            data,
        });
        res.json(updatedPrerequisite);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updatePrerequisite = updatePrerequisite;
const deletePrerequisite = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.uePrerequisite.delete({ where: { id } });
        res.json({ message: "Prerequisite supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deletePrerequisite = deletePrerequisite;
