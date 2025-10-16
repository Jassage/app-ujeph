import prisma from "../prisma";
export const getAllAnnouncementAttachments = async (req, res) => {
    try {
        const announcementAttachments = await prisma.announcementAttachment.findMany();
        res.json(announcementAttachments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getAnnouncementAttachmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcementAttachment = await prisma.announcementAttachment.findUnique({ where: { id } });
        if (!announcementAttachment)
            return res.status(404).json({ error: "AnnouncementAttachment non trouvé" });
        res.json(announcementAttachment);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createAnnouncementAttachment = async (req, res) => {
    try {
        const data = req.body;
        const newAnnouncementAttachment = await prisma.announcementAttachment.create({ data });
        res.status(201).json(newAnnouncementAttachment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateAnnouncementAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedAnnouncementAttachment = await prisma.announcementAttachment.update({ where: { id }, data });
        res.json(updatedAnnouncementAttachment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteAnnouncementAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.announcementAttachment.delete({ where: { id } });
        res.json({ message: "AnnouncementAttachment supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=announcementAttachmentController.js.map