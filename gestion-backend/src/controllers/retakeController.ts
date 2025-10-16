import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllRetakes = async (req: Request, res: Response) => {
  try {
    const retakes = await prisma.retake.findMany();
    res.json(retakes);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getRetakeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const retake = await prisma.retake.findUnique({ where: { id } });
    if (!retake) return res.status(404).json({ error: "Retake non trouvé" });
    res.json(retake);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createRetake = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newRetake = await prisma.retake.create({ data });
    res.status(201).json(newRetake);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateRetake = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedRetake = await prisma.retake.update({ where: { id }, data });
    res.json(updatedRetake);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteRetake = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.retake.delete({ where: { id } });
    res.json({ message: "Retake supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};