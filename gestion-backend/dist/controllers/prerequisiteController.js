import prisma from "../prisma";
export const getAllPrerequisites = async (req, res) => {
    try {
        const prerequisites = await prisma.uePrerequisite.findMany();
        res.json(prerequisites);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getPrerequisiteById = async (req, res) => {
    try {
        const { id } = req.params;
        const prerequisite = await prisma.uePrerequisite.findUnique({
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
export const createPrerequisite = async (req, res) => {
    try {
        const data = req.body;
        const newPrerequisite = await prisma.uePrerequisite.create({ data });
        res.status(201).json(newPrerequisite);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updatePrerequisite = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedPrerequisite = await prisma.uePrerequisite.update({
            where: { id },
            data,
        });
        res.json(updatedPrerequisite);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deletePrerequisite = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.uePrerequisite.delete({ where: { id } });
        res.json({ message: "Prerequisite supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=prerequisiteController.js.map