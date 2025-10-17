"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEventParticipant = exports.updateEventParticipant = exports.createEventParticipant = exports.getEventParticipantById = exports.getAllEventParticipants = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllEventParticipants = async (req, res) => {
    try {
        const eventParticipants = await prisma_1.default.eventParticipant.findMany();
        res.json(eventParticipants);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllEventParticipants = getAllEventParticipants;
const getEventParticipantById = async (req, res) => {
    try {
        const { id } = req.params;
        const eventParticipant = await prisma_1.default.eventParticipant.findUnique({ where: { id } });
        if (!eventParticipant)
            return res.status(404).json({ error: "EventParticipant non trouvé" });
        res.json(eventParticipant);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getEventParticipantById = getEventParticipantById;
const createEventParticipant = async (req, res) => {
    try {
        const data = req.body;
        const newEventParticipant = await prisma_1.default.eventParticipant.create({ data });
        res.status(201).json(newEventParticipant);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createEventParticipant = createEventParticipant;
const updateEventParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedEventParticipant = await prisma_1.default.eventParticipant.update({ where: { id }, data });
        res.json(updatedEventParticipant);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateEventParticipant = updateEventParticipant;
const deleteEventParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.eventParticipant.delete({ where: { id } });
        res.json({ message: "EventParticipant supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteEventParticipant = deleteEventParticipant;
