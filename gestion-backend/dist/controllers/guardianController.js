"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGuardian = exports.updateGuardian = exports.createGuardian = exports.getGuardianById = exports.getAllGuardians = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllGuardians = async (req, res) => {
    try {
        const guardians = await prisma_1.default.guardian.findMany();
        res.json(guardians);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllGuardians = getAllGuardians;
const getGuardianById = async (req, res) => {
    try {
        const { id } = req.params;
        const guardian = await prisma_1.default.guardian.findUnique({ where: { id } });
        if (!guardian)
            return res.status(404).json({ error: "Guardian non trouvé" });
        res.json(guardian);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getGuardianById = getGuardianById;
const createGuardian = async (req, res) => {
    try {
        const data = req.body;
        const newGuardian = await prisma_1.default.guardian.create({ data });
        res.status(201).json(newGuardian);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createGuardian = createGuardian;
const updateGuardian = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedGuardian = await prisma_1.default.guardian.update({ where: { id }, data });
        res.json(updatedGuardian);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateGuardian = updateGuardian;
const deleteGuardian = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.guardian.delete({ where: { id } });
        res.json({ message: "Guardian supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteGuardian = deleteGuardian;
