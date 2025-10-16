import prisma from "../prisma";
export const getAllAnalyticss = async (req, res) => {
    try {
        const analyticss = await prisma.analytics.findMany();
        res.json(analyticss);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getAnalyticsById = async (req, res) => {
    try {
        const { id } = req.params;
        const analytics = await prisma.analytics.findUnique({ where: { id } });
        if (!analytics)
            return res.status(404).json({ error: "Analytics non trouvé" });
        res.json(analytics);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createAnalytics = async (req, res) => {
    try {
        const data = req.body;
        const newAnalytics = await prisma.analytics.create({ data });
        res.status(201).json(newAnalytics);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedAnalytics = await prisma.analytics.update({ where: { id }, data });
        res.json(updatedAnalytics);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.analytics.delete({ where: { id } });
        res.json({ message: "Analytics supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=analyticsController.js.map