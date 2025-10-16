import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany();
    res.json(payments);
    
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: "Payment non trouvé" });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newPayment = await prisma.payment.create({ data });
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedPayment = await prisma.payment.update({ where: { id }, data });
    res.json(updatedPayment);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.payment.delete({ where: { id } });
    res.json({ message: "Payment supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};