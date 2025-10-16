import prisma from "../prisma";
export const getAllRoomEquipments = async (req, res) => {
    try {
        const roomEquipments = await prisma.roomEquipment.findMany();
        res.json(roomEquipments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getRoomEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const roomEquipment = await prisma.roomEquipment.findUnique({ where: { id } });
        if (!roomEquipment)
            return res.status(404).json({ error: "RoomEquipment non trouvé" });
        res.json(roomEquipment);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createRoomEquipment = async (req, res) => {
    try {
        const data = req.body;
        const newRoomEquipment = await prisma.roomEquipment.create({ data });
        res.status(201).json(newRoomEquipment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateRoomEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedRoomEquipment = await prisma.roomEquipment.update({ where: { id }, data });
        res.json(updatedRoomEquipment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteRoomEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.roomEquipment.delete({ where: { id } });
        res.json({ message: "RoomEquipment supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=roomEquipmentController.js.map