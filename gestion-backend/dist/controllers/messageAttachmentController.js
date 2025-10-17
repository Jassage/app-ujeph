"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessageAttachment = exports.updateMessageAttachment = exports.createMessageAttachment = exports.getMessageAttachmentById = exports.getAllMessageAttachments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllMessageAttachments = async (req, res) => {
    try {
        const messageAttachments = await prisma_1.default.messageAttachment.findMany();
        res.json(messageAttachments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllMessageAttachments = getAllMessageAttachments;
const getMessageAttachmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const messageAttachment = await prisma_1.default.messageAttachment.findUnique({ where: { id } });
        if (!messageAttachment)
            return res.status(404).json({ error: "MessageAttachment non trouvé" });
        res.json(messageAttachment);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getMessageAttachmentById = getMessageAttachmentById;
const createMessageAttachment = async (req, res) => {
    try {
        const data = req.body;
        const newMessageAttachment = await prisma_1.default.messageAttachment.create({ data });
        res.status(201).json(newMessageAttachment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createMessageAttachment = createMessageAttachment;
const updateMessageAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedMessageAttachment = await prisma_1.default.messageAttachment.update({ where: { id }, data });
        res.json(updatedMessageAttachment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateMessageAttachment = updateMessageAttachment;
const deleteMessageAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.messageAttachment.delete({ where: { id } });
        res.json({ message: "MessageAttachment supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteMessageAttachment = deleteMessageAttachment;
