"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoomReservation = exports.updateRoomReservation = exports.createRoomReservation = exports.getRoomReservationById = exports.getAllRoomReservations = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllRoomReservations = async (req, res) => {
    try {
        const roomReservations = await prisma_1.default.roomReservation.findMany();
        res.json(roomReservations);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllRoomReservations = getAllRoomReservations;
const getRoomReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const roomReservation = await prisma_1.default.roomReservation.findUnique({ where: { id } });
        if (!roomReservation)
            return res.status(404).json({ error: "RoomReservation non trouvé" });
        res.json(roomReservation);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getRoomReservationById = getRoomReservationById;
const createRoomReservation = async (req, res) => {
    try {
        const data = req.body;
        const newRoomReservation = await prisma_1.default.roomReservation.create({ data });
        res.status(201).json(newRoomReservation);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createRoomReservation = createRoomReservation;
const updateRoomReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedRoomReservation = await prisma_1.default.roomReservation.update({ where: { id }, data });
        res.json(updatedRoomReservation);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateRoomReservation = updateRoomReservation;
const deleteRoomReservation = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.roomReservation.delete({ where: { id } });
        res.json({ message: "RoomReservation supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteRoomReservation = deleteRoomReservation;
