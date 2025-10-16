import prisma from "../prisma";
export const getAllSchedules = async (req, res) => {
    try {
        const schedules = await prisma.schedule.findMany();
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule)
            return res.status(404).json({ error: "Schedule non trouvé" });
        res.json(schedule);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createSchedule = async (req, res) => {
    try {
        const data = req.body;
        const newSchedule = await prisma.schedule.create({ data });
        res.status(201).json(newSchedule);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedSchedule = await prisma.schedule.update({ where: { id }, data });
        res.json(updatedSchedule);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.schedule.delete({ where: { id } });
        res.json({ message: "Schedule supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=scheduleController.js.map