import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllEventParticipants = async (req: Request, res: Response) => {
  try {
    const eventParticipants = await prisma.eventParticipant.findMany();
    res.json(eventParticipants);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getEventParticipantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventParticipant = await prisma.eventParticipant.findUnique({ where: { id } });
    if (!eventParticipant) return res.status(404).json({ error: "EventParticipant non trouvé" });
    res.json(eventParticipant);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createEventParticipant = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newEventParticipant = await prisma.eventParticipant.create({ data });
    res.status(201).json(newEventParticipant);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateEventParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedEventParticipant = await prisma.eventParticipant.update({ where: { id }, data });
    res.json(updatedEventParticipant);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteEventParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.eventParticipant.delete({ where: { id } });
    res.json({ message: "EventParticipant supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};