"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAnnouncement = exports.updateAnnouncement = exports.createAnnouncement = exports.getAnnouncementById = exports.getAllAnnouncements = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await prisma_1.default.announcement.findMany();
        res.json(announcements);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllAnnouncements = getAllAnnouncements;
const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await prisma_1.default.announcement.findUnique({
            where: { id },
        });
        if (!announcement)
            return res.status(404).json({ error: "Announcement non trouvé" });
        res.json(announcement);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAnnouncementById = getAnnouncementById;
const createAnnouncement = async (req, res) => {
    try {
        const data = req.body;
        const newAnnouncement = await prisma_1.default.announcement.create({ data });
        res.status(201).json(newAnnouncement);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createAnnouncement = createAnnouncement;
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedAnnouncement = await prisma_1.default.announcement.update({
            where: { id },
            data,
        });
        res.json(updatedAnnouncement);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateAnnouncement = updateAnnouncement;
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.announcement.delete({ where: { id } });
        res.json({ message: "Announcement supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteAnnouncement = deleteAnnouncement;
