import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllMessageAttachments = async (req: Request, res: Response) => {
  try {
    const messageAttachments = await prisma.messageAttachment.findMany();
    res.json(messageAttachments);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getMessageAttachmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messageAttachment = await prisma.messageAttachment.findUnique({ where: { id } });
    if (!messageAttachment) return res.status(404).json({ error: "MessageAttachment non trouvé" });
    res.json(messageAttachment);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createMessageAttachment = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newMessageAttachment = await prisma.messageAttachment.create({ data });
    res.status(201).json(newMessageAttachment);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateMessageAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedMessageAttachment = await prisma.messageAttachment.update({ where: { id }, data });
    res.json(updatedMessageAttachment);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteMessageAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.messageAttachment.delete({ where: { id } });
    res.json({ message: "MessageAttachment supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};