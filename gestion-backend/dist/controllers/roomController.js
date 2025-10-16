import prisma from "../prisma";
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await prisma.room.findMany();
        res.json(rooms);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await prisma.room.findUnique({ where: { id } });
        if (!room)
            return res.status(404).json({ error: "Room non trouvé" });
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createRoom = async (req, res) => {
    try {
        const data = req.body;
        const newRoom = await prisma.room.create({ data });
        res.status(201).json(newRoom);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedRoom = await prisma.room.update({ where: { id }, data });
        res.json(updatedRoom);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.room.delete({ where: { id } });
        res.json({ message: "Room supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=roomController.js.map