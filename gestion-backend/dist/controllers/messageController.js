"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.updateMessage = exports.createMessage = exports.getMessageById = exports.getAllMessages = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllMessages = async (req, res) => {
    try {
        const messages = await prisma_1.default.message.findMany();
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllMessages = getAllMessages;
const getMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await prisma_1.default.message.findUnique({ where: { id } });
        if (!message)
            return res.status(404).json({ error: "Message non trouvé" });
        res.json(message);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getMessageById = getMessageById;
const createMessage = async (req, res) => {
    try {
        const data = req.body;
        const newMessage = await prisma_1.default.message.create({ data });
        res.status(201).json(newMessage);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createMessage = createMessage;
const updateMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedMessage = await prisma_1.default.message.update({ where: { id }, data });
        res.json(updatedMessage);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateMessage = updateMessage;
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.message.delete({ where: { id } });
        res.json({ message: "Message supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteMessage = deleteMessage;
