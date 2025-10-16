import prisma from "../prisma";
export const getAllFacultyLevels = async (req, res) => {
    try {
        const facultyLevels = await prisma.facultyLevel.findMany();
        res.json(facultyLevels);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getFacultyLevelById = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyLevel = await prisma.facultyLevel.findUnique({ where: { id } });
        if (!facultyLevel)
            return res.status(404).json({ error: "FacultyLevel non trouvé" });
        res.json(facultyLevel);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createFacultyLevel = async (req, res) => {
    try {
        const data = req.body;
        const newFacultyLevel = await prisma.facultyLevel.create({ data });
        res.status(201).json(newFacultyLevel);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateFacultyLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedFacultyLevel = await prisma.facultyLevel.update({ where: { id }, data });
        res.json(updatedFacultyLevel);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteFacultyLevel = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.facultyLevel.delete({ where: { id } });
        res.json({ message: "FacultyLevel supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=facultyLevelController.js.map