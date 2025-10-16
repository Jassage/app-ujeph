import prisma from "../prisma";
export const getAllRoomReservations = async (req, res) => {
    try {
        const roomReservations = await prisma.roomReservation.findMany();
        res.json(roomReservations);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getRoomReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const roomReservation = await prisma.roomReservation.findUnique({ where: { id } });
        if (!roomReservation)
            return res.status(404).json({ error: "RoomReservation non trouvé" });
        res.json(roomReservation);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createRoomReservation = async (req, res) => {
    try {
        const data = req.body;
        const newRoomReservation = await prisma.roomReservation.create({ data });
        res.status(201).json(newRoomReservation);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateRoomReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedRoomReservation = await prisma.roomReservation.update({ where: { id }, data });
        res.json(updatedRoomReservation);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteRoomReservation = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.roomReservation.delete({ where: { id } });
        res.json({ message: "RoomReservation supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=roomReservationController.js.map