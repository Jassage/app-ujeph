import prisma from "../prisma";
export const getAllCertificates = async (req, res) => {
    try {
        const certificates = await prisma.certificate.findMany();
        res.json(certificates);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getCertificateById = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await prisma.certificate.findUnique({ where: { id } });
        if (!certificate)
            return res.status(404).json({ error: "Certificate non trouvé" });
        res.json(certificate);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createCertificate = async (req, res) => {
    try {
        const data = req.body;
        const newCertificate = await prisma.certificate.create({ data });
        res.status(201).json(newCertificate);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedCertificate = await prisma.certificate.update({ where: { id }, data });
        res.json(updatedCertificate);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.certificate.delete({ where: { id } });
        res.json({ message: "Certificate supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=certificateController.js.map