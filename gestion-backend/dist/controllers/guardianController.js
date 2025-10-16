import prisma from "../prisma";
export const getAllGuardians = async (req, res) => {
    try {
        const guardians = await prisma.guardian.findMany();
        res.json(guardians);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getGuardianById = async (req, res) => {
    try {
        const { id } = req.params;
        const guardian = await prisma.guardian.findUnique({ where: { id } });
        if (!guardian)
            return res.status(404).json({ error: "Guardian non trouvé" });
        res.json(guardian);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createGuardian = async (req, res) => {
    try {
        const data = req.body;
        const newGuardian = await prisma.guardian.create({ data });
        res.status(201).json(newGuardian);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateGuardian = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedGuardian = await prisma.guardian.update({ where: { id }, data });
        res.json(updatedGuardian);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteGuardian = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.guardian.delete({ where: { id } });
        res.json({ message: "Guardian supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=guardianController.js.map