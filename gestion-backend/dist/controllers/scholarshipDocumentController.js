import prisma from "../prisma";
export const getAllScholarshipDocuments = async (req, res) => {
    try {
        const scholarshipDocuments = await prisma.scholarshipDocument.findMany();
        res.json(scholarshipDocuments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getScholarshipDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const scholarshipDocument = await prisma.scholarshipDocument.findUnique({ where: { id } });
        if (!scholarshipDocument)
            return res.status(404).json({ error: "ScholarshipDocument non trouvé" });
        res.json(scholarshipDocument);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createScholarshipDocument = async (req, res) => {
    try {
        const data = req.body;
        const newScholarshipDocument = await prisma.scholarshipDocument.create({ data });
        res.status(201).json(newScholarshipDocument);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateScholarshipDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedScholarshipDocument = await prisma.scholarshipDocument.update({ where: { id }, data });
        res.json(updatedScholarshipDocument);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteScholarshipDocument = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.scholarshipDocument.delete({ where: { id } });
        res.json({ message: "ScholarshipDocument supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=scholarshipDocumentController.js.map