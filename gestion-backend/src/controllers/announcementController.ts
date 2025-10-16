import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement)
      return res.status(404).json({ error: "Announcement non trouvé" });
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newAnnouncement = await prisma.announcement.create({ data });
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data,
    });
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    res.json({ message: "Announcement supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};
