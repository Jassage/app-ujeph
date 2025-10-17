"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFeeStructure = exports.updateFeeStructure = exports.createFeeStructure = exports.getFeeStructureById = exports.getAllFeeStructures = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllFeeStructures = async (req, res) => {
    try {
        const feeStructures = await prisma_1.default.feeStructure.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(feeStructures);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllFeeStructures = getAllFeeStructures;
const getFeeStructureById = async (req, res) => {
    try {
        const { id } = req.params;
        const feeStructure = await prisma_1.default.feeStructure.findUnique({
            where: { id },
            include: {
                studentFees: true,
            },
        });
        if (!feeStructure)
            return res.status(404).json({ error: "Structure de frais non trouvée" });
        res.json(feeStructure);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getFeeStructureById = getFeeStructureById;
const createFeeStructure = async (req, res) => {
    try {
        const { name, academicYear, faculty, level, amount, isActive } = req.body;
        console.log("Données reçues:", req.body);
        // Validation des champs requis
        if (!name || !academicYear || !faculty || !level || amount === undefined) {
            return res.status(400).json({
                error: "Tous les champs obligatoires doivent être remplis",
            });
        }
        // Vérifier si une structure existe déjà
        const existingStructure = await prisma_1.default.feeStructure.findFirst({
            where: {
                academicYear,
                faculty,
                level,
            },
        });
        if (existingStructure) {
            return res.status(400).json({
                error: "Une structure existe déjà pour cette combinaison",
            });
        }
        const newFeeStructure = await prisma_1.default.feeStructure.create({
            data: {
                name,
                academicYear,
                faculty,
                level,
                amount: parseFloat(amount),
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            },
        });
        res.status(201).json(newFeeStructure);
    }
    catch (error) {
        console.error("Erreur détaillée:", error);
        res.status(400).json({
            error: "Erreur lors de la création",
            details: error,
        });
    }
};
exports.createFeeStructure = createFeeStructure;
const updateFeeStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedFeeStructure = await prisma_1.default.feeStructure.update({
            where: { id },
            data,
        });
        res.json(updatedFeeStructure);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateFeeStructure = updateFeeStructure;
const deleteFeeStructure = async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier si la structure est utilisée par des étudiants
        const studentFees = await prisma_1.default.studentFee.findMany({
            where: { feeStructureId: id },
        });
        if (studentFees.length > 0) {
            return res.status(400).json({
                error: "Impossible de supprimer cette structure car elle est attribuée à des étudiants",
            });
        }
        await prisma_1.default.feeStructure.delete({ where: { id } });
        res.json({ message: "Structure de frais supprimée" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteFeeStructure = deleteFeeStructure;
