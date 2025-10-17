"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAnnouncementAttachment = exports.updateAnnouncementAttachment = exports.createAnnouncementAttachment = exports.getAnnouncementAttachmentById = exports.getAllAnnouncementAttachments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllAnnouncementAttachments = async (req, res) => {
    try {
        const announcementAttachments = await prisma_1.default.announcementAttachment.findMany();
        res.json(announcementAttachments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllAnnouncementAttachments = getAllAnnouncementAttachments;
const getAnnouncementAttachmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcementAttachment = await prisma_1.default.announcementAttachment.findUnique({ where: { id } });
        if (!announcementAttachment)
            return res.status(404).json({ error: "AnnouncementAttachment non trouvé" });
        res.json(announcementAttachment);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAnnouncementAttachmentById = getAnnouncementAttachmentById;
const createAnnouncementAttachment = async (req, res) => {
    try {
        const data = req.body;
        const newAnnouncementAttachment = await prisma_1.default.announcementAttachment.create({ data });
        res.status(201).json(newAnnouncementAttachment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createAnnouncementAttachment = createAnnouncementAttachment;
const updateAnnouncementAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedAnnouncementAttachment = await prisma_1.default.announcementAttachment.update({ where: { id }, data });
        res.json(updatedAnnouncementAttachment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateAnnouncementAttachment = updateAnnouncementAttachment;
const deleteAnnouncementAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.announcementAttachment.delete({ where: { id } });
        res.json({ message: "AnnouncementAttachment supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteAnnouncementAttachment = deleteAnnouncementAttachment;
