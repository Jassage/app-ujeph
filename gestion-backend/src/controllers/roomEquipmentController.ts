import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllRoomEquipments = async (req: Request, res: Response) => {
  try {
    const roomEquipments = await prisma.roomEquipment.findMany();
    res.json(roomEquipments);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getRoomEquipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roomEquipment = await prisma.roomEquipment.findUnique({ where: { id } });
    if (!roomEquipment) return res.status(404).json({ error: "RoomEquipment non trouvé" });
    res.json(roomEquipment);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createRoomEquipment = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newRoomEquipment = await prisma.roomEquipment.create({ data });
    res.status(201).json(newRoomEquipment);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateRoomEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedRoomEquipment = await prisma.roomEquipment.update({ where: { id }, data });
    res.json(updatedRoomEquipment);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteRoomEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.roomEquipment.delete({ where: { id } });
    res.json({ message: "RoomEquipment supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};