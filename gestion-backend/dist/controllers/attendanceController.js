"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttendance = exports.updateAttendance = exports.createAttendance = exports.getAttendanceById = exports.getAllAttendances = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllAttendances = async (req, res) => {
    try {
        const attendances = await prisma_1.default.attendance.findMany();
        res.json(attendances);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllAttendances = getAllAttendances;
const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await prisma_1.default.attendance.findUnique({ where: { id } });
        if (!attendance)
            return res.status(404).json({ error: "Attendance non trouvé" });
        res.json(attendance);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAttendanceById = getAttendanceById;
const createAttendance = async (req, res) => {
    try {
        const data = req.body;
        const newAttendance = await prisma_1.default.attendance.create({ data });
        res.status(201).json(newAttendance);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createAttendance = createAttendance;
const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedAttendance = await prisma_1.default.attendance.update({ where: { id }, data });
        res.json(updatedAttendance);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateAttendance = updateAttendance;
const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.attendance.delete({ where: { id } });
        res.json({ message: "Attendance supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteAttendance = deleteAttendance;
