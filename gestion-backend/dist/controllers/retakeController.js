"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRetake = exports.updateRetake = exports.createRetake = exports.getRetakeById = exports.getAllRetakes = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllRetakes = async (req, res) => {
    try {
        const retakes = await prisma_1.default.retake.findMany();
        res.json(retakes);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllRetakes = getAllRetakes;
const getRetakeById = async (req, res) => {
    try {
        const { id } = req.params;
        const retake = await prisma_1.default.retake.findUnique({ where: { id } });
        if (!retake)
            return res.status(404).json({ error: "Retake non trouvé" });
        res.json(retake);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getRetakeById = getRetakeById;
const createRetake = async (req, res) => {
    try {
        const data = req.body;
        const newRetake = await prisma_1.default.retake.create({ data });
        res.status(201).json(newRetake);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createRetake = createRetake;
const updateRetake = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedRetake = await prisma_1.default.retake.update({ where: { id }, data });
        res.json(updatedRetake);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateRetake = updateRetake;
const deleteRetake = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.retake.delete({ where: { id } });
        res.json({ message: "Retake supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteRetake = deleteRetake;
