"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAnalytics = exports.updateAnalytics = exports.createAnalytics = exports.getAnalyticsById = exports.getAllAnalyticss = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllAnalyticss = async (req, res) => {
    try {
        const analyticss = await prisma_1.default.analytics.findMany();
        res.json(analyticss);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllAnalyticss = getAllAnalyticss;
const getAnalyticsById = async (req, res) => {
    try {
        const { id } = req.params;
        const analytics = await prisma_1.default.analytics.findUnique({ where: { id } });
        if (!analytics)
            return res.status(404).json({ error: "Analytics non trouvé" });
        res.json(analytics);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAnalyticsById = getAnalyticsById;
const createAnalytics = async (req, res) => {
    try {
        const data = req.body;
        const newAnalytics = await prisma_1.default.analytics.create({ data });
        res.status(201).json(newAnalytics);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createAnalytics = createAnalytics;
const updateAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedAnalytics = await prisma_1.default.analytics.update({ where: { id }, data });
        res.json(updatedAnalytics);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateAnalytics = updateAnalytics;
const deleteAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.analytics.delete({ where: { id } });
        res.json({ message: "Analytics supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteAnalytics = deleteAnalytics;
