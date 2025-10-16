import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return res.status(404).json({ error: "Message non trouvé" });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newMessage = await prisma.message.create({ data });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedMessage = await prisma.message.update({ where: { id }, data });
    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.message.delete({ where: { id } });
    res.json({ message: "Message supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};