"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoom = exports.updateRoom = exports.createRoom = exports.getRoomById = exports.getAllRooms = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllRooms = async (req, res) => {
    try {
        const rooms = await prisma_1.default.room.findMany();
        res.json(rooms);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllRooms = getAllRooms;
const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await prisma_1.default.room.findUnique({ where: { id } });
        if (!room)
            return res.status(404).json({ error: "Room non trouvé" });
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getRoomById = getRoomById;
const createRoom = async (req, res) => {
    try {
        const data = req.body;
        const newRoom = await prisma_1.default.room.create({ data });
        res.status(201).json(newRoom);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createRoom = createRoom;
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedRoom = await prisma_1.default.room.update({ where: { id }, data });
        res.json(updatedRoom);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateRoom = updateRoom;
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.room.delete({ where: { id } });
        res.json({ message: "Room supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteRoom = deleteRoom;
