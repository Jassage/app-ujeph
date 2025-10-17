"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchedule = exports.updateSchedule = exports.createSchedule = exports.getScheduleById = exports.getAllSchedules = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllSchedules = async (req, res) => {
    try {
        const schedules = await prisma_1.default.schedule.findMany();
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllSchedules = getAllSchedules;
const getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await prisma_1.default.schedule.findUnique({ where: { id } });
        if (!schedule)
            return res.status(404).json({ error: "Schedule non trouvé" });
        res.json(schedule);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getScheduleById = getScheduleById;
const createSchedule = async (req, res) => {
    try {
        const data = req.body;
        const newSchedule = await prisma_1.default.schedule.create({ data });
        res.status(201).json(newSchedule);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createSchedule = createSchedule;
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedSchedule = await prisma_1.default.schedule.update({ where: { id }, data });
        res.json(updatedSchedule);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateSchedule = updateSchedule;
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.schedule.delete({ where: { id } });
        res.json({ message: "Schedule supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteSchedule = deleteSchedule;
