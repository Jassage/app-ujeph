import prisma from "../prisma";
export const getAllScholarships = async (req, res) => {
    try {
        const scholarships = await prisma.scholarship.findMany();
        res.json(scholarships);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getScholarshipById = async (req, res) => {
    try {
        const { id } = req.params;
        const scholarship = await prisma.scholarship.findUnique({ where: { id } });
        if (!scholarship)
            return res.status(404).json({ error: "Scholarship non trouvé" });
        res.json(scholarship);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createScholarship = async (req, res) => {
    try {
        const data = req.body;
        const newScholarship = await prisma.scholarship.create({ data });
        res.status(201).json(newScholarship);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateScholarship = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedScholarship = await prisma.scholarship.update({ where: { id }, data });
        res.json(updatedScholarship);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteScholarship = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.scholarship.delete({ where: { id } });
        res.json({ message: "Scholarship supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=scholarshipController.js.map