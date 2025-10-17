"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoomEquipment = exports.updateRoomEquipment = exports.createRoomEquipment = exports.getRoomEquipmentById = exports.getAllRoomEquipments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllRoomEquipments = async (req, res) => {
    try {
        const roomEquipments = await prisma_1.default.roomEquipment.findMany();
        res.json(roomEquipments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllRoomEquipments = getAllRoomEquipments;
const getRoomEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const roomEquipment = await prisma_1.default.roomEquipment.findUnique({ where: { id } });
        if (!roomEquipment)
            return res.status(404).json({ error: "RoomEquipment non trouvé" });
        res.json(roomEquipment);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getRoomEquipmentById = getRoomEquipmentById;
const createRoomEquipment = async (req, res) => {
    try {
        const data = req.body;
        const newRoomEquipment = await prisma_1.default.roomEquipment.create({ data });
        res.status(201).json(newRoomEquipment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createRoomEquipment = createRoomEquipment;
const updateRoomEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedRoomEquipment = await prisma_1.default.roomEquipment.update({ where: { id }, data });
        res.json(updatedRoomEquipment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateRoomEquipment = updateRoomEquipment;
const deleteRoomEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.roomEquipment.delete({ where: { id } });
        res.json({ message: "RoomEquipment supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteRoomEquipment = deleteRoomEquipment;
